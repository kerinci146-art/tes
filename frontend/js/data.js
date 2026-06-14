/* ============================================================
   data.js — Dataset mock untuk demo (Phase 1)
   Disimpan sebagai window.SEED_DATA. Saat runtime, data dikelola
   oleh store.js dan dipersist ke localStorage agar CRUD demo
   tetap tersimpan antar halaman.
   ============================================================ */
(function () {
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return iso(d); };
  const daysAhead = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

  // --- Users (akun login) ---
  // password disimpan apa adanya untuk MOCK saja (Phase 1, tanpa backend).
  const users = [
    { id: 1, username: "superadmin", password: "1023456789", email: "superadmin@kaspetani.id", phone: "081200000001", role: "superadmin", full_name: "Super Administrator", is_active: true, is_locked: false, force_change_password: true, created_by: null, created_at: "2026-01-01" },
    { id: 2, username: "admin", password: "1023456789", email: "admin@kaspetani.id", phone: "081200000002", role: "admin", full_name: "Budi Santoso", is_active: true, is_locked: false, force_change_password: true, created_by: 1, created_at: "2026-01-02" },
    { id: 3, username: "admin_sari", password: "Admin2026", email: "sari@kaspetani.id", phone: "081200000003", role: "admin", full_name: "Sari Wahyuni", is_active: true, is_locked: false, force_change_password: false, created_by: 1, created_at: "2026-01-05" },
    { id: 4, username: "joko", password: "User2026", email: "joko@mail.id", phone: "081311112222", role: "user", full_name: "Joko Susilo", is_active: true, is_locked: false, force_change_password: false, created_by: 2, created_at: "2026-01-08" },
    { id: 5, username: "wati", password: "User2026", email: "wati@mail.id", phone: "081311113333", role: "user", full_name: "Wati Lestari", is_active: true, is_locked: false, force_change_password: false, created_by: 2, created_at: "2026-01-09" },
    { id: 6, username: "agus", password: "User2026", email: "agus@mail.id", phone: "081311114444", role: "user", full_name: "Agus Pranoto", is_active: false, is_locked: true, force_change_password: false, created_by: 3, created_at: "2026-01-10" },
    { id: 7, username: "rina", password: "User2026", email: "rina@mail.id", phone: "081311115555", role: "user", full_name: "Rina Marlina", is_active: true, is_locked: false, force_change_password: false, created_by: 3, created_at: "2026-01-12" },
  ];

  // --- Admins ---
  const admins = [
    { id: 1, user_id: 2, full_name: "Budi Santoso", created_by: 1, created_at: "2026-01-02" },
    { id: 2, user_id: 3, full_name: "Sari Wahyuni", created_by: 1, created_at: "2026-01-05" },
  ];

  // --- Workers (pekerja) ---
  const workers = [
    { id: 1, user_id: 4, name: "Joko Susilo", address: "Dusun Krajan, Desa Sukamaju", phone: "081311112222", admin_id: 1, is_active: true, created_at: "2026-01-08" },
    { id: 2, user_id: 5, name: "Wati Lestari", address: "Dusun Tengah, Desa Sukamaju", phone: "081311113333", admin_id: 1, is_active: true, created_at: "2026-01-09" },
    { id: 3, user_id: 6, name: "Agus Pranoto", address: "Dusun Kidul, Desa Makmur", phone: "081311114444", admin_id: 2, is_active: false, created_at: "2026-01-10" },
    { id: 4, user_id: 7, name: "Rina Marlina", address: "Dusun Lor, Desa Makmur", phone: "081311115555", admin_id: 2, is_active: true, created_at: "2026-01-12" },
    { id: 5, user_id: null, name: "Slamet Riyadi", address: "Dusun Krajan, Desa Sukamaju", phone: "081311116666", admin_id: 1, is_active: true, created_at: "2026-01-15" },
    { id: 6, user_id: null, name: "Tini Suhartini", address: "Dusun Wetan, Desa Makmur", phone: "081311117777", admin_id: 2, is_active: true, created_at: "2026-01-18" },
  ];

  // --- Daily Kas ---
  const places = ["Kebun Kopi Blok A", "Sawah Pak Hadi", "Ladang Jagung Timur", "Kebun Cabai Desa", "Perkebunan Karet Utara"];
  const daily_kas = [];
  let kid = 1;
  for (let w = 1; w <= 6; w++) {
    const n = 4 + (w % 3);
    for (let i = 0; i < n; i++) {
      const masuk = 80000 + Math.round(Math.random() * 9) * 10000;
      const keluar = Math.round(Math.random() * 3) * 5000;
      const pinjam = i === 0 && w % 2 === 0 ? 200000 : 0;
      daily_kas.push({
        id: kid++, worker_id: w, work_date: daysAgo(i * 3 + w),
        workplace: places[(i + w) % places.length],
        kas_masuk: masuk, kas_keluar: keluar, pinjaman: pinjam,
        total_kas: masuk - keluar, total_pinjaman: pinjam,
        return_date: pinjam ? daysAhead(20) : null,
        notes: pinjam ? "Pinjaman untuk kebutuhan keluarga" : "",
        created_by: workers[w - 1].admin_id === 1 ? 2 : 3,
        created_at: daysAgo(i * 3 + w),
      });
    }
  }

  // --- Jobs ---
  const jobs = [
    { id: 1, admin_id: 1, title: "Panen Kopi Blok A", location: "Kebun Kopi, Desa Sukamaju", work_date: daysAhead(3), needed_workers: 8, description: "Panen buah kopi merah, butuh tenaga terampil. Disediakan makan siang.", status: "open", created_at: daysAgo(2) },
    { id: 2, admin_id: 1, title: "Tanam Padi Serentak", location: "Sawah Pak Hadi", work_date: daysAhead(6), needed_workers: 12, description: "Penanaman bibit padi musim tanam. Upah harian + bonus.", status: "open", created_at: daysAgo(1) },
    { id: 3, admin_id: 2, title: "Pemupukan Jagung", location: "Ladang Jagung Timur", work_date: daysAhead(9), needed_workers: 5, description: "Pemupukan susulan tanaman jagung umur 30 hari.", status: "open", created_at: daysAgo(1) },
    { id: 4, admin_id: 2, title: "Penyiangan Kebun Cabai", location: "Kebun Cabai Desa", work_date: daysAhead(12), needed_workers: 6, description: "Membersihkan gulma di kebun cabai seluas 1 hektar.", status: "open", created_at: daysAgo(0) },
    { id: 5, admin_id: 1, title: "Pemangkasan Karet", location: "Perkebunan Karet Utara", work_date: daysAgo(5), needed_workers: 4, description: "Pemangkasan dan perawatan pohon karet.", status: "completed", created_at: daysAgo(15) },
  ];

  // --- Job registrations ---
  const job_registrations = [
    { id: 1, job_id: 1, user_id: 4, status: "approved", registered_at: daysAgo(2) },
    { id: 2, job_id: 1, user_id: 5, status: "pending", registered_at: daysAgo(1) },
    { id: 3, job_id: 1, user_id: 7, status: "pending", registered_at: daysAgo(1) },
    { id: 4, job_id: 2, user_id: 4, status: "approved", registered_at: daysAgo(1) },
    { id: 5, job_id: 3, user_id: 7, status: "approved", registered_at: daysAgo(1) },
    { id: 6, job_id: 4, user_id: 5, status: "pending", registered_at: daysAgo(0) },
  ];

  // --- Loans ---
  const loans = [
    { id: 1, worker_id: 2, amount: 200000, status: "active", paid_amount: 50000, due_date: daysAhead(20), paid_at: null, notes: "Kebutuhan keluarga" },
    { id: 2, worker_id: 4, amount: 300000, status: "installment", paid_amount: 150000, due_date: daysAhead(10), paid_at: null, notes: "Biaya sekolah anak" },
    { id: 3, worker_id: 1, amount: 150000, status: "paid", paid_amount: 150000, due_date: daysAgo(5), paid_at: daysAgo(6), notes: "Lunas tepat waktu" },
  ];

  const galleryImgs = ["sawah", "kopi", "panen", "jagung", "cabai", "karet", "kebun", "petani"];
  const gallery = galleryImgs.map((g, i) => ({
    id: i + 1, title: "Dokumentasi " + g.charAt(0).toUpperCase() + g.slice(1),
    image_url: "assets/images/gallery/" + g + ".svg",
    description: "Kegiatan pertanian: " + g + " bersama pekerja tani desa.",
    uploaded_by: 1, created_at: daysAgo(i * 2),
  }));

  const news = [
    { id: 1, title: "Digitalisasi Kas Petani Resmi Diluncurkan", content: "Program digitalisasi manajemen pekerja dan keuangan pertanian resmi diluncurkan untuk mendukung petani lokal dalam mengelola tenaga kerja dan kas secara transparan.", image_url: "assets/images/news/1.svg", author_id: 1, is_published: true, category: "Pengumuman", created_at: daysAgo(2) },
    { id: 2, title: "Musim Panen Kopi Tiba, Butuh 50 Pekerja", content: "Memasuki musim panen kopi, kebutuhan tenaga kerja meningkat tajam. Pendaftaran dibuka melalui menu Pekerjaan Mendatang.", image_url: "assets/images/news/2.svg", author_id: 2, is_published: true, category: "Pekerjaan", created_at: daysAgo(5) },
    { id: 3, title: "Tips Mengelola Pinjaman Pekerja", content: "Pengelolaan pinjaman yang sehat membantu pekerja dan petani. Berikut tips mencatat dan menagih pinjaman secara adil dan transparan.", image_url: "assets/images/news/3.svg", author_id: 1, is_published: true, category: "Edukasi", created_at: daysAgo(9) },
  ];

  const security_logs = [
    { id: 1, username_attempt: "superadmin", ip_address: "182.1.23.45", device_fingerprint: "fp-aa11", user_agent: "Chrome / Windows", attempt_time: daysAgo(0) + " 08:12:00", attempt_status: "success", failure_count: 0, lock_until: null, is_banned: false },
    { id: 2, username_attempt: "admin", ip_address: "182.1.23.46", device_fingerprint: "fp-bb22", user_agent: "Firefox / Linux", attempt_time: daysAgo(0) + " 07:55:00", attempt_status: "failed", failure_count: 2, lock_until: null, is_banned: false },
    { id: 3, username_attempt: "hacker99", ip_address: "203.0.113.7", device_fingerprint: "fp-cc33", user_agent: "curl/8.0", attempt_time: daysAgo(1) + " 23:40:00", attempt_status: "banned", failure_count: 6, lock_until: null, is_banned: true },
    { id: 4, username_attempt: "agus", ip_address: "182.1.23.48", device_fingerprint: "fp-dd44", user_agent: "Safari / Android", attempt_time: daysAgo(1) + " 19:02:00", attempt_status: "locked", failure_count: 5, lock_until: daysAhead(0) + " 20:00:00", is_banned: false },
  ];

  const banned_devices = [
    { id: 1, ip_address: "203.0.113.7", device_fingerprint: "fp-cc33", ban_reason: "5x gagal login akun tidak terdaftar", banned_at: daysAgo(1) + " 23:40:00", ban_until: daysAhead(0) + " 23:40:00", is_permanent: false, banned_by: 1, appeal_status: "pending", appeal_reason: "Saya salah ketik username berkali-kali, mohon dibuka." },
    { id: 2, ip_address: "198.51.100.22", device_fingerprint: "fp-ee55", ban_reason: "15x percobaan — ban permanen", banned_at: daysAgo(4) + " 02:10:00", ban_until: null, is_permanent: true, banned_by: 1, appeal_status: "none", appeal_reason: "" },
  ];

  const notifications = [
    { id: 1, user_id: 2, title: "Pendaftar baru", message: "Wati Lestari mendaftar ke 'Panen Kopi Blok A'.", type: "info", is_read: false, created_at: daysAgo(1) + " 09:00" },
    { id: 2, user_id: 2, title: "Pendaftar baru", message: "Rina Marlina mendaftar ke 'Panen Kopi Blok A'.", type: "info", is_read: false, created_at: daysAgo(1) + " 09:05" },
    { id: 3, user_id: 4, title: "Pendaftaran diterima", message: "Anda diterima di 'Tanam Padi Serentak'.", type: "success", is_read: false, created_at: daysAgo(1) + " 10:00" },
    { id: 4, user_id: 4, title: "Pengingat pinjaman", message: "Pinjaman Anda jatuh tempo dalam 10 hari.", type: "warning", is_read: true, created_at: daysAgo(2) + " 08:00" },
    { id: 5, user_id: 1, title: "Appeal device banned", message: "Ada 1 permintaan appeal device banned menunggu.", type: "warning", is_read: false, created_at: daysAgo(1) + " 23:50" },
  ];

  const activity_logs = [
    { id: 1, user_id: 1, action: "CREATE", entity_type: "admin", entity_id: 2, ip_address: "182.1.23.45", created_at: daysAgo(9) + " 10:00" },
    { id: 2, user_id: 2, action: "CREATE", entity_type: "daily_kas", entity_id: 1, ip_address: "182.1.23.46", created_at: daysAgo(7) + " 16:30" },
    { id: 3, user_id: 2, action: "UPDATE", entity_type: "worker", entity_id: 2, ip_address: "182.1.23.46", created_at: daysAgo(3) + " 11:15" },
    { id: 4, user_id: 3, action: "DELETE", entity_type: "job", entity_id: 9, ip_address: "182.1.23.47", created_at: daysAgo(2) + " 14:45" },
  ];

  const contacts = {
    whatsapp: "+62 812-0000-0001",
    facebook: "https://facebook.com/kaspetani",
    instagram: "https://instagram.com/kaspetani",
    tiktok: "https://tiktok.com/@kaspetani",
    email: "halo@kaspetani.id",
    address: "Dinas Pertanian Kabupaten, Jl. Raya Pertanian No. 1",
  };

  window.SEED_DATA = {
    users, admins, workers, daily_kas, jobs, job_registrations, loans,
    gallery, news, security_logs, banned_devices, notifications, activity_logs, contacts,
  };
})();
