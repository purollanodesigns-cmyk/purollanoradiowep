import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2, Share2, Users, AlertCircle, Youtube } from "lucide-react";
import logo from "@/assets/purollano-logo.png.asset.json";
import { STREAM_URL, recognitionLinks, useNowPlaying } from "@/hooks/use-now-playing";

const VOL_KEY = "pll_volume";
const MUTE_KEY = "pll_muted";

function EqBars({ playing }: { playing: boolean }) {
  return (
    <span className="inline-flex h-4 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-sm bg-[var(--oro)]"
          style={{
            height: playing ? "100%" : "25%",
            animation: playing
              ? `pll-eq-${(i % 3) + 1} ${0.9 + i * 0.15}s ease-in-out ${i * 0.08}s infinite`
              : "none",
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </span>
  );
}

export function FloatingPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const meta = useNowPlaying();

  // Load persisted volume + mute
  useEffect(() => {
    try {
      const v = localStorage.getItem(VOL_KEY);
      const m = localStorage.getItem(MUTE_KEY);
      if (v !== null) {
        const n = Number(v);
        if (!Number.isNaN(n) && n >= 0 && n <= 1) setVolume(n);
      }
      if (m === "1") setMuted(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Persist + apply volume/mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
    try {
      localStorage.setItem(VOL_KEY, String(volume));
      localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [volume, muted]);


  // Media Session API (lockscreen / OS controls)
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: meta.title,
      artist: meta.artist || "Puro Llano Radio",
      album: "En vivo · 24/7",
      artwork: [
        { src: meta.artwork || logo.url, sizes: "512x512", type: meta.artwork ? "image/jpeg" : "image/png" },
      ],
    });
    navigator.mediaSession.setActionHandler("play", () => toggle());
    navigator.mediaSession.setActionHandler("pause", () => toggle());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.title, meta.artist]);

  // Listen to global "play" trigger from CTAs
  useEffect(() => {
    const handler = () => {
      if (!playing) toggle();
    };
    window.addEventListener("pll:play", handler);
    return () => window.removeEventListener("pll:play", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  // Auto-iniciar si el usuario tocó la acción de la notificación push ("▶ Escuchar en vivo")
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("play") === "1" || params.get("action") === "listen") {
      params.delete("play");
      params.delete("action");
      const cleanSearch = params.toString() ? `?${params.toString()}` : "";
      window.history.replaceState({}, "", window.location.pathname + cleanSearch);
      setTimeout(() => {
        if (!playing) void toggle();
      }, 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    setAudioError(null);
    a.src = STREAM_URL + "?t=" + Date.now();
    try {
      await a.play();
      setPlaying(true);
    } catch (e) {
      console.error(e);
      setAudioError("No se pudo iniciar la transmisión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Recover from network drops mid-playback
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onError = () => {
      if (playing) setAudioError("Se interrumpió la transmisión. Reintentando…");
    };
    const onStalled = () => {
      if (playing) setAudioError("Conexión inestable…");
    };
    const onPlaying = () => setAudioError(null);
    a.addEventListener("error", onError);
    a.addEventListener("stalled", onStalled);
    a.addEventListener("playing", onPlaying);
    return () => {
      a.removeEventListener("error", onError);
      a.removeEventListener("stalled", onStalled);
      a.removeEventListener("playing", onPlaying);
    };
  }, [playing]);

  const share = async () => {
    const text = `Escuchando ${meta.title}${meta.artist ? " — " + meta.artist : ""} en Puro Llano Radio`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Puro Llano Radio", text, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(`${text} · ${window.location.origin}`);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:bottom-5 sm:px-6">
      <div className="pointer-events-auto w-full max-w-3xl player-wiggle">
        {/* Expanded panel */}
        <div
          className={`overflow-hidden rounded-2xl border border-[var(--oro)]/40 bg-gradient-to-b from-[var(--carbon)] to-[var(--sabana)]/95 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-500 ${
            expanded ? "mb-2 max-h-[560px] opacity-100" : "pointer-events-none mb-0 max-h-0 opacity-0"
          }`}
        >
          <div className="grid grid-cols-3 gap-4 p-4 text-[var(--crema)] sm:p-5">
            <div>
              <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--oro)]">Oyentes</div>
              <div className="font-display text-2xl">{meta.listeners ?? "—"}</div>
              <div className="text-[10px] text-white/50">Pico: {meta.peakListeners ?? "—"}</div>
            </div>
            <div>
              <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--oro)]">Calidad</div>
              <div className="font-display text-2xl">{meta.bitrate ?? "192"}<span className="text-sm text-white/60"> kbps</span></div>
              <div className="text-[10px] text-white/50">Estéreo · MP3</div>
            </div>
            <div>
              <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--oro)]">Género</div>
              <div className="font-display text-lg leading-tight">{meta.genre || "Llaneras"}</div>
              <div className="text-[10px] text-white/50">24/7 · en vivo</div>
            </div>
          </div>
          <div className="border-t border-[var(--oro)]/20 px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--oro)]">Últimas 10 canciones</div>
              {meta.error && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] text-red-300">
                  <AlertCircle className="h-3 w-3" /> conexión inestable
                </span>
              )}
            </div>
            <ul className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
              {meta.history.length === 0 && (
                <li className="py-6 text-center text-xs text-white/50">Cargando historial…</li>
              )}
              {meta.history.map((h, i) => (
                <li key={h.playedAt + "-" + i} className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                  <img src={h.artwork || logo.url} alt="" loading="lazy" className={`h-10 w-10 shrink-0 rounded ${h.artwork ? "object-cover" : "object-contain p-1"}`} onError={(e) => { (e.currentTarget as HTMLImageElement).src = logo.url; }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{h.title}</div>
                    {h.artist && <div className="truncate text-xs text-white/60">{h.artist}</div>}
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-white/50">
                    {new Date(h.playedAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Error banner */}
        {audioError && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 backdrop-blur">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{audioError}</span>
            <button onClick={() => setAudioError(null)} className="text-red-200/70 hover:text-white">×</button>
          </div>
        )}


        {/* Main bar */}
        <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--oro)]/50 bg-gradient-to-r from-[var(--carbon)] via-[var(--sabana)]/90 to-[var(--carbon)] px-3 py-2 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(254,210,2,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:gap-4 sm:px-4 sm:py-3">
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--oro)] to-transparent opacity-70" />
          {/* Cover */}
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[var(--carbon)] via-[var(--sabana)]/60 to-[var(--carbon)] ring-2 ring-[var(--oro)]/50 shadow-[0_6px_20px_-6px_rgba(254,210,2,0.45)] sm:h-14 sm:w-14">
            <img
              src={meta.artwork || logo.url}
              alt=""
              className={`h-full w-full transition-opacity duration-500 ${meta.artwork ? "object-cover object-center" : "object-contain p-1.5"}`}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = logo.url; }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--oro)]/0 via-transparent to-[var(--carbon)]/40" />
          </div>

          {/* Play */}
          <button
            onClick={toggle}
            aria-label={playing ? "Pausar" : "Reproducir"}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--oro)] text-[var(--carbon)] transition hover:scale-110 hover:shadow-[var(--shadow-gold)] active:scale-95 sm:h-12 sm:w-12 ${playing ? "" : "btn-pulse-soft"}`}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : playing ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            )}
          </button>

          {/* Metadata */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={`absolute inline-flex h-full w-full rounded-full bg-[var(--oro)] ${playing ? "animate-ping opacity-75" : "opacity-30"}`} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--oro)]" />
              </span>
              <span className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--oro)] sm:text-xs">
                {playing ? "En vivo" : meta.isLive ? "Al aire" : "En espera"}
              </span>
              <EqBars playing={playing} />
              {meta.listeners !== null && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-[var(--oro)]/10 px-2 py-0.5 text-[10px] text-[var(--oro)]">
                  <Users className="h-3 w-3" />
                  {meta.listeners}
                </span>
              )}
            </div>

            <div
              className="mt-0.5 overflow-hidden"
              style={{ maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)" }}
              title={meta.raw}
            >
              <div
                key={meta.title + (meta.artist ?? "")}
                className="inline-flex w-max whitespace-nowrap font-body text-sm font-semibold text-white motion-safe:animate-[pll-marquee_16s_linear_infinite] hover:[animation-play-state:paused] sm:text-base"
              >
                {[0, 1].map((k) => (
                  <span key={k} className="pr-12" aria-hidden={k === 1}>
                    {meta.title}
                    {meta.artist && <span className="font-normal text-[var(--oro)]/80"> · {meta.artist}</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-[var(--oro)]/15 hover:text-[var(--oro)]"
            >
              {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setMuted(false);
                }}
                aria-label="Volumen"
                className="pll-volume w-24"
                style={{ ["--pct" as never]: `${(muted ? 0 : volume) * 100}%` }}
              />
              <span className="w-8 text-right font-display text-[10px] tabular-nums text-white/60">
                {Math.round((muted ? 0 : volume) * 100)}
              </span>
            </div>
          </div>

          <a
            href={recognitionLinks(meta.title, meta.artist).youtube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buscar canción en YouTube"
            title="Ver en YouTube"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:scale-110 hover:bg-red-600 hover:text-white hover:ring-red-500"
          >
            <Youtube className="h-4 w-4" />
          </a>

          <button
            onClick={share}
            aria-label="Compartir"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-[var(--oro)]/20 hover:text-[var(--oro)] sm:flex"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => setExpanded((e) => !e)}
            aria-label={expanded ? "Ocultar detalles" : "Ver detalles"}
            aria-expanded={expanded}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--oro)]/40 text-[var(--oro)] transition hover:bg-[var(--oro)] hover:text-[var(--carbon)]"
          >
            <span className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>▾</span>
          </button>

          <audio ref={audioRef} preload="none" crossOrigin="anonymous" />
        </div>
      </div>
    </div>
  );
}
