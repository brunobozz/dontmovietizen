import { writable, get } from 'svelte/store';

// Reactive Stores for UI binding
export const focusIndex = writable(0);
export const focusableElements = writable([]);

let elements = [];
let lastActivePageIndex = -1;
let lastFocusedEpisodeEl = null;
let lastPageFocusMap = {};

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

  // Auto-focus modal or player element immediately upon mount if active focus is currently outside
  const isModalOpen = document.querySelector('.modal-container') !== null;
  const isPlayerOpen = document.querySelector('.player-container') !== null;
  if (isModalOpen || isPlayerOpen) {
    const activeIndex = get(focusIndex);
    const activeEl = elements[activeIndex];
    const outsideModal = isModalOpen && (!activeEl || !activeEl.closest('.modal-container'));
    const outsidePlayer = isPlayerOpen && (!activeEl || !activeEl.closest('.player-container'));

    if (outsideModal || outsidePlayer) {
      const targetClass = isPlayerOpen ? '.player-container' : '.modal-container';
      const firstInsideIndex = elements.findIndex(el => el.closest(targetClass));
      if (firstInsideIndex !== -1) {
        focusIndex.set(firstInsideIndex);
        updateScroll();
      }
    }
  }
  
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
      
      if (node.getAttribute('data-type') === 'episode-item') {
        lastFocusedEpisodeEl = node;
      }

      // Save last active content element index (ignore sidebar, modals, players)
      const isContent = !node.classList.contains('sidebar-item') && 
                        !node.closest('.modal-container') && 
                        !node.closest('.player-container');
      if (isContent) {
        lastActivePageIndex = index;
        const pageEl = node.closest('.page-container');
        if (pageEl) {
          const pageId = pageEl.getAttribute('data-page-id');
          if (pageId) {
            lastPageFocusMap[pageId] = node;
          }
        }
      }

      // Dispatch custom bubbled event for focus updates
      node.dispatchEvent(new CustomEvent('sn-focused', { bubbles: true, composed: true }));
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
        lastActivePageIndex = -1;
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

// Find the item inside a shelf that is currently aligned to the left of the screen (at scroll position)
function getFirstVisibleItem(shelfContainer) {
  const scrollContainer = shelfContainer.querySelector(".scroll-container");
  if (!scrollContainer) return null;

  const items = Array.from(scrollContainer.querySelectorAll(".focusable"));
  if (items.length === 0) return null;

  let bestItem = items[0];
  let minDiff = Infinity;
  // Account for the 40px left padding offset of the shelf
  const targetOffset = scrollContainer.scrollLeft + 40;

  for (let i = 0; i < items.length; i++) {
    const wrapper = items[i].closest(".shelf-item-wrapper");
    if (wrapper) {
      const diff = Math.abs(wrapper.offsetLeft - targetOffset);
      if (diff < minDiff) {
        minDiff = diff;
        bestItem = items[i];
      }
    }
  }

  return bestItem;
}

// Helper to scroll an inactive element into view (e.g. active season tab)
function scrollElementIntoView(el) {
  if (!el) return;
  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    const parent = el.parentNode;
    if (parent) {
      parent.scrollTop = el.offsetTop - (parent.clientHeight / 2) + (el.clientHeight / 2);
    }
  }
}

