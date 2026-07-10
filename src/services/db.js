const DB_NAME = "dontmovietizen_db";
const DB_VERSION = 1;

let dbInstance = null;
let cachedItems = null;

export function initDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database open error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Object store for M3U playlist items
      if (!db.objectStoreNames.contains("playlist_items")) {
        const itemStore = db.createObjectStore("playlist_items", { keyPath: "url" });
        itemStore.createIndex("listUrl", "listUrl", { unique: false });
        itemStore.createIndex("type", "type", { unique: false });
        itemStore.createIndex("category", "category", { unique: false });
        itemStore.createIndex("type_category", ["type", "category"], { unique: false });
      }

      // Object store for Categories (pre-aggregated for instant loading on TV)
      if (!db.objectStoreNames.contains("categories")) {
        const catStore = db.createObjectStore("categories", { keyPath: "id" });
        catStore.createIndex("listUrl", "listUrl", { unique: false });
        catStore.createIndex("type", "type", { unique: false });
      }
    };
  });
}

/**
 * Saves a chunk of playlist items and categories in a single transaction.
 */
export function saveChunk(items, categories) {
  cachedItems = null; // Invalidate cache on new imports
  return initDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["playlist_items", "categories"], "readwrite");

      transaction.onerror = (e) => {
        console.error("Chunk transaction error:", e.target.error);
        reject(e.target.error);
      };

      transaction.oncomplete = () => {
        resolve();
      };

      const itemStore = transaction.objectStore("playlist_items");
      const catStore = transaction.objectStore("categories");

      // Save items
      for (const item of items) {
        itemStore.put(item);
      }

      // Save categories
      for (const cat of categories) {
        catStore.put(cat);
      }
    });
  });
}

/**
 * Deletes all playlist items and categories associated with a list URL.
 */
export function deleteListItems(listUrl) {
  cachedItems = null; // Invalidate cache on deletion
  return initDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["playlist_items", "categories"], "readwrite");

      transaction.onerror = (e) => {
        console.error("Deletion transaction error:", e.target.error);
        reject(e.target.error);
      };

      transaction.oncomplete = () => {
        resolve();
      };

      const itemStore = transaction.objectStore("playlist_items");
      const catStore = transaction.objectStore("categories");

      // Delete items by listUrl index
      const itemIndex = itemStore.index("listUrl");
      const itemRequest = itemIndex.openCursor(IDBKeyRange.only(listUrl));
      itemRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          itemStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      // Delete categories by listUrl index
      const catIndex = catStore.index("listUrl");
      const catRequest = catIndex.openCursor(IDBKeyRange.only(listUrl));
      catRequest.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          catStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    });
  });
}

/**
 * Returns list of categories for a specific type (live, movie, series).
 */
export function getCategories(type) {
  return initDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("categories", "readonly");
      const store = transaction.objectStore("categories");
      const index = store.index("type");
      const request = index.getAll(IDBKeyRange.only(type));

      request.onerror = (e) => reject(e.target.error);
      request.onsuccess = () => {
        const results = request.result || [];
        // Deduplicate category names (in case multiple lists have the same category)
        const uniqueNames = [...new Set(results.map(c => c.name))].sort();
        resolve(uniqueNames);
      };
    });
  });
}

/**
 * Returns items matching the specified type and category.
 */
export function getItemsByCategory(type, category, limit = 50, offset = 0) {
  return initDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("playlist_items", "readonly");
      const store = transaction.objectStore("playlist_items");
      const index = store.index("type_category");
      
      const keyRange = IDBKeyRange.only([type, category]);
      const request = index.openCursor(keyRange);
      const items = [];
      let cursorCount = 0;
      let hasAdvanced = false;

      request.onerror = (e) => reject(e.target.error);
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        
        if (!cursor) {
          resolve(items);
          return;
        }

        // Handle offset pagination
        if (offset > 0 && !hasAdvanced) {
          hasAdvanced = true;
          cursor.advance(offset);
          return;
        }

        items.push(cursor.value);
        cursorCount++;

        if (cursorCount < limit) {
          cursor.continue();
        } else {
          resolve(items);
        }
      };
    });
  });
}

/**
 * Returns all playlist items in the database for in-memory caching and fast search.
 */
export function getAllItems() {
  if (cachedItems) {
    return Promise.resolve(cachedItems);
  }

  return initDb().then((db) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("playlist_items", "readonly");
      const store = transaction.objectStore("playlist_items");
      const request = store.getAll();

      request.onerror = (e) => reject(e.target.error);
      request.onsuccess = () => {
        cachedItems = request.result || [];
        resolve(cachedItems);
      };
    });
  });
}
