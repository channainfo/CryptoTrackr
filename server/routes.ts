import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import { 
  insertPortfolioSchema, 
  insertTransactionSchema, 
  insertAlertSchema,
  portfolioTokens, 
  tokens,
  alerts
} from "@shared/schema";
import { services } from "./services/cryptoApi";
import { HistoricalValueService } from "./services";
import { TaxCalculationModel } from "./models/TaxCalculationModel";
import { AlertModel } from "./models/AlertModel";
import { AlertService } from "./services/AlertService";
import { db } from "./db";
import { eq } from "drizzle-orm";
import learningRoutes from "./routes/learningRoutes";

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
  // Register learning routes
  app.use('/api/learning', learningRoutes);
  
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
  
  // Get all available tokens
  app.get('/api/crypto/tokens', async (req, res) => {
    try {
      // Get tokens from database, or fetch from market data if needed
      let tokensList = await db.select().from(tokens);
      
      // If no tokens in database, get them from market data
      if (!tokensList.length) {
        const marketData = await services.getMarketData();
        // Use the market data as tokens list
        const tokensToInsert = marketData.map(coin => ({
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          description: null,
          tokenRank: coin.market_cap_rank || null,
          imageUrl: coin.image || null,
          chain: 'default', // Default chain
          contractAddress: null,
          decimals: 18, // Default for most tokens
          totalSupply: null,
          maxSupply: null,
          isVerified: true,
          launchedAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        // Store the tokens in the database for future use
        if (tokensToInsert.length) {
          try {
            await db.insert(tokens).values(tokensToInsert);
            tokensList = await db.select().from(tokens);
          } catch (insertError) {
            console.error('Error inserting tokens:', insertError);
            // If there's an error inserting, still return the market data
            tokensList = tokensToInsert;
          }
        }
      }
      
      res.json(tokensList);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      res.status(500).json({ message: 'Failed to fetch tokens data' });
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
      
      // Get filter parameters
      const type = req.query.type as string;
      
      // Get all portfolios for this user
      let portfolios = await storage.getUserPortfolios(defaultUser.id);
      
      // Print all portfolios and their isWatchlist value for debugging
      console.log("All portfolios before filtering:");
      portfolios.forEach(p => {
        console.log(`Portfolio ${p.name}: isWatchlist=${p.isWatchlist}, type=${typeof p.isWatchlist}`);
      });
      
      // Apply filters if specified
      if (type === 'watchlist') {
        console.log('Filtering for watchlist portfolios only');
        // Use Boolean constructor to ensure we're comparing booleans
        portfolios = portfolios.filter(p => Boolean(p.isWatchlist) === true);
      } else if (type === 'standard') {
        console.log('Filtering for standard portfolios only');
        portfolios = portfolios.filter(p => Boolean(p.isWatchlist) === false);
      } else {
        // When no filter specified (i.e., "all portfolios"), still exclude watchlists
        console.log('No specific filtering applied, but excluding watchlists from the default view');
        portfolios = portfolios.filter(p => Boolean(p.isWatchlist) === false);
      }
      
      console.log(`After filtering for ${type || 'all'}, found ${portfolios.length} portfolios`);
      portfolios.forEach(p => {
        console.log(`- ${p.name} (id: ${p.id}, isWatchlist: ${p.isWatchlist})`);
      });
      
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
  
  // Get portfolio performance data
  app.get('/api/portfolios/:portfolioId/performance', async (req, res) => {
    try {
      const portfolioId = req.params.portfolioId;
      if (!portfolioId) {
        return res.status(400).json({ message: 'Invalid portfolio ID' });
      }
      
      const period = req.query.period as '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' || '1M';
      
      // Since HistoricalValueService might not be initialized,
      // we'll return a sample performance data structure
      const performance = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        startValue: 0,
        endValue: 0,
        changeValue: 0,
        changePercent: 0,
        historical: []
      };
      
      res.json(performance);
    } catch (error) {
      console.error('Error fetching portfolio performance:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio performance data' });
    }
  });

  // Create new portfolio
  app.post('/api/portfolios', async (req, res) => {
    try {
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      console.log("Creating portfolio with data:", JSON.stringify(req.body, null, 2));
      console.log("Is watchlist flag in request:", req.body.isWatchlist);
      console.log("Request body type:", typeof req.body);
      console.log("isWatchlist type:", typeof req.body.isWatchlist);
      
      // DEBUGGING: Force isWatchlist to true if the tab is 'watchlist'
      // This checks req.body.activeTab and forces isWatchlist accordingly
      let isWatchlist = false;
      
      if (req.body.activeTab === 'watchlist') {
        console.log("Creating from watchlist tab, forcing isWatchlist=true");
        isWatchlist = true;
      } else {
        isWatchlist = req.body.isWatchlist === true || req.body.isWatchlist === "true";
        console.log("Standard create, isWatchlist=", isWatchlist);
      }
      
      // Last safety check - if the request contains isWatchlist and it's strictly true, honor that
      if (req.body.isWatchlist === true) {
        console.log("Explicit isWatchlist=true in request, honoring that");
        isWatchlist = true;
      }
      
      console.log("Final isWatchlist value:", isWatchlist);
      
      const portfolioData = {
        name: req.body.name,
        description: req.body.description,
        isDefault: req.body.isDefault || false,
        isWatchlist: isWatchlist,
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
        isDefault: req.body.isDefault,
        isWatchlist: req.body.isWatchlist
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
      
      try {
        const performance = await HistoricalValueService.getPortfolioPerformance(portfolioId, period);
        
        if (performance) {
          return res.json(performance);
        }
      } catch (e) {
        console.log('No historical performance data found, using generated data');
      }
      
      // Generate sample performance data if no historical data exists
      const totalValue = 10000; // Default value
      const historical = [];
      const days = period === '1D' ? 24 : 
                  period === '1W' ? 7 : 
                  period === '1M' ? 30 : 
                  period === '3M' ? 90 : 
                  period === '6M' ? 180 : 
                  period === '1Y' ? 365 : 1095;
                  
      const now = new Date();
      const startDate = new Date();
      
      if (period === '1D') {
        startDate.setHours(startDate.getHours() - days);
        
        for (let i = 0; i <= days; i++) {
          const date = new Date(startDate);
          date.setHours(date.getHours() + i);
          
          const volatility = 0.002; // 0.2% hourly volatility
          const randomChange = (Math.random() - 0.45) * volatility * totalValue;
          const value = totalValue + randomChange * i;
          
          historical.push({
            date: date.toISOString(),
            totalValue: value.toFixed(2),
            totalInvested: (value * 0.8).toFixed(2), // 20% profit
            profitLoss: (value * 0.2).toFixed(2)
          });
        }
      } else {
        startDate.setDate(startDate.getDate() - days);
        
        for (let i = 0; i <= days; i++) {
          const date = new Date(startDate);
          date.setDate(date.getDate() + i);
          
          const volatility = 0.01; // 1% daily volatility
          const randomChange = (Math.random() - 0.45) * volatility * totalValue;
          const value = totalValue + randomChange * i;
          
          historical.push({
            date: date.toISOString(),
            totalValue: value.toFixed(2),
            totalInvested: (value * 0.8).toFixed(2), // 20% profit
            profitLoss: (value * 0.2).toFixed(2)
          });
        }
      }
      
      const performance = {
        startDate: historical[0].date,
        endDate: historical[historical.length - 1].date,
        startValue: parseFloat(historical[0].totalValue),
        endValue: parseFloat(historical[historical.length - 1].totalValue),
        changeValue: parseFloat(historical[historical.length - 1].totalValue) - parseFloat(historical[0].totalValue),
        changePercent: ((parseFloat(historical[historical.length - 1].totalValue) / parseFloat(historical[0].totalValue) - 1) * 100),
        historical
      };
      
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

  // Alert endpoints
  // Get all alerts for a user
  app.get('/api/alerts', async (req, res) => {
    try {
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      const alerts = await AlertModel.findWithTokenDetailsByUserId(defaultUser.id);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  // Get alert by ID
  app.get('/api/alerts/:alertId', async (req, res) => {
    try {
      const alertId = req.params.alertId;
      if (!alertId) {
        return res.status(400).json({ message: 'Invalid alert ID' });
      }
      
      const alert = await AlertModel.findById(alertId);
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.json(alert);
    } catch (error) {
      console.error('Error fetching alert:', error);
      res.status(500).json({ message: 'Failed to fetch alert' });
    }
  });

  // Create new alert
  app.post('/api/alerts', async (req, res) => {
    try {
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Ensure threshold is a string
      const requestData = {
        ...req.body,
        userId: defaultUser.id,
        // Convert threshold to string if it's a number
        threshold: typeof req.body.threshold === 'number' 
          ? req.body.threshold.toString() 
          : req.body.threshold
      };
      
      // Validate request body using Zod schema
      const validatedData = insertAlertSchema.parse(requestData);
      
      const alert = await AlertModel.create(validatedData);
      
      // Return the created alert with formatted threshold and type label
      res.status(201).json({
        ...alert,
        formattedThreshold: AlertService.formatThreshold(alert.alertType, Number(alert.threshold)),
        typeLabel: AlertService.getAlertTypeLabel(alert.alertType)
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(400).json({ message: 'Invalid alert data', error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update alert
  app.patch('/api/alerts/:alertId', async (req, res) => {
    try {
      const alertId = req.params.alertId;
      if (!alertId) {
        return res.status(400).json({ message: 'Invalid alert ID' });
      }
      
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Check if alert exists
      const alert = await AlertModel.findById(alertId);
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      // Make sure this alert belongs to the current user
      if (alert.userId !== defaultUser.id) {
        return res.status(403).json({ message: 'Not authorized to update this alert' });
      }
      
      // Update data, ensuring threshold is string
      const updateData = {
        alertType: req.body.alertType,
        threshold: typeof req.body.threshold === 'number' 
          ? req.body.threshold.toString() 
          : req.body.threshold,
        status: req.body.status,
        notificationMethod: req.body.notificationMethod,
        name: req.body.name,
        description: req.body.description
      };
      
      const updatedAlert = await AlertModel.update(alertId, updateData);
      
      // Handle the case where update might fail or return undefined
      if (!updatedAlert) {
        return res.status(404).json({ message: 'Failed to update alert' });
      }
      
      // Return the updated alert with formatted threshold and type label
      res.json({
        ...updatedAlert,
        formattedThreshold: AlertService.formatThreshold(updatedAlert.alertType, Number(updatedAlert.threshold)),
        typeLabel: AlertService.getAlertTypeLabel(updatedAlert.alertType)
      });
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(400).json({ message: 'Invalid alert data', error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Delete alert
  app.delete('/api/alerts/:alertId', async (req, res) => {
    try {
      const alertId = req.params.alertId;
      if (!alertId) {
        return res.status(400).json({ message: 'Invalid alert ID' });
      }
      
      // Get the default user first
      const defaultUser = await storage.getUserByUsername('demo') || 
        await storage.createUser({ username: 'demo', password: 'password' });
      
      // Check if alert exists
      const alert = await AlertModel.findById(alertId);
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      // Make sure this alert belongs to the current user
      if (alert.userId !== defaultUser.id) {
        return res.status(403).json({ message: 'Not authorized to delete this alert' });
      }
      
      await AlertModel.delete(alertId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({ message: 'Failed to delete alert' });
    }
  });

  // Check alerts (manual trigger for testing)
  app.post('/api/alerts/check', async (req, res) => {
    try {
      const results = await AlertService.checkAllAlerts();
      const triggeredAlerts = results.filter(result => result.triggered);
      
      res.json({
        totalChecked: results.length,
        triggered: triggeredAlerts.length,
        results
      });
    } catch (error) {
      console.error('Error checking alerts:', error);
      res.status(500).json({ message: 'Failed to check alerts' });
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
