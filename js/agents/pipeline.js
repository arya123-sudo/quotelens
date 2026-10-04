// 4-agent purchase pipeline. Runs sequentially, emitting progress events.
// Each agent receives the scenario + all prior agents' results (chained context).
// The human approval gate lives in the UI (tour.js) — agents never spend money.
import { getProvider } from "../ai/provider.js";

export const AGENTS = [
  { id: "extract", label: "Extract Agent", desc: "Reads each quote (OCR text), pulls prices, GST, delivery, warranty, terms — flags what it couldn't read" },
  { id: "normalize", label: "Normalize Agent", desc: "Deterministic math: true per-unit cost = price + GST + delivery ÷ qty. No LLM needed — reliability is the feature" },
  { id: "compare", label: "Compare Agent", desc: "Deltas, outlier flags, hidden-cost warnings, traps (min-order, short validity, high advance)" },
  { id: "recommend", label: "Recommend Agent", desc: "Ranked pick with plain-language reasons and named trade-offs. Recommends — never decides" },
];

export async function runPipeline(scenario, onEvent) {
  const provider = getProvider();
  const results = {};
  for (const a of AGENTS) {
    onEvent?.({ type: "start", agent: a.id });
    const t0 = performance.now();
    try {
      results[a.id] = await provider.analyze(a.id, { scenario, prior: results });
    } catch (err) {
      results[a.id] = {
        agent: a.id,
        provider: "error",
        summary: `Agent failed: ${err.message}`,
        findings: [],
        confidence: "uncertain",
        evidenceRefs: [],
      };
    }
    results[a.id].durationMs = Math.round(performance.now() - t0);
    onEvent?.({ type: "done", agent: a.id, result: results[a.id] });
  }
  return { provider: provider.name, results };
}
