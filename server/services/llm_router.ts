import axios from "axios";
import { providerService } from "./provider_service";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  taskType?: "chat" | "coding" | "vision" | "fast" | "long_context" | "local";
  maxTokens?: number;
  temperature?: number;
  teamId?: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  provider: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const TASK_TYPE_MODEL_MAP: Record<string, string> = {
  chat: "fast-70b",
  coding: "coder",
  vision: "gemini-flash",
  fast: "fast-8b",
  long_context: "smart",
  local: "qwen-moe",
};

export class LLMRouter {
  private litellmUrl: string;
  private litellmApiKey: string;

  constructor() {
    this.litellmUrl = process.env.LITELLM_URL || "http://localhost:5050";
    this.litellmApiKey = process.env.LITELLM_API_KEY || "sk-ai-lab-master-key";
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const model = TASK_TYPE_MODEL_MAP[request.taskType || "chat"] || "fast-70b";
    const providerName = this.extractProvider(model);

    const circuitOpen = await providerService.isCircuitOpen(providerName);
    if (circuitOpen) {
      return {
        id: `msg_${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: model,
        provider: providerName,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: `Error: Circuit breaker is open for provider ${providerName}. Too many recent failures.`,
            },
            finish_reason: "error",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    }

    try {
      const response = await axios.post(
        `${this.litellmUrl}/v1/chat/completions`,
        {
          model,
          messages: request.messages,
          max_tokens: request.maxTokens || 1024,
          temperature: request.temperature || 0.7,
        },
        {
          headers: {
            "Authorization": `Bearer ${this.litellmApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      const data = response.data;

      return {
        id: data.id || `msg_${Date.now()}`,
        object: data.object || "chat.completion",
        created: data.created || Math.floor(Date.now() / 1000),
        model: data.model || model,
        provider: this.extractProvider(data.model || model),
        choices: data.choices || [],
        usage: data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    } catch (error: any) {
      console.error("[LLMRouter] LiteLLM request failed:", error.message);

      return {
        id: `msg_${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: model,
        provider: "error",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: `Error: ${error.message || "Failed to get response from LLM provider"}`,
            },
            finish_reason: "error",
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    }
  }

  private extractProvider(model: string): string {
    if (model.includes("/")) {
      return model.split("/")[0];
    }
    return "unknown";
  }
}

export const llmRouter = new LLMRouter();
