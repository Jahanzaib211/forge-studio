import crypto from "crypto";
import bcrypt from "bcrypt";
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import { getDb } from "../db";
import { virtualKeys } from "../../drizzle/schema";

const KEY_PREFIX = "sk-";
const KEY_LENGTH = 48;
const BCRYPT_ROUNDS = 12;

interface CreateKeyInput {
  name: string;
  teamId?: number;
  budgetLimitUsd?: number;
  rateLimitTPM?: number;
  rateLimitRPM?: number;
  models?: string[];
  metadata?: string;
  expiresAt?: Date;
}

interface VirtualKeyRecord {
  id: number;
  name: string;
  keyHash: string;
  keyPrefix: string;
  teamId: number;
  budgetLimitUsd: number;
  rateLimitTPM: number;
  rateLimitRPM: number;
  models: string[] | null;
  metadata: string | null;
  enabled: number;
  spendUsd: number;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

interface KeyCreationResult {
  id: number;
  key: string;
  keyPrefix: string;
  name: string;
}

export class VirtualKeyService {
  generateKey(): string {
    const randomBytes = crypto.randomBytes(KEY_LENGTH / 2);
    const hex = randomBytes.toString("hex");
    return `${KEY_PREFIX}${hex}`;
  }

  async hashKey(key: string): Promise<string> {
    return bcrypt.hash(key, BCRYPT_ROUNDS);
  }

  async verifyKey(key: string, hash: string): Promise<boolean> {
    return bcrypt.compare(key, hash);
  }

  async createKey(input: CreateKeyInput): Promise<KeyCreationResult> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const key = this.generateKey();
    const keyHash = await this.hashKey(key);
    const keyPrefix = key.substring(0, 10) + "...";

    const result = await db
      .insert(virtualKeys)
      .values({
        name: input.name,
        keyHash,
        keyPrefix,
        teamId: input.teamId || 1,
        budgetLimitUsd: input.budgetLimitUsd || 10,
        rateLimitTPM: input.rateLimitTPM || 100000,
        rateLimitRPM: input.rateLimitRPM || 1000,
        models: input.models || null,
        metadata: input.metadata || null,
        expiresAt: input.expiresAt || null,
      })
      .returning({ id: virtualKeys.id });

    return {
      id: result[0].id,
      key,
      keyPrefix,
      name: input.name,
    };
  }

  async getKeyById(id: number): Promise<VirtualKeyRecord | null> {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(virtualKeys)
      .where(eq(virtualKeys.id, id))
      .limit(1);

    return result.length > 0 ? (result[0] as VirtualKeyRecord) : null;
  }

  async getKeyByHash(keyHash: string): Promise<VirtualKeyRecord | null> {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(virtualKeys)
      .where(eq(virtualKeys.keyHash, keyHash))
      .limit(1);

    return result.length > 0 ? (result[0] as VirtualKeyRecord) : null;
  }

  async listKeys(teamId?: number): Promise<VirtualKeyRecord[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const conditions = teamId ? eq(virtualKeys.teamId, teamId) : undefined;

      const result = await db
        .select()
        .from(virtualKeys)
        .where(conditions)
        .orderBy(virtualKeys.createdAt);

      return result as VirtualKeyRecord[];
    } catch {
      return [];
    }
  }

  async updateKey(
    id: number,
    updates: Partial<Omit<CreateKeyInput, "name"> & { enabled: number }>
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    try {
      await db
        .update(virtualKeys)
        .set(updates)
        .where(eq(virtualKeys.id, id));

      return true;
    } catch {
      return false;
    }
  }

  async deleteKey(id: number): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    try {
      await db.delete(virtualKeys).where(eq(virtualKeys.id, id));
      return true;
    } catch {
      return false;
    }
  }

  async incrementSpend(id: number, amountUsd: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    await db
      .update(virtualKeys)
      .set({
        spendUsd: sql`${virtualKeys.spendUsd} + ${Math.round(amountUsd * 1000000)}`,
        lastUsedAt: new Date(),
      })
      .where(eq(virtualKeys.id, id));
  }

  async validateKey(key: string): Promise<{
    valid: boolean;
    keyRecord?: VirtualKeyRecord;
    error?: string;
  }> {
    const db = await getDb();
    if (!db) return { valid: false, error: "Database not available" };

    const result = await db
      .select()
      .from(virtualKeys)
      .where(
        and(
          eq(virtualKeys.enabled, 1),
          isNull(virtualKeys.expiresAt)
        )
      );

    for (const record of result) {
      const match = await this.verifyKey(key, record.keyHash);
      if (match) {
        const keyRecord = record as VirtualKeyRecord;

        if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
          return { valid: false, error: "Key expired" };
        }

        if (keyRecord.budgetLimitUsd > 0 && keyRecord.spendUsd >= keyRecord.budgetLimitUsd) {
          return { valid: false, error: "Budget limit exceeded" };
        }

        return { valid: true, keyRecord };
      }
    }

    return { valid: false, error: "Invalid key" };
  }

  async getKeysByTeamId(teamId: number): Promise<VirtualKeyRecord[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const result = await db
        .select()
        .from(virtualKeys)
        .where(eq(virtualKeys.teamId, teamId))
        .orderBy(virtualKeys.createdAt);

      return result as VirtualKeyRecord[];
    } catch {
      return [];
    }
  }
}

export const virtualKeyService = new VirtualKeyService();
