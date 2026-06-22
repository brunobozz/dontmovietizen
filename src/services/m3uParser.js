import { saveChunk } from "./db.js";

const CHUNK_SIZE = 800; // Save 800 items per batch to maximize write speeds and UI responsiveness
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

/**
 * Parses M3U content string asynchronously in batches and stores it in IndexedDB.
 * Updates onProgress callback periodically.
 */
export async function parseM3uAndSave(listUrl, rawText, onProgress) {
  // Split lines safely supporting \r\n and \n
  const lines = rawText.split(/\r?\n/);
  const totalLines = lines.length;

  let currentMeta = null;
  let chunkItems = [];
  let chunkCategories = [];
  const processedCategories = new Set(); // Keep track of unique category IDs in current run

  let itemsSavedCount = 0;

  for (let i = 0; i < totalLines; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // Yield control to browser UI thread periodically
    if (i % 2000 === 0) {
      await delay(10);
      if (onProgress) {
        onProgress(Math.min(95, Math.round((i / totalLines) * 100)));
      }
    }

    if (line.startsWith("#EXTINF:")) {
      const commaIndex = line.lastIndexOf(',');
      const name = commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Canal Sem Nome';
      
      const logo = extractAttr(line, 'tvg-logo');
      const tvgId = extractAttr(line, 'tvg-id');
      const category = extractAttr(line, 'group-title') || 'Outros';

      currentMeta = {
        name,
        logo,
        tvgId,
        category
      };
    } else if (line.startsWith("http://") || line.startsWith("https://")) {
      // It's a stream URL
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

        chunkItems.push(item);

        // Pre-aggregate categories
        const catId = `${type}_${currentMeta.category}_${listUrl}`;
        if (!processedCategories.has(catId)) {
          processedCategories.add(catId);
          chunkCategories.push({
            id: catId,
            type,
            name: currentMeta.category,
            listUrl
          });
        }

        // Write batch chunk
        if (chunkItems.length >= CHUNK_SIZE) {
          itemsSavedCount += chunkItems.length;
          await saveChunk(chunkItems, chunkCategories);
          chunkItems = [];
          chunkCategories = [];
          // Small delay to keep the TV browser responsive
          await delay(20);
        }

        currentMeta = null; // Reset meta
      }
    }
  }

  // Save remaining items in the final chunk
  if (chunkItems.length > 0) {
    itemsSavedCount += chunkItems.length;
    await saveChunk(chunkItems, chunkCategories);
  }

  if (onProgress) {
    onProgress(100);
  }

  return itemsSavedCount;
}
