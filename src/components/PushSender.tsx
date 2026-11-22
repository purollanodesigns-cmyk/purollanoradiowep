import { useEffect, useState } from "react";
import { Bell, Send, Loader2 } from "lucide-react";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import { sendAnnouncement, countSubscribers } from "@/lib/push.functions";

/**
 * Panel de moderación: enviar una notificación push a todos los suscriptores.
 */
export function PushSender() {
  const [title, setTitle] = useState("Puro Llano Radio");
  const [body, setBody] = useState("");
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
        data: { title: title.trim(), body: body.trim(), path: "/" },
      });
      setFeedback(`Enviadas: ${res.sent} · Fallidas: ${res.failed}`);
      setBody("");
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
        <h2 className="font-display text-lg text-[var(--sabana)]">Notificaciones push</h2>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">
          {subs === null ? "—" : `${subs} dispositivos`}
        </span>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block">
          <span className="sr-only">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Título"
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
        <button
          type="submit"
          disabled={busy || body.trim().length < 3}
          className="flex items-center gap-2 rounded-full bg-[var(--sabana)] px-5 py-2 text-sm text-[var(--crema)] transition hover:bg-[var(--terracota)] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Enviar a todos
        </button>
        {feedback && <p className="text-xs text-[var(--muted-foreground)]">{feedback}</p>}
      </form>
    </section>
  );
}
