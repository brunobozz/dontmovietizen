<script>
  import Header from "../components/Header.svelte";
  import Shelf from "../components/Shelf.svelte";
  import MediaDetails from "../components/MediaDetails.svelte";
  import PlayerMedia from "../components/PlayerMedia.svelte";
  import { mdiFilmstrip } from "@mdi/js";
  import { onMount } from "svelte";
  import { readFile, fileExists } from "../services/storage.js";
  import { saveFocus, restoreFocus } from "../services/navigation.js";

  export let params = {};

  let categories = [];
  let isLoading = true;

  let showDetails = false;
  let showPlayer = false;
  let selectedSeries = null;

  // Lazy loading shelves - start with 5 rows
  let visibleShelvesCount = 5;
  $: visibleCategories = categories.slice(0, visibleShelvesCount);

  onMount(async () => {
    try {
      if (await fileExists("series.json")) {
        const jsonText = await readFile("series.json");
        const data = JSON.parse(jsonText);
        
        const categoriesMap = {};
        for (const key in data) {
          const series = data[key];
          const categoryName = series.category || "Séries";
          
          if (!categoriesMap[categoryName]) {
            categoriesMap[categoryName] = [];
          }
          categoriesMap[categoryName].push({
            ...series,
            type: "series",
            url: `series_${series.name}` // Unique URL key for Svelte loops
          });
        }

        // Convert categories map into list of categories
        categories = Object.keys(categoriesMap).map((categoryName) => {
          return {
            name: categoryName,
            items: categoriesMap[categoryName],
            count: categoriesMap[categoryName].length
          };
        });
      }
    } catch (err) {
      console.error("Failed to load series categories for Shelves:", err);
    } finally {
      isLoading = false;
    }
  });

  function handleSelectItem(event) {
    saveFocus();
    selectedSeries = event.detail;
    showDetails = true;
  }

  function handleCloseDetails() {
    showDetails = false;
    selectedSeries = null;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

  function handlePlaySeries() {
    showDetails = false;
    showPlayer = true;
  }

  function handleClosePlayer() {
    showPlayer = false;
    selectedSeries = null;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

  function handleShelfFocused(event) {
    const shelfEl = event.target.closest("[data-shelf-index]");
    if (!shelfEl) return;

    const idx = parseInt(shelfEl.getAttribute("data-shelf-index"), 10);
    if (idx >= visibleShelvesCount - 2 && visibleShelvesCount < categories.length) {
      visibleShelvesCount = Math.min(visibleShelvesCount + 2, categories.length);
    }
  }
</script>

<div class="app-container select-none">
  <div class="header-wrapper">
    <Header title="Séries" icon={mdiFilmstrip} />
  </div>

  {#if isLoading}
    <div class="loader-wrapper">
      <span class="loader-text">Carregando séries...</span>
    </div>
  {:else if categories.length === 0}
    <div class="empty-wrapper">
      <h3 class="empty-title">Nenhuma série encontrada</h3>
      <p class="empty-desc">
        Sincronize uma lista M3U nas Configurações para carregar suas séries.
      </p>
    </div>
  {:else}
    <div class="shelves-list" on:sn-focused={handleShelfFocused}>
      {#each visibleCategories as cat, index (cat.name)}
        <div data-shelf-index={index}>
          <Shelf title={cat.name} items={cat.items} on:selectItem={handleSelectItem} />
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showDetails && selectedSeries}
  <MediaDetails 
    item={selectedSeries} 
    onClose={handleCloseDetails} 
    onPlay={handlePlaySeries}
  />
{/if}

{#if showPlayer && selectedSeries}
  <PlayerMedia item={selectedSeries} onClose={handleClosePlayer} />
{/if}

<style lang="scss">
  .app-container {
    box-sizing: border-box;
    padding-top: 40px;
    padding-bottom: 40px;
    padding-left: 0;
    padding-right: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  .header-wrapper {
    padding-left: 40px;
    padding-right: 40px;
    width: 100%;
    box-sizing: border-box;
  }

  .shelves-list {
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 24px;
    box-sizing: border-box;
  }

  .loader-wrapper {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
  }

  .loader-text {
    color: #94a3b8;
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    font-size: 16px;
    font-weight: 600;
  }

  .empty-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 40px;
  }

  .empty-title {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 8px;
  }

  .empty-desc {
    font-size: 14px;
    color: #64748b;
    font-weight: 300;
    max-width: 320px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  }
</style>
