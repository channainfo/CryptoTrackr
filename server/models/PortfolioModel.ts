import { db } from "../db";
import { portfolios, Portfolio, InsertPortfolio } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class PortfolioModel {
  /**
   * Find portfolio by ID
   */
  static async findById(id: string): Promise<Portfolio | undefined> {
    const [portfolio] = await db.select().from(portfolios).where(eq(portfolios.id, id));
    return portfolio;
  }

  /**
   * Find portfolios by user ID
   */
  static async findByUserId(userId: string): Promise<Portfolio[]> {
    return await db.select().from(portfolios).where(eq(portfolios.userId, userId));
  }

  /**
   * Get user's default portfolio
   */
  static async findDefault(userId: string): Promise<Portfolio | undefined> {
    const [defaultPortfolio] = await db
      .select()
      .from(portfolios)
      .where(and(
        eq(portfolios.userId, userId),
        eq(portfolios.isDefault, true)
      ));
    
    return defaultPortfolio;
  }

  /**
   * Create a new portfolio
   */
  static async create(portfolioData: InsertPortfolio): Promise<Portfolio> {
    // If this is set as default, unset other defaults for this user
    if (portfolioData.isDefault) {
      await db
        .update(portfolios)
        .set({ isDefault: false })
        .where(and(
          eq(portfolios.userId, portfolioData.userId),
          eq(portfolios.isDefault, true)
        ));
    }
    
    const [newPortfolio] = await db.insert(portfolios).values(portfolioData).returning();
    return newPortfolio;
  }

  /**
   * Update a portfolio
   */
  static async update(id: string, portfolioData: Partial<Omit<Portfolio, 'id' | 'userId' | 'createdAt'>>): Promise<Portfolio | undefined> {
    const portfolio = await this.findById(id);
    if (!portfolio) return undefined;
    
    // If setting as default, unset other defaults for this user
    if (portfolioData.isDefault) {
      await db
        .update(portfolios)
        .set({ isDefault: false })
        .where(and(
          eq(portfolios.userId, portfolio.userId),
          eq(portfolios.isDefault, true)
        ));
    }
    
    const [updatedPortfolio] = await db
      .update(portfolios)
      .set({
        ...portfolioData,
        updatedAt: new Date()
      })
      .where(eq(portfolios.id, id))
      .returning();
    
    return updatedPortfolio;
  }

  /**
   * Delete a portfolio
   */
  static async delete(id: string): Promise<boolean> {
    const [deletedPortfolio] = await db
      .delete(portfolios)
      .where(eq(portfolios.id, id))
      .returning();
    
    return !!deletedPortfolio;
  }

  /**
   * Get all portfolios
   */
  static async findAll(): Promise<Portfolio[]> {
    return await db.select().from(portfolios);
  }

  /**
   * Get or create default portfolio for user
   */
  static async getOrCreateDefault(userId: string): Promise<Portfolio> {
    let defaultPortfolio = await this.findDefault(userId);
    
    if (!defaultPortfolio) {
      defaultPortfolio = await this.create({
        userId,
        name: 'Default Portfolio',
        isDefault: true
      });
    }
    
    return defaultPortfolio;
  }
}