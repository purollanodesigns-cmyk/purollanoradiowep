import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteMenu } from "@/components/SiteMenu";
import { FloatingPlayer } from "@/components/FloatingPlayer";
import { Footer } from "@/components/Footer";
import { InteractiveBackground } from "@/components/InteractiveBackground";
import { NotificationsButton } from "@/components/NotificationsButton";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--crema)] px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-[var(--sabana)]">404</h1>
        <h2 className="mt-4 font-display text-xl text-[var(--carbon)]">Página no encontrada</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          El camino que buscas se perdió en la sabana.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[var(--oro)] px-6 py-3 font-display text-sm uppercase tracking-wider text-[var(--carbon)] transition hover:scale-105"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error as Error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--crema)] px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl text-[var(--sabana)]">Se cortó la señal</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Algo interrumpió la transmisión. Intenta de nuevo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-[var(--oro)] px-6 py-3 font-display text-sm uppercase tracking-wider text-[var(--carbon)]"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="rounded-full border-2 border-[var(--sabana)] px-6 py-3 font-display text-sm uppercase tracking-wider text-[var(--sabana)]"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "qaka4PHaGk0keux9Voe8Vxhm-WNnkk3A64Vkm_1FZsw" },
      { title: "Puro Llano Radio · Emisora online del folklore llanero" },

      {
        name: "description",
        content:
          "Emisora digital del folklore llanero transmitiendo en HD desde Puerto Ayacucho, Venezuela. Arpa, cuatro y maracas 24/7, con leyendas y nuevos talentos del llano colombo-venezolano.",
      },
      { name: "author", content: "Puro Llano Radio" },
      { property: "og:title", content: "Puro Llano Radio · Emisora online del folklore llanero" },
      {
        property: "og:description",
        content:
          "Emisora digital del folklore llanero transmitiendo en HD desde Puerto Ayacucho, Venezuela. Arpa, cuatro y maracas 24/7, con leyendas y nuevos talentos del llano colombo-venezolano.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Puro Llano Radio · Emisora online del folklore llanero" },
      { name: "twitter:description", content: "Emisora digital del folklore llanero transmitiendo en HD desde Puerto Ayacucho, Venezuela. Arpa, cuatro y maracas 24/7, con leyendas y nuevos talentos del llano colombo-venezolano." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/mtAHqClukCbKqKmttsjlfAZvVJH2/social-images/social-1784133818756-HERO-PORTADA.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/mtAHqClukCbKqKmttsjlfAZvVJH2/social-images/social-1784133818756-HERO-PORTADA.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Rye&family=Bitter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("Service Worker registrado con éxito. Scope:", reg.scope);
          })
          .catch((err) => {
            console.error("Registro de Service Worker fallido:", err);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <InteractiveBackground />
      <SiteMenu />
      <main className="pt-20">
        <Outlet />
      </main>
      <Footer />
      <FloatingPlayer />
      <NotificationsButton />
    </QueryClientProvider>
  );
}
