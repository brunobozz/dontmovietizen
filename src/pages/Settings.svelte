<script>
  import Header from "../components/Header.svelte";
  import M3uListManager from "../components/M3uListManager.svelte";
  import { mdiCog } from "@mdi/js";

  export let params = {};
</script>

<div class="app-container overflow-y-auto flex flex-col" style="padding: 40px;">
  <Header title="Configurações" icon={mdiCog} />
  <M3uListManager />
</div>
