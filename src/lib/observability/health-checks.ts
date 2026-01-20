/**
 * Health Check System for TrustLayer
 *
 * Provides health checks for various system components and dependencies.
 * Supports readiness and liveness probes for Kubernetes deployments.
 */

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface OverallHealth {
  status: HealthStatus;
  checks: HealthCheckResult[];
  timestamp: string;
  uptime: number;
  version: string;
}

export type HealthCheckFunction = () => Promise<HealthCheckResult>;

class HealthCheckManager {
  private checks: Map<string, HealthCheckFunction> = new Map();
  private cache: Map<string, { result: HealthCheckResult; expiresAt: number }> = new Map();
  private startTime: number = Date.now();

  /**
   * Register a health check
   */
  registerCheck(name: string, checkFn: HealthCheckFunction) {
    this.checks.set(name, checkFn);
  }

  /**
   * Unregister a health check
   */
  unregisterCheck(name: string) {
    this.checks.delete(name);
    this.cache.delete(name);
  }

  /**
   * Run a single health check with caching
   */
  private async runCheck(name: string, cacheDuration: number = 5000): Promise<HealthCheckResult> {
    // Check cache
    const cached = this.cache.get(name);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.result;
    }

    const checkFn = this.checks.get(name);
    if (!checkFn) {
      return {
        name,
        status: HealthStatus.UNHEALTHY,
        message: 'Health check not found',
        timestamp: new Date().toISOString(),
      };
    }

    const startTime = performance.now();
    try {
      const result = await Promise.race([
        checkFn(),
        new Promise<HealthCheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        ),
      ]);

      const duration = performance.now() - startTime;
      const enhancedResult = {
        ...result,
        duration,
        timestamp: new Date().toISOString(),
      };

      // Cache result
      this.cache.set(name, {
        result: enhancedResult,
        expiresAt: Date.now() + cacheDuration,
      });

