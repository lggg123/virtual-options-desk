# Vercel Deployment Configuration

## Important: Root Directory Setting

Since this is a monorepo with Next.js in the `frontend` subdirectory, you **MUST** configure Vercel to use the correct root directory.

### Option 1: Configure in Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Settings** → **General**
3. Find **Root Directory** section
4. Click **Edit**
5. Set to: `frontend`
6. Click **Save**
7. Redeploy the project

### Option 2: Use vercel.json (Already Configured)

The `vercel.json` in the root is configured to:
- Run build command from root
- Use Next.js framework detection
- Install dependencies correctly

## Build Commands

The project uses these commands:
- **Install**: `bun install` (installs root dependencies, then frontend via workspaces)
- **Build**: `bun run build` (runs `cd frontend && bun run build`)
- **Start**: `bun run start` (for development)

## Environment Variables

Make sure these are set in Vercel:

### Required
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Optional (API Keys)
```
OPENAI_API_KEY=your_openai_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key
```

### Blog Agent
```
BLOG_SCHEDULE=0 9 * * 1-5
BLOG_TIMEZONE=America/New_York
BLOG_AUTO_PUBLISH=true
```

## Troubleshooting

### Error: "routes-manifest.json couldn't be found"

**Cause**: Vercel is building from the wrong directory.

**Solution**: 
1. Set **Root Directory** to `frontend` in Vercel settings
2. OR ensure `vercel.json` is properly configured
3. Redeploy

### Error: "Cannot find module"

**Cause**: Dependencies not installed in the correct directory.

**Solution**:
1. Ensure `bun install` runs at root (installs both root and frontend via workspaces)
2. Check `package.json` has `"workspaces": ["frontend"]`

### Build Command Not Found

**Cause**: Build script not found.

**Solution**:
Verify in root `package.json`:
```json
{
  "scripts": {
    "build": "bun run build:frontend",
    "build:frontend": "cd frontend && bun run build"
  }
}
```

## Deployment Checklist

- [ ] Root Directory set to `frontend` in Vercel settings
- [ ] Environment variables configured
- [ ] `vercel.json` exists in repository root
- [ ] Supabase credentials added
- [ ] Build succeeds locally: `bun run build`
- [ ] Deploy to Vercel

---

**Created**: October 6, 2025  
**Status**: Configuration Ready ✅
