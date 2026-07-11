<script>
  import { onMount } from "svelte";
  import { focusable } from "../services/navigation.js";
  import { mdiPlus, mdiTrashCan } from "@mdi/js";
  import { parseM3uAndSave } from "../services/m3uParser.js";
  import { deleteFile, writeFile, fileExists, readFile } from "../services/storage.js";

  let lists = [];
  let showForm = false;
  let showSyncForm = false;
  let newUrl = "http://golx.top/get.php?username=beiraingleses&password=985227073&type=m3u_plus&output=ts";
  let syncCode = "";

  let isProcessing = false;
  let progressText = "";
  let progressValue = 0;

  let fileStats = {
    moviesSize: 0,
    liveSize: 0,
    seriesSize: 0,
    metadataSize: 0,
    moviesExists: false,
    liveExists: false,
    seriesExists: false,
    metadataExists: false,
    categories: {
      live: 0,
      movies: 0,
      series: 0
    }
  };

  async function loadFileStats() {
    try {
      fileStats.moviesExists = await fileExists("movies.txt");
      fileStats.liveExists = await fileExists("live.json");
      fileStats.seriesExists = await fileExists("series.json");
      fileStats.metadataExists = await fileExists("metadata.json");

      if (fileStats.moviesExists) {
        const text = await readFile("movies.txt");
        fileStats.moviesSize = text ? text.length : 0;
      } else {
        fileStats.moviesSize = 0;
      }

      if (fileStats.liveExists) {
        const text = await readFile("live.json");
        fileStats.liveSize = text ? text.length : 0;
      } else {
        fileStats.liveSize = 0;
      }

      if (fileStats.seriesExists) {
        const text = await readFile("series.json");
        fileStats.seriesSize = text ? text.length : 0;
      } else {
        fileStats.seriesSize = 0;
      }

      if (fileStats.metadataExists) {
        const text = await readFile("metadata.json");
        fileStats.metadataSize = text ? text.length : 0;
        if (text) {
          try {
            const meta = JSON.parse(text);
            fileStats.categories.live = meta.live ? meta.live.length : 0;
            fileStats.categories.movies = meta.movies ? meta.movies.length : 0;
            fileStats.categories.series = meta.series ? meta.series.length : 0;
          } catch (e) {
            console.error("Failed to parse metadata.json:", e);
          }
        }
      } else {
        fileStats.metadataSize = 0;
        fileStats.categories = { live: 0, movies: 0, series: 0 };
      }
    } catch (err) {
      console.error("Failed to load file stats:", err);
    }
  }

  onMount(async () => {
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
    await loadFileStats();
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

      progressValue = 60;
      progressText = "Baixando filmes...";
      await downloadAndSaveFile(data.movies_url, "movies.txt");

      progressValue = 80;
      progressText = "Baixando séries...";
      await downloadAndSaveFile(data.series_url, "series.json");

      progressValue = 90;
      progressText = "Baixando metadados...";
      const metadataUrl = data.live_url.replace("live.json", "metadata.json");
      await downloadAndSaveFile(metadataUrl, "metadata.json");

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

      await loadFileStats();

      alert("Lista sincronizada com sucesso!");
      syncCode = "";
      showSyncForm = false;

      setTimeout(() => {
        window.location.reload();
      }, 300);
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
      await loadFileStats();

      alert(
        `Lista importada com sucesso!\nEstruturados:\n- ${result.movies} Filmes\n- ${result.series} Séries (${result.episodes} Episódios)\n- ${result.live} Canais`
      );
      newUrl = "";
      showForm = false;

      setTimeout(() => {
        window.location.reload();
      }, 300);
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

        progressValue = 60;
        progressText = "Baixando filmes...";
        await downloadAndSaveFile(data.movies_url, "movies.txt");

        progressValue = 80;
        progressText = "Baixando séries...";
        await downloadAndSaveFile(data.series_url, "series.json");

        progressValue = 90;
        progressText = "Baixando metadados...";
        const metadataUrl = data.live_url.replace("live.json", "metadata.json");
        await downloadAndSaveFile(metadataUrl, "metadata.json");

        progressValue = 100;
        progressText = "Atualização concluída!";

        lists[index].moviesUrl = data.movies_url;
        lists[index].liveUrl = data.live_url;
        lists[index].seriesUrl = data.series_url;
        saveLists();
        await loadFileStats();

        alert("Lista atualizada com sucesso por código!");
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        progressText = "Conectando ao servidor da lista...";
        const result = await parseM3uAndSave(list.url, (percentage) => {
          progressValue = percentage;
          progressText = `Processando e Salvando (${percentage}%)...`;
        });
        await loadFileStats();

        alert(
          `Lista atualizada com sucesso!\nEstruturados:\n- ${result.movies} Filmes\n- ${result.series} Séries (${result.episodes} Episódios)\n- ${result.live} Canais`
        );
        setTimeout(() => {
          window.location.reload();
        }, 300);
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
        await deleteFile("metadata.json");

        // Clear IndexedDB cache database
        try {
          indexedDB.deleteDatabase("dontmovietizen_db");
        } catch (dbErr) {
          console.warn("IndexedDB deletion error:", dbErr);
        }

        lists = lists.filter((_, idx) => idx !== index);
        saveLists();
        progressValue = 100;

        setTimeout(() => {
          window.location.reload();
        }, 300);
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

  async function factoryReset() {
    if (
      confirm(
        "ATENÇÃO: Deseja realmente realizar um reset de fábrica? Isso apagará permanentemente todas as listas, arquivos locais de cache e o banco de dados IndexedDB."
      )
    ) {
      isProcessing = true;
      progressValue = 30;
      progressText = "Limpando arquivos locais...";

      try {
        // Delete all files
        await deleteFile("movies.txt");
        await deleteFile("live.json");
        await deleteFile("series.json");
        await deleteFile("metadata.json");

        progressValue = 60;
        progressText = "Removendo bancos de dados...";

        // Clear both IndexedDB databases
        try {
          indexedDB.deleteDatabase("dontmovietizen_db");
        } catch (e) {
          console.warn("Error deleting DB:", e);
        }
        try {
          indexedDB.deleteDatabase("dontmovietizen_fs");
        } catch (e) {
          console.warn("Error deleting FS DB:", e);
        }

        progressValue = 85;
        progressText = "Limpando configurações...";

        // Clear local storage completely
        localStorage.clear();

        progressValue = 100;
        progressText = "Reiniciando aplicativo...";

        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (err) {
        console.error(err);
        alert("Erro ao realizar o reset de fábrica.");
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

    <!-- Diagnostic / Local Storage Info -->
    <div class="diagnostic-container mt-6 text-left select-none">
      <h3 class="diagnostic-title">Diagnóstico de Armazenamento Local</h3>
      <div class="diagnostic-grid">
        <div class="diagnostic-card">
          <span class="diagnostic-label">Canais (live.json)</span>
          {#if fileStats.liveExists}
            <span class="status-saved">Salvo</span>
            <span class="status-size">{(fileStats.liveSize / 1024).toFixed(1)} KB</span>
            {#if fileStats.metadataExists}
              <span class="status-cats">{fileStats.categories.live} categorias</span>
            {/if}
          {:else}
            <span class="status-missing">Não encontrado</span>
          {/if}
        </div>
        <div class="diagnostic-card">
          <span class="diagnostic-label">Filmes (movies.txt)</span>
          {#if fileStats.moviesExists}
            <span class="status-saved">Salvo</span>
            <span class="status-size">{(fileStats.moviesSize / 1024).toFixed(1)} KB</span>
            {#if fileStats.metadataExists}
              <span class="status-cats">{fileStats.categories.movies} categorias</span>
            {/if}
          {:else}
            <span class="status-missing">Não encontrado</span>
          {/if}
        </div>
        <div class="diagnostic-card">
          <span class="diagnostic-label">Séries (series.json)</span>
          {#if fileStats.seriesExists}
            <span class="status-saved">Salvo</span>
            <span class="status-size">{(fileStats.seriesSize / 1024).toFixed(1)} KB</span>
            {#if fileStats.metadataExists}
              <span class="status-cats">{fileStats.categories.series} categorias</span>
            {/if}
          {:else}
            <span class="status-missing">Não encontrado</span>
          {/if}
        </div>
      </div>
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

    <div class="flex justify-between items-center mt-8 select-none">
      {#if !showForm && !showSyncForm}
        <!-- Left Side: Factory Reset -->
        <button
          use:focusable
          class="btn-danger focusable flex items-center justify-center px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300"
          on:click={factoryReset}
        >
          <span class="text-nowrap font-bold">Reset de Fábrica</span>
        </button>

        <!-- Right Side: Triggers -->
        <div class="flex gap-4">
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
        </div>
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
  .btn-danger {
    background-color: #1e293b;
    color: #f43f5e;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:global(.focused) {
      background-color: #e11d48;
      color: #ffffff;
      border-color: #fda4af;
      box-shadow: 0 0 15px rgba(244, 63, 94, 0.4);
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

  .diagnostic-container {
    padding: 24px;
    background-color: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    margin-top: 24px;
  }

  .diagnostic-title {
    font-size: 14px;
    font-weight: 700;
    color: #94a3b8;
    margin-top: 0;
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .diagnostic-grid {
    display: flex;
    flex-direction: row;
    width: 100%;
  }

  .diagnostic-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    background-color: rgba(30, 41, 59, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    margin-right: 16px;

    &:last-child {
      margin-right: 0;
    }
  }

  .diagnostic-label {
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
    margin-bottom: 4px;
  }

  .status-saved {
    font-size: 12px;
    font-weight: 700;
    color: #34d399;
  }

  .status-size {
    font-size: 10px;
    color: #64748b;
    margin-top: 4px;
  }

  .status-missing {
    font-size: 12px;
    font-weight: 700;
    color: #f87171;
  }

  .status-cats {
    font-size: 10px;
    font-weight: 600;
    color: #38bdf8;
    margin-top: 2px;
  }
</style>
