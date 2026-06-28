---
title: "No News Isn't Good News"
description: "Monitors only fire if the spider runs. The scariest failure is the one where nothing runs, nothing fires, and the silence reads as success. Here's how to alert on absence."
pubDate: 2026-06-28
tags: ["monitoring", "alerting", "reliability"]
draft: false
---

A monitor can only fire if the spider actually runs. The most dangerous failure mode isn't a broken crawl that alerts you — it's the one where **nothing runs, nothing fires, and the silence reads as success.**

Every alerting setup I've seen has the same blind spot: it watches the crawl, but nobody watches whether the crawl happened at all. You've got [solid monitors](/blog/spider-monitoring-checklist/) on item counts and error rates — but those only execute *inside* a run. If the run never starts, your beautifully instrumented spider produces exactly zero alerts, and "no alerts" feels like "all good." It isn't.

## The three ways alerting fails silently

**1. The spider never ran.** The cron entry got clobbered by a deploy, the scheduler hung, the container failed to start, a dependency broke at import time. No run means no monitors, which means no alert. Your data is now silently stale and nothing is on fire — visibly.

**2. The notification channel failed.** The run finished, a monitor caught a real problem, and the alert fired straight into a void: an expired Slack webhook, a bounced email, a rate-limited API. The alarm went off in an empty room.

**3. The whole host is dead.** The box that runs the spider *and* sends the alerts is the same box — and it's down. There's nothing alive to tell you anything is wrong.

All three share one nasty property: the failure suppresses its own alarm. You cannot fix this from *inside* the system. The fix has to live outside it.

## The fix: alert on absence, not presence

The pattern is a **dead man's switch** (or heartbeat). Instead of alerting when something bad happens, you alert when an expected *good* signal **fails to arrive**.

The spider emits a heartbeat every time it finishes successfully. An external watcher expects that heartbeat on a schedule. If it doesn't show up in the expected window, the watcher fires — and because the watcher is a separate system, it survives all three failures above.

Ping a health-check endpoint at the end of a successful run — and *only* a successful one:

```python
from scrapy import signals
import requests

class HeartbeatExtension:
    PING_URL = "https://hc-ping.com/your-uuid-here"

    @classmethod
    def from_crawler(cls, crawler):
        ext = cls()
        crawler.signals.connect(ext.spider_closed, signal=signals.spider_closed)
        return ext

    def spider_closed(self, spider):
        # Only signal "alive" if the crawl genuinely finished clean.
        if spider.crawler.stats.get_value("finish_reason") != "finished":
            return
        try:
            requests.get(self.PING_URL, timeout=10)
        except requests.RequestException:
            spider.logger.warning("heartbeat ping failed")
```

The subtlety that matters: **gate the ping on `finish_reason == "finished"`.** A run that times out or gets killed should *not* send the heartbeat — you want its silence to trip the switch. A naive "ping at the end no matter what" defeats the entire purpose.

Then point an external watcher at that endpoint — [Healthchecks.io](https://healthchecks.io/), Dead Man's Snitch, Cronitor, or a tiny scheduled function of your own. You configure the expected period (say, "every 24h, with a 1h grace") and *it* alerts you when the ping is overdue. The crawl going missing now pages you instead of disappearing quietly.

## Don't trust a single channel

The heartbeat covers "did it run." Redundancy covers "did the alert get through." A few rules I follow:

- **Two channels for anything critical.** Slack for routine, but a second path (email, SMS, PagerDuty) for the alerts you cannot afford to miss. One channel is a single point of failure for your *awareness*.
- **Put the watcher somewhere independent.** A dead man's switch hosted on the same infrastructure as the spider isn't a fallback — it's the same failure domain. Use an external service or a separate region.
- **Test the alert path, not just the monitors.** Periodically force a failure and confirm it actually reaches your phone. An untested alert path is an assumption, not a safety net.

## Mind the alert fatigue

A fallback that cries wolf gets muted, and a muted alert is no alert. Tune grace windows so normal variance doesn't trip the switch, separate "page me now" from "look at this tomorrow," and make every alert state plainly *what* broke and *which* spider. The goal is a channel you still trust at 2am six months from now.

> Working software is silent. A working *operation* is not — it has a heartbeat you can check. If your monitoring only ever speaks up when something's wrong, you've quietly bet everything on it never failing to speak.

Get this in place and the worst-case scenario flips: instead of finding out your crawler died last Tuesday from an angry stakeholder this Friday, the absence itself becomes the alarm.
