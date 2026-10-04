// Pluggable AI provider layer for QuoteLens.
// MockProvider  — deterministic, fully offline. Honestly badged DEMO/MOCK in the UI.
// LLMProvider  — OpenAI-compatible endpoint, configured at runtime via Settings.
//                Keys live in localStorage ONLY. Never committed, never in the repo.
//                Any failure falls back to MockProvider: the demo can never break live.
import { trueUnitCost, orderTotal } from "../data/quotes.js";

const MOCK_DELAY_MS = 800;

export function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("quotelens_settings") || "{}");
  } catch {
    return {};
  }
}

export function saveSettings(s) {
  localStorage.setItem("quotelens_settings", JSON.stringify(s));
}

const inr = (n) => "Rs " + n.toLocaleString("en-IN");

// --- Mock reasoning: deterministic functions over the scenario data ---
function derive(agent, scn) {
  const qty = scn.business.quantity;
  const rows = scn.quotes.map((q) => ({
    q, true: trueUnitCost(q, qty), total: orderTotal(q, qty),
  }));
  const byTrue = [...rows].sort((a, b) => a.true - b.true);
  const cheapest = byTrue[0];
  const fastest = [...rows].sort((a, b) => a.q.extracted.deliveryDays - b.q.extracted.deliveryDays)[0];
  const bestWarranty = [...rows].sort(
    (a, b) => (b.q.extracted.warrantyMonths || 0) - (a.q.extracted.warrantyMonths || 0))[0];

  switch (agent) {
    case "extract": {
      const findings = scn.quotes.map((q) => {
        const e = q.extracted;
        const base = `${q.id} ${q.supplier}: Rs ${e.unitPrice}/unit, GST ${e.gst}, ` +
          `${e.deliveryDays}d delivery, ${e.warrantyMonths ?? "no"} warranty, ${e.advancePct}% advance`;
        return q.unreadable.length ? base + ` — UNREADABLE: ${q.unreadable.join("; ")}` : base;
      });
      return {
        summary: `${scn.quotes.length} quotes parsed; ` +
          `${scn.quotes.reduce((n, q) => n + q.unreadable.length, 0)} unreadable span(s) flagged`,
        findings, confidence: "high",
        evidenceRefs: scn.quotes.map((q) => q.id),
      };
    }
    case "normalize": {
      const findings = rows.map(({ q, true: t }) => {
        const e = q.extracted;
        const conv = e.perUnitQty !== 1
          ? ` [Rs ${e.unitPrice.toLocaleString("en-IN")} per ${e.perUnitQty} ${e.perUnit} → Rs ${Math.round(e.unitPrice / e.perUnitQty)}/${e.perUnit}]`
          : "";
        return `${q.id} ${q.supplier}: headline Rs ${e.unitPrice}${conv} → true ${inr(t)}/unit ` +
        `(GST ${e.gst}${e.gst === "extra" ? ` +${inr(Math.round((e.unitPrice / (e.perUnitQty || 1)) * e.gstRate))}` : ""}` +
        `${e.deliveryCharge ? ` + ${inr(e.deliveryCharge)} transport` : ", free delivery"})`;
      });
      return {
        summary: `Apples-to-apples table for ${qty} ${scn.business.unit}: true cost = price + GST + delivery ÷ qty (units converted first)`,
        findings, confidence: "high",
        evidenceRefs: scn.quotes.map((q) => q.id),
      };
    }
    case "compare": {
      const findings = [
        `Cheapest true cost: ${cheapest.q.id} ${cheapest.q.supplier} at ${inr(cheapest.true)}/unit`,
        `Fastest delivery: ${fastest.q.id} (${fastest.q.extracted.deliveryDays} days)`,
        `Longest warranty: ${bestWarranty.q.id} (${bestWarranty.q.extracted.warrantyMonths} months)`,
      ];
      for (const { q, true: t } of rows) {
        const e = q.extracted;
        if (e.gst === "extra")
          findings.push(`Hidden cost — ${q.id}: headline Rs ${e.unitPrice} hides ${inr(Math.round(e.unitPrice * e.gstRate))}/unit GST → true ${inr(t)}`);
        if (e.minOrder > qty)
          findings.push(`Trap — ${q.id}: minimum order ${e.minOrder} > need ${qty}; you'd buy double`);
        if (e.advancePct >= 50)
          findings.push(`Cashflow — ${q.id}: ${e.advancePct}% advance = ${inr(Math.round(orderTotal(q, qty) * e.advancePct / 100))} upfront`);
        if (e.validDays <= 5)
          findings.push(`Urgency — ${q.id}: quote valid only ${e.validDays} days`);
      }
      return { summary: `${findings.length} comparison signals across ${rows.length} quotes`,
        findings, confidence: "medium", evidenceRefs: scn.quotes.map((q) => q.id) };
    }
    case "recommend": {
      const runner = byTrue[1];
      const findings = [
        `1st — ${cheapest.q.id} ${cheapest.q.supplier}: ${inr(cheapest.true)}/unit all-in, ` +
          `${cheapest.q.extracted.deliveryDays}-day delivery. Trade-off: ${cheapest.q.extracted.warrantyMonths}-month warranty, ${cheapest.q.extracted.advancePct}% advance.`,
        `2nd — ${runner.q.id} ${runner.q.supplier}: ${inr(runner.true)}/unit ` +
          `(${inr(runner.true - cheapest.true)}/unit more than cheapest).`,
        `Not recommended — ${byTrue[2].q.id}: ${byTrue[2].q.extracted.minOrder > qty ? "min-order trap" : "highest true cost"}.`,
      ];
      return {
        summary: `Best value: ${cheapest.q.supplier} — but the trade-offs are yours to weigh. The agent never spends your money.`,
        findings, confidence: "medium",
        evidenceRefs: [cheapest.q.id, runner.q.id],
      };
    }
    default:
      return { summary: "Unknown agent", findings: [], confidence: "uncertain", evidenceRefs: [] };
  }
}

