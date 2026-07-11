<script>
  import { onMount, tick } from "svelte";
  import Header from "../components/Header.svelte";
  import ChannelsList from "../components/ChannelsList.svelte";
  import PlayerStream from "../components/PlayerStream.svelte";
  import MediaDetails from "../components/MediaDetails.svelte";
  import { mdiTelevision, mdiArrowLeft } from "@mdi/js";
  import { readFile, fileExists } from "../services/storage.js";
  import { focusable, focusModal } from "../services/navigation.js";

  export let params = {};

  $: categoryName = params.name || "";

  let channels = [];
  let isLoading = true;

  let selectedChannel = null;
  let showPlayer = false;
  let showDetails = false;

  async function loadChannels() {
    isLoading = true;
    try {
      if (categoryName && await fileExists("live.json")) {
        const jsonText = await readFile("live.json");
        const data = JSON.parse(jsonText);
        channels = data[categoryName] || [];
      } else {
        channels = [];
      }
    } catch (e) {
      console.error("Failed to load channels for category:", e);
    } finally {
      isLoading = false;
    }
  }

  // Reactively reload channels if name changes
  $: {
    if (categoryName) {
      loadChannels();
    }
  }

  function handleSelectChannel(event) {
    selectedChannel = event.detail;
    // Standardize object for PlayerStream
    selectedChannel.type = "live";
    showDetails = true;
  }

  function handleCloseDetails() {
    showDetails = false;
    selectedChannel = null;
  }

  function handlePlayChannel() {
    saveFocus();
    showPlayer = true;
  }

  function handleClosePlayer() {
    showPlayer = false;
    setTimeout(() => {
      restoreFocus();
    }, 50);
  }

  function handleGoBack() {
    window.location.hash = "live";
  }
</script>

<div class="app-container w-full h-full flex flex-col select-none" style="padding: 40px;">
  <div class="flex justify-between items-center mb-6">
    <Header title={categoryName || "Canais"} icon={mdiTelevision} />
    
    <button
      use:focusable
      class="focusable btn-back-header flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
      on:click={handleGoBack}
    >
      <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current mr-2"><path d={mdiArrowLeft} /></svg>
      <span>Categorias</span>
    </button>
  </div>

  {#if isLoading}
    <div class="flex-grow flex items-center justify-center">
      <span class="text-slate-400 animate-pulse text-base font-semibold">Carregando canais...</span>
    </div>
  {:else}
    <div class="flex-grow">
      <ChannelsList {channels} on:selectChannel={handleSelectChannel} />
    </div>
  {/if}
</div>

{#if showDetails && selectedChannel}
  <MediaDetails 
    item={selectedChannel} 
    onClose={handleCloseDetails} 
    onPlay={handlePlayChannel}
  />
{/if}

{#if showPlayer && selectedChannel}
  <PlayerStream item={selectedChannel} onClose={handleClosePlayer} />
{/if}

<style lang="scss">
  .app-container {
    box-sizing: border-box;
  }

  .btn-back-header {
    background-color: #1e293b;
    color: #cbd5e1;
    border: 2px solid transparent;

    &:global(.focused) {
      background-color: #334155;
      border-color: #64748b;
      color: #ffffff;
      transform: scale(1.05);
    }
  }
</style>
