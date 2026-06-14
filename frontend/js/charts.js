/* ============================================================
   charts.js — Grafik ringan berbasis Canvas (tanpa library)
   Mendukung line & bar chart, responsif & sadar tema.
   ============================================================ */
(function (Kas) {
  function css(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  function prep(canvas, h) {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
    canvas.width = w * ratio; canvas.height = h * ratio;
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    return { ctx, w, h };
  }
  const niceMax = (max) => {
    if (max <= 0) return 10;
    const pow = Math.pow(10, Math.floor(Math.log10(max)));
    const n = max / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * pow;
  };
  const shortNum = (n) => {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "jt";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + "rb";
    return String(n);
  };

  function axes(ctx, w, h, pad, labels, max, ticks) {
    const grid = css("--border"), muted = css("--text-muted");
    ctx.strokeStyle = grid; ctx.fillStyle = muted; ctx.lineWidth = 1;
    ctx.font = "11px Segoe UI, sans-serif"; ctx.textBaseline = "middle";
    for (let i = 0; i <= ticks; i++) {
      const y = pad.t + (h - pad.t - pad.b) * (i / ticks);
      const val = max * (1 - i / ticks);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.textAlign = "right"; ctx.fillText(shortNum(Math.round(val)), pad.l - 8, y);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    const plotW = w - pad.l - pad.r;
    labels.forEach((lb, i) => {
      const x = labels.length === 1 ? pad.l + plotW / 2 : pad.l + plotW * (i / (labels.length - 1));
      ctx.fillText(lb, x, h - pad.b + 8);
    });
  }

  function line(canvas, { labels, datasets }) {
    const { ctx, w, h } = prep(canvas, 240);
    const pad = { l: 46, r: 16, t: 16, b: 28 };
    const max = niceMax(Math.max(1, ...datasets.flatMap((d) => d.data)));
    axes(ctx, w, h, pad, labels, max, 4);
    const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
    datasets.forEach((ds) => {
      const color = ds.color || css("--accent");
      const pts = ds.data.map((v, i) => [
        labels.length === 1 ? pad.l + plotW / 2 : pad.l + plotW * (i / (labels.length - 1)),
        pad.t + plotH * (1 - v / max),
      ]);
      // area
      const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
      grad.addColorStop(0, color + "55"); grad.addColorStop(1, color + "05");
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.lineTo(pts[pts.length - 1][0], h - pad.b); ctx.lineTo(pts[0][0], h - pad.b); ctx.closePath();
      ctx.fillStyle = grad; ctx.fill();
      // line
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();
      // dots
      pts.forEach((p) => { ctx.beginPath(); ctx.arc(p[0], p[1], 3.5, 0, 7); ctx.fillStyle = color; ctx.fill(); });
    });
  }

  function bar(canvas, { labels, datasets }) {
    const { ctx, w, h } = prep(canvas, 240);
    const pad = { l: 46, r: 16, t: 16, b: 28 };
    const max = niceMax(Math.max(1, ...datasets.flatMap((d) => d.data)));
    axes(ctx, w, h, pad, labels, max, 4);
    const plotW = w - pad.l - pad.r, plotH = h - pad.t - pad.b;
    const groups = labels.length; const slot = plotW / groups;
    const n = datasets.length; const bw = Math.min(36, (slot * 0.6) / n);
    labels.forEach((_, gi) => {
      datasets.forEach((ds, di) => {
        const v = ds.data[gi] || 0;
        const x = pad.l + slot * gi + slot / 2 - (n * bw) / 2 + di * bw;
        const bh = plotH * (v / max);
        ctx.fillStyle = ds.color || css("--accent");
        const y = pad.t + plotH - bh; const r = Math.min(4, bw / 2);
        ctx.beginPath();
        ctx.moveTo(x, y + bh); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.lineTo(x + bw - r, y); ctx.quadraticCurveTo(x + bw, y, x + bw, y + r);
        ctx.lineTo(x + bw, y + bh); ctx.closePath(); ctx.fill();
      });
    });
  }

  const registry = [];
  function render(canvas, type, data) {
    const fn = type === "bar" ? bar : line;
    fn(canvas, data);
    if (!registry.find((r) => r.canvas === canvas)) registry.push({ canvas, type, data });
  }
  // redraw on resize / theme change
  let raf;
  function redrawAll() { registry.forEach((r) => { if (document.body.contains(r.canvas)) (r.type === "bar" ? bar : line)(r.canvas, r.data); }); }
  window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(redrawAll); });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-theme-toggle]")) setTimeout(redrawAll, 50); });

  Kas.chart = { line: (c, d) => render(c, "line", d), bar: (c, d) => render(c, "bar", d), redrawAll, reset: () => (registry.length = 0) };
})(window.Kas);
