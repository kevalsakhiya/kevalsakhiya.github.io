---
title: "Don't Take the Bait"
description: "Not all anti-bot defence tries to block you — some invites you in, then wastes, flags, or poisons your crawl. A field guide to the traps sites set for spiders, and how not to walk into them."
pubDate: 2025-11-19
tags: ["anti-bot", "honeypots", "crawling"]
draft: false
---

Most anti-bot writing is about defences that say **no** — the 403s, the fingerprint checks, the CAPTCHAs I've covered [elsewhere](/blog/spider-vs-403/). But there's a sneakier category that says **yes**: traps that happily let your spider in, then waste its time, mark it as a bot, or — worst of all — feed it fake data and let it "succeed."

The dangerous traps aren't the ones that stop you. They're the ones that let you finish a crawl that was never real. Here's the field guide.

## Honeypot links

The classic. A link that's invisible to humans — `display:none`, `visibility:hidden`, zero-size, or positioned off-screen — but sits right there in the HTML. No real user ever clicks it. A naive crawler that follows every `<a href>` walks straight into it, and now the site knows exactly what you are.

**How not to bite:** don't blindly follow every link. Skip anchors hidden by inline styles or telltale classes, and prefer following the specific, *expected* links your parser targets over a greedy "extract all hrefs."

## Hidden form fields

The same trick, applied to forms. An extra input — often named something tempting like `email` or `url` — rendered invisible. A human leaves it blank because they never see it. Automated form-fillers populate every field they find, and filling that one is a confession.

**How not to bite:** when you must submit forms, submit only the fields a real browser would; leave hidden honeypot fields untouched (which usually means: empty).

## Spider traps (infinite spaces)

Some traps don't flag you — they just never end. The web is full of effectively infinite URL spaces, and sites can weaponise them:

- **Calendars** with a "next month" link that goes on forever.
- **Faceted navigation** where every combination of filters is its own URL — a combinatorial explosion that balloons into millions of near-duplicate pages.
- **Infinite pagination** that keeps serving "page N+1" with the same recycled content.

Your spider doesn't crash. It just crawls, and crawls, burning time and budget on pages that lead nowhere.

**How not to bite:** bound the crawl. Cap depth, constrain which URL patterns you'll follow, and dedup aggressively so recycled content doesn't keep you busy.

```python
# settings.py
DEPTH_LIMIT = 6                       # don't fall down infinite holes
# In the spider, only follow URLs that match what you actually want:
ALLOWED = re.compile(r"/listing/\d+")
```

## Tarpits

A tarpit doesn't block you — it *slows you to death*. The server drip-feeds bytes, holds the connection open, or responds just slowly enough to tie up your concurrency without tripping a timeout. Fire enough requests into a tarpit and your whole crawl grinds, because your workers are all stuck waiting.

**How not to bite:** set aggressive, sane timeouts, cap per-domain concurrency so one slow host can't starve the pool, and treat suspiciously slow responses as a signal worth logging.

## robots.txt bait

A quieter one: a path listed under `Disallow` in `robots.txt` that exists *only* to catch crawlers which ignore robots. A well-behaved client never requests it. A bot scraping everything trips a wire it was explicitly told not to touch — and announces its bad manners in the process.

**How not to bite:** respect `robots.txt`. Beyond being the ethical default, it keeps you out of paths laid specifically to catch rule-ignorers.

```python
ROBOTSTXT_OBEY = True
```

## Data poisoning (the silent one)

This is the trap that scares me, because it doesn't flag you, slow you, or stop you — it lets you win, with garbage. A site that suspects a bot can serve **subtly fake data**: shuffled prices, fabricated rows, plausible-but-wrong fields. The crawl finishes green, the item count looks healthy, and you ship a dataset that's quietly poisoned.

If that sounds familiar, it's the same shape as the bug in ["The Website Wasn't Lying. I Was."](/blog/the-website-wasnt-lying/) — except here the wrong data is *intentional*, not your own mistake. Either way, the lesson is identical: **a crawl finishing successfully tells you nothing about whether the data is real.**

**How not to bite:** you can't always detect poisoning, but you can make it loud. Sanity-check values against expectations, watch for distributions that suddenly look off, spot-verify samples against the live site, and lean on the [coverage and validation monitors](/blog/self-healing-scraping-pipelines/) that catch "technically populated but wrong." Poisoned data and a broken selector look the same to your pipeline — both are caught by the same vigilance.

## The throughline

Every trap here exploits the same weakness: a spider that behaves *too eagerly* and *too trustingly*. It follows every link, fills every field, crawls every URL, and believes every response.

The defence isn't cleverness — it's restraint and skepticism:

- Follow only the links you *meant* to follow.
- Bound depth, breadth, and URL patterns so infinite spaces can't swallow you.
- Respect `robots.txt` and visibility cues — they keep you out of bait *and* keep you ethical.
- Never assume a finished crawl is a correct one. Verify.

A greedy spider takes every piece of bait the web offers it. A good one is picky about what it bites — which, conveniently, is also what keeps it from getting caught.
