import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { 
  insertPortfolioSchema, 
  insertTransactionSchema, 
  portfolioTokens, 
  tokens 
} from "@shared/schema";
import { services } from "./services/cryptoApi";
import { HistoricalValueService } from "./services";
import { TaxCalculationModel } from "./models/TaxCalculationModel";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Utility function to calculate market sentiment based on market data
function calculateSentimentFromMarket(marketData: any[]) {
  // Default sentiment if no data
  if (!marketData || !marketData.length) {
    return {
      sentiment: {
        score: 50,
        mood: 'neutral',
        change: 0,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  // Calculate sentiment based on price changes of top coins
  const topCoins = marketData.slice(0, 10); // Top 10 coins
  
  // Calculate average 24h change
  const avgChange24h = topCoins.reduce((sum, coin) => {
    return sum + (parseFloat(coin.priceChange24h) || 0);
  }, 0) / topCoins.length;
  
  // Calculate average 7d change  
  const avgChange7d = topCoins.reduce((sum, coin) => {
    return sum + (parseFloat(coin.priceChange7d) || 0);
  }, 0) / topCoins.length;
  
  // Bitcoin dominance factor (if BTC doing better than average, market is less fearful)
  const btcData = marketData.find(coin => coin.symbol === 'BTC');
  const btcDominanceFactor = btcData ? 
    ((parseFloat(btcData.priceChange24h) || 0) - avgChange24h) * 0.1 : 
    0;
  
  // Volume change factor
  const volumeFactor = topCoins.reduce((sum, coin) => {
    // Higher volume usually means more market activity
    return sum + (parseFloat(coin.volume24h) > 1000000 ? 2 : 0);
  }, 0) / topCoins.length;
  
  // Calculate base score (0-100)
  // 50 is neutral, <30 is extreme fear, >70 is extreme greed
  let baseScore = 50; // Start at neutral
  
  // Price movement impact on sentiment
  baseScore += avgChange24h * 2; // 24h change has bigger impact
  baseScore += avgChange7d * 1; // 7d change has smaller impact
  baseScore += btcDominanceFactor;
  baseScore += volumeFactor;
  
  // Clamp score between 0 and 100
  const score = Math.max(0, Math.min(100, Math.round(baseScore)));
  
  // Determine mood based on score
  let mood;
  if (score < 25) mood = 'extreme_fear';
  else if (score < 40) mood = 'fear';
  else if (score < 60) mood = 'neutral';
  else if (score < 80) mood = 'greed';
  else mood = 'extreme_greed';
  
  return {
    sentiment: {
      score,
      mood,
      change: Math.round(avgChange24h * 10) / 10, // Round to 1 decimal place
      timestamp: new Date().toISOString()
    }
  };
}

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
  
  // Get market sentiment data
  app.get('/api/crypto/sentiment', async (req, res) => {
    try {
      const sentimentData = await services.getSentimentData();
      res.json(sentimentData);
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      
      // Use fallback data based on market trends if API fails
      const marketData = await services.getMarketData();
      const fallbackSentiment = calculateSentimentFromMarket(marketData);
      res.json(fallbackSentiment);
    }
  });

  // Get portfolio assets (all portfolios)
  app.get('/api/portfolio', async (req, res) => {
    try {
      const assets = await storage.getPortfolioAssets();
      res.json(assets);
    } catch (error) {
      console.error('Error fetching portfolio assets:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio data' });
    }
  });
  
  // Get assets for a specific portfolio
  app.get('/api/portfolios/:portfolioId/assets', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      const assets = await storage.getPortfolioAssetsById(portfolioId);
      res.json(assets);
    } catch (error) {
      console.error('Error fetching portfolio assets:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio data' });
    }
  });

  // Add asset to portfolio (default portfolio)
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
  
  // Add asset to a specific portfolio
  app.post('/api/portfolios/:portfolioId/assets', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      // Get the default user
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Check if portfolio exists and belongs to user
      const portfolio = await storage.getPortfolioById(portfolioId);
      if (!portfolio || portfolio.userId !== defaultUser.id) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      // Create asset with specific portfolio ID
      const assetData = {
        portfolioId: portfolioId,
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

  // Remove asset from portfolio (default portfolio)
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
  
  // Remove asset from specific portfolio
  app.delete('/api/portfolios/:portfolioId/assets/:assetId', async (req, res) => {
    try {
      const { portfolioId, assetId } = req.params;
      if (!portfolioId || !assetId) {
        return res.status(400).json({ message: 'Invalid portfolio or asset ID' });
      }
      
      // Get the default user
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Check if portfolio exists and belongs to user
      const portfolio = await storage.getPortfolioById(portfolioId);
      if (!portfolio || portfolio.userId !== defaultUser.id) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      // Check if asset exists and belongs to the specified portfolio
      const asset = await storage.getPortfolioAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      
      await storage.removePortfolioAsset(assetId);
      res.status(204).send();
    } catch (error) {
      console.error('Error removing portfolio asset:', error);
      res.status(500).json({ message: 'Failed to remove asset' });
    }
  });

  // Get user portfolios
  app.get('/api/portfolios', async (req, res) => {
    try {
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      const portfolios = await storage.getUserPortfolios(defaultUser.id);
      res.json(portfolios);
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
      res.status(500).json({ message: 'Failed to fetch portfolios' });
    }
  });
  
  // Get portfolio by ID
  app.get('/api/portfolios/:portfolioId', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      const portfolio = await storage.getPortfolioById(portfolioId);
      
      if (!portfolio || portfolio.userId !== defaultUser.id) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      res.json(portfolio);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio' });
    }
  });
  
  // Get portfolio summary
  app.get('/api/portfolios/:portfolioId/summary', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Check if portfolio exists and belongs to user
      const portfolio = await storage.getPortfolioById(portfolioId);
      if (!portfolio || portfolio.userId !== defaultUser.id) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      // Get portfolio assets
      const assets = await storage.getPortfolioAssetsById(portfolioId);
      
      // Calculate summary data
      const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
      const assetCount = assets.length;
      
      res.json({
        id: portfolioId,
        totalValue,
        assetCount
      });
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio summary' });
    }
  });
  
  // Get assets for a specific portfolio
  app.get('/api/portfolios/:portfolioId/assets', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      const assets = await storage.getPortfolioAssetsById(portfolioId);
      res.json(assets);
    } catch (error) {
      console.error('Error fetching portfolio assets:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio assets' });
    }
  });

  // Create new portfolio
  app.post('/api/portfolios', async (req, res) => {
    try {
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      const portfolioData = {
        name: req.body.name,
        description: req.body.description,
        isDefault: req.body.isDefault || false,
        userId: defaultUser.id
      };
      
      // If this portfolio is set as default, update any existing default portfolios
      if (portfolioData.isDefault) {
        const userPortfolios = await storage.getUserPortfolios(defaultUser.id);
        for (const p of userPortfolios) {
          if (p.isDefault) {
            // Update this portfolio to not be the default
            await storage.updatePortfolio(p.id, { isDefault: false });
          }
        }
      }
      
      const portfolio = await storage.createPortfolio(portfolioData);
      res.status(201).json(portfolio);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      res.status(400).json({ message: 'Invalid portfolio data' });
    }
  });
  
  // Update portfolio
  app.patch('/api/portfolios/:portfolioId', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Check if portfolio exists and belongs to user
      const portfolio = await storage.getPortfolioById(portfolioId);
      if (!portfolio || portfolio.userId !== defaultUser.id) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      const updateData = {
        name: req.body.name,
        description: req.body.description,
        isDefault: req.body.isDefault
      };
      
      // If this portfolio is set as default, update any existing default portfolios
      if (updateData.isDefault) {
        const userPortfolios = await storage.getUserPortfolios(defaultUser.id);
        for (const p of userPortfolios) {
          if (p.id !== portfolioId && p.isDefault) {
            // Update this portfolio to not be the default
            await storage.updatePortfolio(p.id, { isDefault: false });
          }
        }
      }
      
      const updatedPortfolio = await storage.updatePortfolio(portfolioId, updateData);
      res.json(updatedPortfolio);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      res.status(400).json({ message: 'Invalid portfolio data' });
    }
  });
  
  // Delete portfolio
  app.delete('/api/portfolios/:portfolioId', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Check if portfolio exists and belongs to user
      const portfolio = await storage.getPortfolioById(portfolioId);
      if (!portfolio || portfolio.userId !== defaultUser.id) {
        return res.status(404).json({ message: 'Portfolio not found' });
      }
      
      // Make sure we don't delete the only portfolio
      const userPortfolios = await storage.getUserPortfolios(defaultUser.id);
      if (userPortfolios.length <= 1) {
        return res.status(400).json({ message: 'Cannot delete the only portfolio' });
      }
      
      // Make sure another portfolio is set as default if this one is default
      if (portfolio.isDefault) {
        const otherPortfolio = userPortfolios.find(p => p.id !== portfolioId);
        if (otherPortfolio) {
          await storage.updatePortfolio(otherPortfolio.id, { isDefault: true });
        }
      }
      
      // Delete all assets in portfolio first
      const assets = await storage.getPortfolioAssetsById(portfolioId);
      for (const asset of assets) {
        await storage.removePortfolioAsset(asset.id);
      }
      
      // Delete the portfolio itself
      await storage.deletePortfolio(portfolioId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      res.status(500).json({ message: 'Failed to delete portfolio' });
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

  // Record historical values for all portfolios and tokens
  app.post('/api/history/record', async (req, res) => {
    try {
      const result = await HistoricalValueService.recordTodayValues();
      res.status(200).json(result);
    } catch (error) {
      console.error('Error recording historical values:', error);
      res.status(500).json({ message: 'Failed to record historical values' });
    }
  });
  
  // Record historical values for specific portfolio
  app.post('/api/portfolios/:portfolioId/history/record', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      const result = await HistoricalValueService.recordPortfolioValue(portfolioId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error recording portfolio historical values:', error);
      res.status(500).json({ message: 'Failed to record portfolio historical values' });
    }
  });
  
  // Get portfolio performance data
  app.get('/api/portfolios/:portfolioId/performance', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      const period = req.query.period as '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' || '1M';
      const performance = await HistoricalValueService.getPortfolioPerformance(portfolioId, period);
      
      if (!performance) {
        return res.status(404).json({ message: 'Portfolio performance data not found' });
      }
      
      res.json(performance);
    } catch (error) {
      console.error('Error fetching portfolio performance:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio performance data' });
    }
  });
  
  // Get portfolio token details
  app.get('/api/portfolio-tokens/:portfolioTokenId', async (req, res) => {
    try {
      const portfolioTokenId = req.params.portfolioTokenId;
      if (!portfolioTokenId) {
        return res.status(400).json({ message: 'Invalid portfolio token ID' });
      }
      
      // Get token details
      const token = await db
        .select({
          id: portfolioTokens.id,
          portfolioId: portfolioTokens.portfolioId,
          userId: portfolioTokens.userId,
          tokenId: portfolioTokens.tokenId,
          amount: portfolioTokens.amount,
          averageBuyPrice: portfolioTokens.averageBuyPrice,
          totalInvested: portfolioTokens.totalInvested,
          currentPrice: portfolioTokens.currentPrice,
          totalValue: portfolioTokens.totalValue,
          profitLoss: portfolioTokens.profitLoss,
          tokenSymbol: tokens.symbol,
          tokenName: tokens.name,
          tokenImageUrl: tokens.imageUrl
        })
        .from(portfolioTokens)
        .leftJoin(tokens, eq(portfolioTokens.tokenId, tokens.id))
        .where(eq(portfolioTokens.id, portfolioTokenId))
        .limit(1);
      
      if (!token[0]) {
        return res.status(404).json({ message: 'Portfolio token not found' });
      }
      
      res.json(token[0]);
    } catch (error) {
      console.error('Error fetching portfolio token:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio token' });
    }
  });

  // Get token performance data
  app.get('/api/portfolio-tokens/:portfolioTokenId/performance', async (req, res) => {
    try {
      const portfolioTokenId = req.params.portfolioTokenId;
      if (!portfolioTokenId) {
        return res.status(400).json({ message: 'Invalid portfolio token ID' });
      }
      
      const period = req.query.period as '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' || '1M';
      const performance = await HistoricalValueService.getTokenPerformance(portfolioTokenId, period);
      
      if (!performance) {
        return res.status(404).json({ message: 'Token performance data not found' });
      }
      
      res.json(performance);
    } catch (error) {
      console.error('Error fetching token performance:', error);
      res.status(500).json({ message: 'Failed to fetch token performance data' });
    }
  });

  // Tax calculation endpoints
  app.get('/api/tax/calculate', async (req, res) => {
    try {
      // Get query parameters
      const year = req.query.year as string || new Date().getFullYear().toString();
      const method = req.query.method as 'fifo' | 'lifo' | 'hifo' || 'fifo';
      const income = req.query.income as string || '50000';
      const status = req.query.status as 'single' | 'joint' | 'separate' | 'head' || 'single';
      
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      try {
        // Try to calculate using real transaction data
        const taxData = await TaxCalculationModel.calculateTaxes(
          defaultUser.id,
          year,
          method,
          income,
          status
        );
        
        res.json(taxData);
      } catch (error) {
        console.warn('Using fallback tax calculation due to error:', error);
        // Fallback to dummy data if real calculation fails
        const dummyData = TaxCalculationModel.generateDummyTaxData(year, income, status);
        res.json(dummyData);
      }
    } catch (error) {
      console.error('Error calculating tax data:', error);
      res.status(500).json({ message: 'Failed to calculate tax data' });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
