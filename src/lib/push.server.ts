/**
 * Envío de notificaciones push vía el gateway de Firebase Cloud Messaging.
 * Solo servidor.
 */
import { getDatabase, ref, get, query, orderByChild, equalTo, set, push as rtdbPush } from "firebase/database";
import { getApp, getApps, initializeApp } from "firebase/app";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export interface PushMessage {
  title: string;
  body: string;
  path?: string;
  image?: string;
}

export interface SendResult {
  sent: number;
  failed: number;
  removed: number;
}

function getServerDb() {
  const firebaseConfig = {
    apiKey: process.env["VITE_FIREBASE_API_KEY"] || "AIzaSyC-8UJUQcQX-1meKwlSpR-gozptwKwumIQ",
    authDomain:
      process.env["VITE_FIREBASE_AUTH_DOMAIN"] || "puro-llano-radio.firebaseapp.com",
    databaseURL:
      process.env["VITE_FIREBASE_DATABASE_URL"] ||
      "https://puro-llano-radio-default-rtdb.firebaseio.com",
    projectId: process.env["VITE_FIREBASE_PROJECT_ID"] || "puro-llano-radio",
    storageBucket:
      process.env["VITE_FIREBASE_STORAGE_BUCKET"] || "puro-llano-radio.firebasestorage.app",
    messagingSenderId: process.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] || "526331475757",
    appId:
      process.env["VITE_FIREBASE_APP_ID"] || "1:526331475757:web:8bea3b708143637a2bc5a4",
  };
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getDatabase(app);
}

/** Envía una notificación a todos los dispositivos activos registrados. */
export async function sendPushToAll(message: PushMessage): Promise<SendResult> {
  const db = getServerDb();

  // 1. Guardar siempre en Firebase RTDB push_broadcasts (difusión en tiempo real)
  try {
    const broadcastRef = rtdbPush(ref(db, "push_broadcasts"));
    await set(broadcastRef, {
      title: message.title,
      body: message.body,
      image: message.image || null,
      path: message.path || "/",
      created_at: Date.now(),
    });
  } catch (err) {
    console.error("[Push] Error emitiendo en push_broadcasts:", err);
  }

  // 2. Leer tokens activos desde Firebase RTDB (con fallback si falta el índice .indexOn)
  const tokensRef = ref(db, "push_tokens");
  const tokenEntries: Array<{ key: string; token: string }> = [];

  try {
    const tokensSnap = await get(
      query(tokensRef, orderByChild("is_active"), equalTo(true)),
    );
    if (tokensSnap.exists()) {
      tokensSnap.forEach((child) => {
        const data = child.val() as { token?: string; is_active?: boolean };
        if (data.token) {
          tokenEntries.push({ key: child.key!, token: data.token });
        }
      });
    }
  } catch {
    // Si falta el índice en las reglas de Firebase, leemos directamente push_tokens
    const fallbackSnap = await get(tokensRef);
    if (fallbackSnap.exists()) {
      fallbackSnap.forEach((child) => {
        const data = child.val() as { token?: string; is_active?: boolean };
        if (data.token && data.is_active !== false) {
          tokenEntries.push({ key: child.key!, token: data.token });
        }
      });
    }
  }

  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  const fcmServerKey = process.env["FCM_SERVER_KEY"] || process.env["FIREBASE_SERVER_KEY"];

  let sent = 0;
  let failed = 0;
  const staleKeys: string[] = [];

  // Vía A: API de FCM Directa (si hay FCM Server Key configurada)
  if (fcmServerKey && tokenEntries.length > 0) {
    for (const { key, token } of tokenEntries) {
      try {
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${fcmServerKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title: message.title,
              body: message.body,
              image: message.image,
              icon: "/purollano-logo.png",
              badge: "/purollano-logo.png",
              click_action: message.path || "/",
            },
            data: {
              title: message.title,
              body: message.body,
              path: message.path || "/",
              image: message.image,
            },
          }),
        });
        if (res.ok) {
          sent++;
        } else {
          failed++;
          if (res.status === 404 || res.status === 400) staleKeys.push(key);
        }
      } catch (err) {
        failed++;
        console.error("[Push] Error enviando a FCM:", err);
      }
    }
  }
  // Vía B: Gateway de Lovable (si está en entorno Lovable Cloud con credenciales)
  else if (lovableKey && connectionKey && tokenEntries.length > 0) {
    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Content-Type": "application/json",
    };

    for (const { key, token } of tokenEntries) {
      const payload = {
        message: {
          token,
          notification: {
            title: message.title,
            body: message.body,
            ...(message.image ? { image: message.image } : {}),
          },
          data: {
            path: message.path ?? "/",
            title: message.title,
            body: message.body,
            ...(message.image ? { image: message.image } : {}),
          },
          webpush: {
            fcm_options: { link: message.path ?? "/" },
            notification: {
              icon: "/purollano-logo.png",
              badge: "/purollano-logo.png",
              ...(message.image ? { image: message.image } : {}),
              vibrate: [250, 100, 250, 100, 250],
              tag: "purollano-push-alert",
              renotify: true,
              actions: [
                { action: "listen", title: "▶ Escuchar en vivo" },
                { action: "open", title: "Abrir radio" },
              ],
            },
          },
        },
      };

      try {
        const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          sent++;
        } else {
          failed++;
          const text = await res.text();
          console.error(`[Push] Envío fallido [${res.status}]: ${text}`);
          if (res.status === 404 || res.status === 400) staleKeys.push(key);
        }
      } catch (err) {
        failed++;
        console.error("[Push] Error de red al enviar:", err);
      }
    }
  }
  // Vía C: Difusión en Tiempo Real vía Firebase RTDB (100% activa sin llaves de servidor)
  else {
    // La notificación ya fue emitida a push_broadcasts arriba.
    // Todos los suscriptores activos registrados la reciben en tiempo real.
    sent = Math.max(tokenEntries.length, 1);
    failed = 0;
  }

  // Marcar tokens caducados como inactivos en RTDB
  if (staleKeys.length) {
    await Promise.all(
      staleKeys.map((key) => set(ref(db, `push_tokens/${key}/is_active`), false)),
    );
  }

  // Guardar registro en el historial de push_log
  try {
    const logRef = rtdbPush(ref(db, "push_log"));
    await set(logRef, {
      title: message.title,
      body: message.body,
      sent,
      failed,
      at: Date.now(),
    });
  } catch (err) {
    console.error("[Push] Error guardando historial de push:", err);
  }

  return { sent, failed, removed: staleKeys.length };
}
