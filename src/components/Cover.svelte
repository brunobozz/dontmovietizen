<script>
  import { focusable } from "../services/navigation.js";
  import { mdiTelevision, mdiMovie, mdiFilmstrip } from "@mdi/js";

  export let item;

  let imageError = false;

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
  class="cover-item focusable w-full aspect-[2/3] relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-transparent transition-all duration-200"
>
  <!-- Background Image or Fallback -->
  {#if item.logo && !imageError}
    <img
      src={item.logo}
      alt={item.name}
      on:error={handleImageError}
      class="w-full h-full object-cover"
    />
  {:else}
    <!-- Premium Fallback Card -->
    <div class="absolute inset-0 flex flex-col justify-between p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 select-none">
      <div class="flex justify-between items-start w-full">
        <!-- Media Type Badge -->
        <span class="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded text-white {info.color}">
          {info.label}
        </span>
        <!-- Media Icon -->
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current text-slate-500">
          <path d={info.icon} />
        </svg>
      </div>

      <!-- Item Title -->
      <div class="flex flex-col gap-1 text-left w-full mt-auto">
        <span class="text-xs text-slate-400 font-medium uppercase tracking-wide truncate">
          {item.category || "Outros"}
        </span>
        <span class="text-sm font-bold text-white leading-snug line-clamp-3">
          {item.name}
        </span>
      </div>
    </div>
  {/if}

  <!-- Overlays when image IS loaded (Gradient + Title on hover/focus) -->
  {#if item.logo && !imageError}
    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-200 pointer-events-none cover-overlay flex flex-col justify-end p-3">
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
    border-color: transparent;
    cursor: pointer;
    user-select: none;
    outline: none;

    &:global(.focused) {
      border-color: #38bdf8 !important;
      transform: scale(1.05) !important;
      box-shadow: 0 10px 25px rgba(14, 165, 233, 0.4) !important;
      z-index: 20;

      .cover-overlay {
        opacity: 1;
      }
    }
  }
</style>
