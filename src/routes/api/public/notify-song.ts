import { createFileRoute } from "@tanstack/react-router";
import { getDatabase, ref, get, set } from "firebase/database";
import { getApp, getApps, initializeApp } from "firebase/app";

const NOW_PLAYING_URL = "https://mipanel.stream/inc/widgets-api-en-vivo.php?porta=6816";

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

/**
 * Endpoint programado: revisa la canción en el aire y, si cambió,
 * envía una notificación push a los suscriptores.
 * Protegido con la cabecera x-cron-secret.
 */
export const Route = createFileRoute("/api/public/notify-song")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-secret") ?? "";

        // Leer estado desde Firebase RTDB
        const db = getServerDb();
        const stateSnap = await get(ref(db, "push_state"));
        const state = stateSnap.val() as {
          last_song?: string;
          last_sent_at?: number;
          cron_secret?: string;
        } | null;

        const expected = state?.cron_secret ?? process.env["PUSH_CRON_SECRET"] ?? "";
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let raw = "";
        try {
          const res = await fetch(NOW_PLAYING_URL, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { text?: string };
          raw = (data?.text ?? "").toString().replace(/\s+/g, " ").trim();
          if (/^sello/i.test(raw)) return Response.json({ ok: true, skipped: "jingle" });
        } catch (err) {
          console.error("[notify-song] metadata error:", err);
          return Response.json({ ok: false, reason: "metadata_unavailable" }, { status: 200 });
        }

        if (!raw || raw.length < 3) {
          return Response.json({ ok: true, skipped: "empty" });
        }

        if (state?.last_song === raw) {
          return Response.json({ ok: true, skipped: "same_song" });
        }

        // No enviar más de una notificación cada 10 minutos.
        const lastSentAt = state?.last_sent_at ?? 0;
        if (Date.now() - lastSentAt < 10 * 60 * 1000) {
          await set(ref(db, "push_state/last_song"), raw);
          return Response.json({ ok: true, skipped: "cooldown" });
        }

        const parts = raw.split(/\s+[-–—]\s+/);
        const title = parts[0]?.trim() || raw;
        const artist = parts.slice(1).join(" - ").trim();

        const { sendPushToAll } = await import("@/lib/push.server");
        const result = await sendPushToAll({
          title: "🎵 Sonando ahora en Puro Llano Radio",
          body: artist ? `${title} — ${artist}` : title,
          path: "/?play=1",
          image: "https://purollanoradio.lovable.app/hero-portada.jpg",
        });

        // Actualizar estado en RTDB
        await set(ref(db, "push_state"), {
          ...(state ?? {}),
          last_song: raw,
          last_sent_at: Date.now(),
        });

        return Response.json({ ok: true, song: raw, ...result });
      },
    },
  },
});
