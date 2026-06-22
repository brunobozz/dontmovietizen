<script>
  import { onMount } from 'svelte';
  import { focusable, focusIndex } from '../services/navigation.js';
  import { mdiHome, mdiMovie, mdiTelevision } from '@mdi/js';

  let currentHash = 'dashboard';

  function handleHash() {
    currentHash = window.location.hash.slice(1) || 'dashboard';
  }

  onMount(() => {
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  });
</script>

<aside class="sidebar flex flex-col items-center py-12 bg-glass border-r border-glass h-full w-[120px] justify-center gap-8 flex-shrink-0">
  <!-- Item 0: Home (Dashboard) -->
  <div 
    use:focusable
    class="sidebar-item focusable flex items-center justify-center rounded-2xl transition-all duration-300 {$focusIndex === 0 ? 'focused' : ''} {currentHash === 'dashboard' ? 'active' : ''}"
    on:click={() => window.location.hash = 'dashboard'}
  >
    <svg viewBox="0 0 24 24" class="icon">
      <path d={mdiHome} />
    </svg>
  </div>

  <!-- Item 1: Movies -->
  <div 
    use:focusable
    class="sidebar-item focusable flex items-center justify-center rounded-2xl transition-all duration-300 {$focusIndex === 1 ? 'focused' : ''} {currentHash === 'movies' ? 'active' : ''}"
    on:click={() => window.location.hash = 'movies'}
  >
    <svg viewBox="0 0 24 24" class="icon">
      <path d={mdiMovie} />
    </svg>
  </div>

  <!-- Item 2: Tv Shows -->
  <div 
    use:focusable
    class="sidebar-item focusable flex items-center justify-center rounded-2xl transition-all duration-300 {$focusIndex === 2 ? 'focused' : ''} {currentHash === 'tvshows' ? 'active' : ''}"
    on:click={() => window.location.hash = 'tvshows'}
  >
    <svg viewBox="0 0 24 24" class="icon">
      <path d={mdiTelevision} />
    </svg>
  </div>
</aside>

<style lang="scss">
  .sidebar {
    width: 120px;
    height: 100%;
    will-change: transform;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    z-index: 10;
  }

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
