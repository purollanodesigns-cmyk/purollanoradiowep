/**
 * Notificaciones push (Firebase Cloud Messaging) para Puro Llano Radio.
 * Solo se ejecuta en el navegador, tras un gesto del usuario.
 */
import { db } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { addNotification } from "@/lib/notifications-store";

// Usamos las mismas variables de entorno que firebase.ts, con fallback hardcoded
const apiKeyFCM =
  import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-8UJUQcQX-1meKwlSpR-gozptwKwumIQ";
const projectIdFCM =
  import.meta.env.VITE_FIREBASE_PROJECT_ID || "puro-llano-radio";
const appIdFCM =
  import.meta.env.VITE_FIREBASE_APP_ID || "1:526331475757:web:8bea3b708143637a2bc5a4";
const messagingSenderIdFCM =
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "526331475757";
// La VAPID key pública de FCM (se genera en Firebase Console → Cloud Messaging)
const vapidKey =
  import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined ||
  import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;

const firebaseConfig = {
  apiKey: apiKeyFCM,
  projectId: projectIdFCM,
  appId: appIdFCM,
  messagingSenderId: messagingSenderIdFCM,
};

export const TOKEN_STORAGE_KEY = "pll_push_token";
export const OPTOUT_STORAGE_KEY = "pll_push_optout";

/** True si el usuario pidió no recibir más avisos de este sitio. */
export function isPushOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(OPTOUT_STORAGE_KEY) === "1";
}

/** Marca (o quita) la preferencia de no recibir más avisos. */
export function setPushOptOut(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(OPTOUT_STORAGE_KEY, "1");
  else window.localStorage.removeItem(OPTOUT_STORAGE_KEY);
}

export type PushStatus =
  | "registered"
  | "not-configured"
  | "unsupported"
  | "open-in-new-tab"
  | "denied"
  | "error";

export interface PushResult {
  status: PushStatus;
  token?: string;
}

/** Activa las notificaciones push. Llamar desde un click del usuario. */
export async function enablePush(): Promise<PushResult> {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId || !firebaseConfig.messagingSenderId) {
    return { status: "not-configured" };
  }
  if (typeof window === "undefined") return { status: "unsupported" };

  const { isSupported, getMessaging, getToken, onMessage } = await import("firebase/messaging");
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !(await isSupported())) {
    return { status: "unsupported" };
  }
  if (window.top !== window.self) return { status: "open-in-new-tab" };

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  try {
    const query = new URLSearchParams({
      apiKey: firebaseConfig.apiKey,
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      messagingSenderId: firebaseConfig.messagingSenderId,
    }).toString();

    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${query}`,
    );

    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      serviceWorkerRegistration,
      ...(vapidKey ? { vapidKey } : {}),
    });
    if (!token) return { status: "denied" };

    // Registrar el token en Firebase Realtime Database
    const tokenKey = token.replace(/[.#$[\]]/g, "_");
    await set(ref(db, `push_tokens/${tokenKey}`), {
      token,
      is_active: true,
      platform: "web",
      lang: navigator.language ?? null,
      created_at: Date.now(),
    });

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setPushOptOut(false);

    // Avisos en primer plano (la pestaña abierta muestra notificación rica nativa).
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? "Puro Llano Radio";
      const body = payload.notification?.body ?? "";
      const image = payload.notification?.image || (payload.data?.["image"] as string | undefined);
      const path = (payload.data?.["path"] as string | undefined) ?? "/";

      addNotification({ title, body, path, image });
      try {
        void serviceWorkerRegistration.showNotification(title, {
          body,
          icon: "/purollano-logo.png",
          badge: "/purollano-logo.png",
          ...(image ? { image } : {}),
          tag: "purollano-push-alert",
          renotify: true,
          vibrate: [250, 100, 250, 100, 250],
          data: { path },
          actions: [
            { action: "listen", title: "▶ Escuchar en vivo" },
            { action: "open", title: "Abrir radio" },
          ],
        });
      } catch {
        /* ignorar */
      }
    });

    return { status: "registered", token };
  } catch (err) {
    console.error("[Push] No se pudo activar:", err);
    return { status: "error" };
  }
}

/** Desactiva las notificaciones en este dispositivo. */
export async function disablePush(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  setPushOptOut(true);
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  try {
    if (token) {
      // Marcar token como inactivo en Firebase RTDB
      const tokenKey = token.replace(/[.#$[\]]/g, "_");
      await set(ref(db, `push_tokens/${tokenKey}/is_active`), false);
    }
    const { isSupported, getMessaging, deleteToken } = await import("firebase/messaging");
    if (await isSupported()) {
      const { getApps, getApp, initializeApp } = await import("firebase/app");
      const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      await deleteToken(getMessaging(app)).catch(() => undefined);
    }
    return true;
  } catch (err) {
    console.error("[Push] No se pudo desactivar:", err);
    return false;
  }
}

/** True si este navegador ya registró un token. */
export function hasPushToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY));
}

/** True si el entorno puede soportar push (sin pedir permiso). */
export function pushConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && firebaseConfig.messagingSenderId,
  );
}

/**
 * Activación automática silenciosa: si el navegador ya concedió el permiso
 * (o la app está instalada y el permiso persiste) y el usuario no pidió
 * dejar de recibir avisos, registra el token sin molestar al visitante.
 */
export async function autoEnablePush(): Promise<PushResult> {
  if (typeof window === "undefined") return { status: "unsupported" };
  if (isPushOptedOut()) return { status: "denied" };
  if (!pushConfigured()) return { status: "not-configured" };
  if (!("Notification" in window)) return { status: "unsupported" };
  if (Notification.permission !== "granted") return { status: "denied" };
  return enablePush();
}
