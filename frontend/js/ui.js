/* ============================================================
   ui.js — Layout / chrome (header publik, sidebar dashboard,
   topbar, footer) + bootstrap halaman.
   ============================================================ */
(function (Kas) {
  const { el } = Kas.dom;
  Kas.pages = Kas.pages || {};

  const BRAND = "Kas Petani";
  const LOGO = "\uD83C\uDF31"; // seedling

  const publicNav = [
    ["index.html", "Beranda"], ["about.html", "Tentang"], ["jobs.html", "Pekerjaan"],
    ["gallery.html", "Galeri"], ["news.html", "Berita"], ["contact.html", "Kontak"],
  ];

  const sideNav = {
    superadmin: [
      ["dashboard.html", "\uD83D\uDCCA", "Dashboard"], ["admins.html", "\uD83D\uDC54", "Manajemen Admin"],
      ["users.html", "\uD83D\uDC65", "Manajemen User"], ["workers.html", "\uD83D\uDC77", "Pekerja"],
      ["kas.html", "\uD83D\uDCB0", "Input Kas Harian"], ["jobs.html", "\uD83D\uDCC5", "Pekerjaan"],
      ["reports.html", "\uD83D\uDCC8", "Laporan & Analitik"], ["export.html", "\uD83D\uDCE6", "Export / Import"],
      ["gallery.html", "\uD83D\uDDBC", "Galeri"], ["news.html", "\uD83D\uDCF0", "Berita"],
      ["security.html", "\uD83D\uDD12", "Keamanan"], ["settings.html", "\u2699", "Pengaturan"],
    ],
    admin: [
      ["dashboard.html", "\uD83D\uDCCA", "Dashboard"], ["members.html", "\uD83D\uDC65", "Member Saya"],
      ["workers.html", "\uD83D\uDC77", "Pekerja"], ["kas.html", "\uD83D\uDCB0", "Input Kas Harian"],
      ["jobs.html", "\uD83D\uDCC5", "Pekerjaan"], ["reports.html", "\uD83D\uDCC8", "Laporan"],
      ["settings.html", "\u2699", "Pengaturan"],
    ],
    user: [
      ["dashboard.html", "\uD83D\uDCCA", "Dashboard"], ["jobs.html", "\uD83D\uDCC5", "Pekerjaan"],
      ["performance.html", "\uD83D\uDCC8", "Performa Saya"], ["notifications.html", "\uD83D\uDD14", "Notifikasi"],
      ["settings.html", "\u2699", "Pengaturan"],
    ],
  };
  const roleLabel = { superadmin: "Super Admin", admin: "Admin", user: "Member" };

  function themeBtn() {
    return el("button", { class: "theme-toggle", "data-theme-toggle": "1", title: "Ganti tema" });
  }

  /* ---------- PUBLIC LAYOUT ---------- */
  function buildPublic(page) {
    const header = el("header", { class: "site-header" });
    const c = el("div", { class: "container" });
    const brand = el("a", { class: "brand", href: "index.html" });
    brand.innerHTML = `<span class="logo">${LOGO}</span> ${BRAND}`;
    const nav = el("nav", { class: "nav" });
    publicNav.forEach(([href, label]) => {
      const a = el("a", { href, text: label });
      if (href === page) a.classList.add("active");
      nav.appendChild(a);
    });
    const actions = el("div", { class: "nav-actions" });
    actions.appendChild(themeBtn());
    const cu = Kas.auth.currentUser();
    if (cu) actions.appendChild(el("a", { class: "btn btn-primary btn-sm", href: Kas.auth.dashboardFor(cu.role).replace("pages/", ""), text: "Dashboard" }));
    else actions.appendChild(el("a", { class: "btn btn-primary btn-sm", href: "login.html", text: "Masuk" }));
    const burger = el("button", { class: "hamburger", html: "\u2630" });
    burger.addEventListener("click", () => nav.classList.toggle("open"));
    actions.appendChild(burger);
    c.appendChild(brand); c.appendChild(nav); c.appendChild(actions);
    header.appendChild(c);

    const main = el("main", { id: "app" });

    const footer = el("footer", { class: "site-footer" });
    const ct = Kas.api.raw().contacts;
    const fc = el("div", { class: "container" });
    fc.innerHTML = `
      <div class="footer-grid">
        <div>
          <div class="brand" style="color:#fff;margin-bottom:10px"><span class="logo">${LOGO}</span> ${BRAND}</div>
          <p style="opacity:.85;max-width:340px">Sistem manajemen pekerja & keuangan pertanian digital untuk mendukung petani dan pekerja tani lokal.</p>
          <div class="social-row">
            <a href="${ct.facebook}" title="Facebook" target="_blank" rel="noopener">f</a>
            <a href="${ct.instagram}" title="Instagram" target="_blank" rel="noopener">ig</a>
            <a href="${ct.tiktok}" title="TikTok" target="_blank" rel="noopener">tt</a>
            <a href="https://wa.me/6281200000001" title="WhatsApp" target="_blank" rel="noopener">wa</a>
          </div>
        </div>
        <div>
          <h4>Menu</h4>
          <p style="display:flex;flex-direction:column;gap:6px">
            <a href="about.html">Tentang Kami</a><a href="jobs.html">Pekerjaan</a>
            <a href="gallery.html">Galeri</a><a href="news.html">Berita</a>
          </p>
        </div>
        <div>
          <h4>Kontak</h4>
          <p style="display:flex;flex-direction:column;gap:6px;opacity:.9">
            <span>${ct.whatsapp}</span><span>${ct.email}</span><span>${ct.address}</span>
          </p>
        </div>
      </div>
      <div class="footer-bottom">&copy; ${new Date().getFullYear()} ${BRAND} \u2014 Mendukung program pertanian kabupaten. Demo Phase 1.</div>`;
    footer.appendChild(fc);

    document.body.appendChild(header);
    document.body.appendChild(main);
    document.body.appendChild(footer);
    return main;
  }

  /* ---------- DASHBOARD LAYOUT ---------- */
  function buildDashboard(page, user, title) {
    const shell = el("div", { class: "app-shell" });
    const backdrop = el("div", { class: "sidebar-backdrop" });
    backdrop.addEventListener("click", () => document.body.classList.remove("sidebar-open"));

    const sidebar = el("aside", { class: "sidebar" });
    const brand = el("a", { class: "brand", href: Kas.url("pages/index.html") });
    brand.innerHTML = `<span class="logo">${LOGO}</span> ${BRAND}`;
    sidebar.appendChild(brand);
    sidebar.appendChild(el("div", { class: "role-badge", text: roleLabel[user.role] }));
    const nav = el("nav", { class: "side-nav" });
    (sideNav[user.role] || []).forEach(([href, ic, label]) => {
      const a = el("a", { href });
      a.innerHTML = `<span class="ic">${ic}</span><span>${label}</span>`;
      if (href === page) a.classList.add("active");
      nav.appendChild(a);
    });
    sidebar.appendChild(nav);
    const foot = el("div", { class: "sidebar-foot" });
    const logout = el("button", { class: "btn btn-ghost btn-block", html: "\u23FB Keluar", style: "color:#fff;border-color:rgba(255,255,255,.2)" });
    logout.addEventListener("click", () => { Kas.auth.logout(); window.location.href = Kas.url("pages/login.html"); });
    foot.appendChild(logout);
    sidebar.appendChild(foot);

    const main = el("div", { class: "main" });
    const topbar = el("div", { class: "topbar" });
    const menuBtn = el("button", { class: "menu-btn", html: "\u2630" });
    menuBtn.addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
    const left = el("div", { class: "flex items-center gap" }, [menuBtn, el("div", { class: "page-title", text: title || "Dashboard" })]);
    const right = el("div", { class: "topbar-actions" });
    right.appendChild(themeBtn());

    // notifications
    const notifs = Kas.api.notifsForUser(user.id);
    const unread = notifs.filter((n) => !n.is_read).length;
    const bell = el("button", { class: "btn-icon", title: "Notifikasi", style: "position:relative" });
    bell.innerHTML = "\uD83D\uDD14" + (unread ? `<span style="position:absolute;top:-2px;right:-2px;background:var(--red);color:#fff;border-radius:999px;font-size:.65rem;padding:1px 5px">${unread}</span>` : "");
    bell.addEventListener("click", () => showNotifPanel(user));
    right.appendChild(bell);

    const chip = el("div", { class: "user-chip" });
    chip.innerHTML = `<div class="avatar">${Kas.util.initials(user.full_name)}</div><div class="uname"><div style="font-weight:700;font-size:.88rem;line-height:1.1">${Kas.util.escape(user.full_name)}</div><div style="font-size:.74rem;color:var(--text-muted)">${roleLabel[user.role]}</div></div>`;
    chip.style.cursor = "pointer";
    chip.addEventListener("click", () => { window.location.href = "settings.html"; });
    right.appendChild(chip);

    topbar.appendChild(left); topbar.appendChild(right);
    const content = el("div", { class: "content", id: "app" });
    main.appendChild(topbar); main.appendChild(content);
    shell.appendChild(sidebar); shell.appendChild(main);
    document.body.appendChild(backdrop);
    document.body.appendChild(shell);
    return content;
  }

  function showNotifPanel(user) {
    const list = Kas.api.notifsForUser(user.id).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    const box = el("div");
    if (!list.length) box.innerHTML = `<div class="empty-state">Tidak ada notifikasi.</div>`;
    list.forEach((n) => {
      const item = el("div", { class: "card card-2", style: "margin-bottom:10px;padding:12px" });
      item.innerHTML = `<div class="flex justify-between gap"><strong>${Kas.util.escape(n.title)}</strong>${Kas.statusBadge(n.type)}</div>
        <div class="text-muted" style="font-size:.88rem;margin-top:4px">${Kas.util.escape(n.message)}</div>
        <div class="text-muted" style="font-size:.75rem;margin-top:6px">${n.created_at}</div>`;
      box.appendChild(item);
    });
    const markBtn = el("button", { class: "btn btn-ghost", text: "Tandai semua dibaca" });
    const close = el("button", { class: "btn btn-primary", text: "Tutup" });
    const m = Kas.modal.open({ title: "Notifikasi", body: box, footer: [markBtn, close] });
    close.addEventListener("click", m.close);
    markBtn.addEventListener("click", () => { list.forEach((n) => Kas.api.update("notifications", n.id, { is_read: true })); m.close(); Kas.toast("Semua notifikasi ditandai dibaca", "success"); });
  }

  /* ---------- BOOT ---------- */
  function boot() {
    const body = document.body;
    const layout = body.getAttribute("data-layout") || "public";
    const page = body.getAttribute("data-page") || "";
    const title = body.getAttribute("data-title") || "";
    const renderKey = body.getAttribute("data-render") || page.replace(".html", "");

    if (layout === "auth" || layout === "bare") {
      const main = el("main", { id: "app" });
      document.body.appendChild(main);
      runPage(renderKey, main, null);
      return;
    }
    if (layout === "dashboard") {
      const roles = (body.getAttribute("data-roles") || "").split(",").filter(Boolean);
      const user = Kas.auth.requireAuth(roles.length ? roles : null);
      if (!user) return;
      const content = buildDashboard(page, user, title);
      runPage(renderKey, content, user);
      return;
    }
    // public
    const main = buildPublic(page);
    runPage(renderKey, main, Kas.auth.currentUser());
  }

  function runPage(key, container, user) {
    const fn = Kas.pages[key];
    if (typeof fn === "function") {
      try { fn(container, user); }
      catch (e) { console.error(e); container.innerHTML = `<div class="container section"><div class="alert alert-danger">Terjadi kesalahan saat memuat halaman: ${Kas.util.escape(e.message)}</div></div>`; }
    } else {
      container.innerHTML = `<div class="container section"><div class="alert alert-warning">Halaman "<b>${Kas.util.escape(key)}</b>" belum tersedia.</div></div>`;
    }
  }

  Kas.ui = { boot, buildPublic, buildDashboard };

  // section/card helpers reused by pages
  Kas.ui.section = (title, sub) => {
    const s = el("div");
    if (title) s.appendChild(el("h2", { class: "section-title", text: title }));
    if (sub) s.appendChild(el("p", { class: "section-sub", text: sub }));
    return s;
  };
  Kas.ui.stat = (icon, value, label, color) => {
    const d = el("div", { class: "stat" });
    d.innerHTML = `<div class="stat-ic ${color || ""}">${icon}</div><div><div class="stat-val">${value}</div><div class="stat-label">${label}</div></div>`;
    return d;
  };
  Kas.ui.card = (inner, cls) => { const c = el("div", { class: "card " + (cls || "") }); if (typeof inner === "string") c.innerHTML = inner; else if (inner) c.appendChild(inner); return c; };

  document.addEventListener("DOMContentLoaded", boot);
})(window.Kas);
