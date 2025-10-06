# 🔧 Quick Fix: Vercel routes-manifest.json Error

## Error You're Seeing

```
Error: The file "/vercel/path0/.next/routes-manifest.json" couldn't be found.
This is often caused by a misconfiguration in your project.

Learn More: https://err.sh/vercel/vercel/now-next-routes-manifest
```

## Why This Happens

Your repository structure:
```
virtual-options-desk/          ← Vercel is building here (WRONG!)
├── package.json
├── frontend/                  ← Next.js app is here (CORRECT!)
│   ├── package.json
│   ├── next.config.ts
│   └── src/
├── python/
└── crewai-service/
```

Vercel is trying to build from the **root** directory, but your Next.js app is in the **`frontend/`** subdirectory.

## Fix (2 Minutes)

### Step 1: Go to Project Settings

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Click **Settings** tab
4. Click **General** in the left sidebar

### Step 2: Change Root Directory

Scroll down to find **"Root Directory"** section:

```
┌─────────────────────────────────────────┐
│ Root Directory                          │
│                                         │
│ The directory within your project, in  │
│ which your code is located.            │
│                                         │
│  [.]                          [Edit]   │  ← Click "Edit"
└─────────────────────────────────────────┘
```

1. Click **Edit** button
2. Change from `.` to **`frontend`**
3. Click **Save**

It should look like this after:
```
┌─────────────────────────────────────────┐
│ Root Directory                          │
│                                         │
│ The directory within your project, in  │
│ which your code is located.            │
│                                         │
│  [frontend]                   [Edit]   │  ← Now showing "frontend"
└─────────────────────────────────────────┘
```

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Find the latest deployment (the one that failed)
3. Click the **"︙"** (three dots menu)
4. Click **"Redeploy"**

**OR** just push a new commit to trigger redeployment:
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

### Step 4: Verify Build

Watch the build logs. You should now see:

✅ **Good logs:**
```
Building with Next.js...
Creating an optimized production build...
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

❌ **Bad logs (before fix):**
```
Error: The file "/vercel/path0/.next/routes-manifest.json" couldn't be found.
```

## Alternative: Set Root Directory During Import

If you haven't deployed yet, or want to start fresh:

1. Go to [Vercel New Project](https://vercel.com/new)
2. Select your GitHub repository
3. **BEFORE clicking "Deploy":**
   - Look for **"Root Directory"** setting
   - Click **"Edit"** or dropdown
   - Select or enter: **`frontend`**
4. Now click **"Deploy"**

This sets it correctly from the start.

## Visual Guide

### Where to Find Root Directory Setting

```
Vercel Dashboard
  └── Your Project
      └── Settings (tab)
          └── General (sidebar)
              └── Scroll down...
                  └── Root Directory (section)
                      └── [Edit] button
```

### What Vercel Sees

**Before Fix (Wrong):**
```
Vercel looks in: /vercel/path0/
Expected to find: .next/routes-manifest.json
Actually finds: Nothing! (Next.js not built here)
Result: ❌ Build fails
```

**After Fix (Correct):**
```
Vercel looks in: /vercel/path0/frontend/
Expected to find: .next/routes-manifest.json
Actually finds: ✓ File exists! (Next.js built here)
Result: ✅ Build succeeds
```

## Still Not Working?

### Check Build Command

Make sure your build command is correct in Vercel:

- **Build Command**: `bun run build` (or `npm run build`)
- **Install Command**: `bun install` (or `npm install`)
- **Output Directory**: `.next` (default)

### Check package.json

Your `frontend/package.json` should have:
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "dev": "next dev"
  }
}
```

### Check next.config.ts

Your `frontend/next.config.ts` should exist and be valid.

### Clear Vercel Cache

Sometimes Vercel caches the wrong settings:

1. Settings → General
2. Scroll to "Danger Zone" (bottom)
3. Click "Clear Build Cache"
4. Redeploy

## Summary

✅ **Solution**: Set Root Directory to `frontend` in Vercel Settings

📁 **Why**: Your Next.js app is in `frontend/` subdirectory, not repo root

🔄 **After**: Redeploy to apply changes

⏱️ **Time**: 2 minutes

---

**Common monorepo issue - Now fixed!** 🚀
