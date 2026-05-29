import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { guardrails, policies } from "../../drizzle/schema";
import { guardrailService } from "../services/guardrail_service";

export const guardrailRouter = router({
  guardrails: {
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const result = await db.select().from(guardrails);
      return result;
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(guardrails)
          .where(eq(guardrails.id, input.id))
          .limit(1);

        if (result.length === 0) throw new Error("Guardrail not found");
        return result[0];
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          type: z.enum(["pre_call", "post_call"]).default("pre_call"),
          config: z
            .object({
              piiDetection: z.boolean().optional(),
              injectionBlocking: z.boolean().optional(),
              contentSafety: z.boolean().optional(),
              customPatterns: z.array(z.string()).optional(),
            })
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await guardrailService.createGuardrail(input);
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          config: z
            .object({
              piiDetection: z.boolean().optional(),
              injectionBlocking: z.boolean().optional(),
              contentSafety: z.boolean().optional(),
              customPatterns: z.array(z.string()).optional(),
            })
            .optional(),
          enabled: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const success = await guardrailService.updateGuardrail(id, updates);
        return { success };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const success = await guardrailService.deleteGuardrail(input.id);
        return { success };
      }),
  },

  policies: {
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      const result = await db.select().from(policies);
      return result;
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(policies)
          .where(eq(policies.id, input.id))
          .limit(1);

        if (result.length === 0) throw new Error("Policy not found");
        return result[0];
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          guardrailIds: z.array(z.string()).optional(),
          teamIds: z.array(z.string()).optional(),
          keyIds: z.array(z.string()).optional(),
          modelPatterns: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .insert(policies)
          .values(input)
          .returning({ id: policies.id });

        return { id: result[0].id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          guardrailIds: z.array(z.string()).optional(),
          teamIds: z.array(z.string()).optional(),
          keyIds: z.array(z.string()).optional(),
          modelPatterns: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { id, ...updates } = input;
        await db.update(policies).set(updates).where(eq(policies.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(policies).where(eq(policies.id, input.id));
        return { success: true };
      }),
  },
});
