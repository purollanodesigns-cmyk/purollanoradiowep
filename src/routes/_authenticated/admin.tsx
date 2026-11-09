import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Shield, Eye, EyeOff, Trash2, Flag, RefreshCw, LogOut, AlertTriangle, CheckCircle2, Loader2, Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PushSender } from "@/components/PushSender";
import { AnnouncementsAdmin } from "@/components/AnnouncementsAdmin";
import { UsersAdmin } from "@/components/UsersAdmin";
import { VideosAdmin } from "@/components/VideosAdmin";
import { StatsAdmin } from "@/components/StatsAdmin";


export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Administración · Puro Llano Radio" },
      { name: "description", content: "Panel interno de administración de Puro Llano Radio." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Administración · Puro Llano Radio" },
      { property: "og:description", content: "Panel interno de administración de Puro Llano Radio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-sm text-red-600">{(error as Error).message}</p>
        <button
          onClick={() => { reset(); router.invalidate(); }}
          className="mt-4 rounded-full bg-[var(--sabana)] px-6 py-2 text-sm text-[var(--crema)]"
        >
          Reintentar
        </button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-10 text-center">No encontrado</div>,
});

interface AdminComment {
  id: string;
  name: string;
  message: string;
  likes: number;
  reports: number;
  is_hidden: boolean;
  client_id: string | null;
  created_at: string;
}

type Tab = "comentarios" | "anuncios" | "videos" | "usuarios" | "estadísticas";

function AdminPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("comentarios");

  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "reported" | "hidden" | "visible">("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: admin } = await (supabase.rpc as any)("is_admin");
      if (!cancelled) setIsAdmin(Boolean(admin));
    })();
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase.rpc as any)("admin_list_comments");
    if (err) setError(err.message?.includes("unauthorized") ? "No tienes permisos." : "No se pudo cargar. Reintenta.");
    else setComments((data ?? []) as AdminComment[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const act = async (id: string, action: "hide" | "unhide" | "clear_reports" | "delete") => {
    if (action === "delete" && !confirm("¿Borrar este comentario permanentemente?")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (supabase.rpc as any)("admin_moderate_comment", { _id: id, _action: action });
    if (err) {
      setToast("Error: " + err.message);
    } else {
      setToast("Acción aplicada");
      if (action === "delete") setComments((prev) => prev.filter((c) => c.id !== id));
      else setComments((prev) => prev.map((c) => c.id === id ? {
        ...c,
        is_hidden: action === "hide" ? true : action === "unhide" ? false : c.is_hidden,
        reports: action === "unhide" || action === "clear_reports" ? 0 : c.reports,
      } : c));
    }
    setTimeout(() => setToast(null), 2500);
  };

  const filtered = comments.filter((c) => {
    if (filter === "reported") return c.reports > 0;
    if (filter === "hidden") return c.is_hidden;
    if (filter === "visible") return !c.is_hidden;
    return true;
  });

  const stats = {
    total: comments.length,
    hidden: comments.filter((c) => c.is_hidden).length,
    reported: comments.filter((c) => c.reports > 0).length,
  };

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--crema)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--terracota)]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--crema)] p-6">
        <div className="w-full max-w-sm rounded-3xl border-2 border-[var(--sabana)]/15 bg-white p-8 text-center shadow-2xl">
          <Lock className="mx-auto h-8 w-8 text-[var(--terracota)]" />
          <h1 className="mt-4 font-display text-xl text-[var(--sabana)]">Acceso restringido</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Tu cuenta ({email}) no tiene permisos de administrador.
          </p>
          <button onClick={logout} className="mt-6 w-full rounded-full bg-[var(--sabana)] py-3 text-xs uppercase tracking-[0.25em] text-[var(--crema)]">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--crema)]">
      <header className="sticky top-0 z-10 border-b border-[var(--sabana)]/15 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Shield className="h-5 w-5 shrink-0 text-[var(--terracota)]" />
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg text-[var(--sabana)] sm:text-xl">Administración</h1>
              <p className="truncate text-[11px] text-[var(--muted-foreground)]">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} aria-label="Recargar" className="rounded-full border border-[var(--sabana)]/20 p-2 hover:bg-[var(--oro)]/20">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={logout} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sabana)]/20 px-3 py-1.5 text-xs hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-3.5 w-3.5" /> Salir
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 px-4 pb-3 sm:px-6">
          {(["comentarios", "anuncios", "videos", "usuarios", "estadísticas"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition ${
                tab === t ? "bg-[var(--sabana)] text-[var(--crema)]" : "border border-[var(--sabana)]/20 hover:bg-[var(--oro)]/20"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {tab === "estadísticas" && <StatsAdmin />}

        {tab === "usuarios" && <UsersAdmin currentUserId={userId ?? ""} />}

        {tab === "videos" && <VideosAdmin />}

        {tab === "anuncios" && (
          <>
            <PushSender />
            <AnnouncementsAdmin />
          </>
        )}

        {tab === "comentarios" && (
          <>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { label: "Total", value: stats.total, color: "text-[var(--sabana)]" },
                { label: "Reportados", value: stats.reported, color: "text-orange-600" },
                { label: "Ocultos", value: stats.hidden, color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-[var(--sabana)]/15 bg-white p-4">
                  <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--muted-foreground)]">{s.label}</div>
                  <div className={`mt-1 font-display text-3xl tabular-nums ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              {(["all", "reported", "hidden", "visible"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-widest transition ${
                    filter === f ? "bg-[var(--sabana)] text-[var(--crema)]" : "border border-[var(--sabana)]/20 bg-white hover:bg-[var(--oro)]/20"
                  }`}
                >
                  {f === "all" ? "Todos" : f === "reported" ? "Reportados" : f === "hidden" ? "Ocultos" : "Visibles"}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="rounded-2xl bg-white p-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--terracota)]" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--sabana)]/20 bg-white/60 p-10 text-center text-sm text-[var(--muted-foreground)]">
                  Sin comentarios en este filtro.
                </div>
              ) : (
                filtered.map((c) => (
                  <article
                    key={c.id}
                    className={`rounded-2xl border p-4 transition sm:p-5 ${
                      c.is_hidden ? "border-red-300 bg-red-50/40" : c.reports > 0 ? "border-orange-300 bg-orange-50/40" : "border-[var(--sabana)]/15 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-base text-[var(--sabana)]">{c.name}</span>
                        {c.is_hidden && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-700">
                            <EyeOff className="h-3 w-3" /> Oculto
                          </span>
                        )}
                        {c.reports > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-orange-700">
                            <Flag className="h-3 w-3" /> {c.reports}
                          </span>
                        )}
                      </div>
                      <time className="text-[11px] uppercase tracking-widest text-[var(--muted-foreground)]">
                        {new Date(c.created_at).toLocaleString("es-VE")}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--foreground)]">{c.message}</p>
                    <div className="mt-2 text-[10px] text-[var(--muted-foreground)]">
                      ID: {c.client_id?.slice(0, 16) ?? "—"} · {c.likes} likes
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.is_hidden ? (
                        <button onClick={() => act(c.id, "unhide")} className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700">
                          <Eye className="h-3.5 w-3.5" /> Mostrar
                        </button>
                      ) : (
                        <button onClick={() => act(c.id, "hide")} className="inline-flex items-center gap-1 rounded-full bg-orange-600 px-3 py-1.5 text-xs text-white hover:bg-orange-700">
                          <EyeOff className="h-3.5 w-3.5" /> Ocultar
                        </button>
                      )}
                      {c.reports > 0 && (
                        <button onClick={() => act(c.id, "clear_reports")} className="inline-flex items-center gap-1 rounded-full border border-[var(--sabana)]/20 px-3 py-1.5 text-xs hover:bg-[var(--oro)]/20">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Limpiar reportes
                        </button>
                      )}
                      <button onClick={() => act(c.id, "delete")} className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700">
                        <Trash2 className="h-3.5 w-3.5" /> Borrar
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-[var(--carbon)] px-5 py-2.5 text-sm text-[var(--crema)] shadow-xl">
          <AlertTriangle className="mr-2 inline h-4 w-4" />{toast}
        </div>
      )}
    </div>
  );
}
