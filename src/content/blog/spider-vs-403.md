---
title: "Spider vs 403"
description: "Every spider hates 403, and 403 hates every spider. A round-by-round deep dive into the protocol-level tells — headers, header order, TLS, HTTP/2 frames, and session — that decide who wins."
pubDate: 2026-06-28
tags: ["anti-bot", "http2", "fingerprinting"]
draft: false
---

Every spider hates `403 Forbidden`. And `403`, for what it's worth, hates every spider right back. It's the oldest rivalry on the web: one side wants the data, the other side has decided the data is not for *you specifically*.

Here's the thing, though — **403 isn't really the villain. It's the calling card.** The actual adversary is the WAF sitting in front of the site: Cloudflare, Akamai, DataDome. The 403 is just how it says "I know what you are." My [survey of the detection layers](/blog/beating-anti-bot-at-scale/) maps the whole battlefield; this post goes down to the wire, where the fight is actually won or lost — and where most spiders quietly die without ever understanding why.

Let's go round by round. Spider throws a punch; 403 counters.

## Round 1 — Headers

The spider sends a request with a single `User-Agent` claiming to be Chrome. Confident. Naive.

```
GET /data HTTP/2
user-agent: Mozilla/5.0 ... Chrome/120.0.0.0 Safari/537.36
```

403. A real Chrome never sends *just* a UA. It sends a whole coherent set — `Accept`, `Accept-Language`, `Accept-Encoding`, `sec-ch-ua`, `sec-fetch-*`, and friends — with values that all agree with each other. A lone UA with no supporting cast is the first tell.

The spider learns, sends the full set. **Round 1 to the spider.** Barely.

## Round 2 — Header *order*

Same headers, but now 403 looks at the *sequence* they arrive in. Browsers emit headers in a stable, specific order. Most HTTP libraries don't care — they sort them, or use a dict that reorders them, or insert their own in the wrong place.

So you can have a *perfect* set of headers and still get caught because `accept-encoding` showed up before `accept-language` when Chrome would never do that. The values are right; the *fingerprint of their ordering* is wrong.

This one stings because it's invisible — the headers look identical in your logs. **Round 2 to 403.**

## Round 3 — The TLS handshake (JA3)

The spider fixes header order and feels clever. Then 403 does something the spider didn't even know was possible: it judges the connection **before a single HTTP byte is sent.**

The TLS ClientHello — the very first packet — carries a fingerprint: the exact list and order of cipher suites, extensions, elliptic curves, and point formats your client advertises. Hash that and you get a **JA3**. Chrome has a JA3. Firefox has a JA3. Python's `requests` (via OpenSSL) has a JA3 that screams *"I am a script."*

You can have flawless headers in flawless order, and lose here, before HTTP even starts. The fix is to make your TLS stack impersonate a real browser's handshake:

```python
from curl_cffi import requests

# Presents Chrome's actual ClientHello — JA3 and all
resp = requests.get("https://example.com/data", impersonate="chrome")
```

**Round 3 to 403** — until the spider stops using a Python TLS stack.

## Round 4 — HTTP/2 frames

Now the spider has browser headers, browser ordering, a browser TLS handshake. Surely that's everything?

403 smiles and inspects the **HTTP/2 layer.** This is where the real ones get caught, because almost nobody looks here. Over HTTP/2, the moment a connection opens, the client sends a `SETTINGS` frame — and its contents are a fingerprint:

- **`SETTINGS` parameters and their order** — `HEADER_TABLE_SIZE`, `ENABLE_PUSH`, `MAX_CONCURRENT_STREAMS`, `INITIAL_WINDOW_SIZE`, `MAX_FRAME_SIZE`, `MAX_HEADER_LIST_SIZE`. Each browser sends specific values in a specific order.
- **The `WINDOW_UPDATE` increment** the client offers.
- **`PRIORITY` frames** — whether you send them, and the dependency tree you build.
- **Pseudo-header order** — Chrome sends `:method, :authority, :scheme, :path`; other clients order them differently.

Together these form the **HTTP/2 fingerprint** (the Akamai-style `SETTINGS|WINDOW_UPDATE|PRIORITY|pseudo-headers` signature). A generic Python HTTP/2 client produces values and an order no browser ever would — so even a perfect TLS handshake gets betrayed one layer up by the frames riding on top of it.

This is why `requests` and stock `httpx` can't win this fight no matter how you dress the headers: they don't speak HTTP/2 the way a browser does. Libraries like `curl_cffi` (and `tls-client`-style tools) matter precisely because they get **both** the TLS *and* the HTTP/2 fingerprint right. **Round 4 to 403** — unless your client was built for this.

## Round 5 — Alignment (the kill shot)

Here's the round that ends most spiders, and it's not a new layer — it's **coherence across all of them.**

403's favourite move isn't checking any single fingerprint. It's checking whether they *agree*. Picture the contradictions:

- TLS handshake says **Chrome 120**, HTTP/2 fingerprint says **Python**. → caught.
- Everything says **Chrome**, but the UA string says **Chrome 99** that doesn't match the `sec-ch-ua` hints. → caught.
- Perfect Chrome fingerprints arriving from a **datacenter IP** at **inhuman speed**. → caught.

A real browser is *internally consistent* by construction — its TLS, HTTP/2, headers, and UA all come from the same binary, so they can't disagree. A spider assembles these from different libraries, and the seams show. **Incoherence is the tell.** You don't need one perfect layer; you need every layer telling the *same* story. **Round 5 to 403** — until you align the whole stack to one identity.

## Round 6 — Session management

The spider finally looks like a coherent Chrome. One request sails through. Then it fires a thousand more and 403 comes roaring back — because now it's watching the *session*, not the request.

- **Cookies and clearance tokens** (`cf_clearance` and friends) must be carried forward, not dropped between requests.
- **One identity per session.** Don't rotate your IP, UA, or TLS fingerprint mid-session — a "user" whose fingerprint changes between page one and page two doesn't exist.
- **Connection reuse and TLS session resumption** — real browsers keep connections alive and resume sessions. A fresh full handshake on every single request is itself robotic.

Consistency *over time* is just as important as consistency *across layers*. **Round 6 to 403** — until the spider behaves like one persistent visitor instead of a thousand amnesiac strangers.

## Truce

Here's the secret the rivalry never admits: **you don't beat 403. You stop looking like something it's supposed to block.**

There's no single trick — no magic header, no one library — that wins. What wins is *coherence*: residential IP **and** browser TLS **and** matching HTTP/2 frames **and** correctly ordered headers **and** a persistent, well-behaved session, all telling the same story at the same time. The moment any layer contradicts the others, 403 wakes up.

And the responsible footnote, because it matters: I aim this at **public** data, honour rate limits and a site's terms, and never touch anything behind auth I'm not allowed in. The goal of all this isn't to break down the door — it's to knock like a normal visitor instead of a battering ram.

Spider and 403 will never be friends. But with every layer aligned, they can at least learn to ignore each other — which, for a spider, is the only victory that counts.
