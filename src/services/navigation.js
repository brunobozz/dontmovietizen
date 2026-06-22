import { writable, get } from 'svelte/store';

// Reactive Stores for UI binding
export const focusIndex = writable(0);
export const focusableElements = writable([]);

let elements = [];
let contentCols = 6;

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

    // Edge Scroll fine-tuning calculations (only for content area, sidebar does not scroll)
    if (!activeEl.classList.contains('sidebar-item')) {
      const rect = activeEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const screenCenter = windowHeight / 2;
      const offset = elementCenter - screenCenter;

      window.scrollBy({
        top: offset,
        behavior: "smooth",
      });
    }
  }, 10);
}

// Calculate the columns of the content grid dynamically (excluding sidebar items)
function calculateGrid() {
  const contentEls = elements.filter(el => !el.classList.contains('sidebar-item'));
  if (contentEls.length === 0) {
    contentCols = 1;
    return;
  }

  // Get top offset of the first content element
  const firstRowTop = contentEls[0].getBoundingClientRect().top;
  let detectedCols = 0;

  for (let i = 0; i < contentEls.length; i++) {
    const top = contentEls[i].getBoundingClientRect().top;
    if (Math.abs(top - firstRowTop) < 5) {
      detectedCols++;
    } else {
      break;
    }
  }

  contentCols = detectedCols || 1;
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

// Global Keydown Router for Remote Control Navigation (supports Sidebar <-> Content Panels)
export function handleNavigation(keyCode, event = null) {
  if (elements.length === 0) return;

  calculateGrid();

  const currentIndex = get(focusIndex);
  const activeEl = elements[currentIndex];

  if (!activeEl) return;

  const sidebarEls = elements.filter(el => el.classList.contains('sidebar-item'));
  const sidebarCount = sidebarEls.length;
  const contentEls = elements.filter(el => !el.classList.contains('sidebar-item'));

  const isSidebar = activeEl.classList.contains('sidebar-item');

  switch (keyCode) {
    case 37: // LEFT
      if (isSidebar) {
        // Do nothing, leftmost edge of screen
        return;
      } else {
        const contentIndex = currentIndex - sidebarCount;
        // If at leftmost column of grid, transition back to Sidebar
        if (contentIndex % contentCols === 0) {
          // Focus the sidebar item corresponding to the active page
          let targetSidebarIndex = 0;
          const hash = window.location.hash;
          if (hash === '#movies') targetSidebarIndex = 1;
          else if (hash === '#tvshows') targetSidebarIndex = 2;
          
          focusIndex.set(targetSidebarIndex);
          updateScroll();
        } else {
          focusIndex.set(currentIndex - 1);
          updateScroll();
        }
      }
      break;

    case 39: // RIGHT
      if (isSidebar) {
        // Transition from Sidebar into the Content Panel
        if (contentEls.length > 0) {
          focusIndex.set(sidebarCount); // Focus first content element
          updateScroll();
        }
      } else {
        const contentIndex = currentIndex - sidebarCount;
        if (contentIndex % contentCols !== contentCols - 1 && currentIndex < elements.length - 1) {
          focusIndex.set(currentIndex + 1);
          updateScroll();
        }
      }
      break;

    case 38: // UP
      if (isSidebar) {
        // Vertical navigation inside Sidebar
        if (currentIndex > 0) {
          focusIndex.set(currentIndex - 1);
          updateScroll();
        }
      } else {
        const contentIndex = currentIndex - sidebarCount;
        if (contentIndex - contentCols >= 0) {
          focusIndex.set(currentIndex - contentCols);
          updateScroll();
        }
      }
      break;

    case 40: // DOWN
      if (isSidebar) {
        // Vertical navigation inside Sidebar
        if (currentIndex < sidebarCount - 1) {
          focusIndex.set(currentIndex + 1);
          updateScroll();
        }
      } else {
        const contentIndex = currentIndex - sidebarCount;
        if (contentIndex + contentCols < contentEls.length) {
          focusIndex.set(currentIndex + contentCols);
          updateScroll();
        }
      }
      break;

    case 13: // ENTER (Select)
      activeEl.click();
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
