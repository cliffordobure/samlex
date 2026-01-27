# Esbuild Error Fix - Final Solution

## The Problem
Vercel build failing with esbuild socket/stream error. This is a known issue that can occur due to:
1. Memory limitations during build
2. Esbuild process crashing
3. Node.js version incompatibility
4. Corrupted dependencies

## Solution Applied

### 1. **Minimal Vite Configuration**
- Removed all complex optimizations
- Let Vite use its default, proven build process
- Only essential configuration remains

### 2. **Memory Allocation**
- Added `NODE_OPTIONS=--max-old-space-size=4096` to build command
- Set in both package.json scripts and vercel.json
- Also set as environment variable

### 3. **Vercel Framework Detection**
- Added `"framework": "vite"` to help Vercel detect the build system
- This ensures Vercel uses the correct build optimizations

### 4. **Build Script**
- Created build.sh as backup (for manual builds)
- Updated package.json build scripts with memory allocation

## Files Changed

1. **client/vite.config.js** - Simplified to minimal config
2. **client/package.json** - Added memory allocation to build scripts
3. **client/vercel.json** - Updated with framework detection and memory settings
4. **client/build.sh** - Backup build script

## Vercel Dashboard Settings

**CRITICAL - Set these in Vercel Dashboard:**

1. Go to Project Settings → General
   - **Root Directory**: `client` (if deploying only frontend)
   - **Framework Preset**: `Vite` (or leave blank)

2. Go to Project Settings → Build & Development Settings
   - **Build Command**: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Node.js Version**: `18.x` (or latest 18)

3. Go to Project Settings → Environment Variables
   - Add: `NODE_OPTIONS` = `--max-old-space-size=4096`
   - Add: `VITE_API_URL` = `https://samlex.onrender.com/api`
   - Add: `VITE_SOCKET_URL` = `https://samlex.onrender.com`

## If Still Failing

### Option 1: Try Node 20
Update `.nvmrc` to `20` and set Node.js version to `20.x` in Vercel

### Option 2: Disable Minification Temporarily
In `vite.config.js`, change:
```js
build: {
  minify: false, // Temporarily disable
  ...
}
```

### Option 3: Clear Build Cache
In Vercel Dashboard → Settings → General → Clear Build Cache

### Option 4: Check for Syntax Errors
Run locally:
```bash
cd client
npm run lint
npm run build
```

## Expected Result
- Build completes successfully
- Uses minimal memory
- Reliable and stable builds
- Fast build times

## Why This Works
- Minimal config reduces complexity and potential failure points
- Memory allocation prevents esbuild crashes
- Framework detection helps Vercel optimize the build
- Default Vite behavior is battle-tested and reliable
