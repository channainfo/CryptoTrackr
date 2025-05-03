import { db } from "../db";
import { 
  portfolioHistoricalValues, 
  PortfolioHistoricalValue, 
  InsertPortfolioHistoricalValue,
  portfolios,
  users
} from "@shared/schema";
import { eq, and, desc, asc, between, sql } from "drizzle-orm";

export class PortfolioHistoricalValueModel {
  /**
   * Find portfolio historical value by ID
   */
  static async findById(id: string): Promise<PortfolioHistoricalValue | undefined> {
    const [historicalValue] = await db
      .select()
      .from(portfolioHistoricalValues)
      .where(eq(portfolioHistoricalValues.id, id));
    
    return historicalValue;
  }

  /**
   * Find portfolio historical values by portfolio ID
   */
  static async findByPortfolioId(portfolioId: string): Promise<PortfolioHistoricalValue[]> {
    return await db
      .select()
      .from(portfolioHistoricalValues)
      .where(eq(portfolioHistoricalValues.portfolioId, portfolioId))
      .orderBy(asc(portfolioHistoricalValues.date));
  }

  /**
   * Find portfolio historical values by user ID
   */
  static async findByUserId(userId: string): Promise<PortfolioHistoricalValue[]> {
    return await db
      .select()
      .from(portfolioHistoricalValues)
      .where(eq(portfolioHistoricalValues.userId, userId))
      .orderBy(asc(portfolioHistoricalValues.date));
  }

  /**
   * Find portfolio historical values for a specific date range
   */
  static async findByDateRange(
    portfolioId: string, 
    startDate: Date,
    endDate: Date
  ): Promise<PortfolioHistoricalValue[]> {
    // Convert dates to ISO strings for PostgreSQL compatibility
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    return await db
      .select()
      .from(portfolioHistoricalValues)
      .where(and(
        eq(portfolioHistoricalValues.portfolioId, portfolioId),
        sql`${portfolioHistoricalValues.date} BETWEEN ${startDateStr}::date AND ${endDateStr}::date`
      ))
      .orderBy(asc(portfolioHistoricalValues.date));
  }

  /**
   * Find portfolio historical values with timeframe filter
   */
  static async findByTimeframe(
    portfolioId: string,
    timeframe: 'daily' | 'weekly' | 'monthly'
  ): Promise<PortfolioHistoricalValue[]> {
    return await db
      .select()
      .from(portfolioHistoricalValues)
      .where(and(
        eq(portfolioHistoricalValues.portfolioId, portfolioId),
        eq(portfolioHistoricalValues.timeframe, timeframe)
      ))
      .orderBy(asc(portfolioHistoricalValues.date));
  }

  /**
   * Create a new historical value record
   */
  static async create(data: InsertPortfolioHistoricalValue): Promise<PortfolioHistoricalValue> {
    const [newRecord] = await db
      .insert(portfolioHistoricalValues)
      .values(data)
      .returning();
    
    return newRecord;
  }

  /**
   * Get most recent historical value for a portfolio
   */
  static async findLatest(portfolioId: string): Promise<PortfolioHistoricalValue | undefined> {
    const [latestRecord] = await db
      .select()
      .from(portfolioHistoricalValues)
      .where(eq(portfolioHistoricalValues.portfolioId, portfolioId))
      .orderBy(desc(portfolioHistoricalValues.date))
      .limit(1);
    
    return latestRecord;
  }

