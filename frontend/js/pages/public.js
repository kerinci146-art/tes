/* ============================================================
   pages/public.js — Halaman publik (tanpa login)
   ============================================================ */
(function (Kas) {
  const { el } = Kas.dom;
  const P = Kas.pages;
  const u = Kas.util;

  function jobCard(job, opts = {}) {
    const regs = Kas.api.regsForJob(job.id);
    const approved = regs.filter((r) => r.status !== "rejected" && r.status !== "cancelled").length;
    const pct = Math.min(100, Math.round((approved / job.needed_workers) * 100));
    const card = el("div", { class: "card" });
    card.innerHTML = `
      <div class="flex justify-between items-center" style="margin-bottom:8px">
        <h3 style="margin:0">${u.escape(job.title)}</h3>${Kas.statusBadge(job.status)}
      </div>
      <div class="text-muted" style="font-size:.9rem;display:flex;flex-direction:column;gap:4px;margin-bottom:10px">
        <span>\uD83D\uDCCD ${u.escape(job.location)}</span>
        <span>\uD83D\uDCC5 ${u.fmtDate(job.work_date)}</span>
        <span>\uD83D\uDC65 Butuh ${job.needed_workers} \u2022 Terdaftar ${approved}</span>
      </div>
      <div class="progress" style="margin-bottom:12px"><span style="width:${pct}%"></span></div>
      <p style="font-size:.88rem;min-height:38px">${u.escape((job.description || "").slice(0, 90))}${(job.description || "").length > 90 ? "\u2026" : ""}</p>`;
    const actions = el("div", { class: "flex gap-sm" });
    const detail = el("button", { class: "btn btn-ghost btn-sm full", text: "Lihat Detail" });
    detail.addEventListener("click", () => showJobDetail(job));
    actions.appendChild(detail);
    if (opts.canRegister !== false) {
      const reg = el("button", { class: "btn btn-primary btn-sm full", text: "Daftar Sekarang" });
      reg.addEventListener("click", () => {
        const cu = Kas.auth.currentUser();
        if (!cu) { window.location.href = "login.html"; return; }
        const existing = Kas.api.regsForUser(cu.id).find((r) => r.job_id === job.id);
        if (existing) { Kas.toast("Anda sudah terdaftar di pekerjaan ini.", "warning"); return; }
        Kas.api.add("job_registrations", { job_id: job.id, user_id: cu.id, status: "pending", registered_at: u.todayISO() });
        Kas.toast("Pendaftaran terkirim! Menunggu persetujuan admin.", "success");
      });
      actions.appendChild(reg);
    }
    card.appendChild(actions);
    return card;
  }

  function showJobDetail(job) {
    const regs = Kas.api.regsForJob(job.id);
    const box = el("div");
    box.innerHTML = `
      <p style="margin-top:0">${u.escape(job.description)}</p>
      <div class="grid grid-2" style="margin:14px 0">
        <div class="card card-2"><div class="stat-label">Lokasi</div><strong>${u.escape(job.location)}</strong></div>
        <div class="card card-2"><div class="stat-label">Tanggal</div><strong>${u.fmtDateLong(job.work_date)}</strong></div>
        <div class="card card-2"><div class="stat-label">Dibutuhkan</div><strong>${job.needed_workers} orang</strong></div>
        <div class="card card-2"><div class="stat-label">Pembuat</div><strong>${u.escape(Kas.api.adminName(job.admin_id))}</strong></div>
      </div>
      <h4>Pendaftar (${regs.length})</h4>`;
    const ul = el("div");
    if (!regs.length) ul.innerHTML = `<div class="text-muted">Belum ada pendaftar.</div>`;
    regs.forEach((r) => {
      const usr = Kas.api.userById(r.user_id);
      ul.appendChild(el("div", { class: "flex justify-between", style: "padding:6px 0;border-bottom:1px solid var(--border)", html: `<span>${u.escape(usr ? usr.full_name : "User")}</span>${Kas.statusBadge(r.status)}` }));
    });
    box.appendChild(ul);
    const close = el("button", { class: "btn btn-primary", text: "Tutup" });
    const m = Kas.modal.open({ title: job.title, body: box, footer: [close], size: "lg" });
    close.addEventListener("click", m.close);
  }
  Kas.publicJobCard = jobCard;
  Kas.showJobDetail = showJobDetail;

  /* ---------- Beranda ---------- */
  P["index"] = function (root) {
    const stats = Kas.api.publicStats();
    const hero = el("section", { class: "hero" });
    hero.innerHTML = `
      <div class="container">
        <h1>Buku Kas Pekerja Tani Digital</h1>
        <p>Menghubungkan petani dengan pekerja tani lokal, serta mencatat kas & kinerja secara transparan dan akuntabel.</p>
        <div class="btn-row">
          <a class="btn btn-light btn-lg" href="jobs.html">Lihat Pekerjaan</a>
          <a class="btn btn-outline btn-lg" style="color:#fff;border-color:#fff" href="about.html">Tentang Kami</a>
        </div>
      </div>`;
    root.appendChild(hero);

    const sec = el("section", { class: "section" });
    const c = el("div", { class: "container" });
    const grid = el("div", { class: "grid grid-4" });
    grid.appendChild(Kas.ui.stat("\uD83D\uDC77", u.numberID(stats.activeWorkers), "Pekerja Aktif"));
    grid.appendChild(Kas.ui.stat("\uD83D\uDCC5", u.numberID(stats.workDays), "Hari Kerja (bln ini)", "blue"));
    grid.appendChild(Kas.ui.stat("\u23F1", u.numberID(stats.hours), "Jam Kerja (bln ini)", "orange"));
    grid.appendChild(Kas.ui.stat("\uD83D\uDCCD", u.numberID(stats.places), "Tempat Kerja", "purple"));
    c.appendChild(grid);

    // weekly chart
    const chartCard = Kas.ui.card("");
    chartCard.innerHTML = `<div class="card-head"><h3>Statistik Kas Mingguan</h3></div>`;
    const wk = Kas.api.kasWeekly();
    Kas.components.chart(chartCard, { type: "bar", labels: wk.labels, datasets: [{ label: "Total Kas", data: wk.data, color: "#2e7d32" }] });
    c.appendChild(el("div", { style: "margin-top:28px" }, [chartCard]));

    // upcoming jobs
    const openJobs = Kas.api.all("jobs").filter((j) => j.status === "open").slice(0, 3);
    const jobsSec = el("div", { style: "margin-top:34px" });
    jobsSec.appendChild(el("div", { class: "flex justify-between items-center", html: `<h2 class="section-title" style="margin:0">Pekerjaan Mendatang</h2>`, }));
    const jg = el("div", { class: "job-grid", style: "margin-top:16px" });
    openJobs.forEach((j) => jg.appendChild(jobCard(j)));
    jobsSec.appendChild(jg);
    jobsSec.appendChild(el("div", { class: "text-center", style: "margin-top:20px", html: `<a class="btn btn-outline" href="jobs.html">Lihat Semua Pekerjaan</a>` }));
    c.appendChild(jobsSec);

    sec.appendChild(c); root.appendChild(sec);
  };

  /* ---------- Tentang ---------- */
  P["about"] = function (root) {
    const sec = el("section", { class: "section" });
    sec.innerHTML = `
      <div class="container">
        <h2 class="section-title">Tentang Kami</h2>
        <p class="section-sub">Mendukung program pemerintah kabupaten dalam memajukan sektor pertanian melalui digitalisasi manajemen tenaga kerja dan keuangan petani.</p>
        <div class="grid grid-2">
          <div class="card"><h3>\uD83C\uDFAF Visi</h3><p>Menjadi platform pertanian lokal yang transparan, menghubungkan petani dan pekerja, serta mencatat keuangan secara akuntabel.</p></div>
          <div class="card"><h3>\uD83D\uDE80 Misi</h3><ul><li>Membantu masyarakat mencari pekerjaan pertanian.</li><li>Membantu petani menemukan tenaga kerja.</li><li>Menyediakan pencatatan kas digital.</li><li>Menciptakan pasar kerja pertanian terorganisir.</li></ul></div>
        </div>
        <div class="grid grid-2" style="margin-top:18px">
          <div class="card"><h3>\uD83D\uDC68\u200D\uD83C\uDF3E Manfaat untuk Petani</h3><ul><li>Mudah mencari tenaga kerja.</li><li>Pencatatan kas & pinjaman rapi.</li><li>Laporan kinerja otomatis.</li></ul></div>
          <div class="card"><h3>\uD83D\uDC77 Manfaat untuk Pekerja</h3><ul><li>Akses lowongan pertanian terbuka.</li><li>Riwayat kerja & kas tercatat.</li><li>Transparansi pinjaman.</li></ul></div>
        </div>
        <div class="card" style="margin-top:18px"><h3>\uD83C\uDFDB Dukungan Program Pemerintah</h3><p>Aplikasi ini mendukung program dinas pertanian kabupaten untuk mendigitalisasi data tenaga kerja dan keuangan petani demi kesejahteraan masyarakat pedesaan.</p></div>
      </div>`;
    root.appendChild(sec);
  };

  /* ---------- Pekerjaan ---------- */
  P["jobs"] = function (root) {
    const sec = el("section", { class: "section" });
    const c = el("div", { class: "container" });
    c.appendChild(Kas.ui.section("Pekerjaan Mendatang", "Temukan lowongan pekerjaan pertanian dan daftar langsung."));
    const filterBar = el("div", { class: "flex gap wrap", style: "margin-bottom:18px" });
    const search = el("input", { type: "search", class: "input", placeholder: "Cari lokasi / nama...", style: "max-width:280px" });
    filterBar.appendChild(search);
    c.appendChild(filterBar);
    const grid = el("div", { class: "job-grid" });
    c.appendChild(grid);
    function render() {
      const term = search.value.toLowerCase();
      let jobs = Kas.api.all("jobs").filter((j) => j.status === "open");
      if (term) jobs = jobs.filter((j) => (j.title + j.location).toLowerCase().includes(term));
      Kas.dom.clear(grid);
      if (!jobs.length) grid.appendChild(el("div", { class: "empty-state", text: "Tidak ada pekerjaan terbuka." }));
      jobs.forEach((j) => grid.appendChild(jobCard(j)));
    }
    search.addEventListener("input", u.debounce(render, 150));
    render();
    sec.appendChild(c); root.appendChild(sec);
  };

  /* ---------- Galeri ---------- */
  P["gallery"] = function (root) {
    const sec = el("section", { class: "section" });
    const c = el("div", { class: "container" });
    c.appendChild(Kas.ui.section("Galeri Dokumentasi", "Dokumentasi kegiatan pertanian bersama pekerja tani."));
    const grid = el("div", { class: "gallery-grid" });
    Kas.api.all("gallery").forEach((g) => {
      const fig = el("figure");
      fig.innerHTML = `<img src="${Kas.url(g.image_url)}" alt="${u.escape(g.title)}" loading="lazy"><figcaption><strong>${u.escape(g.title)}</strong></figcaption>`;
      fig.addEventListener("click", () => {
        const close = el("button", { class: "btn btn-primary", text: "Tutup" });
        const m = Kas.modal.open({ title: g.title, body: `<img src="${Kas.url(g.image_url)}" style="border-radius:10px" alt=""><p style="margin-top:12px">${u.escape(g.description)}</p>`, footer: [close], size: "lg" });
        close.addEventListener("click", m.close);
      });
      grid.appendChild(fig);
    });
    c.appendChild(grid); sec.appendChild(c); root.appendChild(sec);
  };

  /* ---------- Berita ---------- */
  P["news"] = function (root) {
    const sec = el("section", { class: "section" });
    const c = el("div", { class: "container" });
    c.appendChild(Kas.ui.section("Berita & Informasi", "Kabar terbaru seputar pertanian dan program kerja."));
    const grid = el("div", { class: "news-grid" });
    Kas.api.all("news").filter((n) => n.is_published).forEach((n) => {
      const card = el("div", { class: "card" });
      card.innerHTML = `<img src="${Kas.url(n.image_url)}" alt="" style="border-radius:10px;height:160px;object-fit:cover;margin-bottom:12px">
        <span class="badge badge-info">${u.escape(n.category || "Umum")}</span>
        <h3 style="margin:10px 0 6px">${u.escape(n.title)}</h3>
        <div class="text-muted" style="font-size:.8rem;margin-bottom:8px">${u.fmtDate(n.created_at)} \u2022 ${u.escape(Kas.api.userById(n.author_id)?.full_name || "Admin")}</div>
        <p style="font-size:.9rem">${u.escape(n.content.slice(0, 110))}\u2026</p>`;
      const btn = el("button", { class: "btn btn-ghost btn-sm", text: "Baca selengkapnya" });
      btn.addEventListener("click", () => {
        const close = el("button", { class: "btn btn-primary", text: "Tutup" });
        const m = Kas.modal.open({ title: n.title, body: `<img src="${Kas.url(n.image_url)}" style="border-radius:10px;margin-bottom:12px" alt=""><div class="text-muted" style="font-size:.82rem;margin-bottom:10px">${u.fmtDateLong(n.created_at)}</div><p>${u.escape(n.content)}</p>`, footer: [close], size: "lg" });
        close.addEventListener("click", m.close);
      });
      card.appendChild(btn);
      grid.appendChild(card);
    });
    c.appendChild(grid); sec.appendChild(c); root.appendChild(sec);
  };

  /* ---------- Kontak ---------- */
  P["contact"] = function (root) {
    const ct = Kas.api.raw().contacts;
    const sec = el("section", { class: "section" });
    const c = el("div", { class: "container" });
    c.appendChild(Kas.ui.section("Kontak", "Hubungi kami untuk informasi lebih lanjut."));
    const grid = el("div", { class: "grid grid-2" });
    const form = el("form", { class: "card" });
    form.innerHTML = `
      <div class="form-group"><label>Nama <span class="req">*</span></label><input class="input" name="name" required><div class="field-error"></div></div>
      <div class="form-group"><label>Email <span class="req">*</span></label><input class="input" type="email" name="email" required><div class="field-error"></div></div>
      <div class="form-group"><label>Pesan <span class="req">*</span></label><textarea class="input" name="message" required></textarea><div class="field-error"></div></div>`;
    const btn = el("button", { class: "btn btn-primary btn-block", text: "Kirim Pesan", type: "submit" });
    form.appendChild(btn);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = Kas.validate.validateForm(form, { name: [Kas.validate.rules.required], email: [Kas.validate.rules.required, Kas.validate.rules.email], message: [Kas.validate.rules.required] });
      if (!ok) return;
      Kas.toast("Pesan terkirim! (demo) Kami akan menghubungi Anda.", "success");
      form.reset();
    });
    const info = el("div", { class: "card" });
    info.innerHTML = `<h3>Informasi Kontak</h3>
      <p style="display:flex;flex-direction:column;gap:12px">
        <span>\uD83D\uDCAC WhatsApp: <strong>${ct.whatsapp}</strong></span>
        <span>\u2709 Email: <strong>${ct.email}</strong></span>
        <span>\uD83D\uDCCD Alamat: <strong>${u.escape(ct.address)}</strong></span>
      </p>
      <div class="divider"></div>
      <h4>Sosial Media</h4>
      <div class="flex gap-sm wrap">
        <a class="btn btn-ghost btn-sm" href="${ct.facebook}" target="_blank" rel="noopener">Facebook</a>
        <a class="btn btn-ghost btn-sm" href="${ct.instagram}" target="_blank" rel="noopener">Instagram</a>
        <a class="btn btn-ghost btn-sm" href="${ct.tiktok}" target="_blank" rel="noopener">TikTok</a>
      </div>`;
    grid.appendChild(form); grid.appendChild(info);
    c.appendChild(grid); sec.appendChild(c); root.appendChild(sec);
  };
})(window.Kas);
