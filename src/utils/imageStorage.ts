const DB_NAME = 'bloom-tracker-media';
const DB_VERSION = 1;
const STORE_NAME = 'meal-images';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local image storage.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open image storage.'));
  });
}

export async function saveMealImage(id: string, dataUrl: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(dataUrl, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Could not save meal image.'));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Meal image save was cancelled.'));
    });
  } finally {
    db.close();
  }
}

export async function getMealImage(id: string): Promise<string | undefined> {
  const db = await openDb();
  try {
    return await new Promise<string | undefined>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
      request.onsuccess = () =>
        resolve(typeof request.result === 'string' ? request.result : undefined);
      request.onerror = () =>
        reject(request.error ?? new Error('Could not load meal image.'));
    });
  } finally {
    db.close();
  }
}

export async function deleteMealImage(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Could not delete meal image.'));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Meal image deletion was cancelled.'));
    });
  } finally {
    db.close();
  }
}

