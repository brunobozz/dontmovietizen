<script>
  import { focusable } from "../services/navigation.js";
  import { createEventDispatcher } from "svelte";

  export let categories = [];

  const dispatch = createEventDispatcher();

  function selectCategory(categoryName) {
    dispatch("select", categoryName);
  }
</script>

<div class="categories-list flex flex-col w-full overflow-y-auto select-none">
  {#each categories as category}
    <button
      use:focusable
      class="focusable category-item-btn flex justify-between items-center w-full px-6 py-4 bg-slate-900 border border-glass-border rounded-xl text-left mb-3 transition-all duration-200"
      on:click={() => selectCategory(category.name)}
    >
      <span class="font-bold text-white text-base truncate pr-4">{category.name}</span>
      <span class="text-xs text-sky-400 font-bold bg-sky-950/40 px-3 py-1 rounded-full border border-sky-900/30 shrink-0">
        {category.count} itens
      </span>
    </button>
  {/each}
</div>

<style lang="scss">
  .categories-list {
    padding-right: 8px;
    box-sizing: border-box;
  }

  .category-item-btn {
    border: 1px solid rgba(255, 255, 255, 0.08);
    background-color: rgba(15, 23, 42, 0.4);

    &:global(.focused) {
      border-color: #38bdf8 !important;
      background-color: rgba(255, 255, 255, 0.08) !important;
      transform: scale(1.02);
      box-shadow: 0 0 10px rgba(14, 165, 233, 0.3);
    }
  }

  @media (min-width: 1900px) {
    .category-item-btn {
      padding: 20px 28px;
      border-radius: 16px;
      margin-bottom: 16px;

      span.text-base {
        font-size: 20px;
      }
      span.text-xs {
        font-size: 14px;
        padding: 6px 14px;
      }
    }
  }
</style>
