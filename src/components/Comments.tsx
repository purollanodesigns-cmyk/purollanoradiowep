import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Flag, Heart, Loader2, AlertCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { ref, onValue, set, update, runTransaction } from "firebase/database";

interface Comment {
  id: string;
  name: string;
  message: string;
  likes: number;
  reports: number;
  created_at: string;
  is_hidden?: boolean;
}

const LIKED_KEY = "pll_comments_liked_v2";
const REPORTED_KEY = "pll_comments_reported_v2";
const CLIENT_KEY = "pll_client_id";
const NAME_KEY = "pll_comment_name";

function getClientId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    try {
      localStorage.setItem(CLIENT_KEY, id);
    } catch {
      /* ignore */
    }
  }
  return id;
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, s: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(s)));
  } catch {
    /* ignore */
  }
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

const ERROR_MAP: Record<string, string> = {
  invalid_name: "Escribe un nombre válido (2–40 letras).",
  invalid_message: "Mensaje inválido (3–500 caracteres).",
  invalid_client: "Tu navegador no permitió identificarte, activa cookies.",
  rate_limited: "Espera unos segundos antes de publicar otro comentario.",
  hourly_limit: "Has publicado demasiados comentarios esta hora.",
  spam_detected: "Tu comentario fue marcado como spam.",
};

