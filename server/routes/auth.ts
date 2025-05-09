import { Router, Request, Response } from "express";
import { storage } from "../storage";
import crypto from "crypto";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
import { db } from "../db";
import { users, insertUserSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { promisify } from "util";

// Password hashing functions
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(
  storedPassword: string,
  suppliedPassword: string,
): Promise<boolean> {
  const [hashedPassword, salt] = storedPassword.split(".");
  const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
  const suppliedPasswordBuf = (await scryptAsync(
    suppliedPassword,
    salt,
    64,
  )) as Buffer;

  try {
    return crypto.timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  } catch (e) {
    console.error("Error comparing passwords:", e);
    return false;
  }
}

const router = Router();

// In-memory storage for nonces (in a production app, this would be in Redis/DB)
const nonceStore: Record<string, { nonce: string; expiresAt: number }> = {};

// Clean up expired nonces every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    Object.keys(nonceStore).forEach((address) => {
      if (nonceStore[address].expiresAt < now) {
        delete nonceStore[address];
      }
    });
  },
  5 * 60 * 1000,
);

// Validation schema for wallet authentication
const walletAuthSchema = z.object({
  address: z.string().min(1, "Wallet address is required"),
  signature: z.string().min(1, "Signature is required"),
});

// Extended validation schema for wallet linking that includes wallet type
const walletLinkSchema = walletAuthSchema.extend({
  walletType: z.string().min(1, "Wallet type is required"),
});

// Get a nonce for wallet authentication
router.get("/wallet/nonce/:address", (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    // Generate a random nonce
    const nonce = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store the nonce
    nonceStore[address.toLowerCase()] = { nonce, expiresAt };

    // Return a message to be signed by the wallet
    const message = `Sign this message to authenticate with Trailer app: ${nonce}`;

    res.json({ message });
  } catch (error) {
    console.error("Error generating nonce:", error);
    res
      .status(500)
      .json({ message: "Failed to generate authentication nonce" });
  }
});