      return enhancedResult;
    } catch (error) {
      const duration = performance.now() - startTime;
      const errorResult: HealthCheckResult = {
        name,
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString(),
      };

      // Cache error result for shorter duration
      this.cache.set(name, {
        result: errorResult,
        expiresAt: Date.now() + 1000,
      });

      return errorResult;
    }
  }

  /**
   * Run all health checks
   */
  async checkHealth(): Promise<OverallHealth> {
    const checkPromises = Array.from(this.checks.keys()).map((name) =>
      this.runCheck(name)
    );

    const results = await Promise.all(checkPromises);

    // Determine overall status
    const hasUnhealthy = results.some((r) => r.status === HealthStatus.UNHEALTHY);
    const hasDegraded = results.some((r) => r.status === HealthStatus.DEGRADED);

    const overallStatus = hasUnhealthy
      ? HealthStatus.UNHEALTHY
      : hasDegraded
      ? HealthStatus.DEGRADED
      : HealthStatus.HEALTHY;

    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    };
  }

  /**
   * Readiness probe (can the app handle requests?)
   */
  async readiness(): Promise<{ ready: boolean; checks: HealthCheckResult[] }> {
    const health = await this.checkHealth();
    return {
      ready: health.status !== HealthStatus.UNHEALTHY,
      checks: health.checks,
    };
  }

  /**
   * Liveness probe (is the app alive?)
   */
  async liveness(): Promise<{ alive: boolean }> {
    // Simple check that the app is running
    return { alive: true };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
let healthCheckManager: HealthCheckManager | null = null;

/**
 * Get health check manager instance
 */
export function getHealthCheckManager(): HealthCheckManager {
  if (!healthCheckManager) {
    healthCheckManager = new HealthCheckManager();
    registerDefaultChecks();
  }
  return healthCheckManager;
}

/**
 * Register default health checks
 */
function registerDefaultChecks() {
  const manager = healthCheckManager!;

  // Database health check
  manager.registerCheck('database', async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const startTime = performance.now();

      const { error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      const duration = performance.now() - startTime;

      if (error) {
        return {
          name: 'database',
          status: HealthStatus.UNHEALTHY,
          message: `Database error: ${error.message}`,
          duration,
          timestamp: new Date().toISOString(),
        };
      }

      // Check if query is slow
      const status = duration > 500 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

      return {
        name: 'database',
        status,
        message: status === HealthStatus.DEGRADED ? 'Database is slow' : 'Database is healthy',
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Storage health check
  manager.registerCheck('storage', async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const startTime = performance.now();

      const { data, error } = await supabase.storage.listBuckets();

      const duration = performance.now() - startTime;

      if (error) {
        return {
          name: 'storage',
          status: HealthStatus.UNHEALTHY,
          message: `Storage error: ${error.message}`,
          duration,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        name: 'storage',
        status: HealthStatus.HEALTHY,
        message: 'Storage is healthy',
        duration,
        metadata: { buckets: data?.length || 0 },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'storage',
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'Storage connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Memory health check
  manager.registerCheck('memory', async () => {
    try {
      // @ts-ignore - performance.memory is non-standard but widely supported
      const memory = performance.memory;

      if (!memory) {
        return {
          name: 'memory',
          status: HealthStatus.HEALTHY,
          message: 'Memory info not available',
          timestamp: new Date().toISOString(),
        };
      }

      const usedMemoryMB = memory.usedJSHeapSize / 1024 / 1024;
      const totalMemoryMB = memory.totalJSHeapSize / 1024 / 1024;
      const limitMemoryMB = memory.jsHeapSizeLimit / 1024 / 1024;

      const usagePercent = (usedMemoryMB / limitMemoryMB) * 100;

      let status = HealthStatus.HEALTHY;
      let message = `Memory usage: ${usedMemoryMB.toFixed(2)}MB / ${limitMemoryMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`;

      if (usagePercent > 90) {
        status = HealthStatus.UNHEALTHY;
        message = `High memory usage: ${usagePercent.toFixed(1)}%`;
      } else if (usagePercent > 75) {
        status = HealthStatus.DEGRADED;
        message = `Elevated memory usage: ${usagePercent.toFixed(1)}%`;
      }

      return {
        name: 'memory',
        status,
        message,
        metadata: {
          usedMB: usedMemoryMB.toFixed(2),
          totalMB: totalMemoryMB.toFixed(2),
          limitMB: limitMemoryMB.toFixed(2),
          usagePercent: usagePercent.toFixed(1),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'memory',
        status: HealthStatus.HEALTHY,
        message: 'Memory check not supported',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // API health check
  manager.registerCheck('api', async () => {
    try {
      const startTime = performance.now();

      // Simple ping to Supabase REST API
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('organizations').select('count', { count: 'exact', head: true });

      const duration = performance.now() - startTime;

      if (error) {
        return {
          name: 'api',
          status: HealthStatus.UNHEALTHY,
          message: `API error: ${error.message}`,
          duration,
          timestamp: new Date().toISOString(),
        };
      }

      const status = duration > 1000 ? HealthStatus.DEGRADED : HealthStatus.HEALTHY;

      return {
        name: 'api',
        status,
        message: status === HealthStatus.DEGRADED ? 'API is slow' : 'API is healthy',
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'api',
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'API connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  });

  // LocalStorage health check
  manager.registerCheck('localStorage', async () => {
    try {
      const testKey = '__health_check__';
      const testValue = Date.now().toString();

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        return {
          name: 'localStorage',
          status: HealthStatus.UNHEALTHY,
          message: 'LocalStorage read/write mismatch',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        name: 'localStorage',
        status: HealthStatus.HEALTHY,
        message: 'LocalStorage is functional',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        name: 'localStorage',
        status: HealthStatus.UNHEALTHY,
        message: error instanceof Error ? error.message : 'LocalStorage not available',
        timestamp: new Date().toISOString(),
      };
    }
  });
}

/**
 * React Hook: Use health status
 */
export function useHealthStatus(interval: number = 30000) {
  const { useState, useEffect } = require('react');
  const [health, setHealth] = useState<OverallHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const manager = getHealthCheckManager();

    const checkHealth = async () => {
      const result = await manager.checkHealth();
      setHealth(result);
      setLoading(false);
    };

    // Initial check
    checkHealth();

    // Periodic checks
    const intervalId = setInterval(checkHealth, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return { health, loading };
}

/**
 * Export health status as endpoint response
 */
export async function healthEndpoint(): Promise<Response> {
  const manager = getHealthCheckManager();
  const health = await manager.checkHealth();

  const statusCode = health.status === HealthStatus.HEALTHY ? 200 : 503;

  return new Response(JSON.stringify(health, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Export readiness as endpoint response
 */
export async function readinessEndpoint(): Promise<Response> {
  const manager = getHealthCheckManager();
  const readiness = await manager.readiness();

  const statusCode = readiness.ready ? 200 : 503;

  return new Response(JSON.stringify(readiness, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}

/**
 * Export liveness as endpoint response
 */
export async function livenessEndpoint(): Promise<Response> {
  const manager = getHealthCheckManager();
  const liveness = await manager.liveness();

  return new Response(JSON.stringify(liveness, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
}
