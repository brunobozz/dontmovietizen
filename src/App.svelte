<script>
  import { onMount } from "svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Dashboard from "./pages/Dashboard.svelte";
  import Movies from "./pages/Movies.svelte";
  import TvShows from "./pages/TvShows.svelte";
  import LiveTv from "./pages/LiveTv.svelte";
  import LiveCategory from "./pages/LiveCategory.svelte";
  import Search from "./pages/Search.svelte";
  import Settings from "./pages/Settings.svelte";
  import Category from "./pages/Category.svelte";
  import { handleNavigation, focusElementByDataAttribute } from "./services/navigation.js";
  import { fileExists, deleteFile } from "./services/storage.js";

  // Mapeamento de rotas/telas do app
  const routes = {
    search: Search,
    dashboard: Dashboard,
    movies: Movies,
    tvshows: TvShows,
    live: LiveTv,
    "live-category": LiveCategory,
    category: Category,
    settings: Settings,
  };

  let currentRoute = "dashboard";
  let routeParams = {};

  function handleHashChange() {
    const fullHash = window.location.hash.slice(1) || "dashboard";
    const [route, queryString] = fullHash.split("?");

    const params = {};
    if (queryString) {
      queryString.split("&").forEach((part) => {
        const [key, val] = part.split("=");
        if (key) {
          params[key] = decodeURIComponent(val || "");
        }
      });
    }

    routeParams = params;

    if (routes[route]) {
      currentRoute = route;
    } else {
      currentRoute = "dashboard";
    }
  }

  async function checkPlaylistOnStartup() {
    try {
      const saved = localStorage.getItem("m3u_lists");
      const lists = saved ? JSON.parse(saved) : [];
      
      const hasFiles = await fileExists("movies.txt") || await fileExists("series.json") || await fileExists("live.json");
      
      if (lists.length === 0 || !hasFiles) {
        console.log("No playlists or database files found. Redirecting to settings...");
        window.location.hash = "settings";
        setTimeout(() => {
          focusElementByDataAttribute("data-hash", "settings");
        }, 150);
      }
    } catch (e) {
      console.error("Error checking playlist on startup:", e);
    }
  }

  onMount(() => {
    // Força iniciar na rota home (dashboard)
    window.location.hash = "dashboard";

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Executa na inicialização do app

    // Check if playlist exists on startup
    checkPlaylistOnStartup();

    // Define o foco inicial no botão Home da sidebar se não for redirecionado
    setTimeout(() => {
      if (window.location.hash === "#dashboard") {
        focusElementByDataAttribute("data-hash", "dashboard");
      }
    }, 50);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  });
</script>

<!-- Captura as teclas direcionais de forma global no app -->
<svelte:window on:keydown={(e) => handleNavigation(e.keyCode, e)} />

<div class="flex flex-row w-screen h-screen overflow-hidden">
  <Sidebar />
  <div class="flex-grow h-full overflow-hidden relative">
    <div class="page-container {currentRoute === 'search' ? '' : 'hidden'}" data-page-id="search">
      <Search params={routeParams} />
    </div>
    <div class="page-container {currentRoute === 'dashboard' ? '' : 'hidden'}" data-page-id="dashboard">
      <Dashboard params={routeParams} />
    </div>
    <div class="page-container {currentRoute === 'movies' ? '' : 'hidden'}" data-page-id="movies">
      <Movies params={routeParams} />
    </div>
    <div class="page-container {currentRoute === 'tvshows' ? '' : 'hidden'}" data-page-id="tvshows">
      <TvShows params={routeParams} />
    </div>
    <div class="page-container {currentRoute === 'live' ? '' : 'hidden'}" data-page-id="live">
      <LiveTv params={routeParams} />
    </div>
    <div class="page-container {currentRoute === 'live-category' ? '' : 'hidden'}" data-page-id="live-category">
      <LiveCategory params={routeParams} />
    </div>
    <div class="page-container {currentRoute === 'settings' ? '' : 'hidden'}" data-page-id="settings">
      <Settings params={routeParams} />
    </div>
    <div class="page-container {currentRoute === 'category' ? '' : 'hidden'}" data-page-id="category">
      <Category params={routeParams} />
    </div>
  </div>
</div>

<style>
  .page-container {
    width: 100%;
    height: 100%;
  }
  .page-container.hidden {
    display: none !important;
  }
</style>