export function Comments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [reported, setReported] = useState<Set<string>>(() => new Set());
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // bots fill this
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedAt, setSubmittedAt] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLiked(loadSet(LIKED_KEY));
    setReported(loadSet(REPORTED_KEY));
    try {
      const savedName = localStorage.getItem(NAME_KEY);
      if (savedName) setName(savedName);
    } catch {
      /* ignore */
    }

    if (!db) {
      setLoading(false);
      return;
    }

    const commentsRef = ref(db, "comments");
    const unsubscribe = onValue(
      commentsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setComments([]);
          setLoading(false);
          return;
        }
        const data = snapshot.val();
        const list: (Comment & { is_hidden?: boolean })[] = Object.values(data);
        const filtered = list
          .filter((c) => !c.is_hidden && (c.reports || 0) < 3)
          .sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
          )
          .slice(0, 100);
        setComments(filtered);
        setLoading(false);
      },
      (err) => {
        console.error("[Comments] Error listener realtime:", err);
        setError("No se pudieron cargar los comentarios.");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    // client-side pre-checks
    if (Date.now() - submittedAt < 20_000) {
      return setError("Espera unos segundos antes de publicar otro comentario.");
    }
    if (honeypot) {
      setSubmitting(false);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      if (!db) throw new Error("Firebase no configurado");
      const commentId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const newComment: Comment & { is_hidden: boolean; client_id: string } = {
        id: commentId,
        name: name.trim(),
        message: message.trim(),
        likes: 0,
        reports: 0,
        created_at: new Date().toISOString(),
        is_hidden: false,
        client_id: getClientId(),
      };

      await set(ref(db, `comments/${commentId}`), newComment);

      setMessage("");
      setSubmittedAt(Date.now());
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        /* ignore */
      }
    } catch {
      setError("Error de conexión. Intenta más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (id: string) => {
    if (!db) return;
    const wasLiked = liked.has(id);
    const delta = wasLiked ? -1 : 1;
    // optimistic
    const s = new Set(liked);
    if (wasLiked) s.delete(id);
    else s.add(id);
    setLiked(s);
    saveSet(LIKED_KEY, s);
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, likes: Math.max(0, c.likes + delta) } : c)));

    try {
      const commentLikesRef = ref(db, `comments/${id}/likes`);
      await runTransaction(commentLikesRef, (currentLikes) => {
        return Math.max(0, (currentLikes || 0) + delta);
      });
    } catch {
      // revert
      const r = new Set(liked);
      setLiked(r);
      saveSet(LIKED_KEY, r);
    }
  };

  const report = async (id: string) => {
    if (reported.has(id) || !db) return;
    if (!confirm("¿Reportar este comentario como inapropiado?")) return;
    const s = new Set(reported);
    s.add(id);
    setReported(s);
    saveSet(REPORTED_KEY, s);

    try {
      const commentReportsRef = ref(db, `comments/${id}/reports`);
      await runTransaction(commentReportsRef, (currentReports) => {
        return (currentReports || 0) + 1;
      });
    } catch {
      /* ignore */
    }
  };

  const canPost = name.trim().length >= 2 && message.trim().length >= 3 && !submitting;

  return (
    <section
      id="comentarios"
      aria-labelledby="comentarios-titulo"
      className="relative overflow-hidden bg-[var(--crema)] py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, var(--oro) 0, transparent 40%), radial-gradient(circle at 90% 80%, var(--terracota) 0, transparent 45%)",
          filter: "blur(80px)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-6">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--sabana)]/15 bg-white px-4 py-1.5 font-display text-[10px] uppercase tracking-[0.35em] text-[var(--terracota)]">
            <MessageSquare className="h-3 w-3" aria-hidden="true" /> Voces del llano
          </div>
          <h2 id="comentarios-titulo" className="font-display text-3xl leading-tight text-[var(--sabana)] sm:text-5xl">
            Deja tu comentario
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
            Comparte un saludo, dedica una canción o cuéntanos desde qué rincón del mundo nos escuchas.
          </p>
        </div>

        <form
          onSubmit={submit}
          aria-label="Formulario de comentarios"
          className="mt-10 overflow-hidden rounded-3xl border-2 border-[var(--sabana)]/15 bg-white shadow-[0_20px_60px_-30px_rgba(114,76,33,0.35)]"
        >
          {/* Honeypot — hidden from real users and screen readers */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }}>
            <label>
              Deja este campo vacío
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
            <label className="sm:col-span-1">
              <span className="sr-only">Tu nombre</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                maxLength={40}
                required
                aria-required="true"
                className="w-full rounded-xl border border-[var(--sabana)]/15 bg-[var(--crema)]/60 px-4 py-3 font-body text-sm outline-none transition focus:border-[var(--oro)] focus:bg-white focus:ring-2 focus:ring-[var(--oro)]/30"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="sr-only">Mensaje</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje…"
                rows={2}
                maxLength={500}
                required
                aria-required="true"
                aria-describedby="comment-help"
                className="w-full min-h-[52px] resize-y rounded-xl border border-[var(--sabana)]/15 bg-[var(--crema)]/60 px-4 py-3 font-body text-sm outline-none transition focus:border-[var(--oro)] focus:bg-white focus:ring-2 focus:ring-[var(--oro)]/30"
              />
            </label>
          </div>
          <div className="flex flex-col items-start justify-between gap-3 border-t border-[var(--sabana)]/10 bg-[var(--crema)]/50 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
            <div id="comment-help" className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
              {error ? (
                <span className="inline-flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {error}
                </span>
              ) : (
                <span>{message.length}/500 · moderación automática + antispam</span>
              )}
            </div>
            <button
              type="submit"
              disabled={!canPost}
              className="btn-shimmer inline-flex items-center gap-2 rounded-full bg-[var(--sabana)] px-6 py-2.5 font-display text-xs uppercase tracking-[0.25em] text-[var(--crema)] transition hover:scale-105 hover:bg-[var(--carbon)] hover:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.4)] disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
              {submitting ? "Enviando…" : "Publicar"}
            </button>
          </div>
        </form>

        <div ref={listRef} className="mt-10 space-y-4" aria-live="polite" aria-busy={loading}>
          {loading ? (
            <div className="rounded-2xl border border-[var(--sabana)]/15 bg-white/70 p-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--terracota)]" aria-hidden="true" />
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">Cargando comentarios…</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--sabana)]/20 bg-white/60 p-10 text-center">
              <div className="font-display text-lg text-[var(--sabana)]">Sé el primero en dejar un saludo</div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Tu mensaje aparecerá aquí para que otros llaneros lo lean.</p>
            </div>
          ) : (
            comments.map((c) => {
              const isLiked = liked.has(c.id);
              const isReported = reported.has(c.id);
              return (
                <article
                  key={c.id}
                  className="group flex gap-4 rounded-2xl border border-[var(--sabana)]/12 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[var(--oro)]/50 hover:shadow-[0_15px_40px_-20px_rgba(114,76,33,0.35)] sm:p-5"
                >
                  <div
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--oro)] via-[var(--terracota)] to-[var(--sabana)] font-display text-lg text-[var(--crema)] shadow-inner"
                  >
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="font-display text-base text-[var(--sabana)]">{c.name}</div>
                      <time
                        dateTime={c.created_at}
                        className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]"
                      >
                        {timeAgo(c.created_at)}
                      </time>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--foreground)]">
                      {c.message}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleLike(c.id)}
                        aria-pressed={isLiked}
                        aria-label={`Me gusta (${c.likes})`}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--oro)] ${
                          isLiked
                            ? "bg-[var(--terracota)]/15 text-[var(--terracota)]"
                            : "bg-[var(--crema)] text-[var(--muted-foreground)] hover:bg-[var(--terracota)]/10 hover:text-[var(--terracota)]"
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} aria-hidden="true" />
                        {c.likes}
                      </button>
                      <button
                        type="button"
                        onClick={() => report(c.id)}
                        disabled={isReported}
                        aria-label={isReported ? "Comentario ya reportado" : "Reportar comentario"}
                        className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-[var(--muted-foreground)] transition hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-40"
                      >
                        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                        {isReported ? "Reportado" : "Reportar"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
