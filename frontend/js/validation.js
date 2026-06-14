/* ============================================================
   validation.js — Validasi form
   ============================================================ */
(function (Kas) {
  const rules = {
    required: (v) => (String(v == null ? "" : v).trim() !== "" ? null : "Wajib diisi"),
    email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Format email tidak valid"),
    phone: (v) => (!v || /^[0-9+\-\s]{8,20}$/.test(v) ? null : "Nomor HP tidak valid"),
    min: (n) => (v) => (String(v || "").length >= n ? null : `Minimal ${n} karakter`),
    number: (v) => (v === "" || v == null || !isNaN(Number(v)) ? null : "Harus berupa angka"),
  };

  // Kebijakan password (bagian 5.2): min 8, huruf besar, huruf kecil, angka
  function passwordPolicy(v) {
    if (!v || v.length < 8) return "Minimal 8 karakter";
    if (!/[A-Z]/.test(v)) return "Harus ada huruf besar";
    if (!/[a-z]/.test(v)) return "Harus ada huruf kecil";
    if (!/[0-9]/.test(v)) return "Harus ada angka";
    return null;
  }

  function passwordStrength(v) {
    let score = 0;
    if (!v) return 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[a-z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    return score; // 0..5
  }

  /* Validasi satu form berdasarkan map field -> [validators] */
  function validateForm(form, schema) {
    let ok = true;
    for (const [name, validators] of Object.entries(schema)) {
      const field = form.elements[name];
      if (!field) continue;
      const errBox = field.closest(".form-group")?.querySelector(".field-error");
      let msg = null;
      for (const fn of validators) { msg = fn(field.value); if (msg) break; }
      if (msg) { ok = false; field.classList.add("invalid"); if (errBox) errBox.textContent = msg; }
      else { field.classList.remove("invalid"); if (errBox) errBox.textContent = ""; }
    }
    return ok;
  }

  Kas.validate = { rules, passwordPolicy, passwordStrength, validateForm };
})(window.Kas);
