<script>
  import { createEventDispatcher } from "svelte";
  import Cover from "./Cover.svelte";

  export let title = "";
  export let items = [];

  const dispatch = createEventDispatcher();

  let limit = 10;
  $: visibleItems = items.slice(0, limit);

  function loadMore() {
    if (limit < items.length) {
      limit = Math.min(limit + 10, items.length);
    }
  }

  function handleScroll(e) {
    const container = e.target;
    const scrollRight =
      container.scrollWidth - container.scrollLeft - container.clientWidth;
    // Load more when user scrolls close to the end (within 300px)
    if (scrollRight < 300) {
      loadMore();
    }
  }

  function handleSelectItem(item) {
    dispatch("selectItem", item);
  }

  function handleItemFocused(event) {
    const itemEl = event.target;
    const container = event.currentTarget;

    // Find wrapper element of the focused target cover
    const wrapperEl = itemEl.closest(".shelf-item-wrapper");
    if (!wrapperEl) return;

    // Calculate left boundary scroll offset (40px padding offset)
    const targetScrollLeft = wrapperEl.offsetLeft - 40;

    container.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    });
  }
</script>

<div class="shelf-container select-none">
  <!-- Title / Header of the Shelf -->
  <div class="shelf-header">
    <h3 class="text-base font-bold text-white tracking-wide uppercase">
      {title}
    </h3>
    <span class="text-xs font-light text-slate-500">{items.length} itens</span>
  </div>

  <!-- Horizontal Scroll List -->
  <div
    class="scroll-container"
    on:scroll={handleScroll}
    on:sn-focused={handleItemFocused}
  >
    {#each visibleItems as item, index (item.url)}
      <div class="shelf-item-wrapper flex-shrink-0 w-media">
        <Cover
          {item}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          on:click={() => handleSelectItem(item)}
        />
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
  .shelf-container {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .shelf-header {
    padding-left: 40px;
    padding-right: 40px;
    box-sizing: border-box;
    margin-bottom: -10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .scroll-container {
    position: relative;
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    width: 100%;
    padding-top: 16px;
    padding-bottom: 16px;
    padding-left: 40px;
    padding-right: 40px;
    box-sizing: border-box;
    scrollbar-width: none; /* Firefox */
    &::-webkit-scrollbar {
      display: none; /* Safari and Chrome */
    }
  }

  .shelf-item-wrapper {
    margin-right: 16px;
    transition: width 0.2s ease;
  }

  .w-live {
    width: 220px; /* 16:9 live channel */
  }

  .w-media {
    width: 150px; /* 2:3 movie/series cover */
  }

  @media (min-width: 1900px) {
    .w-live {
      width: 280px; /* Larger screens sizing */
    }
    .w-media {
      width: 180px;
    }
  }
</style>
