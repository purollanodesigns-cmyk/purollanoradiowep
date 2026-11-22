import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { db } from "@/lib/firebase";
import { ref, runTransaction } from "firebase/database";

/** Registra una visita con el país detectado por cabeceras del edge en Realtime Database. */
export const recordVisit = createServerFn({ method: "POST" }).handler(async () => {
  const country =
    getRequestHeader("cf-ipcountry") ??
    getRequestHeader("x-vercel-ip-country") ??
    getRequestHeader("x-country-code") ??
    "UNKNOWN";

  if (!db) {
    return { total: null as number | null };
  }

  try {
    const visitsTotalRef = ref(db, "site_visits/total");
    const result = await runTransaction(visitsTotalRef, (currentTotal) => {
      return (currentTotal || 0) + 1;
    });

    // Guardar también desglose por país
    if (country) {
      const countryRef = ref(db, `site_visits/by_country/${country.replace(/[.#$[\]]/g, "_")}`);
      await runTransaction(countryRef, (cnt) => (cnt || 0) + 1);
    }

    return { total: Number(result.snapshot.val()) };
  } catch (err) {
    console.error("[Visits] Error actualizando visitas:", err);
    return { total: null as number | null };
  }
});
