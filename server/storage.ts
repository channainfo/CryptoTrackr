import { users, type User, type InsertUser, portfolio, cryptocurrencies, transactions } from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for our application
export interface PortfolioAsset {
  id: number;
  userId: number;
  cryptoId: number;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  value: number;
  priceChangePercentage24h: number;
}

export interface Transaction {
  id: number;
  userId: number;
  cryptoId: number;
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
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Portfolio methods
  getPortfolioAssets(): Promise<PortfolioAsset[]>;
  getPortfolioAsset(id: number): Promise<PortfolioAsset | undefined>;
  addPortfolioAsset(asset: Partial<PortfolioAsset>): Promise<PortfolioAsset>;
  updatePortfolioAsset(id: number, data: Partial<PortfolioAsset>): Promise<PortfolioAsset | undefined>;
  removePortfolioAsset(id: number): Promise<boolean>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  addTransaction(transaction: Partial<Transaction>): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private portfolioAssets: Map<number, PortfolioAsset>;
  private cryptoTransactions: Map<number, Transaction>;
  private userId: number;
  private assetId: number;
  private transactionId: number;

  constructor() {
    this.users = new Map();
    this.portfolioAssets = new Map();
    this.cryptoTransactions = new Map();
    this.userId = 1;
    this.assetId = 1;
    this.transactionId = 1;
    
    // Seed some initial data
    this.seedData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Portfolio methods
  async getPortfolioAssets(): Promise<PortfolioAsset[]> {
    return Array.from(this.portfolioAssets.values());
  }

  async getPortfolioAsset(id: number): Promise<PortfolioAsset | undefined> {
    return this.portfolioAssets.get(id);
  }

  async addPortfolioAsset(assetData: Partial<PortfolioAsset>): Promise<PortfolioAsset> {
    // Check if asset with the same symbol already exists
    const existingAsset = Array.from(this.portfolioAssets.values()).find(
      asset => asset.symbol === assetData.symbol
    );

    if (existingAsset) {
      // Update existing asset
      const newQuantity = existingAsset.quantity + (assetData.quantity || 0);
      const updatedAsset = {
        ...existingAsset,
        quantity: newQuantity,
        value: newQuantity * existingAsset.currentPrice
      };
      this.portfolioAssets.set(existingAsset.id, updatedAsset);
      
      // Add a transaction for this purchase
      this.addTransaction({
        userId: 1, // Default user
        cryptoId: existingAsset.cryptoId,
        cryptoName: existingAsset.name,
        cryptoSymbol: existingAsset.symbol,
        type: 'buy',
        quantity: assetData.quantity || 0,
        price: existingAsset.currentPrice,
        value: (assetData.quantity || 0) * existingAsset.currentPrice,
        timestamp: new Date().toISOString()
      });
      
      return updatedAsset;
    } else {
      // Create new asset
      const id = this.assetId++;
      const newAsset: PortfolioAsset = {
        id,
        userId: 1, // Default user
        cryptoId: id,
        symbol: assetData.symbol || 'UNKNOWN',
        name: assetData.name || 'Unknown Cryptocurrency',
        quantity: assetData.quantity || 0,
        purchasePrice: assetData.currentPrice || 0,
        currentPrice: assetData.currentPrice || 0,
        value: (assetData.quantity || 0) * (assetData.currentPrice || 0),
        priceChangePercentage24h: assetData.priceChangePercentage24h || 0
      };
      this.portfolioAssets.set(id, newAsset);
      
      // Add a transaction for this purchase
      this.addTransaction({
        userId: 1, // Default user
        cryptoId: id,
        cryptoName: newAsset.name,
        cryptoSymbol: newAsset.symbol,
        type: 'buy',
        quantity: newAsset.quantity,
        price: newAsset.currentPrice,
        value: newAsset.value,
        timestamp: new Date().toISOString()
      });
      
      return newAsset;
    }
  }

  async updatePortfolioAsset(id: number, data: Partial<PortfolioAsset>): Promise<PortfolioAsset | undefined> {
    const asset = this.portfolioAssets.get(id);
    if (!asset) return undefined;

    const updatedAsset = { ...asset, ...data };
    this.portfolioAssets.set(id, updatedAsset);
    return updatedAsset;
  }

  async removePortfolioAsset(id: number): Promise<boolean> {
    const asset = this.portfolioAssets.get(id);
    if (asset) {
      // Add a sell transaction
      this.addTransaction({
        userId: 1, // Default user
        cryptoId: asset.cryptoId,
        cryptoName: asset.name,
        cryptoSymbol: asset.symbol,
        type: 'sell',
        quantity: asset.quantity,
        price: asset.currentPrice,
        value: asset.value,
        timestamp: new Date().toISOString()
      });
    }
    
    return this.portfolioAssets.delete(id);
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.cryptoTransactions.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.cryptoTransactions.get(id);
  }

  async addTransaction(transactionData: Partial<Transaction>): Promise<Transaction> {
    const id = this.transactionId++;
    const transaction: Transaction = {
      id,
      userId: transactionData.userId || 1,
      cryptoId: transactionData.cryptoId || 0,
      cryptoName: transactionData.cryptoName || 'Unknown',
      cryptoSymbol: transactionData.cryptoSymbol || 'UNKNOWN',
      type: transactionData.type || 'buy',
      quantity: transactionData.quantity || 0,
      price: transactionData.price || 0,
      value: transactionData.value || 0,
      timestamp: transactionData.timestamp || new Date().toISOString()
    };
    this.cryptoTransactions.set(id, transaction);
    return transaction;
  }

  // Seed initial data for demo purposes
  private seedData() {
    // Create a default user
    this.createUser({
      username: 'demo',
      password: 'password'
    });

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

    seedAssets.forEach(asset => {
      this.addPortfolioAsset({
        userId: 1,
        symbol: asset.symbol,
        name: asset.name,
        quantity: asset.quantity,
        purchasePrice: asset.currentPrice,
        currentPrice: asset.currentPrice,
        value: asset.quantity * asset.currentPrice,
        priceChangePercentage24h: asset.priceChangePercentage24h
      });
    });

    // Add some recent transactions
    const seedTransactions = [
      {
        cryptoId: 1,
        cryptoName: 'Bitcoin',
        cryptoSymbol: 'BTC',
        type: 'buy',
        quantity: 0.02,
        price: 62145.87,
        value: 1242.91,
        timestamp: '2023-11-12T10:24:00Z'
      },
      {
        cryptoId: 2,
        cryptoName: 'Ethereum',
        cryptoSymbol: 'ETH',
        type: 'sell',
        quantity: 0.5,
        price: 2198.34,
        value: 1099.17,
        timestamp: '2023-11-10T15:45:00Z'
      },
      {
        cryptoId: 3,
        cryptoName: 'Solana',
        cryptoSymbol: 'SOL',
        type: 'buy',
        quantity: 2.5,
        price: 128.75,
        value: 321.88,
        timestamp: '2023-11-08T09:12:00Z'
      }
    ];

    seedTransactions.forEach(tx => {
      this.addTransaction({
        userId: 1,
        cryptoId: tx.cryptoId,
        cryptoName: tx.cryptoName,
        cryptoSymbol: tx.cryptoSymbol,
        type: tx.type,
        quantity: tx.quantity,
        price: tx.price,
        value: tx.value,
        timestamp: tx.timestamp
      });
    });
  }
}

export const storage = new MemStorage();
