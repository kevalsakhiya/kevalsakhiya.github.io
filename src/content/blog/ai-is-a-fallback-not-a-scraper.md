---
title: "AI Is a Fallback, Not a Scraper"
description: "Using an LLM to scrape every page is slow, expensive, and quietly unreliable. Used as a self-healing fallback that repairs broken selectors and caches the fix, it's genuinely useful. Here's the line between the two."
pubDate: 2026-06-16
tags: ["ai", "llm", "self-healing"]
draft: false
---

There's a tempting pitch going around: point an LLM at a page, ask for the data, done — no more brittle selectors, no more maintenance. It demos beautifully. It also falls apart the moment you run it at real volume.

I do use AI in my scraping. Just not like that. The rule I've landed on: **the LLM belongs in the fallback path, not the hot path.** Get that boundary right and AI becomes a genuinely useful self-healing layer. Get it wrong and you've built something slow, expensive, and quietly dishonest.

## Why the LLM can't live in the hot path

Run an LLM on every page and you inherit four problems at once:

- **Cost.** At 100k+ pages a day, a model call per page is a serious recurring bill — for a job that fast, cheap CSS selectors already do.
- **Latency.** An API round-trip per item turns a crawl that flies into one that crawls. (Same lesson as [doing the math myself](/blog/the-browser-was-doing-math/) — don't put an expensive operation in the per-item loop.)
- **Non-determinism.** The same page can yield slightly different output run to run. Selectors are boring and repeatable; that's a feature.
- **Hallucination.** This is the dangerous one. An LLM asked for a price it can't find will often *invent a plausible one* rather than say "not there." Your crawl finishes green, full of confident garbage — exactly the silent-wrong-data failure from ["Scrapers Don't Crash — They Lie"](/blog/self-healing-scraping-pipelines/).

Cheap, deterministic selectors should always be your primary extractor. AI earns its keep only when they *break*.

## The pattern: AI repairs, then gets out of the way

Here's the move that makes AI economical and safe: **when a selector breaks, don't ask the LLM for the value — ask it for a new selector.** A selector is a deterministic, reusable, verifiable artifact. You call the model *once* per breakage, validate what it gives you, cache it, and go back to running fast, free CSS for every subsequent item.

```python
def extract_field(response, field):
    sel = selector_cache.get(field)
    value = response.css(sel).get() if sel else None
    if value and is_valid(field, value):
        return value                      # hot path: cheap, deterministic

    # selector broke — fall back to the LLM, exactly once
    new_sel = ask_llm_for_selector(response.text, field)
    value = response.css(new_sel).get()
    if value and is_valid(field, value):  # verify it actually works
        selector_cache.set(field, new_sel)   # cache the repair
        alert(f"selector for '{field}' self-healed → {new_sel}")
        return value

    quarantine(response, field)           # never ship a guess
    return None
```

Three things make this work:

1. **You verify the AI's selector against the real page** before trusting it — if the proposed selector extracts nothing valid, it's rejected. The page is the ground truth, not the model.
2. **You cache the repair**, so a site change costs you one LLM call, not one per item. The crawl heals once and resumes at full speed.
3. **You alert on the heal.** A self-healing selector is great, but you still want to know it happened — silent "magic" hides the fact that the target changed.

## Smart extraction, used sparingly

The other place AI genuinely helps is **genuinely unstructured** fields — a free-text address that needs splitting into components, a messy description you want as structured JSON, values no selector can cleanly isolate. Rules choke on these; an LLM is good at them.

But the same discipline applies: do it on the field that *needs* it, not the whole page; constrain the output to a schema; and **validate the result** before it's stored. AI structuring a messy blob is fine. AI free-handing your entire dataset is not.

## The guardrail that ties it all together

Everything above rests on one non-negotiable: **never trust AI output unverified.** An LLM's failure mode isn't an error — it's a confident wrong answer. Left unchecked, that's indistinguishable from the [data-poisoning trap](/blog/dont-take-the-bait/), except you did it to yourself.

So every AI-produced value runs the same gauntlet as any other item:

- Schema validation — types, ranges, required fields.
- Sanity checks — does this price/date/count look real?
- Coverage monitoring — if the "self-healing" suddenly fires on every page, something bigger broke and the AI is papering over it.

If a value can't be verified, it gets quarantined, not shipped. The AI is allowed to *propose*; your pipeline decides what's *true*.

## Where this leaves AI

Used well, AI doesn't replace your scraper — it makes it resilient. Selectors break and the crawl heals itself instead of paging you at 2am; messy fields get structured without hand-written parsers for every edge case; and you pay for intelligence only at the moments that actually need it.

That's the whole philosophy in one line: **let the selectors do the scraping, and let the AI do the repairs.** Put the model in the hot path and you've built an expensive, unreliable parser. Put it in the fallback path and you've built a scraper that fixes itself — which is a very different, much better thing.
