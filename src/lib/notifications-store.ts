/**
 * Buzón local de notificaciones de Puro Llano Radio.
 * Guarda los avisos recibidos en este dispositivo (localStorage).
 */
export interface AppNotification {
  id: string;
  /** ID de la fuente original (p.ej. el key del anuncio en RTDB) para deduplicación. */
  sourceId?: string;
  title: string;
  body: string;
  path?: string;
  image?: string;
  read: boolean;
  at: number;
}

const KEY = "pll_notifications";
const MAX = 50;
const EVENT = "pll:notifications";

function emit() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}

let cache: AppNotification[] | null = null;

function read(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as AppNotification[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Snapshot estable (memoizado) del buzón. */
export function getNotifications(): AppNotification[] {
  if (cache === null) cache = read();
  return cache;
}

function save(list: AppNotification[]) {
  const next = list.slice(0, MAX);
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignorar */
  }
  emit();
}

export function addNotification(n: { title: string; body: string; path?: string; image?: string; sourceId?: string }) {
  if (typeof window === "undefined") return;
  const list = getNotifications();

  // Deduplicar por sourceId (ID del anuncio en Firebase) si está disponible.
  if (n.sourceId && list.some((item) => item.sourceId === n.sourceId)) return;

  // Fallback: evitar duplicado inmediato del mismo texto en < 60 s.
  if (!n.sourceId) {
    const last = list[0];
    if (last && last.title === n.title && last.body === n.body && Date.now() - last.at < 60_000) return;
  }

  save([
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...(n.sourceId ? { sourceId: n.sourceId } : {}),
      title: n.title,
      body: n.body,
      ...(n.path ? { path: n.path } : {}),
      ...(n.image ? { image: n.image } : {}),
      read: false,
      at: Date.now(),
    },
    ...list,
  ]);
}

export function markRead(id: string) {
  save(getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllRead() {
  save(getNotifications().map((n) => ({ ...n, read: true })));
}

export function removeNotification(id: string) {
  save(getNotifications().filter((n) => n.id !== id));
}

export function clearNotifications() {
  save([]);
}

/** Se suscribe a los cambios del buzón (misma pestaña y otras pestañas). */
export function subscribeNotifications(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = read();
    cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}
