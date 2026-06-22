<script>
  import { onMount } from "svelte";
  import SidebarItem from "./SidebarItem.svelte";
  import { mdiHome, mdiMovie, mdiTelevision, mdiCog } from "@mdi/js";

  let currentHash = "dashboard";

  const menuItems = [
    { hash: "dashboard", icon: mdiHome },
    { hash: "movies", icon: mdiMovie },
    { hash: "tvshows", icon: mdiTelevision },
    { hash: "settings", icon: mdiCog },
  ];

  function handleHash() {
    currentHash = window.location.hash.slice(1) || "dashboard";
  }

  onMount(() => {
    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  });
</script>

<aside
  class="sidebar flex flex-col items-center py-12 bg-glass h-full w-[120px] justify-center gap-8 flex-shrink-0"
>
  {#each menuItems as item}
    <SidebarItem hash={item.hash} icon={item.icon} {currentHash} />
  {/each}
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
</style>
