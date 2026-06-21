<script>
  import { focusable } from '../services/navigation.js';
  export let title = '';
  export let icon = '';
  export let focusClass = '';
  export let focused = false;
</script>

<!-- use:focusable is now bound directly to the Card root element, bubbling up the click event -->
<div 
  use:focusable
  class="card focusable bg-glass border-glass rounded-2xl p-8 flex flex-col justify-end transition-all ease-out duration-300 {focused ? `focused float ${focusClass}` : ''}"
  on:click
>
  <div class="card-icon text-4xl mb-auto transition-all duration-300">{icon}</div>
  <div class="card-title text-xl font-semibold mb-2">{title}</div>
</div>
