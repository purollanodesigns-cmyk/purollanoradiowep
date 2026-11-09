import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Globe2, Music4, Users, MapPin, Sparkles, Play, Disc3 } from "lucide-react";
import heroAsset from "@/assets/hero-portada.jpg.asset.json";
import arpaImg from "@/assets/arpa-llanera.jpg";
import joropoImg from "@/assets/joropo.jpg";
import orinocoImg from "@/assets/orinoco.jpg";
import logo from "@/assets/purollano-logo.png.asset.json";
import { Reveal, CountUp } from "@/components/Reveal";
import { useNowPlaying } from "@/hooks/use-now-playing";
import { AppPromo } from "@/components/AppPromo";
import { Comments } from "@/components/Comments";
import { RecommendedVideos } from "@/components/RecommendedVideos";

const heroImg = heroAsset.url;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Puro Llano Radio · Emisora online del folklore llanero" },
      {
        name: "description",
        content:
          "Emisora digital del folklore llanero transmitiendo en HD desde Puerto Ayacucho, Venezuela. Arpa, cuatro y maracas 24/7, con leyendas y nuevos talentos del llano colombo-venezolano.",
      },
      { property: "og:title", content: "Puro Llano Radio · Emisora online del folklore llanero" },
      {
        property: "og:description",
        content:
          "Emisora digital del folklore llanero transmitiendo en HD desde Puerto Ayacucho, Venezuela. Arpa, cuatro y maracas 24/7, con leyendas y nuevos talentos del llano colombo-venezolano.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://purollanoradio.lovable.app/" },
      { rel: "preload", as: "image", href: heroImg, fetchpriority: "high" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RadioStation",
          name: "Puro Llano Radio",
          url: "https://purollanoradio.lovable.app/",
          slogan: "Emisora online del folklore llanero",
          description:
            "Emisora online del folklore llanero transmitiendo en HD desde Puerto Ayacucho, Venezuela, 24/7.",
          email: "purollanoradio@gmail.com",
          telephone: "+584164242274",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Puerto Ayacucho",
            addressRegion: "Amazonas",
            addressCountry: "VE",
          },
          sameAs: [
            "https://www.facebook.com/purollanoradio",
            "https://www.instagram.com/purollanoradio",
            "https://www.youtube.com/@purollanoradio",
            "https://x.com/purollanoradio",
            "https://www.tiktok.com/@purollanoradio.com",
          ],
        }),
      },
    ],
  }),

  component: Index,
});

