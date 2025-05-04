import { 
  users, userWallets, type User, type InsertUser, type UserWallet, type InsertUserWallet,
  portfolios, tokens, portfolioTokens, transactions, tokenMarketDatas, 
  type Token, type Portfolio, type PortfolioToken, type Transaction as SchemaTransaction
} from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { db, pool } from "./db";
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for our application to maintain backward compatibility
export interface PortfolioAsset {
  id: string;
  userId: string;
  cryptoId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  value: number;
  priceChangePercentage24h: number;
}

export interface Transaction {
  id: string;
  userId: string;
  cryptoId: string;
  cryptoName: string;
  cryptoSymbol: string;
  type: string;
  quantity: number;
  price: number;
  value: number;
  timestamp: string;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(address: string, walletType: string): Promise<User | undefined>;
  createUser(user: InsertUser & { walletAddress?: string, walletType?: string }): Promise<User>;
  
  // User wallet methods
  getUserWallets(userId: string): Promise<UserWallet[]>;
  getUserWalletByAddress(address: string, chainType: string): Promise<UserWallet | undefined>;
  addUserWallet(wallet: InsertUserWallet): Promise<UserWallet>;
  updateUserWallet(id: string, data: Partial<UserWallet>): Promise<UserWallet | undefined>;
  removeUserWallet(id: string): Promise<boolean>;
  
  // Portfolio methods
  getUserPortfolios(userId: string): Promise<Portfolio[]>;
  createPortfolio(data: Partial<Portfolio>): Promise<Portfolio>;
  getPortfolioById(id: string): Promise<Portfolio | undefined>;
  updatePortfolio(id: string, data: Partial<Portfolio>): Promise<Portfolio | undefined>;
  deletePortfolio(id: string): Promise<boolean>;
  
  // Portfolio assets methods
  getPortfolioAssets(): Promise<PortfolioAsset[]>;
  getPortfolioAssetsById(portfolioId: string): Promise<PortfolioAsset[]>;
  getPortfolioAsset(id: string): Promise<PortfolioAsset | undefined>;
  addPortfolioAsset(asset: Partial<PortfolioAsset>): Promise<PortfolioAsset>;
  updatePortfolioAsset(id: string, data: Partial<PortfolioAsset>): Promise<PortfolioAsset | undefined>;
  removePortfolioAsset(id: string): Promise<boolean>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  addTransaction(transaction: Partial<Transaction>): Promise<Transaction>;
}

