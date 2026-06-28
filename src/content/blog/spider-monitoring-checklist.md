---
title: "Don't Trust a Spider You Can't Monitor"
description: "A scheduled spider with no monitors is a liability waiting to happen. Here's the full checklist of what every spider monitor should actually assert — and how to wire it up with Spidermon."
pubDate: 2026-06-24
tags: ["spidermon", "monitoring", "data-quality"]
draft: false
---

A spider that runs unattended on a schedule and has no monitors isn't "automated" — it's a liability with a cron entry. It will break eventually (the target *will* change), and without monitors you find out from a confused stakeholder weeks later, not from an alert minutes after the run.

I covered the broad philosophy in [Scrapers Don't Crash — They Lie](/blog/self-healing-scraping-pipelines/). This post is the practical companion: the specific monitors I put on every production crawl, what each one catches, and how to wire them with [Spidermon](https://spidermon.readthedocs.io/).

## The principle: assert on outputs, not just exit codes

The trap is monitoring whether the process *ran*. That tells you almost nothing — a broken spider runs fine and produces garbage. Monitor the **shape of the output** and the **behaviour of the crawl**. Every check below is something I've watched silently break a real pipeline.

## The checklist

### 1. Item volume (coverage)
The single most important check. Did this run produce roughly the number of items you expect? A crawl that suddenly yields 60% of its usual count has almost certainly broken a selector or hit a block.

```python
from spidermon import Monitor, MonitorSuite, monitors
from spidermon.contrib.scrapy.monitors import BaseStatMonitor

@monitors.name("Item count")
class ItemCountMonitor(BaseStatMonitor):
    stat_name = "item_scraped_count"
    assert_type = ">="
    threshold = 15000
```

Hard thresholds are a fine start, but the real win is asserting against a **rolling baseline** from history — which is exactly what [storing every run's stats](/blog/store-every-spider-stat/) buys you.

### 2. Field fill rate (per-field completeness)
Total count can look healthy while one critical field quietly goes empty. Track the fill rate of the fields that matter and alert when, say, `price` drops below 95% populated:

```python
@monitors.name("Price fill rate")
class PriceFillMonitor(Monitor):
    def test_price_coverage(self):
        stats = self.data.stats
        scraped = stats.get("item_scraped_count", 0)
        missing = stats.get("field/missing/price", 0)
        fill = 1 - (missing / scraped) if scraped else 0
        self.assertGreaterEqual(fill, 0.95, f"price fill only {fill:.0%}")
```

(Increment `field/missing/price` from your validation pipeline whenever the field is empty.)

### 3. Validation-failure ratio
If you validate items (you should), watch the ratio of dropped-to-scraped. A spike means the page structure shifted under you.

### 4. Duplicate ratio
A climbing duplicate rate usually means pagination broke or the dedup key changed — the spider loops or re-yields the same rows.

### 5. Error and retry rate
Exceptions and retries per request. A jump in `retry/count` or `downloader/exception_count` is an early warning that the target is degrading or starting to push back.

### 6. HTTP status distribution
Watch the response-status counts. A sudden bloom of `403`/`429`/`503` is the classic signature of getting blocked — often *before* item count drops enough to trip check #1.

```python
@monitors.name("Block signals")
class BlockMonitor(Monitor):
    def test_no_ban_spike(self):
        s = self.data.stats
        bans = s.get("downloader/response_status_count/403", 0) \
             + s.get("downloader/response_status_count/429", 0)
        self.assertLess(bans, 50, f"{bans} block responses this run")
```

### 7. Finish reason
Scrapy records *why* a crawl ended. `finished` is good; `closespider_timeout`, `memusage_exceeded`, or `cancelled` mean the run was cut short and your data is incomplete — even if every other number looks fine.

```python
def test_finish_reason(self):
    reason = self.data.stats.get("finish_reason")
    self.assertEqual(reason, "finished", f"ended as: {reason}")
```

### 8. Duration / throughput drift
How long the crawl took and its items-per-minute. A run that's steadily getting slower signals trouble — a growing target, rising retries, or a leak — long before it actually fails.

### 9. Anti-bot / CAPTCHA signals
If you track CAPTCHA hits or proxy bans as custom stats, monitor them. A rising CAPTCHA rate is the target telling you your stealth is slipping.

### 10. Data sanity / drift
Cheap assertions that catch absurd output: prices all zero, dates in the future, a numeric field suddenly full of text. These catch the "technically populated but wrong" failures that fill-rate checks miss.

## Wire it to where you'll see it

A monitor that logs to a file nobody reads is theatre. Run the suite on `spider_closed` and route failures to Slack or email:

```python
# settings.py
SPIDERMON_ENABLED = True
SPIDERMON_SPIDER_CLOSE_MONITORS = ("myproject.monitors.SpiderCloseMonitorSuite",)

class SpiderCloseMonitorSuite(MonitorSuite):
    monitors = [ItemCountMonitor, PriceFillMonitor, BlockMonitor]
    monitors_failed_actions = [SendSlackMessageSpiderFinished]
```

## Set thresholds from history, not vibes

The hardest part of monitoring isn't the checks — it's the numbers. A fixed `threshold = 15000` is brittle: too low and it never fires, too high and it cries wolf. The fix is to compute thresholds from past runs (e.g. "alert if this run is >2σ below the 30-day average"). That requires keeping your stats around — which is the whole argument of the next post, [One Run Tells You Nothing](/blog/store-every-spider-stat/).

Get these monitors in place and a broken crawl pages you within minutes of finishing — which is the entire difference between a spider you babysit and one you can actually trust to run on its own.
