<script>
  import Card from '../components/Card.svelte';
  import { exitApp } from '../services/navigation.js';
  import { mdiInformation, mdiPower, mdiRefresh } from '@mdi/js';

  function handleReset() {
    alert("Configurações limpas com sucesso!");
  }
</script>

<div class="app-container flex flex-col justify-between">
  <header class="app-header">
    <h1 class="app-title text-3xl font-extrabold mb-2">Settings / Configurações</h1>
    <p class="app-subtitle text-sm text-slate-400 font-light">Gerencie os ajustes do Don't Movie e do dispositivo</p>
  </header>

  <main class="grid grid-cols-4 gap-10 my-10">
    <Card
      title="Informações do Sistema"
      icon={mdiInformation}
      focusClass="focused:bg-gradient-sky focused:shadow-sky"
      on:click={() => alert("Don't Movie Tizen Edition v1.0.0\nRunning on Tizen OS")}
    />

    <Card
      title="Limpar Cache"
      icon={mdiRefresh}
      focusClass="focused:bg-gradient-violet focused:shadow-violet"
      on:click={handleReset}
    />

    <Card
      title="Fechar Aplicativo"
      icon={mdiPower}
      focusClass="focused:bg-rose-500 focused:shadow-rose"
      on:click={exitApp}
    />
  </main>

  <footer class="app-footer w-full flex justify-between items-center py-6">
    <div class="status-bar flex gap-10 text-sm text-slate-400">
      <span>Pressione <span class="key-badge">ENTER</span> para selecionar</span>
      <span>Pressione <span class="key-badge">RETURN/BACK</span> para voltar</span>
    </div>
  </footer>
</div>
