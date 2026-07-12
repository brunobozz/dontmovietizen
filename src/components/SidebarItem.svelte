<script>
  import { focusable, focusIndex, focusableElements, clearFocusStack } from '../services/navigation.js';
  export let hash = '';
  export let icon = '';
  export let currentHash = '';

  let element;

  $: focused = $focusableElements[$focusIndex] === element;

  $: isActive = currentHash === hash || 
                (currentHash.split('?')[0] === hash) ||
                (hash === "live" && currentHash.startsWith("live-category"));
</script>

<div 
  bind:this={element}
  use:focusable
  data-hash={hash}
  class="sidebar-item w-[70px] h-[70px] cursor-pointer relative border-2 border-transparent text-slate-400 flex items-center justify-center rounded-2xl
    {focused ? 'focused shadow-[0_0_20px_rgba(14,165,233,0.45)] scale-110 text-white' : ''}
    {isActive ? 'text-sky-400 active-indicator' : ''}"
  on:click={() => {
    clearFocusStack();
    window.location.hash = hash;
  }}
>
  <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current {focused ? 'scale-110' : ''}">
    <path d={icon} />
  </svg>
</div>

<style lang="scss">
  .sidebar-item {
    margin: 16px 0;
  }
  .sidebar-item.focused {
    background-color: #0ea5e9 !important;
    border-color: #38bdf8 !important;
  }
  .active-indicator::after {
    content: '';
    position: absolute;
    left: -12px;
    top: 50%;
    transform: translateY(-50%);
    width: 5px;
    height: 24px;
    background-color: #38bdf8;
    border-radius: 9999px;
  }
</style>
