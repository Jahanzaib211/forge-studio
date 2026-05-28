# FreeAPI Forge

A production-grade, AI lab-level LLM routing platform with intelligent provider selection, budget tracking, and a companion browser extension. Built with React 19, Express 4, tRPC 11, and MySQL.

**FreeAPI Forge** routes API requests across multiple free-tier LLM providers (Groq, Gemini, DeepSeek, OpenRouter) with automatic failover, circuit breaking, and cost optimization.

## Key Features

- **Intelligent LLM Routing:** Automatically selects the best provider based on task type, quality scores, and latency
- **Multi-Provider Support:** Groq, Gemini, DeepSeek, OpenRouter, with local Ollama fallback
- **Circuit Breaker Pattern:** Automatically disables failing providers and recovers gracefully
- **Budget Tracking:** Per-team monthly spend limits with cost-per-request tracking
- **Provider Health Monitor:** Real-time status dashboard with circuit state, rate limits, and quality metrics
- **Browser Extension:** Chrome/Edge popup for direct LLM access from any webpage
- **Admin Panel:** Configure providers, adjust quality scores, and manage budgets
- **Request History:** Paginated log with provider, tokens, cost, and trace ID
- **System Health Page:** Monitor Redis (native or in-memory fallback), database, and API status
- **Docker Ready:** Complete docker-compose setup with Redis, MySQL, and Ollama
- **End-to-End Tests:** Comprehensive Vitest suite covering all critical paths

## Quick Start

### With Docker Compose (Recommended)

```bash
# Clone and navigate
git clone https://github.com/yourusername/freeapi-forge.git
cd freeapi-forge

# Start all services
docker-compose up -d

# Access the application
# Web UI: http://localhost:3000
# API: http://localhost:3000/api
# Health: http://localhost:3000/health
```

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:push

# Start development server
pnpm dev

# Run tests
pnpm test
```

## Architecture

### Backend (Express + tRPC)

- **Chat Router:** `/api/trpc/chat.complete` - Send LLM requests
- **Provider Router:** `/api/trpc/providers.*` - Monitor provider health
- **Budget Router:** `/api/trpc/budget.*` - Track spending
- **Request Router:** `/api/trpc/requests.*` - View history
- **Admin Router:** `/api/trpc/admin.*` - Configure system
- **Health Router:** `/api/trpc/health.*` - System status

### Frontend (React + Tailwind)

- **Dashboard:** Chat interface with provider selection and budget display
- **Provider Monitor:** Real-time health status with circuit breaker visualization
- **Request History:** Paginated table with export functionality
- **Admin Panel:** Provider configuration and budget management
- **System Health:** Redis/database/API status monitoring

### Browser Extension

- **Popup UI:** Send chat completions from any webpage
- **Settings:** Configure API key, endpoint, and team ID
- **Secure Storage:** Browser-managed credential storage

## API Endpoints

### Chat Completions

```bash
POST /api/trpc/chat.complete
X-API-Key: your-api-key
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "Hello"}],
  "taskType": "chat",
  "maxTokens": 1024,
  "temperature": 0.7,
  "teamId": "default"
}
```

### Provider Status

```bash
GET /api/trpc/providers.status
X-API-Key: your-api-key
```

### Budget Information

```bash
GET /api/trpc/budget.getMonthlySpend?teamId=default
X-API-Key: your-api-key
```

### System Health

```bash
GET /health
GET /health/detailed
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | X-API-Key for authentication | Yes |
| `DATABASE_URL` | MySQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `DEFAULT_MONTHLY_BUDGET_USD` | Default team budget | No (default: 10) |
| `OLLAMA_URL` | Local LLM fallback | No |

### Provider Configuration

Providers are configured in the database:

```sql
INSERT INTO providers (name, litellmEndpoint, enabled, qualityScore, latencyMs, costPerMToken)
VALUES ('groq', 'https://api.groq.com/v1', 1, 85, 200, 50);
```

## Browser Extension Installation

### Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` directory
5. Configure API key in extension settings

### Edge

1. Open `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension` directory
5. Configure API key in extension settings

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test server/api.test.ts

# Generate coverage report
pnpm test:coverage
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Docker Deploy

```bash
# Build image
docker build -t freeapi-forge .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@host/db \
  -e REDIS_URL=redis://host:6379 \
  -e API_KEY=your-key \
  freeapi-forge
```

## Project Structure

```
freeapi-forge/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── lib/              # tRPC client
│   │   └── App.tsx           # Routes
│   └── index.html
├── server/                    # Express backend
│   ├── routers.ts            # tRPC procedures
│   ├── db.ts                 # Database helpers
│   ├── services/             # Business logic
│   ├── _core/                # Framework code
│   └── api.test.ts           # Tests
├── extension/                 # Browser extension
│   ├── manifest.json
│   ├── src/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   ├── popup.js
│   │   ├── background.js
│   │   └── content.js
│   └── README.md
├── drizzle/                   # Database schema
│   ├── schema.ts
│   └── migrations/
├── Dockerfile
├── docker-compose.yml
├── DEPLOYMENT.md
└── README.md
```

## Performance Metrics

- **Response Time:** <100ms average (with local cache)
- **Provider Failover:** <5s to next provider
- **Circuit Breaker Recovery:** 60s default
- **Rate Limit Cooldown:** 65s default
- **Cache TTL:** 5 minutes for responses
- **Budget Check:** Atomic Lua operation

## Security

- **API Key Authentication:** X-API-Key header with SHA-256 hashing
- **Budget Enforcement:** Atomic operations prevent overspending
- **Circuit Breaker:** Protects against cascading failures
- **Rate Limiting:** Per-provider rate limit tracking
- **CORS:** Configurable cross-origin support
- **HTTPS:** TLS/SSL support in production

## Monitoring

### Health Checks

```bash
# Basic health
curl http://localhost:3000/health

# Detailed health with Redis/DB status
curl http://localhost:3000/health/detailed
```

### Logging

All requests are logged with trace IDs for debugging:

```bash
# View application logs
docker-compose logs -f app

# View specific service
docker-compose logs -f redis
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions:
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Review [extension/README.md](./extension/README.md) for extension setup
- Check logs: `docker-compose logs`

## Roadmap

- [ ] Streaming responses support
- [ ] Advanced analytics dashboard
- [ ] Custom provider integration
- [ ] Rate limiting per API key
- [ ] Webhook notifications
- [ ] Multi-region deployment
- [ ] Kubernetes deployment guide
- [ ] GraphQL API support

---

Built with ❤️ for the AI community
