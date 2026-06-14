/* ============================================================
   pages/dashboards.js — Dashboard Super Admin, Admin, User
   ============================================================ */
(function (Kas) {
  const { el } = Kas.dom;
  const P = Kas.pages;
  const u = Kas.util;
  const api = Kas.api;

  const h = (title, sub) => Kas.ui.section(title, sub);
  const grid = (cls, items) => { const g = el("div", { class: "grid " + cls }); items.forEach((i) => i && g.appendChild(i)); return g; };
  const card = (inner, cls) => Kas.ui.card(inner, cls);
  function cardWith(title, bodyNode, headExtra) {
    const c = el("div", { class: "card" });
    const head = el("div", { class: "card-head" });
    head.innerHTML = `<h3>${u.escape(title)}</h3>`;
    if (headExtra) head.appendChild(headExtra);
    c.appendChild(head); if (bodyNode) c.appendChild(bodyNode); return c;
  }
  const adminIdOf = (user) => { const a = api.adminByUserId(user.id); return a ? a.id : null; };

  /* =========================================================
     SHARED BUILDERS (digunakan superadmin & admin)
     ========================================================= */

  function workersTable(root, scopeAdminId) {
    const getData = () => (scopeAdminId ? api.workersForAdmin(scopeAdminId) : api.all("workers"));
    const adminOpts = api.all("admins").map((a) => ({ value: a.id, label: a.full_name }));
    const crud = Kas.components.crud({
      singular: "Pekerja", table: "workers",
      getData, searchKeys: ["name", "address", "phone"],
      columns: [
        { label: "No", render: (_, i) => i },
        { label: "Nama", key: "name" },
        { label: "Alamat", render: (r) => u.escape(r.address || "-") },
        { label: "No. HP", key: "phone" },
        { label: "Admin", render: (r) => u.escape(api.adminName(r.admin_id)) },
        { label: "Status", render: (r) => Kas.statusBadge(r.is_active ? "active" : "closed") },
      ],
      fields: [
        { name: "name", label: "Nama", required: true, half: true },
        { name: "phone", label: "No. HP", required: true, half: true, validate: [Kas.validate.rules.phone] },
        { name: "address", label: "Alamat", type: "textarea" },
        scopeAdminId
          ? { name: "admin_id", label: "Admin", type: "hidden", default: scopeAdminId }
          : { name: "admin_id", label: "Admin Pengelola", type: "select", options: adminOpts, required: true },
        { name: "is_active", label: "Status", type: "select", options: [{ value: "true", label: "Aktif" }, { value: "false", label: "Nonaktif" }], default: "true" },
      ],
      beforeSave: (obj) => { obj.is_active = obj.is_active === "true" || obj.is_active === true; obj.admin_id = Number(obj.admin_id); return obj; },
    });
    root.appendChild(crud.element);
  }

  function kasPage(root, scopeAdminId) {
    root.appendChild(h("Input Kas Harian", "Catat kas masuk, keluar, dan pinjaman pekerja per hari."));
    const workers = (scopeAdminId ? api.workersForAdmin(scopeAdminId) : api.all("workers"));
    const workerOpts = workers.map((w) => ({ value: w.id, label: w.name }));

    // form
    const form = el("form", { class: "card" });
    form.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Tanggal <span class="req">*</span></label><input class="input" type="date" name="work_date" value="${u.todayISO()}" required><div class="field-error"></div></div>
        <div class="form-group"><label>Nama Pekerja <span class="req">*</span></label><select class="input" name="worker_id" required>${workerOpts.map((o) => `<option value="${o.value}">${u.escape(o.label)}</option>`).join("")}</select><div class="field-error"></div></div>
      </div>
      <div class="form-group"><label>Tempat Kerja <span class="req">*</span></label><input class="input" name="workplace" placeholder="Lokasi hari ini" required><div class="field-error"></div></div>
      <div class="form-row">
        <div class="form-group"><label>Kas Masuk</label><input class="input" type="number" name="kas_masuk" value="0" min="0"></div>
        <div class="form-group"><label>Kas Keluar</label><input class="input" type="number" name="kas_keluar" value="0" min="0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Jumlah Kas (otomatis)</label><input class="input" name="total_kas" value="0" readonly></div>
        <div class="form-group"><label>Pinjaman</label><input class="input" type="number" name="pinjaman" value="0" min="0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Total Pinjaman</label><input class="input" type="number" name="total_pinjaman" value="0" min="0"></div>
        <div class="form-group"><label>Kapan Dikembalikan</label><input class="input" type="date" name="return_date"></div>
      </div>
      <div class="form-group"><label>Catatan</label><textarea class="input" name="notes"></textarea></div>`;
    const submit = el("button", { class: "btn btn-primary", text: "Simpan Kas", type: "submit" });
    form.appendChild(submit);
    const recalc = () => { form.elements.total_kas.value = (Number(form.elements.kas_masuk.value || 0) - Number(form.elements.kas_keluar.value || 0)); };
    form.elements.kas_masuk.addEventListener("input", recalc);
    form.elements.kas_keluar.addEventListener("input", recalc);

    let table;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = Kas.validate.validateForm(form, { worker_id: [Kas.validate.rules.required], workplace: [Kas.validate.rules.required], work_date: [Kas.validate.rules.required] });
      if (!ok) return;
      const masuk = Number(form.elements.kas_masuk.value || 0), keluar = Number(form.elements.kas_keluar.value || 0);
      api.add("daily_kas", {
        worker_id: Number(form.elements.worker_id.value), work_date: form.elements.work_date.value,
        workplace: form.elements.workplace.value, kas_masuk: masuk, kas_keluar: keluar, total_kas: masuk - keluar,
        pinjaman: Number(form.elements.pinjaman.value || 0), total_pinjaman: Number(form.elements.total_pinjaman.value || 0),
        return_date: form.elements.return_date.value || null, notes: form.elements.notes.value,
        created_by: Kas.auth.currentUser().id,
      });
      Kas.toast("Kas harian tersimpan", "success");
      form.reset(); form.elements.work_date.value = u.todayISO(); recalc();
      table.refresh();
    });
    root.appendChild(el("h3", { text: "Form Input Kas", style: "margin:0 0 10px" }));
    root.appendChild(el("div", { style: "margin-bottom:20px" }, [form]));

    // history table
    const getData = () => (scopeAdminId ? api.kasForAdmin(scopeAdminId) : api.all("daily_kas")).sort((a, b) => (b.work_date || "").localeCompare(a.work_date || ""));
    const crud = Kas.components.crud({
      singular: "Kas", table: "daily_kas", getData, searchKeys: ["workplace"],
      canCreate: false,
      columns: [
        { label: "Tanggal", render: (r) => u.fmtDate(r.work_date) },
        { label: "Pekerja", render: (r) => u.escape(api.workerName(r.worker_id)) },
        { label: "Tempat", render: (r) => u.escape(r.workplace) },
        { label: "Masuk", render: (r) => u.rupiah(r.kas_masuk) },
        { label: "Keluar", render: (r) => u.rupiah(r.kas_keluar) },
        { label: "Kas", render: (r) => `<strong>${u.rupiah(r.total_kas)}</strong>` },
        { label: "Pinjaman", render: (r) => u.rupiah(r.pinjaman) },
      ],
      fields: [
        { name: "work_date", label: "Tanggal", type: "date", required: true, half: true },
        { name: "workplace", label: "Tempat Kerja", required: true, half: true },
        { name: "kas_masuk", label: "Kas Masuk", type: "number", half: true },
        { name: "kas_keluar", label: "Kas Keluar", type: "number", half: true },
        { name: "pinjaman", label: "Pinjaman", type: "number", half: true },
        { name: "return_date", label: "Kapan Dikembalikan", type: "date", half: true },
        { name: "notes", label: "Catatan", type: "textarea" },
      ],
      beforeSave: (obj) => { obj.total_kas = Number(obj.kas_masuk || 0) - Number(obj.kas_keluar || 0); return obj; },
    });
    table = crud;
    root.appendChild(cardWith("Riwayat Kas", crud.element));
  }

  function jobsPage(root, user, scopeAdminId) {
    root.appendChild(h("Manajemen Pekerjaan", scopeAdminId ? "Kelola pekerjaan Anda & daftar ke pekerjaan admin lain." : "Kelola semua pekerjaan."));
    const getOwn = () => (scopeAdminId ? api.jobsForAdmin(scopeAdminId) : api.all("jobs"));
    const myAdminId = scopeAdminId || adminIdOf(user);

    function registrantsBtn(job) {
      const b = el("button", { class: "btn btn-ghost btn-sm", title: "Pendaftar", html: "\uD83D\uDC65" });
      b.addEventListener("click", () => {
        const regs = api.regsForJob(job.id);
        const box = el("div");
        if (!regs.length) box.innerHTML = `<div class="empty-state">Belum ada pendaftar.</div>`;
        regs.forEach((r) => {
          const usr = api.userById(r.user_id);
          const row = el("div", { class: "flex justify-between items-center", style: "padding:8px 0;border-bottom:1px solid var(--border)" });
          row.innerHTML = `<span>${u.escape(usr ? usr.full_name : "User")}</span>`;
          const act = el("div", { class: "flex gap-sm" });
          act.innerHTML = Kas.statusBadge(r.status);
          if (r.status === "pending") {
            const ap = el("button", { class: "btn btn-primary btn-sm", text: "Terima" });
            const rj = el("button", { class: "btn btn-ghost btn-sm", text: "Tolak" });
            ap.addEventListener("click", () => { api.update("job_registrations", r.id, { status: "approved" }); Kas.toast("Pendaftar diterima", "success"); m.close(); });
            rj.addEventListener("click", () => { api.update("job_registrations", r.id, { status: "rejected" }); Kas.toast("Pendaftar ditolak", "info"); m.close(); });
            act.appendChild(ap); act.appendChild(rj);
          }
          row.appendChild(act); box.appendChild(row);
        });
        const close = el("button", { class: "btn btn-primary", text: "Tutup" });
        var m = Kas.modal.open({ title: "Pendaftar: " + job.title, body: box, footer: [close] });
        close.addEventListener("click", m.close);
      });
      return b;
    }

    const crud = Kas.components.crud({
      singular: "Pekerjaan", table: "jobs", getData: getOwn, searchKeys: ["title", "location"],
      columns: [
        { label: "Judul", key: "title" },
        { label: "Lokasi", render: (r) => u.escape(r.location) },
        { label: "Tanggal", render: (r) => u.fmtDate(r.work_date) },
        { label: "Butuh", render: (r) => r.needed_workers + " org" },
        { label: "Daftar", render: (r) => api.regsForJob(r.id).length + " org" },
        { label: "Status", render: (r) => Kas.statusBadge(r.status) },
      ],
      fields: [
        { name: "title", label: "Nama Pekerjaan", required: true },
        { name: "location", label: "Lokasi", required: true, half: true },
        { name: "work_date", label: "Tanggal Pelaksanaan", type: "date", required: true, half: true },
        { name: "needed_workers", label: "Kebutuhan Orang", type: "number", required: true, half: true, default: 1 },
        { name: "status", label: "Status", type: "select", half: true, options: [{ value: "open", label: "Open" }, { value: "closed", label: "Closed" }, { value: "completed", label: "Selesai" }], default: "open" },
        { name: "description", label: "Deskripsi", type: "textarea" },
      ],
      beforeSave: (obj, isNew) => { obj.needed_workers = Number(obj.needed_workers) || 1; if (isNew) obj.admin_id = myAdminId; return obj; },
      rowActions: (row) => [registrantsBtn(row)],
    });
    root.appendChild(crud.element);

    // register to other admins' jobs
    const others = api.all("jobs").filter((j) => j.status === "open" && j.admin_id !== myAdminId);
    if (others.length) {
      const sec = el("div", { style: "margin-top:26px" });
      sec.appendChild(el("h3", { text: "Daftar ke Pekerjaan Admin Lain" }));
      const jg = el("div", { class: "job-grid" });
      others.forEach((j) => jg.appendChild(Kas.publicJobCard(j)));
      sec.appendChild(jg);
      root.appendChild(sec);
    }
  }

  function reportsPage(root, user, scopeAdminId) {
    root.appendChild(h("Laporan & Analitik", "Ringkasan kas, pinjaman, dan performa pekerja."));
    const kasList = scopeAdminId ? api.kasForAdmin(scopeAdminId) : api.all("daily_kas");
    const workers = scopeAdminId ? api.workersForAdmin(scopeAdminId) : api.all("workers");
    const totalKas = kasList.reduce((s, k) => s + Number(k.total_kas || 0), 0);
    const masuk = kasList.reduce((s, k) => s + Number(k.kas_masuk || 0), 0);
    const keluar = kasList.reduce((s, k) => s + Number(k.kas_keluar || 0), 0);
    const loans = api.all("loans").filter((l) => workers.some((w) => w.id === l.worker_id));
    const loanActive = loans.filter((l) => l.status !== "paid").reduce((s, l) => s + (l.amount - l.paid_amount), 0);
    const loanPaid = loans.filter((l) => l.status === "paid").reduce((s, l) => s + l.amount, 0);

    root.appendChild(grid("grid-4", [
      Kas.ui.stat("\uD83D\uDCB0", u.rupiah(totalKas), "Total Kas", "purple"),
      Kas.ui.stat("\u2B06", u.rupiah(masuk), "Kas Masuk"),
      Kas.ui.stat("\u2B07", u.rupiah(keluar), "Kas Keluar", "orange"),
      Kas.ui.stat("\uD83E\uDE99", u.rupiah(loanActive), "Pinjaman Aktif", "red"),
    ]));

    // charts
    const monthly = api.kasMonthly(kasList);
    const chart1 = cardWith("Kas per Bulan", null);
    Kas.components.chart(chart1, { type: "bar", labels: monthly.labels, datasets: [{ label: "Kas Masuk", data: monthly.masuk, color: "#4caf50" }, { label: "Total Kas", data: monthly.kas, color: "#1976d2" }] });
    const top = workers.map((w) => ({ w, ...api.performance(w.id) })).sort((a, b) => b.totalKas - a.totalKas).slice(0, 5);
    const chart2 = cardWith("Top Pekerja (Kas)", null);
    Kas.components.chart(chart2, { type: "bar", labels: top.map((t) => t.w.name.split(" ")[0]), datasets: [{ label: "Kas", data: top.map((t) => t.totalKas), color: "#2e7d32" }] });
    root.appendChild(el("div", { class: "grid grid-2", style: "margin-top:18px" }, [chart1, chart2]));

    // per-worker summary table
    const rows = workers.map((w) => ({ w, ...api.performance(w.id) }));
    const tbl = Kas.components.dataTable({
      searchKeys: ["name"],
      getData: () => rows.map((r) => ({ name: r.w.name, days: r.days, totalKas: r.totalKas, outstanding: r.outstanding, loanStatus: r.loanStatus })),
      columns: [
        { label: "Pekerja", key: "name" },
        { label: "Hari Kerja", render: (r) => r.days + " hari" },
        { label: "Total Kas", render: (r) => u.rupiah(r.totalKas) },
        { label: "Sisa Pinjaman", render: (r) => u.rupiah(r.outstanding) },
        { label: "Status Pinjaman", render: (r) => `<span class="badge ${r.loanStatus === "Lunas" ? "badge-success" : r.loanStatus === "Cicil" ? "badge-info" : r.loanStatus === "-" ? "badge-muted" : "badge-warning"}">${r.loanStatus}</span>` },
      ],
    });
    root.appendChild(cardWith("Ringkasan per Pekerja", tbl.element));

    // export buttons
    const bar = el("div", { class: "flex gap", style: "margin-top:16px" });
    const pdf = el("button", { class: "btn btn-ghost", html: "\uD83D\uDCC4 Export PDF" });
    const json = el("button", { class: "btn btn-ghost", html: "\uD83D\uDCE6 Export JSON" });
    pdf.addEventListener("click", () => window.print());
    json.addEventListener("click", () => exportJSON({ kas: kasList, workers, loans }, "laporan-kas"));
    bar.appendChild(pdf); bar.appendChild(json);
    root.appendChild(bar);
  }

  function exportJSON(data, name) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = el("a", { href: URL.createObjectURL(blob), download: name + "-" + u.todayISO() + ".json" });
    document.body.appendChild(a); a.click(); a.remove();
    Kas.toast("File JSON terunduh", "success");
  }

  function settingsPage(root, user, withSystem) {
    root.appendChild(h("Pengaturan", "Kelola profil, keamanan, dan tampilan."));
    // Profil
    const pform = el("form", { class: "card" });
    pform.innerHTML = `
      <div class="form-row">
        <div class="form-group"><label>Nama Lengkap</label><input class="input" name="full_name" value="${u.escape(user.full_name || "")}"></div>
        <div class="form-group"><label>Email</label><input class="input" type="email" name="email" value="${u.escape(user.email || "")}"></div>
      </div>
      <div class="form-group"><label>No. HP</label><input class="input" name="phone" value="${u.escape(user.phone || "")}"></div>`;
    const psave = el("button", { class: "btn btn-primary", text: "Simpan Profil", type: "submit" });
    pform.appendChild(psave);
    pform.addEventListener("submit", (e) => { e.preventDefault(); api.update("users", user.id, { full_name: pform.elements.full_name.value, email: pform.elements.email.value, phone: pform.elements.phone.value }); Kas.toast("Profil diperbarui", "success"); });
    root.appendChild(el("h3", { text: "Profil", style: "margin:0 0 10px" }));
    root.appendChild(el("div", { style: "margin-bottom:18px" }, [pform]));

    // Keamanan - ubah password
    const sform = el("form", { class: "card" });
    sform.innerHTML = `
      <div class="form-group"><label>Password Lama</label><input class="input" type="password" name="old"></div>
      <div class="form-group"><label>Password Baru</label><input class="input" type="password" name="np"><div class="field-hint">Min 8 karakter, huruf besar, kecil, angka.</div><div class="field-error"></div></div>
      <div class="form-group"><label>Konfirmasi Baru</label><input class="input" type="password" name="cp"><div class="field-error"></div></div>`;
    const ssave = el("button", { class: "btn btn-primary", text: "Ubah Password", type: "submit" });
    sform.appendChild(ssave);
    sform.addEventListener("submit", (e) => {
      e.preventDefault();
      const np = sform.elements.np.value, cp = sform.elements.cp.value;
      const errs = sform.querySelectorAll(".field-error");
      const pol = Kas.validate.passwordPolicy(np);
      if (pol) { errs[0].textContent = pol; return; } else errs[0].textContent = "";
      if (np !== cp) { errs[1].textContent = "Konfirmasi tidak cocok"; return; } else errs[1].textContent = "";
      const res = Kas.auth.changePassword(user.id, sform.elements.old.value, np);
      if (!res.ok) { Kas.toast(res.message, "error"); return; }
      Kas.toast("Password diubah", "success"); sform.reset();
    });
    root.appendChild(el("div", { style: "margin-bottom:18px" }, [cardWith("Keamanan \u2014 Ubah Password", sform)]));

    // Tema
    const themeCard = el("div", { class: "card" });
    themeCard.innerHTML = `<div class="card-head"><h3>Tema Tampilan</h3></div><p class="text-muted">Pilih mode Siang atau Malam.</p>`;
    const tbtn = el("button", { class: "btn btn-outline", "data-theme-toggle": "1", text: "Ganti Mode Siang / Malam" });
    themeCard.appendChild(tbtn);
    root.appendChild(themeCard);

    if (withSystem) {
      const sysCard = el("div", { class: "card", style: "margin-top:18px" });
      sysCard.innerHTML = `<div class="card-head"><h3>Pengaturan Sistem</h3></div>
        <div class="form-row">
          <div class="form-group"><label>Threshold Login Gagal</label><input class="input" type="number" value="3"></div>
          <div class="form-group"><label>Durasi Lock Sementara (menit)</label><input class="input" type="number" value="15"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Durasi Ban Device (menit)</label><input class="input" type="number" value="30"></div>
          <div class="form-group"><label>Min. Panjang Password</label><input class="input" type="number" value="8"></div>
        </div>`;
      const sysSave = el("button", { class: "btn btn-primary", text: "Simpan Pengaturan Sistem" });
      sysSave.addEventListener("click", () => Kas.toast("Pengaturan sistem disimpan (demo)", "success"));
      sysCard.appendChild(sysSave);
      // reset demo data
      const resetBtn = el("button", { class: "btn btn-ghost", text: "Reset Data Demo", style: "margin-left:8px" });
      resetBtn.addEventListener("click", () => Kas.modal.confirm({ title: "Reset Data Demo", message: "Kembalikan seluruh data demo ke kondisi awal?", danger: true, okText: "Reset", onOk: () => { api.reset(); Kas.security.resetAll(); Kas.toast("Data demo direset", "success"); setTimeout(() => location.reload(), 600); } }));
      sysCard.appendChild(resetBtn);
      root.appendChild(sysCard);
    }
  }

  /* =========================================================
     SUPER ADMIN
     ========================================================= */
  P["superadmin/dashboard"] = function (root, user) {
    root.appendChild(h("Dashboard Super Admin", "Ringkasan keseluruhan sistem."));
    const now = new Date(); const key = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const masukBln = api.all("daily_kas").filter((k) => (k.work_date || "").startsWith(key)).reduce((s, k) => s + Number(k.kas_masuk || 0), 0);
    const loanActive = api.all("loans").filter((l) => l.status !== "paid").reduce((s, l) => s + (l.amount - l.paid_amount), 0);
    root.appendChild(grid("grid-4", [
      Kas.ui.stat("\uD83D\uDC54", api.all("admins").length, "Total Admin"),
      Kas.ui.stat("\uD83D\uDC65", api.all("users").filter((x) => x.role === "user").length, "Total User", "blue"),
      Kas.ui.stat("\uD83D\uDCC5", api.all("jobs").filter((j) => j.status === "open").length, "Pekerjaan Aktif", "orange"),
      Kas.ui.stat("\uD83D\uDCB0", u.rupiah(masukBln), "Kas Masuk (bln ini)", "purple"),
    ]));
    const trend = api.kasWeekly();
    const chartCard = cardWith("Trend Kas 7 Hari", null);
    Kas.components.chart(chartCard, { type: "line", labels: trend.labels, datasets: [{ label: "Kas", data: trend.data, color: "#2e7d32" }] });
    const notif = cardWith("Notifikasi Pending", null);
    const pend = el("div");
    const appeals = api.all("banned_devices").filter((b) => b.appeal_status === "pending");
    pend.innerHTML = `<div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>Appeal device banned</span><span class="badge badge-warning">${appeals.length}</span></div>
      <div class="flex justify-between" style="padding:8px 0;border-bottom:1px solid var(--border)"><span>Akun terkunci</span><span class="badge badge-warning">${api.all("users").filter((x) => x.is_locked).length}</span></div>
      <div class="flex justify-between" style="padding:8px 0"><span>Pinjaman aktif</span><span class="badge badge-info">${u.rupiah(loanActive)}</span></div>`;
    notif.appendChild(pend);
    root.appendChild(el("div", { class: "grid grid-2", style: "margin-top:18px;grid-template-columns:2fr 1fr" }, [chartCard, notif]));
  };

  P["superadmin/admins"] = function (root) {
    root.appendChild(h("Manajemen Admin", "Kelola akun admin & lihat jumlah member."));
    const crud = Kas.components.crud({
      singular: "Admin", table: "admins",
      getData: () => api.all("admins").map((a) => { const usr = api.userById(a.user_id) || {}; return { ...a, username: usr.username, email: usr.email, members: api.membersForAdmin(a.user_id).length, active: usr.is_active }; }),
      searchKeys: ["full_name", "username", "email"],
      columns: [
        { label: "No", render: (_, i) => i },
        { label: "Nama", key: "full_name" },
        { label: "Username", render: (r) => "<code>" + u.escape(r.username || "-") + "</code>" },
        { label: "Email", render: (r) => u.escape(r.email || "-") },
        { label: "Member", render: (r) => `<span class="badge badge-info">${r.members}</span>` },
        { label: "Status", render: (r) => Kas.statusBadge(r.active ? "active" : "closed") },
      ],
      fields: [
        { name: "full_name", label: "Nama Lengkap", required: true, half: true },
        { name: "username", label: "Username", required: true, half: true },
        { name: "email", label: "Email", type: "email", half: true, validate: [Kas.validate.rules.email] },
        { name: "phone", label: "No. HP", half: true },
        { name: "password", label: "Password Default", default: "1023456789", hint: "Admin wajib ganti saat login pertama." },
      ],
      beforeSave: (obj, isNew, row) => {
        if (isNew) {
          const newUser = api.add("users", { username: obj.username, password: obj.password || "1023456789", email: obj.email, phone: obj.phone, role: "admin", full_name: obj.full_name, is_active: true, is_locked: false, force_change_password: true, created_by: Kas.auth.currentUser().id });
          const adminRec = { user_id: newUser.id, full_name: obj.full_name, created_by: Kas.auth.currentUser().id };
          // also create worker record
          return adminRec;
        } else {
          api.update("users", row.user_id, { full_name: obj.full_name, username: obj.username, email: obj.email, phone: obj.phone });
          return { full_name: obj.full_name };
        }
      },
      onChange: () => {},
      rowActions: (row) => {
        const reset = el("button", { class: "btn btn-ghost btn-sm", title: "Reset Password", html: "\uD83D\uDD11" });
        reset.addEventListener("click", () => Kas.modal.confirm({ title: "Reset Password", message: `Reset password ${row.full_name} ke default '1023456789'?`, onOk: () => { api.update("users", row.user_id, { password: "1023456789", force_change_password: true }); Kas.security.resetAccount(row.username); Kas.toast("Password direset", "success"); } }));
        const unlock = el("button", { class: "btn btn-ghost btn-sm", title: "Buka Kunci", html: "\uD83D\uDD13" });
        unlock.addEventListener("click", () => { api.update("users", row.user_id, { is_locked: false }); Kas.security.resetAccount(row.username); Kas.toast("Akun dibuka", "success"); });
        return [reset, unlock];
      },
    });
    root.appendChild(crud.element);
  };

  P["superadmin/users"] = function (root) { usersManager(root, null); };

  function usersManager(root, creatorUserId) {
    root.appendChild(h(creatorUserId ? "Member Saya" : "Manajemen User", "Kelola akun user / member."));
    const adminUserOpts = api.all("admins").map((a) => ({ value: a.user_id, label: a.full_name }));
    const crud = Kas.components.crud({
      singular: creatorUserId ? "Member" : "User", table: "users",
      getData: () => api.all("users").filter((x) => x.role === "user" && (!creatorUserId || x.created_by === creatorUserId)),
      searchKeys: ["full_name", "username", "phone"],
      columns: [
        { label: "No", render: (_, i) => i },
        { label: "Nama", key: "full_name" },
        { label: "Member dari", render: (r) => u.escape(api.userById(r.created_by)?.full_name || "-") },
        { label: "No. HP", render: (r) => u.escape(r.phone || "-") },
        { label: "Status", render: (r) => Kas.statusBadge(r.is_locked ? "locked" : r.is_active ? "active" : "closed") },
      ],
      fields: [
        { name: "full_name", label: "Nama", required: true, half: true },
        { name: "phone", label: "No. HP", half: true, validate: [Kas.validate.rules.phone] },
        { name: "address", label: "Alamat", type: "textarea" },
        creatorUserId
          ? { name: "created_by", label: "Admin", type: "hidden", default: creatorUserId }
          : { name: "created_by", label: "Assign ke Admin", type: "select", options: adminUserOpts, required: true },
      ],
      beforeSave: (obj, isNew, row) => {
        const creator = creatorUserId || Number(obj.created_by);
        if (isNew) {
          const uname = obj.full_name.toLowerCase().split(" ")[0] + Math.floor(Math.random() * 90 + 10);
          const usr = api.add("users", { username: uname, password: "User2026", role: "user", full_name: obj.full_name, phone: obj.phone, is_active: true, is_locked: false, force_change_password: false, created_by: creator });
          const adminRec = api.adminByUserId(creator);
          api.add("workers", { user_id: usr.id, name: obj.full_name, address: obj.address || "", phone: obj.phone, admin_id: adminRec ? adminRec.id : 1, is_active: true });
          return null; // we've added manually
        } else {
          const w = api.workerByUserId(row.id); if (w) api.update("workers", w.id, { name: obj.full_name, address: obj.address, phone: obj.phone });
          return { full_name: obj.full_name, phone: obj.phone };
        }
      },
      rowActions: (row) => {
        const reset = el("button", { class: "btn btn-ghost btn-sm", title: "Reset Password", html: "\uD83D\uDD11" });
        reset.addEventListener("click", () => { api.update("users", row.id, { password: "User2026" }); Kas.security.resetAccount(row.username); Kas.toast("Password direset ke 'User2026'", "success"); });
        const unlock = el("button", { class: "btn btn-ghost btn-sm", title: "Buka Kunci", html: "\uD83D\uDD13" });
        unlock.addEventListener("click", () => { api.update("users", row.id, { is_locked: false, is_active: true }); Kas.security.resetAccount(row.username); Kas.toast("Akun dibuka", "success"); });
        const perf = el("button", { class: "btn btn-ghost btn-sm", title: "Performa", html: "\uD83D\uDCC8" });
        perf.addEventListener("click", () => showWorkerPerf(row));
        return [reset, unlock, perf];
      },
    });
    root.appendChild(crud.element);
  }

  function showWorkerPerf(userRow) {
    const w = api.workerByUserId(userRow.id);
    if (!w) { Kas.toast("Data pekerja tidak ditemukan", "warning"); return; }
    const p = api.performance(w.id);
    const box = el("div");
    box.innerHTML = `<div class="grid grid-2">
      <div class="card card-2"><div class="stat-label">Hari Kerja</div><strong>${p.days} hari</strong></div>
      <div class="card card-2"><div class="stat-label">Total Kas</div><strong>${u.rupiah(p.totalKas)}</strong></div>
      <div class="card card-2"><div class="stat-label">Sisa Pinjaman</div><strong>${u.rupiah(p.outstanding)}</strong></div>
      <div class="card card-2"><div class="stat-label">Status Pinjaman</div><strong>${p.loanStatus}</strong></div></div>`;
    const close = el("button", { class: "btn btn-primary", text: "Tutup" });
    const m = Kas.modal.open({ title: "Performa: " + userRow.full_name, body: box, footer: [close] });
    close.addEventListener("click", m.close);
  }

  P["superadmin/workers"] = function (root) { workersTable(root, null); };
  P["superadmin/kas"] = function (root) { kasPage(root, null); };
  P["superadmin/jobs"] = function (root, user) { jobsPage(root, user, null); };
  P["superadmin/reports"] = function (root, user) { reportsPage(root, user, null); };
  P["superadmin/settings"] = function (root, user) { settingsPage(root, user, true); };

  P["superadmin/export"] = function (root) {
    root.appendChild(h("Export / Import", "Backup & restore data dalam format JSON, atau cetak PDF."));
    const exp = cardWith("Export Data", null);
    const eb = el("div", { class: "flex gap wrap" });
    [["Semua Data", () => exportJSON(api.raw(), "kaspetani-full")], ["Kas Harian", () => exportJSON(api.all("daily_kas"), "kas")], ["Pekerja", () => exportJSON(api.all("workers"), "workers")], ["Pekerjaan", () => exportJSON(api.all("jobs"), "jobs")]].forEach(([label, fn]) => {
      const b = el("button", { class: "btn btn-ghost", html: "\uD83D\uDCE6 " + label }); b.addEventListener("click", fn); eb.appendChild(b);
    });
    const pdfb = el("button", { class: "btn btn-ghost", html: "\uD83D\uDCC4 Cetak / PDF" }); pdfb.addEventListener("click", () => window.print()); eb.appendChild(pdfb);
    exp.appendChild(eb);
    root.appendChild(exp);

    const imp = cardWith("Import Data (JSON)", null);
    imp.style.marginTop = "18px";
    const file = el("input", { type: "file", accept: "application/json", class: "input" });
    const preview = el("pre", { style: "max-height:200px;overflow:auto;background:var(--card-2);padding:12px;border-radius:8px;font-size:.8rem;display:none" });
    file.addEventListener("change", () => {
      const f = file.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { const data = JSON.parse(r.result); preview.style.display = "block"; preview.textContent = JSON.stringify(data, null, 2).slice(0, 2000); Kas.toast("File valid. Preview ditampilkan.", "success"); } catch (e) { Kas.toast("File JSON tidak valid", "error"); } };
      r.readAsText(f);
    });
    imp.appendChild(file); imp.appendChild(preview);
    imp.appendChild(el("p", { class: "field-hint", text: "Mode demo: import hanya menampilkan preview, tidak menimpa data." }));
    root.appendChild(imp);
  };

  P["superadmin/gallery"] = function (root) {
    root.appendChild(h("Manajemen Galeri", "Kelola foto dokumentasi."));
    const crud = Kas.components.crud({
      singular: "Foto", table: "gallery", getData: () => api.all("gallery"), searchKeys: ["title", "description"],
      columns: [
        { label: "Preview", render: (r) => `<img src="${Kas.url(r.image_url)}" style="width:60px;height:40px;object-fit:cover;border-radius:6px" alt="">` },
        { label: "Judul", key: "title" },
        { label: "Deskripsi", render: (r) => u.escape((r.description || "").slice(0, 50)) },
        { label: "Tanggal", render: (r) => u.fmtDate(r.created_at) },
      ],
      fields: [
        { name: "title", label: "Judul", required: true },
        { name: "image_url", label: "URL Gambar", default: "assets/images/gallery/kebun.svg", hint: "Demo: gunakan path gambar yang ada." },
        { name: "description", label: "Deskripsi", type: "textarea" },
      ],
      beforeSave: (obj) => { obj.uploaded_by = Kas.auth.currentUser().id; return obj; },
    });
    root.appendChild(crud.element);
  };

  P["superadmin/news"] = function (root) {
    root.appendChild(h("Manajemen Berita", "Kelola artikel & pengumuman."));
    const crud = Kas.components.crud({
      singular: "Berita", table: "news", getData: () => api.all("news"), searchKeys: ["title", "category"],
      columns: [
        { label: "Judul", key: "title" },
        { label: "Kategori", render: (r) => `<span class="badge badge-info">${u.escape(r.category || "Umum")}</span>` },
        { label: "Penulis", render: (r) => u.escape(api.userById(r.author_id)?.full_name || "-") },
        { label: "Tanggal", render: (r) => u.fmtDate(r.created_at) },
        { label: "Status", render: (r) => Kas.statusBadge(r.is_published ? "active" : "closed") },
      ],
      fields: [
        { name: "title", label: "Judul", required: true },
        { name: "category", label: "Kategori", half: true, default: "Umum" },
        { name: "image_url", label: "URL Gambar", half: true, default: "assets/images/news/1.svg" },
        { name: "content", label: "Konten", type: "textarea", rows: 5, required: true },
        { name: "is_published", label: "Status", type: "select", options: [{ value: "true", label: "Publish" }, { value: "false", label: "Draft" }], default: "true" },
      ],
      beforeSave: (obj) => { obj.is_published = obj.is_published === "true" || obj.is_published === true; obj.author_id = Kas.auth.currentUser().id; return obj; },
    });
    root.appendChild(crud.element);
  };

  P["superadmin/security"] = function (root) {
    root.appendChild(h("Keamanan & Monitoring", "Log login, perangkat diblokir, dan audit trail."));
    const tabs = el("div", { class: "pill-tabs" });
    const panel = el("div");
    const views = {
      "Log Login": () => Kas.components.dataTable({
        searchKeys: ["username_attempt", "ip_address"], getData: () => api.all("security_logs"),
        columns: [
          { label: "Waktu", render: (r) => r.attempt_time },
          { label: "Username", render: (r) => "<code>" + u.escape(r.username_attempt) + "</code>" },
          { label: "IP", key: "ip_address" },
          { label: "Device", render: (r) => u.escape(r.user_agent) },
          { label: "Status", render: (r) => Kas.statusBadge(r.attempt_status) },
          { label: "Gagal", key: "failure_count" },
        ],
      }).element,
      "Device Banned": () => {
        const dt = Kas.components.dataTable({
          searchKeys: ["ip_address", "ban_reason"], getData: () => api.all("banned_devices"),
          columns: [
            { label: "IP", key: "ip_address" },
            { label: "Alasan", render: (r) => u.escape(r.ban_reason) },
            { label: "Sampai", render: (r) => r.is_permanent ? '<span class="badge badge-danger">Permanen</span>' : u.fmtDate(r.ban_until) },
            { label: "Appeal", render: (r) => Kas.statusBadge(r.appeal_status === "none" ? "closed" : r.appeal_status === "pending" ? "pending" : "approved") },
            { label: "Aksi", render: (r) => { const b = el("button", { class: "btn btn-ghost btn-sm", text: "Unban" }); b.addEventListener("click", () => { api.remove("banned_devices", r.id); Kas.toast("Device di-unban", "success"); P["superadmin/security"](Kas.dom.clear(root)); }); return b; } },
          ],
        });
        return dt.element;
      },
      "Audit Trail": () => Kas.components.dataTable({
        searchKeys: ["action", "entity_type"], getData: () => api.all("activity_logs"),
        columns: [
          { label: "Waktu", render: (r) => r.created_at },
          { label: "User", render: (r) => u.escape(api.userById(r.user_id)?.full_name || "-") },
          { label: "Aksi", render: (r) => Kas.statusBadge(r.action === "CREATE" ? "approved" : r.action === "DELETE" ? "rejected" : "pending").replace(/>.*</, ">" + r.action + "<") },
          { label: "Entitas", render: (r) => u.escape(r.entity_type) + " #" + r.entity_id },
          { label: "IP", key: "ip_address" },
        ],
      }).element,
    };
    Object.keys(views).forEach((name, i) => {
      const b = el("button", { text: name });
      if (i === 0) b.classList.add("active");
      b.addEventListener("click", () => { tabs.querySelectorAll("button").forEach((x) => x.classList.remove("active")); b.classList.add("active"); Kas.dom.clear(panel).appendChild(views[name]()); });
      tabs.appendChild(b);
    });
    root.appendChild(tabs); root.appendChild(panel);
    panel.appendChild(views["Log Login"]());
  };

  /* =========================================================
     ADMIN
     ========================================================= */
  P["admin/dashboard"] = function (root, user) {
    const aId = adminIdOf(user);
    root.appendChild(h("Dashboard Admin", "Halo, " + user.full_name + "! Ringkasan member & kas Anda."));
    const myMembers = api.membersForAdmin(user.id).length;
    const today = u.todayISO();
    const kasToday = api.kasForAdmin(aId).filter((k) => k.work_date === today).reduce((s, k) => s + Number(k.total_kas || 0), 0);
    const myJobs = api.jobsForAdmin(aId).filter((j) => j.status === "open").length;
    const unread = api.notifsForUser(user.id).filter((n) => !n.is_read).length;
    root.appendChild(grid("grid-4", [
      Kas.ui.stat("\uD83D\uDC65", myMembers, "Member Saya"),
      Kas.ui.stat("\uD83D\uDCB0", u.rupiah(kasToday), "Kas Hari Ini", "purple"),
      Kas.ui.stat("\uD83D\uDCC5", myJobs, "Pekerjaan Aktif", "orange"),
      Kas.ui.stat("\uD83D\uDD14", unread, "Notifikasi Baru", "blue"),
    ]));
    const monthly = api.kasMonthly(api.kasForAdmin(aId));
    const chart = cardWith("Kas Member per Bulan", null);
    Kas.components.chart(chart, { type: "bar", labels: monthly.labels, datasets: [{ label: "Total Kas", data: monthly.kas, color: "#2e7d32" }] });
    root.appendChild(el("div", { style: "margin-top:18px" }, [chart]));

    const workers = api.workersForAdmin(aId);
    const rows = workers.map((w) => ({ name: w.name, ...api.performance(w.id) }));
    const tbl = Kas.components.dataTable({
      searchKeys: ["name"], getData: () => rows,
      columns: [
        { label: "Member", key: "name" },
        { label: "Hari Kerja", render: (r) => r.days + " hari" },
        { label: "Total Kas", render: (r) => u.rupiah(r.totalKas) },
        { label: "Status Pinjaman", render: (r) => r.loanStatus },
      ],
    });
    root.appendChild(el("div", { style: "margin-top:18px" }, [cardWith("Ringkasan Performa Member", tbl.element)]));
  };

  P["admin/members"] = function (root, user) { usersManager(root, user.id); };
  P["admin/workers"] = function (root, user) { root.appendChild(h("Pekerja", "Pekerja yang Anda kelola.")); workersTable(root, adminIdOf(user)); };
  P["admin/kas"] = function (root, user) { kasPage(root, adminIdOf(user)); };
  P["admin/jobs"] = function (root, user) { jobsPage(root, user, adminIdOf(user)); };
  P["admin/reports"] = function (root, user) { reportsPage(root, user, adminIdOf(user)); };
  P["admin/settings"] = function (root, user) { settingsPage(root, user, false); };

  /* =========================================================
     USER / MEMBER
     ========================================================= */
  P["user/dashboard"] = function (root, user) {
    const w = api.workerByUserId(user.id);
    const adminUser = api.userById(user.created_by);
    const banner = el("div", { class: "alert alert-info", html: `Anda adalah <b>member</b> dari Admin <b>${u.escape(adminUser ? adminUser.full_name : "-")}</b>.` });
    root.appendChild(banner);
    root.appendChild(h("Dashboard Saya", "Ringkasan performa dan aktivitas Anda."));
    const p = w ? api.performance(w.id) : { days: 0, totalKas: 0, outstanding: 0, loanStatus: "-" };
    root.appendChild(grid("grid-4", [
      Kas.ui.stat("\uD83D\uDCC5", p.days, "Hari Kerja"),
      Kas.ui.stat("\uD83D\uDCB0", u.rupiah(p.totalKas), "Total Kas", "purple"),
      Kas.ui.stat("\uD83E\uDE99", u.rupiah(p.outstanding), "Sisa Pinjaman", "red"),
      Kas.ui.stat("\u2705", p.loanStatus, "Status Pinjaman", "blue"),
    ]));
    const myRegs = api.regsForUser(user.id);
    const joined = myRegs.map((r) => ({ r, job: api.get("jobs", r.job_id) })).filter((x) => x.job);
    const jc = cardWith("Pekerjaan yang Diikuti", null);
    const list = el("div");
    if (!joined.length) list.innerHTML = `<div class="empty-state">Belum mendaftar pekerjaan. <a href="jobs.html">Cari pekerjaan</a></div>`;
    joined.forEach(({ r, job }) => list.appendChild(el("div", { class: "flex justify-between items-center", style: "padding:10px 0;border-bottom:1px solid var(--border)", html: `<div><strong>${u.escape(job.title)}</strong><div class="text-muted" style="font-size:.82rem">${u.fmtDate(job.work_date)} \u2022 ${u.escape(job.location)}</div></div>${Kas.statusBadge(r.status)}` })));
    jc.appendChild(list);
    root.appendChild(el("div", { style: "margin-top:18px" }, [jc]));
  };

  P["user/jobs"] = function (root, user) {
    root.appendChild(h("Pekerjaan Mendatang", "Daftar ke pekerjaan dan pantau status Anda."));
    const grid2 = el("div", { class: "job-grid" });
    api.all("jobs").filter((j) => j.status === "open").forEach((j) => grid2.appendChild(Kas.publicJobCard(j)));
    root.appendChild(grid2);
    // my registrations
    const myRegs = api.regsForUser(user.id);
    if (myRegs.length) {
      const sec = el("div", { style: "margin-top:26px" });
      sec.appendChild(el("h3", { text: "Pendaftaran Saya" }));
      const tbl = Kas.components.dataTable({
        getData: () => myRegs.map((r) => ({ r, job: api.get("jobs", r.job_id) })).filter((x) => x.job),
        columns: [
          { label: "Pekerjaan", render: (x) => u.escape(x.job.title) },
          { label: "Tanggal", render: (x) => u.fmtDate(x.job.work_date) },
          { label: "Status", render: (x) => Kas.statusBadge(x.r.status) },
          { label: "Aksi", render: (x) => { if (x.r.status !== "pending") return "-"; const b = el("button", { class: "btn btn-ghost btn-sm", text: "Batalkan" }); b.addEventListener("click", () => { api.update("job_registrations", x.r.id, { status: "cancelled" }); Kas.toast("Pendaftaran dibatalkan", "info"); P["user/jobs"](Kas.dom.clear(root), user); }); return b; } },
        ],
      });
      sec.appendChild(tbl.element); root.appendChild(sec);
    }
  };

  P["user/performance"] = function (root, user) {
    root.appendChild(h("Performa Saya", "Detail kinerja dan riwayat kas Anda."));
    const w = api.workerByUserId(user.id);
    if (!w) { root.appendChild(el("div", { class: "alert alert-warning", text: "Data pekerja belum tersedia." })); return; }
    const p = api.performance(w.id);
    root.appendChild(grid("grid-3", [
      Kas.ui.stat("\uD83D\uDCC5", p.days, "Total Hari Kerja"),
      Kas.ui.stat("\uD83D\uDCB0", u.rupiah(p.totalKas), "Total Kas", "purple"),
      Kas.ui.stat("\uD83D\uDCCA", u.rupiah(p.avg), "Rata-rata/Hari", "blue"),
      Kas.ui.stat("\uD83E\uDE99", u.rupiah(p.totalLoan), "Total Pinjaman", "orange"),
      Kas.ui.stat("\uD83D\uDCB8", u.rupiah(p.outstanding), "Sisa Pinjaman", "red"),
      Kas.ui.stat("\u2705", p.loanStatus + (p.dueDate ? " (" + u.fmtDate(p.dueDate) + ")" : ""), "Status Pinjaman"),
    ]));
    const monthly = api.kasMonthly(api.kasForWorker(w.id));
    const chart = cardWith("Kas per Bulan", null);
    Kas.components.chart(chart, { type: "line", labels: monthly.labels, datasets: [{ label: "Kas", data: monthly.kas, color: "#2e7d32" }] });
    root.appendChild(el("div", { style: "margin-top:18px" }, [chart]));
    const tbl = Kas.components.dataTable({
      searchKeys: ["workplace"], getData: () => p.history,
      columns: [
        { label: "Tanggal", render: (r) => u.fmtDate(r.work_date) },
        { label: "Tempat", render: (r) => u.escape(r.workplace) },
        { label: "Kas Masuk", render: (r) => u.rupiah(r.kas_masuk) },
        { label: "Kas", render: (r) => u.rupiah(r.total_kas) },
        { label: "Pinjaman", render: (r) => u.rupiah(r.pinjaman) },
      ],
    });
    root.appendChild(el("div", { style: "margin-top:18px" }, [cardWith("Riwayat Pekerjaan", tbl.element)]));
  };

  P["user/notifications"] = function (root, user) {
    root.appendChild(h("Notifikasi", "Pemberitahuan terbaru untuk Anda."));
    const list = api.notifsForUser(user.id).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    if (!list.length) { root.appendChild(el("div", { class: "empty-state", text: "Tidak ada notifikasi." })); return; }
    list.forEach((n) => {
      const item = el("div", { class: "card", style: "margin-bottom:12px" + (n.is_read ? ";opacity:.7" : "") });
      item.innerHTML = `<div class="flex justify-between items-center"><strong>${u.escape(n.title)}</strong>${Kas.statusBadge(n.type)}</div>
        <p style="margin:6px 0 4px">${u.escape(n.message)}</p><div class="text-muted" style="font-size:.78rem">${n.created_at}</div>`;
      if (!n.is_read) { const b = el("button", { class: "btn btn-ghost btn-sm", text: "Tandai dibaca" }); b.addEventListener("click", () => { api.update("notifications", n.id, { is_read: true }); P["user/notifications"](Kas.dom.clear(root), user); }); item.appendChild(b); }
      root.appendChild(item);
    });
  };

  P["user/settings"] = function (root, user) { settingsPage(root, user, false); };
})(window.Kas);
