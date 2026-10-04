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
          findings.push(`Hidden cost — ${q.id}: headline Rs ${e.unitPrice} hides ${inr(Math.round((e.unitPrice / (e.perUnitQty || 1)) * e.gstRate))}/unit GST → true ${inr(t)}`);
        if (e.minOrder > qty)
          findings.push(`Trap — ${q.id}: minimum order ${e.minOrder} > need ${qty}; ineligible for this order`);
        if (e.advancePct >= 50)
          findings.push(`Cashflow — ${q.id}: ${e.advancePct}% advance = ${inr(Math.round(orderTotal(q, qty) * e.advancePct / 100))} upfront`);
        if (e.validDays <= 5)
          findings.push(`Urgency — ${q.id}: quote valid only ${e.validDays} days`);
      }
      return { summary: `${findings.length} comparison signals across ${rows.length} quotes`,
        findings, confidence: "medium", evidenceRefs: scn.quotes.map((q) => q.id) };
    }
    case "recommend": {
      const feasible = byTrue.filter(({ q }) => (q.extracted.minOrder || 0) <= qty);
      const excluded = byTrue.filter(({ q }) => (q.extracted.minOrder || 0) > qty);
      const pool = feasible.length ? feasible : byTrue; // degenerate case: rank all, flag clearly
      const cheapestF = pool[0];
      const runner = pool[1];
      const findings = [
        `1st — ${cheapestF.q.id} ${cheapestF.q.supplier}: ${inr(cheapestF.true)}/unit all-in, ` +
          `${cheapestF.q.extracted.deliveryDays}-day delivery. Trade-off: ${cheapestF.q.extracted.warrantyMonths ?? "—"}-month warranty, ${cheapestF.q.extracted.advancePct}% advance.`,
      ];
      if (runner) findings.push(
        `2nd — ${runner.q.id} ${runner.q.supplier}: ${inr(runner.true)}/unit ` +
          `(${inr(runner.true - cheapestF.true)}/unit more than cheapest).`);
      for (const { q } of excluded) findings.push(
        `Excluded — ${q.id} ${q.supplier}: min order ${q.extracted.minOrder} > need ${qty}; not eligible for this order.`);
      return {
        summary: `Best value: ${cheapestF.q.supplier} — but the trade-offs are yours to weigh. The agent never spends your money.`,
        findings, confidence: "medium",
        evidenceRefs: [cheapestF.q.id, ...(runner ? [runner.q.id] : [])],
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
    "You are the Normalize Agent. Explain the true per-unit cost for each quote: headline price + GST (if extra) + deliveryCharge ÷ quantity, converting pack sizes first. The authoritative numbers are computed deterministically in code — your job is to explain them in plain language, not to invent your own. Return JSON: {summary, findings[], confidence, evidenceRefs[]}. Show the formula with the scenario's numbers per quote.",
  compare:
    "You are the Compare Agent. Find deltas, outliers, hidden costs (GST-extra headlines, delivery fees), and traps (min order above need, short validity, high advance). Return JSON: {summary, findings[], confidence, evidenceRefs[]}.",
  recommend:
    "You are the Recommend Agent. Rank the quotes by true value with plain-language reasons and named trade-offs. Return JSON: {summary, findings[], confidence, evidenceRefs[]}. Never claim to make the purchase decision — the human approves.",
};

const CONFIDENCE = new Set(["high", "medium", "low", "uncertain"]);

function safeJson(text) {
  let o;
  try {
    const m = String(text).match(/\{[\s\S]*\}/);
    o = JSON.parse(m ? m[0] : text);
  } catch {
    o = {};
  }
  // Validate untrusted model output: wrong types must never reach the UI.
  return {
    summary: typeof o.summary === "string" ? o.summary.slice(0, 2000) : "No summary returned.",
    findings: Array.isArray(o.findings) ? o.findings.filter((f) => typeof f === "string").slice(0, 50) : [],
    confidence: CONFIDENCE.has(o.confidence) ? o.confidence : "uncertain",
    evidenceRefs: Array.isArray(o.evidenceRefs) ? o.evidenceRefs.filter((r) => typeof r === "string").slice(0, 50) : [],
  };
}

export class LLMProvider {
  name = "llm";
  constructor(cfg) {
    this.cfg = cfg;
    this.fallback = new MockProvider();
  }
  async analyze(agent, { scenario, prior }) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const base = this.cfg.baseUrl.replace(/\/$/, "");
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal: ctrl.signal,
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
      // Honest fallback: label the stage with what actually ran.
      const fb = await this.fallback.analyze(agent, { scenario });
      return { ...fb, provider: "mock", fellBack: true };
    } finally {
      clearTimeout(timer);
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
