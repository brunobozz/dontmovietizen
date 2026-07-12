<!-- Category.svelte -->
<!-- Page to render items of a single category in a grid -->

<script>
  import { onMount, tick } from "svelte";
  import { get } from "svelte/store";
  import Header from "../components/Header.svelte";
  import Cover from "../components/Cover.svelte";
  import MediaDetails from "../components/MediaDetails.svelte";
  import PlayerMedia from "../components/PlayerMedia.svelte";
  import PlayerStream from "../components/PlayerStream.svelte";
  import { mdiMovie, mdiFilmstrip, mdiTelevision, mdiArrowLeft } from "@mdi/js";
  import { readFile, fileExists } from "../services/storage.js";
  import { focusable, focusModal, saveFocus, restoreFocus, focusIndex, focusableElements, updateScroll } from "../services/navigation.js";
  import { favoritesStore } from "../services/favorites.js";

  export let params = {};

  $: type = params.type || "movie";
  $: categoryName = params.name || "";

  let items = [];
  let isLoading = true;
  let displayedCount = 24;

  $: {
    if (items) {
      displayedCount = 24;
    }
  }

  $: visibleItems = items.slice(0, displayedCount);

  let showDetails = false;
  let showPlayer = false;
  let selectedItem = null;

  onMount(() => {
    const unsubscribe = focusIndex.subscribe((idx) => {
      const els = get(focusableElements);
      const activeEl = els[idx];

      if (activeEl && displayedCount < items.length) {
        const gridCovers = Array.from(document.querySelectorAll(".page-container:not(.hidden)[data-page-id='category'] .cover-item"));
        const activeIndexInGrid = gridCovers.indexOf(activeEl);

        if (activeIndexInGrid !== -1 && activeIndexInGrid >= displayedCount - 8) {
          displayedCount = Math.min(items.length, displayedCount + 24);
        }
      }
    });

    return unsubscribe;
  });

  function getMediaTypeInfo(t) {
    switch (t) {
      case "movie":
        return { label: "FILMES", icon: mdiMovie };
      case "series":
        return { label: "SÉRIES", icon: mdiFilmstrip };
      default:
        return { label: "CANAIS", icon: mdiTelevision };
    }
  }

  $: mediaInfo = getMediaTypeInfo(type);
  $: headerTitle = `${mediaInfo.label} / ${categoryName.toUpperCase()}`;

  async function loadData() {
    isLoading = true;
    items = [];
    try {
      if (type === "movie") {
        if (await fileExists("movies.txt")) {
          const m3uText = await readFile("movies.txt");
          const categoriesMap = parseMoviesM3u(m3uText);
          items = categoriesMap[categoryName] || [];
        }
      } else if (type === "series") {
        if (await fileExists("series.json")) {
          const jsonText = await readFile("series.json");
          const data = JSON.parse(jsonText);
          const matched = [];
          for (const key in data) {
            const series = data[key];
            const seriesCat = series.category || "Séries";
            if (seriesCat === categoryName) {
              matched.push({
                ...series,
                type: "series",
                url: `series_${series.name}`
              });
            }
          }
          items = matched;
        }
      } else if (type === "live") {
        if (await fileExists("live.json")) {
          const jsonText = await readFile("live.json");
          const data = JSON.parse(jsonText);
          const rawList = data[categoryName] || [];
          items = rawList.map(ch => ({
            ...ch,
            type: "live",
            category: categoryName
          }));
        }
      }
    } catch (e) {
      console.error("Error loading category page:", e);
    } finally {
      isLoading = false;
      
      // Auto focus the first cover item once loading finishes and DOM updates
      await tick();
      setTimeout(() => {
        const firstCover = document.querySelector(".page-container:not(.hidden)[data-page-id='category'] .cover-item");
        if (firstCover) {
          const els = get(focusableElements);
          const targetIndex = els.indexOf(firstCover);
          if (targetIndex !== -1) {
            focusIndex.set(targetIndex);
            updateScroll();
          }
        }
      }, 60);
    }
  }

  function parseMoviesM3u(text) {
    const categoriesMap = {};
    const lines = text.split("\n");
    let currentMeta = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith("#EXTINF:")) {
        const groupMatch = line.match(/group-title="([^"]*)"/i);
        const category = groupMatch ? groupMatch[1].trim() : "Filmes";

        const parts = line.split(",");
        const name = parts[parts.length - 1].trim();

        const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
        const logo = logoMatch ? logoMatch[1].trim() : "";

        currentMeta = { name, category, logo };
      } else if (line.startsWith("http://") || line.startsWith("https://")) {
        if (currentMeta) {
          const movieItem = {
            name: currentMeta.name,
            category: currentMeta.category,
            logo: currentMeta.logo,
            url: line,
            type: "movie"
          };

          if (!categoriesMap[currentMeta.category]) {
            categoriesMap[currentMeta.category] = [];
          }
          categoriesMap[currentMeta.category].push(movieItem);
          currentMeta = null;
        }
      }
    }
    return categoriesMap;
  }

  $: {
    if (type && categoryName) {
      if (categoryName === "Favoritos") {
        items = $favoritesStore.filter(item => item.type === type);
        isLoading = false;
        
        // Trigger autofocus on first render
        tick().then(() => {
          setTimeout(() => {
            const firstCover = document.querySelector(".page-container:not(.hidden)[data-page-id='category'] .cover-item");
            if (firstCover) {
              const els = get(focusableElements);
              const targetIndex = els.indexOf(firstCover);
              if (targetIndex !== -1) {
                focusIndex.set(targetIndex);
                updateScroll();
              }
            }
          }, 60);
        });
      } else {
        loadData();
      }
    }
  }

  function handleSelectItem(item) {
    saveFocus();
    selectedItem = item;
    showDetails = true;
  }

  function handleCloseDetails() {
    showDetails = false;
    selectedItem = null;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

  function handlePlay() {
    saveFocus();
    showPlayer = true;
  }

  function handleClosePlayer() {
    showPlayer = false;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

</script>

<div class="app-container w-full h-full flex flex-col select-none" style="padding: 40px;">
  <div class="flex justify-between items-center mb-6">
    <Header title={headerTitle} icon={mediaInfo.icon} />
  </div>

  {#if isLoading}
    <div class="flex-grow flex items-center justify-center">
      <span class="text-slate-400 animate-pulse text-base font-semibold">Carregando itens...</span>
    </div>
  {:else if items.length === 0}
    <div class="flex-grow flex flex-col items-center justify-center text-center">
      <h3 class="text-xl font-bold text-white mb-2">Nenhum item nesta categoria</h3>
    </div>
  {:else}
    <div class="flex-grow overflow-y-auto pr-2 scroll-container">
      <div class="grid w-full pb-16">
        {#each visibleItems as item (item.url)}
          <div class="p-2 box-sizing-border">
            <Cover {item} on:click={() => handleSelectItem(item)} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

{#if showDetails && selectedItem}
  <MediaDetails 
    item={selectedItem} 
    onClose={handleCloseDetails} 
    onPlay={handlePlay}
  />
{/if}

{#if showPlayer && selectedItem}
  {#if selectedItem.type === 'live'}
    <PlayerStream item={selectedItem} onClose={handleClosePlayer} />
  {:else}
    <PlayerMedia item={selectedItem} onClose={handleClosePlayer} />
  {/if}
{/if}

<style lang="scss">
  .app-container {
    box-sizing: border-box;
  }


  .grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    
    @media (min-width: 1900px) {
      grid-template-columns: repeat(8, minmax(0, 1fr));
    }
  }

  .scroll-container {
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
</style>
