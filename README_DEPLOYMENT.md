# 🚀 Fly.io Deployment Guide

## Overview
This guide explains how to deploy the E-commerce Backend to Fly.io with Neon PostgreSQL database.

## Prerequisites

### 1. Install Fly CLI
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Or using package managers
# macOS: brew install flyctl
# Ubuntu: sudo snap install flyctl
```

### 2. Sign up and Login
```bash
# Sign up at https://fly.io
flyctl auth signup

# Or login if you have an account
flyctl auth login
```

### 3. Install Prerequisites
- Docker (for local builds)
- Node.js 18+ (for running deploy script)

## Database Setup

We're using Neon PostgreSQL with the provided connection string:
```
postgresql://neondb_owner:npg_RM2zV7FJnOtv@ep-small-mountain-agpzm0ka-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Quick Deployment

### Option 1: Automated Deployment (Recommended)
```bash
cd backend
./deploy.sh
```

### Option 2: Manual Deployment

#### 1. Initialize Fly App
```bash
flyctl launch --no-deploy
```

#### 2. Set Environment Variables
```bash
flyctl secrets set DATABASE_URL="postgresql://neondb_owner:npg_RM2zV7FJnOtv@ep-small-mountain-agpzm0ka-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)
flyctl secrets set JWT_SECRET="$JWT_SECRET"

# Set other vars
flyctl secrets set \
  NODE_ENV="production" \
  PORT="8080" \
  ALLOWED_ORIGINS="https://your-frontend-domain.com" \
  JWT_EXPIRES_HOURS="24" \
  RATE_LIMIT="1000/minute" \
  BCRYPT_ROUNDS="12"
```

#### 3. Deploy
```bash
flyctl deploy --remote-only
```

## Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Neon Connection String | PostgreSQL database connection |
| `JWT_SECRET` | Auto-generated | Secret for JWT token signing |
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `8080` | Server port (Fly.io requirement) |
| `ALLOWED_ORIGINS` | Frontend domain | CORS allowed origins |
| `JWT_EXPIRES_HOURS` | `24` | JWT token expiry time |
| `RATE_LIMIT` | `1000/minute` | Rate limiting configuration |
| `BCRYPT_ROUNDS` | `12` | Password hashing rounds |

## Verification

After deployment, verify the setup:

### 1. Health Check
```bash
curl https://ecommerce-backend.fly.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-04T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. API Documentation
```bash
curl https://ecommerce-backend.fly.dev/api/v1
```

### 3. Database Connection
```bash
# Check logs for database connection
flyctl logs

# Look for:
# ✅ Database connected successfully
```

## Configuration Files

### `fly.toml`
Main Fly.io configuration file with:
- App name and region
- Environment variables
- Service configuration
- Health checks
- Resource allocation

### `Dockerfile.fly`
Optimized Dockerfile for Fly.io with:
- Multi-stage builds
- Security hardening
- Minimal production image
- Health checks

## Monitoring & Management

### View Logs
```bash
flyctl logs
flyctl logs --tail
```

### Scale Resources
```bash
# Scale up CPU/Memory
flyctl scale vm shared-cpu-2x --memory=1024

# Scale number of instances
flyctl scale count 2
```

### SSH into Container
```bash
flyctl ssh console
```

### Check App Status
```bash
flyctl status
flyctl list
```

## Disaster Recovery

### Database Backups
Neon provides automatic backups, but you can also:
1. Connect to Neon dashboard
2. Use pg_dump for manual backups
3. Set up automated backup scripts

### App Recovery
```bash
# Redeploy if needed
flyctl deploy --remote-only

# Rollback if issues
flyctl releases
flyctl releases rollback [version]
```

## Security Notes

### Secrets Management
- All sensitive data (JWT_SECRET, DATABASE_URL) are stored as Fly secrets
- Never commit secrets to version control
- Use `flyctl secrets list` to verify

### HTTPS
- Fly.io provides automatic HTTPS
- All connections are encrypted
- SSL certificates are automatically managed

## Frontend Integration

Update your frontend to use the deployed backend:

```typescript
// In your frontend .env.local or production config
NEXT_PUBLIC_API_BASE_URL=https://ecommerce-backend.fly.dev/api/v1
```

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs
flyctl logs --build

# Common fixes:
# - Ensure Dockerfile exists
# - Check for syntax errors in Dockerfile
# - Verify all dependencies are installed
```

#### 2. Database Connection Issues
```bash
# Check database connection string
flyctl secrets get DATABASE_URL

# Test connection locally
DATABASE_URL="postgresql://neondb_owner:npg_RM2zV7FJnOtv@ep-small-mountain-agpzm0ka-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npm run dev
```

#### 3. CORS Issues
```bash
# Update ALLOWED_ORIGINS
flyctl secrets set ALLOWED_ORIGINS="https://your-frontend-domain.com"

# Redeploy
flyctl deploy
```

### Getting Help
- Check Fly.io documentation: https://fly.io/docs/
- Join Fly.io Discord: https://fly.io/discord
- Post issues in Fly.io community forum

## Cost Estimation

### Free Tier (Hobby)
- $0/month
- 3 shared-cpu-1x VMs
- Limited bandwidth
- Perfect for development/testing

### Paid Plans
- Scale as needed
- More resources and regions
- Priority support

## Next Steps

1. **Configure Domain**: Add custom domain in Fly.io dashboard
2. **Set up Monitoring**: Configure alerts and monitoring
3. **Frontend Deployment**: Deploy frontend and point to backend URL
4. **Automate CI/CD**: Set up GitHub Actions for automated deployments
