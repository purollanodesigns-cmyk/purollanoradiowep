import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  enablePush,
  disablePush,
  hasPushToken,
  pushConfigured,
  isPushOptedOut,
  setPushOptOut,
  type PushStatus,
} from "@/lib/push";

const MESSAGES: Record<PushStatus, string> = {
  registered: "¡Listo! Te avisaremos de lo nuevo en Puro Llano Radio.",
  "not-configured": "Las notificaciones no están configuradas todavía.",
  unsupported: "Tu navegador no soporta notificaciones push.",
  "open-in-new-tab": "Abre la página en su propia pestaña para activar las notificaciones.",
  denied: "Permiso denegado. Actívalo en los ajustes del navegador.",
  error: "No pudimos activar las notificaciones. Intenta de nuevo.",
};

/**
 * Botón para activar o desactivar las notificaciones push en este dispositivo.
 */
export function PushToggle({ onDone }: { onDone?: () => void }) {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    setAvailable(pushConfigured() && typeof window !== "undefined" && "Notification" in window);
    setSubscribed(hasPushToken() && typeof Notification !== "undefined" && Notification.permission === "granted");
    setOptedOut(isPushOptedOut());
  }, []);

  if (!available) return null;

  const handle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (subscribed) {
        await disablePush();
        setSubscribed(false);
        setOptedOut(true);
        setMsg("Notificaciones desactivadas en este dispositivo.");
      } else {
        const res = await enablePush();
        setSubscribed(res.status === "registered");
        if (res.status === "registered") setOptedOut(false);
        setMsg(MESSAGES[res.status]);
        if (res.status === "registered") onDone?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={handle}
        disabled={busy}
        aria-pressed={subscribed}
        className="group flex w-full items-center gap-3 rounded-lg border border-[var(--oro)]/30 bg-gradient-to-r from-[var(--oro)]/10 to-transparent px-4 py-3.5 text-left font-display text-2xl uppercase tracking-wide text-[var(--carbon)] transition hover:bg-[var(--oro)] hover:pl-6 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-[var(--oro)]" />
        ) : subscribed ? (
          <BellOff className="h-6 w-6 shrink-0 text-[var(--oro)] transition group-hover:text-[var(--carbon)]" />
        ) : (
          <Bell className="h-6 w-6 shrink-0 text-[var(--oro)] transition group-hover:text-[var(--carbon)]" />
        )}
        {subscribed ? "Quitar avisos" : "Activar avisos"}
      </button>
      {!subscribed && (
        <button
          onClick={() => {
            const next = !optedOut;
            setPushOptOut(next);
            setOptedOut(next);
            setMsg(
              next
                ? "No volveremos a mostrarte avisos de este sitio."
                : "Podrás recibir avisos de nuevo.",
            );
          }}
          className="mt-2 px-1 text-left text-[12px] text-[var(--muted-foreground)] underline underline-offset-2 transition hover:text-[var(--terracota)]"
        >
          {optedOut ? "Volver a permitir notificaciones" : "No recibir más notificaciones de este sitio"}
        </button>
      )}
      {msg && <p className="mt-2 px-1 text-[12px] text-[var(--muted-foreground)]">{msg}</p>}
    </div>
  );
}
