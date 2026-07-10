<script>
  import { focusable } from "../services/navigation.js";
  import { mdiTelevision } from "@mdi/js";

  export let item;

  let imageError = false;

  function handleImageError() {
    imageError = true;
  }
</script>

<div
  use:focusable
  class="channel-cover focusable relative select-none"
  on:click
>
  <!-- Background logo or Fallback -->
  {#if item.logo && !imageError}
    <div class="logo-wrapper absolute inset-0 flex items-center justify-center p-4 bg-slate-950/40">
      <img
        src={item.logo}
        alt={item.name}
        on:error={handleImageError}
        class="max-w-full max-h-full object-contain"
      />
    </div>
  {:else}
    <!-- Fallback layout -->
    <div class="absolute inset-0 flex flex-col items-center justify-center p-3 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
      <svg viewBox="0 0 24 24" class="w-12 h-12 fill-current text-slate-500 mb-2">
        <path d={mdiTelevision} />
      </svg>
      <span class="text-[9px] text-slate-400 uppercase tracking-wider block">
        {item.category || "TV"}
      </span>
    </div>
  {/if}

  <!-- Channel Name Overlay (Top-Left Gradient) -->
  <div class="text-gradient-overlay flex flex-col text-left">
    <span class="text-xs font-bold text-white truncate w-full">{item.name}</span>
  </div>
</div>

<style lang="scss">
  .text-gradient-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    padding: 12px;
    box-sizing: border-box;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0) 100%);
    z-index: 2;
  }

  .channel-cover {
    position: relative;
    width: 100%;
    height: 0;
    padding-bottom: 56.25%; /* 16:9 Aspect Ratio Hack */
    background-color: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.25s ease;

    &:global(.focused) {
      border-color: #38bdf8 !important;
      box-shadow: 0 0 15px rgba(14, 165, 233, 0.45);
      transform: scale(1.05);
      z-index: 5;
    }
  }

  @media (min-width: 1900px) {
    .channel-cover {
      border-radius: 16px;
    }
  }
</style>
