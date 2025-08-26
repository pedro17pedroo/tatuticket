import { config } from '../config/app.config';

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: keyof typeof LogLevel;
  message: string;
  meta?: Record<string, any>;
  timestamp: Date;
  context?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = config.server.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}] ` : '';
    const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
    
    return `${timestamp} [${entry.level}] ${context}${entry.message}${meta}`;
  }

  private log(level: keyof typeof LogLevel, message: string, meta?: Record<string, any>, context?: string) {
    const logLevel = LogLevel[level];
    
    if (!this.shouldLog(logLevel)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      meta,
      timestamp: new Date(),
      context,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'INFO':
        console.info(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
    }

    // In production, you might want to send logs to external service
    if (config.server.isProduction && level === 'ERROR') {
      this.sendToExternalLogger(entry);
    }
  }

  private async sendToExternalLogger(entry: LogEntry) {
    // Implement external logging service integration
    // Examples: LogRocket, Sentry, DataDog, etc.
    
    try {
      // Example: Send to Sentry or other service
      // await sentryService.captureException(entry);
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  error(message: string, meta?: Record<string, any>, context?: string) {
    this.log('ERROR', message, meta, context);
  }

  warn(message: string, meta?: Record<string, any>, context?: string) {
    this.log('WARN', message, meta, context);
  }

  info(message: string, meta?: Record<string, any>, context?: string) {
    this.log('INFO', message, meta, context);
  }

  debug(message: string, meta?: Record<string, any>, context?: string) {
    this.log('DEBUG', message, meta, context);
  }

  // Specialized logging methods for common scenarios
  apiRequest(method: string, path: string, statusCode: number, duration: number, meta?: Record<string, any>) {
    this.info(`${method} ${path} ${statusCode} in ${duration}ms`, meta, 'API');
  }

  dbQuery(query: string, duration: number, meta?: Record<string, any>) {
    this.debug(`DB Query completed in ${duration}ms`, { query, ...meta }, 'DATABASE');
  }

  authEvent(event: string, userId?: string, meta?: Record<string, any>) {
    this.info(`Auth event: ${event}`, { userId, ...meta }, 'AUTH');
  }

  paymentEvent(event: string, amount?: number, currency?: string, meta?: Record<string, any>) {
    this.info(`Payment event: ${event}`, { amount, currency, ...meta }, 'PAYMENT');
  }

  auditLog(action: string, userId: string, resourceType: string, resourceId: string, meta?: Record<string, any>) {
    this.info(`Audit: ${action} on ${resourceType}:${resourceId}`, { userId, ...meta }, 'AUDIT');
  }
}

export const logger = Logger.getInstance();