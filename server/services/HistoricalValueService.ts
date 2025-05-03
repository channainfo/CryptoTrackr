import { PortfolioHistoricalValueModel, TokenHistoricalValueModel, PortfolioModel, PortfolioTokenModel } from "../models";

/**
 * Service for working with historical values
 */
export class HistoricalValueService {
  /**
   * Record today's value for all portfolios and tokens
   */
  static async recordTodayValues() {
    try {
      // Get all portfolios
      const portfolios = await PortfolioModel.findAll();
      
      // Record values for each portfolio
      for (const portfolio of portfolios) {
        await this.recordPortfolioValue(portfolio.id);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error recording today values:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Record today's value for a specific portfolio
   */
  static async recordPortfolioValue(portfolioId: string) {
    try {
      // Get portfolio details
      const portfolio = await PortfolioModel.findById(portfolioId);
      if (!portfolio) {
        throw new Error(`Portfolio with ID ${portfolioId} not found`);
      }
      
      // Get portfolio tokens
      const portfolioTokens = await PortfolioTokenModel.findByPortfolioIdWithTokenDetails(portfolioId);
      
      // Calculate portfolio total value and invested amount
      let totalValue = 0;
      let totalInvested = 0;
      
      // Process each token
      for (const token of portfolioTokens) {
        // Calculate token value and invested amount
        const tokenValue = parseFloat(token.quantity) * parseFloat(token.currentPrice);
        const tokenInvested = parseFloat(token.quantity) * parseFloat(token.purchasePrice);
        
        totalValue += tokenValue;
        totalInvested += tokenInvested;
        
        // Record token historical value (daily)
        await TokenHistoricalValueModel.recordTodayValue(
          portfolioId,
          token.id,
          portfolio.userId,
          token.tokenId,
          token.quantity,
          token.currentPrice,
          tokenValue.toString(),
          tokenInvested.toString(),
          'daily'
        );
      }
      
      // Record portfolio historical value (daily)
      await PortfolioHistoricalValueModel.recordTodayValue(
        portfolioId,
        portfolio.userId,
        totalValue.toString(),
        totalInvested.toString(),
        'daily'
      );
      
      return { success: true, portfolioId, totalValue, totalInvested };
    } catch (error) {
      console.error(`Error recording portfolio value for ${portfolioId}:`, error);
      return { success: false, portfolioId, error };
    }
  }
  
  /**
   * Get performance data for a portfolio
   */
  static async getPortfolioPerformance(portfolioId: string, period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' = '1M') {
    try {
      return await PortfolioHistoricalValueModel.calculatePerformance(portfolioId, period);
    } catch (error) {
      console.error(`Error getting portfolio performance for ${portfolioId}:`, error);
      return null;
    }
  }
  
  /**
   * Get performance data for a token
   */
  static async getTokenPerformance(portfolioTokenId: string, period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL' = '1M') {
    try {
      return await TokenHistoricalValueModel.calculatePerformance(portfolioTokenId, period);
    } catch (error) {
      console.error(`Error getting token performance for ${portfolioTokenId}:`, error);
      return null;
    }
  }
}