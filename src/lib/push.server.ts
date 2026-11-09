/**
 * Envío de notificaciones push vía el gateway de Firebase Cloud Messaging.
 * Solo servidor.
 */
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

/** Envía una notificación a todos los dispositivos activos registrados. */
export async function sendPushToAll(message: PushMessage): Promise<SendResult> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIREBASE_MESSAGING_API_KEY"];
  if (!lovableKey) throw new Error("LOVABLE_API_KEY no está configurada");
  if (!connectionKey) throw new Error("FIREBASE_MESSAGING_API_KEY no está configurada");

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rows, error } = await supabaseAdmin
    .from("push_tokens")
    .select("token")
    .eq("is_active", true)
    .limit(2000);
  if (error) throw new Error(`No se pudieron leer los dispositivos: ${error.message}`);

  const tokens = (rows ?? []).map((r) => r.token as string);
  const stale: string[] = [];
  let sent = 0;
  let failed = 0;

  const headers = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };

  for (const token of tokens) {
    const payload = {
      message: {
        token,
        notification: {
          title: message.title,
          body: message.body,
          ...(message.image ? { image: message.image } : {}),
        },
        data: { path: message.path ?? "/" },
        webpush: {
          fcm_options: { link: message.path ?? "/" },
          notification: { icon: "/purollano-logo.png", badge: "/purollano-logo.png" },
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
        if (res.status === 404 || res.status === 400) stale.push(token);
      }
    } catch (err) {
      failed++;
      console.error("[Push] Error de red al enviar:", err);
    }
  }

  if (stale.length) {
    await supabaseAdmin.from("push_tokens").update({ is_active: false }).in("token", stale);
  }

  return { sent, failed, removed: stale.length };
}
