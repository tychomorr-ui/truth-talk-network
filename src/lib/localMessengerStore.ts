import type { LocalIdentity, MessageEnvelope } from "./messaging";

const DATABASE = "truth-talk-local-messenger-v1";
const VERSION = 1;
const IDENTITY_STORE = "identity";
const MESSAGE_STORE = "messages";
const IDENTITY_KEY = "local-identity";

export type StoredMessage = {
  id: string;
  envelope: MessageEnvelope;
  direction: "outgoing" | "incoming";
  state: "pending" | "received" | "acknowledged" | "cancelled" | "failed";
  attempts: number;
  nextRetryAt?: number;
  receivedAt: string;
  acknowledgement?: MessageEnvelope;
  reason?: string;
};

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable in this browser."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(IDENTITY_STORE)) database.createObjectStore(IDENTITY_STORE, { keyPath: "id" });
      if (!database.objectStoreNames.contains(MESSAGE_STORE)) database.createObjectStore(MESSAGE_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB could not be opened."));
    request.onblocked = () => reject(new Error("Another tab is blocking the local messaging store upgrade."));
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    let request: IDBRequest<T>;
    try {
      const transaction = database.transaction(storeName, mode);
      request = run(transaction.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
      transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction was aborted."));
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    } catch (error) { database.close(); reject(error); }
  });
}

export async function loadLocalIdentity(): Promise<LocalIdentity | null> {
  const record = await withStore<Record<string, unknown> | undefined>(IDENTITY_STORE, "readonly", (store) => store.get(IDENTITY_KEY));
  if (!record || typeof record.publicKey !== "string" || typeof record.privateKey !== "string" || typeof record.createdAt !== "string") return null;
  return { publicKey: record.publicKey, privateKey: record.privateKey, createdAt: record.createdAt };
}

export async function saveLocalIdentity(identity: LocalIdentity): Promise<void> {
  await withStore<IDBValidKey>(IDENTITY_STORE, "readwrite", (store) => store.put({ id: IDENTITY_KEY, ...identity }));
}

export async function loadLocalMessages(): Promise<StoredMessage[]> {
  const records = await withStore<StoredMessage[]>(MESSAGE_STORE, "readonly", (store) => store.getAll());
  return [...records].sort((left, right) => left.envelope.created_at - right.envelope.created_at);
}

export async function loadLocalMessage(id: string): Promise<StoredMessage | null> {
  return (await withStore<StoredMessage | undefined>(MESSAGE_STORE, "readonly", (store) => store.get(id))) ?? null;
}

export async function saveLocalMessage(message: StoredMessage): Promise<void> {
  await withStore<IDBValidKey>(MESSAGE_STORE, "readwrite", (store) => store.put(message));
}

export async function clearLocalMessengerData(): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([IDENTITY_STORE, MESSAGE_STORE], "readwrite");
    transaction.objectStore(IDENTITY_STORE).clear();
    transaction.objectStore(MESSAGE_STORE).clear();
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error ?? new Error("Local messaging data could not be cleared.")); };
    transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error("Local messaging data clear was aborted.")); };
  });
}
