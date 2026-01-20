/**
 * Structured Logging System for TrustLayer
 *
 * Provides structured logging with log levels, context, and integration
 * with observability tools (ELK Stack, Datadog, etc.)
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  serviceName: string;
  environment: string;
  version: string;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

class StructuredLogger {
  private config: LoggerConfig;
  private globalContext: LogContext = {};
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: LoggerConfig) {
    this.config = config;

    // Start buffer flush interval for remote logging
    if (config.enableRemote && config.remoteEndpoint) {
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  /**
   * Set global context that will be included in all logs
   */
  setGlobalContext(context: LogContext) {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Clear global context
   */
  clearGlobalContext() {
    this.globalContext = {};
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined;

    this.log(LogLevel.ERROR, message, context, metadata, errorInfo);
  }

  /**
   * Log fatal error (application crash)
   */
  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>) {
    const errorInfo = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined;

    this.log(LogLevel.FATAL, message, context, metadata, errorInfo);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>,
    error?: { name: string; message: string; stack?: string }
  ) {
    // Check if log level is enabled
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.config.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.globalContext,
        ...context,
        service: this.config.serviceName,
        environment: this.config.environment,
        version: this.config.version,
      },
      metadata,
      error,
    };

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.buffer.push(entry);

      // Immediate flush for errors and fatal
      if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
        this.flush();
      }
    }
  }

  /**
   * Log to browser console with formatting
   */
  private logToConsole(entry: LogEntry) {
    const { level, message, context, metadata, error } = entry;

    const consoleMethod = level === LogLevel.FATAL || level === LogLevel.ERROR
      ? console.error
      : level === LogLevel.WARN
      ? console.warn
      : level === LogLevel.DEBUG
      ? console.debug
      : console.log;

    const parts: any[] = [
      `[${entry.timestamp}]`,
      `[${level.toUpperCase()}]`,
      message,
    ];

    if (context && Object.keys(context).length > 0) {
      parts.push('\nContext:', context);
    }

    if (metadata) {
      parts.push('\nMetadata:', metadata);
    }

    if (error) {
      parts.push('\nError:', error);
    }

    consoleMethod(...parts);
  }

  /**
   * Flush buffered logs to remote endpoint
   */
  private async flush() {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    if (this.buffer.length === 0) {
      return;
    }

    const logsToSend = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          service: this.config.serviceName,
          environment: this.config.environment,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send logs to remote endpoint:', response.statusText);
        // Put logs back in buffer on failure
        this.buffer.unshift(...logsToSend);
      }
    } catch (error) {
      console.error('Error sending logs to remote endpoint:', error);
      // Put logs back in buffer on failure
      this.buffer.unshift(...logsToSend);
    }
  }

  /**
   * Shutdown logger
   */
  shutdown() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Singleton instance
let loggerInstance: StructuredLogger | null = null;

/**
 * Initialize logger
 */
export function initializeLogger(config: Partial<LoggerConfig> = {}) {
  const defaultConfig: LoggerConfig = {
    minLevel: LogLevel.INFO,
    enableConsole: true,
    enableRemote: false,
    serviceName: 'trustlayer',
    environment: import.meta.env.VITE_ENVIRONMENT || 'development',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    ...config,
  };

  loggerInstance = new StructuredLogger(defaultConfig);
  return loggerInstance;
}

/**
 * Get logger instance
 */
export function getLogger(): StructuredLogger {
  if (!loggerInstance) {
    loggerInstance = initializeLogger();
  }
  return loggerInstance;
}

/**
 * Shutdown logger
 */
export function shutdownLogger() {
  if (loggerInstance) {
    loggerInstance.shutdown();
    loggerInstance = null;
  }
}

/**
 * React Hook: Use logger with component context
 */
export function useLogger(componentName: string) {
  const logger = getLogger();

  return {
    debug: (message: string, metadata?: Record<string, any>) =>
      logger.debug(message, { component: componentName }, metadata),
    info: (message: string, metadata?: Record<string, any>) =>
      logger.info(message, { component: componentName }, metadata),
    warn: (message: string, metadata?: Record<string, any>) =>
      logger.warn(message, { component: componentName }, metadata),
    error: (message: string, error?: Error, metadata?: Record<string, any>) =>
      logger.error(message, error, { component: componentName }, metadata),
  };
}

/**
 * Error boundary logger
 */
export function logErrorBoundary(error: Error, errorInfo: { componentStack: string }) {
  const logger = getLogger();
  logger.error(
    'React Error Boundary caught an error',
    error,
    { errorBoundary: true },
    { componentStack: errorInfo.componentStack }
  );
}

/**
 * HTTP request logger
 */
export function logHttpRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  context?: LogContext
) {
  const logger = getLogger();
  const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

  logger.log(
    level,
    `HTTP ${method} ${url} - ${statusCode}`,
    context,
    { method, url, statusCode, duration }
  );
}

/**
 * Performance logger
 */
export function logPerformance(
  operation: string,
  duration: number,
  context?: LogContext,
  metadata?: Record<string, any>
) {
  const logger = getLogger();

  const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;

  logger.log(
    level,
    `Performance: ${operation} took ${duration}ms`,
    context,
    { ...metadata, duration, operation }
  );
}

/**
 * Audit logger (security events)
 */
export function logAuditEvent(
  action: string,
  resource: string,
  success: boolean,
  context: LogContext,
  metadata?: Record<string, any>
) {
  const logger = getLogger();

  logger.info(
    `Audit: ${action} on ${resource} - ${success ? 'SUCCESS' : 'FAILED'}`,
    { ...context, audit: true },
    { action, resource, success, ...metadata }
  );
}
