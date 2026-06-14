/* ============================================================
   components/notification.js — Toast
   ============================================================ */
(function (Kas) {
  let stack;
  function ensure() {
    if (!stack) { stack = document.createElement("div"); stack.className = "toast-stack"; document.body.appendChild(stack); }
    return stack;
  }
  const icons = { success: "\u2714", error: "\u2716", warning: "\u26A0", info: "\u2139" };

  function toast(message, type = "info", title) {
    ensure();
    const t = Kas.dom.el("div", { class: "toast " + type });
    t.innerHTML = `<div style="font-size:1.1rem">${icons[type] || icons.info}</div>
      <div><div class="toast-title">${title || ({ success: "Berhasil", error: "Gagal", warning: "Perhatian", info: "Info" }[type])}</div>
      <div class="toast-msg">${Kas.util.escape(message)}</div></div>`;
    stack.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 300); }, 3200);
  }

  Kas.toast = toast;
})(window.Kas);
