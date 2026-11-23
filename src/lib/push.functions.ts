import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getDatabase, ref, get, query, orderByChild, equalTo } from "firebase/database";
import { getApp, getApps, initializeApp } from "firebase/app";

// Configuración Firebase embebida para uso en el servidor
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

function getServerDb() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getDatabase(app);
}

/**
 * Middleware que verifica que el request incluya un Firebase ID token válido
 * en el encabezado Authorization y que el usuario tenga rol de administrador en RTDB.
 */
const requireFirebaseAdmin = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) throw new Error("No autorizado: sin cabeceras");

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No autorizado: se requiere Bearer token");
    }

    const idToken = authHeader.replace("Bearer ", "").trim();
    if (!idToken) throw new Error("No autorizado: token vacío");

    // Verificar el token con la REST API de Firebase Auth
    const apiKey =
      process.env["VITE_FIREBASE_API_KEY"] || "AIzaSyC-8UJUQcQX-1meKwlSpR-gozptwKwumIQ";
    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      },
    );

    if (!verifyRes.ok) throw new Error("No autorizado: token inválido");

    const verifyData = (await verifyRes.json()) as {
      users?: Array<{ localId: string; email?: string }>;
    };
    const userObj = verifyData.users?.[0];
    const uid = userObj?.localId;
    if (!uid) throw new Error("No autorizado: sin UID en el token");

    // Verificar que el usuario sea administrador en RTDB
    const db = getServerDb();
    const roleSnap = await get(ref(db, `user_roles/${uid}`));
    const roleVal = roleSnap.val();

    const isAdmin =
      roleVal === "admin" ||
      roleVal === true ||
      (typeof roleVal === "object" &&
        roleVal !== null &&
        (roleVal.role === "admin" || roleVal.is_admin === true)) ||
      userObj?.email === "purollanoradio@gmail.com";

    if (!isAdmin) {
      throw new Error("No autorizado: sin permisos de administrador");
    }

    return next({ context: { uid } });
  },
);

const sendSchema = z.object({
  title: z.string().min(2).max(120),
  body: z.string().min(2).max(500),
  path: z.string().max(200).optional(),
  image: z.string().max(1200).optional(),
});

function parseInput(input: unknown) {
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    if (obj["data"] && typeof obj["data"] === "object") {
      return sendSchema.parse(obj["data"]);
    }
  }
  return sendSchema.parse(input);
}

/** Envía un anuncio manual a todos los suscriptores (solo administradores). */
export const sendAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAdmin])
  .validator((input: unknown) => parseInput(input))
  .handler(async ({ data }) => {
    const { sendPushToAll } = await import("./push.server");
    return sendPushToAll({
      title: data.title,
      body: data.body,
      path: data.path && data.path.startsWith("/") ? data.path : "/",
      image: data.image && data.image.startsWith("http") ? data.image : undefined,
    });
  });

/** Cantidad de dispositivos suscritos (solo administradores). */
export const countSubscribers = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAdmin])
  .handler(async () => {
    const db = getServerDb();
    const tokensRef = ref(db, "push_tokens");
    let count = 0;

    try {
      const tokensSnap = await get(
        query(tokensRef, orderByChild("is_active"), equalTo(true)),
      );
      if (tokensSnap.exists()) {
        count = Object.keys(tokensSnap.val() as object).length;
      }
    } catch {
      // Fallback si no está desplegado el índice en las reglas de RTDB
      const snap = await get(tokensRef);
      if (snap.exists()) {
        snap.forEach((child) => {
          const val = child.val() as { is_active?: boolean };
          if (val && val.is_active !== false) count++;
        });
      }
    }

    return { count };
  });
