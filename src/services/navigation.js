import { writable, get } from 'svelte/store';

// Reactive Stores for UI binding
export const focusIndex = writable(0);
export const focusableElements = writable([]);

let elements = [];

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
  
  // Register Tizen back keys if first element mounted
  if (elements.length === 1) {
    registerTizenKeys();
  }

  // Automatically toggle 'focused' class on the DOM node
  function updateFocusClass() {
    const els = get(focusableElements);
    const index = get(focusIndex);
    if (els[index] === node) {
      node.classList.add('focused');
    } else {
      node.classList.remove('focused');
    }
  }

  const unsubscribeIndex = focusIndex.subscribe(updateFocusClass);
  const unsubscribeElements = focusableElements.subscribe(updateFocusClass);

  return {
    destroy() {
      unsubscribeIndex();
      unsubscribeElements();

      // Remove node from tracking array
      elements = elements.filter(el => el !== node);
      focusableElements.set(elements);

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

// Calculate spatial distance between two rectangles based on direction
function getSpatialDistance(rectA, rectB, direction) {
  const centerA = {
    x: rectA.left + rectA.width / 2,
    y: rectA.top + rectA.height / 2
  };
  const centerB = {
    x: rectB.left + rectB.width / 2,
    y: rectB.top + rectB.height / 2
  };

  let dPrimary = 0;
  let dSecondary = 0;

  switch (direction) {
    case 'LEFT':
      dPrimary = rectA.left - rectB.right;
      dSecondary = Math.abs(centerA.y - centerB.y);
      break;
    case 'RIGHT':
      dPrimary = rectB.left - rectA.right;
      dSecondary = Math.abs(centerA.y - centerB.y);
      break;
    case 'UP':
      dPrimary = rectA.top - rectB.bottom;
      dSecondary = Math.abs(centerA.x - centerB.x);
      break;
    case 'DOWN':
      dPrimary = rectB.top - rectA.bottom;
      dSecondary = Math.abs(centerA.x - centerB.x);
      break;
  }

  // Weight primary distance heavier to prioritize alignment
  return dPrimary * 2.5 + dSecondary;
}

// Global Keydown Router for Remote Control Navigation (uses Spatial Navigation)
export function handleNavigation(keyCode, event = null) {
  if (elements.length === 0) return;

  const currentIndex = get(focusIndex);
  const activeEl = elements[currentIndex];

  if (!activeEl) return;

  // Handle Enter / Click
  if (keyCode === 13) {
    activeEl.click();
    return;
  }

  // Handle Back key
  if (keyCode === 10009) {
    if (event) event.preventDefault();
    if (window.location.hash && window.location.hash !== '#dashboard') {
      window.location.hash = 'dashboard';
    } else {
      exitApp();
    }
    return;
  }

  // Map keyCode to direction
  let direction = '';
  if (keyCode === 37) direction = 'LEFT';
  else if (keyCode === 39) direction = 'RIGHT';
  else if (keyCode === 38) direction = 'UP';
  else if (keyCode === 40) direction = 'DOWN';

  if (!direction) return;

  const activeRect = activeEl.getBoundingClientRect();
  let bestCandidate = null;
  let minDistance = Infinity;

  for (let i = 0; i < elements.length; i++) {
    const candidate = elements[i];
    if (candidate === activeEl) continue;

    const candidateRect = candidate.getBoundingClientRect();

    // Check if candidate lies in the general direction of movement
    let isInDirection = false;
    switch (direction) {
      case 'LEFT':
        isInDirection = candidateRect.right <= activeRect.left + 5;
        break;
      case 'RIGHT':
        isInDirection = candidateRect.left >= activeRect.right - 5;
        break;
      case 'UP':
        isInDirection = candidateRect.bottom <= activeRect.top + 5;
        break;
      case 'DOWN':
        isInDirection = candidateRect.top >= activeRect.bottom - 5;
        break;
    }

    if (isInDirection) {
      const distance = getSpatialDistance(activeRect, candidateRect, direction);
      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    }
  }

  // Transition focus if candidate was found
  if (bestCandidate) {
    const nextIndex = elements.indexOf(bestCandidate);
    if (nextIndex !== -1) {
      focusIndex.set(nextIndex);
      updateScroll();
    }
  }
}
