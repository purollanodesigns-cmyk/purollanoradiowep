import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Send,
  Loader2,
  ImageIcon,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  XCircle,
  History,
  AlertCircle,
  Wifi,
  Radio,
  Music,
  Zap,
  Disc3,
} from "lucide-react";
import { getAuth } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { sendAnnouncement, countSubscribers } from "@/lib/push.functions";
import { ref, get, limitToLast, query as rtdbQuery } from "firebase/database";
import { useNowPlaying } from "@/hooks/use-now-playing";

interface PushLogEntry {
  id: string;
  title: string;
  body: string;
  sent: number;
  failed: number;
  at: number;
}

/** Obtiene el Bearer token del usuario actual de Firebase Auth. */
async function getIdToken(): Promise<string> {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) throw new Error("No autenticado");
  return user.getIdToken();
}

/**
 * Panel de administración: enviar notificaciones push nativas a todos los suscriptores móviles.
 * Separado del panel de Anuncios para mayor claridad y control.
 */
export function PushSender() {
  const [title, setTitle] = useState("Puro Llano Radio");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [path, setPath] = useState("/");
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<number | null>(null);
  const [subsLoading, setSubsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [history, setHistory] = useState<PushLogEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nowPlaying = useNowPlaying();

  const applyCurrentSong = () => {
    const songTitle = nowPlaying.title || "Puro Llano Radio";
    const songArtist = nowPlaying.artist ? ` — ${nowPlaying.artist}` : "";
    setTitle("🎵 Sonando ahora en Puro Llano Radio");
    setBody(`¡Sintoniza ahora! Escucha "${songTitle}"${songArtist} en vivo.`);
    setImage(nowPlaying.artwork || "");
    setPath("/?play=1");
  };

  const sendCurrentSongDirectly = async () => {
    if (busy) return;
    const songTitle = nowPlaying.title || "Puro Llano Radio";
    const songArtist = nowPlaying.artist ? ` — ${nowPlaying.artist}` : "";
    const directTitle = "🎵 Sonando ahora en Puro Llano Radio";
    const directBody = `¡Sintoniza ahora! Escucha "${songTitle}"${songArtist} en vivo.`;
    const directImage = nowPlaying.artwork || undefined;
    const directPath = "/?play=1";

    setBusy(true);
    setFeedback(null);
    try {
      const token = await getIdToken();
      const res = await sendAnnouncement({
        headers: { Authorization: `Bearer ${token}` },
        data: {
          title: directTitle,
          body: directBody,
          path: directPath,
          image: directImage,
        },
      });
      setFeedbackMsg(
        res.sent > 0,
        res.sent > 0
          ? `✅ Notificación de la canción "${songTitle}" emitida con éxito a ${res.sent} dispositivo(s)`
          : `⚠️ No se pudo entregar la notificación`,
      );
      await loadHistory();
      await loadSubs();
    } catch (err) {
      setFeedbackMsg(false, err instanceof Error ? err.message : "Error al enviar la canción");
    } finally {
      setBusy(false);
    }
  };

  const loadSubs = async () => {
    setSubsLoading(true);
    try {
      const token = await getIdToken();
      const result = await countSubscribers({
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubs(result.count);
    } catch {
      setSubs(null);
    } finally {
      setSubsLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!db) return;
    try {
      const snap = await get(rtdbQuery(ref(db, "push_log"), limitToLast(10)));
      if (snap.exists()) {
        const entries: PushLogEntry[] = [];
        snap.forEach((child) => {
          entries.push({ id: child.key!, ...(child.val() as Omit<PushLogEntry, "id">) });
        });
        setHistory(entries.reverse());
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    void loadSubs();
    void loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFeedbackMsg = (ok: boolean, msg: string) => {
    setFeedback({ ok, msg });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 6000);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || body.trim().length < 3) return;
    setBusy(true);
    setFeedback(null);
    try {
      const token = await getIdToken();
      const res = await sendAnnouncement({
        headers: { Authorization: `Bearer ${token}` },
        data: {
          title: title.trim(),
          body: body.trim(),
          path: path.trim() || "/",
          image: image.trim() || undefined,
        },
      });
      setFeedbackMsg(
        res.sent > 0,
        res.sent > 0
          ? `✅ Notificación emitida con éxito a ${res.sent} dispositivo(s)${res.failed > 0 ? ` (${res.failed} fallidas)` : ""}`
          : `⚠️ No se pudo entregar la notificación`,
      );
      setBody("");
      setImage("");
      setPath("/");
      await loadHistory();
      await loadSubs();
    } catch (err) {
      setFeedbackMsg(false, err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--sabana)]/15 bg-white p-5">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-[var(--terracota)]" />
          <h2 className="font-display text-lg text-[var(--sabana)]">
            Notificaciones push para móviles
          </h2>
        </div>

        {/* Contador de suscriptores */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--sabana)]/20 bg-[var(--crema)] px-3 py-1">
            <Wifi className="h-3.5 w-3.5 text-green-600" />
            {subsLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--muted-foreground)]" />
            ) : (
              <span className="text-xs font-semibold text-[var(--sabana)]">
                {subs === null ? "—" : `${subs} activos`}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={loadSubs}
            disabled={subsLoading}
            aria-label="Actualizar conteo"
            title="Actualizar suscriptores"
            className="rounded-full p-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--oro)]/20 hover:text-[var(--sabana)] disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${subsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Se muestran en la barra de estado y pantalla de bloqueo del teléfono con vibración, imagen
        expandible y botón para escuchar en vivo.
      </p>

      {/* Aviso si no hay suscriptores */}
      {subs === 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Aún no hay dispositivos suscritos. Los visitantes del sitio verán el mensaje flotante
            para activar notificaciones.
          </span>
        </div>
      )}

      {/* Sección especial: Notificar canción actual en vivo */}
      <div className="mt-4 rounded-2xl border border-[var(--oro)]/40 bg-gradient-to-br from-[var(--oro)]/10 via-[var(--crema)] to-[var(--oro)]/5 p-4 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--sabana)]">
            <Radio className="h-4 w-4 text-[var(--terracota)] animate-pulse" />
            <span>Canción sonando ahora en vivo</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-medium text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
            Al aire
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          {nowPlaying.artwork ? (
            <img
              src={nowPlaying.artwork}
              alt={nowPlaying.title}
              className="h-14 w-14 rounded-xl object-cover shadow-sm border border-[var(--sabana)]/20 shrink-0"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--sabana)]/15 text-[var(--sabana)] shrink-0">
              <Disc3 className="h-8 w-8 animate-spin" style={{ animationDuration: "8s" }} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold text-[var(--sabana)]">
              {nowPlaying.title || "Puro Llano Radio"}
            </p>
            <p className="truncate text-xs text-[var(--carbon)]/80">
              {nowPlaying.artist || "El canto de la sabana"}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--oro)]/20">
          <button
            type="button"
            onClick={applyCurrentSong}
            className="flex items-center gap-1.5 rounded-full border border-[var(--sabana)]/25 bg-white px-3.5 py-1.5 text-xs font-medium text-[var(--sabana)] shadow-xs transition hover:bg-[var(--crema)]"
          >
            <Music className="h-3.5 w-3.5 text-[var(--terracota)]" />
            Cargar en el formulario
          </button>

          <button
            type="button"
            onClick={sendCurrentSongDirectly}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full bg-[var(--sabana)] px-4 py-1.5 text-xs font-semibold text-[var(--crema)] shadow-sm transition hover:bg-[var(--terracota)] disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-[var(--oro)]" />
            )}
            Enviar canción en 1 clic
          </button>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={submit} className="mt-4 space-y-3">
        {/* Título */}
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Título
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Puro Llano Radio"
            className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm focus:border-[var(--sabana)] focus:outline-none"
          />
        </label>

        {/* Mensaje */}
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Mensaje <span className="normal-case font-normal">(requerido)</span>
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="¡Estamos en vivo! Sintoniza ahora tu música llanera favorita…"
            className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm focus:border-[var(--sabana)] focus:outline-none"
          />
          <span className="mt-0.5 block text-right text-[10px] text-[var(--muted-foreground)]">
            {body.length}/300
          </span>
        </label>

        {/* URL de imagen */}
        <label className="block">
          <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            <ImageIcon className="h-3 w-3" /> Imagen (opcional — se muestra expandida en el móvil)
          </span>
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            maxLength={800}
            placeholder="https://ejemplo.com/imagen.jpg"
            aria-label="URL de imagen"
            className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm focus:border-[var(--sabana)] focus:outline-none"
          />
        </label>

        {/* Vista previa de imagen */}
        {image.trim() && (
          <div className="relative overflow-hidden rounded-xl border border-[var(--sabana)]/15 bg-black/5">
            <img
              src={image.trim()}
              alt="Vista previa de la notificación push"
              className="h-36 w-full object-cover"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
              Vista previa en pantalla de bloqueo
            </span>
          </div>
        )}

        {/* Destino al hacer clic */}
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Destino al tocar la notificación
          </span>
          <div className="flex gap-2">
            {["/", "/?play=1", "/artistas", "/acerca"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPath(p)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  path === p
                    ? "bg-[var(--sabana)] text-[var(--crema)]"
                    : "border border-[var(--sabana)]/20 hover:bg-[var(--oro)]/20"
                }`}
              >
                {p === "/" ? "Inicio" : p === "/?play=1" ? "▶ Reproducir" : p.replace("/", "")}
              </button>
            ))}
          </div>
        </label>

        {/* Feedback */}
        {feedback && (
          <div
            className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs ${
              feedback.ok
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            )}
            {feedback.msg}
          </div>
        )}

        {/* Botón enviar */}
        <button
          type="submit"
          disabled={busy || body.trim().length < 3}
          className="flex items-center gap-2 rounded-full bg-[var(--sabana)] px-6 py-2.5 text-sm font-semibold text-[var(--crema)] shadow-sm transition hover:bg-[var(--terracota)] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar a {subs !== null ? `${subs} dispositivos` : "todos los dispositivos"}
        </button>
      </form>

      {/* Historial de envíos recientes */}
      <div className="mt-5 border-t border-[var(--sabana)]/10 pt-4">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)] transition hover:text-[var(--sabana)]"
        >
          <History className="h-3.5 w-3.5" />
          Historial de envíos recientes
          <span className="ml-auto text-[var(--sabana)]/60">{showHistory ? "▲" : "▼"}</span>
        </button>

        {showHistory && (
          <div className="mt-3">
            {history.length === 0 ? (
              <p className="text-center text-xs text-[var(--muted-foreground)] py-4">
                Aún no hay envíos registrados.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-xl border border-[var(--sabana)]/10 bg-[var(--crema)]/60 px-3 py-2.5"
                  >
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-sm font-medium text-[var(--sabana)]">
                        {entry.title}
                      </p>
                      <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                        {new Date(entry.at).toLocaleString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-xs text-[var(--carbon)]/70">{entry.body}</p>
                    <div className="mt-1 flex gap-3 text-[10px]">
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> {entry.sent} enviadas
                      </span>
                      {entry.failed > 0 && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" /> {entry.failed} fallidas
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
