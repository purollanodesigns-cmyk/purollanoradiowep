import { useState } from "react";
import { Download, Share, Plus, Smartphone, CheckCircle, X, Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LOGO } from "@/lib/assets";

/**
 * Props for the PWAInstallDialog component.
 *
 * @property {boolean} open - Controls the visibility of the modal.
 * @property {() => void} onClose - Callback invoked when the user closes the modal.
 * @property {boolean} isIOS - Whether the user is on an iOS device (triggers Safari instructions).
 * @property {boolean} isInstallable - Whether the browser has fired beforeinstallprompt.
 * @property {() => Promise<boolean>} onInstall - Async callback that triggers the native install prompt.
 */
interface PWAInstallDialogProps {
  open: boolean;
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  onInstall: () => Promise<boolean>;
}

/**
 * Step-by-step instructions rendered for iOS users (Safari).
 * iOS does not support the beforeinstallprompt event, so manual
 * guidance via the share sheet is required.
 */
function IOSInstructions() {
  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        En Safari, sigue estos pasos para añadir Puro Llano Radio a tu pantalla de inicio:
      </p>

      <ol className="space-y-3">
        {/* Step 1 */}
        <li className="flex items-start gap-4 rounded-xl border border-[var(--sabana)]/15 bg-gradient-to-br from-[var(--crema)] to-white p-3.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--oro)] font-display text-sm text-[var(--carbon)] shadow">
            1
          </div>
          <div>
            <p className="font-display text-sm text-[var(--carbon)]">
              Toca el botón de compartir
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Es el ícono{" "}
              <span className="inline-flex items-center gap-0.5 rounded bg-[var(--sabana)]/10 px-1.5 py-0.5 font-mono text-[11px] text-[var(--sabana)]">
                <Share className="h-3 w-3" /> Compartir
              </span>{" "}
              en la barra de herramientas inferior de Safari.
            </p>
          </div>
        </li>

        {/* Step 2 */}
        <li className="flex items-start gap-4 rounded-xl border border-[var(--sabana)]/15 bg-gradient-to-br from-[var(--crema)] to-white p-3.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--oro)] font-display text-sm text-[var(--carbon)] shadow">
            2
          </div>
          <div>
            <p className="font-display text-sm text-[var(--carbon)]">
              Selecciona "Añadir a pantalla de inicio"
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Desplázate hacia abajo en el menú y toca{" "}
              <span className="inline-flex items-center gap-0.5 rounded bg-[var(--sabana)]/10 px-1.5 py-0.5 font-mono text-[11px] text-[var(--sabana)]">
                <Plus className="h-3 w-3" /> Añadir
              </span>
              .
            </p>
          </div>
        </li>

        {/* Step 3 */}
        <li className="flex items-start gap-4 rounded-xl border border-[var(--sabana)]/15 bg-gradient-to-br from-[var(--crema)] to-white p-3.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--oro)] font-display text-sm text-[var(--carbon)] shadow">
            3
          </div>
          <div>
            <p className="font-display text-sm text-[var(--carbon)]">
              Confirma con "Añadir"
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              El icono de Puro Llano Radio aparecerá en tu pantalla de inicio. ¡Listo!
            </p>
          </div>
        </li>
      </ol>
    </div>
  );
}

/**
 * Standard install button rendered for Chromium-based browsers
 * (Chrome, Edge, Samsung Internet) that support the beforeinstallprompt API.
 */
