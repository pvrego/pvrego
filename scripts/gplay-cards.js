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

const CARDS_DIR = "cards";
const README = "README.md";
const BEGIN = "<!-- BEGIN:GOOGLEPLAY_CARDS -->";
const END = "<!-- END:GOOGLEPLAY_CARDS -->";

async function toDataUri(url) {
  // baixa o ícone e converte para base64 embutido no SVG
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch icon: ${url}`);
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
  return text.length <= n ? text : text.slice(0, n - 1) + "…";
}

function svgCard({ title, summary, rating, installs, iconDataUri, accent, link }) {
  // estilo inspirado no github-readme-stats (fundo escuro, tipografia simples)
  return `
<a href="${link}">
  <img src="data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='495' height='130' role='img'>
  <defs>
    <style>
      .card { fill: #1a1b27; }
      .title { font: 600 16px "Segoe UI", Ubuntu, Sans-Serif; fill: ${accent}; }
      .desc { font: 400 13px "Segoe UI", Ubuntu, Sans-Serif; fill: #c9d1d9; }
      .meta { font: 400 12px "Segoe UI", Ubuntu, Sans-Serif; fill: #9aa4b2; }
      .border { fill: none; stroke: #30363d; stroke-width: 1; rx: 6; ry: 6; }
    </style>
  </defs>
  <rect class='card' x='0.5' y='0.5' rx='6' ry='6' width='494' height='129' />
  <rect class='border' x='0.5' y='0.5' width='494' height='129' rx='6' ry='6'/>
  <image href='${iconDataUri}' x='18' y='18' width='64' height='64' />
  <g transform='translate(100, 28)'>
    <text class='title'>${title}</text>
  </g>
  <g transform='translate(100, 52)'>
    <text class='desc'>${summary}</text>
  </g>
  <g transform='translate(100, 80)'>
    <text class='meta'>★ ${rating ?? "—"} · ${installs ?? "—"} installs · Google Play</text>
  </g>
</svg>
  `)}" alt="${title} – Google Play card" />
</a>`.trim();
}

async function generate() {
  await fs.mkdir(CARDS_DIR, { recursive: true });
  const cards = [];

  for (const app of APPS) {
    try {
      const data = await gplay.app({ appId: app.id, country: "us", lang: "en" });
      const icon = await toDataUri(data.icon);
      const card = svgCard({
        title: sanitize(data.title),
        summary: shorten(data.summary || data.description),
        rating: data.score ? data.score.toFixed(1) : null,
        installs: data.installs,
        iconDataUri: icon,
        accent: app.accent,
        link: app.link
      });

      const file = path.join(CARDS_DIR, `${app.id}.svg.md`);
      await fs.writeFile(file, card, "utf8");
      cards.push(card);
    } catch (e) {
      console.error(`Erro no app ${app.id}:`, e.message);
    }
  }

  // Monta a seção final (cada card numa linha)
  const block = cards.join("\n\n");

  // Atualiza o README entre os marcadores
  const readme = await fs.readFile(README, "utf8");
  const start = readme.indexOf(BEGIN);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Marcadores BEGIN/END não encontrados no README.md");
  }
  const before = readme.slice(0, start + BEGIN.length);
  const after = readme.slice(end);
  const updated = `${before}\n${block}\n${after}`;
  await fs.writeFile(README, updated, "utf8");
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
