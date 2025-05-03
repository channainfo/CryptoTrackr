import { pgTable, text, varchar, uuid, numeric, timestamp, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums based on the database structure
export const transactionTypeEnum = pgEnum('enum_transactions_type', ['buy', 'sell']);

// User table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Tokens table based on the provided schema
export const tokens = pgTable("tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbol: varchar("symbol", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  tokenRank: integer("token_rank"),
  imageUrl: varchar("image_url", { length: 255 }),
  chain: varchar("chain", { length: 255 }).notNull(),
  contractAddress: varchar("contract_address", { length: 255 }),
  decimals: integer("decimals").notNull().default(18),
  totalSupply: numeric("total_supply"),
  maxSupply: numeric("max_supply"),
  isVerified: boolean("is_verified").notNull().default(false),
  launchedAt: timestamp("launched_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertTokenSchema = createInsertSchema(tokens).pick({
  symbol: true,
  name: true,
  description: true,
  imageUrl: true,
  chain: true,
  contractAddress: true,
  decimals: true,
});

// Token market data
export const tokenMarketDatas = pgTable("token_market_datas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenId: uuid("token_id").notNull().references(() => tokens.id),
  marketCap: numeric("market_cap").notNull(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  priceChange24h: numeric("price_change_24h", { precision: 10, scale: 2 }).notNull(),
  priceChange7d: numeric("price_change_7d", { precision: 10, scale: 2 }).notNull(),
  priceChange30d: numeric("price_change_30d", { precision: 10, scale: 2 }).notNull(),
  volume24h: numeric("volume_24h").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Portfolio table
export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertPortfolioSchema = createInsertSchema(portfolios).pick({
  userId: true,
  name: true,
  description: true,
  isDefault: true,
});

// Portfolio tokens table
export const portfolioTokens = pgTable("portfolio_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id),
  tokenId: uuid("token_id").notNull().references(() => tokens.id),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull().default("0"),
  averageBuyPrice: numeric("average_buy_price", { precision: 18, scale: 8 }).notNull().default("0"),
  totalInvested: numeric("total_invested", { precision: 18, scale: 8 }).notNull().default("0"),
  currentPrice: numeric("current_price", { precision: 18, scale: 8 }).notNull().default("0"),
  totalValue: numeric("total_value", { precision: 18, scale: 8 }).notNull().default("0"),
  profitLoss: numeric("profit_loss", { precision: 18, scale: 8 }).notNull().default("0"),
  buyCount: integer("buy_count").notNull().default(0),
  sellCount: integer("sell_count").notNull().default(0),
  lastTradeDate: timestamp("last_trade_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertPortfolioTokenSchema = createInsertSchema(portfolioTokens).pick({
  userId: true,
  portfolioId: true,
  tokenId: true,
  amount: true,
  averageBuyPrice: true,
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id),
  portfolioTokenId: uuid("portfolio_token_id").notNull().references(() => portfolioTokens.id),
  tokenId: uuid("token_id").notNull().references(() => tokens.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  totalValue: numeric("total_value", { precision: 18, scale: 8 }).notNull(),
  isManual: boolean("is_manual").notNull().default(true),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  portfolioId: true,
  portfolioTokenId: true,
  tokenId: true,
  type: true,
  amount: true,
  price: true,
  totalValue: true,
  isManual: true,
  transactionDate: true,
});

// Set up relations
export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  portfolioTokens: many(portfolioTokens),
  transactions: many(transactions),
}));

export const tokensRelations = relations(tokens, ({ one, many }) => ({
  marketData: one(tokenMarketDatas),
  portfolioTokens: many(portfolioTokens),
  transactions: many(transactions),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  portfolioTokens: many(portfolioTokens),
  transactions: many(transactions),
}));

export const portfolioTokensRelations = relations(portfolioTokens, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolioTokens.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [portfolioTokens.portfolioId],
    references: [portfolios.id],
  }),
  token: one(tokens, {
    fields: [portfolioTokens.tokenId],
    references: [tokens.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [transactions.portfolioId],
    references: [portfolios.id],
  }),
  portfolioToken: one(portfolioTokens, {
    fields: [transactions.portfolioTokenId],
    references: [portfolioTokens.id],
  }),
  token: one(tokens, {
    fields: [transactions.tokenId],
    references: [tokens.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;

export type TokenMarketData = typeof tokenMarketDatas.$inferSelect;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type PortfolioToken = typeof portfolioTokens.$inferSelect;
export type InsertPortfolioToken = z.infer<typeof insertPortfolioTokenSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
