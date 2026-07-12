// favorites.js
// Svelte global store and services for persistent favorites management

import { writable, get } from 'svelte/store';

// Load initial favorites from localStorage
const initialFavorites = (() => {
  try {
    const saved = localStorage.getItem('favorites_list');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to parse favorites from localStorage:", e);
    return [];
  }
})();

export const favoritesStore = writable(initialFavorites);

// Save to localStorage automatically on changes
favoritesStore.subscribe((value) => {
  try {
    localStorage.setItem('favorites_list', JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save favorites to localStorage:", e);
  }
});

// Add item to favorites (always prepended at the beginning)
export function addFavorite(item) {
  favoritesStore.update((list) => {
    // Check if already exists to prevent duplicates (match by url)
    const filtered = list.filter(x => x.url !== item.url);
    // Standardize object structure
    const favItem = {
      name: item.name,
      category: item.category,
      logo: item.logo,
      url: item.url,
      type: item.type
    };
    return [favItem, ...filtered];
  });
}

// Remove item from favorites
export function removeFavorite(itemUrl) {
  favoritesStore.update((list) => {
    return list.filter(x => x.url !== itemUrl);
  });
}

// Check if item is favorited
export function isFavorited(itemUrl, list) {
  if (!list) list = get(favoritesStore);
  return list.some(x => x.url === itemUrl);
}
