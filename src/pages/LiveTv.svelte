<script>
  import { onMount } from "svelte";
  import Header from "../components/Header.svelte";
  import CategoriesList from "../components/CategoriesList.svelte";
  import { mdiTelevision } from "@mdi/js";
  import { readFile, fileExists } from "../services/storage.js";

  let categories = [];
  let isLoading = true;

  onMount(async () => {
    try {
      if (await fileExists("live.json")) {
        const jsonText = await readFile("live.json");
        const data = JSON.parse(jsonText);
        
        categories = Object.keys(data)
          .map((key) => ({
            name: key,
            count: data[key].length
          }))
          .sort((a, b) => b.count - a.count);
      }
    } catch (e) {
      console.error("Failed to load live categories:", e);
    } finally {
      isLoading = false;
    }
  });

  function handleSelectCategory(event) {
    const categoryName = event.detail;
    window.location.hash = `live-category?name=${encodeURIComponent(categoryName)}`;
  }
</script>

<div class="app-container w-full h-full flex flex-col select-none overflow-y-auto" style="padding: 40px;">
  <Header title="Canais de TV" icon={mdiTelevision} />

  {#if isLoading}
    <div class="flex-grow flex items-center justify-center">
      <span class="text-slate-400 animate-pulse text-base font-semibold">Carregando categorias...</span>
    </div>
  {:else if categories.length === 0}
    <div class="flex-grow flex flex-col items-center justify-center text-center">
      <h3 class="text-xl font-bold text-white mb-2">Nenhuma categoria encontrada</h3>
      <p class="text-sm text-slate-500 font-light max-w-sm">
        Importe uma lista M3U nas Configurações para carregar os canais de TV ao vivo.
      </p>
    </div>
  {:else}
    <div class="flex-grow mt-6">
      <CategoriesList {categories} on:select={handleSelectCategory} />
    </div>
  {/if}
</div>

<style lang="scss">
  .app-container {
    box-sizing: border-box;
    padding-right: 8px;

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
</style>
