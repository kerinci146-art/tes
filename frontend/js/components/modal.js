/* ============================================================
   components/modal.js — Modal & konfirmasi
   ============================================================ */
(function (Kas) {
  function open({ title, body, footer, size }) {
    const overlay = Kas.dom.el("div", { class: "modal-overlay" });
    const modal = Kas.dom.el("div", { class: "modal" + (size === "lg" ? " lg" : "") });
    const head = Kas.dom.el("div", { class: "modal-head" });
    head.innerHTML = `<h3>${Kas.util.escape(title || "")}</h3>`;
    const closeBtn = Kas.dom.el("button", { class: "modal-close", "aria-label": "Tutup", html: "&times;" });
    head.appendChild(closeBtn);
    const bodyEl = Kas.dom.el("div", { class: "modal-body" });
    if (typeof body === "string") bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    modal.appendChild(head); modal.appendChild(bodyEl);
    let footEl;
    if (footer) { footEl = Kas.dom.el("div", { class: "modal-foot" }); (Array.isArray(footer) ? footer : [footer]).forEach((f) => footEl.appendChild(f)); modal.appendChild(footEl); }
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    return { overlay, modal, body: bodyEl, foot: footEl, close };
  }

  function confirm({ title = "Konfirmasi", message, danger, okText = "Ya", onOk }) {
    const ok = Kas.dom.el("button", { class: "btn " + (danger ? "btn-danger" : "btn-primary"), text: okText });
    const cancel = Kas.dom.el("button", { class: "btn btn-ghost", text: "Batal" });
    const m = open({ title, body: `<p style="margin:0">${Kas.util.escape(message)}</p>`, footer: [cancel, ok] });
    cancel.addEventListener("click", m.close);
    ok.addEventListener("click", () => { m.close(); onOk && onOk(); });
    return m;
  }

  Kas.modal = { open, confirm };
})(window.Kas);
