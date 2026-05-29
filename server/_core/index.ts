import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { WebSocketServer } from "ws";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStreamChat } from "../services/stream_handler";
import { startSystemMonitor } from "../services/system_monitor";
import { mcpRouter } from "../services/mcp_server";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Global error handler
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(`[ERROR] ${new Date().toISOString()}:`, err.message);
      console.error(err.stack);
      res.status(500).json({ error: "Internal server error" });
    }
  );

  // Mock auth
  app.get("/auth/mock", (req, res) => {
    res.cookie("session", "mock-session-token", {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });
    const returnPath = (req.query.returnPath as string) || "/";
    res.redirect(returnPath);
  });

  // Stream chat endpoint
  app.post("/api/stream/chat", express.json(), handleStreamChat);

  // tRPC middleware
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // OpenAI-compatible chat completions
  const preferredPort = parseInt(process.env.PORT || "5051");
  const port = await findAvailablePort(preferredPort);

  app.post("/v1/chat/completions", async (req, res) => {
    try {
      const { messages, model } = req.body;

      const modelTaskMap: Record<string, string> = {
        "forge-chat": "chat",
        "forge-coder": "coding",
        "forge-vision": "vision",
        "forge-fast": "fast",
        "forge-long-context": "long_context",
        "forge-local": "local",
      };
      const taskType = modelTaskMap[model?.toLowerCase()] || "chat";

      const response = await fetch(
        `http://localhost:${port}/api/trpc/chat.complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: "session=mock-session-token",
          },
          body: JSON.stringify({ json: { messages, taskType } }),
        }
      );

      const data = await response.json();
      const result = data?.result?.data?.json || data;

      res.json({
        id: "forge-" + Date.now(),
        object: "chat.completion",
        created: Date.now(),
        model: model || "forge-chat",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: result.choices?.[0]?.message?.content || "",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: result.usage?.prompt_tokens,
          completion_tokens: result.usage?.completion_tokens,
          total_tokens: result.usage?.total_tokens,
        },
      });
    } catch (err: any) {
      console.error("[/v1/chat/completions] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Model list endpoint for OpenAI-compatible tools
  app.get("/v1/models", (_req, res) => {
    res.json({
      object: "list",
      data: [
        { id: "forge-chat", object: "model" },
        { id: "forge-coder", object: "model" },
        { id: "forge-vision", object: "model" },
        { id: "forge-fast", object: "model" },
        { id: "forge-long-context", object: "model" },
        { id: "forge-local", object: "model" },
      ],
    });
  });

  // MCP server routes
  app.use(mcpRouter);

  // API docs endpoint
  app.get("/api-docs", (_req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forge Studio — API Reference</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; background: linear-gradient(90deg, #60a5fa, #a78bfa, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .endpoint { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
    .method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; margin-right: 0.5rem; }
    .method.post { background: #166534; color: #4ade80; }
    .method.get { background: #1e3a5f; color: #60a5fa; }
    .path { font-family: monospace; font-size: 0.9rem; color: #f8fafc; }
    .desc { color: #94a3b8; margin-top: 0.5rem; font-size: 0.875rem; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Forge Studio API</h1>
    <p class="subtitle">v3.0.0 — <a href="/">← Back to Dashboard</a></p>
    <div class="endpoint">
      <span class="method post">POST</span><span class="path">/v1/chat/completions</span>
      <p class="desc">OpenAI-compatible chat completions endpoint. Send messages and receive AI responses.</p>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span><span class="path">/v1/models</span>
      <p class="desc">List all available models for use with the completions endpoint.</p>
    </div>
    <div class="endpoint">
      <span class="method post">POST</span><span class="path">/api/stream/chat</span>
      <p class="desc">Streaming chat endpoint with token-by-token SSE rendering.</p>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span><span class="path">/api/trpc/*</span>
      <p class="desc">tRPC router for all internal operations. Use the tRPC client for typed queries and mutations.</p>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span><span class="path">/mcp/sse</span>
      <p class="desc">MCP (Model Context Protocol) Server-Sent Events endpoint for tool discovery.</p>
    </div>
    <div class="endpoint">
      <span class="method get">GET</span><span class="path">/health</span>
      <p class="desc">System health check — returns status of database, Redis, and providers.</p>
    </div>
  </div>
</body>
</html>`);
  });

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // WebSocket server for real-time system stats
  const wss = new WebSocketServer({ server, path: "/ws" });
  startSystemMonitor(wss);

  wss.on("connection", (ws) => {
    console.log("[WS] Client connected");
    ws.on("close", () => {
      console.log("[WS] Client disconnected");
    });
  });

  server.listen(port, () => {
    console.log(`Forge Studio server running on http://localhost:${port}/`);
    console.log(`  WebSocket: ws://localhost:${port}/ws`);
    console.log(`  API Docs:  http://localhost:${port}/api-docs`);
    console.log(`  MCP SSE:   http://localhost:${port}/mcp/sse`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
