// Small hand-drawn SVG charts: a single-series line (with crosshair tooltip) and
// horizontal bars (per-bar tooltip). Thin marks, hairline grid, text in ink tokens.
const NS = "http://www.w3.org/2000/svg";
const ACCENT = "#0050CC";
const tooltip = () => document.getElementById("tooltip");

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function showTip(x, y, value, label) {
  const tip = tooltip();
  tip.replaceChildren();
  const v = document.createElement("span");
  v.className = "tt-value";
  v.textContent = value;
  const key = document.createElement("span");
  key.className = "tt-key";
  const l = document.createElement("span");
  l.textContent = label;
  tip.append(v, key, l);
  tip.hidden = false;
  const r = tip.getBoundingClientRect();
  const left = Math.min(x + 14, window.innerWidth - r.width - 8);
  const top = y - r.height - 12 < 8 ? y + 16 : y - r.height - 12;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideTip() { tooltip().hidden = true; }

// Clean gridlines: pick a round step so there are at most 5 intervals, then round the top up.
function niceScale(maxValue) {
  const target = Math.max(maxValue * 1.1, 0.04);
  const step = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25].find((s) => target / s <= 5) ?? 0.25;
  const max = Math.min(Math.ceil(target / step) * step, 1);
  return { max, step };
}

// points: [{t: Date, v: number 0..1}]
export function lineChart(container, points, { height = 180, format, timeLabel, seriesLabel, emptyText }) {
  const width = Math.max(container.clientWidth, 260);
  const m = { top: 10, right: 44, bottom: 24, left: 40 };
  const w = width - m.left - m.right, h = height - m.top - m.bottom;
  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": seriesLabel });
  container.replaceChildren(svg);

  if (points.length < 2) {
    el("text", { x: width / 2, y: height / 2, "text-anchor": "middle", class: "empty" }, svg).textContent = emptyText;
    return;
  }
  const t0 = points[0].t.getTime(), t1 = points[points.length - 1].t.getTime();
  const { max: yMax, step } = niceScale(Math.max(...points.map((p) => p.v)));
  const x = (t) => m.left + ((t - t0) / Math.max(t1 - t0, 1)) * w;
  const y = (v) => m.top + h - (v / yMax) * h;

  const grid = el("g", { class: "grid" }, svg);
  const axis = el("g", { class: "axis" }, svg);
  for (let i = 0; i * step <= yMax + 1e-9; i++) {
    const v = i * step;
    el("line", { x1: m.left, x2: m.left + w, y1: y(v), y2: y(v) }, grid);
    el("text", { x: m.left - 6, y: y(v) + 4, "text-anchor": "end" }, axis).textContent = format(v, 0);
  }
  for (const frac of [0, 0.5, 1]) {
    const t = t0 + (t1 - t0) * frac;
    el("text", { x: x(t), y: height - 6, "text-anchor": frac === 0 ? "start" : frac === 1 ? "end" : "middle" }, axis)
      .textContent = timeLabel(new Date(t));
  }

  const d = points.map((p, i) => `${i ? "L" : "M"}${x(p.t.getTime()).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  el("path", { d: `${d}L${x(t1)},${y(0)}L${x(t0)},${y(0)}Z`, fill: ACCENT, "fill-opacity": 0.1, stroke: "none" }, svg);
  el("path", { d, fill: "none", stroke: ACCENT, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
  const last = points[points.length - 1];
  el("circle", { cx: x(t1), cy: y(last.v), r: 4, fill: ACCENT, stroke: "#fff", "stroke-width": 2 }, svg);
  el("text", { x: x(t1) + 8, y: y(last.v) + 4, class: "bar-value" }, svg).textContent = format(last.v, 1);

  // Crosshair: snaps to the nearest point; hit area is the whole plot.
  const cross = el("line", { class: "crosshair", y1: m.top, y2: m.top + h, visibility: "hidden" }, svg);
  const dot = el("circle", { r: 4, fill: ACCENT, stroke: "#fff", "stroke-width": 2, visibility: "hidden" }, svg);
  const hit = el("rect", { x: m.left, y: m.top, width: w, height: h, fill: "transparent", tabindex: 0 }, svg);
  const nearest = (clientX) => {
    const r = svg.getBoundingClientRect();
    const px = ((clientX - r.left) / r.width) * width;
    let best = points[0], bd = Infinity;
    for (const p of points) {
      const dd = Math.abs(x(p.t.getTime()) - px);
      if (dd < bd) { bd = dd; best = p; }
    }
    return best;
  };
  const show = (p, clientX, clientY) => {
    const px = x(p.t.getTime());
    cross.setAttribute("x1", px); cross.setAttribute("x2", px); cross.setAttribute("visibility", "visible");
    dot.setAttribute("cx", px); dot.setAttribute("cy", y(p.v)); dot.setAttribute("visibility", "visible");
    showTip(clientX, clientY, format(p.v, 1), `${seriesLabel} · ${timeLabel(p.t, true)}`);
  };
  hit.addEventListener("pointermove", (e) => show(nearest(e.clientX), e.clientX, e.clientY));
  hit.addEventListener("pointerleave", () => { cross.setAttribute("visibility", "hidden"); dot.setAttribute("visibility", "hidden"); hideTip(); });
  hit.addEventListener("focus", () => {
    const r = svg.getBoundingClientRect();
    show(last, r.right - 40, r.top + 20);
  });
  hit.addEventListener("blur", hideTip);
}

// rows: [{label, value, title}] sorted by value desc.
export function barChart(container, rows, { emptyText, valueFormat = String }) {
  const width = Math.max(container.clientWidth, 260);
  if (!rows.length) {
    const svg = el("svg", { viewBox: `0 0 ${width} 60` });
    el("text", { x: width / 2, y: 34, "text-anchor": "middle", class: "empty" }, svg).textContent = emptyText;
    container.replaceChildren(svg);
    return;
  }
  const labelW = Math.min(150, width * 0.42), valueW = 36, barH = 18, gap = 12;
  const height = rows.length * (barH + gap);
  const w = width - labelW - valueW - 8;
  const max = Math.max(...rows.map((r) => r.value));
  const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, role: "img" });
  rows.forEach((row, i) => {
    const yy = i * (barH + gap) + gap / 2;
    el("text", { x: 0, y: yy + barH / 2 + 4, class: "bar-label" }, svg).textContent = row.label;
    const bw = Math.max((row.value / max) * w, 4);
    const r = Math.min(4, bw / 2);
    // Square at the baseline, 4px rounded data-end.
    const path = `M${labelW},${yy}h${bw - r}a${r},${r} 0 0 1 ${r},${r}v${barH - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${bw - r}Z`;
    const bar = el("path", { d: path, fill: ACCENT, class: "bar", tabindex: 0 }, svg);
    el("text", { x: labelW + bw + 6, y: yy + barH / 2 + 4, class: "bar-value" }, svg).textContent = valueFormat(row.value);
    const hitArea = el("rect", { x: 0, y: yy - gap / 2, width, height: barH + gap, fill: "transparent" }, svg);
    for (const target of [bar, hitArea]) {
      target.addEventListener("pointermove", (e) => showTip(e.clientX, e.clientY, valueFormat(row.value), row.title || row.label));
      target.addEventListener("pointerleave", hideTip);
    }
    bar.addEventListener("focus", () => {
      const b = bar.getBoundingClientRect();
      showTip(b.right, b.top, valueFormat(row.value), row.title || row.label);
    });
    bar.addEventListener("blur", hideTip);
  });
  container.replaceChildren(svg);
}
