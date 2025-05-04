import { Router, Request, Response } from "express";
import { storage } from "../storage";
import crypto from "crypto";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";

const router = Router();

// In-memory storage for nonces (in a production app, this would be in Redis/DB)
const nonceStore: Record<string, { nonce: string, expiresAt: number }> = {};

// Clean up expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(nonceStore).forEach(address => {
    if (nonceStore[address].expiresAt < now) {
      delete nonceStore[address];
    }
  });
}, 5 * 60 * 1000);

// Validation schema for wallet authentication
const walletAuthSchema = z.object({
  address: z.string().min(1, "Wallet address is required"),
  signature: z.string().min(1, "Signature is required")
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
    res.status(500).json({ message: "Failed to generate authentication nonce" });
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
        errors: validation.error.flatten().fieldErrors 
      });
    }
    
    const { address, signature } = validation.data;
    const addressLower = address.toLowerCase();
    
    // Check if we have a nonce for this address
    if (!nonceStore[addressLower]) {
      return res.status(400).json({ message: "No authentication request found for this address" });
    }
    
    // Get the nonce and message
    const { nonce, expiresAt } = nonceStore[addressLower];
    
    // Check if nonce is expired
    if (expiresAt < Date.now()) {
      delete nonceStore[addressLower];
      return res.status(400).json({ message: "Authentication request expired" });
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
        walletType: "ethereum"
      });
    }
    
    // Set up session
    if (req.session) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.walletAddress = address;
      req.session.walletType = "ethereum";
    }
    
    // Return user info
    res.json({
      id: user.id,
      username: user.username,
      walletAddress: address,
      walletType: "ethereum"
    });
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
        errors: validation.error.flatten().fieldErrors 
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
        walletType: "solana"
      });
    }
    
    // Set up session
    if (req.session) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.walletAddress = address;
      req.session.walletType = "solana";
    }
    
    // Return user info
    res.json({
      id: user.id,
      username: user.username,
      walletAddress: address,
      walletType: "solana"
    });
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
        errors: validation.error.flatten().fieldErrors 
      });
    }
    
    const { address, signature } = validation.data;
    const addressLower = address.toLowerCase();
    
    // Check if we have a nonce for this address
    if (!nonceStore[addressLower]) {
      return res.status(400).json({ message: "No authentication request found for this address" });
    }
    
    // Get the nonce and message
    const { nonce, expiresAt } = nonceStore[addressLower];
    
    // Check if nonce is expired
    if (expiresAt < Date.now()) {
      delete nonceStore[addressLower];
      return res.status(400).json({ message: "Authentication request expired" });
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
        walletType: "base"
      });
    }
    
    // Set up session
    if (req.session) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.walletAddress = address;
      req.session.walletType = "base";
    }
    
    // Return user info
    res.json({
      id: user.id,
      username: user.username,
      walletAddress: address,
      walletType: "base"
    });
  } catch (error) {
    console.error("Base authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
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
      walletType: req.session.walletType
    });
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

export default router;