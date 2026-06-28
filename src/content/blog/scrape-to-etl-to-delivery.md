---
title: "Anyone Can Write a Spider"
description: "Scraping is step one. The value is in turning raw, messy crawl output into clean, monitored, model-ready data that lands where it's needed — on a schedule, reliably."
pubDate: 2024-08-14
tags: ["etl", "airflow", "pyspark", "fastapi"]
draft: false
---

Plenty of people can write a spider. Far fewer can take what that spider produces and turn it into something a business actually consumes — clean, deduplicated, refreshed on a schedule, and delivered through an interface the consumer trusts. That gap, from *raw crawl output* to *delivered data product*, is where most of the real engineering lives.

I think of it as one pipeline with three responsibilities: **crawl → transform → deliver.** Here's how I wire each stage so the whole thing runs unattended.

## Stage 1 — crawl produces raw, not final

The crawler's job is narrow on purpose: fetch and extract, then hand off. I resist the temptation to do heavy cleaning inside the spider — it couples extraction to business logic and makes both harder to change. The spider writes **raw extracted items** to a landing area (object storage or a raw table), tagged with a run ID and timestamp.

Keeping raw data immutable pays off constantly: when a transform has a bug, I re-run the transform against the stored raw output instead of re-crawling the target. Re-crawling is expensive and rude; re-transforming is free.

## Stage 2 — transform at whatever scale the data demands

This is where raw becomes usable: type coercion, deduplication, normalisation, joins against reference data, feature derivation. For modest volumes, Pandas is plenty. Once a run is millions of rows, I move the transform to **PySpark** so it scales horizontally instead of melting one machine's memory:

```python
from pyspark.sql import functions as F

clean = (
    raw.dropDuplicates(["listing_id"])
       .withColumn("price", F.regexp_replace("price", r"[^0-9.]", "").cast("double"))
       .filter(F.col("price").isNotNull())
       .withColumn("scraped_date", F.to_date("scraped_at"))
)
```

The output of this stage is the thing people actually want: a clean, well-typed, deduplicated dataset — often shaped directly into a feature store or analytics table.

## Stage 3 — deliver through a stable interface

Data nobody can reach isn't a product. Depending on the consumer, delivery looks like a warehouse table, a file drop to S3, or — most often for me — a **REST API** that hides all the pipeline machinery behind a clean contract:

```python
from fastapi import FastAPI, Query

app = FastAPI()

@app.get("/listings")
def listings(min_price: float = 0, limit: int = Query(100, le=1000)):
    return query_clean_listings(min_price=min_price, limit=limit)
```

The consumer sees a stable endpoint. They never know — or care — that behind it sits a distributed crawl, a Spark job, and a dedup pass.

## The glue: orchestration

What turns three scripts into a *pipeline* is orchestration. I run the stages as a DAG in **Apache Airflow**, so dependencies, retries, logging, and scheduling are declarative rather than a pile of cron jobs and hope:

```python
crawl >> transform >> publish >> notify
```

Airflow gives me the things that make a pipeline trustworthy: a failed transform retries with backoff, every run is logged and inspectable, and a stage that fails outright pages me instead of silently leaving stale data in place. Tie that to the monitoring from the [self-healing pipelines](/blog/self-healing-scraping-pipelines/) side and the whole path becomes observable end to end.

## Why owning the whole path matters

When one person owns crawl-through-delivery, things that fall through the cracks in a hand-off simply don't. The schema the API exposes is designed with how the data is scraped in mind. A target change that breaks extraction surfaces as a coverage alert, not a confused downstream consumer two weeks later. And re-delivering corrected data is a transform re-run, not a fire drill.

That end-to-end ownership — **messy public web in, clean model-ready data out, on a schedule, monitored** — is the actual deliverable. The spider is just where it starts.
