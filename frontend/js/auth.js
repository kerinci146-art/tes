/* ============================================================
   auth.js — Autentikasi & session (mock, Phase 1)
   ============================================================ */
(function (Kas) {
  const SKEY = "kaspetani_session";

  function currentUser() {
    try {
      const s = JSON.parse(localStorage.getItem(SKEY));
      if (!s) return null;
      return Kas.api.userById(s.userId) || null;
    } catch (e) { return null; }
  }

  function setSession(user) {
    localStorage.setItem(SKEY, JSON.stringify({ userId: user.id, role: user.role, at: Date.now() }));
  }
  function logout() { localStorage.removeItem(SKEY); }

  const dashboardFor = (role) => ({
    superadmin: "pages/superadmin/dashboard.html",
    admin: "pages/admin/dashboard.html",
    user: "pages/user/dashboard.html",
  }[role]);

  /* ---------- Login flow (Bagian 6.2) ---------- */
  function login(username, password) {
    const sec = Kas.security;
    const dev = sec.isDeviceBanned();
    if (dev.banned) return { ok: false, reason: "device_banned", redirect: "pages/banned.html" };

    const user = Kas.api.raw().users.find((u) => u.username === username);
    if (!user) {
      const r = sec.recordUnknownUser();
      if (r.banned) return { ok: false, reason: "device_banned", message: r.message, redirect: "pages/banned.html" };
      return { ok: false, reason: "unknown_user", message: r.message };
    }

    const lock = sec.isAccountLocked(username);
    if (lock.locked || user.is_locked) {
      return { ok: false, reason: lock.permanent ? "locked_permanent" : "locked", until: lock.until,
        redirect: lock.permanent ? "pages/recovery.html" : "pages/locked.html?u=" + encodeURIComponent(username) };
    }

    if (!user.is_active) return { ok: false, reason: "inactive", message: "Akun dinonaktifkan. Hubungi atasan." };

    if (user.password !== password) {
      const r = sec.recordAccountFailure(username);
      const out = { ok: false, reason: "wrong_password", message: r.message };
      if (r.permanent) { out.reason = "locked_permanent"; out.redirect = "pages/recovery.html"; }
      else if (r.locked) { out.reason = "locked"; out.redirect = "pages/locked.html?u=" + encodeURIComponent(username); }
      return out;
    }

    // success
    sec.resetAccount(username);
    setSession(user);
    return { ok: true, user, force: user.force_change_password, redirect: user.force_change_password ? "pages/forced-change.html" : dashboardFor(user.role) };
  }

  function changePassword(userId, oldPass, newPass) {
    const u = Kas.api.userById(userId);
    if (!u) return { ok: false, message: "User tidak ditemukan" };
    if (oldPass != null && u.password !== oldPass) return { ok: false, message: "Password lama salah" };
    if (newPass === u.password) return { ok: false, message: "Password baru tidak boleh sama dengan lama" };
    const policy = Kas.validate.passwordPolicy(newPass);
    if (policy) return { ok: false, message: policy };
    Kas.api.update("users", userId, { password: newPass, force_change_password: false });
    return { ok: true };
  }

  // Guard: panggil di halaman dashboard
  function requireAuth(roles) {
    const u = currentUser();
    if (!u) { window.location.href = Kas.url("pages/login.html"); return null; }
    if (u.force_change_password && !location.pathname.endsWith("forced-change.html")) {
      window.location.href = Kas.url("pages/forced-change.html"); return null;
    }
    if (roles && !roles.includes(u.role)) { window.location.href = Kas.url(dashboardFor(u.role)); return null; }
    return u;
  }

  Kas.auth = { currentUser, login, logout, changePassword, requireAuth, setSession, dashboardFor };
})(window.Kas);
