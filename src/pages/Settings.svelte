<script>
  import { onMount } from "svelte";
  import Header from "../components/Header.svelte";
  import { focusable } from "../services/navigation.js";
  import { mdiPlus, mdiTrashCan, mdiPlay, mdiCog } from "@mdi/js";

  let lists = [];
  let showForm = false;
  let newUrl = "";

  // Load lists on mount from localStorage
  onMount(() => {
    const saved = localStorage.getItem("m3u_lists");
    if (saved) {
      try {
        lists = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  });

  function saveLists() {
    localStorage.setItem("m3u_lists", JSON.stringify(lists));
  }

  function addList() {
    if (!newUrl.trim()) {
      alert("Por favor, insira uma URL válida.");
      return;
    }

    let name = "Lista #" + (lists.length + 1);
    try {
      const urlObj = new URL(newUrl);
      name = urlObj.hostname;
    } catch (e) {}

    lists = [...lists, { name, url: newUrl }];
    saveLists();
    newUrl = "";
    showForm = false;
  }

  function removeList(index) {
    lists = lists.filter((_, idx) => idx !== index);
    saveLists();
  }
</script>

<div class="app-container overflow-y-auto flex flex-col gap-8">
  <Header title="Settings" icon={mdiCog} />

  <!-- M3U Lists Manager Section -->
  <section class="m3u-section flex flex-col gap-6">
    <h2 class="text-xl font-bold text-white">M3U Lists</h2>

    <!-- Lists Content -->
    <div class="flex flex-col gap-4">
      {#if lists.length === 0}
        <div class="text-slate-500 text-sm font-light text-center py-6">
          Nenhuma lista M3U cadastrada.
        </div>
      {:else}
        {#each lists as list, index}
          <div
            class="list-item flex justify-between items-center p-4 bg-slate-950 border border-glass rounded-xl"
          >
            <div class="flex flex-col gap-1">
              <span class="text-base font-semibold text-white">{list.name}</span
              >
              <span class="text-xs text-slate-500 font-light">{list.url}</span>
            </div>
            <div class="flex gap-4">
              <button
                use:focusable
                class="btn-action focusable flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 transition-all duration-300"
                on:click={() => alert("Abrindo lista: " + list.name)}
              >
                <svg
                  viewBox="0 0 24 24"
                  class="w-6 h-6 fill-current text-sky-400"
                  ><path d={mdiPlay} /></svg
                >
              </button>
              <button
                use:focusable
                class="btn-danger-action focusable flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 transition-all duration-300"
                on:click={() => removeList(index)}
              >
                <svg
                  viewBox="0 0 24 24"
                  class="w-6 h-6 fill-current text-rose-400"
                  ><path d={mdiTrashCan} /></svg
                >
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Add List Form -->
    {#if showForm}
      <div class="form-container flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label for="list-url" class="text-sm font-semibold text-slate-300"
            >URL da Lista (M3U)</label
          >
          <input
            id="list-url"
            use:focusable
            type="text"
            placeholder="http://exemplo.com/lista.m3u"
            bind:value={newUrl}
            class="input-field focusable px-6 py-4 bg-slate-800 border-glass rounded-xl text-base text-white w-full outline-none"
          />
        </div>
        <div class="flex gap-4 mt-2">
          <button
            use:focusable
            class="btn-success focusable px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300"
            on:click={addList}
          >
            Salvar
          </button>
          <button
            use:focusable
            class="btn-cancel focusable px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300"
            on:click={() => {
              showForm = false;
              newUrl = "";
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    {/if}

    <div class="flex justify-end mt-4">
      {#if !showForm}
        <button
          use:focusable
          class="btn-primary focusable flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300"
          on:click={() => (showForm = true)}
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current"
            ><path d={mdiPlus} /></svg
          >
          <span class="text-nowrap">Adicionar Lista</span>
        </button>
      {/if}
    </div>
  </section>
</div>

<style lang="scss">
  .btn-primary {
    background-color: #0ea5e9;
    color: #ffffff;
    border: 2px solid transparent;

    &:global(.focused) {
      background-color: #0284c7;
      border-color: #38bdf8;
      box-shadow: 0 0 15px rgba(14, 165, 233, 0.4);
      transform: scale(1.05);
    }
  }

  .btn-success {
    background-color: #10b981;
    color: #ffffff;
    border: 2px solid transparent;

    &:global(.focused) {
      background-color: #059669;
      border-color: #34d399;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
      transform: scale(1.05);
    }
  }

  .btn-cancel {
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

  .btn-action,
  .btn-danger-action {
    border: 2px solid transparent;

    &:global(.focused) {
      background-color: #334155;
      border-color: #64748b;
      transform: scale(1.1);
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.15);
    }
  }

  .input-field {
    border: 2px solid var(--glass-border);
    transition: all 0.3s ease;

    &:global(.focused) {
      border-color: #38bdf8;
      background: #1e293b !important;
      box-shadow: 0 0 15px rgba(14, 165, 233, 0.3);
    }
  }
</style>
