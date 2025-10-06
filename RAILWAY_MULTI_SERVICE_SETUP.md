# 🚂 Railway Multi-Service Setup Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│           GitHub Repository: virtual-options-desk           │
│                                                             │
│  ┌──────────────────────┐      ┌─────────────────────────┐ │
│  │   python/            │      │   crewai-service/       │ │
│  │   ├── pattern_       │      │   ├── main.py           │ │
│  │   │   detection_api  │      │   ├── requirements.txt  │ │
│  │   └── requirements-  │      │   └── python/           │ │
│  │       ml.txt         │      │       └── crewai_       │ │
│  │                      │      │           analysis.py   │ │
│  └──────────────────────┘      └─────────────────────────┘ │
│           ↓                              ↓                  │
│  ┌──────────────────────┐      ┌─────────────────────────┐ │
│  │ Dockerfile.pattern   │      │ Dockerfile.crewai       │ │
│  │ - COPY python/       │      │ - COPY crewai-service/  │ │
│  └──────────────────────┘      └─────────────────────────┘ │
│           ↓                              ↓                  │
│  ┌──────────────────────┐      ┌─────────────────────────┐ │
│  │ railway-pattern-     │      │ railway-crewai.json     │ │
│  │ detection.json       │      │ - dockerfilePath:       │ │
│  │ - dockerfilePath:    │      │   Dockerfile.crewai     │ │
│  │   Dockerfile.pattern │      │                         │ │
│  └──────────────────────┘      └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                    ↓                          ↓
┌───────────────────────────────────────────────────────────────┐
│                    Railway Platform                           │
│                                                               │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  Service 1              │  │  Service 2               │  │
│  │  pattern-detection-api  │  │  crewai-market-analysis  │  │
│  │                         │  │                          │  │
│  │  Builder: DOCKERFILE    │  │  Builder: DOCKERFILE     │  │
│  │  Config: railway-       │  │  Config: railway-        │  │
│  │          pattern-       │  │          crewai.json     │  │
│  │          detection.json │  │                          │  │
│  │                         │  │  Env: OPENAI_API_KEY     │  │
│  │  Port: 8080             │  │  Port: 8080              │  │
│  │  URL: pattern-detection │  │  URL: crewai-market-     │  │
│  │       .up.railway.app   │  │       analysis.up.       │  │
│  │                         │  │       railway.app        │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. **Same Repository, Different Services**
- Both services deploy from `lggg123/virtual-options-desk`
- No need to create separate GitHub repos
- Railway connects to the same repo twice

### 2. **Different Dockerfiles**
Each Dockerfile copies only what it needs:

**Dockerfile.pattern**:
```dockerfile
COPY python/requirements-ml.txt ./python/
RUN pip install -r python/requirements-ml.txt
COPY python/ ./python/
CMD ["uvicorn", "python.pattern_detection_api:app", ...]
```

**Dockerfile.crewai**:
```dockerfile
COPY crewai-service/requirements.txt ./
RUN pip install -r requirements.txt
COPY crewai-service/ ./
CMD ["uvicorn", "main:app", ...]
```

### 3. **Railway Config Files**
Each service specifies which Dockerfile to use:

**railway-pattern-detection.json**:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.pattern"
  }
}
```

**railway-crewai.json**:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.crewai"
  }
}
```

### 4. **Independent Deployments**
- Each service has its own:
  - Build process
  - Environment variables
  - Domain/URL
  - Logs
  - Restart policies
  - Resource allocation

## Deployment Steps

### Deploy Pattern Detection API

1. **Create Service in Railway**
   - Go to Railway dashboard
   - Click "New Project" or "Add Service"
   - Connect to GitHub repo

2. **Configure Service**
   - Name: `pattern-detection-api`
   - Settings → Build & Deploy
   - Railway Config File: `railway-pattern-detection.json`

3. **Deploy**
   - Railway reads `railway-pattern-detection.json`
   - Uses `Dockerfile.pattern`
   - Copies `python/` directory
   - Builds and deploys

### Deploy CrewAI Service

1. **Create Second Service**
   - In the **same Railway project** (or new one)
   - Click "Add Service" → "GitHub Repo"
   - Select the **same repository**

2. **Configure Service**
   - Name: `crewai-market-analysis`
   - Settings → Build & Deploy
   - Railway Config File: `railway-crewai.json`

