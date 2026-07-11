import { writeFile, appendFile, deleteFile } from "./storage.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractAttr(infLine, attrName) {
  const match = infLine.match(new RegExp(`${attrName}="([^"]*)"`, 'i'));
  return match ? match[1].trim() : '';
}

function classifyType(url, category) {
  const lowercaseUrl = url.toLowerCase();
  const lowercaseCategory = (category || "").toLowerCase();

  // 1. Identify VOD file formats (extensions)
  const isVODFile = 
    lowercaseUrl.endsWith(".mp4") || 
    lowercaseUrl.endsWith(".mkv") || 
    lowercaseUrl.endsWith(".avi") ||
    lowercaseUrl.endsWith(".webm") ||
    lowercaseUrl.endsWith(".m4v");

  // 2. Identify VOD keywords in the URL path (since path segments are explicit)
  const isVODPath = 
    lowercaseUrl.includes("/movie/") || 
    lowercaseUrl.includes("/series/");

  // Rule: If it is neither a VOD file extension nor a VOD path, it is a live channel!
  if (!isVODFile && !isVODPath) {
    return "live";
  }

  // 3. Distinguish between VOD series and movies
  if (
    lowercaseCategory.includes("série") || 
    lowercaseCategory.includes("series") || 
    lowercaseUrl.includes("/series/")
  ) {
    return "series";
  }

  return "movie";
}

