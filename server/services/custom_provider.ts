import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { customProviders, type CustomProvider, type InsertCustomProvider } from "../../drizzle/schema";

export interface AddProviderInput {
  name: string;
  apiUrl: string;
  apiKey: string;
  models?: string;
}

export interface TestResult {
  success: boolean;
  response?: string;
  latencyMs: number;
  error?: string;
}

export class CustomProviderService {
  async list(): Promise<CustomProvider[]> {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(customProviders).orderBy(customProviders.createdAt);
  }

  async getById(id: number): Promise<CustomProvider | undefined> {
    const db = await getDb();
    if (!db) return undefined;
    const result = await db.select().from(customProviders).where(eq(customProviders.id, id)).limit(1);
    return result[0];
  }

  async add(input: AddProviderInput): Promise<{ provider: CustomProvider; models: string[] }> {
    const normalizedUrl = input.apiUrl.replace(/\/+$/, "");

    const models = await this.fetchModels(normalizedUrl, input.apiKey);

    if (models.length === 0) {
      throw new Error("No models found at this endpoint. Verify the URL and API key.");
    }

    const modelString = input.models || models.join(",");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(customProviders).values({
      name: input.name,
      apiUrl: normalizedUrl,
      apiKey: input.apiKey,
      models: modelString,
      enabled: 1,
    }).returning();

    return { provider: result[0], models };
  }

  async delete(id: number): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;
    await db.delete(customProviders).where(eq(customProviders.id, id));
    return true;
  }

  async toggleEnabled(id: number, enabled: boolean): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;
    await db.update(customProviders).set({ enabled: enabled ? 1 : 0 }).where(eq(customProviders.id, id));
    return true;
  }

  async fetchModels(apiUrl: string, apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`${apiUrl}/v1/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const models: string[] = [];

      if (Array.isArray(data)) {
        for (const m of data) {
          if (m.id) models.push(m.id);
        }
      } else if (data.data && Array.isArray(data.data)) {
        for (const m of data.data) {
          if (m.id) models.push(m.id);
        }
      }

      return models;
    } catch {
      return [];
    }
  }

  async test(id: number): Promise<TestResult> {
    const provider = await this.getById(id);
    if (!provider) return { success: false, latencyMs: 0, error: "Provider not found" };

    const models = provider.models.split(",").map((m) => m.trim()).filter(Boolean);
    if (models.length === 0) return { success: false, latencyMs: 0, error: "No models configured" };

    const startTime = Date.now();
    try {
      const response = await fetch(`${provider.apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: models[0],
          messages: [{ role: "user", content: "Say 'hello' in one word." }],
          max_tokens: 10,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errText = await response.text().catch(() => "Unknown error");
        return { success: false, latencyMs, error: `HTTP ${response.status}: ${errText}` };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return { success: true, latencyMs, response: content };
    } catch (err: any) {
      return { success: false, latencyMs: Date.now() - startTime, error: err.message };
    }
  }

  async findProviderForModel(modelName: string): Promise<CustomProvider | null> {
    const providers = await this.list();
    for (const p of providers) {
      if (p.enabled !== 1) continue;
      const models = p.models.split(",").map((m) => m.trim());
      if (models.includes(modelName)) return p;
    }
    return null;
  }
}

export const customProviderService = new CustomProviderService();
