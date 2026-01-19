import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const IDLE_KEY = 'auth_idle_at';
const START_KEY = 'auth_session_start_at';

function parseMinutes(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return parsed;
}

function getStoredTimestamp(key: string): number {
  const raw = localStorage.getItem(key);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function setStoredTimestamp(key: string, value: number): void {
  localStorage.setItem(key, String(value));
}

export function useSessionPolicy(session: Session | null) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!session) {
      localStorage.removeItem(IDLE_KEY);
      localStorage.removeItem(START_KEY);
      return;
    }

    const idleMinutes = parseMinutes(import.meta.env.VITE_IDLE_TIMEOUT_MINUTES);
    const maxMinutes = parseMinutes(import.meta.env.VITE_SESSION_MAX_MINUTES);

    if (idleMinutes <= 0 && maxMinutes <= 0) return;

    const now = Date.now();
    if (!getStoredTimestamp(START_KEY)) {
      setStoredTimestamp(START_KEY, now);
    }
    setStoredTimestamp(IDLE_KEY, now);

    const idleMs = idleMinutes > 0 ? idleMinutes * 60 * 1000 : 0;
    const maxMs = maxMinutes > 0 ? maxMinutes * 60 * 1000 : 0;

    const updateActivity = () => {
      setStoredTimestamp(IDLE_KEY, Date.now());
    };

    const checkLimits = () => {
      const current = Date.now();
      if (idleMs > 0) {
        const lastActivity = getStoredTimestamp(IDLE_KEY);
        if (lastActivity && current - lastActivity > idleMs) {
          supabase.auth.signOut().catch(() => undefined);
          return;
        }
      }
      if (maxMs > 0) {
        const startedAt = getStoredTimestamp(START_KEY);
        if (startedAt && current - startedAt > maxMs) {
          supabase.auth.signOut().catch(() => undefined);
        }
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onStorage = (event: StorageEvent) => {
      if (event.key === IDLE_KEY || event.key === START_KEY) {
        checkLimits();
      }
    };
    window.addEventListener('storage', onStorage);

    const baseInterval = Math.min(idleMs || maxMs, 60_000);
    const interval = window.setInterval(checkLimits, Math.max(1000, baseInterval));

    checkLimits();

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(interval);
    };
  }, [session?.user?.id]);
}
