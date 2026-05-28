import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const teams = pgTable("teams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: integer("ownerId").notNull(),
  monthlyBudgetUsd: integer("monthlyBudgetUsd").default(10).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export const apiKeys = pgTable("apiKeys", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("teamId").notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

export const providers = pgTable("providers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  litellmEndpoint: varchar("litellmEndpoint", { length: 512 }).notNull(),
  enabled: integer("enabled").default(1).notNull(),
  qualityScore: integer("qualityScore").default(50).notNull(),
  latencyMs: integer("latencyMs").default(500).notNull(),
  costPerMToken: integer("costPerMToken").default(100).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

export const requestHistory = pgTable("requestHistory", {
  id: varchar("id", { length: 64 }).primaryKey(),
  teamId: integer("teamId").notNull(),
  providerId: integer("providerId"),
  taskType: varchar("taskType", { length: 32 }).notNull(),
  inputTokens: integer("inputTokens").default(0).notNull(),
  outputTokens: integer("outputTokens").default(0).notNull(),
  totalTokens: integer("totalTokens").default(0).notNull(),
  costUsd: integer("costUsd").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("success").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RequestHistory = typeof requestHistory.$inferSelect;
export type InsertRequestHistory = typeof requestHistory.$inferInsert;

export const budgetLimits = pgTable("budgetLimits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("teamId").notNull().unique(),
  monthlyLimitUsd: integer("monthlyLimitUsd").default(10).notNull(),
  currentSpendUsd: integer("currentSpendUsd").default(0).notNull(),
  monthYear: varchar("monthYear", { length: 7 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BudgetLimit = typeof budgetLimits.$inferSelect;
export type InsertBudgetLimit = typeof budgetLimits.$inferInsert;

export const auditLogs = pgTable("auditLogs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId"),
  teamId: integer("teamId"),
  action: varchar("action", { length: 255 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