function ChromiumInstallButton({
  onInstall,
  onClose,
}: {
  onInstall: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [installing, setInstalling] = useState(false);
  const [success, setSuccess] = useState(false);

  /**
   * Triggers the PWA installation flow and updates local UI state
   * based on the user's decision.
   */
  const handleInstall = async () => {
    setInstalling(true);
    try {
      const accepted = await onInstall();
      if (accepted) {
        setSuccess(true);
        // Auto-close dialog after a brief confirmation period
        setTimeout(onClose, 1800);
      }
    } finally {
      setInstalling(false);
    }
  };

  if (success) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <CheckCircle className="h-10 w-10 text-green-500" />
        <p className="font-display text-base text-[var(--carbon)]">
          ¡App instalada correctamente!
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Busca el ícono de Puro Llano Radio en tu dispositivo.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        Instala la app directamente desde tu navegador. Sin tiendas, sin esperas, 100% gratis.
      </p>
      <ul className="mt-3 space-y-2 text-sm text-[var(--carbon)]/80">
        {[
          "Acceso rápido desde tu pantalla de inicio",
          "Reproducción en segundo plano",
          "Experiencia sin barras del navegador",
        ].map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--oro)]" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        id="pwa-install-confirm-btn"
        onClick={handleInstall}
        disabled={installing}
        className="group relative mt-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-[var(--oro)] via-[oklch(0.82_0.19_88)] to-[var(--oro)] px-6 py-3.5 font-display text-sm uppercase tracking-[0.2em] text-[var(--carbon)] shadow-[0_15px_40px_-10px_rgba(254,210,2,0.55)] transition duration-300 hover:scale-[1.02] hover:shadow-[0_20px_50px_-8px_rgba(254,210,2,0.8)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {/* Shimmer effect on hover */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <span className="relative flex items-center justify-center gap-2">
          <Download className="h-4 w-4" />
          {installing ? "Instalando…" : "Instalar Puro Llano Radio"}
        </span>
      </button>
    </div>
  );
}

/**
 * PWAInstallDialog — Main installation dialog component.
 *
 * Renders a contextual installation guide based on the user's
 * browser and OS environment:
 * - iOS/Safari: Shows manual share-sheet instructions.
 * - Chromium browsers: Shows a direct install button via the
 *   beforeinstallprompt API.
 * - Unsupported browsers: Shows a general fallback message.
 */
export function PWAInstallDialog({
  open,
  onClose,
  isIOS,
  isInstallable,
  onInstall,
}: PWAInstallDialogProps) {
  const isDesktopChromium = isInstallable && !isIOS;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-[var(--sabana)]/15 bg-[var(--crema)] p-0 shadow-[0_30px_80px_-20px_rgba(114,76,33,0.35)] sm:max-w-md"
        aria-describedby="pwa-install-description"
      >
        {/* Header gradient banner */}
        <div className="relative overflow-hidden rounded-t-2xl bg-[var(--carbon)] px-6 pb-6 pt-7">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse at 20% 20%, oklch(0.72 0.19 90 / 0.5), transparent 55%), radial-gradient(ellipse at 85% 80%, oklch(0.55 0.19 40 / 0.4), transparent 55%)",
            }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

          {/* Close button */}
          <button
            id="pwa-dialog-close-btn"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--oro)]/30 bg-[var(--oro)]/15 shadow-inner">
              <img src={LOGO} alt="Puro Llano Radio" className="h-10 w-10 object-contain" />
            </div>
            <div>
              <DialogHeader>
                <DialogTitle className="font-display text-xl leading-tight text-white">
                  Instalar como App
                </DialogTitle>
                <DialogDescription
                  id="pwa-install-description"
                  className="mt-1 text-xs leading-relaxed text-white/65"
                >
                  {isIOS
                    ? "Añade Puro Llano Radio a tu pantalla de inicio de iPhone o iPad."
                    : "Descarga la app web de Puro Llano Radio para acceso rápido y nativo."}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Device type badge */}
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--oro)]/30 bg-[var(--oro)]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] text-[var(--oro)]">
            {isIOS ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
            {isIOS ? "iOS · Safari" : isDesktopChromium ? "Chrome / Edge / Android" : "Navegador Web"}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4">
          {isIOS ? (
            <IOSInstructions />
          ) : isDesktopChromium ? (
            <ChromiumInstallButton onInstall={onInstall} onClose={onClose} />
          ) : (
            /* Fallback for unsupported browsers (Firefox, etc.) */
            <div className="mt-4 rounded-xl border border-[var(--sabana)]/15 bg-white p-4 text-sm text-[var(--muted-foreground)]">
              <p>
                Tu navegador no soporta la instalación automática de apps. Puedes intentarlo
                desde <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong> en Android
                o escritorio.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
