import { db } from "../db";
import { transactions, portfolioTokens, tokens } from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { Transaction } from "@shared/schema";
import { sql } from "drizzle-orm";

interface TaxableTransaction {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  holdingPeriod: number;
  isLongTerm: boolean;
}

interface AggregatedHolding {
  symbol: string;
  amount: number;
  price: number;
  date: string;
  id: string;
}

interface TaxSummary {
  taxYear: string;
  totalTransactions: number;
  shortTermGains: number;
  longTermGains: number;
  totalGains: number;
  totalTaxableAmount: number;
  estimatedTax: number;
  costBasis: number;
  proceeds: number;
  byAsset: {
    [symbol: string]: {
      totalGains: number;
      shortTermGains: number;
      longTermGains: number;
      transactions: number;
    }
  }
}

// Tax rates (simplified)
const TAX_BRACKETS = {
  SHORT_TERM: {
    single: [
      { rate: 0.1, upTo: 10275 },
      { rate: 0.12, upTo: 41775 },
      { rate: 0.22, upTo: 89075 },
      { rate: 0.24, upTo: 170050 },
      { rate: 0.32, upTo: 215950 },
      { rate: 0.35, upTo: 539900 },
      { rate: 0.37, upTo: Infinity }
    ],
    joint: [
      { rate: 0.1, upTo: 20550 },
      { rate: 0.12, upTo: 83550 },
      { rate: 0.22, upTo: 178150 },
      { rate: 0.24, upTo: 340100 },
      { rate: 0.32, upTo: 431900 },
      { rate: 0.35, upTo: 647850 },
      { rate: 0.37, upTo: Infinity }
    ],
    separate: [
      { rate: 0.1, upTo: 10275 },
      { rate: 0.12, upTo: 41775 },
      { rate: 0.22, upTo: 89075 },
      { rate: 0.24, upTo: 170050 },
      { rate: 0.32, upTo: 215950 },
      { rate: 0.35, upTo: 323925 },
      { rate: 0.37, upTo: Infinity }
    ],
    head: [
      { rate: 0.1, upTo: 14650 },
      { rate: 0.12, upTo: 55900 },
      { rate: 0.22, upTo: 89050 },
      { rate: 0.24, upTo: 170050 },
      { rate: 0.32, upTo: 215950 },
      { rate: 0.35, upTo: 539900 },
      { rate: 0.37, upTo: Infinity }
    ]
  },
  LONG_TERM: {
    single: [
      { rate: 0, upTo: 41675 },
      { rate: 0.15, upTo: 459750 },
      { rate: 0.20, upTo: Infinity }
    ],
    joint: [
      { rate: 0, upTo: 83350 },
      { rate: 0.15, upTo: 517200 },
      { rate: 0.20, upTo: Infinity }
    ],
    separate: [
      { rate: 0, upTo: 41675 },
      { rate: 0.15, upTo: 258600 },
      { rate: 0.20, upTo: Infinity }
    ],
    head: [
      { rate: 0, upTo: 55800 },
      { rate: 0.15, upTo: 488500 },
      { rate: 0.20, upTo: Infinity }
    ]
  }
};

export class TaxCalculationModel {
  /**
   * Calculate taxable transactions for a given year and user
   */
  static async calculateTaxes(
    userId: string,
    year: string,
    method: 'fifo' | 'lifo' | 'hifo' = 'fifo',
    income: string = '0',
    status: 'single' | 'joint' | 'separate' | 'head' = 'single'
  ) {
    try {
      // Get start and end dates for the tax year
      const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
      const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
      
      // Fetch all transactions for this user within this year
      const yearTransactions = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          tokenId: transactions.tokenId,
          portfolioId: transactions.portfolioId,
          type: transactions.type,
          amount: transactions.amount,
          price: transactions.price,
          date: transactions.transactionDate,
          tokenSymbol: tokens.symbol,
          tokenName: tokens.name
        })
        .from(transactions)
        .leftJoin(tokens, eq(transactions.tokenId, tokens.id))
        .where(
          and(
            eq(transactions.userId, userId),
            gte(transactions.transactionDate, startDate),
            lte(transactions.transactionDate, endDate)
          )
        )
        .orderBy(
          method === 'fifo' 
            ? asc(transactions.transactionDate)
            : method === 'lifo'
              ? desc(transactions.transactionDate)
              : desc(transactions.price) // hifo
        );
      
