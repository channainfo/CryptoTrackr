import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { ethers } from 'ethers';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';

const router = Router();

// Nonce storage for wallet authentication (in-memory for demo purposes)
// In production, use a database to store these
const nonceStore: Record<string, string> = {};

// Login with traditional username/password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    // Find user by username
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Set user in session
    if (req.session) {
      req.session.userId = user.id;
      req.session.username = user.username;
    }
    
    return res.status(200).json({ 
      id: user.id,
      username: user.username
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Registration with traditional username/password
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = insertUserSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid user data', 
        errors: validationResult.error.errors 
      });
    }
    
    const { username, password } = validationResult.data;
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(username);
    
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    // Create new user
    const newUser = await storage.createUser({
      username,
      password
    });
    
    return res.status(201).json({ 
      id: newUser.id,
      username: newUser.username
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate nonce for wallet authentication
router.get('/wallet/nonce/:address', (req: Request, res: Response) => {
  const { address } = req.params;
  
  if (!address) {
    return res.status(400).json({ message: 'Wallet address is required' });
  }
  
  // Generate a random nonce
  const nonce = Math.floor(Math.random() * 1000000).toString();
  nonceStore[address.toLowerCase()] = nonce;
  
  res.status(200).json({
    nonce,
    message: `Sign this message to authenticate with Trailer: ${nonce}`
  });
});

// Authenticate with crypto wallet (Ethereum)
router.post('/wallet/ethereum', async (req: Request, res: Response) => {
  try {
    const { address, signature } = req.body;
    
    if (!address || !signature) {
      return res.status(400).json({ message: 'Address and signature are required' });
    }
    
    const nonce = nonceStore[address.toLowerCase()];
    
    if (!nonce) {
      return res.status(400).json({ message: 'No nonce found for this address. Please request a new one.' });
    }
    
    // Verify signature (message that was signed should be the same format as we provided)
    const message = `Sign this message to authenticate with Trailer: ${nonce}`;
    
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({ message: 'Invalid signature' });
      }
      
      // Find or create user with this wallet address
      let user = await storage.getUserByWalletAddress(address, 'ethereum');
      
      if (!user) {
        // Create a new user account for this wallet address
        const newUsername = `ethereum_${address.substring(0, 8)}`;
        user = await storage.createUser({
          username: newUsername,
          password: uuidv4(), // random password since login will be via wallet
          walletAddress: address,
          walletType: 'ethereum'
        });
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.walletAddress = address;
        req.session.walletType = 'ethereum';
      }
      
      // Clear the nonce after successful authentication
      delete nonceStore[address.toLowerCase()];
      
      return res.status(200).json({ 
        id: user.id,
        username: user.username,
        walletAddress: address,
        walletType: 'ethereum'
      });
    } catch (error) {
      console.error('Signature verification error:', error);
      return res.status(401).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Wallet authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Authenticate with Solana wallet
router.post('/wallet/solana', async (req: Request, res: Response) => {
  try {
    const { address, signature } = req.body;
    
    if (!address || !signature) {
      return res.status(400).json({ message: 'Address and signature are required' });
    }
    
    // For Solana, signature verification is more complex, but in demo mode we'll just assume valid
    // In production, use @solana/web3.js to verify signatures
    
    // Find or create user with this wallet address
    let user = await storage.getUserByWalletAddress(address, 'solana');
    
    if (!user) {
      // Create a new user account for this wallet address
      const newUsername = `solana_${address.substring(0, 8)}`;
      user = await storage.createUser({
        username: newUsername,
        password: uuidv4(), // random password since login will be via wallet
        walletAddress: address,
        walletType: 'solana'
      });
    }
    
    // Set user in session
    if (req.session) {
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.walletAddress = address;
      req.session.walletType = 'solana';
    }
    
    return res.status(200).json({ 
      id: user.id,
      username: user.username,
      walletAddress: address,
      walletType: 'solana'
    });
  } catch (error) {
    console.error('Wallet authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Authenticate with Base wallet (using Ethereum signature verification since Base is EVM-compatible)
router.post('/wallet/base', async (req: Request, res: Response) => {
  try {
    const { address, signature } = req.body;
    
    if (!address || !signature) {
      return res.status(400).json({ message: 'Address and signature are required' });
    }
    
    const nonce = nonceStore[address.toLowerCase()];
    
    if (!nonce) {
      return res.status(400).json({ message: 'No nonce found for this address. Please request a new one.' });
    }
    
    // Verify signature (message that was signed should be the same format as we provided)
    const message = `Sign this message to authenticate with Trailer: ${nonce}`;
    
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({ message: 'Invalid signature' });
      }
      
      // Find or create user with this wallet address
      let user = await storage.getUserByWalletAddress(address, 'base');
      
      if (!user) {
        // Create a new user account for this wallet address
        const newUsername = `base_${address.substring(0, 8)}`;
        user = await storage.createUser({
          username: newUsername,
          password: uuidv4(), // random password since login will be via wallet
          walletAddress: address,
          walletType: 'base'
        });
      }
      
      // Set user in session
      if (req.session) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.walletAddress = address;
        req.session.walletType = 'base';
      }
      
      // Clear the nonce after successful authentication
      delete nonceStore[address.toLowerCase()];
      
      return res.status(200).json({ 
        id: user.id,
        username: user.username,
        walletAddress: address,
        walletType: 'base'
      });
    } catch (error) {
      console.error('Signature verification error:', error);
      return res.status(401).json({ message: 'Invalid signature' });
    }
  } catch (error) {
    console.error('Wallet authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current authenticated user
router.get('/me', (req: Request, res: Response) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  return res.status(200).json({ 
    id: req.session.userId,
    username: req.session.username,
    walletAddress: req.session.walletAddress,
    walletType: req.session.walletType
  });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  } else {
    return res.status(200).json({ message: 'Already logged out' });
  }
});

export default router;