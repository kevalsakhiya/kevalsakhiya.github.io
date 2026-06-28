---
title: "The Browser Was Doing Math. So I Did It Myself."
description: "One field on a real-estate site forced an expensive browser render per property. It turned out the browser wasn't fetching that number — it was calculating it. So I reverse-engineered the math and cut a day-long crawl to four hours."
pubDate: 2026-06-28
tags: ["reverse-engineering", "performance", "javascript"]
draft: false
---

I was restructuring a real-estate scraper. The data was clean, the run was healthy — except for **one field.** One number we wanted badly, and the only way I could get it was to render the page in a real browser through a premium service. Every property meant a full browser request. It was slow, and it cost money per run.

So I went looking for a way out. What I found turned a day-long crawl into a four-hour one — and taught me to trust a hunch I almost talked myself out of.

## The field that wouldn't load

First I did the obvious thing: I checked whether the number was *anywhere* in what the server actually sent. The HTML, the embedded JSON, every XHR and API response the page made. I checked everything.

It wasn't there. The value simply did not exist in any payload the site delivered. And yet there it was, rendered plainly on the page. A number that arrived in nothing, but showed up on everything.

## The hypothesis (with a nod to P vs NP)

If the number wasn't *sent*, then the browser had to be **making** it — computing it client-side from other values it did receive.

Here's the thought that gave me the nerve to chase it. There's a famous open question in computer science, **P vs NP**, and one informal way people gesture at it is: *is a problem whose solution is easy to **verify** also easy to **find**?* I wasn't proving anything — it's an unsolved problem and I'm a scraper engineer, not a complexity theorist. But as a *mental nudge* it was perfect: I could **verify** a candidate answer trivially. If I guessed the formula, I could check it instantly against the number already on the screen. And when verification is that cheap, brute-forcing your way to the formula stops feeling hopeless and starts feeling like a search with a built-in answer key.

So I went hunting for the recipe.

## Reverse-engineering the React

The site was a React app, which made it harder — bundled, minified, not exactly written for a stranger to read. But I can read JavaScript, and "harder" isn't "impossible." I dug through the code looking for where that number got produced, and after a while of tracing, I found it: a function that computed the value I wanted.

It took **two variables** and one number I was already scraping from the display. Great — except now I had a new question: those two variables, where do *they* come from? Are they static, or different per property?

I traced one back. And it, too, was the output of *another* function. 😄 So I started the whole cycle over — find the function, find its inputs, trace those back — until I'd bottomed out at values I could actually get. Reverse-engineering is recursive like that: every answer is just the next question wearing a disguise.

## Doing the math myself

Once I had the full chain, I reimplemented the calculation directly in the spider — the same arithmetic the browser was doing, just in my code instead of theirs:

```python
def derived_value(display_number, a, b):
    # the same formula the React bundle was computing client-side,
    # rebuilt from the traced functions
    return f(display_number, a, b)
```

I ran it against properties where I already knew the rendered answer. The error was around **0.0001** — utterly negligible, the kind of gap that's just floating-point dust. The math checked out.

And that meant the browser request was *gone*. No more rendering the page, no more premium service for that one field. Straight cost reduction on every single run.

## The four-hour kid

The cost saving was the rational win. The moment I actually celebrated was a different one.

I'd ripped out the slowest, most expensive step in the whole crawl. So I kicked off a full run and watched it in [my monitor](/blog/store-every-spider-stat/) — the same run-stats I keep on every spider precisely so I can see things like this. It finished in **four hours.** The version with the browser request had taken about a *day*.

I'm not exaggerating when I say it felt like being a parent watching their kid take its first steps. A little absurd to be that happy about a crawl duration — but anyone who's stared at a slow pipeline for weeks knows exactly the feeling. (And it's only a feeling you *get* if you're recording run stats in the first place — the win is invisible if you're not watching for it.)

## What it taught me

- **Rendering is a last resort, not a default.** A headless browser is the most expensive tool in the box — slow, heavy, and often billed. Before reaching for it, ask the cheaper question: *is this value sent, or computed?* If it's computed, you can usually compute it too.
- **"Easy to verify" makes reverse-engineering tractable.** When you can instantly check a candidate answer against ground truth, finding the formula becomes a guided search instead of a shot in the dark. That cheap verification is your whole advantage — use it.
- **Trace until you bottom out.** Client-side values are often computed from other computed values. Don't stop at the first function; follow the chain down to inputs you can actually obtain.
- **The big wins hide in the expensive step.** Eliminating one costly per-item operation didn't shave a few percent — it cut the run by ~80% and removed a recurring bill. The slowest, priciest part of your pipeline is where the leverage lives.

The browser was doing math behind my back. Once I realized that, the only question left was whether I was willing to read enough minified React to do it myself. Turns out I was — and the spider's been four hours ever since.
