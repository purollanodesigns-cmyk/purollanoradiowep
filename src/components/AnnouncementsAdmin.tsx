import { useEffect, useState } from "react";
import { Megaphone, Loader2, Trash2, Eye, EyeOff, ImageIcon } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendAnnouncement } from "@/lib/push.functions";

interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  path: string;
  is_published: boolean;
  created_at: string;
}

/** Panel de moderación: crear y gestionar anuncios (título, texto e imagen). */
export function AnnouncementsAdmin() {
  const push = useServerFn(sendAnnouncement);

  const [items, setItems] = useState<AdminAnnouncement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("admin_list_announcements");
    if (!error) setItems((data ?? []) as AdminAnnouncement[]);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || title.trim().length < 2 || body.trim().length < 3) return;
    setBusy(true);
    setFeedback(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)("admin_create_announcement", {
        _title: title.trim(),
        _body: body.trim(),
        _image_url: image.trim() || null,
        _path: "/",
      });
      if (error) throw new Error(error.message);

      let extra = "";
      if (notify) {
        try {
          const res = await push({
            data: { title: title.trim(), body: body.trim().slice(0, 300), path: "/" },
          });
          extra = ` · Push enviadas: ${res.sent}, fallidas: ${res.failed}`;
        } catch {
          extra = " · No se pudo enviar el push";
        }
      }

      setFeedback("Anuncio publicado en el buzón de notificaciones" + extra);
      setTitle("");
      setBody("");
      setImage("");
      await load();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (a: AdminAnnouncement) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)("admin_toggle_announcement", {
      _id: a.id,
      _published: !a.is_published,
    });
    await load();
  };

  const remove = async (a: AdminAnnouncement) => {
    if (!confirm("¿Borrar este anuncio?")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.rpc as any)("admin_delete_announcement", { _id: a.id });
    setItems((prev) => prev.filter((x) => x.id !== a.id));
  };

  return (
    <section className="mt-6 rounded-2xl border border-[var(--sabana)]/15 bg-white p-5">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-[var(--terracota)]" />
        <h2 className="font-display text-lg text-[var(--sabana)]">Anuncios</h2>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">{items.length} publicados</span>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="Título del anuncio"
          aria-label="Título del anuncio"
          className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Texto del anuncio…"
          aria-label="Texto del anuncio"
          className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          <input
            value={image}
            onChange={(e) => setImage(e.target.value)}
            maxLength={500}
            placeholder="URL de la imagen (opcional)"
            aria-label="URL de la imagen"
            className="w-full rounded-lg border border-[var(--sabana)]/20 px-3 py-2 text-sm"
          />
        </div>
        {image.trim() && (
          <img
            src={image.trim()}
            alt="Vista previa del anuncio"
            className="h-32 w-full rounded-lg object-cover"
            onError={(e) => ((e.currentTarget.style.display = "none"))}
          />
        )}
        <label className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          Enviar también notificación push a los suscriptores
        </label>
        <button
          type="submit"
          disabled={busy || title.trim().length < 2 || body.trim().length < 3}
          className="flex items-center gap-2 rounded-full bg-[var(--sabana)] px-5 py-2 text-sm text-[var(--crema)] transition hover:bg-[var(--terracota)] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
          Publicar anuncio
        </button>
        {feedback && <p className="text-xs text-[var(--muted-foreground)]">{feedback}</p>}
      </form>

      <ul className="mt-5 space-y-2">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex gap-3 rounded-xl border border-[var(--sabana)]/10 bg-[var(--crema)]/60 p-3"
          >
            {a.image_url && (
              <img src={a.image_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm text-[var(--sabana)]">{a.title}</p>
              <p className="line-clamp-2 text-xs text-[var(--carbon)]/70">{a.body}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                {new Date(a.created_at).toLocaleString("es-VE")} · {a.is_published ? "Visible" : "Oculto"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <button
                onClick={() => toggle(a)}
                aria-label={a.is_published ? "Ocultar anuncio" : "Publicar anuncio"}
                className="rounded-full p-1.5 text-[var(--sabana)] transition hover:bg-[var(--oro)]/25"
              >
                {a.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={() => remove(a)}
                aria-label="Borrar anuncio"
                className="rounded-full p-1.5 text-[var(--terracota)] transition hover:bg-[var(--terracota)]/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
