/* ============================================================
   security.js — Proteksi brute force (Bagian 6 spesifikasi)
   Disimulasikan di sisi client untuk demo Phase 1.
   ============================================================ */
(function (Kas) {
  const KEY = "kaspetani_sec";
  const MIN = 60 * 1000;

  function state() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function persist(s) { localStorage.setItem(KEY, JSON.stringify(s)); }

  // Device fingerprint (mock, stabil per-browser)
  function fingerprint() {
    const s = state();
    if (!s.fp) { s.fp = "fp-" + Math.random().toString(36).slice(2, 10); persist(s); }
    return s.fp;
  }

  function init() {
    const s = state();
    s.accounts = s.accounts || {};   // username -> {fails, lockUntil, permanent}
    s.device = s.device || { fails: 0, banUntil: 0, permanent: false };
    persist(s);
    return s;
  }

  /* ---------- DEVICE (akun tidak terdaftar) ---------- */
  function isDeviceBanned() {
    const s = init();
    if (s.device.permanent) return { banned: true, permanent: true };
    if (s.device.banUntil && Date.now() < s.device.banUntil) return { banned: true, until: s.device.banUntil };
    return { banned: false };
  }
  function recordUnknownUser() {
    const s = init();
    s.device.fails++;
    const f = s.device.fails;
    let msg = `Username tidak ditemukan. Percobaan ke-${f}.`;
    if (f >= 15) { s.device.permanent = true; msg = "Perangkat diblokir PERMANEN setelah 15+ percobaan."; }
    else if (f >= 10) { s.device.banUntil = Date.now() + 24 * 60 * MIN; msg = "Perangkat diblokir 24 jam (10x percobaan)."; }
    else if (f >= 5) { s.device.banUntil = Date.now() + 30 * MIN; msg = "Perangkat diblokir 30 menit (5x percobaan)."; }
    persist(s);
    return { fails: f, banned: f >= 5, message: msg };
  }

  /* ---------- AKUN terdaftar ---------- */
  function accountState(username) {
    const s = init();
    const a = s.accounts[username] || { fails: 0, lockUntil: 0, permanent: false };
    return a;
  }
  function isAccountLocked(username) {
    const a = accountState(username);
    if (a.permanent) return { locked: true, permanent: true };
    if (a.lockUntil && Date.now() < a.lockUntil) return { locked: true, until: a.lockUntil };
    return { locked: false };
  }
  function recordAccountFailure(username) {
    const s = init();
    const a = s.accounts[username] || { fails: 0, lockUntil: 0, permanent: false };
    a.fails++;
    let msg = `Password salah. Sisa percobaan: ${Math.max(0, 3 - a.fails)}.`;
    if (a.fails >= 5) { a.permanent = true; msg = "Akun TERKUNCI PERMANEN. Hubungi atasan untuk reset."; }
    else if (a.fails >= 4) { a.lockUntil = Date.now() + 30 * MIN; msg = "Akun terkunci 30 menit (4x salah)."; }
    else if (a.fails >= 3) { a.lockUntil = Date.now() + 15 * MIN; msg = "Akun terkunci 15 menit (3x salah)."; }
    s.accounts[username] = a; persist(s);
    return { fails: a.fails, locked: a.fails >= 3, permanent: a.permanent, message: msg };
  }
  function resetAccount(username) {
    const s = init();
    s.accounts[username] = { fails: 0, lockUntil: 0, permanent: false };
    persist(s);
  }
  function resetAll() { localStorage.removeItem(KEY); init(); }

  Kas.security = {
    fingerprint, isDeviceBanned, recordUnknownUser,
    isAccountLocked, recordAccountFailure, resetAccount, accountState, resetAll, state: init,
  };
})(window.Kas);