function Index() {
  const meta = useNowPlaying();
  return (
    <div className="bg-[var(--crema)] bg-grain">
      {/* HERO */}
      <section className="relative -mt-20 flex min-h-[100svh] items-center overflow-hidden pt-20">
        <img
          src={heroImg}
          alt="Puro Llano Radio · portada"
          width={1920}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--carbon)]/45 via-[var(--carbon)]/55 to-[var(--carbon)]/90" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-24 text-center text-[var(--crema)]">
          <img
            src={logo.url}
            alt=""
            className="mb-6 h-24 w-24 animate-[pll-hero-logo_1.2s_cubic-bezier(0.22,1,0.36,1)_both] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] sm:h-28 sm:w-28"
          />

          <div className="mb-4 inline-flex animate-[fade-in_0.7s_ease-out_0.2s_both] items-center gap-2 rounded-full border border-[var(--oro)]/40 bg-[var(--carbon)]/40 px-4 py-1.5 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--oro)] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--oro)]"></span>
            </span>
            <span className="font-display text-xs uppercase tracking-[0.4em] text-[var(--oro)]">Transmitiendo en vivo · 24/7</span>
          </div>

          <h1 className="text-shadow-warm animate-[fade-in_0.9s_cubic-bezier(0.22,1,0.36,1)_0.35s_both] font-display text-[2.5rem] leading-[1] sm:text-7xl md:text-8xl">
            El canto de la<br />
            <span className="text-[var(--oro)]">sabana</span>, al mundo.
          </h1>

          <p className="mt-6 max-w-2xl animate-[fade-in_0.9s_ease-out_0.6s_both] text-base font-light leading-relaxed text-white/85 sm:mt-8 sm:text-xl">
            Puro Llano Radio es la emisora online del folklore llanero: arpa, cuatro,
            maracas y coplas transmitidas en alta definición desde Puerto Ayacucho,
            Amazonas, para todo el planeta.
          </p>

          {/* Now playing card with artwork */}
          <div className="mt-8 flex w-full max-w-md animate-[fade-in_0.9s_ease-out_0.75s_both] items-center gap-4 rounded-2xl border border-[var(--oro)]/30 bg-[var(--carbon)]/45 p-3 text-left backdrop-blur-md sm:mt-10">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--carbon)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)] sm:h-24 sm:w-24">
              {meta.artwork ? (
                <img
                  src={meta.artwork}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = logo.url; }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--sabana)] to-[var(--carbon)]">
                  <Disc3 className="h-8 w-8 text-[var(--oro)]" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[10px] uppercase tracking-[0.3em] text-[var(--oro)]">Sonando ahora</div>
              <div className="mt-1 truncate font-body text-sm font-semibold text-white sm:text-base">{meta.title}</div>
              {meta.artist && (
                <div className="truncate text-xs text-white/70 sm:text-sm">{meta.artist}</div>
              )}
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col justify-center gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:gap-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event("pll:play")); }}
              className="btn-shimmer btn-pulse-soft group relative inline-flex items-center justify-center gap-3 rounded-full bg-[var(--oro)] px-6 py-4 font-display text-xs uppercase tracking-[0.2em] text-[var(--carbon)] transition duration-500 ease-out hover:scale-[1.06] hover:shadow-[0_20px_50px_-10px_rgba(254,210,2,0.65)] sm:px-8 sm:text-sm"
            >
              <Play className="h-4 w-4 fill-current" />
              Escuchar en vivo
            </a>
            <Link
              to="/artistas"
              className="inline-flex items-center justify-center gap-3 rounded-full border-2 border-white/40 bg-white/5 px-6 py-4 font-display text-xs uppercase tracking-[0.2em] text-white backdrop-blur transition duration-500 ease-out hover:scale-[1.04] hover:border-[var(--oro)] hover:text-[var(--oro)] sm:px-8 sm:text-sm"
            >
              Conocer artistas
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs uppercase tracking-[0.3em] text-white/60">
            <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Puerto Ayacucho · Amazonas</span>
            <span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5" /> Alcance global</span>
            <span className="flex items-center gap-2"><Radio className="h-3.5 w-3.5" /> Streaming HD</span>
          </div>
        </div>
      </section>

      {/* MANIFIESTO */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Reveal>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-[var(--terracota)] sm:text-xs">Nuestra esencia</div>
            <h2 className="mt-4 font-display text-3xl leading-tight text-[var(--sabana)] sm:text-5xl md:text-6xl">
              "A través de este espacio se difunde el canto de la sabana,
              se hace sentir el calor campesino."
            </h2>
            <div className="mx-auto mt-8 h-1 w-24 rounded-full bg-[var(--oro)]" />
            <p className="mt-8 text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
              Somos una emisora digital de vanguardia fundada con la firme misión de{" "}
              <span className="font-semibold text-[var(--sabana)]">salvaguardar, promover y proyectar</span>{" "}
              el folklore y la música llanera. Un puente cultural entre el argot del campo
              y oyentes de todo el mundo — porque la tradición no se guarda, se enciende.
            </p>
          </Reveal>
        </div>
      </section>

      {/* VALORES */}
      <section id="escucha" className="relative bg-[var(--sabana)] py-24 text-[var(--crema)] sm:py-32">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url(${arpaImg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--sabana)]/95 via-[var(--sabana)]/90 to-[var(--sabana)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <div className="font-display text-xs uppercase tracking-[0.4em] text-[var(--oro)]">Lo que nos mueve</div>
            <h2 className="mt-4 font-display text-4xl sm:text-6xl">Tres pilares, un solo llano</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Autenticidad",
                body: "Orgullo por nuestras raíces: mantenemos intactos el lenguaje, la calidez y las costumbres llaneras. Sin caricaturas, con dignidad de emisora internacional.",
              },
              {
                icon: Users,
                title: "Inclusión Cultural",
                body: "Un espacio abierto para el folklore sin fronteras. Uniendo los llanos colombo-venezolanos, desde el veterano consagrado hasta la joven copla de relevo.",
              },
              {
                icon: Radio,
                title: "Innovación Técnica",
                body: "Transmisión digital continua en alta definición, accesible desde cualquier rincón del planeta a través de la web contemporánea.",
              },
            ].map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 140} variant="up">
                <div className="group h-full rounded-2xl border border-[var(--oro)]/25 bg-[var(--carbon)]/40 p-7 backdrop-blur transition duration-500 hover:-translate-y-2 hover:border-[var(--oro)] hover:bg-[var(--carbon)]/60 hover:shadow-[0_25px_60px_-20px_rgba(254,210,2,0.4)] sm:p-8">
                  <Reveal delay={i * 140 + 200} variant="pop" duration={600} className="mb-5 inline-block">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--oro)] text-[var(--carbon)] transition group-hover:rotate-6 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                  </Reveal>
                  <h3 className="font-display text-2xl text-[var(--oro)]">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SPLIT: PROPUESTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 sm:gap-16 md:grid-cols-2">
          <Reveal variant="left" duration={800} className="relative">
            <div className="group overflow-hidden rounded-3xl border-4 border-[var(--oro)] shadow-[var(--shadow-warm)]">
              <img
                src={joropoImg}
                alt="Músicos llaneros tocando joropo alrededor del fogón"
                width={1400}
                height={1000}
                loading="lazy"
                className="w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.06]"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-2xl bg-[var(--oro)] p-6 shadow-xl sm:block float-slow">
              <Music4 className="h-8 w-8 text-[var(--carbon)]" />
              <div className="mt-2 font-display text-2xl text-[var(--carbon)]">Joropo</div>
              <div className="font-body text-xs uppercase tracking-widest text-[var(--carbon)]/70">arpa · cuatro · maracas</div>
            </div>
          </Reveal>

          <Reveal variant="right" delay={150} duration={800}>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-[var(--terracota)] sm:text-xs">Propuesta de valor</div>
            <h2 className="mt-4 font-display text-3xl leading-tight text-[var(--sabana)] sm:text-5xl">
              Una vitrina para el<br />
              artista llanero.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
              Ofrecemos difusión tanto a los <strong className="text-[var(--sabana)]">artistas consagrados</strong>{" "}
              del género como a los <strong className="text-[var(--sabana)]">jóvenes talentos</strong> que
              inician camino en la música folklórica venezolana y colombiana. Mantenemos
              vivas las tradiciones, los mitos y las historias del llano en formato digital
              continuo e interactivo.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "Transmisión 24/7 en calidad HD, sin interrupciones.",
                "Rotación curada: leyendas y nuevas voces del llano colombo-venezolano.",
                "Crónicas, mitos y argot llanero contados con voz propia.",
                "Acceso desde cualquier dispositivo, en cualquier parte del planeta.",
              ].map((line, i) => (
                <Reveal as="li" key={line} delay={200 + i * 110} variant="left" duration={550} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--oro)]" />
                  <span className="text-[var(--foreground)]">{line}</span>
                </Reveal>
              ))}
            </ul>

            <Link
              to="/acerca"
              className="btn-shimmer mt-10 inline-flex items-center gap-3 rounded-full bg-[var(--carbon)] px-7 py-4 font-display text-xs uppercase tracking-[0.2em] text-[var(--oro)] transition duration-500 ease-out hover:scale-[1.05] hover:bg-[var(--sabana)] hover:shadow-[0_20px_50px_-15px_rgba(114,76,33,0.7)] sm:px-8 sm:text-sm"
            >
              Conoce nuestra historia
            </Link>
          </Reveal>
        </div>
      </section>

      {/* NÚMEROS */}
      <section className="border-y-4 border-[var(--oro)] bg-[var(--carbon)] py-16 text-[var(--crema)]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { n: 24, sfx: "/7", l: "Transmisión continua" },
            { n: 100, sfx: "%", l: "Calidad HD" },
            { n: 2, sfx: "", l: "Naciones hermanas" },
            { n: 365, sfx: " días", l: "Al aire por año" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 130} variant="pop" duration={650}>
              <div className="text-center">
                <div className="font-display text-4xl text-[var(--oro)] sm:text-6xl">
                  <CountUp to={s.n} suffix={s.sfx} />
                </div>
                <div className="mt-2 font-body text-[10px] uppercase tracking-[0.3em] text-white/60 sm:text-xs">{s.l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DESDE PUERTO AYACUCHO */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-5">
          <Reveal variant="left" duration={800} className="md:col-span-2">
            <div className="font-display text-xs uppercase tracking-[0.4em] text-[var(--terracota)]">Desde el corazón del Amazonas</div>
            <h2 className="mt-4 font-display text-4xl text-[var(--sabana)] sm:text-5xl">Puerto Ayacucho al mundo</h2>
            <p className="mt-6 leading-relaxed text-[var(--muted-foreground)]">
              Transmitimos desde las entrañas del Estado Amazonas, donde el Orinoco marca
              el ritmo y la sabana el compás. Nuestra señal viaja por la web para llegar
              donde haga falta un pedazo de llano.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[var(--sabana)]/15 bg-white p-4 transition duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-warm)]">
              <MapPin className="h-5 w-5 text-[var(--terracota)]" />
              <div className="text-sm">
                <div className="font-display text-[var(--sabana)]">Puerto Ayacucho</div>
                <div className="text-[var(--muted-foreground)]">Amazonas · Venezuela</div>
              </div>
            </div>
          </Reveal>
          <Reveal variant="right" delay={150} duration={800} className="md:col-span-3">
            <div className="group overflow-hidden rounded-3xl border-4 border-[var(--sabana)]/20 shadow-[var(--shadow-warm)]">
              <img
                src={orinocoImg}
                alt="Río Orinoco al amanecer"
                width={1400}
                height={900}
                loading="lazy"
                className="w-full object-cover transition duration-[900ms] ease-out group-hover:scale-[1.05]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* VIDEOS RECOMENDADOS */}
      <RecommendedVideos />


      {/* APP DOWNLOAD */}
      <AppPromo />

      {/* COMENTARIOS */}
      <Comments />

      {/* CTA FINAL */}
      <section className="relative overflow-hidden py-24">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top, oklch(0.72 0.19 90 / 0.35), transparent 60%), linear-gradient(135deg, var(--sabana), var(--terracota))",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center text-[var(--crema)]">
          <Reveal variant="up" duration={800}>
            <h2 className="font-display text-4xl leading-tight sm:text-6xl">
              La sabana canta.<br />
              <span className="text-[var(--oro)]">¿La vas a escuchar?</span>
            </h2>
          </Reveal>
          <Reveal variant="fade" delay={200} duration={800}>
            <p className="mt-6 text-base text-white/85 sm:text-lg">
              Pulsa play y déjate llevar por el arpa, el cuatro y las maracas.
              No importa desde dónde nos oigas: aquí siempre hay llano.
            </p>
          </Reveal>
          <Reveal variant="pop" delay={400} duration={700}>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event("pll:play")); }}
              className="btn-shimmer btn-pulse-soft mt-10 inline-flex items-center gap-3 rounded-full bg-[var(--oro)] px-8 py-5 font-display text-sm uppercase tracking-[0.2em] text-[var(--carbon)] transition duration-500 ease-out hover:scale-110 hover:shadow-[0_25px_60px_-10px_rgba(254,210,2,0.75)] sm:px-10 sm:text-base"
            >
              <Play className="h-5 w-5 fill-current" />
              Encender la radio
            </a>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
