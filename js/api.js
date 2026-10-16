// Talks to the twin backend: REST calls (with the team login token) and the live WebSocket.
const cfg = window.TWIN_CONFIG;
const apiBase = (new URLSearchParams(location.search).get("api") || cfg.apiBase).replace(/\/$/, "");

let token = null;
try { token = sessionStorage.getItem("twin.token"); } catch { /* storage unavailable */ }
let onUnauthorized = () => {};

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function setUnauthorizedHandler(fn) { onUnauthorized = fn; }
export function hasToken() { return Boolean(token); }

function saveToken(value) {
  token = value;
  try {
    if (value) sessionStorage.setItem("twin.token", value);
    else sessionStorage.removeItem("twin.token");
  } catch { /* storage unavailable */ }
}

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let resp;
  try {
    resp = await fetch(apiBase + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, "network");
  }
  const data = await resp.json().catch(() => ({}));
  if (resp.status === 401 && token && path !== "/api/auth/login") {
    saveToken(null);
    onUnauthorized();
  }
  if (!resp.ok) throw new ApiError(resp.status, typeof data.detail === "string" ? data.detail : resp.statusText);
  return data;
}

export async function login(username, password) {
  const data = await api("/api/auth/login", { method: "POST", body: { username, password } });
  saveToken(data.token);
  try { sessionStorage.setItem("twin.user", JSON.stringify(data.user)); } catch { /* storage unavailable */ }
  return data.user;
}

export function logout() {
  saveToken(null);
  try { sessionStorage.removeItem("twin.user"); } catch { /* storage unavailable */ }
}

export function savedUser() {
  if (!token) return null;
  try { return JSON.parse(sessionStorage.getItem("twin.user") || "null"); } catch { return null; }
}

// Live state stream with automatic reconnect. onMessage(raw, parsed), onStatus("live"|"offline").
export function connectLive(onMessage, onStatus) {
  const url = apiBase.replace(/^http/, "ws") + "/ws/state";
  let delay = 1000;
  const open = () => {
    const ws = new WebSocket(url);
    ws.onopen = () => { delay = 1000; onStatus("live"); };
    ws.onmessage = (e) => {
      let parsed;
      try { parsed = JSON.parse(e.data); } catch { return; }
      onMessage(e.data, parsed);
    };
    ws.onclose = () => {
      onStatus("offline");
      setTimeout(open, delay);
      delay = Math.min(delay * 2, 15000);
    };
    ws.onerror = () => ws.close();
  };
  open();
}
