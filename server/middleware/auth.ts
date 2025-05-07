import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Middleware to handle authentication status
 * Attaches user to req if authenticated, otherwise sets to undefined
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Check if user is authenticated from session
  if (req.session && req.session.userId) {
    // For admin routes (/api/admin/*), eagerly load the user
    // For other routes, we'll lazily load the user when needed
    if (req.path.startsWith("/api/admin/")) {
      // Eagerly load user for admin routes to simplify admin middleware
      storage
        .getUser(req.session.userId)
        .then((user) => {
          if (user) {
            req.user = user;
          }
          next();
        })
        .catch((error) => {
          console.error("Error in authMiddleware for admin route:", error);
          next();
        });
      return; // Return early because we called next() in the promise callbacks
    }

    // Log session info for debugging (can be removed in production)
    if (process.env.NODE_ENV === "development") {
      console.log("Session info:", {
        hasSession: !!req.session,
        sessionId: req.session?.id,
        userId: req.session?.userId,
        username: req.session?.username,
        path: req.path,
      });
    }
  } else {
    req.user = undefined;
  }
  next();
}

/**
 * Middleware to require authentication
 * If not authenticated, returns 401 Unauthorized
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // First check if req.user is already set
  if (req.user) {
    return next();
  }

  // Then check if we have session userId
  if (req.session && req.session.userId) {
    const userId = req.session.userId;

    // Get user from the database as async operation
    storage
      .getUser(userId)
      .then((user) => {
        if (user) {
          // Attach user to request object
          req.user = user;
          return next();
        } else {
          // User ID in session but no corresponding user in DB
          return res.status(401).json({ message: "Authentication required" });
        }
      })
      .catch((error) => {
        console.error("Error in requireAuth middleware:", error);
        return res.status(500).json({ message: "Authentication error" });
      });
  } else {
    // No user ID in session
    return res.status(401).json({ message: "Authentication required" });
  }
}
