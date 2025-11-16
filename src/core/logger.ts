import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Safe JSON stringify that handles circular references
const safeStringify = (obj: any, space?: number): string => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Skip circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    // Skip functions
    if (typeof value === 'function') {
      return '[Function]';
    }
    // Skip undefined
    if (value === undefined) {
      return undefined;
    }
    return value;
  }, space);
};

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    try {
      msg += ` ${safeStringify(metadata)}`;
    } catch (error) {
      msg += ` [Error stringifying metadata: ${error}]`;
    }
  }
  
  return msg;
});

// Create logger instance
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ]
});

// Handle uncaught exceptions and rejections to console only (no file writes)
logger.exceptions.handle(
  new transports.Console({
    format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat)
  })
);
logger.rejections.handle(
  new transports.Console({
    format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat)
  })
);


export default logger;
