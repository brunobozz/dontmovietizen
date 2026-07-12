<script>
  import { onMount, onDestroy } from "svelte";
  import { focusable, focusModal } from "../services/navigation.js";
  import { mdiMovie, mdiFilmstrip, mdiTelevision, mdiPlay, mdiArrowLeft, mdiStar, mdiStarOutline } from "@mdi/js";
  import EpisodesList from "./EpisodesList.svelte";
  import SkeletonEpisodes from "./SkeletonEpisodes.svelte";
  import { favoritesStore, addFavorite, removeFavorite, isFavorited } from "../services/favorites.js";

  export let item;
  export let onClose;
  export let onPlay;

  // Extract year from title if present
  const yearMatch = item.name.match(/\b(19\d\d|20\d\d)\b/);
  const year = yearMatch ? yearMatch[1] : "N/A";

  // Clean the title by removing trailing years (e.g. "(2020)" or "2019")
  const cleanName = item.name.replace(/\s*[([{\s-]*\b(19\d\d|20\d\d)\b[)\]}\s-]*/g, "").trim();

  // Determine media type properties
  function getMediaTypeInfo(type) {
    switch (type) {
      case "movie":
        return { label: "Filme", icon: mdiMovie };
      case "series":
        return { label: "Série", icon: mdiFilmstrip };
      default:
        return { label: "TV ao Vivo", icon: mdiTelevision };
    }
  }

  $: typeInfo = getMediaTypeInfo(item.type);

  // Favorite State and Toggle
  let isItemFav = false;
  $: isItemFav = isFavorited(item.url, $favoritesStore);

  function toggleFavorite() {
    if (isItemFav) {
      removeFavorite(item.url);
    } else {
      addFavorite(item);
    }
  }

  // Series Season & Episode State Grouping
  let activeSeason = null;
  $: seasonsList = item.seasons
    ? Object.keys(item.seasons).sort((a, b) => {
        if (a === "Especiais") return 1;
        if (b === "Especiais") return -1;
        return Number(a) - Number(b);
      })
    : [];
  $: if (!activeSeason && seasonsList.length > 0) {
    activeSeason = seasonsList[0];
  }



  function playEpisode(ep) {
    // Inject the selected episode details into the item dynamically
    item.url = ep.url;
    item.currentEpisodeName = activeSeason === "Especiais"
      ? `${cleanName} - Ep ${ep.episode} (Especiais)`
      : `${cleanName} - Temp ${activeSeason} Ep ${ep.episode}`;
    onPlay();
  }

  // Close modal on escape/back window event
  function handleCloseEvent() {
    onClose();
  }

  let isLoadingEpisodes = false;


  function getActiveSyncCode() {
    try {
      const saved = localStorage.getItem("m3u_lists");
      if (saved) {
        const lists = JSON.parse(saved);
        const active = lists.find(l => l.isSyncCode);
        return active ? active.code : null;
      }
    } catch (e) {}
    return null;
  }

  onMount(async () => {
    window.addEventListener("close-modal", handleCloseEvent);

    if (item.type === "series" && (!item.seasons || Object.keys(item.seasons).length === 0)) {
      isLoadingEpisodes = true;
      try {
        const code = getActiveSyncCode();
        if (code) {
          const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
          const base = isLocal ? "http://localhost:3000" : "https://dontmovie-react.vercel.app";
          const res = await fetch(`${base}/api/series?code=${code}&name=${encodeURIComponent(item.name)}`);
          if (res.ok) {
            const resData = await res.json();
            if (resData.status === "success" && resData.seasons) {
              item.seasons = resData.seasons;
              if (Object.keys(resData.seasons).length > 0) {
                const sortedKeys = Object.keys(resData.seasons).sort((a, b) => Number(a) - Number(b));
                activeSeason = sortedKeys[0];
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading on-demand series episodes:", err);
      } finally {
        isLoadingEpisodes = false;
        setTimeout(() => {
          focusModal();
        }, 80);
      }
    } else if (item.type === "series") {
      setTimeout(() => {
        focusModal();
      }, 80);
    }
  });

  onDestroy(() => {
    window.removeEventListener("close-modal", handleCloseEvent);
  });
</script>

<div class="media-details-modal modal-container">
  <div class="details-content">
    <!-- Left Side: Large Poster -->
    <div class="poster-container">
      {#if item.logo}
        <img
          src={item.logo}
          alt={item.name}
          class="poster-image"
        />
      {:else}
        <!-- Fallback icon -->
        <div class="poster-fallback">
          <svg viewBox="0 0 24 24" class="fallback-svg">
            <path d={typeInfo.icon} />
          </svg>
        </div>
      {/if}
    </div>

    <!-- Right Side: Details Info -->
    <div class="info-container">
      <!-- Title -->
      <h2 class="info-title">
        {cleanName}
      </h2>

      <!-- Badges Row -->
      <div class="info-badges">
        <!-- Media Type -->
        <span class="badge badge-type {item.type}">
          {typeInfo.label}
        </span>

        <!-- Year Badge -->
        {#if year !== "N/A"}
          <span class="badge badge-year">
            {year}
          </span>
        {/if}

        <!-- Category/Genre -->
        <span class="info-category">
          {item.category || "Sem Categoria"}
        </span>
      </div>

      <!-- Description/Synopsis -->
      <p class="info-description">
        Este título está disponível para reprodução instantânea em sua lista de reprodução IPTV. 
        Aproveite a transmissão com áudio e vídeo de alta fidelidade diretamente em sua Smart TV. 
        Use as teclas direcionais do controle para navegar.
      </p>

      {#if item.type === "series"}
        <!-- Favorite button above Seasons (loaded dynamically once loading completes) -->
        {#if !isLoadingEpisodes && item.seasons && Object.keys(item.seasons).length > 0}
          <div class="flex items-center mb-4">
            <button
              use:focusable
              class="focusable btn-fav-star mr-3 flex items-center justify-center p-2 rounded-xl transition-all duration-300"
              on:click={toggleFavorite}
            >
              <svg viewBox="0 0 24 24" class="w-7 h-7 {isItemFav ? 'fill-yellow-500 text-yellow-500' : 'fill-current text-slate-400'}">
                <path d={isItemFav ? mdiStar : mdiStarOutline} />
              </svg>
            </button>
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {isItemFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
            </span>
          </div>
        {/if}

        <!-- Seasons 50/50 generic list -->
        {#if isLoadingEpisodes}
          <SkeletonEpisodes />
        {:else if !item.seasons || Object.keys(item.seasons).length === 0}
          <div style="padding: 40px 0; text-align: center; width: 100%;">
            <span style="font-size: 14px; font-weight: 500; color: #64748b;">Nenhum episódio disponível para esta série.</span>
          </div>
        {:else}
          <EpisodesList
            seasons={item.seasons}
            bind:activeSeason
            playEpisode={playEpisode}
          />
        {/if}
      {:else}
        <!-- Action Buttons for Movies/Live TV -->
        <div class="info-actions flex items-center">
          <!-- Favorite Button (Star) -->
          <button
            use:focusable
            class="focusable btn-fav-star mr-4 flex items-center justify-center p-2 rounded-xl transition-all duration-300"
            on:click={toggleFavorite}
          >
            <svg viewBox="0 0 24 24" class="w-8 h-8 {isItemFav ? 'fill-yellow-500 text-yellow-500' : 'fill-current text-slate-400'}">
              <path d={isItemFav ? mdiStar : mdiStarOutline} />
            </svg>
          </button>

          <!-- Play Button -->
          <button
            use:focusable
            class="focusable btn-play"
            on:click={onPlay}
          >
            <svg viewBox="0 0 24 24" class="btn-icon"><path d={mdiPlay} /></svg>
            <span>{item.type === 'live' ? 'Reproduzir Canal' : 'Reproduzir Filme'}</span>
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .media-details-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    background-color: #07080d;
    background: radial-gradient(circle at center, rgba(15, 23, 42, 0.98) 0%, rgba(7, 8, 13, 1) 100%);
    box-sizing: border-box;
    padding: 60px;
    
    /* Centering content using standard Flexbox */
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .details-content {
    display: flex;
    flex-direction: row;
    width: 100%;
    max-w: 1000px;
    align-items: center;
    justify-content: center;
  }

  .poster-container {
    width: 320px;
    height: 480px;
    border-radius: 24px;
    overflow: hidden;
    background-color: #020617;
    border: 4px solid #1e293b;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    flex-shrink: 0;
    margin-right: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .poster-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .poster-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fallback-svg {
    width: 80px;
    height: 80px;
    fill: #334155;
  }

  .info-container {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    text-align: left;
  }

  .info-category {
    color: #0ea5e9;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .info-title {
    color: #ffffff;
    font-size: 44px;
    font-weight: 800;
    line-height: 1.2;
    margin: 0 0 16px 0;
  }

  .info-badges {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 24px;
  }

  .badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    border: 1px solid transparent;
    padding: 4px 10px;
    border-radius: 6px;
    margin-right: 12px;
  }

  .badge-type {
    &.movie {
      background-color: rgba(225, 29, 72, 0.15);
      color: #fb7185;
      border-color: rgba(225, 29, 72, 0.3);
    }
    &.series {
      background-color: rgba(79, 70, 229, 0.15);
      color: #818cf8;
      border-color: rgba(79, 70, 229, 0.3);
    }
    &.live {
      background-color: rgba(14, 165, 233, 0.15);
      color: #38bdf8;
      border-color: rgba(14, 165, 233, 0.3);
    }
  }

  .badge-year {
    color: #cbd5e1;
    border-color: #334155;
    background-color: rgba(30, 41, 59, 0.4);
  }

  .info-description {
    color: #94a3b8;
    font-size: 15px;
    font-weight: 300;
    line-height: 1.6;
    max-width: 550px;
    margin: 0 0 20px 0;
  }

  .info-actions {
    display: flex;
    flex-direction: row;
  }

  .btn-play, .btn-back {
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    padding: 14px 28px;
    border: 2px solid transparent;
    cursor: pointer;
    outline: none;
    margin-right: 16px;
  }

  .btn-fav-star {
    background-color: transparent;
    border: 2px solid transparent;
    outline: none;
    cursor: pointer;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:global(.focused) {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
    }
  }

  .btn-icon {
    width: 20px;
    height: 20px;
    fill: currentColor;
    margin-right: 8px;
  }

  .btn-play {
    background-color: #0ea5e9;
    color: #ffffff;

    &:global(.focused) {
      background-color: #0284c7;
      border-color: #38bdf8;
      box-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
      transform: scale(1.05);
    }
  }

  .btn-back {
    background-color: #1e293b;
    color: #cbd5e1;

    &:global(.focused) {
      background-color: #334155;
      border-color: #64748b;
      color: #ffffff;
      transform: scale(1.05);
    }
  }

  /* Scale layout natively for 1080p screens (TVs) to look proportional like PC screens */
  @media (min-width: 1900px) {
    .details-content {
      max-width: 1400px;
    }

    .poster-container {
      width: 440px;
      height: 660px;
      margin-right: 80px;
      border-width: 6px;
    }

    .fallback-svg {
      width: 110px;
      height: 110px;
    }

    .info-category {
      font-size: 18px;
    }

    .info-title {
      font-size: 60px;
      margin-bottom: 24px;
    }

    .info-badges {
      margin-bottom: 32px;
    }

    .badge {
      font-size: 15px;
      padding: 6px 14px;
      border-radius: 8px;
      margin-right: 16px;
    }

    .info-description {
      font-size: 20px;
      max-width: 740px;
      margin-bottom: 20px;
    }

    .btn-play, .btn-back {
      font-size: 20px;
      border-radius: 16px;
      padding: 18px 36px;
      margin-right: 24px;
    }

    .btn-icon {
      width: 26px;
      height: 26px;
      margin-right: 12px;
    }

    .seasons-accordion {
      max-height: 480px;
    }

    .season-header-btn {
      font-size: 20px;
      padding: 20px 28px;
      border-radius: 16px;
    }

    .episodes-container {
      padding: 18px;
      border-radius: 16px;
    }

    .episode-item {
      font-size: 18px;
      padding: 16px 24px;
      margin-bottom: 12px;
      border-radius: 12px;
    }
  }

  .seasons-accordion {
    max-height: 300px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  .season-header-btn {
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:global(.focused) {
      border-color: #38bdf8 !important;
      background-color: rgba(255, 255, 255, 0.08) !important;
      transform: scale(1.02);
    }
  }

  .episodes-container {
    overflow-y: visible;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background-color: rgba(15, 23, 42, 0.4);
    padding: 12px;
    border-radius: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  .episode-item {
    background-color: rgba(255, 255, 255, 0.02);
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:global(.focused) {
      background-color: rgba(255, 255, 255, 0.08);
      border-color: #38bdf8 !important;
      transform: scale(1.01);
    }
  }
</style>
