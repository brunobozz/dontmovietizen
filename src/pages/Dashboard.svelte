<script>
  import Card from "../components/Card.svelte";
  import { mdiMovie, mdiTelevision } from "@mdi/js";

  const items = [
    {
      title: "Movies",
      icon: mdiMovie,
      focusClass: "focused:bg-gradient-sky focused:shadow-sky",
      page: "movies",
    },
    {
      title: "Tv Shows",
      icon: mdiTelevision,
      focusClass: "focused:bg-gradient-violet focused:shadow-violet",
      page: "tvshows",
    },
  ];
</script>

<div class="app-container flex flex-col justify-between">
  <header class="app-header">
    <h1 class="app-title text-3xl font-extrabold mb-2">Tizen Smart TV Hub</h1>
    <p class="app-subtitle text-sm text-slate-400 font-light">
      Navegue com as setas do controle remoto
    </p>
  </header>

  <main class="grid grid-cols-4 gap-10 my-10">
    {#each items as item}
      <Card
        title={item.title}
        icon={item.icon}
        focusClass={item.focusClass}
        on:click={() => (window.location.hash = item.page)}
      />
    {/each}
  </main>

  <footer class="app-footer w-full flex justify-between items-center py-6">
    <div class="status-bar flex gap-10 text-sm text-slate-400">
      <span>Pressione <span class="key-badge">ENTER</span> para selecionar</span>
      <span>Pressione <span class="key-badge">RETURN/BACK</span> para sair</span>
    </div>
  </footer>
</div>
