<script>
  import Header from "../components/Header.svelte";
  import Shelf from "../components/Shelf.svelte";
  import PlayerStream from "../components/PlayerStream.svelte";
  import { mdiTelevision } from "@mdi/js";
  import { onMount } from "svelte";
  import { readFile, fileExists } from "../services/storage.js";

  import { saveFocus, restoreFocus } from "../services/navigation.js";

  export let params = {};

  let categories = [];
  let isLoading = true;

  let showPlayer = false;
  let selectedChannel = null;

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
    showPlayer = true;
  }

  function handleClosePlayer() {
    showPlayer = false;
    selectedChannel = null;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }
</script>

<div class="app-container w-full h-full flex flex-col select-none overflow-y-auto">
  <div class="header-wrapper">
    <Header title="Canais de TV" icon={mdiTelevision} />
  </div>

  {#if isLoading}
    <div class="flex-grow flex items-center justify-center py-12">
      <span class="text-slate-400 animate-pulse text-base font-semibold">Carregando canais...</span>
    </div>
  {:else if categories.length === 0}
    <div class="flex-grow flex flex-col items-center justify-center text-center py-12 px-10">
      <h3 class="text-xl font-bold text-white mb-2">Nenhum canal encontrado</h3>
      <p class="text-sm text-slate-500 font-light max-w-sm">
        Sincronize uma lista M3U nas Configurações para carregar os canais de TV ao vivo.
      </p>
    </div>
  {:else}
    <div class="flex-grow mt-6 flex flex-col w-full">
      {#each categories as cat (cat.name)}
        <Shelf title={cat.name} items={cat.items} on:selectItem={handleSelectItem} />
      {/each}
    </div>
  {/if}
</div>

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
</style>