// Global Keydown Router for Remote Control Navigation (uses Spatial Navigation)
export function handleNavigation(keyCode, event = null) {
  if (elements.length === 0) return;

  const isModalOpen = document.querySelector('.modal-container') !== null;
  const isPlayerOpen = document.querySelector('.player-container') !== null;

  const currentIndex = get(focusIndex);
  let activeEl = elements[currentIndex];

  // Snap focus back into modal/player if activeEl is in the background
  if (isModalOpen || isPlayerOpen) {
    const targetClass = isPlayerOpen ? '.player-container' : '.modal-container';
    if (!activeEl || !activeEl.closest(targetClass)) {
      const firstInsideIndex = elements.findIndex(el => el.closest(targetClass));
      if (firstInsideIndex !== -1) {
        focusIndex.set(firstInsideIndex);
        updateScroll();
        if (event) event.preventDefault();
        return;
      }
    }
  }

  if (!activeEl) return;

  // If focused on an input, let standard text editing handle left/right arrow keys
  const isInput = activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA";
  if (isInput && (keyCode === 37 || keyCode === 39)) {
    return;
  }

  // Handle Enter / Click
  if (keyCode === 13) {
    const activeType = activeEl.getAttribute('data-type');
    if (activeType === 'season-btn') {
      activeEl.click();

      if (lastFocusedEpisodeEl && elements.includes(lastFocusedEpisodeEl)) {
        const targetIdx = elements.indexOf(lastFocusedEpisodeEl);
        if (targetIdx !== -1) {
          focusIndex.set(targetIdx);
          updateScroll();
          return;
        }
      }

      const firstEp = elements.find(el => el.getAttribute('data-type') === 'episode-item' && parseInt(el.getAttribute('data-index'), 10) === 0);
      if (firstEp) {
        const targetIdx = elements.indexOf(firstEp);
        if (targetIdx !== -1) {
          focusIndex.set(targetIdx);
          updateScroll();
          return;
        }
      }
      return;
    }

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

    const isActiveSidebar = activeEl.classList.contains('sidebar-item');

    // If focused on the content, pressing Back moves focus to the sidebar first!
    if (!isActiveSidebar) {
      let currentHash = window.location.hash.slice(1) || "dashboard";
      currentHash = currentHash.split('?')[0];
      if (currentHash.startsWith("live")) {
        currentHash = "live";
      }

      const sidebarEl = elements.find(el => 
        el.classList.contains('sidebar-item') && 
        el.getAttribute('data-hash') === currentHash
      );

      if (sidebarEl) {
        const targetIndex = elements.indexOf(sidebarEl);
        if (targetIndex !== -1) {
          focusIndex.set(targetIndex);
          updateScroll();
          return;
        }
      }
    }

    // If already focused on the sidebar, execute original back routing
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

  const activeType = activeEl.getAttribute('data-type');

  if (activeType === 'season-btn') {
    const index = parseInt(activeEl.getAttribute('data-index'), 10);
    const total = parseInt(activeEl.getAttribute('data-total'), 10);

    if (direction === 'UP' && index === 0) {
      if (event) event.preventDefault();
      return;
    }
    if (direction === 'DOWN' && index === total - 1) {
      if (event) event.preventDefault();
      return;
    }

    if (direction === 'UP' || direction === 'DOWN') {
      lastFocusedEpisodeEl = null;
    }
    if (direction === 'RIGHT') {
      if (event) event.preventDefault();

      if (lastFocusedEpisodeEl && elements.includes(lastFocusedEpisodeEl)) {
        const targetIdx = elements.indexOf(lastFocusedEpisodeEl);
        if (targetIdx !== -1) {
          focusIndex.set(targetIdx);
          updateScroll();
          return;
        }
      }

      const firstEp = elements.find(el => el.getAttribute('data-type') === 'episode-item' && parseInt(el.getAttribute('data-index'), 10) === 0);
      if (firstEp) {
        const targetIdx = elements.indexOf(firstEp);
        if (targetIdx !== -1) {
          focusIndex.set(targetIdx);
          updateScroll();
          return;
        }
      }
    }
  }

  if (activeType === 'episode-item') {
    const index = parseInt(activeEl.getAttribute('data-index'), 10);
    const total = parseInt(activeEl.getAttribute('data-total'), 10);

    if (direction === 'LEFT') {
      if (event) event.preventDefault();
      const activeSeasonBtn = elements.find(el => el.classList.contains('season-btn') && el.classList.contains('active'));
      if (activeSeasonBtn) {
        const targetIdx = elements.indexOf(activeSeasonBtn);
        if (targetIdx !== -1) {
          focusIndex.set(targetIdx);
          updateScroll();
          return;
        }
      }
    }

    if (direction === 'DOWN' && index === total - 1) {
      if (event) event.preventDefault();

      const activeSeasonBtn = elements.find(el => el.classList.contains('season-btn') && el.classList.contains('active'));
      if (activeSeasonBtn) {
        const seasonIdx = parseInt(activeSeasonBtn.getAttribute('data-index'), 10);
        const seasonTotal = parseInt(activeSeasonBtn.getAttribute('data-total'), 10);
        
        if (seasonIdx < seasonTotal - 1) {
          const nextSeasonBtn = elements.find(el => el.classList.contains('season-btn') && parseInt(el.getAttribute('data-index'), 10) === seasonIdx + 1);
          if (nextSeasonBtn) {
            nextSeasonBtn.click();
            scrollElementIntoView(nextSeasonBtn);

            setTimeout(() => {
              const firstEp = elements.find(el => el.getAttribute('data-type') === 'episode-item' && parseInt(el.getAttribute('data-index'), 10) === 0);
              if (firstEp) {
                const targetIdx = elements.indexOf(firstEp);
                if (targetIdx !== -1) {
                  focusIndex.set(targetIdx);
                  updateScroll();
                }
              }
            }, 60);
            return;
          }
        }
      }
      return; // Lock DOWN if no next season
    }

    if (direction === 'UP' && index === 0) {
      if (event) event.preventDefault();

      const activeSeasonBtn = elements.find(el => el.classList.contains('season-btn') && el.classList.contains('active'));
      if (activeSeasonBtn) {
        const seasonIdx = parseInt(activeSeasonBtn.getAttribute('data-index'), 10);
        
        if (seasonIdx > 0) {
          const prevSeasonBtn = elements.find(el => el.classList.contains('season-btn') && parseInt(el.getAttribute('data-index'), 10) === seasonIdx - 1);
          if (prevSeasonBtn) {
            prevSeasonBtn.click();
            scrollElementIntoView(prevSeasonBtn);

            setTimeout(() => {
              const epItems = elements.filter(el => el.getAttribute('data-type') === 'episode-item');
              if (epItems.length > 0) {
                const lastEp = epItems.reduce((max, curr) => {
                  const idx = parseInt(curr.getAttribute('data-index'), 10);
                  const maxIdx = parseInt(max.getAttribute('data-index'), 10);
                  return idx > maxIdx ? curr : max;
                }, epItems[0]);

                if (lastEp) {
                  const targetIdx = elements.indexOf(lastEp);
                  if (targetIdx !== -1) {
                    focusIndex.set(targetIdx);
                    updateScroll();
                  }
                }
              }
            }, 60);
            return;
          }
        }
      }
      return; // Lock UP if no previous season
    }
  }

  // Block navigation to the right if we are on the very last item of a Shelf
  if (direction === 'RIGHT' && activeEl.getAttribute('data-last') === 'true') {
    if (event) event.preventDefault();
    return;
  }

  const isActiveSidebar = activeEl.classList.contains('sidebar-item');

  // If navigating RIGHT from the sidebar, check if we have a saved page focus element to restore
  if (direction === 'RIGHT' && isActiveSidebar) {
    const activePageEl = document.querySelector('.page-container:not(.hidden)');
    if (activePageEl) {
      const pageId = activePageEl.getAttribute('data-page-id');
      const savedEl = lastPageFocusMap[pageId];
      if (savedEl && elements.includes(savedEl) && savedEl.offsetWidth > 0) {
        const targetIdx = elements.indexOf(savedEl);
        if (targetIdx !== -1) {
          focusIndex.set(targetIdx);
          updateScroll();
          if (event) event.preventDefault();
          return;
        }
      }
    }
  }

  // If navigating LEFT from sidebar, do nothing (leftmost edge)
  if (direction === 'LEFT' && isActiveSidebar) {
    return;
  }

  // If navigating LEFT on the very first item of a Shelf, focus the active sidebar item
  if (direction === 'LEFT' && !isActiveSidebar && activeEl.getAttribute('data-first') === 'true') {
    let currentHash = window.location.hash.slice(1) || "dashboard";
    currentHash = currentHash.split('?')[0];
    if (currentHash.startsWith("live")) {
      currentHash = "live";
    }

    const sidebarEl = elements.find(el => 
      el.classList.contains('sidebar-item') && 
      el.getAttribute('data-hash') === currentHash
    );

    if (sidebarEl) {
      const targetIndex = elements.indexOf(sidebarEl);
      if (targetIndex !== -1) {
        focusIndex.set(targetIndex);
        if (event) event.preventDefault();
        return;
      }
    }
  }

  // Handle UP/DOWN navigation between Shelf rows to focus the leftmost visible element
  if ((direction === 'UP' || direction === 'DOWN') && !isActiveSidebar) {
    const currentShelf = activeEl.closest(".shelf-container");
    if (currentShelf) {
      const shelves = Array.from(document.querySelectorAll(".shelf-container"));
      const shelfIndex = shelves.indexOf(currentShelf);
      let targetShelf = null;

      if (direction === 'DOWN') {
        targetShelf = shelves[shelfIndex + 1];
      } else if (direction === 'UP') {
        targetShelf = shelves[shelfIndex - 1];
      }

      if (targetShelf) {
        const targetItem = getFirstVisibleItem(targetShelf);
        if (targetItem) {
          const targetIndex = elements.indexOf(targetItem);
          if (targetIndex !== -1) {
            focusIndex.set(targetIndex);
            updateScroll(); // Trigger vertical scroll alignment for page container
            if (event) event.preventDefault();
            return;
          }
        }
      }
    }
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

      // Skip hidden elements (e.g. elements on hidden pages)
      if (candidate.offsetWidth === 0 && candidate.offsetHeight === 0) {
        continue;
      }
      
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

  for (let i = 0; i < elements.length; i++) {
    const candidate = elements[i];
    if (candidate === activeEl) continue;

    // Skip hidden elements (e.g. elements on hidden pages)
    if (candidate.offsetWidth === 0 && candidate.offsetHeight === 0) {
      continue;
    }

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
    let finalTarget = bestCandidate;

    // If entering the sidebar from page content, force focus to the active route's sidebar item
    if (!isActiveSidebar && bestCandidate.classList.contains('sidebar-item')) {
      let currentHash = window.location.hash.slice(1) || "dashboard";
      currentHash = currentHash.split('?')[0];
      if (currentHash.startsWith("live")) {
        currentHash = "live";
      }

      const activeRouteSidebarEl = elements.find(el => 
        el.classList.contains('sidebar-item') && 
        el.getAttribute('data-hash') === currentHash
      );
      if (activeRouteSidebarEl) {
        finalTarget = activeRouteSidebarEl;
      }
    }

    const nextIndex = elements.indexOf(finalTarget);
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
