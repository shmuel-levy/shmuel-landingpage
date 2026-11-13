/* Voice message: browser recording (MediaRecorder) + keeping the file in IndexedDB,
   so it survives a refresh. The recording never leaves the customer's device
   until they choose to send it. */

export const recSupported = () => !!(navigator.mediaDevices && "getUserMedia" in navigator.mediaDevices && "MediaRecorder" in window);

export function recMime(): string {
  const opts = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus"];
  return opts.find((o) => window.MediaRecorder?.isTypeSupported?.(o)) || "";
}

export const audioExt = (type: string) =>
  /mp4|m4a|aac/.test(type) ? "m4a" : /ogg/.test(type) ? "ogg" : /mpeg|mp3/.test(type) ? "mp3" : /wav/.test(type) ? "wav" : "webm";

/** The blob behind the current recording (kept out of Redux: not serializable). */
export const voiceBlob: { current: Blob | null } = { current: null };

/* ---------- IndexedDB: one object store, key "voice" ---------- */
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error("no idb"));
    const r = indexedDB.open("matanot", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("files");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T | null> {
  return db()
    .then(
      (d) =>
        new Promise<T | null>((res, rej) => {
          const tx = d.transaction("files", mode);
          const req = fn(tx.objectStore("files"));
          tx.oncomplete = () => {
            res(req ? (req.result as T) : null);
            d.close();
          };
          tx.onerror = () => {
            rej(tx.error);
            d.close();
          };
        }),
    )
    .catch(() => null);
}

export interface StoredVoice { blob: Blob; dur: number; type: string }
export const voiceDb = {
  put: (v: StoredVoice) => run("readwrite", (s) => s.put(v, "voice")),
  get: () => run<StoredVoice>("readonly", (s) => s.get("voice")),
  del: () => run("readwrite", (s) => s.delete("voice")),
};

/** Reads the duration of an uploaded audio file (0 if unknown). */
export function audioDuration(file: Blob): Promise<number> {
  return new Promise((res) => {
    const url = URL.createObjectURL(file), a = new Audio();
    const done = (d: number) => {
      URL.revokeObjectURL(url);
      res(d);
    };
    a.preload = "metadata";
    a.onloadedmetadata = () => done(isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => done(0);
    a.src = url;
  });
}
