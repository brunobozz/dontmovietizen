<script>
  import Card from '../components/Card.svelte';

  const movies = [
    { title: "Inception", icon: "🌌", focusClass: "focused:bg-gradient-sky focused:shadow-sky" },
    { title: "The Dark Knight", icon: "🦇", focusClass: "focused:bg-slate-800 focused:shadow-white" },
    { title: "Interstellar", icon: "🚀", focusClass: "focused:bg-gradient-violet focused:shadow-violet" },
    { title: "The Matrix", icon: "🟢", focusClass: "focused:bg-slate-700 focused:shadow-white" },
    { title: "Avatar", icon: "🦕", focusClass: "focused:bg-sky-500 focused:shadow-sky" },
    { title: "Gladiator", icon: "⚔️", focusClass: "focused:bg-amber-500 focused:shadow-amber" },
  ];
</script>

<div class="app-container flex flex-col justify-between">
  <header class="app-header">
    <h1 class="app-title text-3xl font-extrabold mb-2">Movies / Filmes</h1>
    <p class="app-subtitle text-sm text-slate-400 font-light">Seção de Filmes do Don't Movie</p>
  </header>

  <main class="grid grid-cols-6 gap-10 my-10">
    {#each movies as movie}
      <Card
        title={movie.title}
        icon={movie.icon}
        focusClass={movie.focusClass}
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
