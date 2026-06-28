---
title: "One Spider Isn't Enough"
description: "When one spider stops being enough — how Redis-backed queues turn a single crawler into a fleet, and the knobs that actually matter once you do."
pubDate: 2026-04-15
tags: ["scrapy", "distributed", "redis"]
draft: false
---

A single Scrapy process is shockingly capable. With tuned concurrency and AutoThrottle it'll happily push tens of thousands of requests an hour against a forgiving target. For a long time, "scaling" just means turning a few dials on one box.

Then you hit a wall that no amount of tuning fixes: the crawl can't finish inside its window, you need more egress IPs than one machine can sanely rotate, or you simply can't afford a single point of failure halfway through a multi-day job. That's when it's time to go distributed.

## When one machine is actually the bottleneck

Before reaching for more machines, be honest about *what* is saturated. Most "slow" crawls aren't CPU- or even bandwidth-bound — they're bound by politeness limits and latency. Adding workers won't help if the real constraint is "the target 429s us above 2 requests/second."

I go distributed when at least one of these is true:

- The work won't finish in its window even at safe per-domain rates, because there are **many** domains to spread across.
- I need to **fan out across egress IPs** and want shared, deduplicated state so workers don't re-crawl each other's URLs.
- I want workers to **fail and restart** without losing the queue or re-doing finished work.

> Rule of thumb: if losing a worker mid-run means re-crawling from scratch, your state lives in the wrong place.

## The shape that works: a shared queue

The cleanest pattern is a **Redis-backed request queue** with a shared dedup set, using [`scrapy-redis`](https://github.com/rmax/scrapy-redis). Every worker pulls from the same queue and writes seen-fingerprints to the same set. Add workers to go faster; kill one and the rest carry on.

```python
# settings.py
SCHEDULER = "scrapy_redis.scheduler.Scheduler"
DUPEFILTER_CLASS = "scrapy_redis.dupefilter.RFPDupeFilter"
SCHEDULER_PERSIST = True          # keep the queue across restarts
SCHEDULER_QUEUE_CLASS = "scrapy_redis.queue.PriorityQueue"
REDIS_URL = "redis://queue-host:6379/0"
```

Your spider reads its start requests from Redis instead of a hardcoded list, which lets you seed the crawl from anywhere — another process, a cron job, an API:

```python
from scrapy_redis.spiders import RedisSpider

class ListingsSpider(RedisSpider):
    name = "listings"
    redis_key = "listings:start_urls"
```

Seed it once and every worker starts draining the same queue:

```bash
redis-cli LPUSH listings:start_urls "https://example.com/page/1"
```

## The knobs that actually matter

Going distributed shifts where your limits live. A few things I always tune:

**Per-domain concurrency, not global.** With N workers all hitting the same domain, your *effective* request rate is N × per-worker rate. The target doesn't care how many machines you have. Set `CONCURRENT_REQUESTS_PER_DOMAIN` conservatively and lean on AutoThrottle to find the real ceiling:

```python
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
CONCURRENT_REQUESTS_PER_DOMAIN = 4
DOWNLOAD_DELAY = 0.5
```

**Memory profile per worker.** Long-running jobs leak if you're not careful — keep an eye on queue depth and response sizes. Stream large responses, don't accumulate items in memory, and let the pipeline flush in batches.

**Dedup persistence.** `SCHEDULER_PERSIST = True` is what makes restarts cheap. Without it, a redeploy wipes the fingerprint set and your fleet happily re-crawls everything.

**Idempotent items.** Workers die mid-write. Design your item pipeline so a re-processed item upserts rather than duplicates — usually a unique key plus an `ON CONFLICT` update.

## Deployment

I keep deployment boring on purpose. Each worker is the same container image; the only difference is that they all point at the same `REDIS_URL`. Scaling up is `replicas: 8` instead of `4`. I've run this with Scrapyd, Scrapy Cloud, and plain Docker/Kubernetes — the orchestration layer barely matters once the queue is the source of truth.

The mental model that keeps this simple: **the workers are stateless and disposable; the queue and the dedup set are the only things that matter.** Get that boundary right and "scaling" becomes a number you change, not an architecture you rewrite.
