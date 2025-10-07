import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize } = format;

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
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
    // Console transport for development
    new transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    }),
    // File transport for production
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Handle uncaught exceptions
logger.exceptions.handle(
  new transports.File({ filename: 'logs/exceptions.log' })
);

// Handle unhandled promise rejections
logger.rejections.handle(
  new transports.File({ filename: 'logs/rejections.log' })
);

export default logger;
