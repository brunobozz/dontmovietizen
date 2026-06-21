import { writable, get } from 'svelte/store';

// Reactive Stores for UI binding
export const focusIndex = writable(0);
export const focusableElements = writable([]);

let elements = [];
let cols = 6;

// Register physical Tizen remote keys (like Back)
export function registerTizenKeys() {
  if (window.tizen && tizen.tvinputdevice) {
    try {
      tizen.tvinputdevice.registerKey("Back");
    } catch (err) {
      console.warn("Tizen key registration failed:", err);
    }
  }
}

// Exit app cleanly on Samsung Tizen
export function exitApp() {
  if (window.tizen) {
    try {
      tizen.application.getCurrentApplication().exit();
    } catch (err) {
      console.error("Exit error:", err);
    }
  } else {
    console.log("Exit fallback");
    if (confirm("Deseja fechar o app?")) {
      window.close();
    }
  }
}

// Update scroll alignment and edge screen correction
export function updateScroll() {
  // Wait slightly to ensure DOM has updated styles
  setTimeout(() => {
    const currentIndex = get(focusIndex);
    const activeEl = elements[currentIndex];

    if (!activeEl) return;

    activeEl.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center",
    });

    // Edge Scroll fine-tuning calculations
    const rect = activeEl.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const screenCenter = windowHeight / 2;
    const offset = elementCenter - screenCenter;

    window.scrollBy({
      top: offset,
      behavior: "smooth",
    });
  }, 10);
}

// Calculate the columns of the active grid dynamically
function calculateGrid() {
  if (elements.length === 0) {
    cols = 1;
    return;
  }

  // Get top offset of the first element
  const firstRowTop = elements[0].getBoundingClientRect().top;
  let detectedCols = 0;

  for (let i = 0; i < elements.length; i++) {
    const top = elements[i].getBoundingClientRect().top;
    // If the top coordinate is within 5px, it's on the same row
    if (Math.abs(top - firstRowTop) < 5) {
      detectedCols++;
    } else {
      break;
    }
  }

  cols = detectedCols || 1;
}

// Svelte custom directive (action) to auto-register focusable elements
export function focusable(node) {
  // Add node to tracking array
  elements.push(node);

  // Sort elements by document position to prevent rendering order race conditions
  elements.sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    if (position & 4) return -1; // DOCUMENT_POSITION_FOLLOWING
    if (position & 2) return 1;  // DOCUMENT_POSITION_PRECEDING
    return 0;
  });

  focusableElements.set(elements);
  calculateGrid();
  
  // Register Tizen back keys if first element mounted
  if (elements.length === 1) {
    registerTizenKeys();
  }

  return {
    destroy() {
      // Remove node from tracking array
      elements = elements.filter(el => el !== node);
      focusableElements.set(elements);
      calculateGrid();

      // Reset focus index if elements are empty (page transition) or index is out of bounds
      if (elements.length === 0) {
        focusIndex.set(0);
      } else {
        focusIndex.update(idx => {
          if (idx >= elements.length) {
            return Math.max(0, elements.length - 1);
          }
          return idx;
        });
      }
    }
  };
}

// Global Keydown Router for Remote Control Navigation
export function handleNavigation(keyCode, event = null) {
  if (elements.length === 0) return;

  // Calculate grid columns dynamically on keypress to ensure accurate layout info
  calculateGrid();

  const currentIndex = get(focusIndex);

  switch (keyCode) {
    case 37: // LEFT
      if (currentIndex % cols !== 0) {
        focusIndex.set(currentIndex - 1);
        updateScroll();
      }
      break;

    case 39: // RIGHT
      if (currentIndex % cols !== cols - 1 && currentIndex < elements.length - 1) {
        focusIndex.set(currentIndex + 1);
        updateScroll();
      }
      break;

    case 38: // UP
      if (currentIndex - cols >= 0) {
        focusIndex.set(currentIndex - cols);
        updateScroll();
      }
      break;

    case 40: // DOWN
      if (currentIndex + cols < elements.length) {
        focusIndex.set(currentIndex + cols);
        updateScroll();
      }
      break;

    case 13: // ENTER (Select)
      const activeEl = elements[currentIndex];
      if (activeEl) {
        activeEl.click();
      }
      break;

    case 10009: // BACK (Tizen)
      if (event) event.preventDefault();
      if (window.location.hash && window.location.hash !== '#dashboard') {
        window.location.hash = 'dashboard';
      } else {
        exitApp();
      }
      break;
  }
}
