import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { organizations, accessGroups } from "../../drizzle/schema";

export const organizationRouter = router({
  organizations: {
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const result = await db.select().from(organizations);
      return result;
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(organizations)
          .where(eq(organizations.id, input.id))
          .limit(1);

        if (result.length === 0) throw new Error("Organization not found");
        return result[0];
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          ownerId: z.number(),
          budgetLimitUsd: z.number().min(0).default(100),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .insert(organizations)
          .values(input)
          .returning({ id: organizations.id });

        return { id: result[0].id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          ownerId: z.number().optional(),
          budgetLimitUsd: z.number().min(0).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { id, ...updates } = input;
        await db.update(organizations).set(updates).where(eq(organizations.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(organizations).where(eq(organizations.id, input.id));
        return { success: true };
      }),
  },

  accessGroups: {
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const result = await db.select().from(accessGroups);
      return result;
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(accessGroups)
          .where(eq(accessGroups.id, input.id))
          .limit(1);

        if (result.length === 0) throw new Error("Access group not found");
        return result[0];
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          models: z.array(z.string()).optional(),
          mcpServers: z.array(z.string()).optional(),
          agents: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .insert(accessGroups)
          .values(input)
          .returning({ id: accessGroups.id });

        return { id: result[0].id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          models: z.array(z.string()).optional(),
          mcpServers: z.array(z.string()).optional(),
          agents: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { id, ...updates } = input;
        await db.update(accessGroups).set(updates).where(eq(accessGroups.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(accessGroups).where(eq(accessGroups.id, input.id));
        return { success: true };
      }),
  },
});
