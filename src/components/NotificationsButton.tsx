import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Bell,
  BellOff,
  X,
  Trash2,
  CheckCheck,
  Check,
  Inbox,
  Loader2,
  ExternalLink,
  Settings2,
} from "lucide-react";
import {
  enablePush,
  disablePush,
  hasPushToken,
  pushConfigured,
  isPushOptedOut,
  setPushOptOut,
  type PushStatus,
} from "@/lib/push";
import {
  getNotifications,
  subscribeNotifications,
  markRead,
  markAllRead,
  removeNotification,
  clearNotifications,
  type AppNotification,
} from "@/lib/notifications-store";
import { syncAnnouncements } from "@/lib/announcements";
import { db } from "@/lib/firebase";
import { ref, query, limitToLast, onChildAdded } from "firebase/database";

const EMPTY: AppNotification[] = [];

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "ahora";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return new Date(ts).toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
}

/** Botón flotante con el buzón de notificaciones recibidas en este dispositivo. */
export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [optedOut, setOptedOut] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Estado del mensaje flotante de bienvenida
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);
  const [promptSuccess, setPromptSuccess] = useState(false);

  const items = useSyncExternalStore(
    subscribeNotifications,
    getNotifications,
    () => EMPTY,
  );

  const refreshPushState = () => {
    if (typeof window === "undefined") return;
    const supported = "Notification" in window && pushConfigured();
    setPermission(supported ? Notification.permission : "unsupported");
    setSubscribed(supported && Notification.permission === "granted" && hasPushToken());
    setOptedOut(isPushOptedOut());
    setEmbedded(window.top !== window.self);
  };

  useEffect(() => {
    setMounted(true);
    refreshPushState();
  }, []);

  // Mostrar mensaje flotante automático poco después de ingresar al sitio
  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedSession =
      window.sessionStorage.getItem("pll_push_prompt_dismissed_session") === "1";
    const remindLaterTs = Number(
      window.localStorage.getItem("pll_push_remind_later_ts") || 0,
    );
    const isSnoozed = Date.now() < remindLaterTs;

    const timer = window.setTimeout(() => {
      const supported = "Notification" in window && pushConfigured();
      const currentPerm = supported ? Notification.permission : "unsupported";
      const isAlreadySubscribed =
        supported && currentPerm === "granted" && hasPushToken();
      const isBlocked = currentPerm === "denied";
      const isUserOptedOut = isPushOptedOut();

      if (
        supported &&
        !isAlreadySubscribed &&
        !isBlocked &&
        !isUserOptedOut &&
        !dismissedSession &&
        !isSnoozed
      ) {
        setShowPrompt(true);
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [subscribed, optedOut]);

  useEffect(() => {
    if (open) refreshPushState();
  }, [open]);

  // Sincroniza los anuncios publicados desde el panel al buzón local.
  useEffect(() => {
    void syncAnnouncements();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void syncAnnouncements();
    }, 120_000);
    const onVisible = () => document.visibilityState === "visible" && void syncAnnouncements();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Escucha en tiempo real emisiones de notificaciones push desde el panel
  useEffect(() => {
    if (typeof window === "undefined" || !db) return;
    try {
      const broadcastsRef = query(ref(db, "push_broadcasts"), limitToLast(5));
      const unsub = onChildAdded(broadcastsRef, (snap) => {
        const b = snap.val() as {
          title?: string;
          body?: string;
          image?: string | null;
          path?: string;
          created_at?: number;
        };
        if (!b || !b.title) return;

        // Solo notificar si fue emitido recientemente (últimos 30 minutos)
        if (b.created_at && Date.now() - b.created_at > 30 * 60 * 1000) return;

        const seenKey = `pll_bcast_${snap.key}`;
        if (window.localStorage.getItem(seenKey)) return;
        window.localStorage.setItem(seenKey, "1");

        // 1. Agregar al buzón interno con deduplicación por sourceId
        addNotification({
          title: b.title,
          body: b.body ?? "",
          path: b.path || "/",
          image: b.image || undefined,
          sourceId: snap.key ?? undefined,
        });

        // 2. Disparar notificación nativa del sistema en móvil o PC si tiene permiso
        if ("Notification" in window && Notification.permission === "granted") {
          const title = b.title;
          const body = b.body ?? "";
          const image = b.image || undefined;
          const path = b.path || "/";

          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready
              .then((reg) => {
                void reg.showNotification(title, {
                  body,
                  icon: "/purollano-logo.png",
                  badge: "/purollano-logo.png",
                  ...(image ? { image } : {}),
                  tag: `pll-${snap.key}`,
                  renotify: true,
                  vibrate: [250, 100, 250, 100, 250],
                  data: { path },
                  actions: [
                    { action: "listen", title: "▶ Escuchar en vivo" },
                    { action: "open", title: "Abrir radio" },
                  ],
                });
              })
              .catch(() => {
                try {
                  new Notification(title, { body, icon: "/purollano-logo.png" });
                } catch {
                  /* ignorar */
                }
              });
          } else {
            try {
              new Notification(title, { body, icon: "/purollano-logo.png" });
            } catch {
              /* ignorar */
            }
          }
        }
      });

      return () => {
        unsub();
      };
    } catch {
      /* ignorar */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  const unread = items.filter((n) => !n.read).length;

  const PERMISSION_MESSAGES: Record<PushStatus, string> = {
    registered: "¡Listo! Recibirás los avisos en este dispositivo.",
    "not-configured": "Las notificaciones no están configuradas todavía.",
    unsupported: "Tu navegador no soporta notificaciones.",
    "open-in-new-tab": "Abre la página en su propia pestaña para dar el permiso.",
    denied: "Permiso bloqueado. Actívalo en los ajustes del navegador.",
    error: "No pudimos activar los avisos. Intenta de nuevo.",
  };

  const activar = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await enablePush();
      setMsg(PERMISSION_MESSAGES[res.status]);
      refreshPushState();
    } finally {
      setBusy(false);
    }
  };

  const desactivar = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await disablePush();
      setMsg("Avisos desactivados en este dispositivo.");
      refreshPushState();
    } finally {
      setBusy(false);
    }
  };

  const cambiarOptOut = (value: boolean) => {
    setPushOptOut(value);
    setOptedOut(value);
    setMsg(
      value
        ? "No volveremos a pedirte permiso ni enviarte avisos."
        : "Podrás recibir avisos de nuevo.",
    );
  };

  const handlePromptActivate = async () => {
    setPromptBusy(true);
    try {
      const res = await enablePush();
      if (res.status === "registered") {
        setPromptSuccess(true);
        refreshPushState();
        setTimeout(() => {
          setShowPrompt(false);
        }, 2200);
      } else {
        setShowPrompt(false);
        refreshPushState();
      }
    } catch {
      setShowPrompt(false);
    } finally {
      setPromptBusy(false);
    }
  };

  const handlePromptRemindLater = () => {
    if (typeof window !== "undefined") {
      // Recordar más tarde: silenciar durante 24 horas
      window.localStorage.setItem(
        "pll_push_remind_later_ts",
        String(Date.now() + 24 * 60 * 60 * 1000),
      );
    }
    setShowPrompt(false);
  };

  const handlePromptClose = () => {
    if (typeof window !== "undefined") {
      // Cerrar sin elegir opciones: silenciar en esta sesión
      window.sessionStorage.setItem("pll_push_prompt_dismissed_session", "1");
    }
    setShowPrompt(false);
  };

  return (
    <>
      {/* Mensaje flotante arriba de la campanita */}
      {showPrompt && !open && (
        <aside
          role="region"
          aria-label="Aviso de notificaciones"
          className="fixed bottom-42 right-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[var(--oro)]/40 bg-[var(--crema)] p-4 shadow-[0_14px_40px_-10px_rgba(0,0,0,0.3)] transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 sm:bottom-46 sm:right-6"
        >
          {/* Triángulo indicador apuntando hacia la campanita */}
          <div
            className="absolute -bottom-2 right-5 h-3.5 w-3.5 rotate-45 border-b border-r border-[var(--oro)]/40 bg-[var(--crema)]"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--oro)]/25 text-[var(--sabana)]">
                  <Bell className="h-4 w-4" />
                </span>
                <p className="font-display text-sm font-semibold text-[var(--sabana)]">
                  ¡No te pierdas nada!
                </p>
              </div>
              <button
                onClick={handlePromptClose}
                aria-label="Cerrar aviso"
                title="Cerrar"
                className="rounded-full p-1 text-[var(--carbon)]/50 transition hover:bg-[var(--sabana)]/10 hover:text-[var(--carbon)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {promptSuccess ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-medium text-green-800">
                <Check className="h-4 w-4 text-green-600" />
                ¡Listo! Notificaciones activadas.
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs leading-relaxed text-[var(--carbon)]/80">
                  Activa las notificaciones para enterarte cuando comiencen tus programas favoritos, estrenos y canciones en vivo.
                </p>

                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    onClick={handlePromptActivate}
                    disabled={promptBusy}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--sabana)] px-3.5 py-2 text-xs font-semibold text-[var(--crema)] shadow-sm transition hover:bg-[var(--terracota)] disabled:opacity-60"
                  >
                    {promptBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Bell className="h-3.5 w-3.5 text-[var(--oro)]" />
                    )}
                    Activar
                  </button>
                  <button
                    onClick={handlePromptRemindLater}
                    disabled={promptBusy}
                    className="rounded-full border border-[var(--sabana)]/20 px-3 py-2 text-xs text-[var(--sabana)] transition hover:bg-[var(--sabana)]/10 disabled:opacity-60"
                  >
                    Más tarde
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      )}

      <button
        onClick={() => {
          setOpen((v) => !v);
          if (showPrompt) setShowPrompt(false);
        }}
        aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`}
        aria-expanded={open}
        className="fixed bottom-28 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--oro)]/40 bg-[var(--sabana)] text-[var(--crema)] shadow-lg transition hover:scale-105 hover:bg-[var(--oro)] hover:text-[var(--carbon)] sm:bottom-32 sm:right-6"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--terracota)] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-[var(--carbon)]/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />
          <section
            role="dialog"
            aria-label="Notificaciones"
            className="fixed bottom-24 right-3 z-50 flex max-h-[70vh] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--sabana)]/20 bg-[var(--crema)] shadow-2xl sm:bottom-32 sm:right-6"
          >
            <header className="flex items-center gap-2 border-b border-[var(--sabana)]/10 bg-white px-4 py-3">
              <Bell className="h-4 w-4 text-[var(--terracota)]" />
              <h2 className="font-display text-base text-[var(--sabana)]">Notificaciones</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar notificaciones"
                className="ml-auto rounded-full p-1.5 text-[var(--sabana)] transition hover:bg-[var(--oro)]/20"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {permission !== "unsupported" && (
              <div className="border-b border-[var(--sabana)]/10 bg-[var(--oro)]/8 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-[var(--sabana)]">
                  <Settings2 className="h-3.5 w-3.5" /> Permisos de notificación
                </p>
                <p className="mt-1 text-[12px] text-[var(--muted-foreground)]">
                  {optedOut
                    ? "Elegiste no recibir avisos de este sitio."
                    : subscribed
                      ? "Avisos activados en este dispositivo."
                      : permission === "denied"
                        ? "El navegador tiene los avisos bloqueados."
                        : "Los avisos están desactivados."}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {embedded && !subscribed ? (
                    <button
                      onClick={() =>
                        window.open(window.location.href, "_blank", "noopener,noreferrer")
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--oro)] px-3 py-1.5 text-xs font-semibold text-[var(--carbon)] transition hover:scale-[1.02]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir en pestaña
                    </button>
                  ) : subscribed ? (
                    <button
                      onClick={desactivar}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sabana)]/30 px-3 py-1.5 text-xs text-[var(--sabana)] transition hover:bg-[var(--sabana)]/10 disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <BellOff className="h-3.5 w-3.5" />
                      )}
                      Desactivar avisos
                    </button>
                  ) : (
                    <button
                      onClick={activar}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--oro)] px-3 py-1.5 text-xs font-semibold text-[var(--carbon)] transition hover:scale-[1.02] disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Bell className="h-3.5 w-3.5" />
                      )}
                      Permitir avisos
                    </button>
                  )}

                  <button
                    onClick={() => cambiarOptOut(!optedOut)}
                    className="rounded-full border border-[var(--sabana)]/20 px-3 py-1.5 text-xs text-[var(--terracota)] transition hover:bg-[var(--terracota)]/10"
                  >
                    {optedOut ? "Volver a permitir" : "No recibir más"}
                  </button>
                </div>

                {msg && <p className="mt-2 text-[12px] text-[var(--muted-foreground)]">{msg}</p>}
              </div>
            )}


            {items.length > 0 && (
              <div className="flex items-center gap-2 border-b border-[var(--sabana)]/10 px-3 py-2">
                <button
                  onClick={markAllRead}
                  disabled={unread === 0}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[var(--sabana)] transition hover:bg-[var(--oro)]/20 disabled:opacity-40"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Marcar todo leído
                </button>
                <button
                  onClick={clearNotifications}
                  className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-[var(--terracota)] transition hover:bg-[var(--terracota)]/10"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Borrar todo
                </button>
              </div>
            )}

            <ul className="flex-1 overflow-y-auto">
              {items.length === 0 && (
                <li className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <Inbox className="h-8 w-8 text-[var(--sabana)]/30" />
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Aún no tienes notificaciones. Activa los avisos en el menú para recibirlas.
                  </p>
                </li>
              )}
              {items.map((n) => (
                <li
                  key={n.id}
                  className={`flex gap-3 border-b border-[var(--sabana)]/8 px-4 py-3 transition ${n.read ? "bg-transparent" : "bg-[var(--oro)]/10"}`}
                >
                  {n.image && (
                    <img
                      src={n.image}
                      alt=""
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate font-display text-sm text-[var(--sabana)]">{n.title}</p>
                      <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                        {timeAgo(n.at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-[var(--carbon)]/80">{n.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    {!n.read && (
                      <button
                        onClick={() => markRead(n.id)}
                        aria-label="Marcar como leído"
                        title="Marcar como leído"
                        className="rounded-full p-1.5 text-[var(--sabana)] transition hover:bg-[var(--oro)]/25"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeNotification(n.id)}
                      aria-label="Borrar notificación"
                      title="Borrar"
                      className="rounded-full p-1.5 text-[var(--terracota)] transition hover:bg-[var(--terracota)]/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
