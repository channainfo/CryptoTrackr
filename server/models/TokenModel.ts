import { db } from "../db";
import { tokens, Token, InsertToken, tokenMarketDatas } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class TokenModel {
  /**
   * Find token by ID
   */
  static async findById(id: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.id, id));
    return token;
  }

  /**
   * Find token by symbol
   */
  static async findBySymbol(symbol: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.symbol, symbol));
    return token;
  }

  /**
   * Create a new token
   */
  static async create(tokenData: InsertToken): Promise<Token> {
    const [newToken] = await db.insert(tokens).values(tokenData).returning();
    return newToken;
  }

  /**
   * Update a token
   */
  static async update(id: string, tokenData: Partial<Omit<Token, 'id' | 'createdAt'>>): Promise<Token | undefined> {
    const [updatedToken] = await db
      .update(tokens)
      .set({
        ...tokenData,
        updatedAt: new Date()
      })
      .where(eq(tokens.id, id))
      .returning();
    
    return updatedToken;
  }

  /**
   * Delete a token
   */
  static async delete(id: string): Promise<boolean> {
    const [deletedToken] = await db
      .delete(tokens)
      .where(eq(tokens.id, id))
      .returning();
    
    return !!deletedToken;
  }

  /**
   * Get all tokens
   */
  static async findAll(): Promise<Token[]> {
    return await db.select().from(tokens);
  }

  /**
   * Get tokens with market data
   */
  static async findAllWithMarketData() {
    return await db
      .select({
        id: tokens.id,
        symbol: tokens.symbol,
        name: tokens.name,
        description: tokens.description,
        imageUrl: tokens.imageUrl,
        tokenRank: tokens.tokenRank,
        chain: tokens.chain,
        price: tokenMarketDatas.price,
        priceChange24h: tokenMarketDatas.priceChange24h,
        marketCap: tokenMarketDatas.marketCap,
        volume24h: tokenMarketDatas.volume24h
      })
      .from(tokens)
      .leftJoin(tokenMarketDatas, eq(tokens.id, tokenMarketDatas.tokenId))
      .orderBy(desc(tokenMarketDatas.marketCap));
  }

  /**
   * Get or create token by symbol
   */
  static async getOrCreate(symbol: string, name: string): Promise<Token> {
    let token = await this.findBySymbol(symbol);
    
    if (!token) {
      token = await this.create({
        symbol,
        name,
        chain: 'default', // Default value required by schema
      });
    }
    
    return token;
  }
}