import {
  pgTable,
  text,
  varchar,
  uuid,
  numeric,
  timestamp,
  boolean,
  integer,
  pgEnum,
  date,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define enums based on the database structure
export const transactionTypeEnum = pgEnum("enum_transactions_type", [
  "buy",
  "sell",
]);
export const timeframeEnum = pgEnum("enum_timeframe", [
  "daily",
  "weekly",
  "monthly",
]);
export const alertTypeEnum = pgEnum("enum_alert_type", [
  "price_above",
  "price_below",
  "percent_change",
  "volume_above",
  "market_cap_above",
]);
export const alertStatusEnum = pgEnum("enum_alert_status", [
  "active",
  "triggered",
  "disabled",
]);
export const learningModuleStatusEnum = pgEnum("enum_learning_module_status", [
  "not_started",
  "in_progress",
  "completed",
]);
export const learningCategoryEnum = pgEnum("enum_learning_category", [
  "basics",
  "trading",
  "defi",
  "security",
  "advanced",
]);
export const authProviderEnum = pgEnum("enum_authentications_provider", [
  "email",
  "google",
  "github",
  "ethereum",
  "solana",
  "base",
  "sui",
]);
export const walletTypeEnum = pgEnum("enum_wallet_type", [
  "ethereum",
  "solana",
  "base",
  "sui",
]);

// User table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  // Keep walletAddress and walletType for backward compatibility
  walletAddress: varchar("wallet_address", { length: 255 }).unique(),
  walletType: walletTypeEnum("wallet_type"),
  provider: authProviderEnum("provider").notNull().default("email"),
  providerUserId: varchar("provider_user_id", { length: 255 }),
  profileImage: varchar("profile_image", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  isAdmin: boolean("is_admin").default(false),
  version: integer("version").default(0), // Record version for JWT validation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Wallet addresses table - to store multiple wallet addresses for a user
export const userWallets = pgTable("user_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  address: varchar("address", { length: 255 }).notNull(),
  chainType: walletTypeEnum("chain_type").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Learning Modules
export const learningModules = pgTable("learning_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  category: learningCategoryEnum("category").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  order: integer("order").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(10),
  imageUrl: varchar("image_url", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Learning Module Quizzes
export const learningQuizzes = pgTable("learning_quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => learningModules.id),
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctOption: integer("correct_option").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User Learning Progress
export const userLearningProgress = pgTable("user_learning_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  moduleId: uuid("module_id")
    .notNull()
    .references(() => learningModules.id),
  status: learningModuleStatusEnum("status").notNull().default("not_started"),
  lastCompletedSection: integer("last_completed_section"),
  quizScore: integer("quiz_score"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  walletAddress: true,
  walletType: true,
  provider: true,
  providerUserId: true,
  profileImage: true,
  displayName: true,
  isAdmin: true,
  version: true,
});

export const insertUserWalletSchema = createInsertSchema(userWallets).pick({
  userId: true,
  address: true,
  chainType: true,
  isDefault: true,
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
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

export const updateTokenSchema = createUpdateSchema(tokens).pick({
  symbol: true,
  name: true,
  description: true,
  imageUrl: true,
  chain: true,
  contractAddress: true,
  decimals: true,
  isVerified: true,
});

// Token market data
export const tokenMarketDatas = pgTable("token_market_datas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenId: uuid("token_id")
    .notNull()
    .references(() => tokens.id),
  marketCap: numeric("market_cap").notNull(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  priceChange24h: numeric("price_change_24h", {
    precision: 10,
    scale: 2,
  }).notNull(),
  priceChange7d: numeric("price_change_7d", {
    precision: 10,
    scale: 2,
  }).notNull(),
  priceChange30d: numeric("price_change_30d", {
    precision: 10,
    scale: 2,
  }).notNull(),
  volume24h: numeric("volume_24h").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Portfolio table
export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  isWatchlist: boolean("is_watchlist").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).pick({
  userId: true,
  name: true,
  description: true,
  isDefault: true,
  isWatchlist: true,
});

// Portfolio tokens table
export const portfolioTokens = pgTable("portfolio_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  tokenId: uuid("token_id")
    .notNull()
    .references(() => tokens.id),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull().default("0"),
  averageBuyPrice: numeric("average_buy_price", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  totalInvested: numeric("total_invested", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  currentPrice: numeric("current_price", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  totalValue: numeric("total_value", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  profitLoss: numeric("profit_loss", { precision: 18, scale: 8 })
    .notNull()
    .default("0"),
  buyCount: integer("buy_count").notNull().default(0),
  sellCount: integer("sell_count").notNull().default(0),
  lastTradeDate: timestamp("last_trade_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPortfolioTokenSchema = createInsertSchema(
  portfolioTokens,
).pick({
  userId: true,
  portfolioId: true,
  tokenId: true,
  amount: true,
  averageBuyPrice: true,
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  portfolioTokenId: uuid("portfolio_token_id")
    .notNull()
    .references(() => portfolioTokens.id),
  tokenId: uuid("token_id")
    .notNull()
    .references(() => tokens.id),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  totalValue: numeric("total_value", { precision: 18, scale: 8 }).notNull(),
  isManual: boolean("is_manual").notNull().default(true),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
export const portfolioHistoricalValues = pgTable(
  "portfolio_historical_values",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    date: date("date").notNull(),
    totalValue: numeric("total_value", { precision: 18, scale: 2 }).notNull(),
    totalInvested: numeric("total_invested", {
      precision: 18,
      scale: 2,
    }).notNull(),
    profitLoss: numeric("profit_loss", { precision: 18, scale: 2 }).notNull(),
    profitLossPercentage: numeric("profit_loss_percentage", {
      precision: 10,
      scale: 2,
    }).notNull(),
    timeframe: timeframeEnum("timeframe").notNull().default("daily"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);

export const insertPortfolioHistoricalValueSchema = createInsertSchema(
  portfolioHistoricalValues,
).pick({
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
  portfolioId: uuid("portfolio_id")
    .notNull()
    .references(() => portfolios.id),
  portfolioTokenId: uuid("portfolio_token_id")
    .notNull()
    .references(() => portfolioTokens.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenId: uuid("token_id")
    .notNull()
    .references(() => tokens.id),
  date: date("date").notNull(),
  quantity: numeric("quantity", { precision: 18, scale: 8 }).notNull(),
  price: numeric("price", { precision: 18, scale: 8 }).notNull(),
  totalValue: numeric("total_value", { precision: 18, scale: 2 }).notNull(),
  totalInvested: numeric("total_invested", {
    precision: 18,
    scale: 2,
  }).notNull(),
  profitLoss: numeric("profit_loss", { precision: 18, scale: 2 }).notNull(),
  profitLossPercentage: numeric("profit_loss_percentage", {
    precision: 10,
    scale: 2,
  }).notNull(),
  timeframe: timeframeEnum("timeframe").notNull().default("daily"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTokenHistoricalValueSchema = createInsertSchema(
  tokenHistoricalValues,
).pick({
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
// Insert schemas for learning models
export const insertLearningModuleSchema = createInsertSchema(
  learningModules,
).pick({
  title: true,
  description: true,
  content: true,
  category: true,
  difficulty: true,
  order: true,
  estimatedMinutes: true,
  imageUrl: true,
});

export const insertLearningQuizSchema = createInsertSchema(
  learningQuizzes,
).pick({
  moduleId: true,
  question: true,
  options: true,
  correctOption: true,
  explanation: true,
  order: true,
});

export const insertUserLearningProgressSchema = createInsertSchema(
  userLearningProgress,
).pick({
  userId: true,
  moduleId: true,
  status: true,
  lastCompletedSection: true,
  quizScore: true,
  startedAt: true,
  completedAt: true,
});

export const usersRelations = relations(users, ({ many }) => ({
  portfolios: many(portfolios),
  portfolioTokens: many(portfolioTokens),
  transactions: many(transactions),
  portfolioHistoricalValues: many(portfolioHistoricalValues),
  tokenHistoricalValues: many(tokenHistoricalValues),
  alerts: many(alerts),
  learningProgress: many(userLearningProgress),
  wallets: many(userWallets),
}));

export const userWalletsRelations = relations(userWallets, ({ one }) => ({
  user: one(users, {
    fields: [userWallets.userId],
    references: [users.id],
  }),
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

export const portfolioTokensRelations = relations(
  portfolioTokens,
  ({ one, many }) => ({
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
  }),
);

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

export const portfolioHistoricalValuesRelations = relations(
  portfolioHistoricalValues,
  ({ one }) => ({
    user: one(users, {
      fields: [portfolioHistoricalValues.userId],
      references: [users.id],
    }),
    portfolio: one(portfolios, {
      fields: [portfolioHistoricalValues.portfolioId],
      references: [portfolios.id],
    }),
  }),
);

export const tokenHistoricalValuesRelations = relations(
  tokenHistoricalValues,
  ({ one }) => ({
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
  }),
);

// Alerts table
export const alerts = pgTable("alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenId: uuid("token_id")
    .notNull()
    .references(() => tokens.id),
  alertType: alertTypeEnum("alert_type").notNull(),
  threshold: numeric("threshold", { precision: 18, scale: 8 }).notNull(),
  status: alertStatusEnum("status").notNull().default("active"),
  notificationSent: boolean("notification_sent").notNull().default(false),
  notificationMethod: varchar("notification_method", { length: 50 })
    .notNull()
    .default("app"),
  lastTriggeredAt: timestamp("last_triggered_at"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// Learning module relations
export const learningModulesRelations = relations(
  learningModules,
  ({ many }) => ({
    quizzes: many(learningQuizzes),
    userProgress: many(userLearningProgress),
  }),
);

export const learningQuizzesRelations = relations(
  learningQuizzes,
  ({ one }) => ({
    module: one(learningModules, {
      fields: [learningQuizzes.moduleId],
      references: [learningModules.id],
    }),
  }),
);

export const userLearningProgressRelations = relations(
  userLearningProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [userLearningProgress.userId],
      references: [users.id],
    }),
    module: one(learningModules, {
      fields: [userLearningProgress.moduleId],
      references: [learningModules.id],
    }),
  }),
);

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserWallet = typeof userWallets.$inferSelect;
export type InsertUserWallet = z.infer<typeof insertUserWalletSchema>;

export type Token = typeof tokens.$inferSelect;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type UpdateToken = z.infer<typeof updateTokenSchema>;

export type TokenMarketData = typeof tokenMarketDatas.$inferSelect;

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type PortfolioToken = typeof portfolioTokens.$inferSelect;
export type InsertPortfolioToken = z.infer<typeof insertPortfolioTokenSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type PortfolioHistoricalValue =
  typeof portfolioHistoricalValues.$inferSelect;
export type InsertPortfolioHistoricalValue = z.infer<
  typeof insertPortfolioHistoricalValueSchema
>;

export type TokenHistoricalValue = typeof tokenHistoricalValues.$inferSelect;
export type InsertTokenHistoricalValue = z.infer<
  typeof insertTokenHistoricalValueSchema
>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;

export type LearningQuiz = typeof learningQuizzes.$inferSelect;
export type InsertLearningQuiz = z.infer<typeof insertLearningQuizSchema>;

export type UserLearningProgress = typeof userLearningProgress.$inferSelect;
export type InsertUserLearningProgress = z.infer<
  typeof insertUserLearningProgressSchema
>;

// Achievements table
export const achievementTypeEnum = pgEnum("enum_achievement_type", [
  "investment",
  "portfolio_value",
  "trading_volume",
  "diversification",
  "learning",
  "login_streak",
  "transaction_count",
  "profit_threshold",
]);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: achievementTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  earned: boolean("earned").notNull().default(false),
  earnedDate: timestamp("earned_date"),
  progress: integer("progress").default(0),
  maxProgress: integer("max_progress"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievements).pick({
  userId: true,
  type: true,
  title: true,
  description: true,
  icon: true,
  earned: true,
  earnedDate: true,
  progress: true,
  maxProgress: true,
});

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

// Admin tokens table for persistent admin authentication
export const adminTokens = pgTable("admin_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertAdminTokenSchema = createInsertSchema(adminTokens).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export const adminTokensRelations = relations(adminTokens, ({ one }) => ({
  user: one(users, {
    fields: [adminTokens.userId],
    references: [users.id],
  }),
}));

export type AdminToken = typeof adminTokens.$inferSelect;
export type InsertAdminToken = z.infer<typeof insertAdminTokenSchema>;
