<script>
  import { onMount, onDestroy, tick } from "svelte";
  import { focusable, focusElementByDataAttribute } from "../services/navigation.js";
  import { mdiArrowLeft } from "@mdi/js";

  export let item;
  export let onClose;

  let videoElement;
  let showControls = true;
  let controlsTimeout;
  let isLoadingMedia = true;
  let videoError = null;

  function resetControlsTimeout() {
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      showControls = false;
    }, 5000);
  }

  async function handleKeyDown(event) {
    const key = event.keyCode;

    // Ignore Back (10009) and Escape (27) so they are processed by the global keydown
    if (key === 10009 || key === 27) {
      return;
    }

    if (!showControls) {
      event.preventDefault();
      event.stopPropagation();

      showControls = true;
      await tick();

      // Set focus to the close control
      focusElementByDataAttribute("data-player-control", "close");
      resetControlsTimeout();
    } else {
      resetControlsTimeout();
    }
  }

  function handleVideoError(e) {
    const isTV = (window.webapis !== undefined || window.tizen !== undefined);
    if (videoElement && videoElement.error) {
      const err = videoElement.error;
      switch (err.code) {
        case 1:
          videoError = "Abortado pelo usuário (Código 1)";
          break;
        case 2:
          videoError = "Erro de rede (Código 2). Verifique a conexão.";
          break;
        case 3:
          videoError = "Erro de decodificação (Código 3). Formato incompatível.";
          break;
        case 4:
          if (!isTV) {
            videoError = "Modo Debug PC: O navegador do seu computador não suporta este formato de stream (m3u8/ts) nativamente, mas ele funcionará 100% na Smart TV.";
          } else {
            videoError = "Formato de vídeo não suportado pela TV (Código 4).";
          }
          break;
        default:
          videoError = `Erro desconhecido (Código ${err.code})`;
      }
    } else {
      videoError = "Erro ao tentar conectar ao fluxo de streaming.";
    }
    isLoadingMedia = false;
    console.error("Video Error Details:", e);
  }

  let hlsInstance = null;

  function loadHlsScript() {
    return new Promise((resolve) => {
      if (window.Hls) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  function handleCloseEvent() {
    onClose();
  }

  onMount(async () => {
    window.addEventListener("close-player", handleCloseEvent);
    
    // Automatically focus the close button on start and set timeout
    tick().then(() => {
      focusElementByDataAttribute("data-player-control", "close");
      resetControlsTimeout();
    });

    if (videoElement) {
      const streamUrl = item.url;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isTV = (window.webapis !== undefined || window.tizen !== undefined);
      const useNativeHls = isSafari || isTV;
      
      // Native HLS support check (Safari / Smart TVs)
      if (useNativeHls && videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        videoElement.src = streamUrl;
        videoElement.play().catch(err => {
          console.warn("Autoplay prevented:", err);
        });
      } else {
        // PC Browser HLS.js fallback
        const loaded = await loadHlsScript();
        if (loaded && window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(videoElement);
          
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
            videoElement.play().catch(err => {
              console.warn("Autoplay prevented under HLS.js:", err);
            });
          });

          hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              console.error("HLS.js fatal error:", data);
              isLoadingMedia = false;
              
              if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                videoError = `Erro de Conexão (HTTP ${data.response?.code || 'CORS'}): O servidor de streaming rejeitou a requisição do PC.`;
              } else {
                videoError = `Erro de decodificação do canal (${data.details})`;
              }
            }
          });
        } else {
          // Absolute fallback
          videoElement.src = streamUrl;
          videoElement.play().catch(err => {
            console.warn("Autoplay prevented:", err);
          });
        }
      }
    }

    return () => {
      window.removeEventListener("close-player", handleCloseEvent);
      clearTimeout(controlsTimeout);
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  });
</script>

<svelte:window on:keydown|capture={handleKeyDown} />

<div class="player-container">
  <!-- Video Element -->
  <!-- svelte-ignore a11y-media-has-caption -->
  <video
    bind:this={videoElement}
    class="video-element"
    autoplay
    referrerpolicy="no-referrer"
    on:error={handleVideoError}
    on:waiting={() => isLoadingMedia = true}
    on:playing={() => isLoadingMedia = false}
    on:seeking={() => isLoadingMedia = true}
    on:seeked={() => isLoadingMedia = false}
    on:canplay={() => isLoadingMedia = false}
  ></video>

  {#if isLoadingMedia && !videoError}
    <div class="video-loader-overlay">
      <svg class="animate-spin h-16 w-16 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  {/if}

  {#if videoError}
    <div class="video-error-overlay">
      <span class="error-title">Erro de Transmissão</span>
      <span class="error-msg">{videoError}</span>
    </div>
  {/if}

  <!-- Controls Overlay -->
  {#if showControls}
    <div class="player-overlay">
      <!-- Top Row: Title and Return Button -->
      <div class="top-controls">
        <h2 class="player-title">{item.name}</h2>
        <button
          use:focusable
          class="focusable btn-player-close"
          data-player-control="close"
          on:click={onClose}
        >
          <svg viewBox="0 0 24 24" class="btn-icon"><path d={mdiArrowLeft} /></svg>
          <span>Voltar</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .video-loader-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 5;
    pointer-events: none;
  }

  .player-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    background-color: #000000;
    overflow: hidden;
  }

  .video-element {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    z-index: 1;
  }

  .player-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 25%);
    box-sizing: border-box;
    padding: 40px;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .top-controls {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
  }

  .player-title {
    color: #ffffff;
    font-size: 28px;
    font-weight: 800;
    margin: 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
    max-width: 70%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  .btn-player-close {
    pointer-events: auto;
    background-color: rgba(15, 23, 42, 0.75);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: #cbd5e1;
    border-radius: 14px;
    padding: 12px 24px;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    cursor: pointer;
    outline: none;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    
    .btn-icon {
      width: 20px;
      height: 20px;
      fill: currentColor;
      margin-right: 8px;
    }

    &:global(.focused) {
      background-color: #0ea5e9;
      border-color: #38bdf8;
      color: #ffffff;
      box-shadow: 0 0 25px rgba(14, 165, 233, 0.5);
      transform: scale(1.05);
    }
  }

  .video-error-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 6;
    background-color: rgba(15, 23, 42, 0.9);
    border: 2px solid rgba(239, 68, 68, 0.4);
    border-radius: 20px;
    padding: 30px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    max-width: 80%;
    pointer-events: auto;
    
    .error-title {
      font-size: 20px;
      font-weight: 800;
      color: #f87171;
      margin-bottom: 12px;
    }
    
    .error-msg {
      font-size: 14px;
      color: #cbd5e1;
      line-height: 1.5;
    }
  }

  /* 1080p Smart TVs */
  @media (min-width: 1900px) {
    .player-overlay {
      padding: 60px;
    }
    .player-title {
      font-size: 42px;
    }
    .btn-player-close {
      border-radius: 20px;
      padding: 16px 36px;
      font-size: 20px;

      .btn-icon {
        width: 28px;
        height: 28px;
        margin-right: 12px;
      }
    }
  }

  /* Spin Animation */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
