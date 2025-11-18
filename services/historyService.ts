import { HistoryItem, Tool } from '../types';

const DB_NAME = 'AI_MASTERY_RENDER_DB';
const STORE_NAME = 'history';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Error opening IndexedDB');
            reject(new Error('Error opening IndexedDB'));
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
    return dbPromise;
};

export const getHistory = async (): Promise<HistoryItem[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = () => {
            console.error('Error fetching history from DB');
            reject(new Error('Error fetching history'));
        };

        request.onsuccess = () => {
            const history = request.result as HistoryItem[];
            resolve(history.sort((a, b) => b.timestamp - a.timestamp));
        };
    });
};

const MAX_HISTORY_ITEMS = 50;

export const addToHistory = async (item: { 
    tool: Tool; 
    prompt: string; 
    sourceImageURL?: string; 
    resultImageURL?: string;
    resultVideoURL?: string; 
}) => {
    try {
        if (!item.resultImageURL && !item.resultVideoURL) {
            console.error("History item must have a result URL.");
            return;
        }

        const db = await initDB();
        
        const newItem: HistoryItem = {
            id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            ...item,
        };
        
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const addRequest = store.add(newItem);

        addRequest.onsuccess = () => {
            const countRequest = store.count();
            countRequest.onsuccess = () => {
                if (countRequest.result > MAX_HISTORY_ITEMS) {
                    const cursorRequest = store.openCursor(null, 'next'); // 'next' gives oldest items first
                    let itemsToDelete = countRequest.result - MAX_HISTORY_ITEMS;
                    cursorRequest.onsuccess = (event) => {
                        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                        if (cursor && itemsToDelete > 0) {
                            store.delete(cursor.primaryKey);
                            itemsToDelete--;
                            cursor.continue();
                        }
                    };
                }
            };
        };

    } catch (error) {
        console.error("Failed to add item to history DB", error);
    }
};

export const clearHistory = async () => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
            console.error('Error clearing history DB', transaction.error);
            reject(transaction.error);
        };
    });
};

export const deleteHistoryItem = async (id: string) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(id);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
             console.error(`Error deleting item ${id} from DB`, transaction.error);
             reject(transaction.error);
        };
    });
};
