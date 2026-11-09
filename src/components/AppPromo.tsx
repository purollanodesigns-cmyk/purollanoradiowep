import { useState } from "react";
import { Download, Smartphone, Star, MonitorSmartphone } from "lucide-react";
import appScreenshot from "@/assets/app-screenshot.jpg.asset.json";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { PWAInstallDialog } from "@/components/PWAInstallDialog";

const PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.radioshd.purollanoradio&pli=1";

/**
 * AppPromo — Section promoting native and PWA app downloads.
 *
 * Renders the Google Play CTA and conditionally shows a secondary
 * "Install as Web App" button using the PWA install API.
 */
export function AppPromo() {
  const [showInstallDialog, setShowInstallDialog] = useState(false);

  /** PWA installation state from the usePWAInstall hook */
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  /**
   * Show the PWA install option only when:
   * - The app is NOT already running in standalone/installed mode.
   * - The browser supports beforeinstallprompt (Chromium) OR the device is iOS (Safari manual flow).
   */
  const showInstallOption = !isInstalled && (isInstallable || isIOS);

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--carbon)] py-20 text-[var(--crema)] sm:py-28">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at 15% 20%, oklch(0.72 0.19 90 / 0.35), transparent 55%), radial-gradient(ellipse at 90% 90%, oklch(0.55 0.19 40 / 0.35), transparent 55%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--oro)]/40 bg-[var(--oro)]/10 px-3 py-1 font-display text-[10px] uppercase tracking-[0.3em] text-[var(--oro)]">
              <Smartphone className="h-3 w-3" /> Nueva app disponible
            </div>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] sm:text-6xl">
              Lleva el llano<br />
              <span className="text-[var(--oro)]">en tu bolsillo</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
              Descarga la app oficial de Puro Llano Radio y escucha el folklore llanero
              en HD, en cualquier lugar, sin depender del navegador.
            </p>

            <ul className="mt-6 space-y-2.5 text-sm text-white/85">
              {[
                "Reproducción en segundo plano y en pantalla bloqueada",
                "Consumo optimizado de datos",
                "Notificaciones de canciones y programas en vivo",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--oro)]" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              {/* Google Play Store CTA */}
              <a
                href={PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-[var(--oro)] via-[oklch(0.82_0.19_88)] to-[var(--oro)] px-8 py-4 font-display text-sm uppercase tracking-[0.25em] text-[var(--carbon)] shadow-[0_20px_50px_-15px_rgba(254,210,2,0.6)] transition duration-500 hover:scale-[1.05] hover:shadow-[0_25px_60px_-10px_rgba(254,210,2,0.85)] sm:text-base"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                <Download className="relative h-5 w-5" />
                <span className="relative">Descargar nuestra app</span>
              </a>

              {/* PWA Install CTA — shown only when supported and not yet installed */}
              {showInstallOption && (
                <button
                  id="pwa-install-promo-btn"
                  onClick={() => setShowInstallDialog(true)}
                  className="group inline-flex items-center gap-2 rounded-full border-2 border-white/25 px-6 py-3.5 font-display text-sm uppercase tracking-[0.2em] text-white/80 transition duration-300 hover:border-white/60 hover:text-white"
                >
                  <MonitorSmartphone className="h-4 w-4" />
                  Instalar como App Web
                </button>
              )}

              <div className="flex items-center gap-2 text-xs text-white/60">
                <div className="flex text-[var(--oro)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span>Google Play · Android</span>
              </div>
            </div>
          </div>

          {/* Phone mockup with real screenshot */}
          <div className="relative mx-auto hidden md:block">
            <div className="relative h-[520px] w-[260px] rounded-[46px] border-[11px] border-[var(--carbon)] bg-[var(--carbon)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-[var(--oro)]/30">
              <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/70" />
              <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-black">
                <img
                  src={appScreenshot.url}
                  alt="Captura de pantalla de la app Puro Llano Radio mostrando el reproductor en vivo"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="absolute -right-6 top-10 rounded-2xl bg-[var(--oro)] px-3 py-2 font-display text-[10px] uppercase tracking-widest text-[var(--carbon)] shadow-xl">
              Gratis
            </div>
          </div>
        </div>
      </section>

      {/* PWA Install Dialog — rendered outside section to avoid stacking context issues */}
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
