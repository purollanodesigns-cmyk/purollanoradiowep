import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, Globe2, Clock, RefreshCw } from "lucide-react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

interface HourPoint {
  hour: string;
  count: number;
}
interface CountryPoint {
  country: string;
  count: number;
}
interface Stats {
  total: number;
  tracked: number;
  last_24h: number;
  last_7d: number;
  by_hour: HourPoint[];
  by_country: CountryPoint[];
}

const COUNTRY_NAMES: Record<string, string> = {
  VE: "Venezuela", CO: "Colombia", US: "Estados Unidos", ES: "España", MX: "México",
  AR: "Argentina", PE: "Perú", CL: "Chile", EC: "Ecuador", BR: "Brasil", PA: "Panamá",
  DO: "Rep. Dominicana", IT: "Italia", PT: "Portugal", CA: "Canadá", XX: "Desconocido",
};

const flag = (cc: string) =>
  cc === "XX" || cc.length !== 2
    ? "🌐"
    : String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));

/** Calcula estadísticas de visitas directamente desde Firebase RTDB. */
async function loadStatsFromRTDB(hours: number): Promise<Stats> {
  const [totalSnap, byCountrySnap] = await Promise.all([
    get(ref(db, "site_visits/total")),
    get(ref(db, "site_visits/by_country")),
  ]);

  const total = (totalSnap.val() as number) ?? 0;

  // Construir conteo por país
  const countryRaw = (byCountrySnap.val() as Record<string, number> | null) ?? {};
  const by_country: CountryPoint[] = Object.entries(countryRaw)
    .map(([country, count]) => ({ country: country.toUpperCase(), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const tracked = by_country.reduce((s, c) => s + c.count, 0);

  // Visitas por hora: RTDB no guarda timestamps granulares, así que
  // construimos datos de placeholder con el total dividido en buckets vacíos.
  // Si en el futuro se migra a un esquema con timestamps, aquí se leerían.
  const now = new Date();
  const by_hour: HourPoint[] = Array.from({ length: hours }, (_, i) => {
    const d = new Date(now.getTime() - (hours - 1 - i) * 3600_000);
    d.setMinutes(0, 0, 0);
    return { hour: d.toISOString(), count: 0 };
  });

  return {
    total,
    tracked,
    last_24h: 0,
    last_7d: 0,
    by_hour,
    by_country,
  };
}

/** Panel: estadísticas de visitas (totales, por hora y por país). */
export function StatsAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(24);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadStatsFromRTDB(hours);
      setStats(data);
    } catch {
      setError("No se pudieron cargar las estadísticas.");
    }
    setLoading(false);
  }, [hours]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxCountry = Math.max(1, ...(stats?.by_country ?? []).map((c) => c.count));

  return (
    <section className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <BarChart3 className="h-5 w-5 text-[var(--terracota)]" />
        <h2 className="font-display text-lg text-[var(--sabana)]">Estadísticas de visitas</h2>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded-full border border-[var(--sabana)]/20 bg-white px-3 py-1.5 text-xs"
            aria-label="Rango de horas"
          >
            <option value={12}>Últimas 12 h</option>
            <option value={24}>Últimas 24 h</option>
            <option value={48}>Últimas 48 h</option>
            <option value={168}>Últimos 7 días</option>
          </select>
          <button
            onClick={load}
            disabled={loading}
            aria-label="Recargar estadísticas"
            className="rounded-full border border-[var(--sabana)]/20 p-2 hover:bg-[var(--oro)]/20"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && !stats ? (
        <div className="rounded-2xl bg-white p-10 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--terracota)]" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { label: "Visitas totales", value: stats.total },
              { label: "Por país registradas", value: stats.tracked },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[var(--sabana)]/15 bg-white p-4">
                <div className="font-display text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                  {s.label}
                </div>
                <div className="mt-1 font-display text-3xl tabular-nums text-[var(--sabana)]">
                  {s.value.toLocaleString("es-VE")}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--sabana)]/15 bg-white p-5">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-[var(--terracota)]" />
              <h3 className="font-display text-sm uppercase tracking-widest text-[var(--sabana)]">Visitas por país</h3>
            </div>
            {stats.by_country.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">Aún no hay visitas registradas.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {stats.by_country.map((c) => (
                  <li key={c.country} className="flex items-center gap-3">
                    <span className="w-6 text-center text-base">{flag(c.country)}</span>
                    <span className="w-32 shrink-0 truncate text-xs text-[var(--foreground)]">
                      {COUNTRY_NAMES[c.country] ?? c.country}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--sabana)]/10">
                      <div
                        className="h-full rounded-full bg-[var(--oro)]"
                        style={{ width: `${(c.count / maxCountry) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs tabular-nums text-[var(--muted-foreground)]">
                      {c.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-[11px] text-[var(--muted-foreground)]">
              El país se detecta automáticamente al entrar al sitio. Las visitas anteriores a este panel solo cuentan en
              el total.
            </p>
          </div>
        </>
      ) : null}
    </section>
  );
}
