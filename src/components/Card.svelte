<script>
  import { focusable, focusIndex, focusableElements } from '../services/navigation.js';
  export let title = '';
  export let icon = '';
  export let focusClass = '';

  let element;

  $: focused = $focusableElements[$focusIndex] === element;
  $: isSvgPath = typeof icon === 'string' && icon.startsWith('M') && icon.length > 10;
</script>

<!-- use:focusable is now bound directly to the Card root element, bubbling up the click event -->
<div 
  bind:this={element}
  use:focusable
  class="card focusable bg-glass border-glass rounded-2xl p-8 flex flex-col justify-end transition-all ease-out duration-300 {focused ? `focused focused:float ${focusClass}` : ''}"
  on:click
>
  <div class="card-icon text-4xl mb-auto transition-all duration-300 flex items-center justify-start">
    {#if isSvgPath}
      <svg viewBox="0 0 24 24" class="w-12 h-12 fill-current">
        <path d={icon} />
      </svg>
    {:else}
      {icon}
    {/if}
  </div>
  <div class="card-title text-xl font-semibold mb-2">{title}</div>
</div>
