# Docker Setup for KraftLog

This guide explains how to run the KraftLog backend API and database using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- KraftLogApi repository cloned at `../KraftLogApi` (relative to this project)

## Quick Start

### 1. Start Backend and Database

```bash
# From the kraftlog directory
docker-compose up -d
```

This will:
- Pull PostgreSQL 16 Alpine image
- Build the backend API from KraftLogApi
- Start both services with proper networking
- Initialize the database with migrations

### 2. Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

Expected output:
```
kraftlog-backend    running    0.0.0.0:8080->8080/tcp
kraftlog-postgres   running    0.0.0.0:5433->5432/tcp
```

### 3. Test API

```bash
# Health check
curl http://localhost:8080/actuator/health

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kraftlog.com","password":"admin123"}'
```

### 4. Configure Frontend

The frontend is already configured to use the backend at `http://192.168.0.104:8080/api` via the `.env` file. Update it to use localhost if running on the same machine:

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

## Docker Compose Commands

### Start Services

```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up

# Rebuild and start
docker-compose up --build -d
```

### Stop Services

```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove containers AND data
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Execute Commands

```bash
# Backend shell
docker-compose exec backend sh

# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d kraftlog

# View database
docker-compose exec postgres psql -U postgres -d kraftlog -c "SELECT * FROM users;"
```

## Configuration

### Environment Variables

Create a `.env` file in the project root (already configured):

```env
# Backend Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@kraftlog.com

# Frontend Configuration
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

### Ports

| Service  | Internal Port | External Port | Description        |
|----------|--------------|---------------|-------------------|
| Backend  | 8080         | 8080          | REST API          |
| Postgres | 5432         | 5433          | Database          |

To change ports, edit `docker-compose.yml`:

```yaml
ports:
  - "YOUR_PORT:8080"  # Change YOUR_PORT
```

## Data Persistence

Database data is stored in a Docker volume named `postgres_data`. This persists between container restarts.

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres kraftlog > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres kraftlog < backup.sql
```

### Reset Database

```bash
# Stop and remove everything including volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Troubleshooting

### Backend won't start

1. **Check logs:**
   ```bash
   docker-compose logs backend
   ```

2. **Common issues:**
   - Database not ready: Wait 30 seconds after starting
   - Port conflict: Change port in `docker-compose.yml`
   - Build errors: Ensure KraftLogApi is at `../KraftLogApi`

### Database connection errors

1. **Verify database is healthy:**
   ```bash
   docker-compose ps postgres
   ```

2. **Check connection:**
   ```bash
   docker-compose exec postgres pg_isready -U postgres
   ```

3. **View database logs:**
   ```bash
   docker-compose logs postgres
   ```

### Can't connect from mobile app

1. **Check backend URL in `.env`:**
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:8080/api
   ```

2. **Get your IP:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

3. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

### Port already in use

```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead
```

## Development Workflow

### Hot Reload

The backend requires rebuild for code changes:

```bash
# Rebuild backend
docker-compose up --build -d backend

# View logs during startup
docker-compose logs -f backend
```

### Local Development

To run backend locally instead of Docker:

```bash
# Stop Docker backend
docker-compose stop backend

# Keep database running
# Backend will connect to localhost:5433

# Run backend with Maven
cd ../KraftLogApi
mvn spring-boot:run
```

## Production Deployment

For production, additional steps are needed:

1. **Use production database** (not PostgreSQL in Docker)
2. **Configure environment variables** securely
3. **Enable SSL/TLS**
4. **Set up reverse proxy** (nginx)
5. **Configure monitoring** and logging
6. **Use secrets management** for credentials

## Health Checks

Both services have health checks configured:

- **Backend**: `http://localhost:8080/actuator/health`
- **Database**: `pg_isready` command

Docker will automatically restart unhealthy containers.

## Resource Limits

To limit resource usage, add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Clean Up

Remove all KraftLog Docker resources:

```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker rmi kraftlog-api:latest

# Remove orphaned volumes (careful!)
docker volume prune
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [KraftLogApi Repository](https://github.com/clertonraf/KraftLogApi)
