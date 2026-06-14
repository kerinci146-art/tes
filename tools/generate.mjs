/* Generator halaman HTML statis untuk Kas Petani (Phase 1).
   Menghasilkan shell HTML konsisten; seluruh konten dirender oleh JS.
   Jalankan: node tools/generate.mjs */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "frontend");

const JS_FILES = [
  "js/data.js", "js/main.js", "js/validation.js", "js/security.js", "js/api.js",
  "js/auth.js", "js/theme.js", "js/charts.js",
  "js/components/notification.js", "js/components/modal.js", "js/components/chart.js", "js/components/table.js",
  "js/ui.js", "js/pages/public.js", "js/pages/auth.js", "js/pages/dashboards.js",
];
const CSS_FILES = ["css/theme.css", "css/style.css", "css/components.css", "css/responsive.css"];

function page({ out, depth, layout, dataPage, render, title, roles, headTitle }) {
  const prefix = "../".repeat(depth);
  const css = CSS_FILES.map((f) => `  <link rel="stylesheet" href="${prefix}${f}">`).join("\n");
  const js = JS_FILES.map((f) => `  <script src="${prefix}${f}"></script>`).join("\n");
  const attrs = [
    `data-layout="${layout}"`,
    dataPage ? `data-page="${dataPage}"` : "",
    `data-render="${render}"`,
    `data-root="${prefix}"`,
    title ? `data-title="${title}"` : "",
    roles ? `data-roles="${roles}"` : "",
  ].filter(Boolean).join(" ");
  const html = `<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#2e7d32">
  <title>${headTitle} \u2014 Kas Petani</title>
  <link rel="icon" type="image/svg+xml" href="${prefix}assets/images/favicon.svg">
${css}
</head>
<body ${attrs}>
${js}
</body>
</html>
`;
  const full = resolve(ROOT, out);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html);
  console.log("  +", out);
}

// ---- Public pages (depth 1: frontend/pages/) ----
const pub = [
  ["index", "Beranda"], ["about", "Tentang Kami"], ["jobs", "Pekerjaan Mendatang"],
  ["gallery", "Galeri"], ["news", "Berita"], ["contact", "Kontak"],
];
for (const [name, t] of pub) {
  page({ out: `pages/${name}.html`, depth: 1, layout: "public", dataPage: `${name}.html`, render: name, headTitle: t });
}

// ---- Auth / recovery (depth 1, bare) ----
const auth = [
  ["login", "Masuk"], ["forgot-password", "Lupa Password"], ["forced-change", "Ganti Password"],
  ["locked", "Akun Terkunci"], ["banned", "Perangkat Diblokir"], ["recovery", "Pemulihan Akun"],
];
for (const [name, t] of auth) {
  page({ out: `pages/${name}.html`, depth: 1, layout: "auth", render: name, headTitle: t });
}

// ---- Dashboards (depth 2: frontend/pages/<role>/) ----
const dash = {
  superadmin: [
    ["dashboard", "Dashboard"], ["admins", "Manajemen Admin"], ["users", "Manajemen User"],
    ["workers", "Pekerja"], ["kas", "Input Kas Harian"], ["jobs", "Pekerjaan"],
    ["reports", "Laporan & Analitik"], ["export", "Export / Import"], ["gallery", "Galeri"],
    ["news", "Berita"], ["security", "Keamanan"], ["settings", "Pengaturan"],
  ],
  admin: [
    ["dashboard", "Dashboard"], ["members", "Member Saya"], ["workers", "Pekerja"],
    ["kas", "Input Kas Harian"], ["jobs", "Pekerjaan"], ["reports", "Laporan"], ["settings", "Pengaturan"],
  ],
  user: [
    ["dashboard", "Dashboard"], ["jobs", "Pekerjaan"], ["performance", "Performa Saya"],
    ["notifications", "Notifikasi"], ["settings", "Pengaturan"],
  ],
};
for (const [role, items] of Object.entries(dash)) {
  for (const [name, t] of items) {
    page({ out: `pages/${role}/${name}.html`, depth: 2, layout: "dashboard", dataPage: `${name}.html`, render: `${role}/${name}`, title: t, roles: role, headTitle: t });
  }
}

// ---- Redirect entry (frontend/index.html) ----
writeFileSync(resolve(ROOT, "index.html"), `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=pages/index.html"><title>Kas Petani</title></head><body>Mengalihkan ke <a href="pages/index.html">Beranda</a>\u2026</body></html>\n`);
console.log("  + index.html (redirect)");

console.log("Selesai membuat halaman.");
