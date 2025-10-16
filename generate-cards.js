import fs from "fs";
import { parseStringPromise } from "xml2js";

const XML_PATH = "apps.xml";
const README_PATH = "README.md";
const BEGIN = "<!-- BEGIN:GOOGLEPLAY_CARDS -->";
const END = "<!-- END:GOOGLEPLAY_CARDS -->";

const xmlData = fs.readFileSync(XML_PATH, "utf8");

function createCard(app) {
  const tags = app.tags[0]
    .split(",")
    .map(t => t.trim())
    .map(
      t => `<span style="background:#21262d;padding:3px 8px;border-radius:6px;color:#8b949e;margin-right:4px;">${t}</span>`
    )
    .join("");

  return `
  <a href="${app.link}" style="text-decoration:none;color:inherit;">
    <div style="width:340px;background:#0d1117;border:1px solid #30363d;border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px;">
      <img src="${app.logo}" alt="${app.name}" style="width:60px;height:60px;border-radius:8px;">
      <div style="flex:1;">
        <div style="font-weight:600;color:${app.color};font-size:16px;">${app.name}</div>
        <div style="font-size:13px;color:#c9d1d9;margin-top:4px;">${app.description}</div>
        <div style="margin-top:6px;font-size:12px;">${tags}</div>
      </div>
    </div>
  </a>`;
}

function updateReadme(htmlBlock) {
  const readme = fs.readFileSync(README_PATH, "utf8");

  const start = readme.indexOf(BEGIN);
  const end = readme.indexOf(END);

  if (start === -1 || end === -1 || end < start) {
    console.error("❌ Markers not found in README.md");
    console.error(`Please add these lines where you want the cards to appear:
${BEGIN}
${END}`);
    process.exit(1);
  }

  const before = readme.slice(0, start + BEGIN.length);
  const after = readme.slice(end);
  const updated = `${before}\n\n${htmlBlock}\n\n${after}`;

  fs.writeFileSync(README_PATH, updated, "utf8");
  console.log("✅ README.md updated successfully!");
}

async function main() {
  const result = await parseStringPromise(xmlData);
  const cards = result.apps.app.map(createCard).join("\n\n");
  const htmlBlock = `<div align="center" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">\n${cards}\n</div>`;

  // opcional: ainda salva cards.html pra referência
  fs.writeFileSync("cards.html", htmlBlock, "utf8");
  console.log("✅ Generated cards.html");

  updateReadme(htmlBlock);
}

main();
