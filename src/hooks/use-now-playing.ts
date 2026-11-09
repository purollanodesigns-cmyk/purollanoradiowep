import { useEffect, useState } from "react";

export const STREAM_URL = "https://radio.mipanel.stream:6816/;";

export const NOW_PLAYING_URL = "https://mipanel.stream/inc/widgets-api-en-vivo.php?porta=6816";
const LISTENERS_URL = "https://mipanel.stream/inc/widgets-api-oyentes.php?kind=summary&porta=6816";
const HISTORY_URL = "https://mipanel.stream/inc/widgets-api-last10.php?porta=6816";

export interface HistoryItem {
  title: string;
  artist: string | null;
  artwork: string | null;
  playedAt: number;
}

export interface NowPlaying {
  raw: string;
  title: string;
  artist: string | null;
  artwork: string | null;
  listeners: number | null;
  peakListeners: number | null;
  bitrate: string | null;
  genre: string | null;
  history: HistoryItem[];
  isLive: boolean;
  error: string | null;
  updatedAt: number;
}

const DEFAULT: NowPlaying = {
  raw: "Puro Llano Radio — En vivo",
  title: "Puro Llano Radio",
  artist: "El canto de la sabana",
  artwork: null,
  listeners: null,
  peakListeners: null,
  bitrate: "192",
  genre: "Llaneras",
  history: [],
  isLive: false,
  error: null,
  updatedAt: 0,
};

function parseSongTitle(raw: string): { title: string; artist: string | null } {
  if (!raw) return { title: DEFAULT.title, artist: DEFAULT.artist };
  const clean = raw.replace(/\s+/g, " ").trim();
  const parts = clean.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    const [first, ...rest] = parts;
    return { title: first.trim(), artist: rest.join(" - ").trim() };
  }
  return { title: clean, artist: null };
}

let cache: NowPlaying = DEFAULT;
const listenersSet = new Set<(n: NowPlaying) => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let consecutiveErrors = 0;
const artworkCache = new Map<string, string | null>();

async function safeJson(url: string, signal?: AbortSignal) {
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const GENERIC_ART = /generic_song|\/art\/0|default/i;

function cleanText(v: unknown): string {
  return String(v ?? "")
    .replace(/\s+/g, " ")
    .replace(/\.(mp3|m4a|aac|wav|ogg)$/i, "")
    .replace(/^\d{1,3}[\s._-]+/, "")
    .trim();
}

/** Detecta artista y canción a partir de los campos de AzuraCast o del texto crudo. */
function detectSong(song: { artist?: string; title?: string; text?: string }) {
  let artist = cleanText(song.artist);
  let title = cleanText(song.title);
  const text = cleanText(song.text);
  if ((!artist || !title) && text) {
    const parts = text.split(/\s+[-–—|]\s+/);
    if (parts.length >= 2) {
      artist = artist || parts[0].trim();
      title = title && title !== text ? title : parts.slice(1).join(" - ").trim();
    } else {
      title = title || text;
    }
  }
  title = title.replace(/\s*[([](official|audio|video|letra|lyrics|hd|en vivo)[^)\]]*[)\]]/gi, "").trim();
  return { artist: artist || null, title: title || DEFAULT.title };
}

const norm = (x: string) =>
  x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/** Formatea texto en minúsculas como "Título De Canción". */