  /**
   * Record portfolio value for today
   * This checks if a record already exists for today and updates it if it does
   */
  static async recordTodayValue(
    portfolioId: string,
    userId: string,
    totalValue: number | string,
    totalInvested: number | string,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<PortfolioHistoricalValue> {
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
      .from(portfolioHistoricalValues)
      .where(and(
        eq(portfolioHistoricalValues.portfolioId, portfolioId),
        sql`${portfolioHistoricalValues.date}::date = ${todayStr}::date`,
        eq(portfolioHistoricalValues.timeframe, timeframe)
      ));
    
    if (existingRecord) {
      // Update existing record
      const [updatedRecord] = await db
        .update(portfolioHistoricalValues)
        .set({
          totalValue: totalValue.toString(),
          totalInvested: totalInvested.toString(),
          profitLoss: profitLoss.toString(),
          profitLossPercentage: profitLossPercentage.toString(),
          updatedAt: new Date()
        })
        .where(eq(portfolioHistoricalValues.id, existingRecord.id))
        .returning();
      
      return updatedRecord;
    } else {
      // Create new record
      return await this.create({
        portfolioId,
        userId,
        date: todayStr,
        totalValue: totalValue.toString(),
        totalInvested: totalInvested.toString(),
        profitLoss: profitLoss.toString(),
        profitLossPercentage: profitLossPercentage.toString(),
        timeframe
      });
    }
  }

  /**
   * Calculate performance metrics
   */
  static async calculatePerformance(
    portfolioId: string,
    period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
  ) {
    // Get latest value
    const latestValue = await this.findLatest(portfolioId);
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
          .from(portfolioHistoricalValues)
          .where(eq(portfolioHistoricalValues.portfolioId, portfolioId))
          .orderBy(asc(portfolioHistoricalValues.date))
          .limit(1);
        
        startDate.setTime(oldestRecord ? new Date(oldestRecord.date).getTime() : startDate.getTime());
        break;
    }
    
    // Get historical value at start date
    const startDateStr = startDate.toISOString();
    
    const [startValue] = await db
      .select()
      .from(portfolioHistoricalValues)
      .where(and(
        eq(portfolioHistoricalValues.portfolioId, portfolioId),
        sql`${portfolioHistoricalValues.date}::date = ${startDateStr}::date`
      ))
      .limit(1);
    
    if (!startValue) {
      // Find the nearest date if exact date doesn't exist
      const [nearestValue] = await db
        .select()
        .from(portfolioHistoricalValues)
        .where(and(
          eq(portfolioHistoricalValues.portfolioId, portfolioId),
          sql`${portfolioHistoricalValues.date}::date <= ${startDateStr}::date`
        ))
        .orderBy(desc(portfolioHistoricalValues.date))
        .limit(1);
        
      if (!nearestValue) return null; 
      
      const endDateStr = endDate.toISOString();
      
      return {
        startDate: nearestValue.date,
        endDate: latestValue.date,
        startValue: parseFloat(nearestValue.totalValue.toString()),
        endValue: parseFloat(latestValue.totalValue.toString()),
        changeValue: parseFloat(latestValue.totalValue.toString()) - parseFloat(nearestValue.totalValue.toString()),
        changePercent: calculatePercentChange(
          parseFloat(nearestValue.totalValue.toString()),
          parseFloat(latestValue.totalValue.toString())
        ),
        // Convert dates to Date objects for compatibility
        historical: await this.findByDateRange(portfolioId, new Date(nearestValue.date), new Date(endDateStr))
      };
    }
    
    const endDateStr = endDate.toISOString();
    
    return {
      startDate: startValue.date,
      endDate: latestValue.date,
      startValue: parseFloat(startValue.totalValue.toString()),
      endValue: parseFloat(latestValue.totalValue.toString()),
      changeValue: parseFloat(latestValue.totalValue.toString()) - parseFloat(startValue.totalValue.toString()),
      changePercent: calculatePercentChange(
        parseFloat(startValue.totalValue.toString()),
        parseFloat(latestValue.totalValue.toString())
      ),
      // Convert dates to Date objects for compatibility
      historical: await this.findByDateRange(portfolioId, new Date(startValue.date), new Date(endDateStr))
    };
  }
}

// Helper function to calculate percent change
function calculatePercentChange(startValue: number, endValue: number): number {
  if (startValue === 0) return 0;
  return ((endValue - startValue) / startValue) * 100;
}