export class DatabaseStorage implements IStorage {
  // USER METHODS
  async getUser(id: string): Promise<User | undefined> {
    try {
      // Use direct SQL query to avoid schema mismatch issues
      const result = await pool.query(
        `SELECT * FROM users WHERE id = $1 LIMIT 1`,
        [id]
      );
      
      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Use direct SQL query to avoid schema mismatch issues
      const result = await pool.query(
        `SELECT * FROM users WHERE username = $1 LIMIT 1`,
        [username]
      );
      
      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as User;
      }
      return undefined;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByWalletAddress(address: string, walletType: string): Promise<User | undefined> {
    try {
      // Check if the user_wallets table exists
      try {
        const tableCheck = await pool.query(
          `SELECT EXISTS (
             SELECT FROM information_schema.tables 
             WHERE table_name = 'user_wallets'
          ) AS table_exists`
        );
        
        // If the table doesn't exist, fall back to checking the users table
        if (!tableCheck.rows[0].table_exists) {
          console.log("user_wallets table doesn't exist, falling back to users table");
          
          // Check if the wallet_address column exists in the users table
          const columnCheck = await pool.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_name = 'users' AND column_name = 'wallet_address'`
          );
          
          // If the column doesn't exist, return undefined - we can't query by wallet address
          if (!columnCheck.rows || columnCheck.rows.length === 0) {
            return undefined;
          }
          
          // Use direct SQL query to find user by wallet address and type
          const result = await pool.query(
            `SELECT * FROM users 
             WHERE wallet_address = $1 AND wallet_type = $2 
             LIMIT 1`,
            [address.toLowerCase(), walletType]
          );
          
          if (result.rows && result.rows.length > 0) {
            return result.rows[0] as User;
          }
          
          return undefined;
        }
      } catch (error) {
        console.error("Error checking for user_wallets table:", error);
        return undefined;
      }
      
      // First find the wallet in user_wallets
      const walletResult = await pool.query(
        `SELECT * FROM user_wallets 
         WHERE address = $1 AND chain_type = $2 
         LIMIT 1`,
        [address.toLowerCase(), walletType]
      );
      
      // If we found a wallet, get the associated user
      if (walletResult.rows && walletResult.rows.length > 0) {
        const wallet = walletResult.rows[0];
        
        const userResult = await pool.query(
          `SELECT * FROM users 
           WHERE id = $1 
           LIMIT 1`,
          [wallet.user_id]
        );
        
        if (userResult.rows && userResult.rows.length > 0) {
          return userResult.rows[0] as User;
        }
      }
      
      // If we didn't find the wallet in user_wallets, try the legacy path with users table
      // This handles the migration period
      const legacyResult = await pool.query(
        `SELECT * FROM users 
         WHERE wallet_address = $1 AND wallet_type = $2 
         LIMIT 1`,
        [address.toLowerCase(), walletType]
      );
      
      if (legacyResult.rows && legacyResult.rows.length > 0) {
        const user = legacyResult.rows[0] as User;
        
        // Migrate this wallet to the user_wallets table
        console.log(`Migrating wallet ${address} from users table to user_wallets table for user ${user.id}`);
        
        try {
          // Add the wallet to user_wallets
          await this.addUserWallet({
            userId: user.id,
            address: address.toLowerCase(),
            chainType: walletType,
            isDefault: true
          });
          
          // Clear the wallet data from the users table to prevent duplication
          await pool.query(
            `UPDATE users 
             SET wallet_address = NULL, wallet_type = NULL 
             WHERE id = $1`,
            [user.id]
          );
        } catch (error) {
          console.error("Error migrating wallet to user_wallets:", error);
          // Continue with authentication even if migration fails
        }
        
        return user;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting user by wallet address:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser & { walletAddress?: string, walletType?: string }): Promise<User> {
    try {
      // Extract fields from insertUser
      const { username, password } = insertUser;
      
      // Create user without wallet data
      const result = await pool.query(
        `INSERT INTO users (username, password, created_at, updated_at) 
         VALUES ($1, $2, NOW(), NOW()) 
         RETURNING *`,
        [username, password]
      );
      
      if (result.rows && result.rows.length > 0) {
        const user = result.rows[0] as User;
        
        // If wallet data is provided, add it to the user_wallets table
        if (insertUser.walletAddress && insertUser.walletType) {
          try {
            await this.addUserWallet({
              userId: user.id,
              address: insertUser.walletAddress.toLowerCase(),
              chainType: insertUser.walletType,
              isDefault: true // First wallet added is default
            });
          } catch (error) {
            console.error("Error adding wallet during user creation:", error);
            // Continue with user creation even if adding wallet fails
          }
        }
        
        return user;
      }
      
      throw new Error("Failed to create user");
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }
  
  // USER WALLET METHODS
  async getUserWallets(userId: string): Promise<UserWallet[]> {
    try {
      // Check if the user_wallets table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_name = 'user_wallets'
        ) AS table_exists`
      );
      
      if (!tableCheck.rows[0].table_exists) {
        // If the table doesn't exist yet, create it
        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_wallets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id),
            address VARCHAR(255) NOT NULL,
            chain_type VARCHAR(50) NOT NULL,
            is_default BOOLEAN DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        return [];
      }
      
      const wallets = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.userId, userId))
        .orderBy(desc(userWallets.isDefault), asc(userWallets.createdAt));
      
      // For demonstration - if this user has no wallets, add some demo wallets
      if (wallets.length === 0) {
        console.log(`Seeding demo wallets for user ${userId}`);
        
        // Create demo wallets with fixed IDs for demonstration
        const demoWallets: UserWallet[] = [];
        
        // Ethereum wallet (default)
        const ethWallet = await this.addUserWallet({
          userId,
          address: "0x1234567890abcdef1234567890abcdef12345678",
          chainType: "ethereum",
          isDefault: true
        });
        demoWallets.push(ethWallet);
        
        // Solana wallet
        const solWallet = await this.addUserWallet({
          userId,
          address: "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsVLcUvcB4",
          chainType: "solana",
          isDefault: false
        });
        demoWallets.push(solWallet);
        
        // Base wallet
        const baseWallet = await this.addUserWallet({
          userId,
          address: "0xabcdef1234567890abcdef1234567890abcdef12",
          chainType: "base",
          isDefault: false
        });
        demoWallets.push(baseWallet);
        
        // Sui wallet
        const suiWallet = await this.addUserWallet({
          userId,
          address: "0x7890abcdef1234567890abcdef1234567890abcd",
          chainType: "sui",
          isDefault: false
        });
        demoWallets.push(suiWallet);
        
        return demoWallets;
      }
      
      return wallets;
    } catch (error) {
      console.error("Error getting user wallets:", error);
      return [];
    }
  }
  
  async getUserWalletByAddress(address: string, chainType: string): Promise<UserWallet | undefined> {
    try {
      // Use a direct SQL query to avoid TypeScript issues with chainType enum
      const result = await pool.query(
        `SELECT * FROM user_wallets 
         WHERE address = $1 AND chain_type = $2 
         LIMIT 1`,
        [address.toLowerCase(), chainType]
      );
      
      if (result.rows && result.rows.length > 0) {
        return result.rows[0] as UserWallet;
      }
      
      return undefined;
    } catch (error) {
      console.error("Error getting wallet by address:", error);
      return undefined;
    }
  }
  
  async addUserWallet(wallet: InsertUserWallet): Promise<UserWallet> {
    try {
      // Check if this wallet address already exists for this user
      const existingWallet = await this.getUserWalletByAddress(wallet.address, wallet.chainType);
      
      if (existingWallet) {
        throw new Error("Wallet address already exists for this chain type");
      }
      
      // If this is the first wallet or marked as default, reset any other default wallet
      if (wallet.isDefault) {
        await db
          .update(userWallets)
          .set({ isDefault: false })
          .where(eq(userWallets.userId, wallet.userId));
      }
      
      // If no wallets exist for this user, make this the default
      const userWalletsCount = await db
        .select({ count: db.fn.count() })
        .from(userWallets)
        .where(eq(userWallets.userId, wallet.userId));
      
      const isFirstWallet = userWalletsCount[0].count === 0;
      
      const [newWallet] = await db.insert(userWallets)
        .values({
          userId: wallet.userId,
          address: wallet.address.toLowerCase(),
          chainType: wallet.chainType,
          isDefault: isFirstWallet || wallet.isDefault || false,
        })
        .returning();
      
      return newWallet;
    } catch (error) {
      console.error("Error adding user wallet:", error);
      throw error;
    }
  }
  
  async updateUserWallet(id: string, data: Partial<UserWallet>): Promise<UserWallet | undefined> {
    try {
      const updateData: Partial<typeof userWallets.$inferInsert> = {};
      
      if (data.isDefault !== undefined) {
        updateData.isDefault = data.isDefault;
        
        // If setting this wallet as default, unset any other default wallets for this user
        if (data.isDefault) {
          const wallet = await db
            .select()
            .from(userWallets)
            .where(eq(userWallets.id, id))
            .limit(1);
          
          if (wallet.length > 0) {
            await db
              .update(userWallets)
              .set({ isDefault: false })
              .where(and(
                eq(userWallets.userId, wallet[0].userId),
                eq(userWallets.isDefault, true),
                eq(userWallets.id, id, true) // Not the current wallet
              ));
          }
        }
      }
      
      updateData.updatedAt = new Date();
      
      if (Object.keys(updateData).length === 0) {
        const wallet = await db
          .select()
          .from(userWallets)
          .where(eq(userWallets.id, id))
          .limit(1);
          
        return wallet[0];
      }
      
      const [updatedWallet] = await db
        .update(userWallets)
        .set(updateData)
        .where(eq(userWallets.id, id))
        .returning();
      
      return updatedWallet;
    } catch (error) {
      console.error("Error updating user wallet:", error);
      return undefined;
    }
  }
  
  async removeUserWallet(id: string): Promise<boolean> {
    try {
      // Get the wallet first to check if it's default
      const wallet = await db
        .select()
        .from(userWallets)
        .where(eq(userWallets.id, id))
        .limit(1);
      
      if (wallet.length === 0) {
        return false;
      }
      
      // Delete the wallet
      await db
        .delete(userWallets)
        .where(eq(userWallets.id, id));
      
      // If this was the default wallet, set another one as default if available
      if (wallet[0].isDefault) {
        const remainingWallets = await db
          .select()
          .from(userWallets)
          .where(eq(userWallets.userId, wallet[0].userId))
          .limit(1);
        
        if (remainingWallets.length > 0) {
          await db
            .update(userWallets)
            .set({ isDefault: true })
            .where(eq(userWallets.id, remainingWallets[0].id));
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error removing user wallet:", error);
      return false;
    }
  }

  // PORTFOLIO MANAGEMENT METHODS
  async getUserPortfolios(userId: string): Promise<Portfolio[]> {
    const userPortfolios = await db.select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    return userPortfolios;
  }

  async createPortfolio(data: Partial<Portfolio>): Promise<Portfolio> {
    if (!data.userId) {
      throw new Error('User ID is required to create a portfolio');
    }

    console.log("Creating portfolio in storage:", JSON.stringify(data, null, 2));
    console.log("isWatchlist value:", data.isWatchlist);

    const [portfolio] = await db.insert(portfolios)
      .values({
        userId: data.userId,
        name: data.name || 'New Portfolio',
        description: data.description,
        isDefault: data.isDefault || false,
        isWatchlist: data.isWatchlist || false, // CRITICAL FIX: Include isWatchlist here
      })
      .returning();
    
    return portfolio;
  }

  async getPortfolioById(id: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select()
      .from(portfolios)
      .where(eq(portfolios.id, id));
    
    return portfolio;
  }
  
  async updatePortfolio(id: string, data: Partial<Portfolio>): Promise<Portfolio | undefined> {
    const updateData: Partial<typeof portfolios.$inferInsert> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.isWatchlist !== undefined) updateData.isWatchlist = data.isWatchlist; // CRITICAL FIX: Include isWatchlist here
    
    console.log("Updating portfolio, data received:", JSON.stringify(data, null, 2));
    console.log("Update data to apply:", JSON.stringify(updateData, null, 2));
    
    if (Object.keys(updateData).length === 0) {
      // No valid update fields provided
      const portfolio = await this.getPortfolioById(id);
      return portfolio;
    }
    
    updateData.updatedAt = new Date();
    
    const [updatedPortfolio] = await db.update(portfolios)
      .set(updateData)
      .where(eq(portfolios.id, id))
      .returning();
    
    return updatedPortfolio;
  }
  
  async deletePortfolio(id: string): Promise<boolean> {
    try {
      const portfolio = await this.getPortfolioById(id);
      if (!portfolio) return false;
      
      // Delete portfolio tokens first (cascading deletion)
      const portfolioTokensInPortfolio = await db
        .select()
        .from(portfolioTokens)
        .where(eq(portfolioTokens.portfolioId, id));
        
      // Delete each token's related transactions
      for (const token of portfolioTokensInPortfolio) {
        await db
          .delete(transactions)
          .where(eq(transactions.portfolioTokenId, token.id));
      }
      
      // Delete portfolio tokens
      await db
        .delete(portfolioTokens)
        .where(eq(portfolioTokens.portfolioId, id));
      
      // Delete the portfolio itself
      await db
        .delete(portfolios)
        .where(eq(portfolios.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      return false;
    }
  }

  async getPortfolioAssetsById(portfolioId: string): Promise<PortfolioAsset[]> {
    // Get the portfolio tokens with related token information
    const portfolioTokensWithTokens = await db.query.portfolioTokens.findMany({
      where: eq(portfolioTokens.portfolioId, portfolioId),
      with: {
        token: true,
      },
    });

    // Convert to the expected format
    return portfolioTokensWithTokens.map(pt => {
      return {
        id: pt.id,
        userId: pt.userId,
        cryptoId: pt.tokenId,
        symbol: pt.token.symbol,
        name: pt.token.name,
        quantity: Number(pt.amount),
        purchasePrice: Number(pt.averageBuyPrice),
        currentPrice: Number(pt.currentPrice),
        value: Number(pt.totalValue),
        priceChangePercentage24h: 0 // This would need to come from market data
      };
    });
  }

  // PORTFOLIO ASSETS METHODS
  async getPortfolioAssets(): Promise<PortfolioAsset[]> {
    // First, get the default portfolio or create it if it doesn't exist
    let defaultPortfolio = await this.getDefaultPortfolio();
    
    // Get the portfolio tokens with related token information
    const portfolioTokensWithTokens = await db.query.portfolioTokens.findMany({
      where: eq(portfolioTokens.portfolioId, defaultPortfolio.id),
      with: {
        token: true,
      },
    });

    // Convert to the expected format
    return portfolioTokensWithTokens.map(pt => {
      return {
        id: pt.id,
        userId: pt.userId,
        cryptoId: pt.tokenId,
        symbol: pt.token.symbol,
        name: pt.token.name,
        quantity: Number(pt.amount),
        purchasePrice: Number(pt.averageBuyPrice),
        currentPrice: Number(pt.currentPrice),
        value: Number(pt.totalValue),
        priceChangePercentage24h: 0 // This would need to come from market data
      };
    });
  }

  async getPortfolioAsset(id: string): Promise<PortfolioAsset | undefined> {
    const [portfolioToken] = await db.query.portfolioTokens.findMany({
      where: eq(portfolioTokens.id, id),
      with: {
        token: true,
      },
    });

    if (!portfolioToken) return undefined;

    return {
      id: portfolioToken.id,
      userId: portfolioToken.userId,
      cryptoId: portfolioToken.tokenId,
      symbol: portfolioToken.token.symbol,
      name: portfolioToken.token.name,
      quantity: Number(portfolioToken.amount),
      purchasePrice: Number(portfolioToken.averageBuyPrice),
      currentPrice: Number(portfolioToken.currentPrice),
      value: Number(portfolioToken.totalValue),
      priceChangePercentage24h: 0 // Would need to come from market data
    };
  }

  async addPortfolioAsset(assetData: Partial<PortfolioAsset & { portfolioId?: string }>): Promise<PortfolioAsset> {
    // First, get or create the token
    let token = await this.getOrCreateToken(assetData.symbol || 'UNKNOWN', assetData.name || 'Unknown Cryptocurrency');
    
    // Get the portfolio - either specified or default
    let targetPortfolio;
    if (assetData.portfolioId) {
      const portfolio = await this.getPortfolioById(assetData.portfolioId);
      if (!portfolio) {
        throw new Error(`Portfolio with ID ${assetData.portfolioId} not found`);
      }
      targetPortfolio = portfolio;
    } else {
      targetPortfolio = await this.getDefaultPortfolio();
    }
    
    // Check if the portfolio already has this token
    const [existingPortfolioToken] = await db.select()
      .from(portfolioTokens)
      .where(
        and(
          eq(portfolioTokens.portfolioId, targetPortfolio.id),
          eq(portfolioTokens.tokenId, token.id)
        )
      );
      
    if (existingPortfolioToken) {
      // Update existing portfolio token
      const newAmount = Number(existingPortfolioToken.amount) + (assetData.quantity || 0);
      const currentPrice = assetData.currentPrice || Number(existingPortfolioToken.currentPrice);
      const totalValue = newAmount * currentPrice;
      
      // Calculate new average buy price based on current and new purchase
      const totalInvestedBefore = Number(existingPortfolioToken.amount) * Number(existingPortfolioToken.averageBuyPrice);
      const newInvestment = (assetData.quantity || 0) * currentPrice;
      const newAverageBuyPrice = (totalInvestedBefore + newInvestment) / newAmount;
      
      const [updatedToken] = await db.update(portfolioTokens)
        .set({
          amount: newAmount.toString(),
          averageBuyPrice: newAverageBuyPrice.toString(),
          currentPrice: currentPrice.toString(),
          totalValue: totalValue.toString(),
          totalInvested: (totalInvestedBefore + newInvestment).toString(),
          buyCount: Number(existingPortfolioToken.buyCount) + 1,
          lastTradeDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(portfolioTokens.id, existingPortfolioToken.id))
        .returning();
        
      // Add transaction
      await this.addTransactionToDb({
        userId: updatedToken.userId,
        portfolioId: updatedToken.portfolioId,
        portfolioTokenId: updatedToken.id,
        tokenId: token.id,
        type: 'buy',
        amount: (assetData.quantity || 0).toString(),
        price: currentPrice.toString(),
        totalValue: ((assetData.quantity || 0) * currentPrice).toString(),
        transactionDate: new Date(),
      });
      
      // Return in expected format
      return {
        id: updatedToken.id,
        userId: updatedToken.userId,
        cryptoId: token.id,
        symbol: token.symbol,
        name: token.name,
        quantity: newAmount,
        purchasePrice: newAverageBuyPrice,
        currentPrice: currentPrice,
        value: totalValue,
        priceChangePercentage24h: assetData.priceChangePercentage24h || 0
      };
    } else {
      // Create new portfolio token
      const quantity = assetData.quantity || 0;
      const currentPrice = assetData.currentPrice || 0;
      const totalValue = quantity * currentPrice;
      
      const [newPortfolioToken] = await db.insert(portfolioTokens)
        .values({
          userId: targetPortfolio.userId,
          portfolioId: targetPortfolio.id,
          tokenId: token.id,
          amount: quantity.toString(),
          averageBuyPrice: currentPrice.toString(),
          currentPrice: currentPrice.toString(),
          totalInvested: totalValue.toString(),
          totalValue: totalValue.toString(),
          profitLoss: "0",
          buyCount: 1,
          sellCount: 0,
          lastTradeDate: new Date()
        })
        .returning();
        
      // Add transaction
      await this.addTransactionToDb({
        userId: newPortfolioToken.userId,
        portfolioId: newPortfolioToken.portfolioId,
        portfolioTokenId: newPortfolioToken.id,
        tokenId: token.id,
        type: 'buy',
        amount: quantity.toString(),
        price: currentPrice.toString(),
        totalValue: totalValue.toString(),
        transactionDate: new Date(),
      });
      
      // Return in expected format
      return {
        id: newPortfolioToken.id,
        userId: newPortfolioToken.userId,
        cryptoId: token.id,
        symbol: token.symbol,
        name: token.name,
        quantity: quantity,
        purchasePrice: currentPrice,
        currentPrice: currentPrice,
        value: totalValue,
        priceChangePercentage24h: assetData.priceChangePercentage24h || 0
      };
    }
  }

  async updatePortfolioAsset(id: string, data: Partial<PortfolioAsset>): Promise<PortfolioAsset | undefined> {
    const portfolioToken = await this.getPortfolioAsset(id);
    if (!portfolioToken) return undefined;
    
    const updateData: Partial<typeof portfolioTokens.$inferInsert> = {};
    
    // Check if this is a partial sell (quantity is reduced)
    const isPartialSell = data.quantity !== undefined && data.quantity < portfolioToken.quantity;
    const sellQuantity = isPartialSell ? portfolioToken.quantity - data.quantity : 0;
    
    if (data.quantity !== undefined) {
      updateData.amount = data.quantity.toString();
      updateData.totalValue = (data.quantity * (data.currentPrice || portfolioToken.currentPrice)).toString();
    }
    
    if (data.currentPrice !== undefined) {
      updateData.currentPrice = data.currentPrice.toString();
      updateData.totalValue = ((data.quantity || portfolioToken.quantity) * data.currentPrice).toString();
    }
    
    if (data.purchasePrice !== undefined) {
      updateData.averageBuyPrice = data.purchasePrice.toString();
      updateData.totalInvested = ((data.quantity || portfolioToken.quantity) * data.purchasePrice).toString();
    }
    
    // Calculate profit/loss if we have enough data
    if (updateData.currentPrice && updateData.averageBuyPrice && updateData.amount) {
      const profitLoss = (Number(updateData.currentPrice) - Number(updateData.averageBuyPrice)) * Number(updateData.amount);
      updateData.profitLoss = profitLoss.toString();
    }
    
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      
      // If this is a partial sell, increment the sell count
      if (isPartialSell) {
        const portfolioTokenData = await db.query.portfolioTokens.findFirst({
          where: eq(portfolioTokens.id, id)
        });
        
        if (portfolioTokenData) {
          updateData.sellCount = (Number(portfolioTokenData.sellCount) || 0) + 1;
        }
      }
      
      const [updated] = await db.update(portfolioTokens)
        .set(updateData)
        .where(eq(portfolioTokens.id, id))
        .returning();
      
      if (!updated) return undefined;
      
      // Get the associated token for returning complete info
      const [token] = await db.select().from(tokens).where(eq(tokens.id, updated.tokenId));
      
      // If this was a partial sell, record a sell transaction
      if (isPartialSell && sellQuantity > 0) {
        // Get portfolio (may be needed for transaction)
        const portfolio = await db.query.portfolios.findFirst({
          where: eq(portfolios.id, updated.portfolioId)
        });
        
        if (portfolio) {
          // Add a sell transaction for the portion that was sold
          await this.addTransactionToDb({
            userId: updated.userId,
            portfolioId: updated.portfolioId,
            portfolioTokenId: updated.id,
            tokenId: updated.tokenId,
            type: 'sell',
            amount: sellQuantity.toString(),
            price: portfolioToken.currentPrice.toString(),
            totalValue: (sellQuantity * portfolioToken.currentPrice).toString(),
            transactionDate: new Date(),
          });
        }
      }
      
      return {
        id: updated.id,
        userId: updated.userId,
        cryptoId: updated.tokenId,
        symbol: token.symbol,
        name: token.name,
        quantity: Number(updated.amount),
        purchasePrice: Number(updated.averageBuyPrice),
        currentPrice: Number(updated.currentPrice),
        value: Number(updated.totalValue),
        priceChangePercentage24h: portfolioToken.priceChangePercentage24h // Maintain existing value
      };
    }
    
    return portfolioToken; // Return original if no changes
  }

  async removePortfolioAsset(id: string): Promise<boolean> {
    // First get the asset details for the sell transaction
    const asset = await this.getPortfolioAsset(id);
    if (!asset) return false;
    
    try {
      // Add a sell transaction
      await this.addTransactionToDb({
        userId: asset.userId,
        portfolioId: (await this.getDefaultPortfolio()).id,
        portfolioTokenId: asset.id,
        tokenId: asset.cryptoId,
        type: 'sell',
        amount: asset.quantity.toString(),
        price: asset.currentPrice.toString(),
        totalValue: asset.value.toString(),
        transactionDate: new Date(),
      });
      
      // Delete the portfolio token
      await db.delete(portfolioTokens).where(eq(portfolioTokens.id, id));
      return true;
    } catch (error) {
      console.error('Error removing portfolio asset:', error);
      return false;
    }
  }

  // TRANSACTION METHODS
  async getTransactions(): Promise<Transaction[]> {
    const dbTransactions = await db.query.transactions.findMany({
      with: {
        token: true
      },
      orderBy: [desc(transactions.transactionDate)]
    });
    
    return dbTransactions.map(tx => ({
      id: tx.id,
      userId: tx.userId,
      cryptoId: tx.tokenId,
      cryptoName: tx.token.name,
      cryptoSymbol: tx.token.symbol,
      type: tx.type,
      quantity: Number(tx.amount),
      price: Number(tx.price),
      value: Number(tx.totalValue),
      timestamp: tx.transactionDate.toISOString()
    }));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [tx] = await db.query.transactions.findMany({
      where: eq(transactions.id, id),
      with: {
        token: true
      }
    });
    
    if (!tx) return undefined;
    
    return {
      id: tx.id,
      userId: tx.userId,
      cryptoId: tx.tokenId,
      cryptoName: tx.token.name,
      cryptoSymbol: tx.token.symbol,
      type: tx.type,
      quantity: Number(tx.amount),
      price: Number(tx.price),
      value: Number(tx.totalValue),
      timestamp: tx.transactionDate.toISOString()
    };
  }

  async addTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    // First ensure we have a token
    const tokenName = transactionData.cryptoName || 'Unknown';
    const tokenSymbol = transactionData.cryptoSymbol || 'UNKNOWN';
    const token = await this.getOrCreateToken(tokenSymbol, tokenName);
    
    // Get default portfolio
    const portfolio = await this.getDefaultPortfolio();
    
    // See if we have an existing portfolio token for this
    let portfolioToken: PortfolioToken | undefined;
    try {
      const [existingToken] = await db.select()
        .from(portfolioTokens)
        .where(
          and(
            eq(portfolioTokens.portfolioId, portfolio.id),
            eq(portfolioTokens.tokenId, token.id)
          )
        );
      
      portfolioToken = existingToken;
    } catch (error) {
      console.error('Error finding portfolio token:', error);
    }
    
    // If we don't have a portfolio token and this is a buy, create one
    if (!portfolioToken && transactionData.type === 'buy') {
      const quantity = transactionData.quantity || 0;
      const price = transactionData.price || 0;
      const value = quantity * price;
      
      const [newToken] = await db.insert(portfolioTokens)
        .values({
          userId: portfolio.userId,
          portfolioId: portfolio.id,
          tokenId: token.id,
          amount: quantity.toString(),
          averageBuyPrice: price.toString(),
          currentPrice: price.toString(),
          totalInvested: value.toString(),
          totalValue: value.toString(),
          profitLoss: "0",
          buyCount: 1,
          sellCount: 0,
          lastTradeDate: new Date()
        })
        .returning();
        
      portfolioToken = newToken;
    }
    
    // Now add the transaction
    const txDate = transactionData.timestamp ? new Date(transactionData.timestamp) : new Date();
    
    const [newTransaction] = await db.insert(transactions)
      .values({
        userId: portfolio.userId,
        portfolioId: portfolio.id,
        portfolioTokenId: portfolioToken?.id || uuidv4(), // Use a placeholder if we don't have a token (e.g. for historical sells)
        tokenId: token.id,
        type: transactionData.type as any || 'buy',
        amount: (transactionData.quantity || 0).toString(),
        price: (transactionData.price || 0).toString(),
        totalValue: (transactionData.value || (transactionData.quantity || 0) * (transactionData.price || 0)).toString(),
        isManual: true,
        transactionDate: txDate
      })
      .returning();
    
    // Return in the expected format
    return {
      id: newTransaction.id,
      userId: newTransaction.userId,
      cryptoId: token.id,
      cryptoName: token.name, 
      cryptoSymbol: token.symbol,
      type: newTransaction.type,
      quantity: Number(newTransaction.amount),
      price: Number(newTransaction.price),
      value: Number(newTransaction.totalValue),
      timestamp: newTransaction.transactionDate.toISOString()
    };
  }

  // Helper methods
  private async getDefaultPortfolio(): Promise<Portfolio> {
    // Get the default user
    let defaultUser: User;
    try {
      // Use direct SQL query to avoid schema mismatch issues
      const userResult = await pool.query(
        `SELECT * FROM users WHERE username = $1 LIMIT 1`,
        ['demo']
      );
      
      if (userResult.rows && userResult.rows.length > 0) {
        defaultUser = userResult.rows[0] as User;
      } else {
        // Create a new default user
        const newUserResult = await pool.query(
          `INSERT INTO users (username, password, created_at, updated_at) 
           VALUES ($1, $2, NOW(), NOW()) 
           RETURNING *`,
          ['demo', 'password']
        );
        
        if (newUserResult.rows && newUserResult.rows.length > 0) {
          defaultUser = newUserResult.rows[0] as User;
        } else {
          throw new Error("Failed to create default user");
        }
      }
    } catch (error) {
      console.error('Error getting/creating default user:', error);
      // Try one more time as a fallback
      const newUserResult = await pool.query(
        `INSERT INTO users (username, password, created_at, updated_at) 
         VALUES ($1, $2, NOW(), NOW()) 
         RETURNING *`,
        ['demo' + Math.floor(Math.random() * 1000), 'password']
      );
      
      if (newUserResult.rows && newUserResult.rows.length > 0) {
        defaultUser = newUserResult.rows[0] as User;
      } else {
        throw new Error("Failed to create default user after multiple attempts");
      }
    }
    
    // Now get or create the default portfolio
    let defaultPortfolio: Portfolio;
    try {
      const portfolioResult = await pool.query(
        `SELECT * FROM portfolios 
         WHERE user_id = $1 AND name = $2 
         LIMIT 1`,
        [defaultUser.id, 'Default Portfolio']
      );
      
      if (portfolioResult.rows && portfolioResult.rows.length > 0) {
        defaultPortfolio = portfolioResult.rows[0] as Portfolio;
      } else {
        // Create a new default portfolio
        const newPortfolioResult = await pool.query(
          `INSERT INTO portfolios (id, user_id, name, description, is_default, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
           RETURNING *`,
          [uuidv4(), defaultUser.id, 'Default Portfolio', 'Your default portfolio', true]
        );
        
        if (newPortfolioResult.rows && newPortfolioResult.rows.length > 0) {
          defaultPortfolio = newPortfolioResult.rows[0] as Portfolio;
        } else {
          throw new Error("Failed to create default portfolio");
        }
      }
    } catch (error) {
      console.error('Error getting/creating default portfolio:', error);
      // Try one more time as a fallback
      const newPortfolioResult = await pool.query(
        `INSERT INTO portfolios (id, user_id, name, description, is_default, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
         RETURNING *`,
        [uuidv4(), defaultUser.id, 'Default Portfolio', 'Your default portfolio', true]
      );
      
      if (newPortfolioResult.rows && newPortfolioResult.rows.length > 0) {
        defaultPortfolio = newPortfolioResult.rows[0] as Portfolio;
      } else {
        throw new Error("Failed to create default portfolio after multiple attempts");
      }
    }
    
    return defaultPortfolio;
  }
  
  private async getOrCreateToken(symbol: string, name: string): Promise<Token> {
    try {
      // Try to find the token first
      const [existingToken] = await db.select()
        .from(tokens)
        .where(eq(tokens.symbol, symbol));
      
      if (existingToken) {
        return existingToken;
      }
    } catch (error) {
      console.error(`Error finding token ${symbol}:`, error);
    }
    
    // Create the token if it doesn't exist
    try {
      const [newToken] = await db.insert(tokens)
        .values({
          symbol: symbol,
          name: name,
          chain: 'ethereum', // Default chain
          decimals: 18,      // Default decimals
          isVerified: true   // For simplicity
        })
        .returning();
      
      return newToken;
    } catch (error) {
      console.error(`Error creating token ${symbol}:`, error);
      throw error;
    }
  }
  
  private async addTransactionToDb(txData: Partial<typeof transactions.$inferInsert>): Promise<SchemaTransaction> {
    // Make sure required fields are present
    if (!txData.type) {
      txData.type = 'buy';
    }
    
    const [tx] = await db.insert(transactions)
      .values(txData as any)
      .returning();
    
    return tx;
  }
  
  // This method would seed initial data if needed
  async seedInitialDataIfNeeded() {
    // Check if we already have users
    try {
      // Use a direct query to check if users exist
      const userCountResult = await pool.query(
        `SELECT COUNT(*) FROM users`
      );
      
      const userCount = parseInt(userCountResult.rows[0].count);
      
      // If we have users, don't seed
      if (userCount > 0) {
        return;
      }
      
      // Create default user
      await this.createUser({
        username: 'demo',
        password: 'password'
      });
      
      // Get the default portfolio for the newly created user
      const defaultPortfolio = await this.getDefaultPortfolio();
      
      // Seed some portfolio assets
      const seedAssets = [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          quantity: 0.14,
          currentPrice: 62145.87,
          priceChangePercentage24h: 2.4
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          quantity: 1.2,
          currentPrice: 2198.34,
          priceChangePercentage24h: 1.8
        },
        {
          symbol: 'SOL',
          name: 'Solana',
          quantity: 5.5,
          currentPrice: 128.75,
          priceChangePercentage24h: -2.3
        },
        {
          symbol: 'DOT',
          name: 'Polkadot',
          quantity: 15,
          currentPrice: 17.23,
          priceChangePercentage24h: 0.7
        }
      ];

      for (const asset of seedAssets) {
        await this.addPortfolioAsset({
          userId: defaultPortfolio.userId,
          portfolioId: defaultPortfolio.id,
          symbol: asset.symbol,
          name: asset.name,
          quantity: asset.quantity,
          purchasePrice: asset.currentPrice,
          currentPrice: asset.currentPrice,
          value: asset.quantity * asset.currentPrice,
          priceChangePercentage24h: asset.priceChangePercentage24h
        });
      }

      // Some transactions are already created by addPortfolioAsset, but we'll add a few more
      const seedExtraTransactions = [
        {
          cryptoId: "", // Will be set by getOrCreateToken
          cryptoName: 'Bitcoin',
          cryptoSymbol: 'BTC',
          type: 'buy',
          quantity: 0.02,
          price: 62145.87,
          value: 1242.91,
          timestamp: '2023-11-12T10:24:00Z'
        },
        {
          cryptoId: "", // Will be set by getOrCreateToken
          cryptoName: 'Ethereum',
          cryptoSymbol: 'ETH',
          type: 'sell',
          quantity: 0.5,
          price: 2198.34,
          value: 1099.17,
          timestamp: '2023-11-10T15:45:00Z'
        }
      ];

      for (const tx of seedExtraTransactions) {
        await this.addTransaction(tx);
      }
    } catch (error) {
      console.error('Error seeding initial data:', error);
    }
  }
}

// Initialize the storage with database connection
export const storage = new DatabaseStorage();

// Seed initial data if needed (should be called once when the server starts)
storage.seedInitialDataIfNeeded().catch(console.error);
