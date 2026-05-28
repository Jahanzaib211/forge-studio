# FreeAPI Forge - AI Lab Control Center

A production-grade, AI lab-level LLM routing platform with intelligent provider selection, budget tracking, circuit breaking, and a companion browser extension. Built with React 19, Express 4, tRPC 11, PostgreSQL, and Redis.

**FreeAPI Forge** routes API requests across multiple free-tier LLM providers (Groq, Gemini, Mistral, Cerebras, SambaNova, Cohere, OpenRouter, Cloudflare) through LiteLLM proxy with automatic failover, circuit breaking, and cost optimization.

---

## 🚀 Features

### Core Capabilities
- **Intelligent LLM Routing**: Task-type based routing (chat, coding, vision, fast, long_context) to optimal providers
- **Circuit Breaker Pattern**: Redis-backed automatic failover when providers fail (3 failures → 60s cooldown)
- **Budget Tracking**: Per-team monthly spend limits with real-time cost tracking
- **Provider Health Monitor**: Real-time status dashboard with circuit state, quality scores, and latency metrics
- **Request History**: Complete audit log with filtering, pagination, and CSV export
- **Browser Extension**: Chrome/Edge popup for direct LLM access from any webpage
- **Admin Panel**: Configure providers, adjust quality scores, reset circuit breakers
- **System Health**: Monitor PostgreSQL, Redis, and LiteLLM proxy status

### Elite GUI
- **Live Dashboard**: Real-time stats with auto-refresh (5s intervals)
- **Interactive Charts**: Request volume (24h), top models (pie chart), provider performance
- **Chat Laboratory**: Full-featured chat interface with token/latency tracking
- **Dark Theme**: Beautiful gradients, backdrop blur, and smooth animations
- **Instant Updates**: All data reactive with tRPC's refetchInterval

---

## 🏗️ Architecture

```
Browser Extension ──┐
                    ├──→ FreeAPI Forge (port 5051) ──┬──→ LiteLLM Proxy (5050) ──→ 20+ models
React UI ───────────┘                                ├──→ PostgreSQL (5434/freeapi_forge)
                                                     └──→ Redis (6379/1) circuit breaker
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Tailwind 4, shadcn/ui, Recharts, wouter, framer-motion |
| Backend | Express 4, tRPC 11, Zod validation |
| Database | PostgreSQL 17 (Drizzle ORM) |
| Cache | Redis 7 (ioredis) |
| LLM Proxy | LiteLLM (20+ models) |
| Testing | Vitest |
| Deploy | PM2, Docker ready |

---

## 📦 Quick Start

### Prerequisites
- Node.js 23+
- pnpm 11+
- PostgreSQL 17 (running on port 5434)
- Redis 7 (running on port 6379)
- LiteLLM Proxy (running on port 5050)

### Installation

```bash
cd /home/jahanzaib/freeapi-forge

# Install dependencies
pnpm install

# Run database migrations
DATABASE_URL="postgresql://litellm_user:litellm_password_123@localhost:5434/freeapi_forge" pnpm db:push

# Seed database with initial data
DATABASE_URL="postgresql://litellm_user:litellm_password_123@localhost:5434/freeapi_forge" npx tsx server/seed.ts

# Start development server
pnpm dev
```

The app will be available at **http://localhost:5051**

### Production with PM2

```bash
# Start with PM2
pm2 start ecosystem.config.cjs

# Save process list
pm2 save

# View logs
pm2 logs freeapi-forge
```

---

## 🗄️ Database Schema

7 tables in PostgreSQL:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with role-based access (user/admin) |
| `teams` | Team configuration and budget ownership |
| `apiKeys` | API key management with revocation support |
| `providers` | LLM provider configuration (endpoint, quality, latency, cost) |
| `requestHistory` | Complete audit log of all LLM requests |
| `budgetLimits` | Per-team monthly spend limits and current usage |
| `auditLogs` | Admin action audit trail |

---

## 🔌 API Endpoints

All endpoints are under `/api/trpc` using tRPC protocol.

### Public Endpoints
- `health.check` - Basic health check
- `health.detailed` - Detailed system health (DB, Redis, providers)
- `providers.list` - List all configured providers
- `providers.status` - Real-time provider status with circuit breaker state

### Protected Endpoints (require auth)
- `chat.complete` - Send LLM request with task-type routing
- `budget.getMonthlySpend` - Get current month's spend
- `requests.list` - Paginated request history

### Admin Endpoints (require admin role)
- `admin.getProviders` - List providers for admin
- `admin.updateProvider` - Update provider configuration
- `admin.resetCircuitBreaker` - Reset circuit breaker for a provider
- `admin.resetProviderHealth` - Reset all health metrics for a provider
- `budget.updateLimit` - Update monthly budget limit

---

## 🎯 Task Type Routing

The system routes requests to optimal models based on task type:

| Task Type | Model | Use Case |
|-----------|-------|----------|
| `chat` | fast-70b | General conversation (Groq Llama 3.3 70B) |
| `coding` | coder | Code generation (Mistral Codestral) |
| `vision` | gemini-flash | Image understanding (Gemini 2.5 Flash) |
| `fast` | fast-8b | Quick responses (Groq Llama 3.1 8B) |
| `long_context` | smart | Long documents (Gemini 2.5 Flash) |

---

## 🔒 Authentication

### Development Mode
- Mock session cookie authentication
- Default admin user: `local-dev-user`
- Access via `/auth/mock` endpoint

### Production Mode
- API key authentication via `X-API-Key` header
- Session cookie authentication for web UI
- Role-based access control (user/admin)

---

## 🌐 Browser Extension

### Installation

1. Open Chrome/Edge extensions page (`chrome://extensions/` or `edge://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` directory
5. Configure API endpoint: `http://localhost:5051`
6. Set API key (if required)

