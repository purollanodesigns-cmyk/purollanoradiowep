import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/politica-privacidad")({
  head: () => ({
    meta: [
      { title: "Política de privacidad · Puro Llano Radio" },
      {
        name: "description",
        content:
          "Política de privacidad de Puro Llano Radio: manejo de datos de oyentes, cookies y cumplimiento internacional.",
      },
      { property: "og:title", content: "Política de privacidad · Puro Llano Radio" },
      {
        property: "og:description",
        content: "Marco normativo de manejo de datos y privacidad de los oyentes.",
      },
    ],
    links: [{ rel: "canonical", href: "https://purollanoradio.lovable.app/politica-privacidad" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="bg-[var(--crema)] bg-grain py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="font-display text-xs uppercase tracking-[0.4em] text-[var(--terracota)]">Marco normativo</div>
        <h1 className="mt-3 font-display text-5xl text-[var(--sabana)] sm:text-6xl">Política de privacidad</h1>

        <div className="prose prose-neutral mt-10 max-w-none space-y-6 text-[var(--foreground)]">
          <p className="text-lg text-[var(--muted-foreground)]">
            En Puro Llano Radio respetamos la privacidad de nuestros oyentes y usuarios de la web y de nuestras aplicaciones móviles. Esta política
            describe detalladamente cómo tratamos la información recolectada al usar nuestra plataforma
            de streaming y sus aplicaciones asociadas, de conformidad con las políticas de desarrolladores de Google.
          </p>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">1. Información que recolectamos</h2>
            <p>
              Nuestra plataforma y aplicación móvil no requieren registro ni solicitan datos personales de identificación (como nombre, correo electrónico o número telefónico) para acceder a la transmisión de radio.
            </p>
            <p className="mt-2">
              Sin embargo, recopilamos ciertos datos técnicos necesarios para el correcto funcionamiento del servicio:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Datos técnicos de conexión:</strong> Dirección IP aproximada (para análisis geográfico no intrusivo), tipo de dispositivo, sistema operativo, idioma y resolución de pantalla.</li>
              <li><strong>Métricas de uso:</strong> Hora de conexión, duración de la sesión y estado de la reproducción de audio.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">2. Uso de la información</h2>
            <p>
              Los datos técnicos se emplean de manera agregada y anónima únicamente para:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Garantizar la estabilidad y calidad de la señal de streaming de audio en HD.</li>
              <li>Generar estadísticas generales de audiencia (por ejemplo, número de oyentes concurrentes o países de conexión).</li>
              <li>Optimizar el rendimiento técnico de la aplicación móvil y la interfaz web en diferentes dispositivos.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">3. Cookies y almacenamiento local</h2>
            <p>
              Utilizamos herramientas de almacenamiento local (como localStorage) y cookies técnicas estrictamente necesarias para recordar las preferencias de la interfaz, incluyendo el volumen del reproductor de audio, el estado de silencio (mute) y el contador de sesiones. Esta información se almacena localmente en tu dispositivo, no contiene información personal y nunca se transmite a servidores externos ni a terceros.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">4. Servicios de terceros y SDKs</h2>
            <p>
              Para proveer el servicio de audio y las funcionalidades de la aplicación, interactuamos con los siguientes proveedores:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Proveedor de Streaming (conectarhosting.com):</strong> Procesa las peticiones de reproducción de audio y maneja de forma temporal la dirección IP para realizar la conexión de streaming.</li>
              <li><strong>Base de Datos y Analíticas (Google Firebase):</strong> Se utiliza para llevar un contador de visitas agregadas e interacciones generales (como comentarios voluntarios y me gusta).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">5. Menores de edad</h2>
            <p>
              Nuestra aplicación móvil y sitio web transmiten contenido apto para toda la familia y no recopilan intencionalmente información personal de menores de 13 años. Si tienes conocimiento de que un menor nos ha proporcionado información personal, te solicitamos ponerte en contacto con nosotros para eliminarla de inmediato.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">6. Derechos del usuario y eliminación de datos</h2>
            <p>
              Dado que no recolectamos datos de registro ni información personal identificable de forma obligatoria, no almacenamos perfiles de usuario. No obstante, si has dejado algún comentario voluntario o interacción en nuestra plataforma y deseas solicitar su eliminación, puedes hacerlo en cualquier momento.
            </p>
            <p className="mt-2">
              Para solicitar la eliminación de cualquier dato de interacción, escribe un correo con los detalles a <a href="mailto:purollanoradio@gmail.com" className="text-[var(--terracota)] underline">purollanoradio@gmail.com</a>. Responderemos y procesaremos tu solicitud en un plazo máximo de 72 horas.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">7. Cambios en esta política</h2>
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad periódicamente para reflejar cambios operativos, legales o de cumplimiento en las directrices de distribución de aplicaciones (Google Play Developer Policies). La versión actualizada siempre estará disponible y fechada en esta página.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-[var(--sabana)]">8. Información del desarrollador y contacto</h2>
            <p>
              Para cualquier consulta, reclamo o duda sobre esta política o el tratamiento de tus datos, puedes ponerte en contacto directo con el desarrollador a través de:
            </p>
            <ul className="list-none pl-0 mt-2 space-y-1">
              <li><strong>Desarrollador Responsable:</strong> Puro Llano Radio</li>
              <li><strong>Correo electrónico:</strong> <a href="mailto:purollanoradio@gmail.com" className="text-[var(--terracota)] underline">purollanoradio@gmail.com</a></li>
              <li><strong>Dirección:</strong> Puerto Ayacucho, Estado Amazonas, Venezuela</li>
            </ul>
          </section>

          <p className="pt-6 text-xs text-[var(--muted-foreground)]">
            Puerto Ayacucho, Amazonas, Venezuela · Última actualización: Julio de 2026.
          </p>
        </div>
      </div>
    </div>
  );
}
