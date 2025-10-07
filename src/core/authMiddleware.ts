import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../firebase/admin';
import { CustomError } from './errorHandler';
import { logger } from './logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Optionally log token during development (disabled)

    // Verify Firebase ID token
    try {
      const decodedToken = await verifyFirebaseToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || undefined
      };
      next();
    } catch (firebaseError) {
      logger.error('Firebase token verification failed:', firebaseError);
      throw new CustomError('Invalid token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, but that's OK for optional auth
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Try Firebase token
    try {
      const decodedToken = await verifyFirebaseToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || undefined
      };
      next();
    } catch (firebaseError) {
      // Invalid token, but that's OK for optional auth
      next();
    }
  } catch (error) {
    // Any other error, but that's OK for optional auth
    next();
  }
};
