import { pgTable, text, varchar, uuid, numeric, timestamp, boolean, integer, pgEnum, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums based on the database structure
export const transactionTypeEnum = pgEnum('enum_transactions_type', ['buy', 'sell']);
export const timeframeEnum = pgEnum('enum_timeframe', ['daily', 'weekly', 'monthly']);
export const alertTypeEnum = pgEnum('enum_alert_type', ['price_above', 'price_below', 'percent_change', 'volume_above', 'market_cap_above']);
export const alertStatusEnum = pgEnum('enum_alert_status', ['active', 'triggered', 'disabled']);

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

// Portfolio historical performance table
export const portfolioHistoricalValues = pgTable("portfolio_historical_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  totalValue: numeric("total_value", { precision: 18, scale: 2 }).notNull(),
  totalInvested: numeric("total_invested", { precision: 18, scale: 2 }).notNull(),
  profitLoss: numeric("profit_loss", { precision: 18, scale: 2 }).notNull(),
  profitLossPercentage: numeric("profit_loss_percentage", { precision: 10, scale: 2 }).notNull(),
  timeframe: timeframeEnum("timeframe").notNull().default('daily'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertPortfolioHistoricalValueSchema = createInsertSchema(portfolioHistoricalValues).pick({
  portfolioId: true,
  userId: true,
  date: true,
  totalValue: true,
  totalInvested: true,
  profitLoss: true,
  profitLossPercentage: true,
  timeframe: true,
});

// Token historical performance within portfolio
export const tokenHistoricalValues = pgTable("token_historical_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id),
  portfolioTokenId: uuid("portfolio_token_id").notNull().references(() => portfolioTokens.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  tokenId: uuid("token_id").notNull().references(() => tokens.id),
  date: date("date").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  totalValue: numeric("total_value", { precision: 18, scale: 2 }).notNull(),
  totalInvested: numeric("total_invested", { precision: 18, scale: 2 }).notNull(),
  profitLoss: numeric("profit_loss", { precision: 18, scale: 2 }).notNull(),
  profitLossPercentage: numeric("profit_loss_percentage", { precision: 10, scale: 2 }).notNull(),
  timeframe: timeframeEnum("timeframe").notNull().default('daily'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertTokenHistoricalValueSchema = createInsertSchema(tokenHistoricalValues).pick({
  portfolioId: true,
  portfolioTokenId: true,
  userId: true,
  tokenId: true,
  date: true,
  quantity: true,
  price: true,
  totalValue: true,
  totalInvested: true,
  profitLoss: true,
  profitLossPercentage: true,
  timeframe: true,
});

// Set up relations
export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  portfolioTokens: many(portfolioTokens),
  transactions: many(transactions),
  portfolioHistoricalValues: many(portfolioHistoricalValues),
  tokenHistoricalValues: many(tokenHistoricalValues),
  alerts: many(alerts),
}));

export const tokensRelations = relations(tokens, ({ one, many }) => ({
  marketData: one(tokenMarketDatas),
  portfolioTokens: many(portfolioTokens),
  transactions: many(transactions),
  historicalValues: many(tokenHistoricalValues),
  alerts: many(alerts),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  portfolioTokens: many(portfolioTokens),
  transactions: many(transactions),
  historicalValues: many(portfolioHistoricalValues),
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
  historicalValues: many(tokenHistoricalValues),
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

export const portfolioHistoricalValuesRelations = relations(portfolioHistoricalValues, ({ one }) => ({
  user: one(users, {
    fields: [portfolioHistoricalValues.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [portfolioHistoricalValues.portfolioId],
    references: [portfolios.id],
  }),
}));

export const tokenHistoricalValuesRelations = relations(tokenHistoricalValues, ({ one }) => ({
  user: one(users, {
    fields: [tokenHistoricalValues.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [tokenHistoricalValues.portfolioId],
    references: [portfolios.id],
  }),
  portfolioToken: one(portfolioTokens, {
    fields: [tokenHistoricalValues.portfolioTokenId],
    references: [portfolioTokens.id],
  }),
  token: one(tokens, {
    fields: [tokenHistoricalValues.tokenId],
    references: [tokens.id],
  }),
}));

// Alerts table
export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  tokenId: uuid("token_id").notNull().references(() => tokens.id),
  alertType: alertTypeEnum("alert_type").notNull(),
  threshold: numeric("threshold", { precision: 18, scale: 8 }).notNull(),
  status: alertStatusEnum("status").notNull().default('active'),
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationMethod: varchar("notification_method", { length: 50 }).notNull().default('app'),
  lastTriggeredAt: timestamp("last_triggered_at"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  userId: true,
  tokenId: true,
  alertType: true,
  threshold: true,
  notificationMethod: true,
  name: true,
  description: true,
});

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  token: one(tokens, {
    fields: [alerts.tokenId],
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

export type PortfolioHistoricalValue = typeof portfolioHistoricalValues.$inferSelect;
export type InsertPortfolioHistoricalValue = z.infer<typeof insertPortfolioHistoricalValueSchema>;

export type TokenHistoricalValue = typeof tokenHistoricalValues.$inferSelect;
export type InsertTokenHistoricalValue = z.infer<typeof insertTokenHistoricalValueSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
