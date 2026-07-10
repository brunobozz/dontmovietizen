<script>
  import { onMount } from "svelte";
  import { focusable } from "../services/navigation.js";
  import { mdiPlus, mdiTrashCan } from "@mdi/js";
  import { parseM3uAndSave } from "../services/m3uParser.js";
  import { deleteFile, writeFile } from "../services/storage.js";

  let lists = [];
  let showForm = false;
  let showSyncForm = false;
  let newUrl = "http://golx.top/get.php?username=beiraingleses&password=985227073&type=m3u_plus&output=ts";
  let syncCode = "";

  let isProcessing = false;
  let progressText = "";
  let progressValue = 0;

  onMount(() => {
    const saved = localStorage.getItem("m3u_lists");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        lists = parsed.filter(l => l.url !== "./default.json" && l.url !== "default.json");
        if (lists.length !== parsed.length) {
          saveLists();
        }
      } catch (e) {
        console.error(e);
      }
    }
  });

  function saveLists() {
    localStorage.setItem("m3u_lists", JSON.stringify(lists));
  }

  const getApiUrl = (code) => {
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const base = isLocal ? "http://localhost:3000" : "https://dontmovie-react.vercel.app";
    return `${base}/api/sync?code=${code}`;
  };

  async function downloadAndSaveFile(url, filename) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao baixar ${filename} (HTTP ${response.status})`);
    }
    const text = await response.text();
    await writeFile(filename, text);
  }

  async function syncWithCode() {
    const code = syncCode.trim().toUpperCase();
    if (code.length !== 4) {
      alert("O código de sincronização deve conter exatamente 4 caracteres.");
      return;
    }

    if (lists.some(l => l.isSyncCode && l.code === code)) {
      alert("Este código de sincronização já está ativo.");
      return;
    }

    isProcessing = true;
    progressValue = 0;
    progressText = "Conectando ao servidor dontmovie...";

    try {
      progressValue = 10;
      const response = await fetch(getApiUrl(code));
      if (!response.ok) {
        throw new Error("Código de sincronização inválido ou expirado.");
      }
      const data = await response.json();
      if (data.status !== "success") {
        throw new Error(data.message || "Erro retornado pelo servidor.");
      }

      progressValue = 30;
      progressText = "Baixando canais de TV...";
      await downloadAndSaveFile(data.live_url, "live.json");

      progressValue = 65;
      progressText = "Baixando filmes...";
      await downloadAndSaveFile(data.movies_url, "movies.txt");

      progressValue = 85;
      progressText = "Baixando séries...";
      await downloadAndSaveFile(data.series_url, "series.json");

      progressValue = 100;
      progressText = "Sincronização finalizada!";

      // Register sync code list in local lists
      lists = [...lists, {
        url: `Código: ${code}`,
        isSyncCode: true,
        code,
        moviesUrl: data.movies_url,
        liveUrl: data.live_url,
        seriesUrl: data.series_url
      }];
      saveLists();

      alert("Lista sincronizada com sucesso!");
      syncCode = "";
      showSyncForm = false;
    } catch (e) {
      console.error(e);
      alert(`Erro ao sincronizar código:\n${e.message || "Erro de conexão"}`);
    } finally {
      isProcessing = false;
      progressValue = 0;
      progressText = "";
    }
  }

  async function addList() {
    const url = newUrl.trim();
    if (!url) {
      alert("Por favor, insira uma URL válida.");
      return;
    }

    if (lists.some((l) => l.url === url)) {
      alert("Esta lista já está cadastrada.");
      return;
    }

    isProcessing = true;
    progressValue = 0;
    progressText = "Conectando ao servidor da lista...";

    try {
      const result = await parseM3uAndSave(url, (percentage) => {
        progressValue = percentage;
        progressText = `Processando e Salvando (${percentage}%)...`;
      });

      // Persist M3U registration list in storage
      lists = [...lists, { url }];
      saveLists();

      alert(
        `Lista importada com sucesso!\nEstruturados:\n- ${result.movies} Filmes\n- ${result.series} Séries (${result.episodes} Episódios)\n- ${result.live} Canais`
      );
      newUrl = "";
      showForm = false;
    } catch (e) {
      console.error(e);
      let errorMsg = e.message || "Erro desconhecido.";
      if (errorMsg.includes("Failed to fetch")) {
        errorMsg =
          "Erro de conexão ou bloqueio de CORS. Certifique-se de que a URL é HTTPS e permite requisições públicas.";
      }
      alert(`Erro ao salvar lista:\n${errorMsg}`);
    } finally {
      isProcessing = false;
      progressValue = 0;
      progressText = "";
    }
  }

  async function updateList(index) {
    const list = lists[index];
    isProcessing = true;
    progressValue = 0;

    try {
      if (list.isSyncCode) {
        progressText = "Conectando ao servidor dontmovie...";
        progressValue = 10;
        const response = await fetch(getApiUrl(list.code));
        if (!response.ok) {
          throw new Error("Código de sincronização expirado ou inválido.");
        }
        const data = await response.json();
        if (data.status !== "success") {
          throw new Error(data.message || "Erro retornado pelo servidor.");
        }

        progressValue = 30;
        progressText = "Baixando canais de TV...";
        await downloadAndSaveFile(data.live_url, "live.json");

        progressValue = 65;
        progressText = "Baixando filmes...";
        await downloadAndSaveFile(data.movies_url, "movies.txt");

        progressValue = 85;
        progressText = "Baixando séries...";
        await downloadAndSaveFile(data.series_url, "series.json");

        progressValue = 100;
        progressText = "Atualização concluída!";

        lists[index].moviesUrl = data.movies_url;
        lists[index].liveUrl = data.live_url;
        lists[index].seriesUrl = data.series_url;
        saveLists();

        alert("Lista atualizada com sucesso por código!");
      } else {
        progressText = "Conectando ao servidor da lista...";
        const result = await parseM3uAndSave(list.url, (percentage) => {
          progressValue = percentage;
          progressText = `Processando e Salvando (${percentage}%)...`;
        });

        alert(
          `Lista atualizada com sucesso!\nEstruturados:\n- ${result.movies} Filmes\n- ${result.series} Séries (${result.episodes} Episódios)\n- ${result.live} Canais`
        );
      }
    } catch (e) {
      console.error(e);
      let errorMsg = e.message || "Erro desconhecido.";
      if (errorMsg.includes("Failed to fetch")) {
        errorMsg = "Erro de conexão ou bloqueio de CORS. Certifique-se de que a URL é HTTPS e permite requisições públicas.";
      }
      alert(`Erro ao atualizar lista:\n${errorMsg}`);
    } finally {
      isProcessing = false;
      progressValue = 0;
      progressText = "";
    }
  }

  async function removeList(index) {
    const list = lists[index];
    if (
      confirm(
        "Deseja realmente excluir esta lista e todos os seus arquivos do sistema?"
      )
    ) {
      isProcessing = true;
      progressValue = 50;
      progressText = "Excluindo arquivos locais...";

      try {
        await deleteFile("movies.txt");
        await deleteFile("live.json");
        await deleteFile("series.json");

        lists = lists.filter((_, idx) => idx !== index);
        saveLists();
        progressValue = 100;
      } catch (e) {
        console.error(e);
        alert("Erro ao remover lista do disco.");
      } finally {
        isProcessing = false;
        progressValue = 0;
        progressText = "";
      }
    }
  }
</script>

<section class="m3u-section flex flex-col">
  <h2 class="text-xl font-bold text-white mb-6">M3U Lists</h2>

  {#if isProcessing}
    <!-- Processing/Progress Card (TV Premium UI) -->
    <div
      class="p-8 bg-slate-900/60 border border-glass-border rounded-2xl flex flex-col animate-pulse"
    >
      <div class="flex justify-between items-center mb-6">
        <span class="text-base font-semibold text-white">{progressText}</span>
        <span class="text-sm text-sky-400 font-bold">{progressValue}%</span>
      </div>
      <div
        class="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700"
      >
        <div
          class="bg-gradient-sky h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(56,189,248,0.6)]"
          style="width: {progressValue}%"
        ></div>
      </div>
    </div>
  {:else}
    <!-- Lists Content -->
    <div class="flex flex-col">
      {#if lists.length === 0}
        <div class="text-slate-500 text-sm font-light text-center py-6">
          Nenhuma lista M3U cadastrada.
        </div>
      {:else}
        {#each lists as list, index}
          <div
            class="list-item-row flex justify-between items-center p-4 bg-glass border border-glass-border rounded-xl mb-4"
          >
            <div class="flex flex-col flex-grow pr-4 overflow-hidden text-left">
              <span class="text-base font-semibold text-white break-all truncate"
                >{list.url}</span
              >
            </div>
            <div class="flex flex-row items-center select-none">
              <!-- Update Button -->
              <button
                use:focusable
                class="focusable btn-action-update px-4 py-2 rounded-lg text-xs font-bold mr-3"
                on:click={() => updateList(index)}
              >
                Atualizar
              </button>

              <!-- Delete Button -->
              <button
                use:focusable
                class="focusable btn-action-delete p-2 rounded-lg"
                on:click={() => removeList(index)}
              >
                <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current"
                  ><path d={mdiTrashCan} /></svg
                >
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
    {#if showSyncForm}
      <div class="form-container flex flex-col mb-4">
        <div class="flex flex-col mb-4">
          <label for="sync-code-input" class="text-sm font-semibold text-slate-300 mb-2"
            >Código de Sincronização (4 dígitos)</label
          >
          <input
            id="sync-code-input"
            use:focusable
            type="text"
            maxlength="4"
            placeholder="Ex: 2R73"
            bind:value={syncCode}
            class="input-field focusable px-6 py-4 bg-slate-800 border-glass rounded-xl text-base text-white w-full outline-none uppercase font-bold text-center tracking-widest"
          />
        </div>
        <div class="flex mt-2">
          <button
            use:focusable
            class="btn-success focusable px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 mr-4"
            on:click={syncWithCode}
          >
            Sincronizar
          </button>
          <button
            use:focusable
            class="btn-cancel focusable px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300"
            on:click={() => {
              showSyncForm = false;
              syncCode = "";
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    {/if}

    <!-- Add List Form -->
    {#if showForm}
      <div class="form-container flex flex-col">
        <div class="flex flex-col mb-4">
          <label for="list-url" class="text-sm font-semibold text-slate-300 mb-2"
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
        <div class="flex mt-2">
          <button
            use:focusable
            class="btn-success focusable px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 mr-4"
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

    <div class="flex justify-end gap-4 mt-4 select-none">
      {#if !showForm && !showSyncForm}
        <!-- Sync Code Trigger -->
        <button
          use:focusable
          class="btn-primary focusable flex items-center justify-center px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300"
          on:click={() => (showSyncForm = true)}
        >
          <span class="text-nowrap">Sincronizar via Código</span>
        </button>

        <!-- M3U URL Trigger -->
        <button
          use:focusable
          class="btn-secondary focusable flex items-center justify-center px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300"
          on:click={() => (showForm = true)}
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current mr-2"
            ><path d={mdiPlus} /></svg
          >
          <span class="text-nowrap">Adicionar via URL</span>
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

  .btn-secondary {
    background-color: #1e293b;
    color: #cbd5e1;
    border: 2px solid transparent;

    &:global(.focused) {
      background-color: #334155;
      border-color: #64748b;
      color: #ffffff;
      box-shadow: 0 0 15px rgba(100, 116, 139, 0.4);
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

  .btn-action-update {
    background-color: #0ea5e9;
    color: #ffffff;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:global(.focused) {
      background-color: #0284c7;
      border-color: #38bdf8;
      box-shadow: 0 0 10px rgba(14, 165, 233, 0.4);
      transform: scale(1.05);
    }
  }

  .btn-action-delete {
    background-color: #1e293b;
    color: #f43f5e;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:global(.focused) {
      background-color: #e11d48;
      color: #ffffff;
      border-color: #fda4af;
      box-shadow: 0 0 10px rgba(244, 63, 94, 0.4);
      transform: scale(1.05);
    }
  }

  .list-item-row {
    border: 1px solid rgba(255, 255, 255, 0.08);
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
