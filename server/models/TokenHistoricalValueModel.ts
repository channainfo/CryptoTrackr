import { db } from "../db";
import { 
  tokenHistoricalValues, 
  TokenHistoricalValue, 
  InsertTokenHistoricalValue,
  portfolios,
  portfolioTokens,
  tokens
} from "@shared/schema";
import { eq, and, desc, asc, between, sql } from "drizzle-orm";

export class TokenHistoricalValueModel {
  /**
   * Find token historical value by ID
   */
  static async findById(id: string): Promise<TokenHistoricalValue | undefined> {
    const [historicalValue] = await db
      .select()
      .from(tokenHistoricalValues)
      .where(eq(tokenHistoricalValues.id, id));
    
    return historicalValue;
  }

  /**
   * Find token historical values by portfolio token ID
   */
  static async findByPortfolioTokenId(portfolioTokenId: string): Promise<TokenHistoricalValue[]> {
    return await db
      .select()
      .from(tokenHistoricalValues)
      .where(eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId))
      .orderBy(asc(tokenHistoricalValues.date));
  }

  /**
   * Find token historical values by portfolio ID
   */
  static async findByPortfolioId(portfolioId: string): Promise<TokenHistoricalValue[]> {
    return await db
      .select()
      .from(tokenHistoricalValues)
      .where(eq(tokenHistoricalValues.portfolioId, portfolioId))
      .orderBy(asc(tokenHistoricalValues.date));
  }

  /**
   * Find token historical values by token ID within a portfolio
   */
  static async findByTokenInPortfolio(
    portfolioId: string,
    tokenId: string
  ): Promise<TokenHistoricalValue[]> {
    return await db
      .select()
      .from(tokenHistoricalValues)
      .where(and(
        eq(tokenHistoricalValues.portfolioId, portfolioId),
        eq(tokenHistoricalValues.tokenId, tokenId)
      ))
      .orderBy(asc(tokenHistoricalValues.date));
  }

  /**
   * Find token historical values for a specific date range
   */
  static async findByDateRange(
    portfolioTokenId: string, 
    startDate: Date,
    endDate: Date
  ): Promise<TokenHistoricalValue[]> {
    // Convert dates to ISO strings for PostgreSQL compatibility
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    return await db
      .select()
      .from(tokenHistoricalValues)
      .where(and(
        eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId),
        sql`${tokenHistoricalValues.date}::date BETWEEN ${startDateStr}::date AND ${endDateStr}::date`
      ))
      .orderBy(asc(tokenHistoricalValues.date));
  }

  /**
   * Find token historical values with timeframe filter
   */
  static async findByTimeframe(
    portfolioTokenId: string,
    timeframe: 'daily' | 'weekly' | 'monthly'
  ): Promise<TokenHistoricalValue[]> {
    return await db
      .select()
      .from(tokenHistoricalValues)
      .where(and(
        eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId),
        eq(tokenHistoricalValues.timeframe, timeframe)
      ))
      .orderBy(asc(tokenHistoricalValues.date));
  }

  /**
   * Create a new historical value record
   */
  static async create(data: InsertTokenHistoricalValue): Promise<TokenHistoricalValue> {
    const [newRecord] = await db
      .insert(tokenHistoricalValues)
      .values(data)
      .returning();
    
    return newRecord;
  }

  /**
   * Get most recent historical value for a token
   */
  static async findLatest(portfolioTokenId: string): Promise<TokenHistoricalValue | undefined> {
    const [latestRecord] = await db
      .select()
      .from(tokenHistoricalValues)
      .where(eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId))
      .orderBy(desc(tokenHistoricalValues.date))
      .limit(1);
    
    return latestRecord;
  }

  /**
   * Record token value for today
   * This checks if a record already exists for today and updates it if it does
   */
  static async recordTodayValue(
    portfolioId: string,
    portfolioTokenId: string,
    userId: string,
    tokenId: string,
    quantity: number | string,
    price: number | string,
    totalValue: number | string,
    totalInvested: number | string,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<TokenHistoricalValue> {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate profit/loss
    const valueNum = typeof totalValue === 'string' ? parseFloat(totalValue) : totalValue;
    const investedNum = typeof totalInvested === 'string' ? parseFloat(totalInvested) : totalInvested;
    const profitLoss = valueNum - investedNum;
    const profitLossPercentage = investedNum > 0 ? (profitLoss / investedNum) * 100 : 0;
    
    // Check if record already exists for today
    const todayStr = today.toISOString();
    
    const [existingRecord] = await db
      .select()
      .from(tokenHistoricalValues)
      .where(and(
        eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId),
        sql`${tokenHistoricalValues.date}::date = ${todayStr}::date`,
        eq(tokenHistoricalValues.timeframe, timeframe)
      ));
    
    if (existingRecord) {
      // Update existing record
      const [updatedRecord] = await db
        .update(tokenHistoricalValues)
        .set({
          quantity: quantity.toString(),
          price: price.toString(),
          totalValue: totalValue.toString(),
          totalInvested: totalInvested.toString(),
          profitLoss: profitLoss.toString(),
          profitLossPercentage: profitLossPercentage.toString(),
          updatedAt: new Date()
        })
        .where(eq(tokenHistoricalValues.id, existingRecord.id))
        .returning();
      
      return updatedRecord;
    } else {
      // Create new record
      return await this.create({
        portfolioId,
        portfolioTokenId,
        userId,
        tokenId,
        date: todayStr,
        quantity: quantity.toString(),
        price: price.toString(),
        totalValue: totalValue.toString(),
        totalInvested: totalInvested.toString(),
        profitLoss: profitLoss.toString(),
        profitLossPercentage: profitLossPercentage.toString(),
        timeframe
      });
    }
  }

  /**
   * Calculate performance metrics for a token
   */
  static async calculatePerformance(
    portfolioTokenId: string,
    period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
  ) {
    // Get latest value
    const latestValue = await this.findLatest(portfolioTokenId);
    if (!latestValue) return null;
    
    // Calculate date range based on period
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    switch (period) {
      case '1D':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'ALL':
        // Get the first record date
        const [oldestRecord] = await db
          .select()
          .from(tokenHistoricalValues)
          .where(eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId))
          .orderBy(asc(tokenHistoricalValues.date))
          .limit(1);
        
        startDate.setTime(oldestRecord ? oldestRecord.date.getTime() : startDate.getTime());
        break;
    }
    
    // Get historical value at start date
    const startDateStr = startDate.toISOString();
    
    const [startValue] = await db
      .select()
      .from(tokenHistoricalValues)
      .where(and(
        eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId),
        sql`${tokenHistoricalValues.date}::date = ${startDateStr}::date`
      ))
      .limit(1);
    
    if (!startValue) {
      // Find the nearest date if exact date doesn't exist
      const [nearestValue] = await db
        .select()
        .from(tokenHistoricalValues)
        .where(and(
          eq(tokenHistoricalValues.portfolioTokenId, portfolioTokenId),
          sql`${tokenHistoricalValues.date}::date <= ${startDateStr}::date`
        ))
        .orderBy(desc(tokenHistoricalValues.date))
        .limit(1);
        
      if (!nearestValue) return null; 
      
      return {
        startDate: nearestValue.date,
        endDate: latestValue.date,
        startValue: parseFloat(nearestValue.totalValue.toString()),
        endValue: parseFloat(latestValue.totalValue.toString()),
        startPrice: parseFloat(nearestValue.price.toString()),
        endPrice: parseFloat(latestValue.price.toString()),
        changeValue: parseFloat(latestValue.totalValue.toString()) - parseFloat(nearestValue.totalValue.toString()),
        changePercent: calculatePercentChange(
          parseFloat(nearestValue.totalValue.toString()),
          parseFloat(latestValue.totalValue.toString())
        ),
        priceChangePercent: calculatePercentChange(
          parseFloat(nearestValue.price.toString()),
          parseFloat(latestValue.price.toString())
        ),
        historical: await this.findByDateRange(portfolioTokenId, new Date(nearestValue.date), new Date(endDate))
      };
    }
    
    return {
      startDate: startValue.date,
      endDate: latestValue.date,
      startValue: parseFloat(startValue.totalValue.toString()),
      endValue: parseFloat(latestValue.totalValue.toString()),
      startPrice: parseFloat(startValue.price.toString()),
      endPrice: parseFloat(latestValue.price.toString()),
      changeValue: parseFloat(latestValue.totalValue.toString()) - parseFloat(startValue.totalValue.toString()),
      changePercent: calculatePercentChange(
        parseFloat(startValue.totalValue.toString()),
        parseFloat(latestValue.totalValue.toString())
      ),
      priceChangePercent: calculatePercentChange(
        parseFloat(startValue.price.toString()),
        parseFloat(latestValue.price.toString())
      ),
      historical: await this.findByDateRange(portfolioTokenId, new Date(startValue.date), new Date(endDate))
    };
  }
}

// Helper function to calculate percent change
function calculatePercentChange(startValue: number, endValue: number): number {
  if (startValue === 0) return 0;
  return ((endValue - startValue) / startValue) * 100;
}