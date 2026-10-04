// App boot + hash router: #/demo (judge tour), #/why (positioning), settings modal.
import { SCENARIOS } from "./data/quotes.js";
import { startTour } from "./ui/tour.js";
import { loadSettings, saveSettings, getProvider, providerBadge } from "./ai/provider.js";

const view = document.getElementById("view");
const badge = document.getElementById("providerBadge");

function refreshBadge() {
  badge.textContent = providerBadge(getProvider());
  badge.className = "pbadge " + getProvider().name;
}

function demoPage() {
  const picks = SCENARIOS.map(
    (s, i) => `<button class="case-pick ${i === 0 ? "active" : ""}" data-case="${i}">
      <b>${s.id}</b><span>${s.title}</span></button>`
  ).join("");
  view.innerHTML = `<div class="casebar">${picks}</div><div id="tour"></div>`;
  const mount = view.querySelector("#tour");
  const pick = (i) => {
    view.querySelectorAll(".case-pick").forEach((b, j) => b.classList.toggle("active", j === i));
    startTour(SCENARIOS[i], mount);
  };
  view.querySelectorAll(".case-pick").forEach((b) =>
    b.addEventListener("click", () => pick(parseInt(b.dataset.case, 10)))
  );
  pick(0);
}

function whyPage() {
  view.innerHTML = `<div class="why">
    <h1>Why QuoteLens</h1>
    <p class="lede"><b>"Wortal helps you send quotes. Nothing helps you read them."</b></p>
    <p class="lede">India's ~7.3 crore micro-enterprises coordinate on WhatsApp. Supplier quotes arrive as photos,
    PDFs, and text notes — and the owner compares them in their head. Enterprise buyers have
    procurement suites; sell-side tools help you <i>send</i> quotes. Nobody helps a
    micro-business <i>read</i> the quotes coming at it.</p>
    <div class="grid">
      <div class="card"><h4>🔍 Extract</h4><p>OCR + parsing reads messy, multilingual quote photos. Anything illegible gets flagged — never hidden.</p></div>
      <div class="card"><h4>⚖️ Normalize</h4><p>Deterministic true-cost math: headline + GST + delivery ÷ qty. Reliability is the feature.</p></div>
      <div class="card"><h4>🙋 Human approves</h4><p>Agents propose, you dispose. No purchase happens without your approval — money decisions stay human, by design.</p></div>
    </div>
    <h2>Honest by design</h2>
    <ul><li>All demo data is synthetic.</li><li>AI provider is pluggable — mock offline, real LLM when configured.</li>
    <li>Every number is reproducible from the quote data.</li>
    <li>The agent recommends. It never spends money.</li></ul>
    <button class="primary" onclick="location.hash='#/demo'">See the demo →</button>
  </div>`;
}

function openSettings() {
  const s = loadSettings();
  const q = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const wrap = document.createElement("div");
  wrap.className = "modal-wrap";
  wrap.innerHTML = `<div class="modal"><h3>AI provider settings</h3>
    <p class="lede">Leave empty to use the offline mock provider. Keys stay in this browser only.</p>
    <label>Base URL (OpenAI-compatible)<input id="sBase" value="${q(s.baseUrl)}" placeholder="https://api.openai.com/v1"></label>
    <label>API key<input id="sKey" type="password" value="${q(s.apiKey)}" placeholder="sk-…"></label>
    <label>Model<input id="sModel" value="${q(s.model) || "gpt-4o-mini"}"></label>
    <div class="modal-btns"><button id="sCancel">Cancel</button>
    <button class="primary" id="sSave">Save</button></div></div>`;
  document.body.appendChild(wrap);
  wrap.querySelector("#sCancel").onclick = () => wrap.remove();
  wrap.querySelector("#sSave").onclick = () => {
    saveSettings({
      baseUrl: wrap.querySelector("#sBase").value.trim(),
      apiKey: wrap.querySelector("#sKey").value.trim(),
      model: wrap.querySelector("#sModel").value.trim() || "gpt-4o-mini",
    });
    wrap.remove();
    refreshBadge();
  };
  wrap.addEventListener("click", (e) => { if (e.target === wrap) wrap.remove(); });
}

function route() {
  const h = location.hash || "#/demo";
  document.querySelectorAll("nav button").forEach((b) =>
    b.classList.toggle("active", b.dataset.route === h));
  if (h === "#/why") whyPage();
  else demoPage();
  refreshBadge();
}

document.getElementById("settingsBtn").addEventListener("click", openSettings);
window.addEventListener("hashchange", route);
route();
