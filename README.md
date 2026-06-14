# 🌱 Kas Petani — Dashboard Buku Kas Pekerja Tani

Sistem manajemen pekerja & keuangan pertanian digital. Mendukung program
pemerintah kabupaten dalam memajukan sektor pertanian melalui digitalisasi
manajemen tenaga kerja dan keuangan petani.

> **Status repo ini: Phase 1 — Frontend Mockup (demo UI/UX) siap GitHub Pages.**
> Backend Java/Spring Boot + MySQL (Phase 2) disediakan sebagai skema database
> dan struktur, untuk dilanjutkan pada tahap produksi.

## ✨ Fitur (Phase 1 — Frontend)

- **Tema Siang/Malam** dengan palet sesuai spesifikasi (hijau pertanian + cream).
- **Halaman publik:** Beranda (statistik + chart), Tentang, Pekerjaan Mendatang,
  Galeri, Berita, Kontak.
- **Autentikasi mock** + **proteksi brute force** (kunci akun 3x/4x/5x, ban
  perangkat 5x/10x/15x) disimulasikan di sisi client.
- **Halaman recovery:** Locked (countdown), Banned (appeal), Recovery,
  Lupa Password, Force Change Password.
- **Dashboard Super Admin:** Manajemen Admin, User, Pekerja, Input Kas Harian,
  Pekerjaan, Laporan & Analitik (chart), Export/Import JSON, Galeri, Berita,
  Keamanan (log login, device banned, audit trail), Pengaturan + Pengaturan Sistem.
- **Dashboard Admin:** Member, Pekerja, Input Kas, Pekerjaan (+ pendaftar),
  Laporan, Pengaturan — semuanya terbatas pada data milik admin tersebut.
- **Dashboard User/Member:** Performa diri, daftar pekerjaan, notifikasi, pengaturan.
- **CRUD demo** lengkap (data dipersist di `localStorage`), **chart Canvas** tanpa
  library eksternal, **toast**, **modal**, **tabel dengan search & pagination**.

Tidak ada dependensi build — murni HTML/CSS/JS vanilla.

## 🔐 Akun Demo

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `superadmin` | `1023456789` |
| Admin | `admin` | `1023456789` |
| User/Member | `joko` | `User2026` |

Akun default `superadmin` & `admin` akan diminta mengganti password saat login
pertama (force change password).

## 🚀 Menjalankan Secara Lokal

Karena murni statis, cukup jalankan server statis apa pun dari folder `frontend/`:

```bash
cd frontend
python3 -m http.server 8000
# buka http://localhost:8000/pages/index.html
```

## ☁️ Deploy ke GitHub Pages

Repository sudah disetel agar bisa di-serve langsung. Aktifkan:
**Settings → Pages → Source: branch `main`, folder `/root`**, lalu akses:

```
https://<username>.github.io/<repo>/frontend/pages/index.html
```

## 🗂️ Struktur

```
frontend/        # Phase 1 — mockup (HTML/CSS/JS)
  css/           # theme, style, components, responsive
  js/            # main, auth, security, api, theme, charts, validation, ui
  js/components/ # modal, table (CRUD), chart, notification
  js/pages/      # public, auth, dashboards (render per halaman)
  pages/         # shell HTML per halaman (publik + superadmin/admin/user)
  assets/        # gambar SVG, favicon
database/        # schema.sql + seed.sql (Phase 2)
docs/            # dokumentasi API & deploy
tools/           # generator halaman & aset (Node)
```

### Regenerasi halaman/aset

```bash
node tools/gen-assets.mjs   # SVG placeholder
node tools/generate.mjs     # shell HTML
```

## 🧩 Tech Stack

- **Phase 1:** HTML5, CSS3, JavaScript (Vanilla, ES6+). Tanpa framework.
- **Phase 2 (rencana):** Java 11+ / Spring Boot, MySQL 8.0+, Apache Tomcat,
  BCrypt, JWT/Session.

## 📄 Lisensi

Demo internal — lihat spesifikasi proyek.