export class MockProvider {
  name = "mock";
  async analyze(agent, { scenario }) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    return { agent, provider: "mock", ...derive(agent, scenario) };
  }
}

const PROMPTS = {
  extract:
    "You are the Extract Agent of QuoteLens, a purchase-approval agent for small businesses. Parse supplier quotes (OCR text, may contain [illegible] spans) into structured fields. Return JSON: {summary, findings[], confidence: high|medium|low, evidenceRefs[]}. List anything you could not parse under an UNREADABLE flag. Data is synthetic demo data.",
  normalize:
    "You are the Normalize Agent. Compute true per-unit cost = headline price + GST (if extra) + deliveryCharge ÷ quantity. Return JSON: {summary, findings[], confidence, evidenceRefs[]}. Show your math per quote.",
  compare:
    "You are the Compare Agent. Find deltas, outliers, hidden costs (GST-extra headlines, delivery fees), and traps (min order above need, short validity, high advance). Return JSON: {summary, findings[], confidence, evidenceRefs[]}.",
  recommend:
    "You are the Recommend Agent. Rank the quotes by true value with plain-language reasons and named trade-offs. Return JSON: {summary, findings[], confidence, evidenceRefs[]}. Never claim to make the purchase decision — the human approves.",
};

function safeJson(text) {
  try {
    const m = text.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : text);
  } catch {
    return { summary: text.slice(0, 300), findings: [], confidence: "uncertain", evidenceRefs: [] };
  }
}

export class LLMProvider {
  name = "llm";
  constructor(cfg) {
    this.cfg = cfg;
    this.fallback = new MockProvider();
  }
  async analyze(agent, { scenario, prior }) {
    try {
      const base = this.cfg.baseUrl.replace(/\/$/, "");
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: this.cfg.model || "gpt-4o-mini",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: PROMPTS[agent] || PROMPTS.extract },
            { role: "user", content: JSON.stringify({ scenario, prior }) },
          ],
        }),
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      return { agent, provider: "llm", ...safeJson(text) };
    } catch {
      return this.fallback.analyze(agent, { scenario });
    }
  }
}

export function getProvider() {
  const s = loadSettings();
  if (s.apiKey && s.baseUrl) return new LLMProvider(s);
  return new MockProvider();
}

export function providerBadge(provider) {
  return provider.name === "llm" ? "LLM · live" : "MOCK · offline";
}
