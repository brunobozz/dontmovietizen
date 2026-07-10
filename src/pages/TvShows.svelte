<script>
  import Header from "../components/Header.svelte";
  import { mdiFilmstrip } from "@mdi/js";

  export let params = {};
</script>

<div class="app-container" style="padding: 40px;">
  <Header title="Séries" icon={mdiFilmstrip} />
</div>
