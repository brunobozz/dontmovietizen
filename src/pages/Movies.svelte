<script>
  import Card from '../components/Card.svelte';
  import { focusIndex } from '../services/navigation.js';
</script>

<div class="app-container flex flex-col justify-between">
  <header class="app-header">
    <h1 class="app-title text-3xl font-extrabold mb-2">Movies / Filmes</h1>
    <p class="app-subtitle text-sm text-slate-400 font-light">Seção de Filmes do Don't Movie</p>
  </header>

  <main class="grid grid-cols-6 gap-10 my-10">
    <Card
      title="Voltar ao Menu"
      icon="⬅️"
      focusClass="focused:bg-slate-800 focused:shadow-white"
      focused={$focusIndex === 0}
      on:click={() => window.location.hash = 'dashboard'}
    />
  </main>

  <footer class="app-footer w-full flex justify-between items-center py-6">
    <div class="status-bar flex gap-10 text-sm text-slate-400">
      <span>Pressione <span class="key-badge">ENTER</span> para voltar</span>
      <span>Pressione <span class="key-badge">RETURN/BACK</span> para voltar</span>
    </div>
  </footer>
</div>
