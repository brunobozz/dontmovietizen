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
    {#if isLoading}
      <div
        class="flex-grow flex items-center justify-center text-slate-500 text-sm font-light"
      >
        Loading database...
      </div>
    {:else}
      <SearchKeyboard bind:value={query} />
    {/if}
  </div>

  <!-- Right Side: Results Grid (Cover List) -->
  <div class="w-[68%] h-full overflow-y-auto pr-2 scroll-container">
    <SearchList {results} {query} />
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
