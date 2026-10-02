// c:\antigravity\matafuegos\src\utils\offlineQueue.js
// Manejo de almacenamiento local offline con IndexedDB y compresión de fotos

const DB_NAME = 'milicic_matafuegos_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_inspections';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB no soportado en este navegador'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Guarda una inspección en la cola local si no hay conexión
 */
export async function enqueueOfflineInspection(inspectionData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      ...inspectionData,
      created_at_local: new Date().toISOString()
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Obtiene todas las inspecciones pendientes de sincronizar
 */
export async function getOfflineInspections() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error leyendo IndexedDB offline:', err);
    return [];
  }
}

/**
 * Elimina una inspección sincronizada de la cola
 */
export async function removeOfflineInspection(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Intenta sincronizar todos los registros pendientes con el backend
 */
export async function syncOfflineInspections(onItemSynced) {
  const pending = await getOfflineInspections();
  if (!pending.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const { id, created_at_local, ...payload } = item;
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 409) {
        await removeOfflineInspection(id);
        synced++;
        if (onItemSynced) onItemSynced(item);
      } else {
        failed++;
      }
    } catch (err) {
      console.warn('Fallo sync de registro offline:', err);
      failed++;
    }
  }

  return { synced, failed, total: pending.length };
}

/**
 * Comprime una imagen en el cliente usando HTML5 Canvas antes de enviar/encolar
 * Reduce el consumo de datos móviles a los operarios en campo
 */
export function compressImageFile(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return resolve(null);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 JPEG optimizado
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
