import { api, ApiError, connectLive, login, logout, savedUser, setUnauthorizedHandler } from "./api.js";
import { barChart, lineChart } from "./charts.js";
import { getLang, initLang, onLangChange, pick, setLang, t } from "./i18n.js";
import { sendSnapshot, startUnity } from "./unity.js";

const cfg = window.TWIN_CONFIG;
const $ = (id) => document.getElementById(id);

const state = {
  meta: null,
  snap: null,
  user: savedUser(),
  trend: [],            // [{t: Date, v}]
  inspections: [],
  audit: [],
  suggestions: [],
  quota: null,
  editing: new Set(),   // sliders the user is dragging
  conn: null,           // live | offline
  asking: false,
  twin: "loading",      // loading | started | missing | failed
};

// ── helpers ────────────────────────────────────────────────────────────────
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c !== null && c !== undefined) node.append(c);
  return node;
}

const pct = (v, d = 1) => `${(v * 100).toFixed(d)}%`;
const num = (v) => new Intl.NumberFormat(getLang() === "tc" ? "zh-HK" : "en-HK").format(v);
const locale = () => (getLang() === "tc" ? "zh-HK" : "en-HK");
const timeShort = (d) => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
const timeLong = (d) => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const dateTime = (d) => d.toLocaleString(locale(), { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
const toDate = (ts) => new Date(typeof ts === "number" ? ts * 1000 : ts);
const paramLabel = (name) => (state.meta?.params[name] ? pick(state.meta.params[name], "label") : name);
const paramUnit = (name) => state.meta?.params[name]?.unit || "";
const faultName = (k) => t(`fault.${k}`);
const fmtParam = (name, v) => `${+Number(v).toFixed(2)}${paramUnit(name) ? " " + paramUnit(name) : ""}`;

function errorText(err) {
  if (err instanceof ApiError && err.status === 0) return t("error.network");
  return err.message;
}

// ── live snapshot ──────────────────────────────────────────────────────────
function onSnapshot(raw, s) {
  sendSnapshot(raw);
  state.snap = s;
  renderStatus();
  renderKpis();
  renderFlow();
  syncParams();
  renderFaultInfo();
  addTrendPoint(s);
}

function addTrendPoint(s) {
  if (!s.running || s.standby || !s.counters.total) return;
  const now = new Date();
  const last = state.trend[state.trend.length - 1];
  if (last && now - last.t < cfg.pollSeconds * 1000) return;
  state.trend.push({ t: now, v: s.ng_rate });
  const cutoff = now - cfg.trendMinutes * 60 * 1000;
  while (state.trend.length && state.trend[0].t < cutoff) state.trend.shift();
  renderTrend();
}

function machineState(s) {
  if (s.phase === "fault" || s.error) return "fault";
  if (s.standby) return "standby";
  return s.running ? "running" : "stopped";
}

const STATE_ICON = { running: "▶", stopped: "■", standby: "❚❚", fault: "⚠" };

function renderStatus() {
  const s = state.snap;
  if (!s) return;
  const st = machineState(s);
  const pill = $("machine-pill");
  pill.className = `pill state-${st}`;
  pill.querySelector(".icon").textContent = STATE_ICON[st];
  pill.querySelector(".pill-text").textContent = t(`state.${st}`) + (st === "fault" && s.error ? `: ${s.error}` : "");
  $("phase-text").textContent = s.running && !s.standby ? t(`phase.${s.phase}`) : "";
  $("viewers-text").textContent = s.viewers > 1 ? t("status.viewers", { n: s.viewers }) : "";
}

function setConn(status) {
  state.conn = status;
  const pill = $("conn-pill");
  pill.className = `pill ${status === "live" ? "ok" : "bad"}`;
  pill.querySelector(".pill-text").textContent = t(status === "live" ? "status.live" : "status.offline");
}

function renderKpis() {
  const s = state.snap;
  if (!s) return;
  $("kpi-total").textContent = num(s.counters.total);
  $("kpi-good").textContent = num(s.counters.good);
  $("kpi-ng").textContent = num(s.counters.ng);
  $("kpi-cycle").textContent = s.cycle_time_avg_s ? `${s.cycle_time_avg_s.toFixed(1)} s` : "–";
  $("ng-rate-hero").textContent = s.counters.total ? pct(s.ng_rate) : "–";
  $("ng-rate-note").textContent = s.counters.total ? t("trend.note", { n: Math.min(s.counters.total, 50) }) : "";
}

function renderFlow() {
  const phase = state.snap?.running && !state.snap?.standby ? state.snap.phase : null;
  document.querySelectorAll(".flow li").forEach((li) => li.classList.toggle("active", li.dataset.phase === phase));
}

// ── charts ─────────────────────────────────────────────────────────────────
function renderTrend() {
  lineChart($("trend-chart"), state.trend, {
    format: (v, d) => pct(v, d),
    timeLabel: (d, long) => (long ? timeLong(d) : timeShort(d)),
    seriesLabel: t("trend.title"),
    emptyText: t("trend.empty"),
  });
  const wrap = $("trend-table");
  if (!wrap.hidden) {
    const rows = [...state.trend].reverse().slice(0, 60).map((p) =>
      h("tr", {}, h("td", { class: "num" }, timeLong(p.t)), h("td", { class: "num" }, pct(p.v))));
    wrap.replaceChildren(h("table", { class: "table" },
      h("thead", {}, h("tr", {}, h("th", {}, t("chart.time")), h("th", {}, t("trend.title")))),
      h("tbody", {}, rows)));
  }
}

function renderDefects() {
  const insp = state.inspections;
  const counts = new Map();
  for (const i of insp) {
    if (i.result.passed) continue;
    const code = i.result.defect_code || "?";
    counts.set(code, (counts.get(code) || 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([code, n]) => {
    const label = state.meta?.defect_codes[code] ? pick(state.meta.defect_codes[code], "label") : code;
    return { label, value: n, title: `${label} (${code})` };
  });
  barChart($("defect-chart"), rows, {
    emptyText: insp.length ? t("defects.none", { n: insp.length }) : t("trend.empty"),
  });
}

// ── controls ───────────────────────────────────────────────────────────────
function buildParams() {
  const box = $("params");
  box.replaceChildren();
  for (const [name, spec] of Object.entries(state.meta.params)) {
    const id = `param-${name}`;
    const out = h("output", { for: id });
    const input = h("input", {
      type: "range", id, min: spec.min, max: spec.max, step: spec.step, value: spec.default,
      "data-param": name,
    });
    input.addEventListener("input", () => { state.editing.add(name); out.textContent = fmtParam(name, input.value); });
    input.addEventListener("change", () => setParam(name, input));
    box.append(h("div", { class: "param" },
      h("label", { for: id }, h("span", { "data-param-label": name }, paramLabel(name)), out),
      input,
      h("div", { class: "range-ends" }, h("span", {}, fmtParam(name, spec.min)), h("span", {}, fmtParam(name, spec.max)))));
    out.textContent = fmtParam(name, spec.default);
  }
}

function syncParams() {
  if (!state.snap) return;
  document.querySelectorAll("input[data-param]").forEach((input) => {
    const name = input.dataset.param;
    if (state.editing.has(name) || document.activeElement === input) return;
    const v = state.snap.params[name];
    if (v === undefined || Number(input.value) === v) return;
    input.value = v;
    input.parentElement.querySelector("output").textContent = fmtParam(name, v);
  });
}

async function setParam(name, input) {
  try {
    await api("/api/control", { method: "POST", body: { action: "set_param", name, value: Number(input.value) } });
    $("controls-msg").className = "form-msg";
    $("controls-msg").textContent = `${t("controls.saved")}: ${paramLabel(name)} = ${fmtParam(name, input.value)}`;
    refreshAudit();
  } catch (err) {
    $("controls-msg").className = "form-msg error";
    $("controls-msg").textContent = errorText(err);
  } finally {
    state.editing.delete(name);
  }
}

async function control(action, extra = {}) {
  try {
    await api("/api/control", { method: "POST", body: { action, ...extra } });
    $("controls-msg").textContent = "";
    refreshAudit();
  } catch (err) {
    $("controls-msg").className = "form-msg error";
    $("controls-msg").textContent = errorText(err);
  }
}

function buildFaultSelect() {
  const sel = $("fault-select");
  sel.replaceChildren(...state.meta.faults.map((f) => h("option", { value: f }, faultName(f))));
}

function renderFaultInfo() {
  const faults = state.snap?.faults || [];
  $("fault-active").textContent = state.user
    ? (faults.length ? t("controls.active", { f: faults.map(faultName).join(", ") }) : t("controls.noFault"))
    : "";
}

function renderAuth() {
  const loggedIn = Boolean(state.user);
  $("login-btn").hidden = loggedIn;
  $("logout-btn").hidden = !loggedIn;
  $("user-name").hidden = !loggedIn;
  $("user-name").textContent = loggedIn ? state.user.display_name : "";
  const card = $("controls-card");
  card.classList.toggle("locked", !loggedIn);
  $("controls-lock").textContent = t(loggedIn ? "controls.unlocked" : "controls.locked");
  card.querySelectorAll("button, input, select").forEach((c) => { c.disabled = !loggedIn; });
  renderFaultInfo();
  renderAi();
}

// ── AI assistant ───────────────────────────────────────────────────────────
async function askAi() {
  state.asking = true;
  $("ai-ask").disabled = true;
  const msg = $("ai-msg");
  msg.className = "form-msg";
  msg.replaceChildren(h("span", { class: "spinner", "aria-hidden": "true" }), t("ai.thinking"));
  try {
    await api("/api/ai/ask", { method: "POST" });
    msg.textContent = "";
  } catch (err) {
    msg.className = "form-msg error";
    msg.textContent = errorText(err);
  } finally {
    state.asking = false;
    $("ai-ask").disabled = false;
    await Promise.all([refreshSuggestions(), refreshQuota()]);
  }
}

async function decide(id, decision) {
  try {
    await api(`/api/ai/suggestions/${encodeURIComponent(id)}/${decision}`, { method: "POST" });
    $("ai-msg").textContent = "";
  } catch (err) {
    $("ai-msg").className = "form-msg error";
    $("ai-msg").textContent = errorText(err);
  }
  await Promise.all([refreshSuggestions(), refreshAudit()]);
}

function statusBadge(status) {
  return h("span", { class: `status-badge ${status}` }, t(`ai.status.${status}`));
}

function renderSuggestion(s) {
  const asked = s.asked_by === "visitor" ? t("ai.visitor") : s.asked_by;
  const head = h("div", { class: "suggestion-head" },
    statusBadge(s.status),
    h("span", { class: "hint" }, `${dateTime(toDate(s.ts))} · ${t("ai.askedBy", { u: asked })}`));

  const changes = s.actions.length
    ? h("table", { class: "table change-table" }, h("tbody", {}, s.actions.map((a) =>
        h("tr", {}, h("td", {}, paramLabel(a.name)),
          h("td", { class: "num" }, fmtParam(a.name, a.old)), h("td", { class: "arrow" }, "→"),
          h("td", { class: "num" }, h("strong", {}, fmtParam(a.name, a.value)))))))
    : h("p", { class: "muted" }, t("ai.noChanges"));

  // Older suggestions stored one English list; newer ones store {en, tc}.
  const notes = Array.isArray(s.evidence_notes) ? s.evidence_notes
    : (s.evidence_notes?.[getLang()]?.length ? s.evidence_notes[getLang()] : s.evidence_notes?.en || []);
  const parts = [
    head,
    h("p", { class: "diag" }, pick(s.diagnosis)),
    notes.length ? h("h3", {}, t("ai.evidence")) : null,
    notes.length ? h("ul", {}, notes.map((e) => h("li", {}, e))) : null,
    h("h3", {}, t("ai.changes")),
    changes,
    s.validation_errors.length ? h("p", { class: "muted" }, t("ai.dropped", { e: s.validation_errors.join("; ") })) : null,
    h("h3", {}, t("ai.recommendation")),
    h("p", { class: "rec" }, pick(s.recommendation)),
    typeof s.confidence === "number" ? h("p", { class: "muted" }, t("ai.confidence", { c: Math.round(s.confidence * 100) })) : null,
  ];

  if (s.status === "pending") {
    const loggedIn = Boolean(state.user);
    parts.push(h("div", { class: "btn-row" },
      h("button", { type: "button", class: "btn", disabled: !loggedIn, onclick: () => decide(s.id, "approve") }, t("ai.approve")),
      h("button", { type: "button", class: "btn danger", disabled: !loggedIn, onclick: () => decide(s.id, "reject") }, t("ai.reject"))));
    parts.push(h("p", { class: "muted" },
      loggedIn ? t("ai.expires", { t: timeShort(toDate(s.expires_at)) }) : t("ai.loginToApprove")));
  } else if (s.decided_by) {
    parts.push(h("p", { class: "muted" }, t("ai.decidedBy", { s: t(`ai.status.${s.status}`), u: s.decided_by })));
  }
  return parts.filter(Boolean);
}

function renderAi() {
  const list = state.suggestions;
  const box = $("ai-suggestion");
  if (!list.length) {
    box.hidden = true;
  } else {
    box.hidden = false;
    box.replaceChildren(...renderSuggestion(list[0]));
  }
  $("ai-history-list").replaceChildren(...list.slice(1).map((s) =>
    h("li", {}, statusBadge(s.status), " ", `${dateTime(toDate(s.ts))} · `, pick(s.diagnosis))));
  $("ai-history-list").closest("details").hidden = list.length < 2;

  const q = state.quota;
  if (q && !q.configured) {
    $("ai-quota").textContent = t("ai.unavailable");
    $("ai-ask").disabled = true;
  } else if (q) {
    $("ai-quota").textContent = state.user && q.team_exempt ? t("ai.quotaTeam") : t("ai.quota", { r: q.remaining, l: q.limit });
    $("ai-ask").disabled = state.asking || (!state.user && q.remaining <= 0);
  }
}

// ── audit log ──────────────────────────────────────────────────────────────
function auditText(a) {
  const d = a.details || {};
  switch (a.action) {
    case "set_param": return `${paramLabel(d.name)}: ${fmtParam(d.name, d.old)} → ${fmtParam(d.name, d.new)}`;
    case "inject_fault": return t("action.inject_fault", { f: faultName(d.kind) });
    case "fault": return t("action.fault", { m: d.message || "" });
    case "approve_suggestion":
    case "reject_suggestion": {
      const n = (d.actions || []).map((x) => `${paramLabel(x.name)} → ${fmtParam(x.name, x.value)}`).join(", ");
      return t(`action.${a.action}`) + (n ? `: ${n}` : "");
    }
    default: return t(`action.${a.action}`);
  }
}

function renderAudit() {
  const tbody = $("audit-table").querySelector("tbody");
  if (!state.audit.length) {
    tbody.replaceChildren(h("tr", {}, h("td", { colspan: 4, class: "muted" }, t("audit.empty"))));
    return;
  }
  tbody.replaceChildren(...state.audit.map((a) => h("tr", {},
    h("td", { class: "num" }, dateTime(toDate(a.ts))),
    h("td", {}, a.actor),
    h("td", {}, h("span", { class: a.source === "ai" ? "badge ai" : "badge" }, t(`source.${a.source}`))),
    h("td", {}, auditText(a)))));
}

// ── data refresh ───────────────────────────────────────────────────────────
async function refreshInspections() {
  try { state.inspections = await api("/api/history/inspections?limit=50"); renderDefects(); } catch { /* shown via conn pill */ }
}
async function refreshAudit() {
  try { state.audit = await api("/api/history/audit?limit=30"); renderAudit(); } catch { /* shown via conn pill */ }
}
async function refreshSuggestions() {
  try { state.suggestions = await api("/api/ai/suggestions?limit=10"); renderAi(); } catch { /* shown via conn pill */ }
}
async function refreshQuota() {
  try { state.quota = await api("/api/ai/quota"); renderAi(); } catch { /* shown via conn pill */ }
}
async function loadTrendHistory() {
  try {
    const rows = await api(`/api/history/readings?minutes=${cfg.trendMinutes}&limit=500`);
    state.trend = rows.reverse().map((r) => ({ t: toDate(r.ts), v: r.ng_rate }));
  } catch { state.trend = []; }
  renderTrend();
}
async function ensureMeta() {
  if (state.meta) return;
  try {
    state.meta = await api("/api/meta");
    buildParams();
    buildFaultSelect();
    renderAuth();
  } catch { /* server unreachable; retried on the next refresh */ }
}
function refreshAll() {
  return Promise.all([ensureMeta(), refreshInspections(), refreshAudit(), refreshSuggestions(), refreshQuota()]);
}

// ── 3D twin ────────────────────────────────────────────────────────────────
function renderTwinOverlay() {
  const overlay = $("twin-overlay");
  overlay.hidden = state.twin === "started";
  const text = { loading: "twin.loading", missing: "twin.unavailable", failed: "twin.failed" }[state.twin];
  if (text) $("twin-overlay-text").textContent = t(text);
}

async function initTwin() {
  const bar = $("twin-progress-bar");
  $("twin-progress").hidden = false;
  state.twin = await startUnity($("unity-canvas"), (p) => { bar.style.width = `${Math.round(p * 100)}%`; });
  $("twin-progress").hidden = true;
  renderTwinOverlay();
}

// ── login dialog ───────────────────────────────────────────────────────────
function bindLogin() {
  const dlg = $("login-dialog");
  $("login-btn").addEventListener("click", () => { $("login-error").textContent = ""; dlg.showModal(); });
  $("login-cancel").addEventListener("click", () => dlg.close());
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    $("login-submit").disabled = true;
    try {
      state.user = await login(String(form.get("username")), String(form.get("password")));
      e.target.reset();
      dlg.close();
      renderAuth();
      refreshQuota();
    } catch (err) {
      $("login-error").textContent = err.status === 401 ? err.message : errorText(err);
    } finally {
      $("login-submit").disabled = false;
    }
  });
  $("logout-btn").addEventListener("click", () => { logout(); state.user = null; renderAuth(); });
  setUnauthorizedHandler(() => {
    state.user = null;
    renderAuth();
    $("controls-msg").className = "form-msg error";
    $("controls-msg").textContent = t("auth.expired");
  });
}

function bindControls() {
  document.querySelectorAll("[data-action]").forEach((b) => b.addEventListener("click", () => control(b.dataset.action)));
  $("fault-inject").addEventListener("click", () => control("inject_fault", { kind: $("fault-select").value }));
  $("fault-clear").addEventListener("click", () => control("clear_faults"));
  $("ai-ask").addEventListener("click", askAi);
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
  document.querySelectorAll("[data-table-toggle]").forEach((b) => b.addEventListener("click", () => {
    const target = $(b.dataset.tableToggle);
    target.hidden = !target.hidden;
    b.textContent = t(target.hidden ? "chart.showTable" : "chart.hideTable");
    renderTrend();
  }));
}

function rerenderAll() {
  if (state.meta) {
    buildFaultSelect();
    document.querySelectorAll("[data-param-label]").forEach((s) => { s.textContent = paramLabel(s.dataset.paramLabel); });
  }
  renderAuth();
  if (state.conn) setConn(state.conn);
  renderStatus();
  renderKpis();
  renderTrend();
  renderDefects();
  renderAudit();
  renderTwinOverlay();
  const toggle = document.querySelector("[data-table-toggle]");
  toggle.textContent = t($(toggle.dataset.tableToggle).hidden ? "chart.showTable" : "chart.hideTable");
}

async function main() {
  initLang();
  bindLogin();
  bindControls();
  onLangChange(rerenderAll);
  renderAuth();
  renderTwinOverlay();
  initTwin();

  await ensureMeta();
  if (!state.meta) setConn("offline");
  connectLive(onSnapshot, setConn);
  await Promise.all([loadTrendHistory(), refreshAll()]);
  setInterval(refreshAll, cfg.pollSeconds * 1000);

  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { renderTrend(); renderDefects(); }, 150);
  }).observe($("trend-chart"));
}

main();
