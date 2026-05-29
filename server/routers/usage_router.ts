import { z } from "zod";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { usageLogs } from "../../drizzle/schema";

export const usageRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          model: z.string().optional(),
          status: z.string().optional(),
          virtualKeyId: z.number().optional(),
          teamId: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().int().min(1).max(500).default(50),
          offset: z.number().int().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };

      const conditions = [];

      if (input?.model) {
        conditions.push(eq(usageLogs.model, input.model));
      }
      if (input?.status) {
        conditions.push(eq(usageLogs.status, input.status));
      }
      if (input?.virtualKeyId) {
        conditions.push(eq(usageLogs.virtualKeyId, input.virtualKeyId));
      }
      if (input?.teamId) {
        conditions.push(eq(usageLogs.teamId, input.teamId));
      }
      if (input?.startDate) {
        conditions.push(gte(usageLogs.createdAt, input.startDate));
      }
      if (input?.endDate) {
        conditions.push(lte(usageLogs.createdAt, input.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(usageLogs)
        .where(whereClause);

      const total = countResult[0]?.count ?? 0;

      const logs = await db
        .select()
        .from(usageLogs)
        .where(whereClause)
        .orderBy(usageLogs.createdAt)
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);

      return { logs, total };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(usageLogs)
        .where(eq(usageLogs.id, input.id))
        .limit(1);

      if (result.length === 0) throw new Error("Usage log not found");
      return result[0];
    }),

  stats: protectedProcedure
    .input(
      z
        .object({
          virtualKeyId: z.number().optional(),
          teamId: z.number().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalRequests: 0, totalTokens: 0, totalCostUsd: 0, avgLatencyMs: 0 };

      const conditions = [];

      if (input?.virtualKeyId) {
        conditions.push(eq(usageLogs.virtualKeyId, input.virtualKeyId));
      }
      if (input?.teamId) {
        conditions.push(eq(usageLogs.teamId, input.teamId));
      }
      if (input?.startDate) {
        conditions.push(gte(usageLogs.createdAt, input.startDate));
      }
      if (input?.endDate) {
        conditions.push(lte(usageLogs.createdAt, input.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select({
          totalRequests: sql<number>`count(*)`,
          totalTokens: sql<number>`coalesce(sum(${usageLogs.totalTokens}), 0)`,
          totalCostUsd: sql<number>`coalesce(sum(${usageLogs.costUsd}), 0)`,
          avgLatencyMs: sql<number>`coalesce(avg(${usageLogs.latencyMs}), 0)`,
        })
        .from(usageLogs)
        .where(whereClause);

      return result[0];
    }),

  byModel: protectedProcedure
    .input(
      z
        .object({
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];

      if (input?.startDate) {
        conditions.push(gte(usageLogs.createdAt, input.startDate));
      }
      if (input?.endDate) {
        conditions.push(lte(usageLogs.createdAt, input.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select({
          model: usageLogs.model,
          totalRequests: sql<number>`count(*)`,
          totalTokens: sql<number>`coalesce(sum(${usageLogs.totalTokens}), 0)`,
          totalCostUsd: sql<number>`coalesce(sum(${usageLogs.costUsd}), 0)`,
          avgLatencyMs: sql<number>`coalesce(avg(${usageLogs.latencyMs}), 0)`,
        })
        .from(usageLogs)
        .where(whereClause)
        .groupBy(usageLogs.model);

      return result;
    }),
});
