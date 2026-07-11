<!-- SkeletonEpisodes.svelte -->
<!-- Svelte component to render loading skeletons for Seasons and Episodes layout -->

<div class="episodes-list-split animate-pulse">
  <!-- Left: Seasons column skeleton -->
  <div class="seasons-column">
    {#each Array(4) as _}
      <div class="skeleton-btn season-skele bg-slate-800/40 border border-slate-700/20 rounded-xl mb-2 flex items-center justify-between px-4 py-3">
        <div class="h-4 bg-slate-700 rounded w-24"></div>
        <div class="h-4 bg-sky-900/40 rounded-full w-12"></div>
      </div>
    {/each}
  </div>

  <!-- Right: Episodes column skeleton -->
  <div class="episodes-column">
    {#each Array(5) as _}
      <div class="skeleton-btn episode-skele bg-slate-800/20 border border-slate-700/10 rounded-lg mb-2 flex items-center px-4 py-2.5">
        <div class="w-3 h-3 rounded bg-sky-900/40 mr-3"></div>
        <div class="h-3 bg-slate-700 rounded w-12 mr-3"></div>
        <div class="h-3 bg-slate-700 rounded w-32"></div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .episodes-list-split {
    display: flex;
    width: 100%;
    height: 250px;
    margin-top: 15px;
    box-sizing: border-box;

    @media (min-width: 1900px) {
      height: 380px;
    }
  }

  .seasons-column {
    width: calc(50% - 8px);
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-right: 5px;
    box-sizing: border-box;
  }

  .episodes-column {
    width: calc(50% - 8px);
    margin-left: 16px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-right: 5px;
    box-sizing: border-box;
  }

  .skeleton-btn {
    box-sizing: border-box;
    flex-shrink: 0;
    
    &.season-skele {
      height: 48px;
      @media (min-width: 1900px) {
        height: 60px;
        border-radius: 14px;
        padding: 16px 22px !important;
      }
    }
    
    &.episode-skele {
      height: 42px;
      @media (min-width: 1900px) {
        height: 52px;
        border-radius: 12px;
        padding: 14px 20px !important;
      }
    }
  }
</style>
