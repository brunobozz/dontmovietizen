<script>
  import { onMount, onDestroy, tick } from "svelte";
  import { focusable, focusElementByDataAttribute } from "../services/navigation.js";
  import { mdiPlay, mdiPause, mdiClose } from "@mdi/js";

  export let item;
  export let onClose;

  let videoElement;
  let isPlaying = true;
  let showControls = false;
  let controlsTimeout;

  let currentTime = 0;
  let duration = 0;

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity || seconds < 0) return "00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const pad = (val) => val.toString().padStart(2, "0");
    
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  $: progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Clean the title by removing trailing years (e.g. "(2020)" or "2019")
  const cleanName = item.currentEpisodeName || item.name.replace(/\s*[([{\s-]*\b(19\d\d|20\d\d)\b[)\]}\s-]*/g, "").trim();

  function resetControlsTimeout() {
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      showControls = false;
    }, 5000);
  }

  function togglePlay() {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
        isPlaying = false;
      } else {
        videoElement.play();
        isPlaying = true;
      }
    }
    resetControlsTimeout();
  }

  function seek(amount) {
    if (videoElement) {
      let newTime = videoElement.currentTime + amount;
      if (newTime < 0) newTime = 0;
      if (newTime > duration) newTime = duration;
      videoElement.currentTime = newTime;
      currentTime = newTime;
    }
    resetControlsTimeout();
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

      // Set focus to the play-pause control
      focusElementByDataAttribute("data-player-control", "play-pause");
      resetControlsTimeout();
    } else {
      resetControlsTimeout();

      // Intercept LEFT (37) and RIGHT (39) when timeline is focused to seek the video
      if (key === 37 || key === 39) {
        const activeEl = document.querySelector(".player-overlay .focused");
        if (activeEl && activeEl.getAttribute("data-player-control") === "timeline") {
          event.preventDefault();
          event.stopPropagation();

          const seekAmount = key === 39 ? 10 : -10; // Seek 10s forward or backward
          seek(seekAmount);
        }
      }
    }
  }

  let videoError = null;
  let isLoadingMedia = true;

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

  function handleCloseEvent() {
    onClose();
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

  onMount(async () => {
    window.addEventListener("close-player", handleCloseEvent);
    
    if (videoElement) {
      const isHls = item.url.includes(".m3u8");
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isTV = (window.webapis !== undefined || window.tizen !== undefined);
      const useNativeHls = isSafari || isTV;
      
      if (isHls && !(useNativeHls && videoElement.canPlayType("application/vnd.apple.mpegurl"))) {
        // Fallback HLS.js on PC Browser
        const loaded = await loadHlsScript();
        if (loaded && window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(item.url);
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
          videoElement.src = item.url;
          videoElement.play().catch(err => {
            console.warn("Autoplay prevented:", err);
          });
        }
      } else {
        // MP4/MKV or native TV HLS
        videoElement.src = item.url;
        videoElement.play().catch(err => {
          console.warn("Autoplay prevented:", err);
        });
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
    bind:currentTime
    bind:duration
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
      <span class="error-title">Erro de Reprodução</span>
      <span class="error-msg">{videoError}</span>
    </div>
  {/if}

  <!-- Controls Overlay -->
  {#if showControls}
    <div class="player-overlay">
      <!-- Top Row: Title and Close Button -->
      <div class="top-controls">
        <h2 class="player-title">{cleanName}</h2>
        <button
          use:focusable
          class="focusable btn-player-close"
          data-player-control="close"
          on:click={onClose}
        >
          <svg viewBox="0 0 24 24" class="btn-icon"><path d={mdiClose} /></svg>
          <span>Fechar</span>
        </button>
      </div>

      <!-- Bottom Controls and Progress Bar -->
      <div class="bottom-controls">
        <!-- Progress Bar Row (Focusable) -->
        <div
          use:focusable
          class="focusable progress-container"
          data-player-control="timeline"
        >
          <span class="time-text elapsed-time">{formatTime(currentTime)}</span>
          <div class="progress-bar-wrapper">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: {progressPercent}%"></div>
            </div>
          </div>
          <span class="time-text remaining-time">-{formatTime(duration - currentTime)}</span>
        </div>

        <!-- Play/Pause Button -->
        <button
          use:focusable
          class="focusable btn-player-playpause"
          data-player-control="play-pause"
          on:click={togglePlay}
        >
          <svg viewBox="0 0 24 24" class="playpause-icon">
            <path d={isPlaying ? mdiPause : mdiPlay} />
          </svg>
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
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0) 75%, rgba(0, 0, 0, 0.6) 100%);
    box-sizing: border-box;
    padding: 40px;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
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
      background-color: #ef4444;
      border-color: #f87171;
      color: #ffffff;
      box-shadow: 0 0 25px rgba(239, 68, 68, 0.5);
      transform: scale(1.05);
    }
  }

  .bottom-controls {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .progress-container {
    width: 100%;
    max-w: 800px;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 24px;
    pointer-events: auto;
    outline: none;
    border: none !important;
    
    &:global(.focused) {
      border: none !important;
      border-color: transparent !important;
      box-shadow: none !important;
      transform: none !important;
      background: transparent !important;
      background-color: transparent !important;
      
      .progress-bar-bg {
        background-color: rgba(255, 255, 255, 0.3);
        box-shadow: 0 0 15px rgba(56, 189, 248, 0.6);
      }
      
      .progress-bar-fill::after {
        content: '';
        position: absolute;
        right: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: #38bdf8;
        box-shadow: 0 0 10px #38bdf8;
      }
    }
  }

  .time-text {
    color: #cbd5e1;
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    width: 90px;
    text-align: center;
  }

  .progress-bar-wrapper {
    flex-grow: 1;
    padding: 10px 0;
  }

  .progress-bar-bg {
    height: 6px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
    position: relative;
  }

  .progress-bar-fill {
    height: 100%;
    background-color: #0ea5e9;
    border-radius: 9999px;
    position: relative; /* Enables absolute handle positioning relative to fill width */
  }

  .btn-player-playpause {
    pointer-events: auto;
    background-color: rgba(15, 23, 42, 0.75);
    border: 2px solid rgba(255, 255, 255, 0.2);
    color: #ffffff;
    width: 76px;
    height: 76px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    
    .playpause-icon {
      width: 36px;
      height: 36px;
      fill: currentColor;
    }

    &:global(.focused) {
      background-color: #0ea5e9;
      border-color: #38bdf8;
      box-shadow: 0 0 25px rgba(14, 165, 233, 0.5);
      transform: scale(1.1);
    }
  }

  .video-error-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(15, 23, 42, 0.95);
    border: 2px solid #ef4444;
    border-radius: 16px;
    padding: 24px 40px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    text-align: center;
    pointer-events: none;
    
    .error-title {
      color: #ef4444;
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .error-msg {
      color: #cbd5e1;
      font-size: 14px;
      font-weight: 400;
    }
  }
</style>
