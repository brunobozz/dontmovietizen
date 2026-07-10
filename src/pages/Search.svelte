<script>
  import { onMount, tick } from "svelte";
  import { saveFocus, restoreFocus, focusModal } from "../services/navigation.js";
  import { readFile, fileExists } from "../services/storage.js";
  import SearchKeyboard from "../components/SearchKeyboard.svelte";
  import SearchList from "../components/SearchList.svelte";
  import MediaDetails from "../components/MediaDetails.svelte";
  import PlayerMedia from "../components/PlayerMedia.svelte";
  import PlayerStream from "../components/PlayerStream.svelte";

  let query = "";
  let results = [];
  let isLoading = true;

  let moviesData = "";
  let liveData = null;
  let seriesData = null;

  let selectedItem = null;
  let showModal = false;
  let showPlayer = false;

  onMount(async () => {
    try {
      if (await fileExists("movies.txt")) {
        moviesData = await readFile("movies.txt");
      }
      if (await fileExists("live.json")) {
        const jsonText = await readFile("live.json");
        liveData = JSON.parse(jsonText);
      }
      if (await fileExists("series.json")) {
        const jsonText = await readFile("series.json");
        seriesData = JSON.parse(jsonText);
      }
    } catch (e) {
      console.error("Failed to load local files for search:", e);
    } finally {
      isLoading = false;
    }
  });

  function extractAttrFromExtinf(line, attrName) {
    const match = line.match(new RegExp(`${attrName}="([^"]*)"`, 'i'));
    return match ? match[1].trim() : '';
  }

  function extractNameFromExtinf(line) {
    const commaIndex = line.lastIndexOf(',');
    return commaIndex !== -1 ? line.substring(commaIndex + 1).trim() : 'Sem Nome';
  }

  function searchRawData(rawData, queryText, type, maxResults = 30) {
    const matched = [];
    if (!rawData) return matched;
    
    const lowerQuery = queryText.toLowerCase();
    let pos = 0;

    while (matched.length < maxResults) {
      const extinfPos = rawData.indexOf("#EXTINF:", pos);
      if (extinfPos === -1) break;

      const lineEnd = rawData.indexOf("\n", extinfPos);
      if (lineEnd === -1) break;

      const line = rawData.substring(extinfPos, lineEnd);
      
      if (line.toLowerCase().includes(lowerQuery)) {
        const nextLineStart = lineEnd + 1;
        let nextLineEnd = rawData.indexOf("\n", nextLineStart);
        if (nextLineEnd === -1) nextLineEnd = rawData.length;

        const url = rawData.substring(nextLineStart, nextLineEnd).trim();
        const name = extractNameFromExtinf(line);
        const logo = extractAttrFromExtinf(line, 'tvg-logo');
        const tvgId = extractAttrFromExtinf(line, 'tvg-id');
        const category = extractAttrFromExtinf(line, 'group-title') || 'Outros';

        matched.push({
          url,
          type,
          name,
          logo,
          tvgId,
          category,
          searchName: name.toLowerCase()
        });
      }

      pos = lineEnd + 1;
    }
    return matched;
  }

  function searchLive(liveObj, queryText, maxResults = 30) {
    const matched = [];
    if (!liveObj) return matched;

    const lowerQuery = queryText.toLowerCase();
    let count = 0;

    for (const category in liveObj) {
      if (count >= maxResults) break;
      const channels = liveObj[category];
      for (const ch of channels) {
        if (count >= maxResults) break;
        if (ch.name.toLowerCase().includes(lowerQuery) || category.toLowerCase().includes(lowerQuery)) {
          matched.push({
            type: "live",
            name: ch.name,
            logo: ch.logo,
            category: category,
            url: ch.url
          });
          count++;
        }
      }
    }
    return matched;
  }

  function searchSeries(seriesObj, queryText, maxResults = 30) {
    const matched = [];
    if (!seriesObj) return matched;

    const lowerQuery = queryText.toLowerCase();
    let count = 0;

    for (const seriesName in seriesObj) {
      if (count >= maxResults) break;
      
      const series = seriesObj[seriesName];
      const matchesName = seriesName.toLowerCase().includes(lowerQuery);
      const matchesCategory = series.category && series.category.toLowerCase().includes(lowerQuery);

      if (matchesName || matchesCategory) {
        matched.push({
          type: "series",
          name: series.name,
          logo: series.logo,
          category: series.category,
          seasons: series.seasons,
          url: `series_${series.name}`
        });
        count++;
      }
    }
    return matched;
  }

  async function handleSelectItem(event) {
    const item = event.detail;
    saveFocus();
    selectedItem = item;
    showModal = true;
    
    // Wait for the modal to be rendered in the DOM
    await tick();
    focusModal();
  }

  function handleCloseModal() {
    showModal = false;
    selectedItem = null;
    
    // Delay slightly to let unmount complete, then restore focus
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

  function handlePlay() {
    // Hide details modal, open player
    showModal = false;
    showPlayer = true;
  }

  async function handleClosePlayer() {
    // Hide player, reopen details modal
    showPlayer = false;
    showModal = true;

    // Wait for the details modal to mount, then focus inside it
    await tick();
    focusModal();
  }

  // Reactively filter items based on the search query
  $: {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      results = [];
    } else {
      const matchedMovies = searchRawData(moviesData, trimmedQuery, "movie", 30);
      const matchedLive = searchLive(liveData, trimmedQuery, 30);
      const matchedSeries = searchSeries(seriesData, trimmedQuery, 30);
      
      results = [...matchedMovies, ...matchedSeries, ...matchedLive];
    }
  }
</script>

<div class="w-full mx-auto h-screen overflow-hidden flex flex-row">
  <!-- Left Side: Input Bar & Keyboard -->
  <div
    class="w-[32%] flex flex-col h-full select-none shrink-0"
    style="padding: 40px; padding-right:0;"
  >
    <SearchKeyboard bind:value={query} />
  </div>

  <!-- Right Side: Results Grid (Cover List) -->
  <div class="w-[68%] h-full overflow-y-auto pr-2 scroll-container">
    {#if isLoading}
      <div class="flex flex-col items-center justify-center h-full text-slate-400">
        <svg class="animate-spin h-10 w-10 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-light tracking-wide animate-pulse">Loading search database...</span>
      </div>
    {:else}
      <SearchList {results} {query} on:selectItem={handleSelectItem} />
    {/if}
  </div>
</div>

{#if showModal && selectedItem}
  <MediaDetails item={selectedItem} onClose={handleCloseModal} onPlay={handlePlay} />
{/if}

{#if showPlayer && selectedItem}
  {#if selectedItem.type === "live"}
    <PlayerStream item={selectedItem} onClose={handleClosePlayer} />
  {:else}
    <PlayerMedia item={selectedItem} onClose={handleClosePlayer} />
  {/if}
{/if}

<style lang="scss">
  .scroll-container {
    height: 100vh; /* Fill vertical screen area offset */
    padding: 40px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
    }
  }
</style>
