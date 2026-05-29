# Forge Studio Deployment Guide

## Quick Start (Docker Compose)

The fastest way to run Forge Studio:

### Prerequisites
- Docker and Docker Compose
- 4GB RAM minimum
- Ports 5051, 5434, 6379 available

### Steps

1. Clone and configure:
   git clone https://github.com/Jahanzaib211/freeapi-forge.git
   cd freeapi-forge
   cp .env.example .env

2. Start everything:
   docker-compose up -d

3. Seed the database:
   docker-compose exec app pnpm tsx server/seed.ts

4. Open http://localhost:5051/

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Forge Studio | 5051 | Main application |
| PostgreSQL | 5434 | Database |
| Redis | 6379 | Circuit breaker, cache |
| LiteLLM (optional) | 5050 | LLM proxy |
| Ollama (optional) | 11434 | Local models |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| REDIS_URL | Yes | - | Redis connection string |
| PORT | No | 5051 | Application port |
| LITELLM_URL | No | - | LiteLLM proxy URL (optional) |
| LITELLM_API_KEY | No | - | LiteLLM API key |
| JWT_SECRET | Yes | - | Session secret |

## Manual Setup (without Docker)

1. Install PostgreSQL, Redis, Node.js 22+
2. Create database: postgresql://user:pass@localhost:5434/forge_studio
3. Run: pnpm install && pnpm tsx server/seed.ts && pnpm dev

## Production Deployment

1. Build: pnpm build
2. Start with PM2: pm2 start ecosystem.config.cjs
3. Save: pm2 save && pm2 startup

## Custom Providers (Standalone Mode)

Forge Studio works WITHOUT LiteLLM. Add any OpenAI-compatible API:

1. Go to Custom Providers page
2. Paste API URL + Key (e.g., https://api.anthropic.com/v1)
3. Forge auto-discovers available models
4. Use them through the standard /v1/chat/completions endpoint

## MCP Server

Forge Studio exposes itself as an MCP server:

- Endpoint: http://localhost:5051/mcp/sse
- Available tools: chat_completion, list_models, get_system_stats

Connect any MCP client to use Forge Studio's capabilities.
