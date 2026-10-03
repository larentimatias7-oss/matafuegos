// c:\antigravity\matafuegos\src\utils\offlineQueue.js
// Manejo de almacenamiento local offline con IndexedDB y compresión de fotos

const DB_NAME = 'milicic_matafuegos_offline';
const DB_VERSION = 2;
const STORE_NAME = 'pending_inspections';
const QUARANTINE_STORE = 'quarantine_inspections';

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
      if (!db.objectStoreNames.contains(QUARANTINE_STORE)) {
        db.createObjectStore(QUARANTINE_STORE, { keyPath: 'id', autoIncrement: true });
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
 * Mueve inspecciones rechazadas/cuarentena al almacén de cuarentena para revisión del supervisor
 */
export async function quarantineInspections(items, reason = 'Usuario desactivado o no autorizado') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME, QUARANTINE_STORE], 'readwrite');
    const pendingStore = tx.objectStore(STORE_NAME);
    const quarantineStore = tx.objectStore(QUARANTINE_STORE);

    for (const item of items) {
      const quarantinedItem = {
        ...item,
        quarantined_at: new Date().toISOString(),
        quarantine_reason: reason
      };
      quarantineStore.add(quarantinedItem);
      if (item.id) {
        pendingStore.delete(item.id);
      }
    }

    tx.oncomplete = () => resolve(items.length);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Obtiene inspecciones en cuarentena
 */
export async function getQuarantinedInspections() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(QUARANTINE_STORE, 'readonly');
      const store = tx.objectStore(QUARANTINE_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error leyendo cuarentena:', err);
    return [];
  }
}

/**
 * Intenta sincronizar todos los registros pendientes con el backend
 * Revalida sesión previamente. Si el usuario fue desactivado, cuarentena las inspecciones.
 */
export async function syncOfflineInspections(onItemSynced) {
  const pending = await getOfflineInspections();
  if (!pending.length) return { synced: 0, failed: 0, status: 'EMPTY' };

  // Revalidar sesión antes de sincronizar
  try {
    const authCheck = await fetch('/api/auth/me', { credentials: 'include' });
    if (!authCheck.ok) {
      const authData = await authCheck.json().catch(() => ({}));
      const reason = authData.error || 'Sesión no válida o usuario inactivo';
      await quarantineInspections(pending, reason);
      return {
        synced: 0,
        failed: pending.length,
        status: 'AUTH_REJECTED',
        error: reason,
        quarantined: pending.length
      };
    }
  } catch (err) {
    // Si la red sigue caída, no reintentamos envío
    return { synced: 0, failed: pending.length, status: 'OFFLINE_RETRY' };
  }

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const { id, created_at_local, ...payload } = item;
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok || res.status === 409) {
        await removeOfflineInspection(id);
        synced++;
        if (onItemSynced) onItemSynced(item);
      } else if (res.status === 401 || res.status === 403) {
        // Usuario revocado a mitad del envío
        const remaining = pending.slice(synced);
        await quarantineInspections(remaining, 'Acceso revocado durante la sincronización');
        return {
          synced,
          failed: remaining.length,
          status: 'AUTH_REJECTED',
          error: 'Acceso revocado durante la sincronización',
          quarantined: remaining.length
        };
      } else {
        failed++;
      }
    } catch (err) {
      console.warn('Fallo sync de registro offline:', err);
      failed++;
    }
  }

  return { synced, failed, total: pending.length, status: 'COMPLETED' };
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
