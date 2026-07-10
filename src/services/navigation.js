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

    // Helper to find scrollable parent container
    function getScrollParent(node) {
      if (node == null) return null;
      if (node.scrollHeight > node.clientHeight && 
          (window.getComputedStyle(node).overflowY === 'auto' || 
           window.getComputedStyle(node).overflowY === 'scroll' ||
           node.classList.contains('scroll-container'))) {
        return node;
      }
      return getScrollParent(node.parentNode);
    }

    const container = getScrollParent(activeEl);

    if (container) {
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate active element top relative to the container scroll context
      const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
      
      // Center the item vertically in the container
      const targetScrollTop = relativeTop - (container.clientHeight / 2) + (activeEl.clientHeight / 2);
      
      if (container.scrollTo) {
        container.scrollTo({
          top: targetScrollTop,
          behavior: 'smooth'
        });
      } else {
        container.scrollTop = targetScrollTop;
      }
    } else {
      // Fallback
      activeEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
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
      // If it is an input/textarea, trigger native browser focus to show TV virtual keyboard
      if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
        node.focus();
      }
    } else {
      node.classList.remove('focused');
      // Trigger native blur to hide TV virtual keyboard when losing focus
      if (node.tagName === "INPUT" || node.tagName === "TEXTAREA") {
        node.blur();
      }
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

// Helper to get untransformed bounding rect (specifically removing scale factor)
function getUnscaledClientRect(el) {
  const rect = el.getBoundingClientRect();
  try {
    const style = window.getComputedStyle(el);
    const transform = style.transform || style.webkitTransform;
    if (transform && transform !== 'none') {
      if (transform.startsWith('matrix3d(')) {
        const values = transform.slice(9, -1).split(',');
        const scaleX = parseFloat(values[0]);
        const scaleY = parseFloat(values[5]);
        if (!isNaN(scaleX) && !isNaN(scaleY) && scaleX > 0 && scaleY > 0) {
          const normalWidth = rect.width / scaleX;
          const normalHeight = rect.height / scaleY;
          const dx = (rect.width - normalWidth) / 2;
          const dy = (rect.height - normalHeight) / 2;
          return {
            left: rect.left + dx,
            right: rect.right - dx,
            top: rect.top + dy,
            bottom: rect.bottom - dy,
            width: normalWidth,
            height: normalHeight
          };
        }
      } else if (transform.startsWith('matrix(')) {
        const values = transform.slice(7, -1).split(',');
        const scaleX = parseFloat(values[0]);
        const scaleY = parseFloat(values[3]);
        if (!isNaN(scaleX) && !isNaN(scaleY) && scaleX > 0 && scaleY > 0) {
          const normalWidth = rect.width / scaleX;
          const normalHeight = rect.height / scaleY;
          const dx = (rect.width - normalWidth) / 2;
          const dy = (rect.height - normalHeight) / 2;
          return {
            left: rect.left + dx,
            right: rect.right - dx,
            top: rect.top + dy,
            bottom: rect.bottom - dy,
            width: normalWidth,
            height: normalHeight
          };
        }
      }
    }
  } catch (e) {
    console.warn("Failed to get unscaled client rect:", e);
  }
  return rect;
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

  // If focused on an input, let standard text editing handle left/right arrow keys
  const isInput = activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA";
  if (isInput && (keyCode === 37 || keyCode === 39)) {
    return;
  }

  // Handle Enter / Click
  if (keyCode === 13) {
    activeEl.click();
    return;
  }

  // Handle Back key (10009) or Escape key (27)
  if (keyCode === 10009 || keyCode === 27) {
    if (event) event.preventDefault();
    
    // Check if player is open in DOM
    const isPlayerOpen = document.querySelector('.player-container') !== null;
    if (isPlayerOpen) {
      window.dispatchEvent(new CustomEvent('close-player'));
      return;
    }

    // Check if modal is open in DOM
    const isModalOpen = document.querySelector('.modal-container') !== null;
    if (isModalOpen) {
      window.dispatchEvent(new CustomEvent('close-modal'));
      return;
    }

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

  const isActiveSidebar = activeEl.classList.contains('sidebar-item');

  // If navigating LEFT from sidebar, do nothing (leftmost edge)
  if (direction === 'LEFT' && isActiveSidebar) {
    return;
  }

  // Determine candidate filters
  let allowSidebar = false;
  let allowContent = false;

  if (direction === 'UP' || direction === 'DOWN') {
    // Prevent crossing boundary on UP/DOWN
    if (isActiveSidebar) {
      allowSidebar = true;
    } else {
      allowContent = true;
    }
  } else if (direction === 'RIGHT') {
    // RIGHT always targets content (from sidebar or within content)
    allowContent = true;
  } else if (direction === 'LEFT') {
    // LEFT from content: check if there is any other content to the left of activeEl
    const activeRect = getUnscaledClientRect(activeEl);
    let hasContentOnLeft = false;

    for (let i = 0; i < elements.length; i++) {
      const candidate = elements[i];
      if (candidate === activeEl) continue;
      
      const isCandidateSidebar = candidate.classList.contains('sidebar-item');
      if (isCandidateSidebar) continue;

      const candidateRect = getUnscaledClientRect(candidate);
      // Candidate is to the left of active element
      if (candidateRect.right <= activeRect.left + 5) {
        hasContentOnLeft = true;
        break;
      }
    }

    if (hasContentOnLeft) {
      allowContent = true;
    } else {
      allowSidebar = true;
    }
  }

  const activeRect = getUnscaledClientRect(activeEl);
  let bestCandidate = null;
  let minDistance = Infinity;

  const isModalOpen = document.querySelector('.modal-container') !== null;
  const isPlayerOpen = document.querySelector('.player-container') !== null;

  for (let i = 0; i < elements.length; i++) {
    const candidate = elements[i];
    if (candidate === activeEl) continue;

    // Focus trap for modal: if modal is open, candidate must be inside modal
    if (isModalOpen && !candidate.closest('.modal-container')) {
      continue;
    }

    // Focus trap for player: if player is open, candidate must be inside player
    if (isPlayerOpen && !candidate.closest('.player-container')) {
      continue;
    }

    const isCandidateSidebar = candidate.classList.contains('sidebar-item');
    if (allowSidebar && !isCandidateSidebar) continue;
    if (allowContent && isCandidateSidebar) continue;

    const candidateRect = getUnscaledClientRect(candidate);

    // Check if candidate lies in the general direction of movement
    let isInDirection = false;
    switch (direction) {
      case 'LEFT':
        isInDirection = candidateRect.right <= activeRect.left + 20;
        break;
      case 'RIGHT':
        isInDirection = candidateRect.left >= activeRect.right - 20;
        break;
      case 'UP':
        isInDirection = candidateRect.bottom <= activeRect.top + 20;
        break;
      case 'DOWN':
        isInDirection = candidateRect.top >= activeRect.bottom - 20;
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

export function focusElementByDataAttribute(name, val) {
  const idx = elements.findIndex(el => el.getAttribute(name) === val);
  if (idx !== -1) {
    focusIndex.set(idx);
    updateScroll();
  }
}

let savedFocusIndex = 0;

export function saveFocus() {
  savedFocusIndex = get(focusIndex);
}

export function restoreFocus() {
  focusIndex.set(savedFocusIndex);
  updateScroll();
}

export function focusModal() {
  // Find the first focusable element inside the modal container
  const modalEl = document.querySelector('.modal-container .focusable') || document.querySelector('.modal-container [data-focusable="true"]');
  if (modalEl) {
    const idx = elements.indexOf(modalEl);
    if (idx !== -1) {
      focusIndex.set(idx);
      updateScroll();
    }
  }
}
