import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const m3uPath = path.join(__dirname, 'public', 'default.m3u');
const jsonPath = path.join(__dirname, 'public', 'default.json');

console.log("--------------------------------------------------");
console.log("M3U to JSON converter for Tizen TV Smart Hub (ESM)");
console.log("--------------------------------------------------");

if (!fs.existsSync(m3uPath)) {
  console.error(`ERROR: default.m3u file not found at: ${m3uPath}`);
  console.error("Please place your list in the public folder and rename it to 'default.m3u' first.");
  process.exit(1);
}

console.log("Reading default.m3u...");
const rawText = fs.readFileSync(m3uPath, 'utf8');

function extractAttr(infLine, attrName) {
  const match = infLine.match(new RegExp(`${attrName}="([^"]*)"`, 'i'));
  return match ? match[1].trim() : '';
}

function classifyType(url) {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('/movie/')) {
    return 'movie';
  } else if (lowercaseUrl.includes('/series/')) {
    return 'series';
  } else {
    return 'live';
  }
}

const lines = rawText.split(/\r?\n/);
const totalLines = lines.length;

let currentMeta = null;
const items = [];
const categories = [];
const processedCategories = new Set();
const listUrl = "./default.json";

console.log("Parsing M3U lines...");

for (let i = 0; i < totalLines; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  if (line.startsWith("#EXTINF:")) {
    const commaIndex = line.lastIndexOf(',');
    const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal Sem Nome';
    
    const logo = extractAttr(line, 'tvg-logo');
    const tvgId = extractAttr(line, 'tvg-id');
    const category = extractAttr(line, 'group-title') || 'Outros';

    currentMeta = { name, logo, tvgId, category };
  } else if (line.startsWith("http://") || line.startsWith("https://")) {
    if (currentMeta) {
      const type = classifyType(line);
      const item = {
        url: line,
        listUrl,
        type,
        name: currentMeta.name,
        logo: currentMeta.logo,
        tvgId: currentMeta.tvgId,
        category: currentMeta.category,
        searchName: currentMeta.name.toLowerCase()
      };

      items.push(item);

      const catId = `${type}_${currentMeta.category}_${listUrl}`;
      if (!processedCategories.has(catId)) {
        processedCategories.add(catId);
        categories.push({
          id: catId,
          type,
          name: currentMeta.category,
          listUrl
        });
      }

      currentMeta = null;
    }
  }
}

console.log(`Writing structured JSON file...`);
fs.writeFileSync(jsonPath, JSON.stringify({ items, categories }, null, 2), 'utf8');

console.log("\nSUCCESS!");
console.log(`- Total Items processed: ${items.length}`);
console.log(`- Total Categories aggregated: ${categories.length}`);
console.log(`- Saved JSON to: ${jsonPath}`);
console.log("--------------------------------------------------");
