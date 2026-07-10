<script>
  import { onMount } from "svelte";
  import SidebarItem from "./SidebarItem.svelte";
  import { mdiMagnify, mdiHome, mdiMovie, mdiTelevision, mdiFilmstrip, mdiCog } from "@mdi/js";

  let currentHash = "dashboard";

  const menuItems = [
    { hash: "search", icon: mdiMagnify },
    { hash: "dashboard", icon: mdiHome },
    { hash: "movies", icon: mdiMovie },
    { hash: "tvshows", icon: mdiFilmstrip },
    { hash: "live", icon: mdiTelevision },
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
  class="flex flex-col items-center py-12 bg-glass z-10 h-full w-[120px] justify-center shrink-0 will-change-transform"
>
  {#each menuItems as item}
    <SidebarItem hash={item.hash} icon={item.icon} {currentHash} />
  {/each}
</aside>
