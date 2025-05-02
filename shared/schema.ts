import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep the users table from the original schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Define cryptocurrencies table
export const cryptocurrencies = pgTable("cryptocurrencies", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  currentPrice: numeric("current_price"),
  marketCap: numeric("market_cap"),
  image: text("image"),
  lastUpdated: timestamp("last_updated"),
});

export const insertCryptocurrencySchema = createInsertSchema(cryptocurrencies).pick({
  symbol: true,
  name: true,
  currentPrice: true,
  marketCap: true,
  image: true,
  lastUpdated: true,
});

// Define portfolios table
export const portfolio = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  cryptoId: integer("crypto_id").notNull().references(() => cryptocurrencies.id),
  quantity: numeric("quantity").notNull(),
  purchasePrice: numeric("purchase_price"),
  // Instead of purchase dates for simplicity, just track a single purchase price
});

export const insertPortfolioSchema = createInsertSchema(portfolio).pick({
  userId: true,
  cryptoId: true,
  quantity: true,
  purchasePrice: true,
});

// Define transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  cryptoId: integer("crypto_id").notNull().references(() => cryptocurrencies.id),
  type: text("type").notNull(), // 'buy' or 'sell'
  quantity: numeric("quantity").notNull(),
  price: numeric("price").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  cryptoId: true,
  type: true,
  quantity: true,
  price: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Cryptocurrency = typeof cryptocurrencies.$inferSelect;
export type InsertCryptocurrency = z.infer<typeof insertCryptocurrencySchema>;

export type Portfolio = typeof portfolio.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
