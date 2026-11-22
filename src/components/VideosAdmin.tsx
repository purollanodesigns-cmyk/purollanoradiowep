import { useEffect, useState } from "react";
import { Youtube, Loader2, Trash2, Eye, EyeOff } from "lucide-react";
import { ref, get, set, remove, push as rtdbPush } from "firebase/database";
import { db } from "@/lib/firebase";

interface AdminVideo {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

/** Extrae el ID de YouTube desde una URL o devuelve el texto si ya es un ID. */
function parseYoutubeId(input: string): string | null {
  const v = input.trim();
  if (!v) return null;
  if (/^[\w-]{11}$/.test(v)) return v;
  const patterns = [
    /(?:youtube\.com\/watch\?[^#]*v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/(?:embed|shorts|live)\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = v.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** Panel admin: recomendar videos de YouTube que se muestran en la landing. */
export function VideosAdmin() {
  const [items, setItems] = useState<AdminVideo[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("0");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const previewId = parseYoutubeId(url);

  const load = async () => {
    const snap = await get(ref(db, "recommended_videos"));
    if (!snap.exists()) {
      setItems([]);
      return;
    }
    const list: AdminVideo[] = [];
    snap.forEach((child) => {
      const d = child.val() as Omit<AdminVideo, "id">;
      list.push({ id: child.key!, ...d });
    });
    list.sort((a, b) => a.sort_order - b.sort_order);
    setItems(list);
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const ytId = parseYoutubeId(url);
    if (!ytId) {
      setFeedback("Enlace de YouTube no válido");
      return;
    }
    if (title.trim().length < 2) {
      setFeedback("Escribe un título");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const newRef = rtdbPush(ref(db, "recommended_videos"));
      await set(newRef, {
        youtube_id: ytId,
        title: title.trim(),
        description: description.trim() || null,
        sort_order: Number(order) || 0,
        is_published: true,
        created_at: new Date().toISOString(),
      });
      setFeedback("Video recomendado publicado");
      setUrl("");
      setTitle("");
      setDescription("");
      setOrder("0");
      await load();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (v: AdminVideo) => {
    await set(ref(db, `recommended_videos/${v.id}/is_published`), !v.is_published);
    await load();
  };

  const removeItem = async (v: AdminVideo) => {
    if (!confirm("¿Borrar este video recomendado?")) return;
    await remove(ref(db, `recommended_videos/${v.id}`));
    await load();
  };

  const field =
    "w-full rounded-2xl border border-[var(--sabana)]/20 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--terracota)]";

  return (
    <section className="mt-8 rounded-3xl border border-[var(--sabana)]/15 bg-white p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-lg text-[var(--sabana)]">
        <Youtube className="h-5 w-5 text-[var(--terracota)]" /> Videos recomendados
      </h2>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Aparecen en la página principal, justo arriba de la Cartelera Llanera.
      </p>

      <form onSubmit={submit} className="mt-5 grid gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enlace de YouTube o ID"
          className={field}
          aria-label="Enlace de YouTube"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título (artista - canción)"
          maxLength={120}
          className={field}
          aria-label="Título"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción corta (opcional)"
          rows={2}
          maxLength={300}
          className={field}
          aria-label="Descripción"
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-[var(--muted-foreground)]">
            Orden
            <input
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              inputMode="numeric"
              className="ml-2 w-20 rounded-full border border-[var(--sabana)]/20 px-3 py-1.5 text-sm"
              aria-label="Orden"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--sabana)] px-6 py-3 text-xs uppercase tracking-[0.25em] text-[var(--crema)] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Recomendar video
          </button>
          {previewId && (
            <img
              src={`https://i.ytimg.com/vi/${previewId}/default.jpg`}
              alt="Vista previa"
              className="h-12 rounded-lg border border-[var(--sabana)]/20"
            />
          )}
        </div>
        {feedback && <p className="text-sm text-[var(--terracota)]">{feedback}</p>}
      </form>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--sabana)]/20 p-6 text-center text-sm text-[var(--muted-foreground)]">
            Aún no hay videos recomendados.
          </p>
        ) : (
          items.map((v) => (
            <article
              key={v.id}
              className={`flex flex-wrap items-center gap-3 rounded-2xl border p-3 ${
                v.is_published ? "border-[var(--sabana)]/15 bg-white" : "border-red-200 bg-red-50/40"
              }`}
            >
              <img
                src={`https://i.ytimg.com/vi/${v.youtube_id}/default.jpg`}
                alt={v.title}
                loading="lazy"
                className="h-12 w-20 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm text-[var(--sabana)]">{v.title}</div>
                <div className="truncate text-[11px] text-[var(--muted-foreground)]">
                  Orden {v.sort_order} · {v.is_published ? "Publicado" : "Oculto"}
                </div>
              </div>
              <button
                onClick={() => toggle(v)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--sabana)]/20 px-3 py-1.5 text-xs hover:bg-[var(--oro)]/20"
              >
                {v.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {v.is_published ? "Ocultar" : "Mostrar"}
              </button>
              <button
                onClick={() => removeItem(v)}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" /> Borrar
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