      // Get all transactions before the tax year (for cost basis calculation)
      const previousTransactions = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          tokenId: transactions.tokenId,
          portfolioId: transactions.portfolioId,
          type: transactions.type,
          amount: transactions.amount,
          price: transactions.price,
          date: transactions.transactionDate,
          tokenSymbol: tokens.symbol,
          tokenName: tokens.name
        })
        .from(transactions)
        .leftJoin(tokens, eq(transactions.tokenId, tokens.id))
        .where(
          and(
            eq(transactions.userId, userId),
            lte(transactions.transactionDate, startDate)
          )
        )
        .orderBy(
          method === 'fifo' 
            ? asc(transactions.transactionDate)
            : method === 'lifo'
              ? desc(transactions.transactionDate)
              : desc(transactions.price) // hifo
        );
      
      // Process transactions to determine taxable events
      const taxableTransactions: TaxableTransaction[] = [];
      
      // Track holdings (for cost basis)
      const holdings: Record<string, AggregatedHolding[]> = {};
      
      // First, process previous transactions to establish beginning holdings
      for (const tx of previousTransactions) {
        const symbol = tx.tokenSymbol;
        
        if (!holdings[symbol]) {
          holdings[symbol] = [];
        }
        
        if (tx.type === 'buy') {
          holdings[symbol].push({
            symbol,
            amount: parseFloat(tx.amount.toString()),
            price: parseFloat(tx.price.toString()),
            date: tx.date,
            id: tx.id
          });
        } else if (tx.type === 'sell') {
          // Remove holdings based on method (FIFO, LIFO, HIFO)
          this.processHoldingSale(holdings, symbol, parseFloat(tx.amount.toString()), method);
        }
      }
      
      // Now process the tax year transactions
      for (const tx of yearTransactions) {
        const symbol = tx.tokenSymbol;
        const amount = parseFloat(tx.amount.toString());
        const price = parseFloat(tx.price.toString());
        
        if (!holdings[symbol]) {
          holdings[symbol] = [];
        }
        
        if (tx.type === 'buy') {
          // Add to holdings
          holdings[symbol].push({
            symbol,
            amount,
            price,
            date: tx.date,
            id: tx.id
          });
          
          // Add to taxable transactions (not taxable but we show it)
          taxableTransactions.push({
            id: tx.id,
            date: tx.date,
            type: 'buy',
            symbol,
            amount,
            price,
            costBasis: amount * price,
            proceeds: 0,
            gainLoss: 0,
            holdingPeriod: 0,
            isLongTerm: false
          });
        } else if (tx.type === 'sell') {
          // Calculate gain/loss from this sale
          const saleResult = this.calculateSaleGainLoss(
            holdings, 
            symbol, 
            amount, 
            price, 
            tx.date,
            method
          );
          
          // Add the sell transaction with calculated values
          taxableTransactions.push({
            id: tx.id,
            date: tx.date,
            type: 'sell',
            symbol,
            amount,
            price,
            costBasis: saleResult.costBasis,
            proceeds: amount * price,
            gainLoss: saleResult.gainLoss,
            holdingPeriod: saleResult.holdingPeriodDays,
            isLongTerm: saleResult.holdingPeriodDays > 365
          });
        }
      }
      
      // Calculate tax summary
      const summary = this.calculateTaxSummary(taxableTransactions, year, parseInt(income), status);
      
      return {
        transactions: taxableTransactions,
        summary
      };
    } catch (error) {
      console.error('Error calculating taxes:', error);
      throw error;
    }
  }
  
  /**
   * Process a sale by removing holdings based on the calculation method
   */
  private static processHoldingSale(
    holdings: Record<string, AggregatedHolding[]>,
    symbol: string,
    saleAmount: number,
    method: 'fifo' | 'lifo' | 'hifo'
  ) {
    // Skip if no holdings for this symbol
    if (!holdings[symbol] || holdings[symbol].length === 0) {
      return;
    }
    
    let remainingAmount = saleAmount;
    
    // Sort holdings based on method
    if (method === 'lifo') {
      holdings[symbol].reverse();
    } else if (method === 'hifo') {
      holdings[symbol].sort((a, b) => b.price - a.price);
    }
    
    // Process the sale
    while (remainingAmount > 0 && holdings[symbol].length > 0) {
      const holding = holdings[symbol][0];
      
      if (holding.amount <= remainingAmount) {
        // Use the entire holding
        remainingAmount -= holding.amount;
        holdings[symbol].shift();
      } else {
        // Use part of the holding
        holding.amount -= remainingAmount;
        remainingAmount = 0;
      }
    }
    
    // Restore original sorting if needed
    if (method === 'lifo') {
      holdings[symbol].reverse();
    } else if (method === 'hifo') {
      holdings[symbol].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }
  
  /**
   * Calculate gain/loss from a sale
   */
  private static calculateSaleGainLoss(
    holdings: Record<string, AggregatedHolding[]>,
    symbol: string,
    saleAmount: number,
    salePrice: number,
    saleDate: string,
    method: 'fifo' | 'lifo' | 'hifo'
  ) {
    let remainingAmount = saleAmount;
    let totalCostBasis = 0;
    let oldestHoldingDate = new Date();
    
    // Sort holdings based on method
    if (method === 'lifo') {
      holdings[symbol].reverse();
    } else if (method === 'hifo') {
      holdings[symbol].sort((a, b) => b.price - a.price);
    }
    
    // Track removed holdings for this calculation
    const removedHoldings: AggregatedHolding[] = [];
    
    // Process the sale
    while (remainingAmount > 0 && holdings[symbol] && holdings[symbol].length > 0) {
      const holding = holdings[symbol][0];
      const holdingDate = new Date(holding.date);
      
      if (holdingDate < oldestHoldingDate) {
        oldestHoldingDate = holdingDate;
      }
      
      if (holding.amount <= remainingAmount) {
        // Use the entire holding
        totalCostBasis += holding.amount * holding.price;
        remainingAmount -= holding.amount;
        removedHoldings.push({ ...holdings[symbol][0] });
        holdings[symbol].shift();
      } else {
        // Use part of the holding
        totalCostBasis += remainingAmount * holding.price;
        holding.amount -= remainingAmount;
        remainingAmount = 0;
      }
    }
    
    // Restore original sorting if needed
    if (method === 'lifo') {
      holdings[symbol].reverse();
    } else if (method === 'hifo') {
      holdings[symbol].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    // Calculate gain/loss
    const proceeds = saleAmount * salePrice;
    const gainLoss = proceeds - totalCostBasis;
    
    // Calculate holding period in days
    const saleDateObj = new Date(saleDate);
    const holdingPeriodDays = Math.floor((saleDateObj.getTime() - oldestHoldingDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      costBasis: totalCostBasis,
      gainLoss,
      holdingPeriodDays
    };
  }
  
  /**
   * Calculate tax summary from the list of taxable transactions
   */
  private static calculateTaxSummary(
    transactions: TaxableTransaction[],
    taxYear: string,
    additionalIncome: number = 0,
    filingStatus: 'single' | 'joint' | 'separate' | 'head' = 'single'
  ): TaxSummary {
    // Initialize summary object
    const summary: TaxSummary = {
      taxYear,
      totalTransactions: transactions.length,
      shortTermGains: 0,
      longTermGains: 0,
      totalGains: 0,
      totalTaxableAmount: 0,
      estimatedTax: 0,
      costBasis: 0,
      proceeds: 0,
      byAsset: {}
    };
    
    // Create asset entries
    const assetSymbols = new Set<string>();
    transactions.forEach(tx => assetSymbols.add(tx.symbol));
    
    assetSymbols.forEach(symbol => {
      summary.byAsset[symbol] = {
        totalGains: 0,
        shortTermGains: 0,
        longTermGains: 0,
        transactions: 0
      };
    });
    
    // Process each transaction
    transactions.forEach(tx => {
      summary.byAsset[tx.symbol].transactions++;
      
      // Add to totals
      summary.costBasis += tx.costBasis;
      summary.proceeds += tx.proceeds;
      
      // For sells, calculate gains
      if (tx.type === 'sell') {
        if (tx.isLongTerm) {
          summary.longTermGains += tx.gainLoss;
          summary.byAsset[tx.symbol].longTermGains += tx.gainLoss;
        } else {
          summary.shortTermGains += tx.gainLoss;
          summary.byAsset[tx.symbol].shortTermGains += tx.gainLoss;
        }
        
        summary.byAsset[tx.symbol].totalGains += tx.gainLoss;
      }
    });
    
    // Calculate total gains
    summary.totalGains = summary.shortTermGains + summary.longTermGains;
    summary.totalTaxableAmount = summary.totalGains;
    
    // Calculate estimated tax
    const shortTermTax = this.calculateEstimatedTax(
      summary.shortTermGains, 
      additionalIncome, 
      'SHORT_TERM',
      filingStatus
    );
    
    const longTermTax = this.calculateEstimatedTax(
      summary.longTermGains, 
      additionalIncome + summary.shortTermGains, 
      'LONG_TERM',
      filingStatus
    );
    
    summary.estimatedTax = shortTermTax + longTermTax;
    
    return summary;
  }
  
  /**
   * Calculate estimated tax based on brackets
   */
  private static calculateEstimatedTax(
    gain: number,
    additionalIncome: number,
    type: 'SHORT_TERM' | 'LONG_TERM',
    filingStatus: 'single' | 'joint' | 'separate' | 'head'
  ): number {
    if (gain <= 0) return 0;
    
    const brackets = TAX_BRACKETS[type][filingStatus];
    let incomeSoFar = additionalIncome;
    let tax = 0;
    
    let remainingGain = gain;
    let prevThreshold = 0;
    
    for (const bracket of brackets) {
      // Skip brackets already covered by additional income
      if (incomeSoFar >= bracket.upTo) {
        prevThreshold = bracket.upTo;
        continue;
      }
      
      // Calculate how much income falls in this bracket
      const startInThisBracket = Math.max(incomeSoFar, prevThreshold);
      const roomInThisBracket = bracket.upTo - startInThisBracket;
      const gainInThisBracket = Math.min(roomInThisBracket, remainingGain);
      
      tax += gainInThisBracket * bracket.rate;
      remainingGain -= gainInThisBracket;
      incomeSoFar += gainInThisBracket;
      prevThreshold = bracket.upTo;
      
      if (remainingGain <= 0) break;
    }
    
    return tax;
  }
  

}