// Ethereum wallet authentication
router.post("/wallet/ethereum", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = walletAuthSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { address, signature } = validation.data;
    const addressLower = address.toLowerCase();

    // Check if we have a nonce for this address
    if (!nonceStore[addressLower]) {
      return res
        .status(400)
        .json({ message: "No authentication request found for this address" });
    }

    // Get the nonce and message
    const { nonce, expiresAt } = nonceStore[addressLower];

    // Check if nonce is expired
    if (expiresAt < Date.now()) {
      delete nonceStore[addressLower];
      return res
        .status(400)
        .json({ message: "Authentication request expired" });
    }

    // Reconstruct the message that was signed
    const message = `Sign this message to authenticate with Trailer app: ${nonce}`;

    // Verify the signature using ethers.js
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== addressLower) {
        return res.status(401).json({ message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      return res.status(401).json({ message: "Invalid signature" });
    }

    // Clean up the nonce
    delete nonceStore[addressLower];

    // Find or create a user for this wallet address
    let user = await storage.getUserByWalletAddress(address, "ethereum");

    if (!user) {
      // Create a new user with this wallet address
      user = await storage.createUser({
        username: `eth_${address.substring(0, 8)}`,
        password: uuidv4(), // Generate a random password that won't be used
        walletAddress: address,
        walletType: "ethereum",
      });
    }

    // Add wallet address to the userWallets table if it doesn't exist
    try {
      // Check if this wallet is already registered for this user
      const userWallets = await storage.getUserWallets(user.id);
      const existingWallet = userWallets.find(
        (w) =>
          w.address.toLowerCase() === addressLower &&
          w.chainType === "ethereum",
      );

      if (!existingWallet) {
        // Add the wallet to the user_wallets table
        await storage.addUserWallet({
          userId: user.id,
          address: addressLower,
          chainType: "ethereum",
          isDefault: userWallets.length === 0, // Make it default if it's the first wallet
        });
      }
    } catch (error) {
      console.error("Error adding wallet to user_wallets:", error);
      // Continue with authentication even if adding wallet fails
    }

    // Set up session
    if (req.session) {
      // Force regenerate the session to prevent session fixation attacks
      const sessionData = {
        userId: user.id,
        username: user.username,
        walletAddress: address,
        walletType: "ethereum"
      };
      
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        // Now assign the user data to the new session
        req.session.userId = sessionData.userId;
        req.session.username = sessionData.username;
        req.session.walletAddress = sessionData.walletAddress;
        req.session.walletType = sessionData.walletType;
        
        // Save the session to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Authentication failed" });
          }
          
          // Log the session for debugging
          console.log("Ethereum wallet authentication successful, new session:", {
            sessionId: req.session.id,
            userId: req.session.userId,
            username: req.session.username,
            walletAddress: req.session.walletAddress,
            walletType: req.session.walletType
          });
          
          // Return user info
          res.json({
            id: user.id,
            username: user.username,
            walletAddress: address,
            walletType: "ethereum",
          });
        });
      });
    } else {
      console.error("No session found during Ethereum wallet authentication");
      res.status(500).json({ message: "Session initialization failed" });
    }
  } catch (error) {
    console.error("Ethereum authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Solana wallet authentication - simplified for demo
router.post("/wallet/solana", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = walletAuthSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { address, signature } = validation.data;

    // For demo purposes, we're just verifying that the request has an address
    // In a real implementation, we would verify the signature

    // Find or create a user for this wallet address
    let user = await storage.getUserByWalletAddress(address, "solana");

    if (!user) {
      // Create a new user with this wallet address
      user = await storage.createUser({
        username: `sol_${address.substring(0, 8)}`,
        password: uuidv4(), // Generate a random password that won't be used
        walletAddress: address,
        walletType: "solana",
      });
    }

    // Add wallet address to the userWallets table if it doesn't exist
    try {
      // Check if this wallet is already registered for this user
      const userWallets = await storage.getUserWallets(user.id);
      const existingWallet = userWallets.find(
        (w) =>
          w.address.toLowerCase() === address.toLowerCase() &&
          w.chainType === "solana",
      );

      if (!existingWallet) {
        // Add the wallet to the user_wallets table
        await storage.addUserWallet({
          userId: user.id,
          address: address,
          chainType: "solana",
          isDefault: userWallets.length === 0, // Make it default if it's the first wallet
        });
      }
    } catch (error) {
      console.error("Error adding wallet to user_wallets:", error);
      // Continue with authentication even if adding wallet fails
    }

    // Set up session
    if (req.session) {
      // Force regenerate the session to prevent session fixation attacks
      const sessionData = {
        userId: user.id,
        username: user.username,
        walletAddress: address,
        walletType: "solana"
      };
      
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        // Now assign the user data to the new session
        req.session.userId = sessionData.userId;
        req.session.username = sessionData.username;
        req.session.walletAddress = sessionData.walletAddress;
        req.session.walletType = sessionData.walletType;
        
        // Save the session to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Authentication failed" });
          }
          
          // Log the session for debugging
          console.log("Solana wallet authentication successful, new session:", {
            sessionId: req.session.id,
            userId: req.session.userId,
            username: req.session.username,
            walletAddress: req.session.walletAddress,
            walletType: req.session.walletType
          });
          
          // Return user info
          res.json({
            id: user.id,
            username: user.username,
            walletAddress: address,
            walletType: "solana",
          });
        });
      });
    } else {
      console.error("No session found during Solana wallet authentication");
      res.status(500).json({ message: "Session initialization failed" });
    }
  } catch (error) {
    console.error("Solana authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Base wallet authentication - using same flow as Ethereum
router.post("/wallet/base", async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validation = walletAuthSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { address, signature } = validation.data;
    const addressLower = address.toLowerCase();

    // Check if we have a nonce for this address
    if (!nonceStore[addressLower]) {
      return res
        .status(400)
        .json({ message: "No authentication request found for this address" });
    }

    // Get the nonce and message
    const { nonce, expiresAt } = nonceStore[addressLower];

    // Check if nonce is expired
    if (expiresAt < Date.now()) {
      delete nonceStore[addressLower];
      return res
        .status(400)
        .json({ message: "Authentication request expired" });
    }

    // Reconstruct the message that was signed
    const message = `Sign this message to authenticate with Trailer app: ${nonce}`;

    // Verify the signature using ethers.js (Base uses Ethereum signature scheme)
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== addressLower) {
        return res.status(401).json({ message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Signature verification error:", error);
      return res.status(401).json({ message: "Invalid signature" });
    }

    // Clean up the nonce
    delete nonceStore[addressLower];

    // Find or create a user for this wallet address
    let user = await storage.getUserByWalletAddress(address, "base");

    if (!user) {
      // Create a new user with this wallet address
      user = await storage.createUser({
        username: `base_${address.substring(0, 8)}`,
        password: uuidv4(), // Generate a random password that won't be used
        walletAddress: address,
        walletType: "base",
      });
    }

    // Add wallet address to the userWallets table if it doesn't exist
    try {
      // Check if this wallet is already registered for this user
      const userWallets = await storage.getUserWallets(user.id);
      const existingWallet = userWallets.find(
        (w) =>
          w.address.toLowerCase() === addressLower && w.chainType === "base",
      );

      if (!existingWallet) {
        // Add the wallet to the user_wallets table
        await storage.addUserWallet({
          userId: user.id,
          address: addressLower,
          chainType: "base",
          isDefault: userWallets.length === 0, // Make it default if it's the first wallet
        });
      }
    } catch (error) {
      console.error("Error adding wallet to user_wallets:", error);
      // Continue with authentication even if adding wallet fails
    }

    // Set up session
    if (req.session) {
      // Force regenerate the session to prevent session fixation attacks
      const sessionData = {
        userId: user.id,
        username: user.username,
        walletAddress: address,
        walletType: "base"
      };
      
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Authentication failed" });
        }
        
        // Now assign the user data to the new session
        req.session.userId = sessionData.userId;
        req.session.username = sessionData.username;
        req.session.walletAddress = sessionData.walletAddress;
        req.session.walletType = sessionData.walletType;
        
        // Save the session to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Authentication failed" });
          }
          
          // Log the session for debugging
          console.log("Base wallet authentication successful, new session:", {
            sessionId: req.session.id,
            userId: req.session.userId,
            username: req.session.username,
            walletAddress: req.session.walletAddress,
            walletType: req.session.walletType
          });
          
          // Return user info
          res.json({
            id: user.id,
            username: user.username,
            walletAddress: address,
            walletType: "base",
          });
        });
      });
    } else {
      console.error("No session found during Base wallet authentication");
      res.status(500).json({ message: "Session initialization failed" });
    }
  } catch (error) {
    console.error("Base authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
});

