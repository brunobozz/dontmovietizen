<script>
  import { onMount } from "svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Dashboard from "./pages/Dashboard.svelte";
  import Movies from "./pages/Movies.svelte";
  import TvShows from "./pages/TvShows.svelte";
  import Settings from "./pages/Settings.svelte";
  import { handleNavigation } from "./services/navigation.js";

  // Mapeamento de rotas/telas do app
  const routes = {
    dashboard: Dashboard,
    movies: Movies,
    tvshows: TvShows,
    settings: Settings,
  };

  let currentRoute = "dashboard";

  function handleHashChange() {
    const hash = window.location.hash.slice(1) || "dashboard";
    if (routes[hash]) {
      currentRoute = hash;
    } else {
      currentRoute = "dashboard";
    }
  }

  onMount(() => {
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Executa na inicialização do app

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  });
</script>

<!-- Captura as teclas direcionais de forma global no app -->
<svelte:window on:keydown={(e) => handleNavigation(e.keyCode, e)} />

<div class="flex flex-row w-screen h-screen overflow-hidden">
  <Sidebar />
  <div class="flex-grow h-full overflow-hidden">
    <!-- Renderiza dinamicamente a tela ativa -->
    <svelte:component this={routes[currentRoute]} />
  </div>
</div>
