import { db } from "../db";
import { portfolioTokens, PortfolioToken, InsertPortfolioToken, tokens } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export class PortfolioTokenModel {
  /**
   * Find portfolio token by ID
   */
  static async findById(id: string): Promise<PortfolioToken | undefined> {
    const [portfolioToken] = await db.select().from(portfolioTokens).where(eq(portfolioTokens.id, id));
    return portfolioToken;
  }

  /**
   * Find portfolio tokens by portfolio ID
   */
  static async findByPortfolioId(portfolioId: string): Promise<PortfolioToken[]> {
    return await db.select().from(portfolioTokens).where(eq(portfolioTokens.portfolioId, portfolioId));
  }

  /**
   * Find portfolio tokens with token details by portfolio ID
   */
  static async findByPortfolioIdWithTokenDetails(portfolioId: string) {
    return await db
      .select({
        id: portfolioTokens.id,
        userId: portfolioTokens.userId,
        portfolioId: portfolioTokens.portfolioId,
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
      .where(eq(portfolioTokens.portfolioId, portfolioId));
  }

  /**
   * Find portfolio token by portfolio ID and token ID
   */
  static async findByPortfolioAndToken(portfolioId: string, tokenId: string): Promise<PortfolioToken | undefined> {
    const [portfolioToken] = await db
      .select()
      .from(portfolioTokens)
      .where(and(
        eq(portfolioTokens.portfolioId, portfolioId),
        eq(portfolioTokens.tokenId, tokenId)
      ));
    
    return portfolioToken;
  }

  /**
   * Create a new portfolio token
   */
  static async create(portfolioTokenData: InsertPortfolioToken): Promise<PortfolioToken> {
    const [newPortfolioToken] = await db.insert(portfolioTokens).values(portfolioTokenData).returning();
    return newPortfolioToken;
  }

  /**
   * Update a portfolio token
   */
  static async update(id: string, updateData: Partial<Omit<PortfolioToken, 'id' | 'userId' | 'portfolioId' | 'tokenId' | 'createdAt'>>): Promise<PortfolioToken | undefined> {
    const [updatedPortfolioToken] = await db
      .update(portfolioTokens)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(portfolioTokens.id, id))
      .returning();
    
    return updatedPortfolioToken;
  }

  /**
   * Delete a portfolio token
   */
  static async delete(id: string): Promise<boolean> {
    const [deletedPortfolioToken] = await db
      .delete(portfolioTokens)
      .where(eq(portfolioTokens.id, id))
      .returning();
    
    return !!deletedPortfolioToken;
  }

  /**
   * Get all portfolio tokens
   */
  static async findAll(): Promise<PortfolioToken[]> {
    return await db.select().from(portfolioTokens);
  }

  /**
   * Get or create a portfolio token
   */
  static async getOrCreate(userId: string, portfolioId: string, tokenId: string): Promise<PortfolioToken> {
    let portfolioToken = await this.findByPortfolioAndToken(portfolioId, tokenId);
    
    if (!portfolioToken) {
      portfolioToken = await this.create({
        userId,
        portfolioId,
        tokenId,
        amount: "0",
        averageBuyPrice: "0"
      });
    }
    
    return portfolioToken;
  }

  /**
   * Update token price and values
   */
  static async updatePrice(id: string, currentPrice: number | string): Promise<PortfolioToken | undefined> {
    const portfolioToken = await this.findById(id);
    if (!portfolioToken) return undefined;
    
    const amount = parseFloat(portfolioToken.amount.toString());
    const totalValue = amount * parseFloat(currentPrice.toString());
    const totalInvested = amount * parseFloat(portfolioToken.averageBuyPrice.toString());
    const profitLoss = totalValue - totalInvested;
    
    return await this.update(id, {
      currentPrice: currentPrice.toString(),
      totalValue: totalValue.toString(),
      profitLoss: profitLoss.toString()
    });
  }
}