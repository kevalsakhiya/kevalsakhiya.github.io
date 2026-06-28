---
title: "Why Your Scraper Keeps Getting Blocked"
description: "Modern bot detection isn't one wall — it's layers, from IP reputation to TLS fingerprints to behaviour. Here's how I think about each layer and stay under the radar."
pubDate: 2026-05-06
tags: ["anti-bot", "proxies", "fingerprinting"]
draft: false
---

The single most common reason a scraping project stalls isn't parsing — it's getting blocked. And the mistake I see most often is treating anti-bot as one problem with one fix ("just add proxies"). It isn't. Modern detection is a stack of independent checks, and you only get through if you're consistent across **all** of them.

Here's the stack, roughly in the order a request gets evaluated.

## Layer 1 — IP reputation

The first thing a target sees is where you're coming from. Datacenter IP ranges are trivially flagged; a thousand requests from one AWS block is a giveaway.

- **Datacenter proxies** are cheap and fast — fine for lenient targets and high-volume, low-sensitivity work.
- **Residential / mobile proxies** look like real users and are what you need for hardened targets. They're slower and pricier, so I reserve them for the sites that actually warrant it.

Rotation matters as much as the pool. Rotating *per request* on a site that ties a session to an IP will get you flagged faster than not rotating at all. Match rotation to how the target models a "user."

## Layer 2 — the TLS handshake (JA3)

This is the layer most scrapers never think about, and it's where a lot of "but my headers are perfect!" crawls die. Before a single HTTP header is sent, your TLS client hello has a **fingerprint** — the cipher suites, extensions, and curves you advertise, hashed into a JA3 signature. Python's `requests` and stock `urllib` have fingerprints that scream "automation."

The fix is to make your TLS fingerprint match a real browser. Libraries like `curl_cffi` impersonate Chrome's handshake:

```python
from curl_cffi import requests

# Presents Chrome's real TLS/JA3 fingerprint, not Python's
resp = requests.get("https://example.com", impersonate="chrome")
```

If your IP looks residential but your TLS handshake looks like Python, you've already lost.

## Layer 3 — HTTP headers (and their order)

Real browsers send a specific set of headers, with specific values, **in a specific order**. A bare `User-Agent` with nothing else is a tell. So is a header order that doesn't match the UA you're claiming.

- Send the full, coherent set: `User-Agent`, `Accept`, `Accept-Language`, `Accept-Encoding`, `Sec-Fetch-*`, etc.
- Keep them **consistent with each other** — a Chrome UA with Firefox's `Accept` ordering is incoherent.
- Rotate UA and the matching header set together, not independently.

## Layer 4 — browser fingerprinting

For JavaScript-heavy or session-protected targets, you'll end up in a real (headless) browser. Now the detection moves client-side: canvas/WebGL fingerprints, `navigator.webdriver`, plugin and font enumeration, timing.

I reach for `scrapy-playwright` when a target needs a browser, with stealth patches to mask the obvious automation signals:

```python
# settings.py
DOWNLOAD_HANDLERS = {
    "https": "scrapy_playwright.handler.ScrapyPlaywrightDownloadHandler",
}
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
```

Headless is heavy, so I treat it as a fallback, not a default — most pages don't need it, and every page you render in a browser costs you throughput.

## Layer 5 — behaviour and rate

Even with everything above perfect, a client that requests 50 pages a second with millisecond-precise intervals doesn't behave like a human. Jitter your delays, respect per-domain concurrency, and let AutoThrottle adapt to the server's responses instead of hammering a fixed rate.

CAPTCHAs sit at the end of this chain — they're what you get *after* something upstream flagged you. Solving services (2Captcha, Anti-Captcha) work, but a CAPTCHA appearing is usually a signal that an earlier layer needs fixing, not that you need a solver.

## The real lesson: consistency over cleverness

No single trick beats a good anti-bot system. What beats it is a request that is **coherent at every layer** — residential IP *and* browser-matched TLS *and* consistent headers *and* human-like pacing. The moment one layer contradicts the others, you're flagged.

A note on responsibility: I scrape **public** data, honour rate limits and a site's stated terms, and never go after anything behind authentication I'm not permitted to access. Staying under the radar is about being a polite, well-behaved client at scale — not about breaking in.
