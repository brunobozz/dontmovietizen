<script>
  import Header from "../components/Header.svelte";
  import { mdiMovie } from "@mdi/js";

  export let params = {};
</script>

<div class="app-container">
  <Header title="Movies / Filmes" icon={mdiMovie} />
</div>
