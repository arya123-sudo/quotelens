// The 7-step judge tour for QuoteLens. Frozen demo script — see PROJECT_SPEC.md §4.
import { runPipeline, AGENTS } from "../agents/pipeline.js";
import { trueUnitCost, orderTotal } from "../data/quotes.js";
import { buildMarkdown, buildHTML, download } from "./export.js";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const inr = (n) => "Rs " + n.toLocaleString("en-IN");

const AUDIT_KEY = "quotelens_approvals";
function logApproval(scn, q) {
  let log = [];
  try { log = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch {}
  log.unshift({
    at: new Date().toISOString(),
    scenario: scn.id,
    supplier: q.supplier,
    quote: q.id,
    total: orderTotal(q, scn.business.quantity),
    flagsConfirmed: q.unreadable.length,
  });
  try { localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 50))); } catch {}
}
function approvalLog() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { return []; }
}

let S = { scenario: null, pipeline: null, step: 0, mount: null, running: false, choice: null, approved: false };

export function startTour(scenario, mount) {
  S = { scenario, pipeline: null, step: 0, mount, running: false, choice: null, approved: false, confirmed: {}, runToken: 0 };
  render();
}

const STEP_TITLES = [
  "The chaos", "Extract", "True-cost table", "Compare & recommend",
  "You approve", "Purchase summary", "Why QuoteLens",
];

function go(n) {
  S.step = Math.max(0, Math.min(STEP_TITLES.length - 1, n));
  render();
}

function rail() {
  return `<ol class="rail">${STEP_TITLES.map(
    (t, i) =>
      `<li class="${i === S.step ? "active" : i < S.step ? "done" : ""}">` +
      `<button data-go="${i}"><span class="n">${i + 1}</span>${esc(t)}</button></li>`
  ).join("")}</ol>`;
}

function nav() {
  return `<div class="nav">
    <button data-go="${S.step - 1}" ${S.step === 0 ? "disabled" : ""}>← Back</button>
    <span class="counter">Step ${S.step + 1} of ${STEP_TITLES.length}</span>
    <button data-go="${S.step + 1}" ${S.step === STEP_TITLES.length - 1 ? "disabled" : ""}>Next →</button>
  </div>`;
}

function confBadge(c) {
  return `<span class="conf conf-${esc(c)}">${esc(c)}</span>`;
}

function rawHTML(raw) {
  return esc(raw).replace(/\[illegible\]/g, `<span class="illegible">[illegible]</span>`);
}

function quoteCard(q) {
  const ch = { "whatsapp-image": "📷 WhatsApp photo", pdf: "📄 PDF", "whatsapp-text": "💬 WhatsApp text" }[q.channel];
  const photoNote = q.channel === "whatsapp-image"
    ? `<div class="photonote">skewed photo · Hindi/English mix · one handwritten correction — the agent flags what it can't read instead of guessing</div>`
    : "";
  return `<div class="card qcard q-${esc(q.channel)}">
    <div class="card-top"><span class="etype">${ch}</span><span class="etime">${esc(q.receivedAt.slice(0, 16).replace("T", " "))}</span></div>
    <h4>${esc(q.supplier)}</h4>
    <div class="chatbubble">${rawHTML(q.rawText)}</div>${photoNote}
    <div class="eid">${esc(q.id)}</div></div>`;
}

