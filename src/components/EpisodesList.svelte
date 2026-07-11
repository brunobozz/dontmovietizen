<script>
  import { tick } from "svelte";
  import { focusable } from "../services/navigation.js";
  import { mdiPlay } from "@mdi/js";

  export let seasons = {};
  export let activeSeason = null;
  export let playEpisode;

  $: seasonsList = seasons
    ? Object.keys(seasons).sort((a, b) => {
        if (a === "Especiais") return 1;
        if (b === "Especiais") return -1;
        return Number(a) - Number(b);
      })
    : [];

  $: if (!activeSeason && seasonsList.length > 0) {
    activeSeason = seasonsList[0];
  }

  $: if (activeSeason) {
    tick().then(() => {
      const episodesCol = document.querySelector(".episodes-column");
      if (episodesCol) {
        episodesCol.scrollTop = 0;
      }
    });
  }
</script>

<div class="episodes-list-split select-none">
  <!-- Left Column: Seasons List (50%) -->
  <div class="seasons-column scroll-container">
    {#each seasonsList as seasonNum, index}
      <button
        use:focusable
        class="focusable season-btn {activeSeason === seasonNum ? 'active' : ''}"
        data-type="season-btn"
        data-index={index}
        data-total={seasonsList.length}
        on:click={() => activeSeason = seasonNum}
        on:sn-focused={() => activeSeason = seasonNum}
      >
        <span class="season-name">
          {seasonNum === "Especiais" ? "Especiais" : `Temporada ${seasonNum}`}
        </span>
        <span class="episodes-badge">
          {seasons[seasonNum].length} EPs
        </span>
      </button>
    {/each}
  </div>

  <!-- Right Column: Episodes List (50%) -->
  <div class="episodes-column scroll-container">
    {#if activeSeason && seasons[activeSeason]}
      {#each seasons[activeSeason] as ep, epIndex}
        <button
          use:focusable
          class="focusable episode-item"
          data-type="episode-item"
          data-index={epIndex}
          data-total={seasons[activeSeason].length}
          on:click={() => playEpisode(ep)}
        >
          <svg viewBox="0 0 24 24" class="play-icon"><path d={mdiPlay} /></svg>
          <span class="ep-num">Ep. {ep.episode}</span>
          <span class="ep-title">{ep.name}</span>
        </button>
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .episodes-list-split {
    display: flex;
    width: 100%;
    height: 250px;
    margin-top: 15px;
    box-sizing: border-box;
  }

  .seasons-column {
    width: calc(50% - 8px);
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding-right: 5px;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .episodes-column {
    width: calc(50% - 8px);
    margin-left: 16px;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding-right: 5px;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .season-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    text-align: left;
    box-sizing: border-box;
    margin-bottom: 8px;

    .season-name {
      font-weight: 750;
      font-size: 14px;
      color: #94a3b8;
    }

    .episodes-badge {
      font-size: 10px;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(14, 165, 233, 0.1);
      padding: 3px 8px;
      border-radius: 20px;
      border: 1px solid rgba(14, 165, 233, 0.2);
    }

    &.active {
      background: rgba(14, 165, 233, 0.08);
      border-color: rgba(14, 165, 233, 0.3);
      
      .season-name {
        color: #e2e8f0;
      }
    }

    &:global(.focused) {
      background: rgba(14, 165, 233, 0.15) !important;
      border-color: #38bdf8 !important;

      .season-name {
        color: #ffffff !important;
      }
      .episodes-badge {
        color: #ffffff !important;
        background: rgba(14, 165, 233, 0.3) !important;
        border-color: rgba(14, 165, 233, 0.5) !important;
      }
    }
  }

  .episode-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 10px 14px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    text-align: left;
    box-sizing: border-box;
    margin-bottom: 8px;

    .play-icon {
      width: 12px;
      height: 12px;
      fill: currentColor;
      color: #38bdf8;
      margin-right: 10px;
      flex-shrink: 0;
    }

    .ep-num {
      font-weight: 750;
      font-size: 13px;
      color: #f1f5f9;
      margin-right: 8px;
      flex-shrink: 0;
    }

    .ep-title {
      font-size: 12px;
      font-weight: 300;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:global(.focused) {
      background: rgba(14, 165, 233, 0.15) !important;
      border-color: #38bdf8 !important;

      .play-icon {
        color: #38bdf8 !important;
      }
      .ep-num {
        color: #ffffff !important;
      }
      .ep-title {
        color: #e2e8f0 !important;
      }
    }
  }
</style>
