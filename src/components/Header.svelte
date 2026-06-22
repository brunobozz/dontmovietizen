<script>
  export let title = "";
  export let icon = ""; // SVG path from @mdi/js
</script>

<header class="app-header mb-6">
  <div class="flex items-center gap-6">
    {#if icon}
      <svg
        viewBox="0 0 24 24"
        class="w-10 h-10 flex-shrink-0"
        fill="#ffffff"
        width="4rem"
        height="4rem"
      >
        <path d={icon} />
      </svg>
    {/if}
    <h1 class="app-title text-3xl font-extrabold">{title}</h1>
  </div>
</header>

<style lang="scss">
</style>
