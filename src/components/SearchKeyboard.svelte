<script>
  import { createEventDispatcher } from "svelte";
  import { focusable } from "../services/navigation.js";

  const dispatch = createEventDispatcher();
  
  export let value = "";
  export let activeFilter = "all";

  const rows = [
    ["A", "B", "C", "D", "E", "F"],
    ["G", "H", "I", "J", "K", "L"],
    ["M", "N", "O", "P", "Q", "R"],
    ["S", "T", "U", "V", "W", "X"],
    ["Y", "Z", "1", "2", "3", "4"],
    ["5", "6", "7", "8", "9", "0"]
  ];

  function handleKey(key) {
    if (key === "space") {
      value += " ";
    } else if (key === "backspace") {
      value = value.slice(0, -1);
    } else if (key === "clear") {
      value = "";
    } else {
      value += key;
    }
    dispatch("input", value);
  }
</script>

<div class="search-keyboard flex flex-col w-full">
  <!-- Search Query Preview Bar -->
  <div class="flex items-center w-full mb-4">
    <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current text-slate-400 mr-3 shrink-0">
      <path
        d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
      />
    </svg>
    <span
      class="search-input-preview text-xl font-semibold {value
        ? 'text-white'
        : 'text-slate-500'} uppercase"
    >
      {#if value}
        {value}<span class="blinking-cursor">|</span>
      {:else}
        SEARCH MOVIES, SHOWS, CHANNELS...
      {/if}
    </span>
  </div>

  <!-- Top Row: Space, Clear and Backspace -->
  <div class="grid grid-cols-6 w-full">
    <!-- Space Key -->
    <button
      use:focusable
      class="key-btn top-key col-span-2 flex items-center justify-center rounded-xl bg-slate-800/40 text-slate-300 text-base font-bold border-2 border-transparent"
      on:click={() => handleKey("space")}
    >
      <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current"><path d="M18 9v4H6V9H4v6h16V9z"/></svg>
    </button>

    <!-- Clear Key -->
    <button
      use:focusable
      class="key-btn top-key col-span-2 flex items-center justify-center rounded-xl bg-slate-800/40 text-slate-300 text-base font-bold border-2 border-transparent"
      on:click={() => handleKey("clear")}
    >
      <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>

    <!-- Backspace Key -->
    <button
      use:focusable
      class="key-btn top-key col-span-2 flex items-center justify-center rounded-xl bg-slate-800/40 text-slate-300 text-base font-bold border-2 border-transparent"
      on:click={() => handleKey("backspace")}
    >
      <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/></svg>
    </button>
  </div>

  <!-- Character Grid Rows -->
  {#each rows as row}
    <div class="grid grid-cols-6 w-full">
      {#each row as key}
        <button
          use:focusable
          class="key-btn char-key flex items-center justify-center rounded-xl bg-slate-800/40 text-slate-300 text-3xl font-semibold border-2 border-transparent"
          on:click={() => handleKey(key)}
        >
          {key}
        </button>
      {/each}
    </div>
  {/each}

  <!-- Filter Radio Buttons Row -->
  <div class="grid grid-cols-12 w-full mt-2">
    <!-- Option: Todos -->
    <button
      use:focusable
      class="key-btn radio-btn col-span-3 flex flex-col items-center justify-center rounded-xl border-2 border-transparent py-2 {activeFilter === 'all' ? 'active-radio' : 'inactive-radio'}"
      on:click={() => { activeFilter = 'all'; dispatch("filterChange"); }}
    >
      <span class="radio-label text-[10px] font-bold tracking-wider mb-1">TODOS</span>
      <div class="radio-circle w-4 h-4 rounded-full border flex items-center justify-center {activeFilter === 'all' ? 'border-sky-500 bg-sky-950/40' : 'border-slate-600 bg-slate-950/60'}">
        {#if activeFilter === 'all'}
          <div class="radio-dot w-2 h-2 rounded-full bg-sky-500"></div>
        {/if}
      </div>
    </button>

    <!-- Option: Filmes -->
    <button
      use:focusable
      class="key-btn radio-btn col-span-3 flex flex-col items-center justify-center rounded-xl border-2 border-transparent py-2 {activeFilter === 'movie' ? 'active-radio' : 'inactive-radio'}"
      on:click={() => { activeFilter = 'movie'; dispatch("filterChange"); }}
    >
      <span class="radio-label text-[10px] font-bold tracking-wider mb-1">FILMES</span>
      <div class="radio-circle w-4 h-4 rounded-full border flex items-center justify-center {activeFilter === 'movie' ? 'border-sky-500 bg-sky-950/40' : 'border-slate-600 bg-slate-950/60'}">
        {#if activeFilter === 'movie'}
          <div class="radio-dot w-2 h-2 rounded-full bg-sky-500"></div>
        {/if}
      </div>
    </button>

    <!-- Option: Séries -->
    <button
      use:focusable
      class="key-btn radio-btn col-span-3 flex flex-col items-center justify-center rounded-xl border-2 border-transparent py-2 {activeFilter === 'series' ? 'active-radio' : 'inactive-radio'}"
      on:click={() => { activeFilter = 'series'; dispatch("filterChange"); }}
    >
      <span class="radio-label text-[10px] font-bold tracking-wider mb-1">SÉRIES</span>
      <div class="radio-circle w-4 h-4 rounded-full border flex items-center justify-center {activeFilter === 'series' ? 'border-sky-500 bg-sky-950/40' : 'border-slate-600 bg-slate-950/60'}">
        {#if activeFilter === 'series'}
          <div class="radio-dot w-2 h-2 rounded-full bg-sky-500"></div>
        {/if}
      </div>
    </button>

    <!-- Option: Canais -->
    <button
      use:focusable
      class="key-btn radio-btn col-span-3 flex flex-col items-center justify-center rounded-xl border-2 border-transparent py-2 {activeFilter === 'live' ? 'active-radio' : 'inactive-radio'}"
      on:click={() => { activeFilter = 'live'; dispatch("filterChange"); }}
    >
      <span class="radio-label text-[10px] font-bold tracking-wider mb-1">CANAIS</span>
      <div class="radio-circle w-4 h-4 rounded-full border flex items-center justify-center {activeFilter === 'live' ? 'border-sky-500 bg-sky-950/40' : 'border-slate-600 bg-slate-950/60'}">
        {#if activeFilter === 'live'}
          <div class="radio-dot w-2 h-2 rounded-full bg-sky-500"></div>
        {/if}
      </div>
    </button>
  </div>
</div>

<style lang="scss">
  .key-btn {
    border: 2px solid transparent;
    outline: none;
    cursor: pointer;
    user-select: none;
    margin: 4px;
    
    &:global(.focused) {
      border-color: #ffffff !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
      color: #ffffff !important;
      transform: scale(1.1) !important;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2) !important;
    }
  }

  .char-key {
    width: calc((32vw - 78.4px) / 6 - 8px);
    height: calc((32vw - 78.4px) / 6 - 8px);
  }

  .top-key {
    height: calc((32vw - 78.4px) / 6 - 8px);
  }

  .radio-btn {
    height: calc((32vw - 78.4px) / 6 - 8px);
    
    &.active-radio {
      background-color: rgba(14, 165, 233, 0.08) !important;
      border-color: rgba(14, 165, 233, 0.15);
      
      .radio-label {
        color: #38bdf8;
      }
    }
    
    &.inactive-radio {
      background-color: rgba(15, 23, 42, 0.4) !important;
      
      .radio-label {
        color: #64748b;
      }
    }
  }
  .search-input-preview {
    white-space: pre;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
    max-width: calc(100% - 40px);
  }

  .blinking-cursor {
    font-weight: 700;
    color: #38bdf8;
    animation: cursor-blink 1s steps(2, start) infinite;
  }

  @keyframes cursor-blink {
    to {
      visibility: hidden;
    }
  }
</style>

