---
title: "My Proxy Was Leaking. SOCKS5 Plugged It."
description: "I was rendering pages through residential proxies and still got banned — by my server's own IP. The browser was leaking requests around the HTTP proxy. SOCKS5 is what finally plugged the hole."
pubDate: 2026-02-11
tags: ["proxies", "playwright", "anti-bot"]
draft: false
---

I was rendering pages with Playwright, routing everything through nice residential proxies, running on a cloud Ubuntu server. Textbook setup. The proxy was configured, the requests were going through it, and for a while everything was fine.

Then the bans started. And the confusing part — the part that cost me an afternoon — was *which* IP got banned. Not the residential proxy. **My server's own IP.** The one I thought wasn't touching the target at all.

## A proxy only protects what goes through it

Here's the thing it took me too long to internalize: an HTTP/HTTPS proxy only carries the traffic the browser actually *sends* through it — the HTTP(S) requests over TCP. But a real browser, especially a full Chromium under Playwright, generates a lot of *other* traffic, and that traffic can sail right past the proxy and out your server's plain ISP connection:

- **DNS lookups** resolving hostnames directly.
- **WebRTC / STUN** chatter over UDP.
- **QUIC / HTTP-3**, also UDP — and HTTP proxies only speak TCP `CONNECT`, so anything UDP simply isn't theirs to carry.

So the browser was making **hidden requests that never touched the proxy** — they connected straight through the server's own network. From the target's side, that looked exactly as bad as it sounds: most requests arriving from a clean residential IP, and then a stray one leaking from a datacenter server IP. Two identities for one "user." As I wrote in [Spider vs 403](/blog/spider-vs-403/), **incoherence is the tell** — and this was about as incoherent as it gets. The site quietly blacklisted the leaked IP, which happened to be my actual server.

## Catching the culprit

Once I stopped assuming the proxy covered *everything* and started asking "what's escaping it?", the leak was obvious. I could see requests reaching the internet that had no business going anywhere but through the tunnel. The browser, doing browser things, was talking to the network on channels the HTTP proxy never even saw.

So I did what every engineer does at this exact moment: I went to **Stack Overflow, our most trusted ally.** And buried in the answers was the fix I'd never reached for — **SOCKS5.**

## Why SOCKS5 saved the day

An HTTP proxy is *application-aware* — it understands HTTP and proxies that. **SOCKS5 works a layer lower:** it's protocol-agnostic and tunnels the connection itself, not just the HTTP semantics on top. That difference is everything here:

- It carries a **broader range of traffic**, not only the HTTP(S) an HTTP proxy is willing to forward.
- Critically, it does **remote DNS** — name resolution happens *through* the proxy (the `socks5h` behaviour), instead of leaking out to your ISP's resolver.

Pointing the browser at a SOCKS5 proxy funneled the traffic that had been escaping back into the tunnel, so there was no longer a stray server-IP request betraying me:

```python
browser = playwright.chromium.launch(
    proxy={"server": "socks5://proxy-host:1080"},
)
```

I re-ran it, watched the network, and the leak was gone — everything the browser did now exited through the proxy, one consistent identity. The bans stopped.

**One honest caveat,** because I don't want to oversell a hero: SOCKS5 is not a magic forcefield. WebRTC can *still* leak your IP unless you explicitly disable it, so the responsible move is to verify there's no leak rather than assume the proxy scheme fixed everything. But for the class of leak that bit me — DNS and non-HTTP traffic slipping around an HTTP proxy — SOCKS5 was exactly the right tool.

## The spider in a cape

After the switch, the spider was flying. Every request, every lookup, the whole browser's chatter — all of it going out through the residential tunnel, none of it leaking home. To the website, there was no longer a suspicious datacenter IP lurking behind a residential one. Just a clean, coherent visitor.

I'll admit I enjoyed this more than I should have: the spider went from "obvious bot we keep banning" to gliding through untouched, like it had thrown on a cape and the site mistook it for Superman. No leak, no contradiction, no block.

## What I took away

- **A proxy covers what you route through it — nothing more.** Configuring a proxy is not the same as routing *all* traffic through it. The dangerous traffic is the traffic you didn't think about: DNS, WebRTC, QUIC.
- **The leaked request is the loud one.** You can have a flawless residential IP and still get caught because one stray packet went out your real connection. One contradiction is all a WAF needs.
- **Match the proxy type to the threat.** HTTP proxies are fine for plain HTTP scraping. The moment you're driving a full browser, you want something that tunnels at the connection level — SOCKS5 with remote DNS — so there's no side door.
- **Verify, don't assume.** Watch your actual outbound traffic and confirm nothing escapes. Trust the packet capture, not the config file.

The proxy wasn't lying about doing its job — it was doing exactly its job, which was narrower than I'd assumed. SOCKS5 just had a wider cape.
