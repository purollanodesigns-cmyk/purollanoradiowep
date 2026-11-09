import { createFileRoute, redirect } from "@tanstack/react-router";

/** Ruta antigua: ahora el panel vive en /admin protegido por cuenta y rol. */
export const Route = createFileRoute("/moderacion")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/admin", replace: true });
  },
  component: () => null,
});
