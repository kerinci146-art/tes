# Dokumentasi API (Phase 2)

Ringkasan endpoint backend (Spring Boot). Pada Phase 1, frontend memakai
mock store di `frontend/js/api.js` yang meniru kontrak berikut.

## Auth
| Method | Endpoint | Role |
|--------|----------|------|
| POST | `/api/auth/login` | Publik |
| POST | `/api/auth/logout` | All |
| POST | `/api/auth/change-password` | All |
| POST | `/api/auth/forgot-password` | Publik |

## Users
| Method | Endpoint | Role |
|--------|----------|------|
| GET | `/api/users` | Super Admin |
| GET | `/api/users?admin_id=X` | Admin |
| POST | `/api/users` | Admin, Super Admin |
| PUT | `/api/users/:id` | All (self/member/all) |
| DELETE | `/api/users/:id` | Admin, Super Admin |
| POST | `/api/users/:id/reset-password` | Admin, Super Admin |
| POST | `/api/users/:id/unlock` | Admin, Super Admin |

## Workers / Kas / Jobs / Reports / Security
Lihat tabel lengkap pada `SPESIFIKASI` bagian 11. Kontrak data mengikuti
skema di `database/schema.sql`.

## Keamanan Login (Brute Force)
- Akun terdaftar: 3x salah → kunci 15 menit, 4x → 30 menit, 5x → permanen.
- Akun tak terdaftar (per device/IP): 5x → ban 30 menit, 10x → 24 jam, 15x → permanen.
- Logika ini disimulasikan di `frontend/js/security.js` untuk demo Phase 1.
