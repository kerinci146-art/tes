/* ============================================================
   theme.js — Mode Siang / Malam
   ============================================================ */
(function (Kas) {
  const KEY = "kaspetani_theme";
  const get = () => localStorage.getItem(KEY) || "light";

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.textContent = theme === "dark" ? "\u2600\uFE0F" : "\uD83C\uDF19"; // sun / moon
      btn.setAttribute("title", theme === "dark" ? "Mode Siang" : "Mode Malam");
    });
  }
  function toggle() { apply(get() === "dark" ? "light" : "dark"); }

  Kas.theme = { apply, toggle, get };

  // apply early
  apply(get());
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-theme-toggle]");
    if (t) { e.preventDefault(); toggle(); }
  });
})(window.Kas);
