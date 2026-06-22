<script>
  import { onMount } from "svelte";
  import { focusable } from "../services/navigation.js";
  import { mdiPlus, mdiTrashCan } from "@mdi/js";
  import { parseM3uAndSave } from "../services/m3uParser.js";
  import { deleteListItems } from "../services/db.js";

  let lists = [];
  let showForm = false;
  let newUrl = "";

  let isProcessing = false;
  let progressText = "";
  let progressValue = 0;

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

  async function addList() {
    const url = newUrl.trim();
    if (!url) {
      alert("Por favor, insira uma URL válida.");
      return;
    }

    if (lists.some(l => l.url === url)) {
      alert("Esta lista já está cadastrada.");
      return;
    }

    isProcessing = true;
    progressValue = 0;
    progressText = "Conectando ao servidor da lista...";

    try {
      // 1. Download
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao acessar a lista: Código HTTP ${response.status}`);
      }

      progressText = "Baixando dados...";
      progressValue = 10;
      const rawText = await response.text();

      if (!rawText.includes("#EXTM3U")) {
        throw new Error("Formato inválido. O arquivo de lista deve começar com '#EXTM3U'");
      }

      // 2. Parse and Save to IndexedDB
      progressText = "Processando e organizando canais...";
      progressValue = 25;

      const itemsSaved = await parseM3uAndSave(url, rawText, (percentage) => {
        progressValue = percentage;
        progressText = `Processando e Salvando (${percentage}%)...`;
      });

      // 3. Persist M3U registration list in storage
      lists = [...lists, { url }];
      saveLists();

      alert(`Lista adicionada com sucesso!\n${itemsSaved} itens estruturados em Live TV, Filmes e Séries.`);
      newUrl = "";
      showForm = false;
    } catch (e) {
      console.error(e);
      let errorMsg = e.message || "Erro desconhecido.";
      if (errorMsg.includes("Failed to fetch")) {
        errorMsg = "Erro de conexão ou bloqueio de CORS. Certifique-se de que a URL é HTTPS e permite requisições públicas.";
      }
      alert(`Erro ao salvar lista:\n${errorMsg}`);
    } finally {
      isProcessing = false;
      progressValue = 0;
      progressText = "";
    }
  }

  async function removeList(index) {
    const list = lists[index];
    if (confirm("Deseja realmente excluir esta lista e todos os seus canais do sistema?")) {
      isProcessing = true;
      progressValue = 50;
      progressText = "Excluindo itens do banco de dados...";

      try {
        await deleteListItems(list.url);
        lists = lists.filter((_, idx) => idx !== index);
        saveLists();
        progressValue = 100;
      } catch (e) {
        console.error(e);
        alert("Erro ao remover lista do banco de dados.");
      } finally {
        isProcessing = false;
        progressValue = 0;
        progressText = "";
      }
    }
  }
</script>

<!-- M3U Lists Manager Section -->
<section class="m3u-section flex flex-col gap-6">
  <h2 class="text-xl font-bold text-white">M3U Lists</h2>

  {#if isProcessing}
    <!-- Processing/Progress Card (TV Premium UI) -->
    <div class="p-8 bg-slate-900/60 border border-glass-border rounded-2xl flex flex-col gap-6 animate-pulse">
      <div class="flex justify-between items-center">
        <span class="text-base font-semibold text-white">{progressText}</span>
        <span class="text-sm text-sky-400 font-bold">{progressValue}%</span>
      </div>
      <div class="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
        <div 
          class="bg-gradient-sky h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.6)]" 
          style="width: {progressValue}%"
        ></div>
      </div>
    </div>
  {:else}
    <!-- Lists Content -->
    <div class="flex flex-col gap-4">
      {#if lists.length === 0}
        <div class="text-slate-500 text-sm font-light text-center py-6">
          Nenhuma lista M3U cadastrada.
        </div>
      {:else}
        {#each lists as list, index}
          <div
            use:focusable
            class="list-item-row focusable flex justify-between items-center p-4 bg-glass border-2 border-transparent rounded-xl"
            on:click={() => removeList(index)}
          >
            <div class="flex flex-col gap-1">
              <span class="text-base font-semibold text-white break-all">{list.url}</span>
            </div>
            <div class="flex gap-4">
              <div
                class="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/60 text-rose-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  class="w-6 h-6 fill-current"
                  ><path d={mdiTrashCan} /></svg
                >
              </div>
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
  {/if}
</section>

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

  .list-item-row {
    border: 2px solid transparent;

    &:global(.focused) {
      background-color: rgba(255, 255, 255, 0.08) !important;
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
