import { useState } from "react";
import { Play, Film } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const VIDEOS = [
  { id: "zl86oUyANBg", title: "Armando Mártinez Jr - Me Quiere y Qué?" },
  { id: "TzgWEsgYiwc", title: "Stiven Correa - Mi Crecimiento" },
  { id: "iWBg5JTZryY", title: "Stic Yajure - Escuchame Hermano" },
  { id: "YLwWB28vjoc", title: "Cheito González - Después De Dios Mi Padre" },
  { id: "nF2kOL6TSWQ", title: "Jackson Guardia - Entre Inviernos Y Veranos" },
  { id: "tWkknLzFrKc", title: "Fernando Tovar - Lo más Importante" },
];

function VideoCard({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl border-2 border-[var(--oro)]/30 bg-[var(--carbon)] shadow-[var(--shadow-warm)] transition duration-500 hover:-translate-y-1 hover:border-[var(--oro)] hover:shadow-[0_25px_60px_-20px_rgba(254,210,2,0.55)]">
      {play ? (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label={`Reproducir ${title}`}
          className="absolute inset-0 h-full w-full"
        >
          <img
            src={thumb}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--carbon)]/90 via-[var(--carbon)]/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--oro)] text-[var(--carbon)] shadow-[0_15px_40px_-10px_rgba(254,210,2,0.8)] transition duration-500 group-hover:scale-110">
              <Play className="h-7 w-7 fill-current" />
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-left">
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-[var(--oro)]">Video</div>
            <div className="mt-1 font-display text-lg text-white sm:text-xl">{title}</div>
          </div>
        </button>
      )}
    </div>
  );
}

export function VideoGallery() {
  return (
    <section id="cartelera-llanera" className="relative bg-[var(--crema)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.4em] text-[var(--terracota)] sm:text-xs">
            <Film className="h-3.5 w-3.5" /> Cartelera Llanera
          </div>
          <h2 className="mt-4 font-display text-3xl leading-tight text-[var(--sabana)] sm:text-5xl md:text-6xl">
            Videos que <span className="text-[var(--oro)]">saben a sabana</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
            Un fogón de joropo, coplas y contrapunteo. Selección desde YouTube para
            que el llano se vea, se oiga y se sienta.
          </p>
          <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-[var(--oro)]" />
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VIDEOS.map((v, i) => (
            <Reveal key={v.id} delay={i * 90} variant="up">
              <VideoCard {...v} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
