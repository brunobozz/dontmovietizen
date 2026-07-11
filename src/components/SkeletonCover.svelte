<!-- SkeletonCover.svelte -->
<!-- Reusable loading skeleton for poster covers -->

<script>
  import { mdiMovie, mdiFilmstrip, mdiTelevision } from "@mdi/js";

  export let type = "movie";

  function getIcon(type) {
    switch (type) {
      case "movie":
        return mdiMovie;
      case "series":
        return mdiFilmstrip;
      default:
        return mdiTelevision;
    }
  }

  $: icon = getIcon(type);
</script>

<div class="absolute inset-0 bg-slate-850 flex items-center justify-center animate-pulse select-none overflow-hidden">
  <!-- Subtle centered media icon placeholder -->
  <svg viewBox="0 0 24 24" class="w-12 h-12 fill-current text-slate-700/40">
    <path d={icon} />
  </svg>
</div>

<style lang="scss">
  .bg-slate-850 {
    background-color: rgba(30, 41, 59, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.02);
  }
</style>
