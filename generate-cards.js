import fs from "fs";
import { parseStringPromise } from "xml2js";

const xmlData = fs.readFileSync("apps.xml", "utf8");

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

async function main() {
  const result = await parseStringPromise(xmlData);
  const cards = result.apps.app.map(createCard).join("\n\n");
  const html = `<div align="center" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">\n${cards}\n</div>`;
  fs.writeFileSync("cards.html", html, "utf8");
  console.log("✅ Generated cards.html successfully!");
}

main();
