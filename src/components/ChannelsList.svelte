<script>
  import { onMount, createEventDispatcher } from "svelte";
  import { get } from "svelte/store";
  import { focusIndex, focusableElements } from "../services/navigation.js";
  import ChannelCover from "./ChannelCover.svelte";

  const dispatch = createEventDispatcher();

  export let channels = [];

  let displayedCount = 24;

  // Reset pagination when channels change
  $: {
    if (channels) {
      displayedCount = 24;
    }
  }

  $: visibleChannels = channels.slice(0, displayedCount);

  // Re-evaluate infinite scroll whenever the focused element changes
  onMount(() => {
    const unsubscribe = focusIndex.subscribe((idx) => {
      const els = get(focusableElements);
      const activeEl = els[idx];

      if (activeEl && displayedCount < channels.length) {
        // Find all ChannelCover elements currently rendered in this grid
        const gridCovers = Array.from(document.querySelectorAll(".channels-results-grid .channel-cover"));
        const activeIndexInGrid = gridCovers.indexOf(activeEl);

        // If focusing one of the last 8 visible items, load the next page
        if (activeIndexInGrid !== -1 && activeIndexInGrid >= displayedCount - 8) {
          displayedCount = Math.min(channels.length, displayedCount + 24);
        }
      }
    });

    return unsubscribe;
  });
</script>

<div class="channels-list-container w-full h-full flex flex-col">
  {#if channels.length === 0}
    <div class="flex-grow flex flex-col items-center justify-center text-center p-8 select-none my-auto">
      <h3 class="text-xl font-bold text-white mb-2">Nenhum canal disponível</h3>
      <p class="text-sm text-slate-500 font-light max-w-sm">
        Esta categoria não possui canais cadastrados.
      </p>
    </div>
  {:else}
    <!-- Grid of horizontal channels, occupying 100% space. No gap is used. Spacing is handled by p-2 padding. -->
    <div class="channels-results-grid grid grid-cols-4 w-full pb-16 overflow-y-visible">
      {#each visibleChannels as ch (ch.url)}
        <div class="p-2 box-sizing-border">
          <ChannelCover item={ch} on:click={() => dispatch('selectChannel', ch)} />
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss">
  .channels-results-grid {
    align-content: start;
    grid-auto-rows: max-content;
  }

  .channels-list-container {
    height: calc(100vh - 180px);
    overflow-y: visible;
  }

  /* 1080p Smart TVs layout */
  @media (min-width: 1900px) {
    .channels-results-grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
    .channels-list-container {
      height: calc(100vh - 220px);
    }
  }
</style>
