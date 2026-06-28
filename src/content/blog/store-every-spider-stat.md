---
title: "One Run Tells You Nothing"
description: "A single crawl's stats look fine in isolation — the signal is in the trend across runs. Why I persist every stat from every scheduled spider, and what that history unlocks."
pubDate: 2025-01-22
tags: ["scrapy", "monitoring", "observability"]
draft: false
---

Here's a number: your spider scraped 14,200 items last night. Is that good or bad?

You can't answer that. Not from one run. If it averages 14,000, it's a healthy night. If it averages 22,000, something just broke and you should be paged. **The number is meaningless without history** — and yet most scraping setups throw that history away the moment the process exits.

Scrapy hands you a rich stats dictionary at the end of every crawl. Keeping it is nearly free. Throwing it away is one of the most common, and most quietly expensive, mistakes I see in scheduled scraping.

## What you're discarding

At `spider_closed`, Scrapy's stats collector holds dozens of useful numbers:

- `item_scraped_count`, `item_dropped_count`
- `response_received_count` and the full `downloader/response_status_count/*` breakdown
- `retry/count`, `downloader/exception_count`
- `elapsed_time_seconds`, `finish_reason`
- `memusage/max`
- plus any custom stats you increment yourself

Every one of these is a data point on a time series you're not recording.

## Why one run is useless on its own

Almost every meaningful question about a crawl is **comparative**:

- Is item count down? *Compared to what?*
- Is the run slower? *Than when?*
- Did errors spike? *Relative to the baseline?*

Without stored history, every alert threshold is a guess and every investigation starts from zero. With it, the spider's own past becomes the baseline — and most problems show up as a *deviation* long before they become a *failure*.

## What the history unlocks

**Catching slow degradation.** The scary failures aren't the sudden ones — those trip any monitor. It's the selector that rots gradually: 100% fill, then 98%, then 95%, over three weeks. No single run looks alarming. The *trend* is obvious the moment you can plot it.

**Dynamic thresholds.** This is the big one, and it closes the loop with [your monitors](/blog/spider-monitoring-checklist/). Instead of a brittle `threshold = 15000`, you assert against the rolling average: "alert if this run is more than 2σ below the last 30 days." Thresholds that calibrate themselves don't cry wolf and don't sleep through real drops.

**Forensics.** When someone asks "why did Tuesday's data look off?", stored stats answer it in one query — Tuesday had a retry spike and finished on `closespider_timeout`. Without history, that's an unanswerable shrug.

**Capacity and cost planning.** Duration creeping up run over run tells you when you'll blow your window. Response counts map directly to proxy spend. Memory trends warn you before a worker starts OOM-ing.

**Reporting.** "99.4% coverage, 12-month uptime" is a sentence you can only write if you kept the numbers.

## How to keep them (it's tiny)

Hook `spider_closed` and write the whole stats dict to a table — one row per run, with a run ID, spider name, and timestamp:

```python
from scrapy import signals

class StatsHistoryExtension:
    @classmethod
    def from_crawler(cls, crawler):
        ext = cls()
        crawler.signals.connect(ext.spider_closed, signal=signals.spider_closed)
        return ext

    def spider_closed(self, spider):
        stats = spider.crawler.stats.get_stats()
        db.execute(
            "INSERT INTO crawl_stats (spider, run_at, stats) VALUES (%s, now(), %s)",
            (spider.name, json.dumps(stats, default=str)),
        )
```

A single `JSONB` column (on Postgres) is the path of least resistance — store the entire dict and decide what matters later. If you already run a metrics stack, push the same numbers to a time-series DB instead and get dashboards for free. Either way, enable it in settings:

```python
EXTENSIONS = {"myproject.extensions.StatsHistoryExtension": 500}
```

## Store everything; decide later

The instinct is to cherry-pick "the important stats." Resist it. The stats dict is kilobytes — storing all of it for years costs almost nothing, and the field you didn't think you'd need is exactly the one you'll want during the next incident. Disk is cheap; a blind spot during an outage is not.

> A single run tells you nothing. A thousand runs tell you everything — but only if you kept them.

Pair this with [a good set of monitors](/blog/spider-monitoring-checklist/) and your crawls stop being black boxes that occasionally surprise you, and become systems whose behaviour you can actually see, trust, and reason about over time.
