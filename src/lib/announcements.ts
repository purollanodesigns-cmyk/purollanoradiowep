/**
 * Anuncios publicados desde el panel de moderación.
 * Se sincronizan automáticamente al buzón local de notificaciones.
 */
import { supabase } from "@/integrations/supabase/client";
import { addNotification } from "@/lib/notifications-store";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  path: string;
  created_at: string;
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

/** Últimos anuncios publicados (lectura pública). */
export async function fetchAnnouncements(limit = 20): Promise<Announcement[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)("announcements")
    .select("id, title, body, image_url, path, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Announcement[];
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
        ...(a.image_url ? { image: a.image_url } : {}),
      });
    }
  }

  saveSeen([...list.map((a) => a.id), ...seen]);
  return firstRun ? 0 : nuevos.length;
}
