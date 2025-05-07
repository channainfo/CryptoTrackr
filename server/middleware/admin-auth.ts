import { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

// Store admin session tokens separately from regular sessions
const adminTokens = new Set<string>();

// Debug function to log admin tokens
function logAdminTokens() {
  console.log(`Current admin tokens: ${adminTokens.size}`, 
    Array.from(adminTokens).map(token => token.substring(0, 8) + '...')
  );
}

/**
 * Check if a user is an admin by querying the database directly
 * This avoids storing sensitive admin status in the session
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    console.log(`Checking admin status for user ID: ${userId}`);
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .then(rows => rows[0]);
    
    console.log(`Admin check result for ${userId}:`, user);
    return !!user?.isAdmin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Middleware to validate admin credentials and create admin token
 */
export async function adminLogin(req: Request, res: Response) {
  // Get user from regular session
  console.log('Admin login attempt:', { user: req.user, session: req.session });
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Verify admin status from database (not from session)
  const isAdmin = await isUserAdmin(req.user.id);
  console.log('Admin login check for user:', {
    id: req.user.id,
    isAdmin: isAdmin,
    user: req.user
  });
  
  if (!isAdmin) {
    return res.status(403).json({ message: 'Unauthorized access. Admin privileges required.' });
  }
  
  // Create and store admin token
  const adminToken = crypto.randomBytes(32).toString('hex');
  adminTokens.add(adminToken);
  
  // Log the tokens before and after adding the new one
  console.log('Admin token created:', adminToken.substring(0, 8) + '...');
  logAdminTokens();
  
  // Add expiration for the token (after 1 hour)
  setTimeout(() => {
    console.log('Admin token expired:', adminToken.substring(0, 8) + '...');
    adminTokens.delete(adminToken);
    logAdminTokens();
  }, 60 * 60 * 1000);
  
  // Return admin token
  res.json({ 
    adminToken,
    expiresIn: 3600 // 1 hour
  });
}

/**
 * Middleware to require admin authentication
 * Requires a separate admin token to be present in the Authorization header
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // First make sure the user is authenticated via session
  // We can't rely on req.user being set yet, so check the session directly
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // If req.user isn't loaded yet, we need to load it to check admin status
  if (!req.user) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId));
      
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Set the user for subsequent middleware
      req.user = user;
    } catch (error) {
      console.error('Error retrieving user in requireAdmin:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }
  
  // Check for admin token in the Authorization header
  const authHeader = req.headers.authorization;
  console.log('Admin authorization check:', { 
    hasAuthHeader: !!authHeader,
    headerValue: authHeader ? `${authHeader.substring(0, 15)}...` : null,
    path: req.path 
  });
  
  if (!authHeader || !authHeader.startsWith('AdminToken ')) {
    console.log('Admin authentication required - missing or invalid header format');
    return res.status(401).json({ 
      message: 'Admin authentication required',
      code: 'ADMIN_AUTH_REQUIRED' 
    });
  }
  
  // Extract the token
  const adminToken = authHeader.split(' ')[1];
  
  // Log current valid tokens
  logAdminTokens();
  
  // Verify the admin token
  const isValidToken = adminTokens.has(adminToken);
  console.log('Admin token validation:', {
    tokenPrefix: adminToken.substring(0, 8) + '...',
    isValid: isValidToken
  });
  
  if (!isValidToken) {
    return res.status(403).json({ 
      message: 'Invalid or expired admin token',
      code: 'INVALID_ADMIN_TOKEN' 
    });
  }
  
  // Admin authentication successful
  console.log('Admin authentication successful for request to:', req.path);
  next();
}

/**
 * Logout from admin session
 */
export function adminLogout(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('AdminToken ')) {
    const adminToken = authHeader.split(' ')[1];
    adminTokens.delete(adminToken);
  }
  
  res.json({ message: 'Admin logout successful' });
}