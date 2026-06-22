<script>
  import Header from "../components/Header.svelte";
  import M3uListManager from "../components/M3uListManager.svelte";
  import { mdiCog } from "@mdi/js";
</script>

<div class="app-container overflow-y-auto flex flex-col gap-8">
  <Header title="Settings" icon={mdiCog} />
  <M3uListManager />
</div>
