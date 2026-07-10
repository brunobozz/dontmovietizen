// Storage Abstraction Layer for dontmovietizen
// Automatically switches between Tizen Filesystem (on TV) and IndexedDB Virtual Filesystem (on PC)

const DB_NAME = "dontmovietizen_fs";
const STORE_NAME = "files";
let dbInstance = null;

// Helper to check if Tizen API is available
const isTizen = typeof window !== "undefined" && typeof window.tizen !== "undefined" && window.tizen.filesystem;

// Initialize IndexedDB database for PC fallback
function initDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (event) => {
      console.error("FS Database open error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "filename" });
      }
    };
  });
}

// ==========================================
// TIZEN FILESYSTEM IMPLEMENTATION
// ==========================================
function resolveTizenDir() {
  return new Promise((resolve, reject) => {
    window.tizen.filesystem.resolve(
      "wgt-private",
      (dir) => resolve(dir),
      (err) => {
        console.error("Tizen filesystem resolve error:", err);
        reject(err);
      },
      "rw"
    );
  });
}

// ==========================================
// PUBLIC STORAGE API
// ==========================================

export async function fileExists(filename) {
  if (isTizen) {
    try {
      const dir = await resolveTizenDir();
      return new Promise((resolve) => {
        dir.resolve(
          filename,
          () => resolve(true), // File exists
          () => resolve(false) // File does not exist
        );
      });
    } catch (e) {
      return false;
    }
  } else {
    const db = await initDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(filename);
      req.onsuccess = () => resolve(req.result !== undefined);
      req.onerror = () => resolve(false);
    });
  }
}

export async function writeFile(filename, text) {
  if (isTizen) {
    const dir = await resolveTizenDir();
    return new Promise((resolve, reject) => {
      // Delete existing file first to overwrite
      try {
        dir.resolve(
          filename,
          (file) => {
            dir.deleteFile(
              file.fullPath,
              () => createAndWrite(),
              (err) => reject(err)
            );
          },
          () => createAndWrite() // If resolving fails, file doesn't exist, so just create it
        );
      } catch (e) {
        createAndWrite();
      }

      function createAndWrite() {
        const file = dir.createFile(filename);
        file.openStream(
          "w",
          (stream) => {
            stream.write(text);
            stream.close();
            resolve();
          },
          (err) => reject(err),
          "UTF-8"
        );
      }
    });
  } else {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ filename, content: text });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export async function appendFile(filename, text) {
  if (isTizen) {
    const dir = await resolveTizenDir();
    return new Promise((resolve, reject) => {
      let file;
      try {
        dir.resolve(
          filename,
          (resolvedFile) => {
            file = resolvedFile;
            openAndAppend();
          },
          () => {
            file = dir.createFile(filename);
            openAndAppend();
          }
        );
      } catch (e) {
        file = dir.createFile(filename);
        openAndAppend();
      }

      function openAndAppend() {
        file.openStream(
          "a",
          (stream) => {
            stream.write(text);
            stream.close();
            resolve();
          },
          (err) => reject(err),
          "UTF-8"
        );
      }
    });
  } else {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(filename);
      
      getReq.onsuccess = () => {
        const currentContent = getReq.result ? getReq.result.content : "";
        const putReq = store.put({ filename, content: currentContent + text });
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      
      getReq.onerror = () => reject(getReq.error);
    });
  }
}

export async function readFile(filename) {
  if (isTizen) {
    const dir = await resolveTizenDir();
    return new Promise((resolve, reject) => {
      dir.resolve(
        filename,
        (file) => {
          file.openStream(
            "r",
            (stream) => {
              const content = stream.read(file.fileSize);
              stream.close();
              resolve(content);
            },
            (err) => reject(err),
            "UTF-8"
          );
        },
        (err) => reject(err)
      );
    });
  } else {
    const db = await initDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(filename);
      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result.content);
        } else {
          reject(new Error(`File not found: ${filename}`));
        }
      };
      req.onerror = () => reject(req.error);
    });
  }
}

export async function deleteFile(filename) {
  if (isTizen) {
    try {
      const dir = await resolveTizenDir();
      return new Promise((resolve) => {
        try {
          dir.resolve(
            filename,
            (file) => {
              try {
                dir.deleteFile(
                  file.fullPath,
                  () => resolve(true),
                  (err) => {
                    console.warn("deleteFile error:", err);
                    resolve(false);
                  }
                );
              } catch (e) {
                console.warn("deleteFile exception:", e);
                resolve(false);
              }
            },
            () => resolve(true) // If it doesn't exist, consider it successfully deleted
          );
        } catch (e) {
          console.warn("dir.resolve exception:", e);
          resolve(false);
        }
      });
    } catch (e) {
      console.error("Tizen deleteFile exception:", e);
      return false;
    }
  } else {
    const db = await initDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(filename);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  }
}
