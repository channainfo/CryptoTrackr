import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { insertPortfolioSchema, insertTransactionSchema } from "@shared/schema";
import { services } from "./services/cryptoApi";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up API routes
  app.get('/api/crypto/market', async (req, res) => {
    try {
      const marketData = await services.getMarketData();
      res.json(marketData);
    } catch (error) {
      console.error('Error fetching market data:', error);
      res.status(500).json({ message: 'Failed to fetch market data' });
    }
  });

  // Get portfolio assets
  app.get('/api/portfolio', async (req, res) => {
    try {
      const assets = await storage.getPortfolioAssets();
      res.json(assets);
    } catch (error) {
      console.error('Error fetching portfolio assets:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio data' });
    }
  });

  // Add asset to portfolio
  app.post('/api/portfolio', async (req, res) => {
    try {
      // Get the default user and portfolio first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // We'll automatically handle the userId so user doesn't have to provide it
      const assetData = {
        symbol: req.body.symbol,
        name: req.body.name,
        quantity: req.body.quantity,
        currentPrice: req.body.currentPrice,
        priceChangePercentage24h: req.body.priceChangePercentage24h || 0,
        userId: defaultUser.id,
        value: req.body.quantity * req.body.currentPrice
      };
      
      const asset = await storage.addPortfolioAsset(assetData);
      res.status(201).json(asset);
    } catch (error) {
      console.error('Error adding portfolio asset:', error);
      res.status(400).json({ message: 'Invalid portfolio data' });
    }
  });

  // Remove asset from portfolio
  app.delete('/api/portfolio/:id', async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) {
        return res.status(400).json({ message: 'Invalid asset ID' });
      }
      
      await storage.removePortfolioAsset(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing portfolio asset:', error);
      res.status(500).json({ message: 'Failed to remove asset' });
    }
  });

  // Get transactions
  app.get('/api/transactions', async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Add transaction
  app.post('/api/transactions', async (req, res) => {
    try {
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      const txData = {
        cryptoName: req.body.cryptoName,
        cryptoSymbol: req.body.cryptoSymbol,
        type: req.body.type || 'buy',
        quantity: req.body.quantity,
        price: req.body.price,
        value: req.body.value || (req.body.quantity * req.body.price),
        userId: defaultUser.id,
        timestamp: req.body.timestamp || new Date().toISOString()
      };
      
      const transaction = await storage.addTransaction(txData);
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
      res.status(400).json({ message: 'Invalid transaction data' });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
