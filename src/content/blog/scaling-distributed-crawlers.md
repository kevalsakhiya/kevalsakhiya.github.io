---
title: "Scaling a Scrapy Crawl Past a Single Machine"
description: "Why Redis-backed request queues are the cleanest way to turn one spider into a fleet — and the knobs that actually matter once you do."
pubDate: 2026-06-20
tags: ["scrapy", "distributed", "redis"]
draft: false
---

A single Scrapy process is shockingly capable. With tuned concurrency and AutoThrottle
it'll happily push tens of thousands of requests an hour. But eventually you hit a wall
that no amount of tuning fixes: one machine, one IP reputation, one point of failure.

This is a placeholder post to show how the blog works. Replace it with your own writing —
just drop a new Markdown file in `src/content/blog/` with the same frontmatter shape.

## When to go distributed

Reach for distributed crawling when **any** of these is true:

- The crawl can't finish inside your run window on one box.
- You need multiple egress IPs and want shared, deduplicated state across them.
- You want workers to fail and restart without losing the queue.

> Rule of thumb: if losing a worker mid-run means re-crawling from scratch, your state
> lives in the wrong place.

## The shape that works

The cleanest pattern is a **Redis-backed request queue** with shared dedup:

```python
# settings.py
SCHEDULER = "scrapy_redis.scheduler.Scheduler"
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"
SCHEDULER_PERSIST = True
REDIS_URL = "redis://queue-host:6379/0"
```

Now every worker pulls from the same queue and writes to the same dedup set. Add workers
to go faster; kill one and the rest carry on.

## The knobs that actually matter

1. **`CONCURRENT_REQUESTS` per worker** — tune per-worker, not globally.
2. **`AutoThrottle`** — let it find the polite ceiling instead of hard-coding delays.
3. **Memory** — long-running jobs leak; profile and cap with `MEMUSAGE_LIMIT_MB`.

That's the skeleton. The hard part — anti-bot, validation, monitoring — is where the real
engineering lives, and what the next posts will cover.
