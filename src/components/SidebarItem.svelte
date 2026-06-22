<script>
  import { focusable, focusIndex, focusableElements } from '../services/navigation.js';
  export let hash = '';
  export let icon = '';
  export let currentHash = '';

  let element;

  $: focused = $focusableElements[$focusIndex] === element;
</script>

<div 
  bind:this={element}
  use:focusable
  data-hash={hash}
  class="sidebar-item w-[70px] h-[70px] cursor-pointer relative border-2 border-transparent text-slate-400 flex items-center justify-center rounded-2xl transition-all duration-300
    {focused ? 'bg-sky-500 border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.45)] scale-110 text-white' : ''}
    {currentHash === hash ? 'text-sky-400 active-indicator' : ''}"
  on:click={() => window.location.hash = hash}
>
  <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current transition-transform duration-300 {focused ? 'scale-110' : ''}">
    <path d={icon} />
  </svg>
</div>

<style lang="scss">
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
