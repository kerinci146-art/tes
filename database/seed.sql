-- ============================================================
-- Kas Petani — Seed Data (akun default)
-- Password di-hash dengan BCrypt pada implementasi backend.
-- Placeholder di bawah HARUS diganti hash BCrypt asli dari
-- string '1023456789' sebelum produksi.
-- ============================================================
USE kas_petani;

-- Akun default (lihat Bagian 5 spesifikasi)
-- Catatan: $2a$10$REPLACE... adalah placeholder hash BCrypt.
INSERT INTO users (id, username, password_hash, email, role, force_change_password, created_by) VALUES
  (1, 'superadmin', '$2a$10$REPLACE_WITH_BCRYPT_HASH_OF_1023456789', 'superadmin@kaspetani.id', 'superadmin', TRUE, NULL),
  (2, 'admin',      '$2a$10$REPLACE_WITH_BCRYPT_HASH_OF_1023456789', 'admin@kaspetani.id', 'admin', TRUE, 1);

INSERT INTO admins (id, user_id, full_name, created_by) VALUES
  (1, 2, 'Administrator', 1);

INSERT INTO workers (id, user_id, name, address, phone, admin_id) VALUES
  (1, NULL, 'Contoh Pekerja', 'Desa Sukamaju', '081300000000', 1);

INSERT INTO settings (user_id, theme, language) VALUES
  (1, 'light', 'id'), (2, 'light', 'id');
