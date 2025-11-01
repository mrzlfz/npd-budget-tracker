/**
 * Logging Utility with Sentry Integration
 * 
 * Provides structured logging for critical operations with automatic
 * Sentry error tracking and breadcrumb creation.
 */

import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  [key: string]: any;
}

/**
 * Logger class for structured logging with Sentry integration
 */
class Logger {
  private context: LogContext = {};

  /**
   * Set global context for all subsequent logs
   */
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
    Sentry.setContext('logger', this.context);
  }

  /**
   * Clear global context
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, data?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, { ...this.context, ...data });
    }
    
    Sentry.addBreadcrumb({
      level: 'debug',
      message,
      data: { ...this.context, ...data },
    });
  }

  /**
   * Log an info message
   */
  info(message: string, data?: LogContext) {
    console.info(`[INFO] ${message}`, { ...this.context, ...data });
    
    Sentry.addBreadcrumb({
      level: 'info',
      message,
      data: { ...this.context, ...data },
    });
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: LogContext) {
    console.warn(`[WARN] ${message}`, { ...this.context, ...data });
    
    Sentry.addBreadcrumb({
      level: 'warning',
      message,
      data: { ...this.context, ...data },
    });
    
    Sentry.captureMessage(message, {
      level: 'warning',
      contexts: {
        data: { ...this.context, ...data },
      },
    });
  }

  /**
   * Log an error
   */
  error(message: string, error?: Error | unknown, data?: LogContext) {
    console.error(`[ERROR] ${message}`, error, { ...this.context, ...data });
    
    Sentry.addBreadcrumb({
      level: 'error',
      message,
      data: { ...this.context, ...data },
    });
    
    if (error instanceof Error) {
      Sentry.captureException(error, {
        contexts: {
          data: { ...this.context, ...data },
        },
        tags: {
          errorMessage: message,
        },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        contexts: {
          data: { ...this.context, ...data, error },
        },
      });
    }
  }

  /**
   * Log a fatal error (application-breaking)
   */
  fatal(message: string, error?: Error | unknown, data?: LogContext) {
    console.error(`[FATAL] ${message}`, error, { ...this.context, ...data });
    
    Sentry.addBreadcrumb({
      level: 'fatal',
      message,
      data: { ...this.context, ...data },
    });
    
    if (error instanceof Error) {
      Sentry.captureException(error, {
        level: 'fatal',
        contexts: {
          data: { ...this.context, ...data },
        },
        tags: {
          errorMessage: message,
          fatal: 'true',
        },
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'fatal',
        contexts: {
          data: { ...this.context, ...data, error },
        },
        tags: {
          fatal: 'true',
        },
      });
    }
  }

  /**
   * Track a custom event
   */
  track(eventName: string, properties?: LogContext) {
    Sentry.addBreadcrumb({
      level: 'info',
      category: 'custom',
      message: eventName,
      data: properties,
    });
  }

  /**
   * Set user context for Sentry
   */
  setUser(user: {
    id: string;
    email?: string;
    username?: string;
    organizationId?: string;
    role?: string;
  }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      organizationId: user.organizationId,
      role: user.role,
    });
  }

  /**
   * Clear user context
   */
  clearUser() {
    Sentry.setUser(null);
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, op: string) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Log critical NPD operations
 */
export const logNPDOperation = {
  created: (npdId: string, userId: string, data: any) => {
    logger.info('NPD Created', {
      npdId,
      userId,
      type: data.jenis,
      totalAmount: data.totalNilai,
    });
  },

  submitted: (npdId: string, userId: string) => {
    logger.info('NPD Submitted for Verification', {
      npdId,
      userId,
    });
  },

  verified: (npdId: string, userId: string) => {
    logger.info('NPD Verified', {
      npdId,
      userId,
    });
  },

  rejected: (npdId: string, userId: string, reason: string) => {
    logger.warn('NPD Rejected', {
      npdId,
      userId,
      reason,
    });
  },

  finalized: (npdId: string, userId: string) => {
    logger.info('NPD Finalized', {
      npdId,
      userId,
    });
  },

  error: (operation: string, npdId: string, error: Error) => {
    logger.error(`NPD ${operation} Failed`, error, {
      npdId,
      operation,
    });
  },
};

/**
 * Log critical SP2D operations
 */
export const logSP2DOperation = {
  created: (sp2dId: string, npdId: string, userId: string, amount: number) => {
    logger.info('SP2D Created', {
      sp2dId,
      npdId,
      userId,
      amount,
    });
  },

  updated: (sp2dId: string, userId: string, changes: any) => {
    logger.info('SP2D Updated', {
      sp2dId,
      userId,
      changes,
    });
  },

  deleted: (sp2dId: string, userId: string) => {
    logger.warn('SP2D Deleted', {
      sp2dId,
      userId,
    });
  },

  error: (operation: string, sp2dId: string, error: Error) => {
    logger.error(`SP2D ${operation} Failed`, error, {
      sp2dId,
      operation,
    });
  },
};

/**
 * Log authentication events
 */
export const logAuthEvent = {
  login: (userId: string, organizationId: string) => {
    logger.info('User Logged In', {
      userId,
      organizationId,
    });
    logger.setUser({ id: userId, organizationId });
  },

  logout: (userId: string) => {
    logger.info('User Logged Out', {
      userId,
    });
    logger.clearUser();
  },

  organizationSwitch: (userId: string, fromOrgId: string, toOrgId: string) => {
    logger.info('Organization Switched', {
      userId,
      fromOrgId,
      toOrgId,
    });
  },

  error: (operation: string, error: Error) => {
    logger.error(`Auth ${operation} Failed`, error, {
      operation,
    });
  },
};

/**
 * Log file operations
 */
export const logFileOperation = {
  uploaded: (fileId: string, fileName: string, size: number, userId: string) => {
    logger.info('File Uploaded', {
      fileId,
      fileName,
      size,
      userId,
    });
  },

  downloaded: (fileId: string, fileName: string, userId: string) => {
    logger.info('File Downloaded', {
      fileId,
      fileName,
      userId,
    });
  },

  deleted: (fileId: string, fileName: string, userId: string) => {
    logger.warn('File Deleted', {
      fileId,
      fileName,
      userId,
    });
  },

  error: (operation: string, fileName: string, error: Error) => {
    logger.error(`File ${operation} Failed`, error, {
      fileName,
      operation,
    });
  },
};

/**
 * Log performance metrics
 */
export const logPerformance = {
  slowQuery: (queryName: string, duration: number, params?: any) => {
    logger.warn('Slow Query Detected', {
      queryName,
      duration,
      params,
    });
  },

  slowRender: (componentName: string, duration: number) => {
    logger.warn('Slow Component Render', {
      componentName,
      duration,
    });
  },

  apiLatency: (endpoint: string, method: string, duration: number, statusCode: number) => {
    if (duration > 1000) {
      logger.warn('High API Latency', {
        endpoint,
        method,
        duration,
        statusCode,
      });
    }
  },
};