function parseSeriesEpisode(name, groupTitle) {
  let seriesName = name;
  let season = 1;
  let episode = 1;
  let episodeTitle = "";

  // Order of regexes matters: specific to general
  const s01e01Regex = /^(.*?)\s+[-]?\s*[sS](\d+)\s*[eE](\d+)(.*)$/i; // S01E01, S1E1, - S01E01
  const s01SpaceE01Regex = /^(.*?)\s+[-]?\s*[sS](\d+)\s+(?:e|ep|episódio|episodio)?\s*(\d+)(.*)$/i; // S01 E01, S1 EP1
  const t01e01Regex = /^(.*?)\s+[-]?\s*[tT](\d+)\s*[eE](\d+)(.*)$/i; // T01E01, T1E1
  const t01SpaceE01Regex = /^(.*?)\s+[-]?\s*[tT](\d+)\s+(?:e|ep|episódio|episodio)?\s*(\d+)(.*)$/i; // T01 E01, T1 EP1
  const tempWordEpRegex = /^(.*?)\s+(?:temporada|temp|t)\s*(\d+)\s+(?:e|ep|episódio|episodio|ep\.)\s*(\d+)(.*)$/i; // Temporada 6 Episodio 01
  const tempDashEpRegex = /^(.*?)\s+(?:temporada|temp|t)\s*(\d+)\s*[-]\s*(\d+)(.*)$/i; // Temporada 6 - 01
  const tempEpRegex = /^(.*?)\s+[-]?\s*(\d+)(?:ª|ª\s*|\s*)(?:temporada|temp|t)\s*[-]?\s*(?:ep|e|episódio|episodio)?\s*(\d+)(.*)$/i; // 1ª Temporada - Ep 01
  const xRegex = /^(.*?)\s+(\d+)x(\d+)(.*)$/i; // 1x01, 01x01
  const epOnlyRegex = /^(.*?)\s+(?:episódio|episodio|ep|e)\s*(\d+)(.*)$/i; // Ep 01
  const nameDashEpRegex = /^(.*?)\s*-\s*(\d+)$/i; // Series - 01

  let match;
  if ((match = name.match(s01e01Regex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(s01SpaceE01Regex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(t01e01Regex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(t01SpaceE01Regex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(tempWordEpRegex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(tempDashEpRegex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(tempEpRegex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(xRegex))) {
    seriesName = match[1];
    season = parseInt(match[2], 10);
    episode = parseInt(match[3], 10);
    episodeTitle = match[4];
  } else if ((match = name.match(epOnlyRegex))) {
    seriesName = match[1];
    season = 1;
    episode = parseInt(match[2], 10);
    episodeTitle = match[3];
  } else if ((match = name.match(nameDashEpRegex))) {
    seriesName = match[1];
    season = 1;
    episode = parseInt(match[2], 10);
    episodeTitle = "";
  } else {
    // If no pattern matches, see if the group title indicates the series name
    const cleanGroup = groupTitle.replace(/^(séries|series)\s*[-:]\s*/i, "").trim();
    if (cleanGroup && cleanGroup.toLowerCase() !== "séries" && cleanGroup.toLowerCase() !== "series") {
      seriesName = cleanGroup;
      const numMatch = name.match(/(\d+)/);
      episode = numMatch ? parseInt(numMatch[1], 10) : 1;
      episodeTitle = name;
    } else {
      seriesName = name;
      season = 1;
      episode = 1;
      episodeTitle = "";
    }
  }

  // Post-processing to clean the series name aggressively and flexibly
  seriesName = seriesName
    .replace(/\s*[([{\s-]*\b(19\d\d|20\d\d)\b[)\]}\s-]*/g, "") // Remove years e.g. (2020)
    .replace(/\s*[-:]?\s*\b(temporada|temp|t|season)\b\s*[\.]?\s*\d+/i, "") // Remove "Temporada 6", " - Temp 6", "Season 1"
    .replace(/\s*[-:]?\s*\bs\s*[\.]?\s*\d+/i, "") // Remove "S01", "S.01" (no trailing word boundary)
    .replace(/\s*[-:]?\s*\d+\s*(?:ª|ª\s*|\s*)\b(temporada|temp|t|season)\b/i, "") // Remove "6ª Temporada", "6 Season"
    .replace(/\s*[-:]?\s*\d+\s*(?:ª|ª\s*|\s*)\bs\b/i, "") // Remove "6ª S"
    .replace(/\s*[-:]\s*$/g, "") // Clean trailing dashes
    .trim();

  // If after cleaning, seriesName is empty, fallback to original name
  if (!seriesName) {
    seriesName = name.trim();
  }

  return {
    seriesName,
    season,
    episode,
    episodeTitle: (episodeTitle || "").replace(/^[\s-:]+/, "").trim() || `Episódio ${episode}`
  };
}

export async function parseM3uAndSave(listUrl, onProgress) {
  // 1. Delete existing files
  await deleteFile("movies.txt");
  await deleteFile("live.json");
  await deleteFile("series.json");

  // 2. Fetch the URL in stream mode
  const response = await fetch(listUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const contentLength = response.headers.get("content-length");
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

  let reader = null;
  let useStream = true;
  
  try {
    if (response.body && typeof response.body.getReader === "function") {
      reader = response.body.getReader();
    } else {
      useStream = false;
    }
  } catch (e) {
    useStream = false;
  }

  const decoder = new TextDecoder("utf-8");
  
  let buffer = "";
  let currentMeta = null;
  let moviesBuffer = "";
  
  let moviesCount = 0;
  let liveCount = 0;
  let seriesCount = 0;
  
  const seriesMap = new Map();
  const liveMap = new Map();
  let bytesRead = 0;
  let lineCount = 0;

  if (useStream && reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      bytesRead += value.length;
      buffer += decoder.decode(value, { stream: true });

      if (totalBytes > 0 && onProgress) {
        const progress = Math.min(99, Math.round((bytesRead / totalBytes) * 100));
        onProgress(progress);
      }

      let lines = buffer.split(/\r?\n/);
      buffer = lines.pop(); // Keep last incomplete line in buffer

      for (const line of lines) {
        lineCount++;
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (lineCount % 4000 === 0) {
          await delay(1); // Keep UI thread responsive
        }

        if (trimmedLine.startsWith("#EXTINF:")) {
          const commaIndex = trimmedLine.lastIndexOf(',');
          const name = commaIndex !== -1 ? trimmedLine.substring(commaIndex + 1).trim() : 'Canal Sem Nome';
          
          const logo = extractAttr(trimmedLine, 'tvg-logo');
          const tvgId = extractAttr(trimmedLine, 'tvg-id');
          const category = extractAttr(trimmedLine, 'group-title') || 'Outros';

          currentMeta = {
            rawLine: trimmedLine,
            name,
            logo,
            tvgId,
            category
          };
        } else if (trimmedLine.startsWith("http://") || trimmedLine.startsWith("https://")) {
          if (currentMeta) {
            const type = classifyType(trimmedLine, currentMeta.category);

            if (type === "series") {
              const parsed = parseSeriesEpisode(currentMeta.name, currentMeta.category);
              const seriesName = parsed.seriesName;
              
              if (!seriesMap.has(seriesName)) {
                seriesMap.set(seriesName, {
                  name: seriesName,
                  logo: currentMeta.logo || "",
                  category: currentMeta.category,
                  seasons: {}
                });
              }
              
              const seriesObj = seriesMap.get(seriesName);
              if (!seriesObj.logo && currentMeta.logo) {
                seriesObj.logo = currentMeta.logo;
              }
              
              if (!seriesObj.seasons[parsed.season]) {
                seriesObj.seasons[parsed.season] = [];
              }
              
              seriesObj.seasons[parsed.season].push({
                episode: parsed.episode,
                name: parsed.episodeTitle,
                url: trimmedLine
              });
              seriesCount++;
            } else if (type === "movie") {
              moviesBuffer += currentMeta.rawLine + "\n" + trimmedLine + "\n";
              moviesCount++;
              
              if (moviesBuffer.length >= 100000) {
                await appendFile("movies.txt", moviesBuffer);
                moviesBuffer = "";
              }
            } else {
              const liveCategory = currentMeta.category || 'Outros';
              if (!liveMap.has(liveCategory)) {
                liveMap.set(liveCategory, []);
              }
              liveMap.get(liveCategory).push({
                name: currentMeta.name,
                logo: currentMeta.logo || "",
                url: trimmedLine
              });
              liveCount++;
            }
            currentMeta = null;
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith("http://") || trimmedLine.startsWith("https://")) {
        if (currentMeta) {
          const type = classifyType(trimmedLine, currentMeta.category);
          if (type === "series") {
            const parsed = parseSeriesEpisode(currentMeta.name, currentMeta.category);
            const seriesName = parsed.seriesName;
            if (!seriesMap.has(seriesName)) {
              seriesMap.set(seriesName, {
                name: seriesName,
                logo: currentMeta.logo || "",
                category: currentMeta.category,
                seasons: {}
              });
            }
            const seriesObj = seriesMap.get(seriesName);
            if (!seriesObj.logo && currentMeta.logo) seriesObj.logo = currentMeta.logo;
            if (!seriesObj.seasons[parsed.season]) {
              seriesObj.seasons[parsed.season] = [];
            }
            seriesObj.seasons[parsed.season].push({
              episode: parsed.episode,
              name: parsed.episodeTitle,
              url: trimmedLine
            });
            seriesCount++;
          } else if (type === "movie") {
            moviesBuffer += currentMeta.rawLine + "\n" + trimmedLine + "\n";
            moviesCount++;
          } else {
            const liveCategory = currentMeta.category || 'Outros';
            if (!liveMap.has(liveCategory)) {
              liveMap.set(liveCategory, []);
            }
            liveMap.get(liveCategory).push({
              name: currentMeta.name,
              logo: currentMeta.logo || "",
              url: trimmedLine
            });
            liveCount++;
          }
        }
      }
    }
  } else {
    // TV Fallback (No ReadableStream support)
    console.log("[Parser] Streaming not supported. Loading full M3U text in memory...");
    if (onProgress) onProgress(15);
    
    const fullText = await response.text();
    if (onProgress) onProgress(30);
    
    const lines = fullText.split(/\r?\n/);
    const totalLinesCount = lines.length;
    if (onProgress) onProgress(45);

    for (let i = 0; i < totalLinesCount; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (i % 2000 === 0) {
        await delay(1); // Keep TV UI responsive
        if (onProgress) {
          const progress = Math.min(99, 45 + Math.round((i / totalLinesCount) * 50));
          onProgress(progress);
        }
      }

      if (trimmedLine.startsWith("#EXTINF:")) {
        const commaIndex = trimmedLine.lastIndexOf(',');
        const name = commaIndex !== -1 ? trimmedLine.substring(commaIndex + 1).trim() : 'Canal Sem Nome';
        
        const logo = extractAttr(trimmedLine, 'tvg-logo');
        const tvgId = extractAttr(trimmedLine, 'tvg-id');
        const category = extractAttr(trimmedLine, 'group-title') || 'Outros';

        currentMeta = {
          rawLine: trimmedLine,
          name,
          logo,
          tvgId,
          category
        };
      } else if (trimmedLine.startsWith("http://") || trimmedLine.startsWith("https://")) {
        if (currentMeta) {
          const type = classifyType(trimmedLine, currentMeta.category);

          if (type === "series") {
            const parsed = parseSeriesEpisode(currentMeta.name, currentMeta.category);
            const seriesName = parsed.seriesName;
            
            if (!seriesMap.has(seriesName)) {
              seriesMap.set(seriesName, {
                name: seriesName,
                logo: currentMeta.logo || "",
                category: currentMeta.category,
                seasons: {}
              });
            }
            
            const seriesObj = seriesMap.get(seriesName);
            if (!seriesObj.logo && currentMeta.logo) {
              seriesObj.logo = currentMeta.logo;
            }
            
            if (!seriesObj.seasons[parsed.season]) {
              seriesObj.seasons[parsed.season] = [];
            }
            
            seriesObj.seasons[parsed.season].push({
              episode: parsed.episode,
              name: parsed.episodeTitle,
              url: trimmedLine
            });
            seriesCount++;
          } else if (type === "movie") {
            moviesBuffer += currentMeta.rawLine + "\n" + trimmedLine + "\n";
            moviesCount++;
            
            if (moviesBuffer.length >= 100000) {
              await appendFile("movies.txt", moviesBuffer);
              moviesBuffer = "";
            }
          } else {
            const liveCategory = currentMeta.category || 'Outros';
            if (!liveMap.has(liveCategory)) {
              liveMap.set(liveCategory, []);
            }
            liveMap.get(liveCategory).push({
              name: currentMeta.name,
              logo: currentMeta.logo || "",
              url: trimmedLine
            });
            liveCount++;
          }
          currentMeta = null;
        }
      }
    }
  }

  // Flush remaining buffers
  if (moviesBuffer.length > 0) {
    await appendFile("movies.txt", moviesBuffer);
  }

  // Group series by base name in a final post-processing pass
  const groupedSeriesMap = new Map();

  for (const [name, series] of seriesMap.entries()) {
    // Aggressively find the base series name by stripping S01, S1, Season 1, Temp 1, T1 etc.
    let baseName = name
      .replace(/\s*[([{\s-]*\b(19\d\d|20\d\d)\b[)\]}\s-]*/g, "") // Remove years e.g. (2020)
      .replace(/\s*[-:]?\s*\b(temporada|temp|t|season)\b\s*[\.]?\s*\d+/i, "") // Remove "S01", "Temporada 6", etc.
      .replace(/\s*[-:]?\s*\bs\s*[\.]?\s*\d+/i, "")
      .replace(/\s*[-:]?\s*\d+\s*(?:ª|ª\s*|\s*)\b(temporada|temp|t|season)\b/i, "")
      .replace(/\s*[-:]?\s*\d+\s*(?:ª|ª\s*|\s*)\bs\b/i, "")
      .replace(/\s*[-:]\s*$/g, "")
      .trim();

    if (!baseName) {
      baseName = name.trim();
    }

    // Try to detect the season from the original series name key (e.g. "Fear The Walking Dead S06" -> season 6)
    let detectedSeason = null;
    const seasonMatch = name.match(/\b(?:temporada|temp|t|season)\b\s*[\.]?\s*(\d+)/i) || name.match(/\bs\s*[\.]?\s*(\d+)/i);
    if (seasonMatch) {
      detectedSeason = parseInt(seasonMatch[1], 10).toString();
    }

    if (!groupedSeriesMap.has(baseName)) {
      groupedSeriesMap.set(baseName, {
        name: baseName,
        logo: series.logo || "",
        category: series.category,
        seasons: {}
      });
    }

    const groupedSeries = groupedSeriesMap.get(baseName);
    if (!groupedSeries.logo && series.logo) {
      groupedSeries.logo = series.logo;
    }

    // Merge seasons
    for (const seasonNum in series.seasons) {
      // If the season is "1" but we detected a different season number from the name suffix (like S06),
      // we remap "1" to the detected season number.
      let targetSeasonNum = seasonNum;
      if (seasonNum === "1" && detectedSeason && detectedSeason !== "1") {
        targetSeasonNum = detectedSeason;
      }

      if (!groupedSeries.seasons[targetSeasonNum]) {
        groupedSeries.seasons[targetSeasonNum] = [];
      }

      // Add episodes, avoiding duplicates
      for (const ep of series.seasons[seasonNum]) {
        if (!groupedSeries.seasons[targetSeasonNum].some(existingEp => existingEp.url === ep.url)) {
          groupedSeries.seasons[targetSeasonNum].push(ep);
        }
      }
    }
  }

  // Sort episodes in each season for each grouped series
  for (const [name, series] of groupedSeriesMap.entries()) {
    for (const seasonNum in series.seasons) {
      series.seasons[seasonNum].sort((a, b) => a.episode - b.episode);
    }
  }

  // Save series index to series.json
  const seriesObj = Object.fromEntries(groupedSeriesMap);
  await writeFile("series.json", JSON.stringify(seriesObj, null, 2));

  // Save live channels to live.json grouped by category
  const liveObj = Object.fromEntries(liveMap);
  await writeFile("live.json", JSON.stringify(liveObj, null, 2));

  console.log(`[Parser] Import completed: ${moviesCount} movies, ${seriesCount} episodes grouped into ${groupedSeriesMap.size} series, ${liveCount} live channels grouped into ${liveMap.size} categories.`);

  if (onProgress) {
    onProgress(100);
  }

  return {
    movies: moviesCount,
    series: groupedSeriesMap.size,
    episodes: seriesCount,
    live: liveCount
  };
}
