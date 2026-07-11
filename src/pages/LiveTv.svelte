<script>
  import Header from "../components/Header.svelte";
  import Shelf from "../components/Shelf.svelte";
  import PlayerStream from "../components/PlayerStream.svelte";
  import MediaDetails from "../components/MediaDetails.svelte";
  import { mdiTelevision } from "@mdi/js";
  import { onMount, tick } from "svelte";
  import { readFile, fileExists } from "../services/storage.js";
  import { saveFocus, restoreFocus, focusModal } from "../services/navigation.js";

  export let params = {};

  let categories = [];
  let isLoading = true;

  let showPlayer = false;
  let showDetails = false;
  let selectedChannel = null;

  // Lazy loading shelves - start with 5 rows
  let visibleShelvesCount = 5;
  $: visibleCategories = categories.slice(0, visibleShelvesCount);

  onMount(async () => {
    try {
      if (await fileExists("live.json")) {
        const jsonText = await readFile("live.json");
        const data = JSON.parse(jsonText);
        
        // Convert object into array of categories with mapped items
        categories = Object.keys(data).map((categoryName) => {
          const items = data[categoryName].map((ch) => ({
            ...ch,
            type: "live",
            category: categoryName
          }));
          return {
            name: categoryName,
            items,
            count: items.length
          };
        });
      }
    } catch (err) {
      console.error("Failed to load live categories for Shelves:", err);
    } finally {
      isLoading = false;
    }
  });

  function handleSelectItem(event) {
    saveFocus();
    selectedChannel = event.detail;
    showDetails = true;
  }

  function handleCloseDetails() {
    showDetails = false;
    selectedChannel = null;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

  function handlePlayChannel() {
    saveFocus();
    showPlayer = true;
  }

  function handleClosePlayer() {
    showPlayer = false;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

  function handleShelfFocused(event) {
    const shelfEl = event.target.closest("[data-shelf-index]");
    if (!shelfEl) return;

    const idx = parseInt(shelfEl.getAttribute("data-shelf-index"), 10);
    // If we focus the second-to-last or last shelf, append 2 more categories
    if (idx >= visibleShelvesCount - 2 && visibleShelvesCount < categories.length) {
      visibleShelvesCount = Math.min(visibleShelvesCount + 2, categories.length);
    }
  }
</script>

<div class="app-container select-none">
  <div class="header-wrapper">
    <Header title="Canais de TV" icon={mdiTelevision} />
  </div>

  {#if isLoading}
    <div class="loader-wrapper">
      <span class="loader-text">Carregando canais...</span>
    </div>
  {:else if categories.length === 0}
    <div class="empty-wrapper">
      <h3 class="empty-title">Nenhum canal encontrado</h3>
      <p class="empty-desc">
        Sincronize uma lista M3U nas Configurações para carregar os canais de TV ao vivo.
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

{#if showDetails && selectedChannel}
  <MediaDetails 
    item={selectedChannel} 
    onClose={handleCloseDetails} 
    onPlay={handlePlayChannel}
  />
{/if}

{#if showPlayer && selectedChannel}
  <PlayerStream item={selectedChannel} onClose={handleClosePlayer} />
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
