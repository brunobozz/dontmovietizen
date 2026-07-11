<script>
  import { onMount, createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import { focusIndex, focusableElements } from "../services/navigation.js";
  import Cover from "./Cover.svelte";

  const dispatch = createEventDispatcher();

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
  {#if visibleResults.length === 0}
    <div class="flex-grow flex flex-col items-center justify-center text-center p-8 select-none my-auto animate-fadeIn">
      <h3 class="text-xl font-bold text-white mb-2">
        {query ? `No results found for "${query}"` : "No media files available"}
      </h3>
      <p class="text-sm text-slate-500 font-light max-w-sm">
        {query ? "Double check the spelling or try searching for another term." : "Please import an M3U list in settings first."}
      </p>
    </div>
  {:else}
    <!-- 4-Column Poster Grid -->
    <div class="search-results-grid grid grid-cols-4 w-full pb-16 overflow-y-visible">
      {#each visibleResults as item, i (item.url + '_' + i)}
        <Cover {item} on:click={() => dispatch('selectItem', item)} />
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .search-results-grid {
    align-content: start;
    grid-auto-rows: max-content;
  }

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
