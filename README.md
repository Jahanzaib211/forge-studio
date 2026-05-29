# Forge Studio — Monster AI Lab Control Center

**Made by Jahanzaib Ali** | [github.com/Jahanzaib211](https://github.com/Jahanzaib211) | [www.alilabsx.com](https://www.alilabsx.com)

A production-grade, AI lab-level LLM routing platform with intelligent provider selection, budget tracking, circuit breaking, MCP integration, skills system, system monitoring, and a Manus/Genspark-style product builder. Built with React 19, Express 4, tRPC 11, PostgreSQL, Redis, and WebSocket.

---

## Features

### AI Gateway
- **Virtual Keys**: API key management with budget limits, rate limits (TPM/RPM), model restrictions, key rotation
- **Playground**: Streaming chat with model selection, task types, real-time token/latency tracking
- **Models + Endpoints**: LiteLLM config management, add/remove/test models without restart
- **Agentic**: Agent management with system prompts, tools, MCP servers, A2A protocol support
- **MCP Servers**: Host + Server (Model Context Protocol) - connect to external MCP servers, expose Forge Studio as MCP server
- **Skills**: Filesystem-based SKILL.md system with progressive disclosure and script execution
- **Guardrails**: Pre/during/post-call content filtering (PII detection, injection blocking, toxicity)
- **Policies**: Group guardrails and attach to teams/keys/models
- **Tools**: Search tools, vector stores, tool policies

### Forge Builder (Manus/Genspark-style)
- **Resource Tree**: Browse models, MCP servers, skills from the lab
- **Builder Canvas**: Add workflow blocks (System Prompt, Model Selection, Tool Config, Schema, Workflow Steps, Code Block)
- **Test Panel**: Run test queries with streaming output
- **Deploy**: Save to localStorage, export as JSON, deploy as agent
- **Real-time**: Live preview of configuration

### Observability
- **Usage**: Analytics dashboard with spend/token tracking per key/team/model
- **Logs**: Detailed request logs with filtering, CSV export
- **Guardrails Monitor**: Execution results, detection details, policy matches

### Access Control
- **Teams**: Multi-tenant team management with budgets
- **Internal Users**: User role management (admin/member/viewer)
- **Organizations**: Multi-tenant org isolation
- **Access Groups**: Reusable resource sets (models, MCP servers, agents)
- **Budgets**: Per-team budget tracking with real-time spend

### System
- **System Monitor**: Real-time CPU/GPU/RAM monitoring via WebSocket (1s updates)
  - Per-core CPU usage gauges
  - RAM/Swap usage with progress bars
  - GPU utilization, VRAM, temperature, power, fan speed (via nvidia-smi)
  - Per-process GPU VRAM attribution
  - AI process detection (Ollama, llama.cpp, Python, vLLM)
  - Top processes table with kill capability
- **Process Manager**: PM2 process management (start/stop/restart/delete/logs)
- **LLM Discoverer**: Auto-detect local LLMs from Ollama, llama.cpp, GGUF files, HuggingFace cache

### Developer Tools
- **API Reference**: Interactive Swagger documentation
- **AI Hub**: Public model catalog for developers
- **OpenAI Compatible**: `/v1/chat/completions` endpoint

### Inference Lab
- **GPU Offloading**: Configure GPU layers (ngl 0-100) from GUI
- **Context/Batch**: Context size, batch size, ubatch size sliders
- **Advanced**: Flash attention, KV cache quantization, rope scaling, parallel sequences
- **Real-time GPU Stats**: VRAM usage, utilization, temperature during inference
- **Model Info**: File size, quantization, VRAM estimates

### Settings
- **Admin Config**: SSO, default team, UI visibility
- **Branding**: Logo, app name, color theme
- **Theme Toggle**: Light/Dark mode

---

## Architecture

```
Browser ──→ Forge Studio (port 5051) ──→ LiteLLM Proxy (5050) ──→ 30+ models
                    │                          │
                    ├──→ PostgreSQL (5434)       ├──→ Groq (free)
                    ├──→ Redis (6379)            ├──→ Gemini (free)
                    ├──→ WebSocket (/ws)         ├──→ Mistral (free)
                    └──→ MCP SSE (/mcp/sse)      ├──→ Cerebras (free)
                                                 ├──→ SambaNova (free)
                                                 ├──→ Ollama (local)
                                                 └──→ llama.cpp (local)
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind 4, shadcn/ui, Recharts, wouter, Framer Motion |
| Backend | Express 4, tRPC 11, WebSocket (ws), Zod validation |
| Database | PostgreSQL 17 (Drizzle ORM) - 15 tables |
| Cache | Redis 7 (ioredis) - circuit breaker, real-time stats |
| LLM Proxy | LiteLLM (30+ models across 10+ providers) |
| Monitoring | nvidia-smi, PM2, /proc filesystem |
| MCP | Model Context Protocol (Host + Server) |
| Deploy | PM2, Docker ready |

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start Redis (if not running)
docker run -d --name redis -p 6379:6379 redis:alpine

# Seed database
pnpm tsx server/seed.ts

# Start development server
pnpm dev
```

Open http://localhost:5051/

---

## Environment Variables

```env
DATABASE_URL=postgresql://litellm_user:litellm_password_123@localhost:5434/freeapi_forge
REDIS_URL=redis://localhost:6379/1
LITELLM_URL=http://localhost:5050
LITELLM_API_KEY=sk-ai-lab-master-key
PORT=5051
NODE_ENV=development
```

---

## PM2 Production Deploy

```bash
# Start all services
pm2 start ecosystem.config.cjs

# Save process list
pm2 save

# Setup auto-start on boot
pm2 startup
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/chat/completions` | OpenAI-compatible chat completions |
| `GET /v1/models` | List available models |
| `POST /api/stream/chat` | SSE streaming chat |
| `GET /api/trpc/*` | tRPC API |
| `GET /mcp/sse` | MCP Server-Sent Events |
| `POST /mcp/message` | MCP JSON-RPC messages |
| `GET /api-docs` | API documentation |
| `WS /ws` | WebSocket for real-time system stats |

---

## Database Schema (15 tables)

- `users` - User authentication and roles
- `teams` - Multi-tenant team management
- `apiKeys` - API key management
- `providers` - LLM provider configurations
- `requestHistory` - Request logging
- `budgetLimits` - Budget tracking
- `auditLogs` - Audit trail
- `virtualKeys` - Virtual API keys with budgets
- `organizations` - Org isolation
- `accessGroups` - Reusable resource sets
- `mcpServers` - MCP server registry
- `skills` - Installed skills
- `guardrails` - Content filtering rules
- `policies` - Guardrail groupings
- `agents` - Agent configurations
- `usageLogs` - Usage analytics
- `systemEvents` - Error/event logging

---

## LiteLLM Integration

Forge Studio connects to LiteLLM proxy which routes to 30+ models:

### Free Providers
- **Groq**: llama-3.3-70b, llama-3.1-8b, qwen3-32b, llama-4-scout
- **Google Gemini**: gemini-2.5-flash, gemini-2.5-flash-lite
- **Mistral**: mistral-large, codestral-latest, open-mistral-nemo
- **Cerebras**: gpt-oss-120b, zai-glm-4.7
- **SambaNova**: Meta-Llama-3.3-70B-Instruct
- **Cohere**: command-a, command-r7b, aya-expanse-32b
- **OpenRouter**: nemotron-super, deepseek-v4-flash, gpt-oss-120b
- **NVIDIA NIM**: llama-3.3-70b, nemotron-super
- **Cloudflare**: llama-3.1-8b, llama-3.3-70b

### Local Models
- **Ollama**: Qwopus-GLM-18B, Hermes-4-14B
- **llama.cpp**: DeepSeek-Coder-V2-Lite (running on port 8085)

---

## License

MIT License - Made by Jahanzaib Ali
