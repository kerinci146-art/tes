/* Membuat aset SVG placeholder (logo, hero, galeri, berita). */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMG = resolve(__dirname, "..", "frontend", "assets", "images");
mkdirSync(resolve(IMG, "gallery"), { recursive: true });
mkdirSync(resolve(IMG, "news"), { recursive: true });

const save = (p, c) => { const f = resolve(IMG, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, c); console.log("  +", p); };

// favicon
save("favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2e7d32"/><path d="M32 14c8 6 12 12 12 20a12 12 0 0 1-24 0c0-8 4-14 12-20z" fill="#a5d6a7"/><path d="M32 20v24" stroke="#1b5e20" stroke-width="3" stroke-linecap="round"/></svg>`);

// hero background (abstract fields)
save("hero-bg.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9ccc65"/><stop offset="1" stop-color="#2e7d32"/></linearGradient></defs>
<rect width="1200" height="600" fill="url(#s)"/>
<circle cx="980" cy="120" r="70" fill="#fff59d" opacity="0.85"/>
<path d="M0 420 Q300 360 600 420 T1200 420 V600 H0 Z" fill="#558b2f" opacity="0.6"/>
<path d="M0 480 Q300 420 600 480 T1200 480 V600 H0 Z" fill="#33691e" opacity="0.7"/>
</svg>`);

function placeholder(label, c1, c2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="600" height="400" fill="url(#g)"/>
<circle cx="500" cy="80" r="46" fill="#ffffff" opacity="0.25"/>
<path d="M0 280 Q150 230 300 280 T600 280 V400 H0 Z" fill="#000" opacity="0.12"/>
<text x="300" y="210" font-family="Segoe UI, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle" opacity="0.95">${label}</text>
</svg>`;
}

const gallery = [
  ["sawah", "#43a047", "#1b5e20"], ["kopi", "#6d4c41", "#3e2723"], ["panen", "#fbc02d", "#f57f17"],
  ["jagung", "#fdd835", "#f9a825"], ["cabai", "#e53935", "#b71c1c"], ["karet", "#8d6e63", "#4e342e"],
  ["kebun", "#66bb6a", "#2e7d32"], ["petani", "#26a69a", "#00695c"],
];
for (const [name, a, b] of gallery) save(`gallery/${name}.svg`, placeholder(name.toUpperCase(), a, b));

const news = [["1", "#2e7d32", "#1b5e20"], ["2", "#1976d2", "#0d47a1"], ["3", "#f57c00", "#e65100"]];
for (const [name, a, b] of news) save(`news/${name}.svg`, placeholder("BERITA " + name, a, b));

console.log("Aset selesai.");
