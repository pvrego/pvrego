import fs from "fs/promises";
import path from "path";
import gplay from "google-play-scraper";

const APPS = [
  {
    id: "com.quantingo.resus",
    link: "https://play.google.com/store/apps/details?id=com.quantingo.resus",
    accent: "#00FFA8"
  },
  {
    id: "com.quantingo.resusprime",
    link: "https://play.google.com/store/apps/details?id=com.quantingo.resusprime",
    accent: "#AA88FF"
  },
  {
    id: "com.quantingo.sonia",
    link: "https://play.google.com/store/apps/details?id=com.quantingo.sonia",
    accent: "#FFAA00"
  }
];

const README = "README.md";
const BEGIN = "<!-- BEGIN:GOOGLEPLAY_CARDS -->";
const END = "<!-- END:GOOGLEPLAY_CARDS -->";
const CARDS_DIR = "cards";

async function fetchIconBase64(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch icon: ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "image/png";
  return `data:${ct};base64,${buf.toString("base64")}`;
}

function sanitize(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .trim();
}

function shorten(text, n = 90) {
  text = sanitize(text);
  if (text.length <= n) return text;
  return text.slice(0, n - 1) + "…";
}

function getShortDesc(data) {
  if (data.summary && data.summary.trim().length > 0) {
    return shorten(data.summary);
  }
  if (data.description && data.description.trim().length > 0) {
    return shorten(data.description);
  }
  return "";
}

function svgContent({ title, summary, rating, installs, iconBase64, accent }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="495" height="130" role="img">
  <defs>
    <style>
      .card { fill: #1a1b27; }
      .title { font: 600 16px "Segoe UI", Ubuntu, Sans-Serif; fill: ${accent}; }
      .desc { font: 400 13px "Segoe UI", Ubuntu, Sans-Serif; fill: #c9d1d9; }
      .meta { font: 400 12px "Segoe UI", Ubuntu, Sans-Serif; fill: #9aa4b2; }
      .border { fill: none; stroke: #30363d; stroke-width: 1; rx: 6; ry: 6; }
    </style>
  </defs>
  <rect class="card" x="0.5" y="0.5" rx="6" ry="6" width="494" height="129" />
  <rect class="border" x="0.5" y="0.5" width="494" height="129" rx="6" ry="6" />
  <image href="${iconBase64}" x="18" y="18" width="64" height="64" />
  <g transform="translate(100, 28)">
    <text class="title">${title}</text>
  </g>
  <g transform="translate(100, 52)">
    <text class="desc">${summary}</text>
  </g>
  <g transform="translate(100, 80)">
    <text class="meta">★ ${rating ?? "—"} · ${installs ?? "—"} installs · Google Play</text>
  </g>
</svg>
`.trim();
}

async function generate() {
  await fs.mkdir(CARDS_DIR, { recursive: true });

  const cardRefs = []; // referências para inserir no README

  for (const app of APPS) {
    try {
      const data = await gplay.app({ appId: app.id, country: "us", lang: "en" });
      const iconBase64 = await fetchIconBase64(data.icon);
      const title = sanitize(data.title);
      const summary = getShortDesc(data);
      const rating = data.score ? data.score.toFixed(1) : null;
      const installs = data.installs;

      const svg = svgContent({ title, summary, rating, installs, iconBase64, accent: app.accent });
      const filename = `${app.id}.svg`;
      const filePath = path.join(CARDS_DIR, filename);
      await fs.writeFile(filePath, svg, "utf8");

      // referência para o README
      const ref = `<a href="${app.link}"><img src="./${CARDS_DIR}/${filename}" alt="${title} – Google Play card" /></a>`;
      cardRefs.push(ref);
    } catch (e) {
      console.error(`Error for app ${app.id}:`, e);
    }
  }

  const block = cardRefs.join("\n\n");

  const readme = await fs.readFile(README, "utf8");
  const start = readme.indexOf(BEGIN);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("BEGIN/END markers not found in README.md");
  }
  const before = readme.slice(0, start + BEGIN.length);
  const after = readme.slice(end);
  const updated = `${before}\n${block}\n${after}`;
  await fs.writeFile(README, updated, "utf8");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
