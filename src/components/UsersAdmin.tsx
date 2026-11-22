import { useCallback, useEffect, useState } from "react";
import { Users, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { ref, get, set } from "firebase/database";
import { db } from "@/lib/firebase";

interface AdminUser {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
}

/** Panel: usuarios registrados, roles y permisos. */
export function UsersAdmin({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Leer user_roles desde RTDB
      const rolesSnap = await get(ref(db, "user_roles"));
      const rolesData = (rolesSnap.val() as Record<string, string> | null) ?? {};

      // Leer perfiles desde RTDB
      const profilesSnap = await get(ref(db, "profiles"));
      const profilesData = (profilesSnap.val() as Record<string, {
        email?: string;
        display_name?: string;
        created_at?: string;
      }> | null) ?? {};

      // Combinar: todos los UIDs que aparecen en roles o perfiles
      const allUids = new Set([...Object.keys(rolesData), ...Object.keys(profilesData)]);

      const list: AdminUser[] = [];
      for (const uid of allUids) {
        const profile = profilesData[uid] ?? {};
        list.push({
          id: uid,
          email: profile.email ?? null,
          display_name: profile.display_name ?? null,
          created_at: profile.created_at ?? new Date().toISOString(),
          is_admin: rolesData[uid] === "admin",
        });
      }

      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setUsers(list);
    } catch {
      setFeedback("No se pudo cargar la lista de usuarios.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setRole = async (u: AdminUser, grant: boolean) => {
    if (!grant && !confirm(`¿Quitar el rol de administrador a ${u.email}?`)) return;

    // Verificar que no sea el último admin
    if (!grant) {
      const adminCount = users.filter((x) => x.is_admin).length;
      if (adminCount <= 1) {
        setFeedback("No puedes quitar el último administrador.");
        return;
      }
    }

    setBusyId(u.id);
    setFeedback(null);
    try {
      if (grant) {
        await set(ref(db, `user_roles/${u.id}`), "admin");
      } else {
        await set(ref(db, `user_roles/${u.id}`), "user");
      }
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_admin: grant } : x)));
      setFeedback(grant ? "Rol de administrador otorgado." : "Rol de administrador retirado.");
    } catch {
      setFeedback("No se pudo cambiar el rol.");
    }
    setBusyId(null);
  };

  return (
    <section className="mt-6 rounded-2xl border border-[var(--sabana)]/15 bg-white p-5">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-[var(--terracota)]" />
        <h2 className="font-display text-lg text-[var(--sabana)]">Usuarios, roles y permisos</h2>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">{users.length} cuentas</span>
      </div>

      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Solo las cuentas con rol <strong>Administrador</strong> pueden moderar comentarios, publicar anuncios y enviar
        notificaciones.
      </p>

      {loading ? (
        <div className="p-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-[var(--terracota)]" />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--sabana)]/10">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-[var(--foreground)]">{u.display_name || u.email}</div>
                <div className="truncate text-[11px] text-[var(--muted-foreground)]">
                  {u.email} · {new Date(u.created_at).toLocaleDateString("es-VE")}
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider ${
                  u.is_admin ? "bg-[var(--oro)]/30 text-[var(--sabana)]" : "bg-[var(--sabana)]/10 text-[var(--muted-foreground)]"
                }`}
              >
                {u.is_admin ? "Administrador" : "Usuario"}
              </span>
              <button
                onClick={() => setRole(u, !u.is_admin)}
                disabled={busyId === u.id || u.id === currentUserId}
                title={u.id === currentUserId ? "No puedes cambiar tu propio rol" : undefined}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sabana)]/20 px-3 py-1.5 text-xs transition hover:bg-[var(--oro)]/20 disabled:opacity-40"
              >
                {busyId === u.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : u.is_admin ? (
                  <ShieldOff className="h-3.5 w-3.5" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                {u.is_admin ? "Quitar admin" : "Hacer admin"}
              </button>
            </li>
          ))}
          {users.length === 0 && (
            <li className="py-6 text-center text-sm text-[var(--muted-foreground)]">Sin cuentas registradas.</li>
          )}
        </ul>
      )}

      {feedback && <p className="mt-3 text-xs text-[var(--terracota)]">{feedback}</p>}
    </section>
  );
}
