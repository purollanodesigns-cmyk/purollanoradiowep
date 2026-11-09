import { useCallback, useEffect, useState } from "react";
import { BarChart3, Loader2, Globe2, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

/** Panel: estadísticas de visitas (totales, por hora y por país). */
export function StatsAdmin() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(24);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: err } = await (supabase.rpc as any)("admin_visit_stats", { _hours: hours });
    if (err) setError("No se pudieron cargar las estadísticas.");
    else setStats(data as Stats);
    setLoading(false);
  }, [hours]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxHour = Math.max(1, ...(stats?.by_hour ?? []).map((h) => h.count));
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
              { label: "Registradas", value: stats.tracked },
              { label: "Últimas 24 h", value: stats.last_24h },
              { label: "Últimos 7 días", value: stats.last_7d },
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
              <Clock className="h-4 w-4 text-[var(--terracota)]" />
              <h3 className="font-display text-sm uppercase tracking-widest text-[var(--sabana)]">Visitas por hora</h3>
            </div>
            <div className="mt-5 flex h-40 items-end gap-[3px] overflow-x-auto">
              {stats.by_hour.map((h) => {
                const d = new Date(h.hour);
                return (
                  <div key={h.hour} className="group flex min-w-[10px] flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[9px] tabular-nums text-[var(--muted-foreground)] opacity-0 transition group-hover:opacity-100">
                      {h.count}
                    </span>
                    <div
                      title={`${d.toLocaleString("es-VE")} · ${h.count} visitas`}
                      style={{ height: `${Math.max(2, (h.count / maxHour) * 100)}%` }}
                      className="w-full rounded-t bg-[var(--terracota)]/80 transition group-hover:bg-[var(--terracota)]"
                    />
                    <span className="text-[8px] tabular-nums text-[var(--muted-foreground)]">
                      {d.getHours().toString().padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
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
