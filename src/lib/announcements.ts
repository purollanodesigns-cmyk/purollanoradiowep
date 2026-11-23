/**
 * Anuncios publicados desde el panel de moderación.
 * Se sincronizan automáticamente al buzón local de notificaciones.
 */
import { db } from "@/lib/firebase";
import { ref, get, query, limitToLast } from "firebase/database";
import { addNotification } from "@/lib/notifications-store";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  path: string;
  created_at: string;
  is_published?: boolean;
}

const SEEN_KEY = "pll_announcements_seen";
const MAX_SEEN = 100;

function readSeen(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveSeen(ids: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(0, MAX_SEEN)));
  } catch {
    /* ignorar */
  }
}

/** Últimos anuncios publicados (lectura pública desde Firebase Realtime Database). */
export async function fetchAnnouncements(limit = 20): Promise<Announcement[]> {
  if (!db) return [];
  try {
    const announcementsRef = query(ref(db, "announcements"), limitToLast(limit));
    const snapshot = await get(announcementsRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    // Preservamos la Firebase key como `id` de cada anuncio.
    const list: Announcement[] = Object.entries(data).map(([key, val]) => ({
      ...(val as Announcement),
      id: (val as Announcement).id || key,
    }));
    return list
      .filter((a) => a.is_published !== false)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error("[Anuncios] Error al consultar Firebase:", err);
    return [];
  }
}

function showNativePushNotification(
  title: string,
  body: string,
  image?: string | null,
  path?: string,
) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const targetPath = path || "/";
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => {
        void reg.showNotification(title, {
          body,
          icon: "/purollano-logo.png",
          badge: "/purollano-logo.png",
          ...(image ? { image } : {}),
          tag: `pll-${Date.now()}`,
          renotify: true,
          vibrate: [250, 100, 250, 100, 250],
          data: { path: targetPath },
          actions: [
            { action: "listen", title: "▶ Escuchar en vivo" },
            { action: "open", title: "Abrir radio" },
          ],
        });
      })
      .catch(() => {
        try {
          new Notification(title, { body, icon: "/purollano-logo.png" });
        } catch {
          /* ignorar */
        }
      });
  } else {
    try {
      new Notification(title, { body, icon: "/purollano-logo.png" });
    } catch {
      /* ignorar */
    }
  }
}

/**
 * Trae los anuncios nuevos y los agrega al buzón local.
 * Devuelve cuántos avisos nuevos se añadieron.
 */
export async function syncAnnouncements(): Promise<number> {
  if (typeof window === "undefined") return 0;
  let list: Announcement[];
  try {
    list = await fetchAnnouncements();
  } catch (err) {
    console.error("[Anuncios] No se pudieron cargar:", err);
    return 0;
  }

  const seen = readSeen();
  const firstRun = seen.length === 0;
  const nuevos = list.filter((a) => !seen.includes(a.id));
  if (nuevos.length === 0) return 0;

  // Si es la primera visita, cargamos los más recientes (hasta 5) en el buzón.
  // Si no es la primera visita, cargamos todos los nuevos.
  const aInsertar = firstRun ? nuevos.slice(0, 5) : nuevos;

  // Del más antiguo al más nuevo para respetar el orden cronológico del buzón.
  for (const a of [...aInsertar].reverse()) {
    addNotification({
      title: a.title,
      body: a.body,
      path: a.path || "/",
      sourceId: a.id,
      ...(a.image_url ? { image: a.image_url } : {}),
    });

    // Si no es primera visita (es un anuncio nuevo en tiempo real), disparar notificación nativa en el móvil
    if (!firstRun) {
      showNativePushNotification(a.title, a.body, a.image_url, a.path);
    }
  }

  saveSeen([...list.map((a) => a.id), ...seen]);
  return aInsertar.length;
}
