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

<div class="w-full p-6 mx-auto h-screen overflow-hidden flex flex-row gap-12">
  <!-- Left Side: Input Bar & Keyboard -->
  <div class="w-[32%] flex flex-col gap-6 h-full select-none shrink-0">
    <!-- Search Query Preview Bar -->
    <div
      class="flex items-center gap-3 px-6 py-4 bg-slate-900/60 border border-glass-border rounded-2xl w-full"
    >
      <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current text-slate-400">
        <path
          d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
        />
      </svg>
      <span
        class="text-base font-semibold {query
          ? 'text-white'
          : 'text-slate-500'} truncate"
      >
        {query || "Search movies, shows, channels..."}
      </span>
    </div>

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
    height: calc(100vh - 120px); /* Fill vertical screen area offset */
    padding-top: 10px;

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
