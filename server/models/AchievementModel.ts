import { db } from "../db";
import { 
  achievements, 
  insertAchievementSchema, 
  achievementTypeEnum, 
  users, 
  portfolios, 
  portfolioTokens, 
  transactions,
  userLearningProgress,
  learningModules,
  type Achievement,
  type InsertAchievement
} from "@shared/schema";
import { eq, and, sum, count, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

interface PortfolioMetrics {
  totalValue: number;
  assetCount: number;
  diversificationScore: number;
  profitLoss: number;
  profitLossPercent: number;
  tradingVolume: number;
  transactionCount: number;
  holdingPeriod: number;
}

interface LearningMetrics {
  completedModules: number;
  quizzesTaken: number;
  totalScore: number;
}

export class AchievementModel {
  
  /**
   * Initializes default achievements for a new user
   */
  static async initializeAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Default achievement definitions
      const defaultAchievements: z.infer<typeof insertAchievementSchema>[] = [
        {
          userId,
          type: 'investment',
          title: 'First Investment',
          description: 'Made your first cryptocurrency investment.',
          icon: 'dollar-sign',
          earned: false,
          progress: 0,
          maxProgress: 1
        },
        {
          userId,
          type: 'diversification',
          title: 'Diversified Portfolio',
          description: 'Added 5 different cryptocurrencies to your portfolio.',
          icon: 'pie-chart',
          earned: false,
          progress: 0,
          maxProgress: 5
        },
        {
          userId,
          type: 'portfolio_value',
          title: 'Elite Investor',
          description: 'Achieved a portfolio value of over $100,000.',
          icon: 'star',
          earned: false,
          progress: 0,
          maxProgress: 100
        },
        {
          userId,
          type: 'trading_volume',
          title: 'Trading Pro',
          description: 'Reached $50,000 in trading volume.',
          icon: 'refresh-cw',
          earned: false,
          progress: 0,
          maxProgress: 100
        },
        {
          userId,
          type: 'learning',
          title: 'Crypto Learner',
          description: 'Completed 3 learning modules.',
          icon: 'book-open',
          earned: false,
          progress: 0,
          maxProgress: 3
        },
        {
          userId,
          type: 'transaction_count',
          title: 'Active Trader',
          description: 'Completed 10 cryptocurrency transactions.',
          icon: 'repeat',
          earned: false,
          progress: 0,
          maxProgress: 10
        },
        {
          userId,
          type: 'profit_threshold',
          title: 'Profit Milestone',
          description: 'Reached $1,000 in portfolio profits.',
          icon: 'trending-up',
          earned: false,
          progress: 0,
          maxProgress: 100
        },
        {
          userId,
          type: 'login_streak',
          title: 'Consistent Investor',
          description: 'Logged in for 7 consecutive days.',
          icon: 'calendar',
          earned: false,
          progress: 0,
          maxProgress: 7
        }
      ];
      
      // Insert all default achievements
      const insertedAchievements = await db.insert(achievements).values(defaultAchievements).returning();
      
      return insertedAchievements;
    } catch (error) {
      console.error("Error initializing achievements:", error);
      throw error;
    }
  }
  
  /**
   * Calculate user metrics and update achievement progress
   */
  static async calculateAchievements(userId: string): Promise<Achievement[]> {
    try {
      // Calculate portfolio metrics
      const portfolioMetrics = await this.getPortfolioMetrics(userId);
      
      // Calculate learning metrics
      const learningMetrics = await this.getLearningMetrics(userId);
      
      // Get current achievements
      let userAchievements = await db
        .select()
        .from(achievements)
        .where(eq(achievements.userId, userId));
      
      // If no achievements exist yet, initialize them
      if (userAchievements.length === 0) {
        userAchievements = await this.initializeAchievements(userId);
      }
      
      // Update achievement progress based on metrics
      const updatedAchievements = await Promise.all(
        userAchievements.map(async achievement => {
          let progress = achievement.progress || 0;
          let earned = achievement.earned;
          let earnedDate = achievement.earnedDate;
          
          // Update achievement based on type
          switch (achievement.type) {
            case 'investment':
              progress = portfolioMetrics.assetCount > 0 ? 1 : 0;
              break;
              
            case 'diversification':
              progress = Math.min(portfolioMetrics.assetCount, achievement.maxProgress || 5);
              break;
              
            case 'portfolio_value':
              progress = Math.min(Math.floor(portfolioMetrics.totalValue / 1000), achievement.maxProgress || 100);
              break;
              
            case 'trading_volume':
              progress = Math.min(Math.floor(portfolioMetrics.tradingVolume / 500), achievement.maxProgress || 100);
              break;
              
            case 'learning':
              progress = Math.min(learningMetrics.completedModules, achievement.maxProgress || 3);
              break;
              
            case 'transaction_count':
              progress = Math.min(portfolioMetrics.transactionCount, achievement.maxProgress || 10);
              break;
              
            case 'profit_threshold':
              progress = Math.min(Math.floor(portfolioMetrics.profitLoss / 10), achievement.maxProgress || 100);
              break;
          }
          
          // Check if achievement should be marked as earned
          if (!earned && progress >= (achievement.maxProgress || 1)) {
            earned = true;
            earnedDate = new Date();
          }
          
          // Update the achievement in database
          const updated = await db
            .update(achievements)
            .set({
              progress,
              earned,
              earnedDate: earned ? earnedDate : null,
              updatedAt: new Date()
            })
            .where(and(
              eq(achievements.id, achievement.id),
              eq(achievements.userId, userId)
            ))
            .returning();
          
          return updated[0];
        })
      );
      
      return updatedAchievements;
    } catch (error) {
      console.error("Error calculating achievements:", error);
      throw error;
    }
  }
  
  /**
   * Update the progress of a specific achievement
   */
  static async updateProgress(achievementId: string, userId: string, progress: number): Promise<Achievement | undefined> {
    try {
      const achievement = await db
        .select()
        .from(achievements)
        .where(and(
          eq(achievements.id, achievementId),
          eq(achievements.userId, userId)
        ));
      
      if (!achievement || achievement.length === 0) {
        return undefined;
      }
      
      const current = achievement[0];
      const maxProgress = current.maxProgress || 1;
      const earned = progress >= maxProgress;
      
      const updated = await db
        .update(achievements)
        .set({
          progress,
          earned,
          earnedDate: earned && !current.earned ? new Date() : current.earnedDate,
          updatedAt: new Date()
        })
        .where(and(
          eq(achievements.id, achievementId),
          eq(achievements.userId, userId)
        ))
        .returning();
      
      return updated[0];
    } catch (error) {
      console.error("Error updating achievement progress:", error);
      throw error;
    }
  }
  
  /**
   * Mark an achievement as earned
   */
  static async markAsEarned(achievementId: string, userId: string): Promise<Achievement | undefined> {
    try {
      const achievement = await db
        .select()
        .from(achievements)
        .where(and(
          eq(achievements.id, achievementId),
          eq(achievements.userId, userId)
        ));
      
      if (!achievement || achievement.length === 0) {
        return undefined;
      }
      
      const current = achievement[0];
      const maxProgress = current.maxProgress || 1;
      
      const updated = await db
        .update(achievements)
        .set({
          progress: maxProgress,
          earned: true,
          earnedDate: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(achievements.id, achievementId),
          eq(achievements.userId, userId)
        ))
        .returning();
      
      return updated[0];
    } catch (error) {
      console.error("Error marking achievement as earned:", error);
      throw error;
    }
  }
  
  /**
   * Calculate portfolio metrics for achievement calculation
   */
  private static async getPortfolioMetrics(userId: string): Promise<PortfolioMetrics> {
    // Get user's portfolios
    const userPortfolios = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    // Calculate total portfolio value
    let totalValue = 0;
    let assetCount = 0;
    let tradingVolume = 0;
    let transactionCount = 0;
    let oldestTransaction: Date | null = null;
    
    // Get all portfolio tokens
    if (userPortfolios.length > 0) {
      for (const portfolio of userPortfolios) {
        const portfolioTokensResult = await db
          .select()
          .from(portfolioTokens)
          .where(eq(portfolioTokens.portfolioId, portfolio.id));
        
        // Add to total value and asset count
        totalValue += portfolioTokensResult.reduce((sum, token) => sum + (token.currentValue || 0), 0);
        assetCount += portfolioTokensResult.length;
      }
    }
    
    // Get transaction data
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    transactionCount = userTransactions.length;
    
    // Calculate trading volume and oldest transaction date
    for (const tx of userTransactions) {
      tradingVolume += tx.value || 0;
      
      if (!oldestTransaction || new Date(tx.timestamp) < oldestTransaction) {
        oldestTransaction = new Date(tx.timestamp);
      }
    }
    
    // Calculate holding period in days
    const holdingPeriod = oldestTransaction ? 
      Math.floor((new Date().getTime() - oldestTransaction.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Estimate profit/loss (in a real app, you'd have more precise calculations)
    const profitLoss = totalValue * 0.1; // Simplified: assume 10% profit
    const profitLossPercent = 10; // 10%
    
    // Calculate diversification score (0-10)
    // More diverse portfolio = higher score
    const diversificationScore = Math.min(assetCount, 10);
    
    return {
      totalValue,
      assetCount,
      diversificationScore,
      profitLoss,
      profitLossPercent,
      tradingVolume,
      transactionCount,
      holdingPeriod
    };
  }
  
  /**
   * Calculate learning metrics for achievement calculation
   */
  private static async getLearningMetrics(userId: string): Promise<LearningMetrics> {
    // Get completed modules count
    const userProgress = await db
      .select()
      .from(userLearningProgress)
      .where(and(
        eq(userLearningProgress.userId, userId),
        eq(userLearningProgress.status, 'completed')
      ));
    
    const completedModules = userProgress.length;
    
    // Get quiz data (simplified)
    const quizzesTaken = userProgress.filter(p => p.quizScore !== null).length;
    const totalScore = userProgress.reduce((sum, p) => sum + (p.quizScore || 0), 0);
    
    return {
      completedModules,
      quizzesTaken,
      totalScore
    };
  }
}