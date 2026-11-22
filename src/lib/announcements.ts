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

  if (!firstRun) {
    // Del más antiguo al más nuevo para respetar el orden del buzón.
    for (const a of [...nuevos].reverse()) {
      addNotification({
        title: a.title,
        body: a.body,
        path: a.path || "/",
        sourceId: a.id,
        ...(a.image_url ? { image: a.image_url } : {}),
      });
    }
  }

  saveSeen([...list.map((a) => a.id), ...seen]);
  return firstRun ? 0 : nuevos.length;
}
