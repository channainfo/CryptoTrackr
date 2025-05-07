import type { Express } from "express";
import { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { z } from "zod";
import {
  insertPortfolioSchema,
  insertTransactionSchema,
  insertAlertSchema,
  insertTokenSchema,
  updateTokenSchema,
  portfolioTokens,
  tokens,
  alerts,
  users,
  User,
} from "@shared/schema";
import { services } from "./services/cryptoApi";
import { HistoricalValueService } from "./services";
import { TaxCalculationModel } from "./models/TaxCalculationModel";
import { AlertModel } from "./models/AlertModel";
import { AlertService } from "./services/AlertService";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";
import learningRoutes from "./routes/learningRoutes";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import achievementRoutes from "./routes/achievementRoutes";
import { OpenAIService } from "./services/openai";
import { RiskAssessmentService } from "./services/riskAssessment";
import { authMiddleware, requireAuth } from "./middleware/auth";
import jwt from 'jsonwebtoken';

import { v4 as uuidv4 } from 'uuid';
import { adminTokens as adminTokensTable, type AdminToken } from '@shared/schema';

// Secret key for JWT signing - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'admin-auth-secret-key-change-this-in-production';
// Current token version - increment to invalidate all existing tokens
const CURRENT_TOKEN_VERSION = 1;

// Interface for JWT admin token payload
interface AdminTokenPayload {
  userId: string;
  isAdmin: boolean;
  tokenVersion: number;
  // Standard JWT fields
  iat?: number; // issued at
  exp?: number; // expiration time
}

// Function to create an admin JWT token (used in admin login endpoint)
const createAdminToken = async (userId: string) => {
  try {
    // Verify the user is an admin first
    const [userRecord] = await db.select({
        id: users.id,
        isAdmin: users.isAdmin
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!userRecord || !userRecord.isAdmin) {
      throw new Error("User is not an admin");
    }
    
    // Create token payload
    const payload: AdminTokenPayload = {
      userId: userId,
      isAdmin: true,
      tokenVersion: CURRENT_TOKEN_VERSION
    };
    
    // Sign the token with 1 hour expiration
    const token = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('JWT admin token created for user:', userId);
    
    return token;
  } catch (error) {
    console.error('Error creating admin token:', error);
    throw error;
  }
};
import { requireAdmin } from "./middleware/admin-auth";

// Utility function to calculate market sentiment based on market data
function calculateSentimentFromMarket(marketData: any[]) {
  // Default sentiment if no data
  if (!marketData || !marketData.length) {
    return {
      sentiment: {
        score: 50,
        mood: "neutral",
        change: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Calculate sentiment based on price changes of top coins
  const topCoins = marketData.slice(0, 10); // Top 10 coins

  // Calculate average 24h change
  const avgChange24h =
    topCoins.reduce((sum, coin) => {
      return sum + (parseFloat(coin.priceChange24h) || 0);
    }, 0) / topCoins.length;

  // Calculate average 7d change
  const avgChange7d =
    topCoins.reduce((sum, coin) => {
      return sum + (parseFloat(coin.priceChange7d) || 0);
    }, 0) / topCoins.length;

  // Bitcoin dominance factor (if BTC doing better than average, market is less fearful)
  const btcData = marketData.find((coin) => coin.symbol === "BTC");
  const btcDominanceFactor = btcData
    ? ((parseFloat(btcData.priceChange24h) || 0) - avgChange24h) * 0.1
    : 0;

  // Volume change factor
  const volumeFactor =
    topCoins.reduce((sum, coin) => {
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
  if (score < 25) mood = "extreme_fear";
  else if (score < 40) mood = "fear";
  else if (score < 60) mood = "neutral";
  else if (score < 80) mood = "greed";
  else mood = "extreme_greed";

  return {
    sentiment: {
      score,
      mood,
      change: Math.round(avgChange24h * 10) / 10, // Round to 1 decimal place
      timestamp: new Date().toISOString(),
    },
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply authentication middleware to all routes
  app.use(authMiddleware);

  // Register auth routes
  app.use("/api/auth", authRoutes);

  // Register learning routes
  app.use("/api/learning", learningRoutes);

  // Register achievement routes
  app.use("/api/achievements", achievementRoutes);
  
  // ADMIN AUTH ROUTES
  
  // Admin login - Creates and returns a new admin token
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      // Check for existing session (user must be authenticated)
      const user = (req as any).user;
      
      console.log('Admin login attempt:', { 
        user: user?.id,
        session: req.session 
      });
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin (directly query the database)
      // Only select the fields we need to avoid column not found errors
      const [userRecord] = await db.select({
          id: users.id,
          isAdmin: users.isAdmin
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      
      if (!userRecord || !userRecord.isAdmin) {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      // Create a new admin token
      const adminToken = await createAdminToken(user.id);
      
      // Return the admin token with expiry information
      return res.status(200).json({
        adminToken,
        expiresIn: 3600, // 1 hour in seconds
        message: "Admin login successful",
      });
    } catch (error) {
      console.error("Admin login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin logout - With JWT we don't need to invalidate tokens on the server
  // as they're stateless, but we can provide a response for the client to clear the token
  app.post("/api/admin/logout", async (req: Request, res: Response) => {
    try {
      // With JWT, we don't need to store or remove tokens on the server
      // The client should discard the token
      
      console.log('Admin logout request received');
      
      // Simply return success - client should remove the token from storage
      return res.status(200).json({
        message: "Admin logout successful",
        info: "JWT tokens are stateless - no server-side removal needed"
      });
    } catch (error) {
      console.error("Admin logout error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Admin token validation function - used by all admin endpoints 
  const validateAdminToken = async (req: Request, res: Response, next: Function) => {
    try {
      // Get the token from the Authorization header
      const authHeader = req.headers.authorization;
      
      console.log('Admin authorization check:', { 
        hasAuthHeader: !!authHeader,
        headerValue: authHeader ? `${authHeader.substring(0, 10)}...` : undefined,
        path: req.path
      });
      
      if (!authHeader || !authHeader.startsWith('AdminToken ')) {
        return res.status(401).json({ 
          message: 'Admin authentication required',
          code: 'ADMIN_AUTH_REQUIRED' 
        });
      }
      
      // Extract the token from the header
      const token = authHeader.substring('AdminToken '.length);
      
      // Try validating as JWT token
      let isValidJwt = false;
      let jwtPayload: AdminTokenPayload | null = null;
      
      try {
        jwtPayload = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
        isValidJwt = true;
      } catch (jwtError: any) {
        console.log('JWT verification failed:', jwtError.message);
        // We'll handle this below
      }
      
      // If JWT validation succeeded
      if (isValidJwt && jwtPayload) {
        // Check if the token version is current
        if (jwtPayload.tokenVersion !== CURRENT_TOKEN_VERSION) {
          console.log('Token version mismatch:', jwtPayload.tokenVersion, 'vs', CURRENT_TOKEN_VERSION);
          return res.status(401).json({ 
            message: 'Token version expired, please login again',
            code: 'TOKEN_VERSION_INVALID'
          });
        }
        
        // Verify this is an admin token
        if (!jwtPayload.isAdmin) {
          console.log('Non-admin token used for admin endpoint');
          return res.status(403).json({ 
            message: 'Admin privileges required',
            code: 'NOT_ADMIN'
          });
        }
        
        // Double check that the user still has admin privileges
        // This ensures the user hasn't lost admin rights since token issuance
        const [userRecord] = await db.select({
            id: users.id, 
            isAdmin: users.isAdmin
          })
          .from(users)
          .where(eq(users.id, jwtPayload.userId))
          .limit(1);
        
        if (!userRecord || !userRecord.isAdmin) {
          console.log('User no longer has admin privileges:', jwtPayload.userId);
          return res.status(403).json({ 
            message: 'Admin privileges required',
            code: 'NOT_ADMIN'
          });
        }
        
        // Add the decoded user info to the request for downstream middleware/routes
        (req as any).adminUser = {
          userId: jwtPayload.userId,
          isAdmin: true
        };
        
        console.log('JWT admin token validated for user:', jwtPayload.userId);
        
        // JWT validated, proceed to next middleware
        return next();
      }
      
      // If we're here, JWT validation failed - try legacy token format
      console.log('Trying legacy token format');
      
      if (token.includes(':')) {
        const [userId] = token.split(':');
        console.log('Extracted userId from legacy token:', userId);
        
        // Check if user is an admin
        const [userRecord] = await db.select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (userRecord && userRecord.isAdmin) {
          // Legacy token is valid
          (req as any).adminUser = {
            userId: userId,
            isAdmin: true
          };
          
          console.log('Legacy admin token validated for user:', userId);
          
          // Replace with new JWT token in next response
          (req as any).refreshAdminToken = true;
          
          // Skip to next middleware since we've validated the token
          return next();
        }
      }
      
      // If we get here, neither JWT nor legacy token validation worked
      return res.status(401).json({ 
        message: 'Invalid admin token',
        code: 'TOKEN_INVALID'
      });
    } catch (error) {
      console.error("Admin token validation error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  // Register custom admin routes
  app.use("/api/admin", validateAdminToken, adminRoutes);

  // Set up API routes
  app.get("/api/crypto/market", async (req, res) => {
    try {
      const marketData = await services.getMarketData();
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Get market sentiment data
  app.get("/api/crypto/sentiment", async (req, res) => {
    try {
      const sentimentData = await services.getSentimentData();
      res.json(sentimentData);
    } catch (error) {
      console.error("Error fetching sentiment data:", error);

      // Use fallback data based on market trends if API fails
      const marketData = await services.getMarketData();
      const fallbackSentiment = calculateSentimentFromMarket(marketData);
      res.json(fallbackSentiment);
    }
  });

  // Risk assessment for a portfolio
  app.get(
    "/api/portfolios/:portfolioId/risk-assessment",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Get portfolio details
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        // Verify the portfolio belongs to the authenticated user
        if (portfolio.userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to access this portfolio" });
        }

        // Get portfolio assets
        const assets = await storage.getPortfolioAssetsById(portfolioId);

        // Get market data for context
        const marketData = await services.getMarketData();

        // Generate risk assessment
        const riskAssessment = await RiskAssessmentService.analyzePortfolioRisk(
          portfolio,
          assets as any[], // Type cast to handle schema differences
          marketData,
        );

        res.json(riskAssessment);
      } catch (error) {
        console.error("Error generating risk assessment:", error);
        res.status(500).json({ message: "Failed to generate risk assessment" });
      }
    },
  );

  // Risk assessment for a specific token
  app.get(
    "/api/crypto/tokens/:symbol/risk-assessment",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const symbol = req.params.symbol;
        if (!symbol) {
          return res.status(400).json({ message: "Invalid token symbol" });
        }

        // Get the authenticated user - not checking ownership here since it's based on the token symbol
        // but still require authentication to get risk assessment
        const user = (req as any).user;

        // Get market data for context
        const marketData = await services.getMarketData();

        // Find token info
        const tokenData = marketData.find(
          (coin) => coin.symbol.toLowerCase() === symbol.toLowerCase(),
        );

        if (!tokenData) {
          return res.status(404).json({ message: "Token not found" });
        }

        // Generate risk assessment
        const riskAssessment =
          await RiskAssessmentService.analyzeSingleTokenRisk(
            symbol,
            tokenData.name,
            marketData,
          );

        res.json(riskAssessment);
      } catch (error) {
        console.error("Error generating token risk assessment:", error);
        res.status(500).json({ message: "Failed to generate risk assessment" });
      }
    },
  );

  // Get personalized crypto news based on portfolio
  app.get(
    "/api/crypto/news",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Fetch news articles
        const newsArticles = await OpenAIService.fetchCryptoNews();

        // Get the authenticated user
        const user = (req as any).user;

        // Get portfolio tokens for personalization
        let portfolioTokens: Array<{ symbol: string; name: string }> = [];

        // Get user's portfolios
        const portfolios = await storage.getUserPortfolios(user.id);

        // Get all tokens from active portfolios (non-watchlist)
        for (const portfolio of portfolios) {
          if (portfolio.isWatchlist) continue;

          const assets = await storage.getPortfolioAssetsById(portfolio.id);
          if (assets && assets.length > 0) {
            // Add portfolio tokens
            portfolioTokens = portfolioTokens.concat(
              assets.map((asset) => ({
                symbol: asset.symbol,
                name: asset.name,
              })),
            );
          }
        }

        // Deduplicate tokens by symbol
        const uniqueTokens = Array.from(
          new Map(
            portfolioTokens.map((token) => [token.symbol, token]),
          ).values(),
        );

        // Get personalized news recommendations
        const recommendations =
          await OpenAIService.getPersonalizedNewsRecommendations(
            uniqueTokens,
            newsArticles,
            4, // Limit to 4 articles
          );

        res.json(recommendations);
      } catch (error) {
        console.error("Error fetching personalized news:", error);
        res.status(500).json({
          articles: [],
          portfolioInsight: "Unable to fetch personalized news at this time.",
        });
      }
    },
  );

  // Get all available tokens
  app.get("/api/crypto/tokens", async (req, res) => {
    try {
      // Get tokens from database, or fetch from market data if needed
      let tokensList = await db.select().from(tokens);

      // If no tokens in database, get them from market data
      if (!tokensList.length) {
        const marketData = await services.getMarketData();
        // Use the market data as tokens list
        const tokensToInsert = marketData.map((coin) => ({
          id: coin.id,
          symbol: coin.symbol,
          name: coin.name,
          description: null,
          tokenRank: coin.market_cap_rank || null,
          imageUrl: coin.image || null,
          chain: "default", // Default chain
          contractAddress: null,
          decimals: 18, // Default for most tokens
          totalSupply: null,
          maxSupply: null,
          isVerified: true,
          launchedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        // Store the tokens in the database for future use
        if (tokensToInsert.length) {
          try {
            await db.insert(tokens).values(tokensToInsert);
            tokensList = await db.select().from(tokens);
          } catch (insertError) {
            console.error("Error inserting tokens:", insertError);
            // If there's an error inserting, still return the market data
            tokensList = tokensToInsert;
          }
        }
      }

      res.json(tokensList);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      res.status(500).json({ message: "Failed to fetch tokens data" });
    }
  });

  // Get portfolio assets (all portfolios)
  app.get(
    "/api/portfolio",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user
        const user = (req as any).user;

        // Get all portfolios for the authenticated user
        const portfolios = await storage.getUserPortfolios(user.id);

        // Get all assets from all portfolios belonging to the user
        let allAssets: any[] = [];

        for (const portfolio of portfolios) {
          const assets = await storage.getPortfolioAssetsById(portfolio.id);
          allAssets = allAssets.concat(assets);
        }

        res.json(allAssets);
      } catch (error) {
        console.error("Error fetching portfolio assets:", error);
        res.status(500).json({ message: "Failed to fetch portfolio data" });
      }
    },
  );

  // This endpoint has been moved below with proper auth middleware

  // Add asset to portfolio (default portfolio)
  app.post(
    "/api/portfolio",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user
        const user = (req as any).user;

        // We'll automatically handle the userId so user doesn't have to provide it
        const assetData = {
          symbol: req.body.symbol,
          name: req.body.name,
          quantity: req.body.quantity,
          currentPrice: req.body.currentPrice,
          priceChangePercentage24h: req.body.priceChangePercentage24h || 0,
          userId: user.id,
          value: req.body.quantity * req.body.currentPrice,
        };

        const asset = await storage.addPortfolioAsset(assetData);
        res.status(201).json(asset);
      } catch (error) {
        console.error("Error adding portfolio asset:", error);
        res.status(400).json({ message: "Invalid portfolio data" });
      }
    },
  );

  // Add asset to a specific portfolio
  app.post(
    "/api/portfolios/:portfolioId/assets",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        // Create asset with specific portfolio ID
        const assetData = {
          portfolioId: portfolioId,
          symbol: req.body.symbol,
          name: req.body.name,
          quantity: req.body.quantity,
          currentPrice: req.body.currentPrice,
          priceChangePercentage24h: req.body.priceChangePercentage24h || 0,
          userId: user.id,
          value: req.body.quantity * req.body.currentPrice,
        };

        const asset = await storage.addPortfolioAsset(assetData);
        res.status(201).json(asset);
      } catch (error) {
        console.error("Error adding portfolio asset:", error);
        res.status(400).json({ message: "Invalid portfolio data" });
      }
    },
  );

  // Remove asset from portfolio (default portfolio)
  app.delete(
    "/api/portfolio/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = req.params.id;
        if (!id) {
          return res.status(400).json({ message: "Invalid asset ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Get the asset to verify ownership
        const asset = await storage.getPortfolioAsset(id);
        if (!asset) {
          return res.status(404).json({ message: "Asset not found" });
        }

        // Verify the asset belongs to the authenticated user
        if (asset.userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to remove this asset" });
        }

        await storage.removePortfolioAsset(id);
        res.status(204).send();
      } catch (error) {
        console.error("Error removing portfolio asset:", error);
        res.status(500).json({ message: "Failed to remove asset" });
      }
    },
  );

  // Remove asset from specific portfolio
  app.delete(
    "/api/portfolios/:portfolioId/assets/:assetId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { portfolioId, assetId } = req.params;
        if (!portfolioId || !assetId) {
          return res
            .status(400)
            .json({ message: "Invalid portfolio or asset ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        // Check if asset exists and belongs to the specified portfolio
        const asset = await storage.getPortfolioAsset(assetId);
        if (!asset) {
          return res.status(404).json({ message: "Asset not found" });
        }

        // Additional validation to ensure the asset belongs to the authenticated user
        if (asset.userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to remove this asset" });
        }

        await storage.removePortfolioAsset(assetId);
        res.status(204).send();
      } catch (error) {
        console.error("Error removing portfolio asset:", error);
        res.status(500).json({ message: "Failed to remove asset" });
      }
    },
  );

  // Update a portfolio asset (for partial sells)
  app.patch(
    "/api/portfolios/:portfolioId/assets/:assetId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { portfolioId, assetId } = req.params;
        const { quantity } = req.body;

        if (
          quantity === undefined ||
          isNaN(parseFloat(quantity)) ||
          parseFloat(quantity) <= 0
        ) {
          res.status(400).json({ message: "Invalid quantity" });
          return;
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        // Check if asset exists and belongs to the specified portfolio
        const asset = await storage.getPortfolioAsset(assetId);
        if (!asset) {
          return res.status(404).json({ message: "Asset not found" });
        }

        // Additional validation to ensure the asset belongs to the authenticated user
        if (asset.userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to update this asset" });
        }

        const updatedAsset = await storage.updatePortfolioAsset(assetId, {
          quantity: parseFloat(quantity),
        });

        if (!updatedAsset) {
          return res.status(404).json({ message: "Asset not found" });
        }

        res.status(200).json(updatedAsset);
      } catch (error) {
        console.error("Error updating portfolio asset:", error);
        res
          .status(500)
          .json({ message: "Failed to update asset in portfolio" });
      }
    },
  );

  // Get user portfolios
  app.get(
    "/api/portfolios",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user
        const user = (req as any).user;

        // Get filter parameters
        const type = req.query.type as string;

        // Get all portfolios for the authenticated user
        let portfolios = await storage.getUserPortfolios(user.id);

        // Print all portfolios and their isWatchlist value for debugging
        console.log("All portfolios before filtering:");
        portfolios.forEach((p) => {
          console.log(
            `Portfolio ${p.name}: isWatchlist=${p.isWatchlist}, type=${typeof p.isWatchlist}`,
          );
        });

        // No longer filtering on the server side - just log the request type
        if (type === "watchlist") {
          console.log("Watchlist filter requested, but sending all portfolios");
        } else if (type === "standard") {
          console.log("Standard filter requested, but sending all portfolios");
        } else {
          console.log("No filter specified, sending all portfolios");
        }

        // Return all portfolios and let the client filter them

        console.log(
          `After filtering for ${type || "all"}, found ${portfolios.length} portfolios`,
        );
        portfolios.forEach((p) => {
          console.log(
            `- ${p.name} (id: ${p.id}, isWatchlist: ${p.isWatchlist})`,
          );
        });

        res.json(portfolios);
      } catch (error) {
        console.error("Error fetching user portfolios:", error);
        res.status(500).json({ message: "Failed to fetch portfolios" });
      }
    },
  );

  // Get portfolio by ID
  app.get(
    "/api/portfolios/:portfolioId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get authenticated user
        const user = (req as any).user;

        const portfolio = await storage.getPortfolioById(portfolioId);

        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        res.json(portfolio);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        res.status(500).json({ message: "Failed to fetch portfolio" });
      }
    },
  );

  // Get portfolio summary
  app.get(
    "/api/portfolios/:portfolioId/summary",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        // Get portfolio assets
        const assets = await storage.getPortfolioAssetsById(portfolioId);

        // Calculate summary data
        const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
        const assetCount = assets.length;

        res.json({
          id: portfolioId,
          totalValue,
          assetCount,
        });
      } catch (error) {
        console.error("Error fetching portfolio summary:", error);
        res.status(500).json({ message: "Failed to fetch portfolio summary" });
      }
    },
  );

  // Get assets for a specific portfolio
  app.get(
    "/api/portfolios/:portfolioId/assets",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get authenticated user
        const user = (req as any).user;

        // Verify the portfolio belongs to the authenticated user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        const assets = await storage.getPortfolioAssetsById(portfolioId);
        res.json(assets);
      } catch (error) {
        console.error("Error fetching portfolio assets:", error);
        res.status(500).json({ message: "Failed to fetch portfolio assets" });
      }
    },
  );

  // Get portfolio performance data
  app.get(
    "/api/portfolios/:portfolioId/performance",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        const period =
          (req.query.period as
            | "1D"
            | "1W"
            | "1M"
            | "3M"
            | "6M"
            | "1Y"
            | "ALL") || "1M";

        // Since HistoricalValueService might not be initialized,
        // we'll return a sample performance data structure
        const performance = {
          startDate: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          endDate: new Date().toISOString(),
          startValue: 0,
          endValue: 0,
          changeValue: 0,
          changePercent: 0,
          historical: [],
        };

        res.json(performance);
      } catch (error) {
        console.error("Error fetching portfolio performance:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch portfolio performance data" });
      }
    },
  );

  // Create new portfolio
  app.post(
    "/api/portfolios",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user
        const user = (req as any).user;

        console.log(
          "Creating portfolio with data:",
          JSON.stringify(req.body, null, 2),
        );
        console.log("Is watchlist flag in request:", req.body.isWatchlist);
        console.log("Request body type:", typeof req.body);
        console.log("isWatchlist type:", typeof req.body.isWatchlist);

        // DEBUGGING: Force isWatchlist to true if the tab is 'watchlist'
        // This checks req.body.activeTab and forces isWatchlist accordingly
        let isWatchlist = false;

        if (req.body.activeTab === "watchlist") {
          console.log("Creating from watchlist tab, forcing isWatchlist=true");
          isWatchlist = true;
        } else {
          isWatchlist =
            req.body.isWatchlist === true || req.body.isWatchlist === "true";
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
          userId: user.id,
        };

        // If this portfolio is set as default, update any existing default portfolios
        if (portfolioData.isDefault) {
          const userPortfolios = await storage.getUserPortfolios(user.id);
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
        console.error("Error creating portfolio:", error);
        res.status(400).json({ message: "Invalid portfolio data" });
      }
    },
  );

  // Update portfolio
  app.patch(
    "/api/portfolios/:portfolioId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        const updateData = {
          name: req.body.name,
          description: req.body.description,
          isDefault: req.body.isDefault,
          isWatchlist: req.body.isWatchlist,
        };

        // If this portfolio is set as default, update any existing default portfolios
        if (updateData.isDefault) {
          const userPortfolios = await storage.getUserPortfolios(user.id);
          for (const p of userPortfolios) {
            if (p.id !== portfolioId && p.isDefault) {
              // Update this portfolio to not be the default
              await storage.updatePortfolio(p.id, { isDefault: false });
            }
          }
        }

        const updatedPortfolio = await storage.updatePortfolio(
          portfolioId,
          updateData,
        );
        res.json(updatedPortfolio);
      } catch (error) {
        console.error("Error updating portfolio:", error);
        res.status(400).json({ message: "Invalid portfolio data" });
      }
    },
  );

  // Delete portfolio
  app.delete(
    "/api/portfolios/:portfolioId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        // Make sure we don't delete the only portfolio
        const userPortfolios = await storage.getUserPortfolios(user.id);
        if (userPortfolios.length <= 1) {
          return res
            .status(400)
            .json({ message: "Cannot delete the only portfolio" });
        }

        // Make sure another portfolio is set as default if this one is default
        if (portfolio.isDefault) {
          const otherPortfolio = userPortfolios.find(
            (p) => p.id !== portfolioId,
          );
          if (otherPortfolio) {
            await storage.updatePortfolio(otherPortfolio.id, {
              isDefault: true,
            });
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
        console.error("Error deleting portfolio:", error);
        res.status(500).json({ message: "Failed to delete portfolio" });
      }
    },
  );

  // Get transactions
  app.get(
    "/api/transactions",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user
        const user = (req as any).user;

        // Get transactions for the authenticated user
        const transactions = await storage.getTransactions(user.id);
        res.json(transactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Failed to fetch transactions" });
      }
    },
  );

  // Add transaction
  app.post(
    "/api/transactions",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user
        const user = (req as any).user;

        const txData = {
          cryptoName: req.body.cryptoName,
          cryptoSymbol: req.body.cryptoSymbol,
          type: req.body.type || "buy",
          quantity: req.body.quantity,
          price: req.body.price,
          value: req.body.value || req.body.quantity * req.body.price,
          userId: user.id,
          timestamp: req.body.timestamp || new Date().toISOString(),
        };

        const transaction = await storage.addTransaction(txData);
        res.status(201).json(transaction);
      } catch (error) {
        console.error("Error adding transaction:", error);
        res.status(400).json({ message: "Invalid transaction data" });
      }
    },
  );

  // Record historical values for all portfolios and tokens
  app.post(
    "/api/history/record",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user - in a real app only admins should be able to perform this operation
        const user = (req as any).user;

        // For now, we'll allow any authenticated user to do this
        const result = await HistoricalValueService.recordTodayValues();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error recording historical values:", error);
        res.status(500).json({ message: "Failed to record historical values" });
      }
    },
  );

  // Record historical values for specific portfolio
  app.post(
    "/api/portfolios/:portfolioId/history/record",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Verify the portfolio belongs to the user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(403).json({
            message: "Not authorized to record history for this portfolio",
          });
        }

        const result =
          await HistoricalValueService.recordPortfolioValue(portfolioId);
        res.status(200).json(result);
      } catch (error) {
        console.error("Error recording portfolio historical values:", error);
        res
          .status(500)
          .json({ message: "Failed to record portfolio historical values" });
      }
    },
  );

  // Get portfolio performance data
  app.get(
    "/api/portfolios/:portfolioId/performance",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioId = req.params.portfolioId;
        if (!portfolioId) {
          return res.status(400).json({ message: "Invalid portfolio ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if portfolio exists and belongs to user
        const portfolio = await storage.getPortfolioById(portfolioId);
        if (!portfolio || portfolio.userId !== user.id) {
          return res.status(404).json({ message: "Portfolio not found" });
        }

        const period =
          (req.query.period as
            | "1D"
            | "1W"
            | "1M"
            | "3M"
            | "6M"
            | "1Y"
            | "ALL") || "1M";

        try {
          const performance =
            await HistoricalValueService.getPortfolioPerformance(
              portfolioId,
              period,
            );

          if (performance) {
            return res.json(performance);
          }
        } catch (e) {
          console.log(
            "No historical performance data found, using generated data",
          );
        }

        // Generate sample performance data if no historical data exists
        const totalValue = 10000; // Default value
        const historical = [];
        const days =
          period === "1D"
            ? 24
            : period === "1W"
              ? 7
              : period === "1M"
                ? 30
                : period === "3M"
                  ? 90
                  : period === "6M"
                    ? 180
                    : period === "1Y"
                      ? 365
                      : 1095;

        const now = new Date();
        const startDate = new Date();

        if (period === "1D") {
          startDate.setHours(startDate.getHours() - days);

          for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setHours(date.getHours() + i);

            const volatility = 0.002; // 0.2% hourly volatility
            const randomChange =
              (Math.random() - 0.45) * volatility * totalValue;
            const value = totalValue + randomChange * i;

            historical.push({
              date: date.toISOString(),
              totalValue: value.toFixed(2),
              totalInvested: (value * 0.8).toFixed(2), // 20% profit
              profitLoss: (value * 0.2).toFixed(2),
            });
          }
        } else {
          startDate.setDate(startDate.getDate() - days);

          for (let i = 0; i <= days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);

            const volatility = 0.01; // 1% daily volatility
            const randomChange =
              (Math.random() - 0.45) * volatility * totalValue;
            const value = totalValue + randomChange * i;

            historical.push({
              date: date.toISOString(),
              totalValue: value.toFixed(2),
              totalInvested: (value * 0.8).toFixed(2), // 20% profit
              profitLoss: (value * 0.2).toFixed(2),
            });
          }
        }

        const performance = {
          startDate: historical[0].date,
          endDate: historical[historical.length - 1].date,
          startValue: parseFloat(historical[0].totalValue),
          endValue: parseFloat(historical[historical.length - 1].totalValue),
          changeValue:
            parseFloat(historical[historical.length - 1].totalValue) -
            parseFloat(historical[0].totalValue),
          changePercent:
            (parseFloat(historical[historical.length - 1].totalValue) /
              parseFloat(historical[0].totalValue) -
              1) *
            100,
          historical,
        };

        res.json(performance);
      } catch (error) {
        console.error("Error fetching portfolio performance:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch portfolio performance data" });
      }
    },
  );

  // Get portfolio token details
  app.get(
    "/api/portfolio-tokens/:portfolioTokenId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioTokenId = req.params.portfolioTokenId;
        if (!portfolioTokenId) {
          return res
            .status(400)
            .json({ message: "Invalid portfolio token ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

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
            tokenImageUrl: tokens.imageUrl,
          })
          .from(portfolioTokens)
          .leftJoin(tokens, eq(portfolioTokens.tokenId, tokens.id))
          .where(eq(portfolioTokens.id, portfolioTokenId))
          .limit(1);

        if (!token[0]) {
          return res.status(404).json({ message: "Portfolio token not found" });
        }

        // Verify the token belongs to the authenticated user
        if (token[0].userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to access this token" });
        }

        res.json(token[0]);
      } catch (error) {
        console.error("Error fetching portfolio token:", error);
        res.status(500).json({ message: "Failed to fetch portfolio token" });
      }
    },
  );

  // Get token performance data
  app.get(
    "/api/portfolio-tokens/:portfolioTokenId/performance",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const portfolioTokenId = req.params.portfolioTokenId;
        if (!portfolioTokenId) {
          return res
            .status(400)
            .json({ message: "Invalid portfolio token ID" });
        }

        // Get authenticated user
        const user = (req as any).user;

        // Verify ownership
        const token = await db
          .select({
            userId: portfolioTokens.userId,
          })
          .from(portfolioTokens)
          .where(eq(portfolioTokens.id, portfolioTokenId))
          .limit(1);

        if (!token[0]) {
          return res.status(404).json({ message: "Portfolio token not found" });
        }

        // Verify the token belongs to the authenticated user
        if (token[0].userId !== user.id) {
          return res.status(403).json({
            message: "Not authorized to access this token performance data",
          });
        }

        const period =
          (req.query.period as
            | "1D"
            | "1W"
            | "1M"
            | "3M"
            | "6M"
            | "1Y"
            | "ALL") || "1M";
        const performance = await HistoricalValueService.getTokenPerformance(
          portfolioTokenId,
          period,
        );

        if (!performance) {
          return res
            .status(404)
            .json({ message: "Token performance data not found" });
        }

        res.json(performance);
      } catch (error) {
        console.error("Error fetching token performance:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch token performance data" });
      }
    },
  );

  // Tax calculation endpoints
  app.get(
    "/api/tax/calculate",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get query parameters
        const year =
          (req.query.year as string) || new Date().getFullYear().toString();
        const method = (req.query.method as "fifo" | "lifo" | "hifo") || "fifo";
        const income = (req.query.income as string) || "50000";
        const status =
          (req.query.status as "single" | "joint" | "separate" | "head") ||
          "single";

        // Get the authenticated user
        const user = (req as any).user;

        try {
          // Try to calculate using real transaction data
          const taxData = await TaxCalculationModel.calculateTaxes(
            user.id,
            year,
            method,
            income,
            status,
          );

          res.json(taxData);
        } catch (error) {
          console.error("Error calculating taxes:", error);
          // Return empty data properly scoped to this user
          res.json({
            transactions: [],
            summary: {
              taxYear: year,
              totalTransactions: 0,
              shortTermGains: 0,
              longTermGains: 0,
              totalGains: 0,
              totalTaxableAmount: 0,
              estimatedTax: 0,
              costBasis: 0,
              proceeds: 0,
              byAsset: {},
            },
          });
        }
      } catch (error) {
        console.error("Error calculating tax data:", error);
        res.status(500).json({ message: "Failed to calculate tax data" });
      }
    },
  );

  // Alert endpoints
  // Get all alerts for a user
  app.get("/api/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user
      const user = (req as any).user;

      const alerts = await AlertModel.findWithTokenDetailsByUserId(user.id);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  // Get alert by ID
  app.get(
    "/api/alerts/:alertId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const alertId = req.params.alertId;
        if (!alertId) {
          return res.status(400).json({ message: "Invalid alert ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        const alert = await AlertModel.findById(alertId);
        if (!alert) {
          return res.status(404).json({ message: "Alert not found" });
        }

        // Verify this alert belongs to the current user
        if (alert.userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to view this alert" });
        }

        res.json(alert);
      } catch (error) {
        console.error("Error fetching alert:", error);
        res.status(500).json({ message: "Failed to fetch alert" });
      }
    },
  );

  // Create new alert
  app.post("/api/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      // Get the authenticated user
      const user = (req as any).user;

      // Ensure threshold is a string
      const requestData = {
        ...req.body,
        userId: user.id,
        // Convert threshold to string if it's a number
        threshold:
          typeof req.body.threshold === "number"
            ? req.body.threshold.toString()
            : req.body.threshold,
      };

      // Validate request body using Zod schema
      const validatedData = insertAlertSchema.parse(requestData);

      const alert = await AlertModel.create(validatedData);

      // Return the created alert with formatted threshold and type label
      res.status(201).json({
        ...alert,
        formattedThreshold: AlertService.formatThreshold(
          alert.alertType,
          Number(alert.threshold),
        ),
        typeLabel: AlertService.getAlertTypeLabel(alert.alertType),
      });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(400).json({
        message: "Invalid alert data",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Update alert
  app.patch(
    "/api/alerts/:alertId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const alertId = req.params.alertId;
        if (!alertId) {
          return res.status(400).json({ message: "Invalid alert ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if alert exists
        const alert = await AlertModel.findById(alertId);
        if (!alert) {
          return res.status(404).json({ message: "Alert not found" });
        }

        // Make sure this alert belongs to the current user
        if (alert.userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to update this alert" });
        }

        // Update data, ensuring threshold is string
        const updateData = {
          alertType: req.body.alertType,
          threshold:
            typeof req.body.threshold === "number"
              ? req.body.threshold.toString()
              : req.body.threshold,
          status: req.body.status,
          notificationMethod: req.body.notificationMethod,
          name: req.body.name,
          description: req.body.description,
        };

        const updatedAlert = await AlertModel.update(alertId, updateData);

        // Handle the case where update might fail or return undefined
        if (!updatedAlert) {
          return res.status(404).json({ message: "Failed to update alert" });
        }

        // Return the updated alert with formatted threshold and type label
        res.json({
          ...updatedAlert,
          formattedThreshold: AlertService.formatThreshold(
            updatedAlert.alertType,
            Number(updatedAlert.threshold),
          ),
          typeLabel: AlertService.getAlertTypeLabel(updatedAlert.alertType),
        });
      } catch (error) {
        console.error("Error updating alert:", error);
        res.status(400).json({
          message: "Invalid alert data",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Delete alert
  app.delete(
    "/api/alerts/:alertId",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const alertId = req.params.alertId;
        if (!alertId) {
          return res.status(400).json({ message: "Invalid alert ID" });
        }

        // Get the authenticated user
        const user = (req as any).user;

        // Check if alert exists
        const alert = await AlertModel.findById(alertId);
        if (!alert) {
          return res.status(404).json({ message: "Alert not found" });
        }

        // Make sure this alert belongs to the current user
        if (alert.userId !== user.id) {
          return res
            .status(403)
            .json({ message: "Not authorized to delete this alert" });
        }

        await AlertModel.delete(alertId);
        res.status(204).send();
      } catch (error) {
        console.error("Error deleting alert:", error);
        res.status(500).json({ message: "Failed to delete alert" });
      }
    },
  );

  // Check alerts (manual trigger for testing)
  app.post(
    "/api/alerts/check",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Get the authenticated user - only admins should be able to trigger alert checks
        const user = (req as any).user;

        // In a real production environment, we should check if the user is an admin
        // For now we'll allow any authenticated user to do this
        const results = await AlertService.checkAllAlerts();
        const triggeredAlerts = results.filter((result) => result.triggered);

        res.json({
          totalChecked: results.length,
          triggered: triggeredAlerts.length,
          results,
        });
      } catch (error) {
        console.error("Error checking alerts:", error);
        res.status(500).json({ message: "Failed to check alerts" });
      }
    },
  );

  // Token Management API Endpoints

  // Get all tokens (admin)
  app.get(
    "/api/admin/tokens",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const allTokens = await db.query.tokens.findMany({
          orderBy: (tokens, { desc }) => [desc(tokens.createdAt)],
        });

        res.json(allTokens);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        res.status(500).json({ message: "Failed to fetch tokens" });
      }
    },
  );

  // Create new token (admin)
  app.post(
    "/api/admin/tokens",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Validate token data
        const tokenData = insertTokenSchema.parse(req.body);

        // Check if token already exists
        const existingToken = await db.query.tokens.findFirst({
          where: (tokens, { and, eq }) =>
            and(
              eq(tokens.symbol, tokenData.symbol),
              eq(tokens.chain, tokenData.chain),
            ),
        });

        if (existingToken) {
          return res.status(409).json({
            message: "Token already exists",
            token: existingToken,
          });
        }

        // Create the token
        const [newToken] = await db
          .insert(tokens)
          .values({
            ...tokenData,
            isVerified: true, // Admin-created tokens are verified by default
          })
          .returning();

        res.status(201).json(newToken);
      } catch (error) {
        console.error("Error creating token:", error);
        res.status(400).json({
          message: "Failed to create token",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Update token (admin)
  app.put(
    "/api/admin/tokens/:id",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Validate token data
        const tokenData = updateTokenSchema.parse(req.body);

        // Check if token exists
        const existingToken = await db.query.tokens.findFirst({
          where: (tokens, { eq }) => eq(tokens.id, id),
        });

        if (!existingToken) {
          return res.status(404).json({ message: "Token not found" });
        }

        // Update the token
        const [updatedToken] = await db
          .update(tokens)
          .set(tokenData)
          .where(eq(tokens.id, id))
          .returning();

        res.json(updatedToken);
      } catch (error) {
        console.error("Error updating token:", error);
        res.status(400).json({
          message: "Failed to update token",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Delete token (admin)
  app.delete(
    "/api/admin/tokens/:id",
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Check if token exists
        const existingToken = await db.query.tokens.findFirst({
          where: (tokens, { eq }) => eq(tokens.id, id),
        });

        if (!existingToken) {
          return res.status(404).json({ message: "Token not found" });
        }

        // Check if token is being used in portfolios
        const portfolioUsage = await db.query.portfolioTokens.findMany({
          where: (portfolioTokens, { eq }) => eq(portfolioTokens.tokenId, id),
        });

        if (portfolioUsage.length > 0) {
          return res.status(400).json({
            message: "Cannot delete token that is in use in portfolios",
            usageCount: portfolioUsage.length,
          });
        }

        // Delete the token
        await db.delete(tokens).where(eq(tokens.id, id));

        res.status(204).send();
      } catch (error) {
        console.error("Error deleting token:", error);
        res.status(500).json({ message: "Failed to delete token" });
      }
    },
  );

  // Import token (available to all authenticated users)
  app.post(
    "/api/tokens/import",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        // Validate token data
        const tokenData = insertTokenSchema.parse(req.body);

        // Check if token already exists
        const existingToken = await db.query.tokens.findFirst({
          where: (tokens, { and, eq }) =>
            and(
              eq(tokens.symbol, tokenData.symbol),
              eq(tokens.chain, tokenData.chain),
            ),
        });

        if (existingToken) {
          return res.status(409).json({
            message: "Token already exists",
            token: existingToken,
          });
        }

        // Create the token (user imported tokens are not verified by default)
        const [newToken] = await db
          .insert(tokens)
          .values({
            ...tokenData,
            isVerified: false,
          })
          .returning();

        res.status(201).json(newToken);
      } catch (error) {
        console.error("Error importing token:", error);
        res.status(400).json({
          message: "Failed to import token",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const httpServer = createServer(app);

  return httpServer;
}
