import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Verifica que el usuario autenticado tenga rol de administrador. */
async function assertAdmin(context: { supabase: { rpc: (fn: string) => Promise<{ data: unknown }> } }) {
  const { data } = await context.supabase.rpc("is_admin");
  if (!data) throw new Error("unauthorized");
}

const sendSchema = z.object({
  title: z.string().min(2).max(80),
  body: z.string().min(2).max(300),
  path: z.string().max(200).optional(),
});

/** Envía un anuncio manual a todos los suscriptores (solo administradores). */
export const sendAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertAdmin(context as any);

    const { sendPushToAll } = await import("./push.server");
    return sendPushToAll({
      title: data.title,
      body: data.body,
      path: data.path && data.path.startsWith("/") ? data.path : "/",
    });
  });

/** Cantidad de dispositivos suscritos (solo administradores). */
export const countSubscribers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await assertAdmin(context as any);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("push_tokens")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    return { count: count ?? 0 };
  });
