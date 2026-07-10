<script>
  import Header from "../components/Header.svelte";
  import { mdiHome } from "@mdi/js";
  
  export let params = {};
</script>

<div class="app-container">
  <Header title="Tizen Smart TV Hub" icon={mdiHome} />
</div>
