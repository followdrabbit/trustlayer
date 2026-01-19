import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { normalizeRole, UserRole } from '@/lib/roles';

type RoleCache = {
  userId: string;
  role: UserRole;
  fetchedAt: number;
};

let roleCache: RoleCache | null = null;
type RoleInFlight = {
  userId: string;
  promise: Promise<UserRole>;
};

let roleInFlight: RoleInFlight | null = null;
const ROLE_CACHE_TTL_MS = 60000;

async function fetchUserRole(userId: string): Promise<UserRole> {
  const now = Date.now();
  if (roleCache?.userId === userId && now - roleCache.fetchedAt < ROLE_CACHE_TTL_MS) {
    return roleCache.role;
  }

  if (roleInFlight?.userId === userId) {
    return roleInFlight.promise;
  }

  const promise = supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single()
    .then(({ data, error }) => {
      if (error) {
        console.error('Failed to load profile role:', error);
        return 'viewer';
      }
      return normalizeRole((data as { role?: string | null })?.role ?? null);
    })
    .then(role => {
      roleCache = { userId, role, fetchedAt: Date.now() };
      return role;
    })
    .finally(() => {
      if (roleInFlight?.userId === userId) {
        roleInFlight = null;
      }
    });

  roleInFlight = { userId, promise };

  return promise;
}

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!user) {
      setRole(null);
      setLoading(false);
      roleCache = null;
      roleInFlight = null;
      return () => {
        active = false;
      };
    }

    setLoading(true);
    fetchUserRole(user.id)
      .then(resolvedRole => {
        if (!active) return;
        setRole(resolvedRole);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return {
    role,
    loading: authLoading || loading,
  };
}
