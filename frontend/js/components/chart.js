/* ============================================================
   components/chart.js — Helper komponen chart
   Wrapper kecil: membuat <canvas> + legend dan memanggil Kas.chart.
   ============================================================ */
(function (Kas) {
  function build(container, { type = "line", labels, datasets }) {
    const box = Kas.dom.el("div", { class: "chart-box" });
    const canvas = Kas.dom.el("canvas");
    box.appendChild(canvas);
    container.appendChild(box);
    // legend
    if (datasets.length > 1 || datasets[0]?.label) {
      const legend = Kas.dom.el("div", { class: "legend" });
      datasets.forEach((d) => {
        const sp = Kas.dom.el("span");
        sp.innerHTML = `<span class="dot" style="background:${d.color || "var(--accent)"}"></span>${Kas.util.escape(d.label || "")}`;
        legend.appendChild(sp);
      });
      container.appendChild(legend);
    }
    // defer to ensure layout width is known
    requestAnimationFrame(() => Kas.chart[type](canvas, { labels, datasets }));
    return canvas;
  }
  Kas.components = Kas.components || {};
  Kas.components.chart = build;
})(window.Kas);