// Validation schema for user registration
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Validation schema for user login
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// User registration endpoint
router.post("/register", async (req: Request, res: Response) => {
  try {
    console.log("Register request body:", req.body);

    // Validate request body
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid registration data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { username, password } = validation.data;

    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
    });

    // Set up session - automatically log in the user
    if (req.session) {
      // Force regenerate the session to prevent session fixation attacks
      const sessionData = {
        userId: user.id,
        username: user.username
      };
      
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Registration failed" });
        }
        
        // Now assign the user data to the new session
        req.session.userId = sessionData.userId;
        req.session.username = sessionData.username;
        
        // Save the session to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Registration failed" });
          }
          
          // Log the session for debugging
          console.log("Registration successful, new session:", {
            sessionId: req.session.id,
            userId: req.session.userId,
            username: req.session.username
          });
          
          // Return user info (exclude password)
          res.status(200).json({
            id: user.id,
            username: user.username,
          });
        });
      });
    } else {
      console.error("No session found during registration");
      res.status(500).json({ message: "Session initialization failed" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// User login endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    console.log("Login request body:", req.body);

    // Validate request body
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid login data",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    const { username, password } = validation.data;

    // Find the user
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password
    if (!user.password) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await verifyPassword(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Set up session
    if (req.session) {
      // Force regenerate the session to prevent session fixation attacks
      const sessionData = {
        userId: user.id,
        username: user.username
      };
      
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Now assign the user data to the new session
        req.session.userId = sessionData.userId;
        req.session.username = sessionData.username;
        
        // Save the session to ensure it's stored
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          
          // Log the session for debugging
          console.log("Login successful, new session:", {
            sessionId: req.session.id,
            userId: req.session.userId,
            username: req.session.username
          });
          
          // Return user info (exclude password)
          res.status(200).json({
            id: user.id,
            username: user.username,
          });
        });
      });
    } else {
      console.error("No session found during login");
      res.status(500).json({ message: "Session initialization failed" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Logout endpoint
router.post("/logout", (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }

      res.json({ message: "Logged out successfully" });
    });
  } else {
    res.json({ message: "No active session" });
  }
});

