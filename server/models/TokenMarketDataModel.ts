import { db } from "../db";
import { tokenMarketDatas, TokenMarketData } from "@shared/schema";
import { eq } from "drizzle-orm";

export class TokenMarketDataModel {
  /**
   * Find market data by token ID
   */
  static async findByTokenId(tokenId: string): Promise<TokenMarketData | undefined> {
    const [marketData] = await db.select().from(tokenMarketDatas).where(eq(tokenMarketDatas.tokenId, tokenId));
    return marketData;
  }

  /**
   * Create or update market data for a token
   */
  static async upsert(tokenId: string, data: {
    marketCap: number | string,
    price: number | string,
    priceChange24h: number | string,
    priceChange7d: number | string,
    priceChange30d: number | string,
    volume24h: number | string
  }): Promise<TokenMarketData> {
    // Check if market data already exists
    const existingData = await this.findByTokenId(tokenId);
    
    if (existingData) {
      // Update existing data
      const [updatedData] = await db
        .update(tokenMarketDatas)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(tokenMarketDatas.id, existingData.id))
        .returning();
        
      return updatedData;
    } else {
      // Create new market data
      const [newData] = await db
        .insert(tokenMarketDatas)
        .values({
          tokenId,
          ...data
        })
        .returning();
        
      return newData;
    }
  }

  /**
   * Get all token market data
   */
  static async findAll(): Promise<TokenMarketData[]> {
    return await db.select().from(tokenMarketDatas);
  }

  /**
   * Delete market data for a token
   */
  static async delete(tokenId: string): Promise<boolean> {
    const [deletedData] = await db
      .delete(tokenMarketDatas)
      .where(eq(tokenMarketDatas.tokenId, tokenId))
      .returning();
    
    return !!deletedData;
  }
}