3. **Set Environment Variables**
   - `OPENAI_API_KEY=sk-...` (required!)

4. **Deploy**
   - Railway reads `railway-crewai.json`
   - Uses `Dockerfile.crewai`
   - Copies `crewai-service/` directory
   - Builds and deploys

## Key Benefits

✅ **Single Repository**
- No need for monorepo complexity
- All code in one place
- Easy to share common utilities

✅ **Independent Services**
- Deploy/restart independently
- Different environment variables
- Scale independently
- Different domains

✅ **Clean Separation**
- Each Dockerfile only copies what it needs
- No unnecessary files in containers
- Smaller image sizes
- Faster builds

✅ **Easy Management**
- Both services in one Railway project
- Or separate projects if preferred
- Shared GitHub repo connection
- Simple CI/CD setup

## Common Questions

### Q: Do I need two GitHub repositories?
**A**: No! Both services deploy from the same repository.

### Q: Can they be in the same Railway project?
**A**: Yes! Recommended for easier management.

### Q: Will they interfere with each other?
**A**: No. Each service is completely isolated with its own:
- Container
- Environment variables
- Domain
- Resources
- Logs

### Q: What if both Dockerfiles need the same file?
**A**: They can both copy it. Each service gets its own isolated filesystem.

### Q: Can I deploy only one service?
**A**: Yes! Deploy whichever services you need.

### Q: How do I update both services?
**A**: Push to GitHub. Railway automatically redeploys both services if their files changed.

### Q: What if only one service's files changed?
**A**: Railway is smart enough to only rebuild the service whose files changed.

## Cost Implications

### Railway Pricing

**Free Tier**: $5/month credit
- 2 services use ~$2.50 each
- Total: ~$5/month (fits in free tier!)

**Hobby Plan**: $5/month + usage
- Better for production
- No credit limits
- Faster builds

### Optimization Tips

1. **Use Same Project**: Saves on project overhead
2. **Share Resources**: Both services can use $5 free credit
3. **Set Sleep Hours**: Put services to sleep during low usage
4. **Monitor Usage**: Check Railway dashboard regularly

## Environment Variables Management

### Pattern Detection API
```env
# No API keys required (uses free Yahoo Finance)
PORT=${{PORT}}  # Auto-set by Railway
```

### CrewAI Service
```env
# REQUIRED
OPENAI_API_KEY=sk-...

# Auto-set by Railway
PORT=${{PORT}}

# Optional
OPENAI_MODEL=gpt-4-turbo-preview
CREWAI_VERBOSE=true
```

### Best Practices
- Never commit API keys to GitHub
- Use Railway's Variables tab
- Set different keys for dev/prod
- Monitor OpenAI usage

## Monitoring Both Services

### Railway Dashboard
1. Go to your project
2. You'll see both services listed
3. Click each to view:
   - Logs
   - Metrics
   - Deployments
   - Settings

### Health Checks
```bash
# Pattern Detection API
curl https://pattern-detection.up.railway.app/health

# CrewAI Service
curl https://crewai-market-analysis.up.railway.app/health
```

### Logs
- View in Railway dashboard
- Or use Railway CLI:
```bash
railway logs --service pattern-detection-api
railway logs --service crewai-market-analysis
```

## Troubleshooting

### Service Built Wrong Files
- Check Railway Config File setting
- Verify Dockerfile path
- Review build logs

### Both Services Using Same Port Locally
- They each run in their own container
- Railway assigns different external ports
- No conflict

### One Service Failing
- Check that service's logs
- Verify environment variables
- Test Dockerfile locally:
```bash
docker build -f Dockerfile.pattern -t test-pattern .
docker build -f Dockerfile.crewai -t test-crewai .
```

### Want to Deploy to Different Regions
- Create separate Railway projects
- Configure each with same GitHub repo
- Set different regions in settings

## Summary

🎯 **Same Repo, Multiple Services**
- One GitHub repository
- Two (or more) Railway services
- Each with its own Dockerfile
- Completely independent deployments

✨ **Simple & Efficient**
- No monorepo complexity
- Clean separation of concerns
- Easy to manage and scale

---

**Ready to deploy?** Follow the guides:
- Pattern Detection: `RAILWAY_DEPLOYMENT.md`
- CrewAI Service: `CREWAI_DEPLOYMENT.md`
