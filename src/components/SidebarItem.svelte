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
  class="sidebar-item focusable flex items-center justify-center rounded-2xl transition-all duration-300 {focused ? 'focused' : ''} {currentHash === hash ? 'active' : ''}"
  on:click={() => window.location.hash = hash}
>
  <svg viewBox="0 0 24 24" class="icon">
    <path d={icon} />
  </svg>
</div>

<style lang="scss">
  .sidebar-item {
    width: 70px;
    height: 70px;
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    color: var(--tw-slate-400);
    
    /* Indicator capsule for active view */
    &.active::after {
      content: '';
      position: absolute;
      left: -12px;
      top: 50%;
      transform: translateY(-50%);
      width: 5px;
      height: 24px;
      background-color: var(--tw-sky-400);
      border-radius: 9999px;
    }

    &.active {
      color: var(--tw-sky-400);
    }

    &.focused {
      background: var(--tw-sky-500);
      border-color: var(--tw-sky-400);
      box-shadow: 0 0 20px rgba(14, 165, 233, 0.45);
      transform: scale(1.1);
      color: #ffffff !important;
      
      .icon {
        transform: scale(1.1);
      }
    }
    
    .icon {
      transition: transform 0.3s ease;
      width: 32px;
      height: 32px;
      fill: currentColor;
    }
  }
</style>
