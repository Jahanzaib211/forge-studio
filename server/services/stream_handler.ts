import { Request, Response } from "express";
import axios from "axios";
import { providerService } from "./provider_service";

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
  const litellmUrl = process.env.LITELLM_URL || "http://localhost:5050";
  const litellmApiKey = process.env.LITELLM_API_KEY || "sk-ai-lab-master-key";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

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
      const errorData = {
        choices: [{ delta: { content: `\n\n[Stream error: ${err.message}]` }, finish_reason: "error" }],
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    });
  } catch (error: any) {
    providerService.recordFailure(providerName);
    const errorData = {
      choices: [{ delta: { content: `Error: ${error.message}` }, finish_reason: "error" }],
    };
    res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
