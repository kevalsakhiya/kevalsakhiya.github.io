---
title: "The Website Wasn't Lying. I Was."
description: "A real-estate crawl that returned data not matching my own filters, a day spent convinced the site was messing with me, and the one-line Scrapy fix once I admitted the bug was mine. First in a Mistakes from the field series."
pubDate: 2025-09-09
tags: ["scrapy", "sessions", "mistakes-from-the-field"]
draft: false
---

*First in a **Mistakes from the field** series — the bugs that taught me more than any tutorial.*

Some bugs crash your spider. Those are the easy ones — they tell you exactly where they live. The bugs that actually hurt are the ones where everything runs perfectly, the spider finishes green, and the data is just… **wrong.** Quietly, plausibly wrong.

This is the story of one of those, and of the day I spent blaming a website for my own mistake.

## The job

I was collecting listings from a real-estate site. Standard stuff — search by criteria, walk the results, extract the fields. I did my usual recon: poked at the pages, found the selectors, traced the request flow, wrote the spider. It ran. It was fast. Scrapy's concurrency meant thousands of pages an hour.

What I'd glossed over during recon was one detail that turned out to be everything: **the site had a strict session requirement.** The results you got back depended on session state the server was tracking — you set your context first, *then* the listing requests returned data scoped to it. I saw it, half-registered it, and moved on. Recon mistake number one.

## The data was wrong

The crawl finished clean. No errors, healthy item count, everything looked great — until I actually looked at the output.

The listings didn't match the criteria I was collecting for. Not garbled, not empty — just *wrong*. Records that had no business being in my result set, missing ones that should have been there. The kind of wrong that's almost worse than a crash, because nothing tells you it happened. If I'd trusted the green checkmark, I'd have shipped a dataset that silently didn't mean what I thought it meant.

## Blaming the website

Here's the part I'm not proud of. My first instinct was: *the site is messing with me.* It must be serving inconsistent results, or A/B testing, or throwing junk at scrapers. I went looking for evidence that the problem was *out there* — anywhere but in my own code.

I burned real hours on that theory. Re-ran crawls, compared outputs, squinted at responses convinced I'd catch the site in the act. I had a suspect, and I'd stopped looking at the actual culprit. Classic — when you've decided who's guilty, you stop investigating.

## The Bug Was Me

The website was returning *exactly* what I asked for. The problem was that **I was asking with the wrong session.**

Scrapy is asynchronous. My requests weren't going out in a tidy line — they were flying concurrently, all sharing **one** session. So the careful sequence I had in my head — *set the context, then fetch the results for that context* — wasn't happening at all. Request A set one context; request B (firing at the same moment) set another; the result requests came back scoped to whatever session state happened to win the race. Every listing was technically a valid response to *a* session — just not the one I thought it belonged to.

I wasn't handling sessions, so async did exactly what async does: it interleaved everything and shredded the one assumption my whole filter logic rested on. The data wasn't lying. It was answering a question I didn't realize I was asking.

That realization landed with a very specific flavour of disappointment — the kind you only feel when the bug is small, obvious in hindsight, and entirely your own.

## The fix

The fix was almost insultingly small. Scrapy can maintain **multiple independent sessions** by tagging requests with a cookiejar key, so each logical flow keeps its own cookies — and therefore its own server-side session — instead of all of them fighting over one:

```python
def start_requests(self):
    for i, query in enumerate(self.queries):
        yield scrapy.Request(
            self.context_url(query),
            meta={"cookiejar": i},          # isolate this flow's session
            callback=self.parse_results,
        )

def parse_results(self, response):
    # Carry the SAME cookiejar through the dependent chain
    yield scrapy.Request(
        self.results_url(response),
        meta={"cookiejar": response.meta["cookiejar"]},
        callback=self.parse_listing,
    )
```

The key part isn't just *using* a cookiejar — it's **threading the same one through every request in a dependent chain** so the context and the results that depend on it stay bound together, no matter how Scrapy schedules them. One isolated session per flow, no more races. Re-ran it, and the data matched the criteria exactly. Every row meant what it was supposed to mean.

## What I actually learned

- **Treat sessions as a first-class part of recon.** "Does this site tie results to session state?" is a question to answer *before* writing the spider, not after the data comes back wrong. I now check it deliberately, every time.
- **Async doesn't preserve your mental model of order.** If a request *depends* on state set by another, you have to bind them explicitly — in Scrapy, that's the cookiejar threaded through the chain. The framework will happily run your dependent requests out of order and never warn you. The session round in [Spider vs 403](/blog/spider-vs-403/) is the same lesson from the detection side.
- **Suspect your own code first.** The website almost certainly isn't out to get you specifically. When the output is wrong but nothing crashed, the bug is usually a wrong assumption of yours — and like all the best-disguised ones, [it won't announce itself](/blog/self-healing-scraping-pipelines/).

The most expensive part of this bug wasn't the fix — it was the hours I spent certain the problem was someone else's. The data was honest the whole time. I just hadn't noticed I was the one asking the wrong question.
