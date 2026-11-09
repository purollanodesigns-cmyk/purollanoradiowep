import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shield, Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso · Puro Llano Radio" },
      { name: "description", content: "Inicio de sesión del equipo de Puro Llano Radio." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Acceso · Puro Llano Radio" },
      { property: "og:description", content: "Inicio de sesión del equipo de Puro Llano Radio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
  errorComponent: ({ error }) => <div className="p-10 text-center text-sm text-red-600">{(error as Error).message}</div>,
  notFoundComponent: () => <div className="p-10 text-center">No encontrado</div>,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/admin", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        setMsg(data.session ? "Cuenta creada." : "Revisa tu correo para confirmar la cuenta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth" },
      });
      if (error) throw error;
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo iniciar con Google.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--crema)] p-6">
      <div className="w-full max-w-sm rounded-3xl border-2 border-[var(--sabana)]/15 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--oro)]">
            <Shield className="h-6 w-6 text-[var(--carbon)]" />
          </div>
        </div>
        <h1 className="text-center font-display text-2xl text-[var(--sabana)]">
          {mode === "in" ? "Acceso al panel" : "Crear cuenta"}
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
          Solo el equipo autorizado de Puro Llano Radio.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--sabana)]/20 px-3">
            <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="sr-only">Correo</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo"
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[var(--sabana)]/20 px-3">
            <Lock className="h-4 w-4 text-[var(--muted-foreground)]" />
            <span className="sr-only">Contraseña</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--sabana)] py-3 font-display text-xs uppercase tracking-[0.25em] text-[var(--crema)] transition hover:bg-[var(--carbon)] disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "in" ? "Entrar" : "Registrarme"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
          <span className="h-px flex-1 bg-[var(--sabana)]/15" /> o <span className="h-px flex-1 bg-[var(--sabana)]/15" />
        </div>

        <button
          onClick={google}
          className="w-full rounded-full border border-[var(--sabana)]/25 py-3 text-sm transition hover:bg-[var(--oro)]/20"
        >
          Continuar con Google
        </button>

        {msg && <p className="mt-4 text-center text-xs text-[var(--terracota)]">{msg}</p>}

        <button
          onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}
          className="mt-5 w-full text-center text-xs text-[var(--muted-foreground)] underline"
        >
          {mode === "in" ? "No tengo cuenta, registrarme" : "Ya tengo cuenta, iniciar sesión"}
        </button>

        <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--terracota)]">
          <ArrowLeft className="h-3 w-3" /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}
