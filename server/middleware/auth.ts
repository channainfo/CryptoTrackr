import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to check if user is authenticated
 * If authenticated, adds user object to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if session exists and has userId
    if (req.session && req.session.userId) {
      // Get the user from storage
      const user = await storage.getUser(req.session.userId);
      if (user) {
        // Add user to request object
        (req as any).user = user;
      }
    }
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
}

/**
 * Middleware to require authentication
 * If not authenticated, returns 401 Unauthorized
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}