<script>
  import { createEventDispatcher } from "svelte";
  import { focusable } from "../services/navigation.js";

  const dispatch = createEventDispatcher();
  
  export let value = "";

  const rows = [
    ["a", "b", "c", "d", "e", "f"],
    ["g", "h", "i", "j", "k", "l"],
    ["m", "n", "o", "p", "q", "r"],
    ["s", "t", "u", "v", "w", "x"],
    ["y", "z", "1", "2", "3", "4"],
    ["5", "6", "7", "8", "9", "0"]
  ];

  function handleKey(key) {
    if (key === "space") {
      value += " ";
    } else if (key === "backspace") {
      value = value.slice(0, -1);
    } else {
      value += key;
    }
    dispatch("input", value);
  }
</script>

<div class="search-keyboard flex flex-col gap-2 w-full">
  <!-- Top Row: Space and Backspace -->
  <div class="grid grid-cols-6 gap-2 w-full">
    <!-- Space Key -->
    <button
      use:focusable
      class="key-btn col-span-3 flex items-center justify-center py-4 rounded-xl bg-slate-800/40 text-slate-300 text-base font-bold border-2 border-transparent transition-all duration-200"
      on:click={() => handleKey("space")}
    >
      <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current"><path d="M18 9v4H6V9H4v6h16V9z"/></svg>
    </button>

    <!-- Backspace Key -->
    <button
      use:focusable
      class="key-btn col-span-3 flex items-center justify-center py-4 rounded-xl bg-slate-800/40 text-slate-300 text-base font-bold border-2 border-transparent transition-all duration-200"
      on:click={() => handleKey("backspace")}
    >
      <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/></svg>
    </button>
  </div>

  <!-- Character Grid Rows -->
  {#each rows as row}
    <div class="grid grid-cols-6 gap-2 w-full">
      {#each row as key}
        <button
          use:focusable
          class="key-btn flex items-center justify-center aspect-square rounded-xl bg-slate-800/40 text-slate-300 text-xl font-semibold border-2 border-transparent transition-all duration-200"
          on:click={() => handleKey(key)}
        >
          {key}
        </button>
      {/each}
    </div>
  {/each}
</div>

<style lang="scss">
  .key-btn {
    border: 2px solid transparent;
    transition: all 0.2s ease-in-out;
    outline: none;
    cursor: pointer;
    user-select: none;
    
    &:global(.focused) {
      border-color: #ffffff !important;
      background-color: rgba(255, 255, 255, 0.15) !important;
      color: #ffffff !important;
      transform: scale(1.1) !important;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2) !important;
    }
  }
</style>
