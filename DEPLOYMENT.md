# FreeAPI Forge Deployment Guide

This guide provides comprehensive instructions for deploying FreeAPI Forge on your node.

## Quick Start with Docker Compose

The fastest way to get FreeAPI Forge running is with Docker Compose, which includes Redis, MySQL, and the application.

### Prerequisites

- Docker and Docker Compose installed
- 2GB minimum RAM available
- Port 3000 available (configurable)

### Deployment Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/freeapi-forge.git
   cd freeapi-forge
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   nano .env
   ```

3. **Start the stack**
   ```bash
   docker-compose up -d
   ```

4. **Verify services are running**
   ```bash
   docker-compose ps
   docker-compose logs -f app
   ```

5. **Access the application**
   - Web UI: http://localhost:3000
   - API: http://localhost:3000/api
   - Health check: http://localhost:3000/health

## Configuration

### Essential Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | MySQL connection string | Required |
| `REDIS_URL` | Redis connection string | Required |
| `API_KEY` | X-API-Key for authentication | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `DEFAULT_MONTHLY_BUDGET_USD` | Default team budget | `10` |

### Database Configuration

FreeAPI Forge uses MySQL for persistent storage. The database schema is automatically created on first run.

```bash
# Connect to MySQL
mysql -h localhost -u freeapi -p freeapi_forge

# Verify tables created
SHOW TABLES;
```

### Redis Configuration

Redis is used for caching, rate limiting, and circuit breaker state.

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis memory usage
redis-cli INFO memory
```

## Scaling & Performance

### Single Node Deployment

For development and small-scale deployments:

```bash
docker-compose up -d
```

### Multi-Node Deployment

For production with multiple nodes:

1. **Set up shared Redis** (not included in compose)
   ```bash
   # Use a managed Redis service or separate Redis instance
   REDIS_URL=redis://redis-cluster:6379/0
   ```

2. **Set up shared MySQL** (not included in compose)
   ```bash
   # Use a managed MySQL service or separate MySQL instance
   DATABASE_URL=mysql://user:pass@mysql-cluster:3306/db
   ```

3. **Run multiple app instances**
   ```bash
   docker-compose up -d --scale app=3
   ```

### Load Balancing

Use nginx or your cloud provider's load balancer:

```nginx
upstream freeapi_forge {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://freeapi_forge;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Monitoring & Maintenance

### Health Checks

```bash
# Simple health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed
```

### Logs

```bash
# View application logs
docker-compose logs -f app

# View specific service logs
docker-compose logs -f redis
docker-compose logs -f mysql
```

### Database Backups

```bash
# Backup MySQL database
docker-compose exec mysql mysqldump -u freeapi -p freeapi_forge > backup.sql

# Restore from backup
docker-compose exec -T mysql mysql -u freeapi -p freeapi_forge < backup.sql
```

### Redis Persistence

Redis data is persisted to `redis-data` volume. To ensure data persistence:

```bash
# Check Redis persistence
docker-compose exec redis redis-cli CONFIG GET save

# Force save
docker-compose exec redis redis-cli BGSAVE
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs app

# Verify database connection
docker-compose exec app curl http://localhost:3000/health/detailed

# Restart services
docker-compose restart
```

### Database connection errors

```bash
# Verify MySQL is running
docker-compose logs mysql

# Test connection
docker-compose exec mysql mysql -u freeapi -p -e "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Redis connection errors

```bash
# Verify Redis is running
docker-compose logs redis

# Test connection
docker-compose exec redis redis-cli ping

# Check REDIS_URL format
echo $REDIS_URL
```

### High memory usage

```bash
# Check container memory
docker stats

# Reduce Redis memory
docker-compose exec redis redis-cli CONFIG SET maxmemory 256mb

# Optimize MySQL
docker-compose exec mysql mysql -u root -p -e "SHOW VARIABLES LIKE '%buffer%'"
```

## Security Considerations

### API Key Management

1. Generate a strong API key:
   ```bash
   openssl rand -hex 32
   ```

2. Store securely in environment variables
3. Rotate keys regularly
4. Use different keys for different environments

### Database Security

1. Change default MySQL password
2. Use strong passwords (20+ characters)
3. Restrict database access to application only
4. Enable SSL for database connections

### Network Security

1. Use HTTPS in production
2. Implement firewall rules
3. Use VPN for remote access
4. Enable CORS only for trusted domains

## Upgrading

### Backup before upgrade

```bash
# Backup database
docker-compose exec mysql mysqldump -u freeapi -p freeapi_forge > backup-$(date +%Y%m%d).sql

# Backup Redis
docker-compose exec redis redis-cli BGSAVE
```

### Upgrade steps

```bash
# Pull latest code
git pull origin main

# Rebuild Docker image
docker-compose build --no-cache app

# Stop current services
docker-compose down

# Start with new image
docker-compose up -d

# Verify health
curl http://localhost:3000/health
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Database backups scheduled
- [ ] Redis persistence enabled
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] Monitoring and alerting set up
- [ ] Log aggregation configured
- [ ] API keys rotated
- [ ] Database passwords changed
- [ ] Health checks configured
- [ ] Load balancer configured
- [ ] Disaster recovery plan documented

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review this guide
3. Contact FreeAPI Forge support team

## License

FreeAPI Forge is released under the MIT License.
