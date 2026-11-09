import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Facebook, Instagram, Youtube, Twitter, Music2, Download, Megaphone } from "lucide-react";
import { LOGO } from "@/lib/assets";
import { supabase } from "@/integrations/supabase/client";
import { recordVisit } from "@/lib/visits.functions";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { PWAInstallDialog } from "@/components/PWAInstallDialog";
import { PushToggle } from "@/components/PushToggle";


const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/artistas", label: "Artistas" },
  { to: "/acerca", label: "Acerca" },
  { to: "/politica-privacidad", label: "Privacidad" },
];

const VISIT_SESSION_KEY = "pll_visited_session";
const VISIT_COUNT_KEY = "pll_visits_count";
const VISIT_TS_KEY = "pll_visits_ts";
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 min

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const [visits, setVisits] = useState<number | null>(null);
  const [visitsError, setVisitsError] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);

  /** PWA installation state and trigger function */
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  /** Whether to show the install entry in the menu */
  const showInstallOption = !isInstalled && (isInstallable || isIOS);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem(VISIT_COUNT_KEY);
    if (cached) setVisits(Number(cached));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const already = window.sessionStorage.getItem(VISIT_SESSION_KEY);
    const ts = Number(window.localStorage.getItem(VISIT_TS_KEY) || 0);
    const fresh = Date.now() - ts < CACHE_TTL_MS;

    (async () => {
      try {
        let count: number | null = null;
        if (already) {
          if (fresh && visits !== null) return;
          const { data, error } = await supabase.rpc("get_visits");
          if (error) throw error;
          count = Number(data);
        } else {
          const res = await recordVisit();
          if (res?.total != null && Number.isFinite(res.total)) {
            count = Number(res.total);
          } else {
            const { data, error } = await supabase.rpc("increment_visits");
            if (error) throw error;
            count = Number(data);
          }
          window.sessionStorage.setItem(VISIT_SESSION_KEY, "1");
        }

        if (cancelled || count === null || !Number.isFinite(count)) return;
        setVisits(count);
        setVisitsError(false);
        window.localStorage.setItem(VISIT_COUNT_KEY, String(count));
        window.localStorage.setItem(VISIT_TS_KEY, String(Date.now()));
      } catch {
        if (!cancelled) setVisitsError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 border-b border-[var(--sabana)]/10 bg-[var(--crema)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO} alt="Puro Llano Radio" className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
            <div className="leading-tight">
              <div className="font-display text-base text-[var(--sabana)] sm:text-lg">Puro Llano</div>
              <div className="-mt-0.5 font-body text-[10px] uppercase tracking-[0.3em] text-[var(--terracota)]">Radio</div>
            </div>
          </Link>

          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="flex items-center gap-2 rounded-full border-2 border-[var(--sabana)]/20 bg-white px-4 py-2 text-[var(--sabana)] transition hover:border-[var(--oro)] hover:bg-[var(--oro)] hover:text-[var(--carbon)]"
          >
            <Menu className="h-5 w-5" />
            <span className="hidden font-display text-sm uppercase sm:inline">Menú</span>
          </button>
        </div>
      </header>

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-[var(--carbon)]/70 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-[var(--crema)] shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between border-b border-[var(--sabana)]/10 p-5">
            <div className="flex items-center gap-2">
              <img src={LOGO} alt="" className="h-9 w-9 object-contain" />
              <span className="font-display text-lg text-[var(--sabana)]">Puro Llano Radio</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="rounded-full p-2 text-[var(--sabana)] transition hover:bg-[var(--oro)]/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-5">
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-4 py-3 font-display text-2xl uppercase tracking-wide text-[var(--carbon)] transition hover:bg-[var(--oro)] hover:pl-6"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* PWA Install option — only shown when installable */}
            {showInstallOption && (
              <button
                id="pwa-install-menu-btn"
                onClick={() => {
                  setOpen(false);
                  setShowInstallDialog(true);
                }}
                className="group mt-2 flex w-full items-center gap-3 rounded-lg border border-[var(--oro)]/30 bg-gradient-to-r from-[var(--oro)]/10 to-transparent px-4 py-3.5 text-left font-display text-2xl uppercase tracking-wide text-[var(--carbon)] transition hover:bg-[var(--oro)] hover:pl-6"
              >
                <Download className="h-6 w-6 shrink-0 text-[var(--oro)] transition group-hover:text-[var(--carbon)]" />
                Instalar App
              </button>
            )}

            {/* Notificaciones push */}
            <PushToggle />

            {/* Panel de anuncios (moderación) */}
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--sabana)]/15 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-[var(--sabana)] transition hover:bg-[var(--oro)]/20"
            >
              <Megaphone className="h-4 w-4 text-[var(--terracota)]" />
              Panel de anuncios
            </Link>
          </nav>



          <div className="mx-5 overflow-hidden rounded-xl border border-[var(--sabana)]/15 bg-gradient-to-br from-white via-white to-[var(--crema)] p-4 shadow-[0_10px_30px_-15px_rgba(114,76,33,0.3)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-[10px] uppercase tracking-[0.25em] text-[var(--terracota)]">Visitas al sitio</div>
                <div className="mt-0.5 font-display text-3xl tabular-nums text-[var(--sabana)]">
                  {visits !== null ? (
                    visits.toLocaleString("es-VE")
                  ) : visitsError ? (
                    <span className="text-base text-[var(--muted-foreground)]">No disponible</span>
                  ) : (
                    <span className="inline-block h-6 w-16 animate-pulse rounded bg-[var(--sabana)]/15" />
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">Contador global · actualizado en tiempo real</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--oro)] text-[var(--carbon)] shadow-inner">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--carbon)] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--carbon)]" />
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1" />

          <div className="border-t border-[var(--sabana)]/10 p-5">
            <div className="mb-3 font-display text-xs uppercase tracking-[0.25em] text-[var(--terracota)]">Síguenos</div>
            <div className="flex gap-3">
              {[
                { icon: Facebook, href: "https://facebook.com/purollanoradio", label: "Facebook" },
                { icon: Instagram, href: "https://instagram.com/purollanoradio", label: "Instagram" },
                { icon: Youtube, href: "https://youtube.com/@purollanoradio", label: "YouTube" },
                { icon: Twitter, href: "https://x.com/purollanoradio", label: "X" },
                { icon: Music2, href: "https://tiktok.com/@purollanoradio.com", label: "TikTok" },
              ].map(({ icon: Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--sabana)] text-[var(--crema)] transition hover:bg-[var(--oro)] hover:text-[var(--carbon)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* PWA Install Dialog */}
      <PWAInstallDialog
        open={showInstallDialog}
        onClose={() => setShowInstallDialog(false)}
        isIOS={isIOS}
        isInstallable={isInstallable}
        onInstall={install}
      />
    </>
  );
}
