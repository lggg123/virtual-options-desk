# Vercel Deployment Configuration

## 🔴 CRITICAL: Root Directory Setting Required!

**You are seeing this error:**
```
Error: The file "/vercel/path0/.next/routes-manifest.json" couldn't be found.
This is often caused by a misconfiguration in your project.
```

**Why?** Vercel is building from repo root (`.`) instead of the `frontend/` subdirectory.

Since this is a monorepo with Next.js in the `frontend` subdirectory, you **MUST** configure Vercel to use the correct root directory **BEFORE** the build will succeed.

### Option 1: Configure in Vercel Dashboard (Recommended)

**⚠️ DO THIS NOW TO FIX THE ERROR:**

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project name
3. Go to **Settings** → **General** tab
4. Scroll down to **Root Directory** section
5. Click **Edit** button
6. Change from `.` to: **`frontend`**
7. Click **Save**
8. Go to **Deployments** tab
9. Click **"︙"** (three dots) on latest deployment
10. Click **"Redeploy"**
11. ✅ Build should now succeed!

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

### ❌ Error: "routes-manifest.json couldn't be found"

**Full Error:**
```
Error: The file "/vercel/path0/.next/routes-manifest.json" couldn't be found.
This is often caused by a misconfiguration in your project.
Learn More: https://err.sh/vercel/vercel/now-next-routes-manifest
```

**Root Cause**: Vercel is building from the wrong directory (repo root `.` instead of `frontend/`).

**Fix (Settings Method):**
1. Vercel Dashboard → Your Project → Settings → General
2. Find "Root Directory" section
3. Click Edit → Change to: `frontend`
4. Save → Redeploy

**Fix (New Deployment Method):**
1. Delete the failed deployment
2. Create new deployment
3. When importing, **BEFORE clicking Deploy**:
   - Click "Edit" next to Root Directory
   - Select `frontend` from dropdown
4. Now click Deploy

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
