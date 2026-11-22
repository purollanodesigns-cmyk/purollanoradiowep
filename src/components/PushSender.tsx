import { useEffect, useState } from "react";
import { Bell, Send, Loader2, ImageIcon, Smartphone } from "lucide-react";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { sendAnnouncement, countSubscribers } from "@/lib/push.functions";

/**
 * Panel de moderación: enviar una notificación push a todos los suscriptores.
 */
export function PushSender() {
  const [title, setTitle] = useState("Puro Llano Radio");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [subs, setSubs] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  /** Obtiene el Bearer token del usuario actual de Firebase Auth. */
  async function getIdToken(): Promise<string> {
    const auth = getAuth(app);
    const user = auth.currentUser;
    if (!user) throw new Error("No autenticado");
    return user.getIdToken();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getIdToken();
        const result = await countSubscribers({
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) setSubs(result.count);
      } catch {
        if (!cancelled) setSubs(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          path: "/",
          image: image.trim() || undefined,
        },
      });
      setFeedback(`Enviadas: ${res.sent} · Fallidas: ${res.failed}`);
      setBody("");
      setImage("");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-[var(--sabana)]/15 bg-white p-5">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-[var(--terracota)]" />
        <h2 className="font-display text-lg text-[var(--sabana)]">Notificaciones push para móviles</h2>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <Smartphone className="h-3.5 w-3.5 text-[var(--terracota)]" />
          {subs === null ? "—" : `${subs} dispositivos activos`}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Se mostrarán en la barra de estado y pantalla de bloqueo con vibración, portada expandible y botón directo para escuchar.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          <span className="sr-only">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Título del aviso"
            className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="sr-only">Mensaje</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Mensaje del anuncio…"
            className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            maxLength={800}
            placeholder="URL de imagen o póster promocional (opcional para móviles)"
            aria-label="URL de imagen"
            className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm"
          />
        </div>
        {image.trim() && (
          <div className="relative mt-2 overflow-hidden rounded-xl border border-[var(--sabana)]/15 bg-black/5">
            <img
              src={image.trim()}
              alt="Vista previa push"
              className="h-36 w-full object-cover"
              onError={(e) => ((e.currentTarget.style.display = "none"))}
            />
            <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] text-white backdrop-blur-sm">
              Vista previa en pantalla de bloqueo
            </span>
          </div>
        )}
        <button
          type="submit"
          disabled={busy || body.trim().length < 3}
          className="flex items-center gap-2 rounded-full bg-[var(--sabana)] px-5 py-2.5 text-sm font-semibold text-[var(--crema)] transition hover:bg-[var(--terracota)] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar notificación a móviles
        </button>
        {feedback && <p className="text-xs text-[var(--muted-foreground)]">{feedback}</p>}
      </form>
    </section>
  );
}
