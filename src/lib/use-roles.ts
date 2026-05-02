import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import { getMyRoles } from "@/server/admin.functions";

export function useRoles() {
  const { session } = useAuth();
  const fetchRoles = useAuthedServerFn(getMyRoles);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!session) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchRoles()
      .then((r) => {
        if (!cancelled) setRoles(r.roles ?? []);
      })
      .catch(() => {
        if (!cancelled) setRoles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return {
    roles,
    loading,
    isSuperAdmin: roles.includes("super_admin"),
  };
}
