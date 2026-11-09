import { useEffect, useState } from "react";
import { Play, Sparkles } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { supabase } from "@/integrations/supabase/client";

interface RecVideo {
  id: string;
  youtube_id: string;
  title: string;
  description: string | null;
}

function VideoCard({ video }: { video: RecVideo }) {
  const [play, setPlay] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`;
  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl border-2 border-[var(--terracota)]/30 bg-[var(--carbon)] shadow-[var(--shadow-warm)] transition duration-500 hover:-translate-y-1 hover:border-[var(--oro)] hover:shadow-[0_25px_60px_-20px_rgba(254,210,2,0.55)]">
      {play ? (
        <iframe
          src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label={`Reproducir ${video.title}`}
          className="absolute inset-0 h-full w-full"
        >
          <img
            src={thumb}
            alt={video.title}
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
            <div className="font-display text-[10px] uppercase tracking-[0.3em] text-[var(--oro)]">Recomendado</div>
            <div className="mt-1 font-display text-lg text-white sm:text-xl">{video.title}</div>
            {video.description && (
              <p className="mt-1 line-clamp-2 text-xs text-white/80">{video.description}</p>
            )}
          </div>
        </button>
      )}
    </div>
  );
}

/** Sección pública de videos recomendados desde el panel /admin. */
export function RecommendedVideos() {
  const [videos, setVideos] = useState<RecVideo[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("recommended_videos")
        .select("id, youtube_id, title, description")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(24);
      if (!cancelled) setVideos((data ?? []) as RecVideo[]);
    };

    void load();

    const channel = supabase
      .channel("recommended-videos")
      .on("postgres_changes", { event: "*", schema: "public", table: "recommended_videos" }, () => {
        void load();
      })
      .subscribe();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 120000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, []);

  if (videos.length === 0) return null;

  return (
    <section id="videos-recomendados" className="relative bg-[var(--crema)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.4em] text-[var(--terracota)] sm:text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Recomendados
          </div>
          <h2 className="mt-4 font-display text-3xl leading-tight text-[var(--sabana)] sm:text-5xl md:text-6xl">
            Lo que <span className="text-[var(--oro)]">recomendamos hoy</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg">
            Selección viva de videos escogidos por Puro Llano Radio. La lista se
            actualiza cada vez que recomendamos algo nuevo.
          </p>
          <div className="mx-auto mt-6 h-1 w-24 rounded-full bg-[var(--oro)]" />
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => (
            <Reveal key={v.id} delay={i * 90} variant="up">
              <VideoCard video={v} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
