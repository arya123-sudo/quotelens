# QuoteLens — 10-slide pitch outline (mapped to the official 100-pt criteria)

## 1. Title
**QuoteLens** — the purchase-approval agent for WhatsApp-first micro-businesses.
Track: Agentic AI. One line: supplier quotes in, true cost out, human decides.

## 2. The problem (Problem evidence · 15)
~6.34 Cr unincorporated non-agricultural MSMEs in India (NSS 73rd round, via PIB).
Their supplier quotes arrive as WhatsApp photos, PDFs, and text messages —
three formats, three units, hidden GST, delivery fees. Comparing them by hand
takes ~20 minutes and mistakes cost real money.

## 3. Proof it's real (Problem evidence · 15)
- The NSS figure + PIB citation (link).
- One real shop-owner quote about comparing supplier quotes (collect during event).
- Timed manual comparison: human vs QuoteLens on the same 3 quotes.

## 4. The one workflow (Core solution · 24)
The 7-step judge tour, live: extract → normalize → compare → recommend →
human approval → purchase summary + audit trail. Screenshot / GIF of the demo.
One reliable workflow beats ten half-finished features.

## 5. How it works (Technical depth · 24)
4-agent pipeline (Extract, Normalize, Compare, Recommend) + human gate.
Deterministic true-cost math in code — `price + GST + delivery ÷ qty`, pack
sizes converted first. The LLM explains; it never computes. Pluggable provider:
Mock today (honestly badged), real LLM via Settings tomorrow.

## 6. Traps it catches (Core solution · 24)
Live examples from the 3 scenarios: MOQ you can't meet (fans, rice, displays),
unit mismatch — ₹94/kg vs ₹2,250/25kg bag vs ₹920/10kg pack (rice), GST hidden
in the headline — ₹720 + 18% loses to ₹820 all-in (displays), 75% advance
demands, 2-day validity pressure.

## 7. The human stays in control (Responsible design · 10)
Flag-locked approval: uncertain quotes can't be approved until a human confirms
each flag. Audit trail with timestamp on every approval. The agent recommends —
it never spends money. Synthetic data labeled everywhere; mock AI never
presented as live.

## 8. Why nothing else does this (Originality · 15)
Enterprise procurement tools (Scopex, Precoro) serve big companies; seller-side
tools (Wortal) and form builders (Jotform) don't compare quotes. Nobody builds
a WhatsApp-first, buy-side quote agent for micro-businesses.

## 9. Built for the real user (Usability · 12)
Runs in a browser, nothing to install. Handles Hindi/English mixed quotes,
blurry photos with [illegible] spans, handwritten price corrections. Three
scenarios: electrical shop, restaurant, repair shop.

## 10. Roadmap + team (and honest disclosures)
Next: real OCR for photos/PDFs, WhatsApp Business API intake, voice notes.
Disclosures (per official rules): pre-event UI scaffold disclosed in README;
AI tools used (list the significant ones); all demo data synthetic.
Team + roles. The ask: QuoteLens — the agent compares, you decide.
