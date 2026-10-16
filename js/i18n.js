// English / Traditional Chinese (formal written, to match 3formhk.com/tc).
const DICT = {
  "app.title": ["Inspection Cell Digital Twin", "檢測工作站數碼孿生"],
  "auth.login": ["Team login", "團隊登入"],
  "auth.logout": ["Log out", "登出"],
  "auth.title": ["Team login", "團隊登入"],
  "auth.username": ["Username", "用戶名稱"],
  "auth.password": ["Password", "密碼"],
  "auth.cancel": ["Cancel", "取消"],
  "auth.submit": ["Log in", "登入"],
  "auth.failed": ["Login failed", "登入失敗"],
  "auth.expired": ["Your login has expired. Please log in again.", "登入已逾時，請重新登入。"],

  "status.connecting": ["Connecting…", "連線中…"],
  "status.live": ["Live", "即時連線"],
  "status.offline": ["Offline, retrying…", "離線，正在重試…"],
  "state.running": ["Running", "運行中"],
  "state.stopped": ["Stopped", "已停止"],
  "state.standby": ["Standby", "待機"],
  "state.fault": ["Fault", "故障"],
  "status.viewers": ["{n} watching", "{n} 人觀看中"],

  "twin.title": ["Live 3D twin", "即時三維孿生"],
  "twin.hint": ["Drag to rotate · scroll or pinch to zoom", "拖曳旋轉．滾動或雙指縮放"],
  "twin.loading": ["Loading 3D view…", "正在載入三維畫面…"],
  "twin.unavailable": ["The 3D view is not published yet. All live data below is real-time from the simulator.", "三維畫面尚未發布。以下所有數據均為模擬器的即時數據。"],
  "twin.failed": ["The 3D view could not start on this device.", "此裝置未能啟動三維畫面。"],

  "phase.feeding": ["Conveyor feed", "輸送帶送料"],
  "phase.picking": ["Suction pick", "真空吸取"],
  "phase.placing": ["Place on stand", "放上檢測台"],
  "phase.scanning": ["Camera scan", "相機掃描"],
  "phase.sorting": ["Sort to bin", "分揀入箱"],
  "phase.idle": ["Idle", "閒置"],
  "phase.fault": ["Fault", "故障"],

  "kpi.total": ["Parts inspected", "已檢測件數"],
  "kpi.good": ["Good", "良品"],
  "kpi.ng": ["Rejected (NG)", "不良品 (NG)"],
  "kpi.cycle": ["Avg cycle time", "平均週期時間"],

  "trend.title": ["NG rate", "不良率"],
  "trend.sub": ["Rolling, last 50 parts · past 30 min", "最近 50 件滾動計算．過去 30 分鐘"],
  "trend.note": ["of the last {n} parts rejected", "最近 {n} 件中被剔除的比例"],
  "trend.empty": ["Collecting data…", "正在收集數據…"],
  "chart.showTable": ["Show as table", "以表格顯示"],
  "chart.hideTable": ["Hide table", "隱藏表格"],
  "chart.time": ["Time", "時間"],

  "defects.title": ["Reject reasons", "剔除原因"],
  "defects.sub": ["Last 50 parts", "最近 50 件"],
  "defects.none": ["No rejects in the last {n} parts", "最近 {n} 件沒有不良品"],
  "defects.parts": ["{n} parts", "{n} 件"],

  "controls.title": ["Machine controls", "機器控制"],
  "controls.locked": ["🔒 Team login required", "🔒 需要團隊登入"],
  "controls.unlocked": ["Logged in: changes are recorded", "已登入：所有更改均會記錄"],
  "controls.start": ["Start", "啟動"],
  "controls.stop": ["Stop", "停止"],
  "controls.reset": ["Reset counters", "重設計數"],
  "controls.faultTitle": ["Demo: inject a fault", "示範：注入故障"],
  "controls.faultHelp": ["Visitors are not told which fault is active. The AI must work it out from the data.", "訪客不會知道注入了哪種故障，AI 必須從數據中自行判斷。"],
  "controls.inject": ["Inject", "注入"],
  "controls.clear": ["Clear faults", "清除故障"],
  "controls.active": ["Active fault: {f}", "現有故障：{f}"],
  "controls.noFault": ["No fault active", "沒有故障"],
  "controls.saved": ["Saved", "已儲存"],
  "fault.lighting_drift": ["Lighting drift", "光線漂移"],
  "fault.bad_material_batch": ["Bad material batch", "不良物料批次"],

  "ai.title": ["AI process assistant", "AI 製程助理"],
  "ai.intro": ["The AI studies the last 50 parts and proposes setting changes. Nothing changes until a team member approves.", "AI 會分析最近 50 件產品並建議參數調整。所有更改均須經團隊成員批准後方會生效。"],
  "ai.ask": ["Ask AI for a diagnosis", "請 AI 診斷"],
  "ai.thinking": ["AI is analysing the last 50 parts…", "AI 正在分析最近 50 件產品…"],
  "ai.quota": ["{r} of {l} visitor questions left today", "今日訪客提問尚餘 {r} / {l} 次"],
  "ai.quotaTeam": ["Team: unlimited questions", "團隊：不限提問次數"],
  "ai.unavailable": ["AI assistant is not configured on the server", "伺服器未設定 AI 助理"],
  "ai.evidence": ["Evidence", "依據"],
  "ai.changes": ["Proposed changes", "建議更改"],
  "ai.noChanges": ["No machine changes proposed.", "不建議更改機器設定。"],
  "ai.recommendation": ["Recommendation", "建議"],
  "ai.confidence": ["Confidence {c}%", "信心 {c}%"],
  "ai.approve": ["Approve and apply", "批准並套用"],
  "ai.reject": ["Reject", "拒絕"],
  "ai.loginToApprove": ["A team member must log in to approve.", "須由團隊成員登入後批准。"],
  "ai.expires": ["Expires {t}", "{t} 到期"],
  "ai.decidedBy": ["{s} by {u}", "由 {u} {s}"],
  "ai.askedBy": ["Asked by {u}", "提問者：{u}"],
  "ai.history": ["Earlier suggestions", "較早的建議"],
  "ai.visitor": ["a visitor", "訪客"],
  "ai.dropped": ["Discarded (outside safe range): {e}", "已捨棄（超出安全範圍）：{e}"],
  "ai.status.pending": ["Awaiting approval", "等待批准"],
  "ai.status.approved": ["Approved", "已批准"],
  "ai.status.rejected": ["Rejected", "已拒絕"],
  "ai.status.expired": ["Expired", "已過期"],

  "audit.title": ["Change log", "更改記錄"],
  "audit.sub": ["Every change, who made it, and whether the AI proposed it", "每項更改、操作者，以及是否由 AI 建議"],
  "audit.time": ["Time", "時間"],
  "audit.who": ["Who", "操作者"],
  "audit.source": ["Source", "來源"],
  "audit.change": ["Change", "更改內容"],
  "audit.empty": ["No changes yet", "暫無更改"],
  "source.manual": ["Manual", "人手"],
  "source.ai": ["AI-proposed", "AI 建議"],
  "source.machine": ["Machine", "機器"],
  "action.start": ["Started the machine", "啟動機器"],
  "action.stop": ["Stopped the machine", "停止機器"],
  "action.reset_counters": ["Reset counters", "重設計數"],
  "action.inject_fault": ["Injected fault: {f}", "注入故障：{f}"],
  "action.clear_faults": ["Cleared faults", "清除故障"],
  "action.approve_suggestion": ["Approved AI suggestion", "批准 AI 建議"],
  "action.reject_suggestion": ["Rejected AI suggestion", "拒絕 AI 建議"],
  "action.fault": ["Machine fault: {m}", "機器故障：{m}"],

  "footer.note": ["Simulated machine: robot, conveyor and camera are simulated; inspection is rule-based until the real vision model is connected. AI suggestions by DeepSeek.", "模擬機器：機械臂、輸送帶及相機均為模擬；在接入真實視覺模型前，檢測採用規則判斷。AI 建議由 DeepSeek 提供。"],
  "footer.back": ["Back to all demos", "返回所有示範"],
  "error.network": ["Cannot reach the server", "無法連接伺服器"],
};

let lang = "en";
const listeners = [];

export function getLang() { return lang; }

export function setLang(next) {
  lang = next === "tc" ? "tc" : "en";
  document.documentElement.lang = lang === "tc" ? "zh-HK" : "en";
  try { localStorage.setItem("twin.lang", lang); } catch { /* storage unavailable */ }
  applyStatic();
  listeners.forEach((fn) => fn(lang));
}

export function initLang() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem("twin.lang"); } catch { /* storage unavailable */ }
  setLang(fromUrl || saved || "en");
}

export function onLangChange(fn) { listeners.push(fn); }

// t("key", {n: 3}) -> text in the current language with {placeholders} filled.
export function t(key, vars = {}) {
  const entry = DICT[key];
  let s = entry ? entry[lang === "tc" ? 1 : 0] : key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

// Pick the right half of a {en, tc} or {label_en, label_tc} object from the API.
export function pick(obj, base = "") {
  if (!obj) return "";
  if (base) return obj[`${base}_${lang}`] ?? obj[`${base}_en`] ?? "";
  return obj[lang] || obj.en || "";
}

function applyStatic() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.title = `${t("app.title")} | 3form Engineering Co`;
}