### Features
- Send chat completions from any webpage
- Task type selector
- Secure credential storage
- Real-time response display

---

## 📊 Monitoring

### System Health Page
Real-time monitoring of:
- PostgreSQL connection status
- Redis connection status
- LiteLLM proxy health
- Individual provider circuit breaker state

### Provider Monitor
- Circuit state visualization (open/closed)
- Quality score bars
- Latency metrics
- Failure count tracking
- Admin controls to reset circuit breakers

### Request History
- Paginated table with filtering
- Search by provider, task type, or status
- CSV export functionality
- Cost tracking per request

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm check
```

---

## 🐳 Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up -d

# Access the application
# Web UI: http://localhost:3000
# API: http://localhost:3000/api
```

The docker-compose includes:
- FreeAPI Forge app
- Redis 7
- MySQL 8 (can be swapped for PostgreSQL)
- Optional Ollama for local LLM fallback

---

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://litellm_user:litellm_password_123@localhost:5434/freeapi_forge"

# Redis
REDIS_URL="redis://localhost:6379/1"

# Server
PORT=5051
NODE_ENV="development"

# LiteLLM Proxy
LITELLM_URL="http://localhost:5050"
LITELLM_API_KEY="sk-ai-lab-master-key"

# Auth
JWT_SECRET="freeapi-forge-local-secret"
```

---

## 📈 Performance

- **Response Time**: <100ms average (with LiteLLM cache)
- **Provider Failover**: <5s to next provider
- **Circuit Breaker Recovery**: 60s default
- **Rate Limit Cooldown**: 65s default
- **Budget Check**: Atomic database operation
- **Auto-refresh**: 3-5s intervals for live data

---

## 🛡️ Security

- **API Key Authentication**: SHA-256 hashing
- **Budget Enforcement**: Atomic operations prevent overspending
- **Circuit Breaker**: Protects against cascading failures
- **Rate Limiting**: Per-provider tracking in Redis
- **CORS**: Configurable cross-origin support
- **Role-Based Access**: Admin/user separation

---

## 📝 Development

### Project Structure

```
freeapi-forge/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components (Dashboard, ProviderMonitor, etc.)
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # tRPC client
│   │   └── App.tsx           # Routes
│   └── index.html
├── server/                    # Express backend
│   ├── routers.ts            # tRPC procedures
│   ├── db.ts                 # Database helpers
│   ├── services/             # Business logic (LLMRouter, ProviderService)
│   ├── _core/                # Framework code
│   └── seed.ts               # Database seeding
├── extension/                 # Browser extension
├── drizzle/                   # Database schema & migrations
├── ecosystem.config.cjs       # PM2 configuration
└── docker-compose.yml
```

### Adding a New Provider

1. Add to database:
```sql
INSERT INTO providers (name, "litellmEndpoint", enabled, "qualityScore", "latencyMs", "costPerMToken")
VALUES ('new-provider', 'http://localhost:5050', 1, 75, 250, 50);
```

2. Configure in LiteLLM proxy (`~/.litellm/config.yaml`)

3. The provider will automatically appear in the dashboard

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run `pnpm check` and `pnpm test`
6. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- **LiteLLM**: Unified interface for 100+ LLM providers
- **Drizzle ORM**: Type-safe database toolkit
- **tRPC**: End-to-end typesafe APIs
- **shadcn/ui**: Beautiful component library

---

## 📞 Support

For issues, feature requests, or questions:
- Check the System Health page at `/health`
- Review logs: `pm2 logs freeapi-forge`
- Check LiteLLM proxy: `http://localhost:5050/health`

---

**Built with ❤️ for the AI community**
