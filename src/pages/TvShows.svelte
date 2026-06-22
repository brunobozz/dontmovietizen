<script>
  import Card from '../components/Card.svelte';

  const tvshows = [
    { title: "Breaking Bad", icon: "🧪", focusClass: "focused:bg-gradient-sky focused:shadow-sky" },
    { title: "Stranger Things", icon: "🐙", focusClass: "focused:bg-gradient-violet focused:shadow-violet" },
    { title: "Game of Thrones", icon: "👑", focusClass: "focused:bg-amber-500 focused:shadow-amber" },
    { title: "Chernobyl", icon: "☢️", focusClass: "focused:bg-slate-700 focused:shadow-white" },
    { title: "Rick and Morty", icon: "🪐", focusClass: "focused:bg-sky-500 focused:shadow-sky" },
    { title: "The Boys", icon: "🩸", focusClass: "focused:bg-slate-800 focused:shadow-white" },
  ];
</script>

<div class="app-container flex flex-col justify-between">
  <header class="app-header">
    <h1 class="app-title text-3xl font-extrabold mb-2">Tv Shows / Séries</h1>
    <p class="app-subtitle text-sm text-slate-400 font-light">Seção de Séries do Don't Movie</p>
  </header>

  <main class="grid grid-cols-6 gap-10 my-10">
    {#each tvshows as show}
      <Card
        title={show.title}
        icon={show.icon}
        focusClass={show.focusClass}
      />
    {/each}
  </main>

  <footer class="app-footer w-full flex justify-between items-center py-6">
    <div class="status-bar flex gap-10 text-sm text-slate-400">
      <span>Pressione <span class="key-badge">ENTER</span> para selecionar</span>
      <span>Pressione <span class="key-badge">RETURN/BACK</span> para voltar</span>
    </div>
  </footer>
</div>
