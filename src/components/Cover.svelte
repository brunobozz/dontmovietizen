<script>
  import { focusable } from "../services/navigation.js";
  import { mdiTelevision, mdiMovie, mdiFilmstrip } from "@mdi/js";
  import SkeletonCover from "./SkeletonCover.svelte";

  export let item;
  export let isFirst = false;
  export let isLast = false;

  let imageError = false;
  let imageLoaded = false;

  function handleImageError() {
    imageError = true;
  }

  // Determine media type label & icon
  function getMediaInfo(type) {
    switch (type) {
      case "movie":
        return { label: "Filme", icon: mdiMovie, color: "bg-rose-600" };
      case "series":
        return { label: "Série", icon: mdiFilmstrip, color: "bg-indigo-600" };
      default:
        return { label: "TV ao Vivo", icon: mdiTelevision, color: "bg-sky-600" };
    }
  }

  $: info = getMediaInfo(item.type);
</script>

<div
  use:focusable
  data-url={item.url}
  data-first={isFirst ? "true" : undefined}
  data-last={isLast ? "true" : undefined}
  class="cover-item focusable w-full aspect-[2/3] relative overflow-hidden"
  on:click
>
  <!-- Background Image or Fallback -->
  {#if item.logo && !imageError}
    {#if !imageLoaded}
      <SkeletonCover type={item.type} />
    {/if}
    <img
      src={item.logo}
      alt={item.name}
      on:load={() => imageLoaded = true}
      on:error={handleImageError}
      class="w-full h-full bg-slate-950 {item.type === 'live' ? 'object-contain p-3' : 'object-cover'} {imageLoaded ? '' : 'hidden'}"
    />
  {:else}
    <!-- Premium Fallback Card -->
    <div class="absolute inset-0 bg-slate-950 select-none flex flex-col justify-end p-3">
      <!-- Media Icon (Centered) -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 24 24" class="w-12 h-12 fill-current text-slate-800/60">
          <path d={info.icon} />
        </svg>
      </div>

      <!-- Mini badge at top-right of the fallback card (exactly matching the image badge) -->
      <span class="absolute top-2 right-2 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded text-white {info.color} pointer-events-none shadow-md">
        {info.label}
      </span>

      <!-- Text overlay at the bottom (Category + Title) -->
      <div class="flex flex-col text-left w-full mt-auto relative z-10">
        <span class="text-[10px] text-slate-400 uppercase font-semibold truncate mb-0.5">
          {item.category || "Outros"}
        </span>
        <span class="text-xs font-bold text-white leading-tight line-clamp-2">
          {item.name}
        </span>
      </div>
    </div>
  {/if}

  <!-- Overlays when image IS loaded (Gradient + Title on hover/focus) -->
  {#if item.logo && !imageError && imageLoaded}
    <div class="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent {item.type === 'live' ? 'opacity-100' : 'opacity-0'} pointer-events-none cover-overlay flex flex-col justify-end p-3">
      <span class="text-[10px] text-slate-400 uppercase font-semibold truncate mb-0.5">{item.category}</span>
      <span class="text-xs font-bold text-white leading-tight line-clamp-2">{item.name}</span>
    </div>

    <!-- Mini badge at top-right of the cover poster -->
    <span class="absolute top-2 right-2 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded text-white {info.color} pointer-events-none shadow-md">
      {info.label}
    </span>
  {/if}
</div>

<style lang="scss">
  .cover-item {
    border: 2px solid transparent;
    cursor: pointer;
    user-select: none;
    outline: none;

    &:global(.focused) {
      border-color: #38bdf8 !important;
      transform: scale(1.05) !important;
      box-shadow: 0 0px 15px rgba(14, 165, 233, 0.4) !important;
      z-index: 20;

      .cover-overlay {
        opacity: 1;
      }
    }
  }
</style>
