import { createFileRoute } from "@tanstack/react-router";
import orinocoImg from "@/assets/orinoco.jpg";

export const Route = createFileRoute("/acerca")({
  head: () => ({
    meta: [
      { title: "Acerca de Puro Llano Radio" },
      {
        name: "description",
        content:
          "Historia, equipo y valores de Puro Llano Radio, la emisora digital del folklore llanero que transmite desde Puerto Ayacucho, Amazonas.",
      },
      { property: "og:title", content: "Acerca de Puro Llano Radio" },
      {
        property: "og:description",
        content:
          "Puente cultural entre el canto de la sabana y oyentes del mundo. Conoce la historia detrás de la emisora.",
      },
    ],
    links: [{ rel: "canonical", href: "https://purollanoradio.lovable.app/acerca" }],
  }),
  component: Acerca,
});

function Acerca() {
  return (
    <div className="bg-[var(--crema)] bg-grain">
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="font-display text-xs uppercase tracking-[0.4em] text-[var(--terracota)]">Acerca de nosotros</div>
          <h1 className="mt-4 font-display text-5xl leading-tight text-[var(--sabana)] sm:text-7xl">
            Un puente cultural<br />hecho de coplas.
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-[var(--muted-foreground)]">
            Puro Llano Radio nace con una convicción clara: el folklore llanero no puede
            quedarse en la memoria de quienes crecieron en la sabana. Merece viajar,
            escucharse y encontrarse con nuevas generaciones — dentro y fuera de Venezuela.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 md:grid-cols-2">
          <img
            src={orinocoImg}
            alt="Río Orinoco"
            loading="lazy"
            className="rounded-3xl border-4 border-[var(--oro)] shadow-[var(--shadow-warm)]"
          />
          <div>
            <div className="font-display text-xs uppercase tracking-[0.4em] text-[var(--terracota)]">Origen</div>
            <h2 className="mt-3 font-display text-4xl text-[var(--sabana)] sm:text-5xl">Transmitiendo desde Puerto Ayacucho</h2>
            <p className="mt-6 leading-relaxed text-[var(--muted-foreground)]">
              Nuestra sede está en el Estado Amazonas, en Puerto Ayacucho, un cruce
              natural entre el llano y la selva. Desde ahí, la señal recorre el mundo,
              cargando el calor campesino, el vocabulario propio y el argot típico del
              hombre y la mujer de nuestro llano.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl bg-[var(--sabana)] p-10 text-[var(--crema)] shadow-[var(--shadow-warm)] sm:p-16">
            <div className="font-display text-xs uppercase tracking-[0.4em] text-[var(--oro)]">Misión</div>
            <h3 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Ofrecer una vitrina de difusión a los artistas consagrados del género
              llanero y a los jóvenes talentos que inician camino en la música
              folklórica venezolana y colombiana.
            </h3>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-3">
          {[
            { t: "Autenticidad", d: "Orgullo por nuestras raíces, sin caricaturización." },
            { t: "Inclusión", d: "Folklore sin fronteras, uniendo los llanos hermanos." },
            { t: "Innovación", d: "Streaming HD contemporáneo, accesible desde cualquier lugar." },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-[var(--sabana)]/15 bg-white p-8">
              <div className="font-display text-2xl text-[var(--sabana)]">{v.t}</div>
              <p className="mt-3 text-sm text-[var(--muted-foreground)]">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
