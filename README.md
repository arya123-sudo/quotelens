# QuoteLens — Purchase-approval agent for small businesses (WCC Launchpad 30)

Supplier quotes arrive as WhatsApp photos, PDFs, and text notes. Agents extract,
normalize, and compare them into one honest true-cost table — and the human approves
the spend. **Agents propose, humans dispose.**

**100% of demo data is synthetic.** No real businesses, people, or money.

## Run it

No build step. Serve the folder statically and open it:

```sh
# any static server, e.g.
npx serve .
# then open http://localhost:3000/#/demo
```

Or deploy to Vercel as a static site.

## Structure

```
index.html            shell + routes (#/demo, #/why) + settings
css/styles.css
js/main.js            router, boot, provider badge
js/ui/tour.js         the 7-step judge tour (chaos → … → human approval → summary)
js/ui/export.js       purchase summary .md / .html / print-to-PDF
js/agents/pipeline.js 4-agent orchestration (extract → normalize → compare → recommend)
js/ai/provider.js     pluggable AI: MockProvider (offline) | LLMProvider
js/data/quotes.js     synthetic purchasing scenarios (SCN-2026-001 …)
js/data/schema.md     the scenario JSON contract (for generating more)
```

## The demo scenario

Sharma Electricals (Jaipur) needs 50 ceiling fans. Three suppliers reply on WhatsApp —
and the cheapest headline price hides Rs 333/unit in GST. True costs: Rs 2,193 vs
Rs 1,790 vs Rs 2,148 per unit. The agents find it; the human decides.

## Real AI (optional, never required)

Settings → paste an OpenAI-compatible `baseUrl` + `apiKey` + `model`.
Stored in `localStorage` only — never in the repo. If anything fails, the app
silently falls back to the offline mock provider, so the demo can never break live.

## Disclosure (per WCC Launchpad 30 rules)

This scaffold was prepared before the event as a template; the core product is built
during the official hackathon period (Oct 4–5, 2026). AI tools used: Muse (Meta) for
architecture/code, GPT-6 (Astra) for synthetic data and content.
