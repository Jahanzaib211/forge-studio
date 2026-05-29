import { Request, Response } from "express";
import axios from "axios";
import { providerService } from "./provider_service";
import { customProviderService } from "./custom_provider";
import { directProxyStream } from "./direct_proxy";
import { errorLogger } from "./error_logger";

const TASK_TYPE_MODEL_MAP: Record<string, string> = {
  chat: "fast-70b",
  coding: "coder",
  vision: "gemini-flash",
  fast: "fast-8b",
  long_context: "smart",
  local: "qwen-moe",
};

export async function handleStreamChat(req: Request, res: Response) {
  const { messages, taskType, maxTokens, temperature, model: directModel } = req.body;

  const model = directModel || TASK_TYPE_MODEL_MAP[taskType || "chat"] || "fast-70b";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Check custom providers first (standalone mode)
  const customProvider = await customProviderService.findProviderForModel(model);
  if (customProvider) {
    try {
      const upstream = await directProxyStream({
        messages: messages || [],
        model,
        apiUrl: customProvider.apiUrl,
        apiKey: customProvider.apiKey,
        maxTokens: maxTokens || 1024,
        temperature: temperature || 0.7,
        stream: true,
      });

      const reader = upstream.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
          }
        } catch {
          // stream ended
        }
      } else {
        const text = await upstream.text();
        res.write(text);
      }

      providerService.recordSuccess(`custom:${customProvider.name}`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err: any) {
      providerService.recordFailure(`custom:${customProvider.name}`);
      errorLogger.error("stream_handler", `Custom provider ${customProvider.name} failed for model ${model}: ${err.message}`, err, { model, provider: customProvider.name });
      const errorData = {
        choices: [{ delta: { content: `Error from ${customProvider.name}: ${err.message}` }, finish_reason: "error" }],
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
  }

  // Fall back to LiteLLM
  const litellmUrl = process.env.LITELLM_URL || "http://localhost:5050";
  const litellmApiKey = process.env.LITELLM_API_KEY || "sk-ai-lab-master-key";

  const providerName = model.includes("/") ? model.split("/")[0] : model;
  const circuitOpen = await providerService.isCircuitOpen(providerName);

  if (circuitOpen) {
    const errorData = {
      choices: [{ delta: { content: `Circuit breaker open for ${providerName}` }, finish_reason: "error" }],
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  try {
    const response = await axios.post(
      `${litellmUrl}/v1/chat/completions`,
      {
        model,
        messages: messages || [],
        max_tokens: maxTokens || 1024,
        temperature: temperature || 0.7,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${litellmApiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 120000,
        responseType: "stream",
      }
    );

    let fullContent = "";
    let tokenCount = 0;

    response.data.on("data", (chunk: Buffer) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            providerService.recordSuccess(providerName);
            errorLogger.info("stream_handler", "Chat completion served", {
              model,
              taskType,
              provider: providerName,
              tokens: tokenCount,
            });
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              tokenCount++;
            }
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          } catch {}
        }
      }
    });

    response.data.on("error", (err: Error) => {
      providerService.recordFailure(providerName);
      errorLogger.error("stream_handler", `LiteLLM stream error for model ${model}: ${err.message}`, err, { model, provider: providerName });
      const errorData = {
        choices: [{ delta: { content: `\n\n[Stream error: ${err.message}]` }, finish_reason: "error" }],
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    });
  } catch (error: any) {
    providerService.recordFailure(providerName);
    errorLogger.error("stream_handler", `LiteLLM request failed for model ${model}: ${error.message}`, error, { model, provider: providerName });
    const errorData = {
      choices: [{ delta: { content: `Error: ${error.message}` }, finish_reason: "error" }],
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
