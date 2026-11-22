import { createMiddleware } from "@tanstack/react-start";
import { auth } from "@/lib/firebase";

/**
 * Middleware de cliente registrado en `src/start.ts` para que todas las
 * llamadas a serverFn lleven automáticamente el ID Token de Firebase Auth
 * en el encabezado Authorization.
 */
export const attachFirebaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    if (auth.currentUser) {
      try {
        token = await auth.currentUser.getIdToken();
      } catch {
        // Ignorar si no se puede obtener el token
      }
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
