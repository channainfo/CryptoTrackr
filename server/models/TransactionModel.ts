import { db } from "../db";
import { 
  transactions, 
  Transaction, 
  InsertTransaction, 
  tokens, 
  portfolios, 
  portfolioTokens 
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { PortfolioTokenModel } from "./PortfolioTokenModel";

export class TransactionModel {
  /**
   * Find transaction by ID
   */
  static async findById(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  /**
   * Find transactions by user ID
   */
  static async findByUserId(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.transactionDate));
  }

  /**
   * Find transactions by portfolio ID
   */
  static async findByPortfolioId(portfolioId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.portfolioId, portfolioId))
      .orderBy(desc(transactions.transactionDate));
  }

  /**
   * Find transactions by portfolio token ID
   */
  static async findByPortfolioTokenId(portfolioTokenId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.portfolioTokenId, portfolioTokenId))
      .orderBy(desc(transactions.transactionDate));
  }

  /**
   * Find transactions with details
   */
  static async findByUserIdWithDetails(userId: string) {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        portfolioId: transactions.portfolioId,
        portfolioTokenId: transactions.portfolioTokenId,
        tokenId: transactions.tokenId,
        type: transactions.type,
        amount: transactions.amount,
        price: transactions.price,
        totalValue: transactions.totalValue,
        isManual: transactions.isManual,
        transactionDate: transactions.transactionDate,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        tokenSymbol: tokens.symbol,
        tokenName: tokens.name,
        portfolioName: portfolios.name
      })
      .from(transactions)
      .leftJoin(tokens, eq(transactions.tokenId, tokens.id))
      .leftJoin(portfolios, eq(transactions.portfolioId, portfolios.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.transactionDate));
  }

  /**
   * Create a new transaction
   */
  static async create(transactionData: InsertTransaction): Promise<Transaction> {
    // Start a transaction to ensure data integrity
    return await db.transaction(async (tx) => {
      // Insert the transaction
      const [newTransaction] = await tx
        .insert(transactions)
        .values(transactionData)
        .returning();
      
      // Update the portfolio token
      const portfolioToken = await tx
        .select()
        .from(portfolioTokens)
        .where(eq(portfolioTokens.id, transactionData.portfolioTokenId))
        .then(rows => rows[0]);
      
      if (portfolioToken) {
        const amount = parseFloat(portfolioToken.amount.toString());
        const transactionAmount = parseFloat(transactionData.amount.toString());
        const transactionPrice = parseFloat(transactionData.price.toString());
        
        let newAmount = amount;
        let newAverageBuyPrice = parseFloat(portfolioToken.averageBuyPrice.toString());
        let newTotalInvested = parseFloat(portfolioToken.totalInvested.toString());
        
        if (transactionData.type === 'buy') {
          // Calculate new average buy price for buys
          const oldValue = amount * newAverageBuyPrice;
          const newValue = transactionAmount * transactionPrice;
          newAmount = amount + transactionAmount;
          newAverageBuyPrice = newAmount > 0 ? (oldValue + newValue) / newAmount : 0;
          newTotalInvested = newAmount * newAverageBuyPrice;
        } else if (transactionData.type === 'sell') {
          // For sells, we don't change the average buy price, just reduce the amount
          newAmount = Math.max(0, amount - transactionAmount);
          newTotalInvested = newAmount * newAverageBuyPrice;
        }
        
        // Update the portfolio token
        await tx
          .update(portfolioTokens)
          .set({
            amount: newAmount.toString(),
            averageBuyPrice: newAverageBuyPrice.toString(),
            totalInvested: newTotalInvested.toString(),
            totalValue: (newAmount * parseFloat(portfolioToken.currentPrice.toString())).toString(),
            buyCount: transactionData.type === 'buy' 
              ? portfolioToken.buyCount + 1 
              : portfolioToken.buyCount,
            sellCount: transactionData.type === 'sell' 
              ? portfolioToken.sellCount + 1 
              : portfolioToken.sellCount,
            lastTradeDate: transactionData.transactionDate,
            updatedAt: new Date()
          })
          .where(eq(portfolioTokens.id, transactionData.portfolioTokenId));
      }
      
      return newTransaction;
    });
  }

  /**
   * Update a transaction
   */
  static async update(id: string, updateData: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<Transaction | undefined> {
    // For simplicity, we're not recalculating portfolio token values here
    // In a real-world scenario, you would need to recalculate everything when a transaction is updated
    
    const [updatedTransaction] = await db
      .update(transactions)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning();
    
    return updatedTransaction;
  }

  /**
   * Delete a transaction
   */
  static async delete(id: string): Promise<boolean> {
    // Start a transaction to ensure data integrity
    return await db.transaction(async (tx) => {
      // Get the transaction
      const [transaction] = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.id, id));
      
      if (!transaction) return false;
      
      // Delete the transaction
      const [deletedTransaction] = await tx
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning();
      
      if (!deletedTransaction) return false;
      
      // Get the portfolio token
      const [portfolioToken] = await tx
        .select()
        .from(portfolioTokens)
        .where(eq(portfolioTokens.id, transaction.portfolioTokenId));
      
      if (portfolioToken) {
        // Get all transactions for this portfolio token to recalculate
        const remainingTransactions = await tx
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.portfolioTokenId, transaction.portfolioTokenId),
            eq(transactions.id, id).not()
          ))
          .orderBy(transactions.transactionDate);
        
        // Recalculate portfolio token values
        let newAmount = 0;
        let totalBuyValue = 0;
        let totalBuyAmount = 0;
        let buyCount = 0;
        let sellCount = 0;
        
        for (const tx of remainingTransactions) {
          const txAmount = parseFloat(tx.amount.toString());
          const txPrice = parseFloat(tx.price.toString());
          
          if (tx.type === 'buy') {
            newAmount += txAmount;
            totalBuyValue += txAmount * txPrice;
            totalBuyAmount += txAmount;
            buyCount++;
          } else if (tx.type === 'sell') {
            newAmount -= txAmount;
            sellCount++;
          }
        }
        
        // Ensure we don't go negative
        newAmount = Math.max(0, newAmount);
        
        // Calculate new average buy price
        const newAverageBuyPrice = totalBuyAmount > 0 ? totalBuyValue / totalBuyAmount : 0;
        const newTotalInvested = newAmount * newAverageBuyPrice;
        const newTotalValue = newAmount * parseFloat(portfolioToken.currentPrice.toString());
        
        // Update the portfolio token
        await tx
          .update(portfolioTokens)
          .set({
            amount: newAmount.toString(),
            averageBuyPrice: newAverageBuyPrice.toString(),
            totalInvested: newTotalInvested.toString(),
            totalValue: newTotalValue.toString(),
            profitLoss: (newTotalValue - newTotalInvested).toString(),
            buyCount,
            sellCount,
            lastTradeDate: remainingTransactions.length > 0 
              ? remainingTransactions[remainingTransactions.length - 1].transactionDate 
              : null,
            updatedAt: new Date()
          })
          .where(eq(portfolioTokens.id, transaction.portfolioTokenId));
      }
      
      return true;
    });
  }

  /**
   * Get all transactions
   */
  static async findAll(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }
}