// Get current user session
router.get("/session", (req: Request, res: Response) => {
  if (req.session && req.session.userId) {
    res.json({
      userId: req.session.userId,
      username: req.session.username,
      walletAddress: req.session.walletAddress,
      walletType: req.session.walletType,
    });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Get current user details
router.get("/me", async (req: Request, res: Response) => {
  try {
    // Log session info for debugging
    console.log("Session info:", {
      hasSession: !!req.session,
      sessionId: req.session?.id,
      userId: req.session?.userId,
      username: req.session?.username,
    });

    // Check if the user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.session.userId;

    // Get user from the database
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

// Get user wallet addresses
router.get("/wallets", (req: Request, res: Response) => {
  // Check if the user is authenticated
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const userId = req.session.userId;

  storage
    .getUserWallets(userId)
    .then((wallets) => {
      res.json(wallets);
    })
    .catch((error) => {
      console.error("Error fetching user wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    });
});

// Link a new wallet to an existing user
router.post("/link-wallet", async (req: Request, res: Response) => {
  try {
    console.log("Link wallet request body:", req.body);

    // Validate request body using the extended schema that includes walletType
    const validation = walletLinkSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // Check if the user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get current authenticated user ID from session
    const userId = req.session.userId;

    // Find the user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { address, signature, walletType } = validation.data;

    const addressLower = address.toLowerCase();

    // Check if we have a nonce for this address
    if (!nonceStore[addressLower]) {
      return res
        .status(400)
        .json({ message: "No authentication request found for this address" });
    }

    // Get the nonce and message
    const { nonce, expiresAt } = nonceStore[addressLower];

    // Check if nonce is expired
    if (expiresAt < Date.now()) {
      delete nonceStore[addressLower];
      return res
        .status(400)
        .json({ message: "Authentication request expired" });
    }

    // Reconstruct the message that was signed
    const message = `Sign this message to authenticate with Trailer app: ${nonce}`;

    // Verify the signature based on wallet type
    if (walletType === "ethereum" || walletType === "base") {
      try {
        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() !== addressLower) {
          return res.status(401).json({ message: "Invalid signature" });
        }
      } catch (error) {
        console.error("Signature verification error:", error);
        return res.status(401).json({ message: "Invalid signature" });
      }
    } else if (walletType === "solana") {
      // For demo, we'll skip verification for Solana
      // In production, implement proper Solana signature verification
    } else {
      return res.status(400).json({ message: "Unsupported wallet type" });
    }

    // Clean up the nonce
    delete nonceStore[addressLower];

    // Check if this wallet is already registered for this user or another user
    const existingUserWithWallet = await storage.getUserByWalletAddress(
      address,
      walletType,
    );
    if (existingUserWithWallet && existingUserWithWallet.id !== userId) {
      return res.status(400).json({
        message: "This wallet address is already linked to another account",
      });
    }

    // Get user's existing wallets
    const userWallets = await storage.getUserWallets(userId);

    // Check if user already has this wallet type
    const existingWalletWithType = userWallets.find(
      (w) => w.chainType === walletType,
    );
    if (existingWalletWithType) {
      return res.status(400).json({
        message: `You already have a ${walletType} wallet linked to your account`,
      });
    }

    // Check if this specific wallet is already linked
    const existingWallet = userWallets.find(
      (w) =>
        w.address.toLowerCase() === addressLower && w.chainType === walletType,
    );

    if (existingWallet) {
      return res.status(400).json({
        message: "This wallet is already linked to your account",
      });
    }

    // Add the wallet to the user_wallets table
    const newWallet = await storage.addUserWallet({
      userId: userId,
      address: addressLower,
      chainType: walletType,
      isDefault: userWallets.length === 0, // Make it default if it's the first wallet
    });

    // Return the newly linked wallet
    res.json({
      message: "Wallet linked successfully",
      wallet: newWallet,
    });
  } catch (error) {
    console.error("Error linking wallet:", error);
    res.status(500).json({ message: "Failed to link wallet" });
  }
});

// Remove a user wallet
router.delete("/wallets/:id", async (req: Request, res: Response) => {
  try {
    // Check if the user is authenticated
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.session.userId;

    const walletId = req.params.id;
    if (!walletId) {
      return res.status(400).json({ message: "Wallet ID is required" });
    }

    // Get all user wallets to check if this is the default wallet
    const userWallets = await storage.getUserWallets(userId);
    const walletToRemove = userWallets.find((w) => w.id === walletId);

    if (!walletToRemove) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Prevent removal of default wallets
    if (walletToRemove.isDefault) {
      return res.status(400).json({ message: "Cannot remove default wallet" });
    }

    // Remove the wallet
    const removed = await storage.removeUserWallet(walletId);

    if (removed) {
      res.json({ message: "Wallet removed successfully" });
    } else {
      res.status(500).json({ message: "Failed to remove wallet" });
    }
  } catch (error) {
    console.error("Error removing wallet:", error);
    res.status(500).json({ message: "Failed to remove wallet" });
  }
});

export default router;