function costTable(scn, highlight) {
  const qty = scn.business.quantity;
  const rows = scn.quotes.map((q) => {
    const e = q.extracted;
    const t = trueUnitCost(q, qty);
    return `<tr class="${q.id === highlight ? "winner" : ""}">
      <td><b>${esc(q.supplier)}</b><br><span class="mut">${esc(q.id)}</span></td>
      <td>${inr(e.unitPrice)}${e.perUnitQty !== 1 ? ` <span class="mut">per ${e.perUnitQty} ${esc(e.perUnit)}</span>` : ""}</td>
      <td>${e.gst === "extra" ? `+${inr(Math.round((e.unitPrice / (e.perUnitQty || 1)) * e.gstRate))}` : e.gst === "included" ? "incl." : "?"}</td>
      <td>${e.deliveryDays}d${e.deliveryCharge ? ` (+${inr(e.deliveryCharge)})` : " free"}</td>
      <td>${e.warrantyMonths ?? "—"} mo</td>
      <td>${e.advancePct}%</td>
      <td class="truecost"><b>${inr(t)}</b></td>
      <td>${inr(orderTotal(q, qty))}</td></tr>`;
  }).join("");
  return `<table class="qtable"><thead><tr>
    <th>Supplier</th><th>Headline</th><th>GST</th><th>Delivery</th><th>Warranty</th>
    <th>Advance</th><th>True /unit</th><th>Order total</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function agentCards() {
  const { results, provider, fellBack } = S.pipeline;
  const badge = provider === "llm" ? "LLM · live" : fellBack ? "MOCK · offline (LLM unreachable — fell back)" : "MOCK · offline";
  return `<p class="lede">Provider: <span class="badge">${badge}</span></p>
  <div class="agents">${AGENTS.map((a) => {
    const r = results[a.id] || {};
    return `<div class="agent"><div class="agent-head"><strong>${esc(a.label)}</strong>
      <span class="dur">${r.durationMs ?? "—"}ms</span></div>
      <span class="prov">Provider: ${r.provider === "llm" ? "LLM" : (r.fellBack ? "mock (fallback)" : "mock")}</span>
      <div class="adesc">${esc(a.desc)}</div>
      <p>${esc(r.summary || "")}</p>
      <ul>${(r.findings || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
      <div class="refs">${confBadge(r.confidence || "uncertain")}
      <span class="erefs">${(r.evidenceRefs || []).map(esc).join(" · ")}</span></div></div>`;
  }).join("")}</div>`;
}

function render() {
  const scn = S.scenario;
  const b = scn.business;
  const cheapestId = [...scn.quotes]
    .sort((x, y) => trueUnitCost(x, b.quantity) - trueUnitCost(y, b.quantity))[0].id;

  const steps = [
    // 1 — The chaos
    () => `<div class="hero"><div class="badge-row">
        <span class="badge">DEMO · 100% synthetic</span><span class="badge">${esc(scn.id)}</span></div>
      <h2>${esc(b.name)} needs ${esc(b.need)}</h2>
      <p class="lede">${esc(b.location)} · Three suppliers reply on WhatsApp — a photo, a PDF,
      a text. Three formats, zero comparability. The owner compares them in their head…
      and usually overpays.</p>
      <div class="grid">${scn.quotes.map(quoteCard).join("")}</div>
      <button class="primary" data-go="1" style="margin-top:1.2rem">Hand them to the agents →</button></div>`,

    // 2 — Extract (runs the pipeline)
    () => `<h2>Extract</h2>
      <p class="lede">Agents read each quote — OCR, parsing, GST, delivery, warranty, terms.
      Anything it can't read gets flagged, not hidden.</p>
      ${S.pipeline ? agentCards().split("</p>")[0] + "</p>" + "" : ""}
      ${S.pipeline ? `<div class="agents">${AGENTS.filter(a => a.id === "extract").map((a) => {
          const r = S.pipeline.results[a.id] || {};
          return `<div class="agent"><div class="agent-head"><strong>${esc(a.label)}</strong>
            <span class="dur">${r.durationMs ?? "—"}ms</span></div>
            <p>${esc(r.summary || "")}</p>
            <ul>${(r.findings || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
            <div class="refs">${confBadge(r.confidence || "uncertain")}</div></div>`;
        }).join("")}</div>
        <button class="primary" id="runBtn" ${S.running ? "disabled" : ""}>Re-run pipeline</button>`
      : `<button class="primary" id="runBtn" ${S.running ? "disabled" : ""}>Run 4-agent pipeline →</button>`}
      <div id="runStatus"></div>`,

    // 3 — True-cost table
    () => {
      // Data-driven "looked honest until GST" line — never hardcoded per scenario.
      const gstTrap = scn.quotes
        .filter((x) => x.extracted.gst === "extra")
        .map((x) => ({ x, add: Math.round((x.extracted.unitPrice / (x.extracted.perUnitQty || 1)) * x.extracted.gstRate) }))
        .sort((a, b) => b.add - a.add)[0];
      const trapLine = gstTrap
        ? `<p class="lede">Rs ${gstTrap.x.extracted.unitPrice.toLocaleString("en-IN")} <i>looked</i> like the honest pick — until ${Math.round(gstTrap.x.extracted.gstRate * 100)}% GST landed on top of it.</p>`
        : "";
      return S.pipeline ? `<h2>True-cost table</h2>
      <p class="lede">Normalize agent: true per-unit cost = headline + GST + delivery ÷ ${b.quantity}.
      Deterministic math — no LLM needed. <b>Reliability is the feature.</b></p>
      ${costTable(scn, cheapestId)}
      <p class="lede">🔢 <code>true = unit + (GST extra ? unit×rate : 0) + delivery ÷ qty</code> —
      computed deterministically in code. The LLM explains the result; it never does the math.</p>
      ${trapLine}`
      : `<h2>True-cost table</h2><p class="lede">Run the pipeline first (step 2).</p>
        <button class="primary" data-go="1">← Go to Extract</button>`;
    },

    // 4 — Compare & recommend
    () => S.pipeline ? `<h2>Compare & recommend</h2>
      <div class="agents">${["compare", "recommend"].map((id) => {
        const a = AGENTS.find((x) => x.id === id);
        const r = S.pipeline.results[id] || {};
        return `<div class="agent"><div class="agent-head"><strong>${esc(a.label)}</strong>
          <span class="dur">${r.durationMs ?? "—"}ms</span></div>
          <p>${esc(r.summary || "")}</p>
          <ul>${(r.findings || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          <div class="refs">${confBadge(r.confidence || "uncertain")}</div></div>`;
      }).join("")}</div>
      <p class="lede ethics">The agent recommends. It never decides — that's your job, next step.</p>`
      : `<h2>Compare & recommend</h2><p class="lede">Run the pipeline first (step 2).</p>
        <button class="primary" data-go="1">← Go to Extract</button>`,

    // 5 — You approve (THE GATE)
    () => {
      const q = scn.quotes.find((x) => x.id === S.choice);
      const flags = q ? q.unreadable : [];
      const allConfirmed = q && flags.every((_, i) => S.confirmed[q.id + ":" + i]);
      return `<h2>You approve</h2>
      <div class="notice">⛔ The agent cannot spend your money. Pick a supplier — and confirm
      every flagged uncertainty with your own eyes before the approval unlocks.</div>
      <div class="grid">${scn.quotes.map((qq) => {
        const t = trueUnitCost(qq, b.quantity);
        const infeasible = (qq.extracted.minOrder || 0) > b.quantity;
        if (infeasible) return `<div class="card gate ineligible">
          <h4>${esc(qq.supplier)}</h4>
          <div class="gate-price">${inr(t)}<span>/unit true</span></div>
          <div class="mut">Needs min order ${qq.extracted.minOrder} ${esc(b.unit)} — you need ${b.quantity}. Excluded from this order.</div>
          <div class="badge">⛔ min-order trap</div>
        </div>`;
        return `<button class="card gate ${S.choice === qq.id ? "chosen" : ""}" data-pick="${esc(qq.id)}">
          <h4>${esc(qq.supplier)}</h4>
          <div class="gate-price">${inr(t)}<span>/unit true</span></div>
          <div class="mut">${inr(orderTotal(qq, b.quantity))} total · ${qq.extracted.deliveryDays}d delivery · ${qq.extracted.warrantyMonths ?? "—"} mo warranty</div>
          ${S.choice === qq.id ? `<div class="badge">✓ your pick</div>` : ""}
        </button>`;
      }).join("")}</div>
      ${q && flags.length ? `<h3>⚠️ Confirm the flags — approval stays locked until you do</h3>
        <div class="actions">${flags.map((f, i) => `<label class="action">
          <input type="checkbox" data-flag="${esc(q.id + ":" + i)}" ${S.confirmed[q.id + ":" + i] ? "checked" : ""}>
          <span>${esc(f)}</span></label>`).join("")}</div>` : ""}
      ${S.choice ? `<button class="primary" id="approveBtn" data-go="5" style="margin-top:1.2rem"
        ${flags.length && !allConfirmed ? "disabled" : ""}>` +
        (flags.length && !allConfirmed ? `🔒 Confirm ${flags.length} flag(s) to unlock approval` : `Generate purchase summary →`) +
        `</button>` : ""}`;
    },

    // 6 — Purchase summary (only reachable after explicit human approval)
    () => {
      if (!S.approved)
        return `<h2>Purchase summary</h2><p class="lede">Approve a supplier first (step 5) — the summary unlocks only after your explicit approval.</p>
          <button class="primary" data-go="4">← Go to approval</button>`;
      const q = scn.quotes.find((x) => x.id === S.choice);
      const t = trueUnitCost(q, b.quantity);
      return `<h2>Purchase summary</h2>
      <div class="card po">
        <h4>🧾 Purchase summary — ${esc(scn.id)}</h4>
        <p><b>${esc(b.name)}</b> · ${esc(b.need)} · Qty ${b.quantity}</p>
        <p>Supplier: <b>${esc(q.supplier)}</b> · True cost <b>${inr(t)}/unit</b> · Order total <b>${inr(orderTotal(q, b.quantity))}</b></p>
        <p class="mut">GST ${q.extracted.gst} · ${q.extracted.deliveryDays}-day delivery · ${q.extracted.warrantyMonths ?? "—"}-month warranty · ${q.extracted.advancePct}% advance · valid ${q.extracted.validDays} days</p>
        <p class="mut">Approved by human · ${new Date().toLocaleString("en-IN")}</p>
      </div>
      <div class="export-row">
        <button class="primary" id="dlMd">⬇ Summary (.md)</button>
        <button class="primary" id="dlHtml">⬇ Summary (.html)</button>
        <button id="printBtn">🖨 Print / PDF</button>
      </div>
      ${(() => {
        const log = approvalLog();
        return log.length ? `<h3>Approval audit trail</h3><ol class="timeline">${
          log.slice(0, 5).map((e) => `<li><span class="tt">${esc(e.at.slice(0, 16).replace("T", " "))}</span>` +
            `<span>${esc(e.supplier)} — ${inr(e.total)} <span class="mut">(${esc(e.scenario)} · ${esc(e.quote)})</span></span></li>`).join("")
        }</ol>` : "";
      })()}`;
    },

    // 7 — Why QuoteLens
    () => `<h2>Why QuoteLens</h2>
      <div class="grid">
        <div class="card"><h4>🎯 The gap</h4><p>Enterprise suites serve procurement teams. Sell-side tools help you <i>send</i> quotes. B2B marketplaces aggregate sellers. We found <b>no WhatsApp-first buy-side agent for micro-businesses</b> — nothing reads the messy quotes already sitting in a shop owner's chat.</p></div>
        <div class="card"><h4>🤖 Agents that earn trust</h4><p>Extract → normalize → compare → recommend. Deterministic math where it counts, LLM reasoning where it helps, uncertainty flagged everywhere.</p></div>
        <div class="card"><h4>🙋 Human in control</h4><p>The agent proposes, you dispose. No purchase happens without your approval — the money decision stays human, by design.</p></div>
      </div>
      <p class="lede">Honest by design: 100% synthetic demo data · provider badged MOCK/LLM ·
      unreadable spans flagged, never hidden · no real money moves.</p>
      <button class="primary" data-go="0">↺ Replay the tour</button>`,
  ];

  S.mount.innerHTML = `<div class="tour">${rail()}
    <div class="step">${steps[S.step]()}</div>${nav()}</div>`;

  S.mount.querySelectorAll("[data-go]").forEach((b) =>
    b.addEventListener("click", () => {
      const target = parseInt(b.dataset.go, 10);
      if (b.id === "approveBtn" && S.choice) {
        const q = S.scenario.quotes.find((x) => x.id === S.choice);
        if (q) { logApproval(S.scenario, q); S.approved = true; }
      }
      // The gate: step 5 (purchase summary) is unreachable without explicit approval —
      // nav rail / Next buttons cannot bypass it.
      if (target === 5 && !S.approved && b.id !== "approveBtn") return;
      go(target);
    })
  );
  S.mount.querySelectorAll("[data-pick]").forEach((b) =>
    b.addEventListener("click", () => { S.choice = b.dataset.pick; S.approved = false; render(); })
  );
  S.mount.querySelectorAll("[data-flag]").forEach((cb) =>
    cb.addEventListener("change", () => {
      S.confirmed[cb.dataset.flag] = cb.checked;
      S.approved = false;
      render();
    })
  );

  const runBtn = S.mount.querySelector("#runBtn");
  if (runBtn) runBtn.addEventListener("click", async () => {
    S.running = true;
    const myRun = ++S.runToken;
    render();
    const status = S.mount.querySelector("#runStatus");
    try {
      await runPipeline(scn, ({ type, agent, result }) => {
        if (!status) return;
        if (type === "start")
          status.innerHTML += `<div class="runline" id="rl-${agent}">⏳ ${esc(agent)}…</div>`;
        else {
          const el = status.querySelector(`#rl-${agent}`);
          if (el) el.innerHTML = `✅ ${esc(agent)} — ${esc(String(result.summary || "").slice(0, 90))}…`;
        }
      }).then((p) => { if (S.runToken === myRun) S.pipeline = p; });
    } finally {
      if (S.runToken === myRun) { S.running = false; render(); }
    }
  });

  const dlMd = S.mount.querySelector("#dlMd");
  if (dlMd) dlMd.addEventListener("click", () =>
    download(`${scn.id}-summary.md`, buildMarkdown(scn, S.pipeline, S.choice), "text/markdown"));
  const dlHtml = S.mount.querySelector("#dlHtml");
  if (dlHtml) dlHtml.addEventListener("click", () =>
    download(`${scn.id}-summary.html`, buildHTML(scn, S.pipeline, S.choice), "text/html"));
  const printBtn = S.mount.querySelector("#printBtn");
  if (printBtn) printBtn.addEventListener("click", () => window.print());
}
