import { createFileRoute } from "@tanstack/react-router";

const NOW_PLAYING_URL = "https://mipanel.stream/inc/widgets-api-en-vivo.php?porta=6816";

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
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: state } = await supabaseAdmin
          .from("push_state")
          .select("last_song, last_sent_at, cron_secret")
          .eq("id", 1)
          .maybeSingle();

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
        const lastSentAt = state?.last_sent_at ? new Date(state.last_sent_at).getTime() : 0;
        if (Date.now() - lastSentAt < 10 * 60 * 1000) {
          await supabaseAdmin.from("push_state").update({ last_song: raw }).eq("id", 1);
          return Response.json({ ok: true, skipped: "cooldown" });
        }

        const parts = raw.split(/\s+[-–—]\s+/);
        const title = parts[0]?.trim() || raw;
        const artist = parts.slice(1).join(" - ").trim();

        const { sendPushToAll } = await import("@/lib/push.server");
        const result = await sendPushToAll({
          title: "🎵 Sonando ahora en Puro Llano Radio",
          body: artist ? `${title} — ${artist}` : title,
          path: "/",
        });

        await supabaseAdmin
          .from("push_state")
          .update({ last_song: raw, last_sent_at: new Date().toISOString() })
          .eq("id", 1);

        return Response.json({ ok: true, song: raw, ...result });
      },
    },
  },
});
