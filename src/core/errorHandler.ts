import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Firebase Auth errors
  if (err.message?.includes('Firebase ID token')) {
    error = new CustomError('Invalid authentication token', 401, 'INVALID_TOKEN');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new CustomError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new CustomError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new CustomError(message, 400, 'VALIDATION_ERROR');
  }

  // Cast errors (MongoDB)
  if (err.name === 'CastError') {
    error = new CustomError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
  }

  // Duplicate key errors
  if ((err as any).code === 11000) {
    error = new CustomError('Duplicate field value entered', 400, 'DUPLICATE_FIELD');
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};
