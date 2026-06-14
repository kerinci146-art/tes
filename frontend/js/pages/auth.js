/* ============================================================
   pages/auth.js — Login, recovery, locked, banned, forgot
   ============================================================ */
(function (Kas) {
  const { el } = Kas.dom;
  const P = Kas.pages;
  const u = Kas.util;

  function shell(inner) {
    const wrap = el("div", { class: "auth-wrap" });
    const card = el("div", { class: "card auth-card" });
    const brand = el("a", { class: "brand", href: Kas.url("pages/index.html") });
    brand.innerHTML = `<span class="logo">\uD83C\uDF31</span> Kas Petani`;
    card.appendChild(brand);
    card.appendChild(inner);
    const foot = el("div", { class: "text-center", style: "margin-top:14px" });
    foot.innerHTML = `<a href="${Kas.url("pages/index.html")}" style="font-size:.85rem">\u2190 Kembali ke beranda</a> &nbsp;\u2022&nbsp; <button class="btn btn-ghost btn-sm" data-theme-toggle="1" style="vertical-align:middle">Tema</button>`;
    card.appendChild(foot);
    wrap.appendChild(card);
    return wrap;
  }

  /* ---------- Login ---------- */
  P["login"] = function (root) {
    const cu = Kas.auth.currentUser();
    if (cu) { window.location.href = Kas.url(Kas.auth.dashboardFor(cu.role)); return; }

    const box = el("div");
    box.innerHTML = `
      <h3 style="text-align:center;margin-bottom:4px">Masuk</h3>
      <p class="text-muted text-center" style="font-size:.88rem;margin-bottom:18px">Gunakan akun Anda untuk mengakses dashboard.</p>
      <div class="alert alert-info" style="font-size:.8rem">Demo: <b>superadmin</b> / <b>1023456789</b> \u2022 <b>admin</b> / <b>1023456789</b> \u2022 <b>joko</b> / <b>User2026</b></div>`;
    const form = el("form");
    form.innerHTML = `
      <div class="form-group"><label>Username <span class="req">*</span></label><input class="input" name="username" autocomplete="username" required><div class="field-error"></div></div>
      <div class="form-group"><label>Password <span class="req">*</span></label>
        <div class="input-icon"><input class="input" name="password" type="password" autocomplete="current-password" required>
        <button type="button" class="toggle-pass" title="Lihat">\uD83D\uDC41</button></div><div class="field-error"></div></div>`;
    const submit = el("button", { class: "btn btn-primary btn-block", text: "Masuk", type: "submit", style: "margin-top:6px" });
    form.appendChild(submit);
    form.appendChild(el("div", { class: "text-center", style: "margin-top:12px", html: `<a href="forgot-password.html" style="font-size:.85rem">Lupa password?</a>` }));
    box.appendChild(form);
    box.appendChild(el("div", { class: "alert alert-warning", style: "margin-top:16px;font-size:.78rem", html: "\u26A0 Demi keamanan, akun akan terkunci setelah 3x gagal dan perangkat diblokir setelah 5x percobaan username tak dikenal." }));

    form.querySelector(".toggle-pass").addEventListener("click", function () {
      const p = form.elements.password; p.type = p.type === "password" ? "text" : "password";
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = Kas.validate.validateForm(form, { username: [Kas.validate.rules.required], password: [Kas.validate.rules.required] });
      if (!ok) return;
      const res = Kas.auth.login(form.elements.username.value.trim(), form.elements.password.value);
      if (res.ok) { Kas.toast("Login berhasil", "success"); setTimeout(() => (window.location.href = Kas.url(res.redirect)), 300); return; }
      if (res.redirect) { window.location.href = Kas.url(res.redirect); return; }
      Kas.toast(res.message || "Login gagal", "error");
    });

    root.appendChild(shell(box));
  };

  /* ---------- Forced change password ---------- */
  P["forced-change"] = function (root) {
    const cu = Kas.auth.currentUser();
    if (!cu) { window.location.href = Kas.url("pages/login.html"); return; }
    const box = el("div");
    box.innerHTML = `<h3 style="text-align:center">Ganti Password</h3>
      <div class="alert alert-warning" style="font-size:.82rem">Anda login dengan password default. Wajib menggantinya sebelum melanjutkan.</div>`;
    const form = el("form");
    form.innerHTML = `
      <div class="form-group"><label>Password Lama <span class="req">*</span></label><input class="input" name="old" type="password" required><div class="field-error"></div></div>
      <div class="form-group"><label>Password Baru <span class="req">*</span></label><input class="input" name="np" type="password" required>
        <div class="progress" style="margin-top:8px"><span id="pwbar" style="width:0"></span></div>
        <div class="field-hint">Min 8 karakter, ada huruf besar, kecil, dan angka.</div><div class="field-error"></div></div>
      <div class="form-group"><label>Konfirmasi Password <span class="req">*</span></label><input class="input" name="cp" type="password" required><div class="field-error"></div></div>`;
    const btn = el("button", { class: "btn btn-primary btn-block", text: "Simpan & Lanjut", type: "submit" });
    form.appendChild(btn);
    form.elements.np.addEventListener("input", function () {
      const s = Kas.validate.passwordStrength(this.value);
      const bar = form.querySelector("#pwbar");
      bar.style.width = (s / 5 * 100) + "%";
      bar.style.background = s <= 2 ? "var(--red)" : s <= 3 ? "var(--orange)" : "var(--green)";
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = Kas.validate.validateForm(form, { old: [Kas.validate.rules.required], np: [Kas.validate.rules.required, Kas.validate.passwordPolicy], cp: [Kas.validate.rules.required] });
      if (!ok) return;
      if (form.elements.np.value !== form.elements.cp.value) { form.querySelectorAll(".field-error")[2].textContent = "Konfirmasi tidak cocok"; return; }
      const res = Kas.auth.changePassword(cu.id, form.elements.old.value, form.elements.np.value);
      if (!res.ok) { Kas.toast(res.message, "error"); return; }
      Kas.toast("Password berhasil diganti!", "success");
      setTimeout(() => (window.location.href = "../" + Kas.auth.dashboardFor(cu.role)), 400);
    });
    box.appendChild(form);
    root.appendChild(shell(box));
  };

  /* ---------- Locked ---------- */
  P["locked"] = function (root) {
    const params = new URLSearchParams(location.search);
    const uname = params.get("u") || "";
    const st = uname ? Kas.security.accountState(uname) : { lockUntil: Date.now() + 15 * 60000 };
    const until = st.lockUntil || (Date.now() + 15 * 60000);
    const box = el("div", { class: "text-center" });
    box.innerHTML = `<div style="font-size:3rem">\uD83D\uDD12</div><h3>Akun Terkunci Sementara</h3>
      <p class="text-muted">Terlalu banyak percobaan login gagal. Coba lagi setelah waktu berikut atau hubungi atasan Anda.</p>
      <div class="countdown" id="cd">--:--</div>`;
    const back = el("a", { class: "btn btn-primary btn-block", href: "login.html", text: "Kembali ke Login", style: "margin-top:16px" });
    box.appendChild(back);
    box.appendChild(el("a", { class: "btn btn-ghost btn-block", href: "https://wa.me/6281200000001", target: "_blank", rel: "noopener", text: "Hubungi Atasan", style: "margin-top:8px" }));
    root.appendChild(shell(box));
    const cd = box.querySelector("#cd");
    const tick = () => {
      const ms = until - Date.now();
      if (ms <= 0) { cd.textContent = "Sudah bisa login"; cd.style.color = "var(--green)"; return; }
      const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
      cd.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      setTimeout(tick, 1000);
    };
    tick();
  };

  /* ---------- Banned ---------- */
  P["banned"] = function (root) {
    const dev = Kas.security.isDeviceBanned();
    const box = el("div", { class: "text-center" });
    box.innerHTML = `<div style="font-size:3rem">\uD83D\uDEAB</div><h3>Perangkat Diblokir</h3>
      <p class="text-muted">Perangkat ini diblokir karena aktivitas login mencurigakan. ${dev.permanent ? "Status: <b>PERMANEN</b>." : "Coba lagi nanti atau ajukan banding."}</p>`;
    const form = el("form", { style: "text-align:left;margin-top:10px" });
    form.innerHTML = `<div class="form-group"><label>Alasan Banding</label><textarea class="input" name="reason" placeholder="Jelaskan kenapa perangkat Anda harus dibuka..." required></textarea><div class="field-error"></div></div>`;
    const btn = el("button", { class: "btn btn-primary btn-block", text: "Kirim Banding ke Super Admin", type: "submit" });
    form.appendChild(btn);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.elements.reason.value.trim()) { form.querySelector(".field-error").textContent = "Wajib diisi"; return; }
      Kas.toast("Banding terkirim ke Super Admin (demo).", "success");
      form.reset();
    });
    box.appendChild(form);
    box.appendChild(el("a", { class: "btn btn-ghost btn-block", href: "login.html", text: "Kembali", style: "margin-top:10px" }));
    root.appendChild(shell(box));
  };

  /* ---------- Recovery (locked permanen) ---------- */
  P["recovery"] = function (root) {
    const box = el("div");
    box.innerHTML = `<div class="text-center" style="font-size:3rem">\uD83D\uDD11</div><h3 style="text-align:center">Pemulihan Akun</h3>
      <p class="text-muted text-center">Akun Anda terkunci permanen. Ajukan reset password ke atasan (Admin / Super Admin).</p>`;
    const form = el("form");
    form.innerHTML = `
      <div class="form-group"><label>Username <span class="req">*</span></label><input class="input" name="username" required><div class="field-error"></div></div>
      <div class="form-group"><label>No. HP terdaftar <span class="req">*</span></label><input class="input" name="phone" required><div class="field-error"></div></div>
      <div class="form-group"><label>Pesan untuk atasan</label><textarea class="input" name="msg"></textarea></div>`;
    const btn = el("button", { class: "btn btn-primary btn-block", text: "Kirim Permintaan Reset", type: "submit" });
    form.appendChild(btn);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = Kas.validate.validateForm(form, { username: [Kas.validate.rules.required], phone: [Kas.validate.rules.required, Kas.validate.rules.phone] });
      if (!ok) return;
      Kas.toast("Permintaan reset terkirim ke atasan (demo).", "success");
      form.reset();
    });
    box.appendChild(form);
    box.appendChild(el("div", { class: "text-center", style: "margin-top:10px", html: `<a href="login.html" style="font-size:.85rem">Kembali ke login</a>` }));
    root.appendChild(shell(box));
  };

  /* ---------- Forgot password ---------- */
  P["forgot-password"] = function (root) {
    const box = el("div");
    box.innerHTML = `<h3 style="text-align:center">Lupa Password</h3>
      <p class="text-muted text-center" style="font-size:.88rem">Verifikasi data Anda. Reset akan diproses oleh atasan Anda.</p>`;
    const form = el("form");
    form.innerHTML = `
      <div class="form-group"><label>Username <span class="req">*</span></label><input class="input" name="username" required><div class="field-error"></div></div>
      <div class="form-group"><label>Email / No HP <span class="req">*</span></label><input class="input" name="contact" required><div class="field-error"></div></div>`;
    const btn = el("button", { class: "btn btn-primary btn-block", text: "Kirim Permintaan", type: "submit" });
    form.appendChild(btn);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = Kas.validate.validateForm(form, { username: [Kas.validate.rules.required], contact: [Kas.validate.rules.required] });
      if (!ok) return;
      Kas.toast("Jika data cocok, atasan akan mereset password Anda (demo).", "success");
      form.reset();
    });
    box.appendChild(form);
    box.appendChild(el("div", { class: "text-center", style: "margin-top:10px", html: `<a href="login.html" style="font-size:.85rem">Kembali ke login</a>` }));
    root.appendChild(shell(box));
  };
})(window.Kas);
