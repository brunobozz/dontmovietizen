<script>
  import { onMount } from "svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Dashboard from "./pages/Dashboard.svelte";
  import Movies from "./pages/Movies.svelte";
  import TvShows from "./pages/TvShows.svelte";
  import Search from "./pages/Search.svelte";
  import Settings from "./pages/Settings.svelte";
  import { handleNavigation, focusElementByDataAttribute } from "./services/navigation.js";

  // Mapeamento de rotas/telas do app
  const routes = {
    search: Search,
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
    // Força iniciar na rota home (dashboard)
    window.location.hash = "dashboard";

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Executa na inicialização do app

    // Define o foco inicial no botão Home da sidebar
    setTimeout(() => {
      focusElementByDataAttribute("data-hash", "dashboard");
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
  <div class="flex-grow h-full overflow-hidden">
    <!-- Renderiza dinamicamente a tela ativa -->
    <svelte:component this={routes[currentRoute]} />
  </div>
</div>