function titleCase(s: string | null): string | null {
  if (!s) return s;
  if (s !== s.toLowerCase() && s !== s.toUpperCase()) return s;
  const small = new Set(["y", "de", "del", "la", "el", "los", "las", "en", "a", "con", "por", "e"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

interface LookupResult { artwork: string | null; artist?: string; title?: string; swapped?: boolean }
const lookupCache = new Map<string, LookupResult>();

type ItunesHit = { artistName: string; trackName: string; artworkUrl100?: string };

function scoreHit(r: ItunesHit, title: string, artist: string | null) {
  const tn = norm(r.trackName.replace(/\(.*?\)/g, ""));
  const an = norm(r.artistName);
  const t = norm(title);
  const a = artist ? norm(artist) : "";
  let s = 0;
  if (tn === t) s += 6;
  else if (t && (tn.includes(t) || t.includes(tn))) s += 3;
  if (a && (an.includes(a) || a.includes(an))) s += 4;
  else if (a && norm(r.trackName).includes(a)) s += 2; // "feat. artista"
  return s;
}

async function itunes(term: string): Promise<ItunesHit[]> {
  const j = await safeJson(
    `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=10&country=VE`,
  );
  return j?.results ?? [];
}

/**
 * Buscador inteligente estilo Shazam: prueba Artista–Canción y Canción–Artista
 * (el servidor a menudo los envía invertidos), puntúa coincidencias y devuelve
 * nombres corregidos y carátula en alta resolución.
 */
async function smartLookup(artist: string | null, title: string): Promise<LookupResult> {
  const key = `${artist ?? ""}::${title}`.toLowerCase();
  const cached = lookupCache.get(key);
  if (cached) return cached;
  try {
    const results = await itunes(`${artist ?? ""} ${title}`.trim());
    let extra: ItunesHit[] = [];
    if (artist) {
      extra = (await Promise.all([itunes(title), itunes(artist)].map((p) => p.catch(() => [])))).flat();
    }
    const all = [...results, ...extra];
    let best: { hit: ItunesHit; score: number; swapped: boolean } | null = null;
    for (const hit of all) {
      const normal = scoreHit(hit, title, artist);
      const swapped = artist ? scoreHit(hit, artist, title) : 0;
      const sc = Math.max(normal, swapped);
      if (!best || sc > best.score) best = { hit, score: sc, swapped: swapped > normal };
    }
    let out: LookupResult = { artwork: null };
    if (best && best.score >= 6) {
      out = {
        artwork: best.hit.artworkUrl100?.replace("100x100bb", "600x600bb") ?? null,
        artist: best.score >= 9 ? best.hit.artistName : undefined,
        title: best.score >= 9 ? best.hit.trackName : undefined,
        swapped: best.swapped,
      };
    }
    if (!out.artwork) {
      const mb = await musicBrainzLookup(artist, title);
      if (mb) out = { ...out, ...mb, artwork: mb.artwork ?? out.artwork };
    }
    lookupCache.set(key, out);
    artworkCache.set(key, out.artwork);
    return out;
  } catch {
    return { artwork: null };
  }
}

/** Segunda fuente: MusicBrainz + Cover Art Archive (prueba ambos órdenes). */
async function musicBrainzLookup(artist: string | null, title: string): Promise<LookupResult | null> {
  const tries: Array<[string | null, string, boolean]> = [[artist, title, false]];
  if (artist) tries.push([title, artist, true]);
  for (const [a, t, swapped] of tries) {
    try {
      const q = `recording:"${t}"${a ? ` AND artist:"${a}"` : ""}`;
      const j = await safeJson(
        `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(q)}&fmt=json&limit=5`,
      );
      type Rec = { title: string; score: number; "artist-credit"?: Array<{ name: string }>; releases?: Array<{ id: string }> };
      const rec = (j?.recordings as Rec[] | undefined)?.find(
        (r) => r.score >= 90 && norm(r.title) === norm(t),
      );
      if (!rec) continue;
      let artwork: string | null = null;
      for (const rel of (rec.releases ?? []).slice(0, 3)) {
        try {
          const c = await safeJson(`https://coverartarchive.org/release/${rel.id}`);
          const img = c?.images?.find((i: { front?: boolean }) => i.front) ?? c?.images?.[0];
          artwork = img?.thumbnails?.["500"] ?? img?.thumbnails?.large ?? img?.image ?? null;
          if (artwork) break;
        } catch { /* sin portada */ }
      }
      return { artwork, title: rec.title, artist: rec["artist-credit"]?.[0]?.name, swapped };
    } catch { /* siguiente intento */ }
  }
  return null;
}

/** Heurística: el "artista" parece un título largo y el "título" un nombre propio corto. */
function looksSwapped(artist: string | null, title: string) {
  if (!artist) return false;
  const aw = artist.trim().split(/\s+/).length;
  const tw = title.trim().split(/\s+/).length;
  return tw <= 3 && aw >= tw + 2;
}

/** Enlaces de reconocimiento para la canción actual. */
export function recognitionLinks(title: string, artist: string | null) {
  const q = encodeURIComponent(`${title} ${artist ?? ""}`.trim());
  return {
    shazam: `https://www.shazam.com/search?q=${q}`,
    spotify: `https://open.spotify.com/search/${q}`,
    youtube: `https://www.youtube.com/results?search_query=${q}`,
  };
}

const JINGLE = /^(sello|cu[ñn]a|id\b|promo|jingle)/i;

async function fetchOnce() {
  const next: NowPlaying = { ...cache };
  let hadError = false;

  try {
    const [live, oy, last] = await Promise.all([
      safeJson(NOW_PLAYING_URL),
      safeJson(LISTENERS_URL).catch(() => null),
      safeJson(HISTORY_URL).catch(() => null),
    ]);
    const song = { artist: live?.artist ?? "", title: live?.title ?? "", text: live?.text ?? "" };
    const raw = cleanText(song.text) || DEFAULT.raw;
    const isFiller = !cleanText(song.text) || JINGLE.test(raw);
    const songChanged = !isFiller && raw !== cache.raw;
    const detected = detectSong(song);
    if (!isFiller) next.raw = raw;
    next.isLive = Boolean(live?.ok ?? true);
    if (oy && typeof oy.total === "number") {
      next.listeners = oy.total;
      next.peakListeners = Math.max(next.peakListeners ?? 0, oy.total);
    }

    if (songChanged || (!cache.updatedAt && !isFiller)) {
      const stationArt = null;
      // Mostrar de inmediato lo detectado y luego refinar.
      next.title = titleCase(detected.title) ?? detected.title;
      next.artist = titleCase(detected.artist);
      next.artwork = stationArt;
      const found = await smartLookup(detected.artist, detected.title);
      const swap = found.swapped ?? looksSwapped(detected.artist, detected.title);
      const t = swap && detected.artist ? detected.artist : detected.title;
      const a = swap ? detected.title : detected.artist;
      next.title = found.title ?? titleCase(t) ?? t;
      next.artist = found.artist ?? titleCase(a);
      next.artwork = found.artwork ?? stationArt;
    }

    const items: Array<{ played_at: string; artist?: string | null; title?: string | null; text?: string }> =
      last?.items ?? [];
    next.history = items
      .filter((h) => h.text && !JINGLE.test(h.text.trim()))
      .slice(0, 10)
      .map((h) => {
        const d0 = detectSong({ artist: h.artist ?? "", title: h.title ?? "", text: h.text ?? "" });
        const sw = looksSwapped(d0.artist, d0.title);
        const d = { title: titleCase(sw && d0.artist ? d0.artist : d0.title) ?? d0.title, artist: titleCase(sw ? d0.title : d0.artist) };
        const key0 = `${d0.artist ?? ""}::${d0.title}`.toLowerCase();
        const key = `${d.artist ?? ""}::${d.title}`.toLowerCase();
        return {
          title: d.title,
          artist: d.artist,
          artwork: artworkCache.get(key0) ?? artworkCache.get(key) ?? null,
          playedAt: new Date(h.played_at.replace(" ", "T") + "-04:00").getTime(),
        };
      });
  } catch {
    hadError = true;
  }

  if (hadError) {
    consecutiveErrors += 1;
    next.error = consecutiveErrors >= 3 ? "Sin conexión con el servidor de metadatos" : null;
  } else {
    consecutiveErrors = 0;
    next.error = null;
  }

  next.updatedAt = Date.now();
  cache = next;
  listenersSet.forEach((cb) => cb(cache));
}

function scheduleNext() {
  if (timer) clearTimeout(timer);
  // Exponential backoff on errors: 15s → 30s → 60s (max)
  const delay = Math.min(15000 * Math.pow(2, consecutiveErrors), 60000);
  timer = setTimeout(async () => {
    await fetchOnce();
    scheduleNext();
  }, delay);
}

function startPolling() {
  if (timer) return;
  fetchOnce().finally(scheduleNext);
}

function stopPolling() {
  if (!timer) return;
  clearTimeout(timer);
  timer = null;
}

export function useNowPlaying(): NowPlaying {
  const [state, setState] = useState<NowPlaying>(cache);

  useEffect(() => {
    listenersSet.add(setState);
    startPolling();
    setState(cache);
    // Pause polling when tab hidden to save resources
    const onVis = () => {
      if (document.hidden) stopPolling();
      else startPolling();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      listenersSet.delete(setState);
      document.removeEventListener("visibilitychange", onVis);
      if (listenersSet.size === 0) stopPolling();
    };
  }, []);

  return state;
}
