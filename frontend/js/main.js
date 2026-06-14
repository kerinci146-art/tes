/* ============================================================
   main.js — Namespace global, utilitas, helper DOM
   ============================================================ */
window.Kas = window.Kas || {};

(function (Kas) {
  /* ---------- Path helper ----------
     Halaman berada di kedalaman berbeda (pages/ vs pages/role/).
     ROOT dihitung dari atribut data-root pada <body>. */
  Kas.root = (document.body && document.body.getAttribute("data-root")) || "";
  Kas.url = (p) => Kas.root + p;

  /* ---------- Format ---------- */
  const rupiah = (n) => {
    n = Number(n || 0);
    return "Rp " + n.toLocaleString("id-ID");
  };
  const numberID = (n) => Number(n || 0).toLocaleString("id-ID");

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const monthFull = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const fmtDate = (s) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.getDate() + " " + monthNames[d.getMonth()] + " " + d.getFullYear();
  };
  const fmtDateLong = (s) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.getDate() + " " + monthFull[d.getMonth()] + " " + d.getFullYear();
  };
  const todayISO = () => new Date().toISOString().slice(0, 10);

  Kas.util = { rupiah, numberID, fmtDate, fmtDateLong, todayISO, monthNames, monthFull,
    escape: (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    initials: (name) => String(name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
    debounce: (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
  };

  /* ---------- DOM helpers ---------- */
  Kas.dom = {
    el(tag, attrs = {}, children) {
      const node = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k === "html") node.innerHTML = v;
        else if (k === "text") node.textContent = v;
        else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
      }
      if (children != null) {
        (Array.isArray(children) ? children : [children]).forEach((c) => {
          if (c == null) return;
          node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        });
      }
      return node;
    },
    qs: (sel, ctx = document) => ctx.querySelector(sel),
    qsa: (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)),
    clear: (node) => { while (node.firstChild) node.removeChild(node.firstChild); return node; },
  };

  Kas.statusBadge = (status) => {
    const map = {
      open: ["badge-success", "Open"], closed: ["badge-muted", "Closed"], completed: ["badge-info", "Selesai"],
      pending: ["badge-warning", "Pending"], approved: ["badge-success", "Diterima"], rejected: ["badge-danger", "Ditolak"], cancelled: ["badge-muted", "Dibatalkan"],
      active: ["badge-warning", "Aktif"], paid: ["badge-success", "Lunas"], installment: ["badge-info", "Cicil"],
      success: ["badge-success", "Sukses"], failed: ["badge-danger", "Gagal"], locked: ["badge-warning", "Terkunci"], banned: ["badge-danger", "Banned"],
    };
    const [cls, label] = map[status] || ["badge-muted", status || "-"];
    return `<span class="badge ${cls}">${label}</span>`;
  };
})(window.Kas);
