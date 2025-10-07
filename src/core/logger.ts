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
  transports: (() => {
    const list: any[] = [];
    // Always keep console in dev and serverless (no filesystem on Vercel)
    list.push(
      new transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat
        )
      })
    );

    // Only add file transports when running on a writable filesystem
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production_serverless') {
      list.push(
        new transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 5 })
      );
      list.push(
        new transports.File({ filename: 'logs/combined.log', maxsize: 5242880, maxFiles: 5 })
      );
    }
    return list;
  })()
});

// Handle uncaught exceptions
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production_serverless') {
  logger.exceptions.handle(new transports.File({ filename: 'logs/exceptions.log' }));
  logger.rejections.handle(new transports.File({ filename: 'logs/rejections.log' }));
}


export default logger;
