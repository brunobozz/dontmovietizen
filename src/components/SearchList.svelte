<script>
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { focusIndex, focusableElements } from "../services/navigation.js";
  import Cover from "./Cover.svelte";

  export let results = [];
  export let query = "";

  let displayedCount = 20;

  // Reset pagination when results or query changes
  $: {
    if (results || query) {
      displayedCount = 20;
    }
  }

  $: visibleResults = results.slice(0, displayedCount);

  // Re-evaluate infinite scroll whenever the focused element changes
  onMount(() => {
    const unsubscribe = focusIndex.subscribe((idx) => {
      const els = get(focusableElements);
      const activeEl = els[idx];

      if (activeEl && displayedCount < results.length) {
        // Find all Cover elements currently rendered in this grid
        const gridCovers = Array.from(document.querySelectorAll(".search-results-grid .cover-item"));
        const activeIndexInGrid = gridCovers.indexOf(activeEl);

        // If focusing one of the last 8 visible items, load the next page
        if (activeIndexInGrid !== -1 && activeIndexInGrid >= displayedCount - 8) {
          displayedCount = Math.min(results.length, displayedCount + 20);
        }
      }
    });

    return unsubscribe;
  });
</script>

<div class="search-list-container w-full h-full flex flex-col">
  {#if query === ""}
    <!-- Empty / Start Search Message -->
    <div class="flex-grow flex flex-col items-center justify-center text-center p-8 select-none my-auto">
      <div class="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-slate-800">
        <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current text-slate-500">
          <path d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-white mb-2">Search for movies, TV shows or channels</h3>
      <p class="text-sm text-slate-500 font-light max-w-sm">
        Use the on-screen keyboard to search by title or group categories in your M3U playlist.
      </p>
    </div>
  {:else}
    <!-- Results or No Matches -->
    {#if visibleResults.length === 0}
      <div class="flex-grow flex flex-col items-center justify-center text-center p-8 select-none my-auto animate-fadeIn">
        <h3 class="text-xl font-bold text-white mb-2">No results found for "{query}"</h3>
        <p class="text-sm text-slate-500 font-light max-w-sm">
          Double check the spelling or try searching for another term.
        </p>
      </div>
    {:else}
      <!-- 4-Column Poster Grid -->
      <div class="search-results-grid grid grid-cols-4 gap-6 w-full pb-16 overflow-y-visible">
        {#each visibleResults as item (item.url)}
          <Cover {item} />
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  .search-list-container {
    height: calc(100vh - 180px); /* Fill available vertical space minus padding */
    overflow-y: visible; /* Let Svelte scroll container scroll it */
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fadeIn {
    animation: fadeIn 0.4s ease-out forwards;
  }
</style>
