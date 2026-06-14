# Panduan Deploy

## Phase 1 — GitHub Pages (Demo Frontend)

1. Pastikan repo sudah di-push ke GitHub.
2. Buka **Settings → Pages**.
3. **Source:** Deploy from a branch → Branch `main` → folder `/ (root)` → Save.
4. Tunggu beberapa menit, lalu akses:
   `https://<username>.github.io/<repo>/frontend/pages/index.html`

Catatan Phase 1:
- Hanya frontend statis (HTML/CSS/JS).
- Data memakai mock + `localStorage` (form tidak submit ke server sungguhan).
- Untuk demo UI/UX & presentasi.

## Phase 2 — Production (Full System)

Persyaratan: Linux, OpenJDK 11+, MySQL 8.0+, Tomcat 9+/Nginx, SSL.

```bash
# 1. Database
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql   # ganti placeholder hash BCrypt!

# 2. Konfigurasi backend/src/main/resources/application.properties
#    spring.datasource.url=jdbc:mysql://localhost:3306/kas_petani
#    spring.datasource.username=...
#    spring.datasource.password=...

# 3. Build & deploy
cd backend && mvn clean package
cp target/kas-petani.war /var/lib/tomcat9/webapps/

# 4. SSL
sudo certbot --nginx -d your-domain.com
```
