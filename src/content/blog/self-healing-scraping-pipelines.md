---
title: "Building Self-Healing Scraping Pipelines"
description: "Scrapers don't fail loudly — they fail silently, returning fewer or subtly wrong rows. Here's how I build pipelines that validate, repair, and alert instead of quietly rotting."
pubDate: 2026-05-27
tags: ["data-quality", "spidermon", "etl"]
draft: false
---

The dangerous thing about a broken scraper is that it usually doesn't crash. The site changes a class name, a selector silently returns `None`, and your crawl keeps running — happily writing thousands of rows with an empty `price` field. Nobody notices until a downstream model or report looks wrong weeks later.

A production scraper has to assume the target *will* change under it. The goal isn't to prevent breakage — it's to **catch it the moment it happens** and, where possible, repair it without a human in the loop.

## Validate every item before it's stored

The first line of defence is an item pipeline that refuses to store garbage. I validate against a schema and route failures somewhere visible instead of silently dropping or persisting them:

```python
from itemadapter import ItemAdapter

class ValidationPipeline:
    REQUIRED = ("listing_id", "price", "address")

    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        missing = [f for f in self.REQUIRED if not adapter.get(f)]
        if missing:
            spider.crawler.stats.inc_value(f"validation/missing_fields")
            raise DropItem(f"missing {missing} on {adapter.get('url')}")
        adapter["price"] = self._normalize_price(adapter["price"])
        return item
```

The key move is incrementing a **stat** on every failure. Those counters are what monitoring watches — a crawl that suddenly drops 40% of its items is a louder signal than any log line.

## Dedup and normalise on the way in

Most "data quality" problems are really consistency problems: the same listing scraped twice with slightly different formatting, prices as `"$1,200"` vs `1200.0`, whitespace and casing drift. I normalise aggressively in the pipeline and dedup on a stable business key so re-runs upsert rather than pile up:

```sql
INSERT INTO listings (listing_id, price, address, scraped_at)
VALUES (%s, %s, %s, now())
ON CONFLICT (listing_id)
DO UPDATE SET price = EXCLUDED.price,
              address = EXCLUDED.address,
              scraped_at = EXCLUDED.scraped_at;
```

## Repair mid-run instead of failing the row

"Self-healing" is the part people skip. When a primary selector fails, the pipeline doesn't have to give up — it can try a fallback path before declaring the row bad:

- **Fallback selectors.** If the main CSS path returns nothing, try a secondary one (a JSON-LD block, a `data-*` attribute, an embedded `__NEXT_DATA__` payload). Sites often expose the same field three different ways.
- **Targeted re-fetch.** A transient empty response gets re-queued once with backoff before it counts as a real failure — distinguishing "the site hiccuped" from "the site changed."
- **Quarantine, don't discard.** Rows that fail every path go to a dead-letter table with their raw HTML attached, so a fix is a re-parse, not a re-crawl.

This is what lets a weekly run deliver clean output with **zero manual cleanup between runs** — the pipeline absorbs the small breakages that would otherwise accumulate.

## Monitor coverage, not just errors

The metric that actually predicts data quality is **coverage**: did this run produce roughly what we expected? I use [Spidermon](https://spidermon.readthedocs.io/) to assert on the finished crawl and alert when reality drifts from expectation:

```python
from spidermon import Monitor, monitors
from spidermon.contrib.scrapy.monitors import BaseStatMonitor

@monitors.name("Coverage")
class CoverageMonitor(BaseStatMonitor):
    stat_name = "item_scraped_count"
    threshold = 15000          # expect at least this many per run
    assert_type = ">="
```

Pair that with checks on the validation-failure ratio and the field-fill rate, wire the failures to Slack or email, and a broken selector pages you within minutes of the run — not weeks later when someone notices the numbers look off.

## The mindset

Treat the scraper like any other production service that talks to an unreliable dependency — because that's exactly what it is. **Validate at the boundary, normalise relentlessly, repair what you can, quarantine what you can't, and alert on coverage.** Do that and a crawl that used to need babysitting becomes one you can trust to run unattended.
