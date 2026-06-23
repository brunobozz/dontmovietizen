<script>
  import { onMount } from "svelte";
  import { getAllItems } from "../services/db.js";
  import SearchKeyboard from "../components/SearchKeyboard.svelte";
  import SearchList from "../components/SearchList.svelte";

  let allItems = [];
  let query = "";
  let results = [];
  let isLoading = true;

  onMount(async () => {
    try {
      allItems = await getAllItems();
    } catch (e) {
      console.error("Failed to load IndexedDB items for search cache:", e);
    } finally {
      isLoading = false;
    }
  });

  // Reactively filter items based on the search query
  $: {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      results = [];
    } else {
      results = allItems.filter(
        (item) =>
          item.searchName.includes(trimmedQuery) ||
          (item.category && item.category.toLowerCase().includes(trimmedQuery)),
      );
    }
  }
</script>

<div class="w-full mx-auto h-screen overflow-hidden flex flex-row">
  <!-- Left Side: Input Bar & Keyboard -->
  <div
    class="w-[32%] flex flex-col gap-6 h-full select-none shrink-0"
    style="padding: 40px; padding-right:0;"
  >
    <SearchKeyboard bind:value={query} />
  </div>

  <!-- Right Side: Results Grid (Cover List) -->
  <div class="w-[68%] h-full overflow-y-auto pr-2 scroll-container">
    {#if isLoading}
      <div class="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <svg class="animate-spin h-10 w-10 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm font-light tracking-wide animate-pulse">Loading search database...</span>
      </div>
    {:else}
      <SearchList {results} {query} />
    {/if}
  </div>
</div>

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
