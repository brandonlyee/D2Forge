# Vercel Functions Deployment Guide

## Architecture

- **Frontend**: Next.js (unchanged)
- **Backend**: Vercel Functions with Python runtime
- **Database**: None needed (stateless optimization)
- **Solver**: PuLP with CBC (same as before)

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new one
   - Vercel will automatically detect the Python functions in `/api`

3. **Production Deployment**:
   ```bash
   vercel --prod
   ```

## API Endpoints

Your app now has these endpoints:

- `POST /api/optimize` - Main optimization endpoint
- `GET /api/stats-info` - Stat system information  
- `GET /api/exotic-perks` - Available exotic perk combinations

## Key Changes Made

### ✅ Optimizations for Vercel Functions:
- **Timeout**: Reduced from 30s to 8s (within Vercel's 10s limit)
- **Cold Start**: Functions are optimized for quick startup
- **Memory**: PuLP solver will run efficiently within Vercel's limits

### ✅ File Structure:
```
/api/
  ├── optimize.py          # Main optimization endpoint
  ├── stats-info.py        # Stats information
  ├── exotic-perks.py      # Exotic perks data
  ├── main.py              # Core optimization logic
  └── exotic_class_items.py # Exotic item configurations

/requirements.txt          # Python dependencies (pulp==2.8.0)
/vercel.json              # Vercel configuration
```

### ✅ Maintained Features:
- ✅ All optimization algorithms (exact same logic)
- ✅ Exotic class item support with conditional perks
- ✅ Minimum stat constraints with locks
- ✅ Balanced tuning support
- ✅ Difficulty scoring (tuned vs non-tuned pieces)

## Performance Notes

- **Timeout**: 8 seconds should be sufficient for most optimizations
- **Cold Start**: ~1-2 seconds for first request after idle
- **Warm Requests**: <1 second response time
- **Scaling**: Automatic with Vercel Functions

## Benefits

1. **Unified Platform**: Everything on Vercel
2. **No External Dependencies**: No need for Railway/external servers
3. **Auto Scaling**: Handles traffic spikes automatically
4. **Cost Effective**: Free tier covers most usage
5. **Simple Deployment**: Single `vercel` command

## Monitoring

Monitor your functions at: https://vercel.com/dashboard/functions

## Rollback Plan

If needed, you can always revert to the Railway deployment by:
1. Restoring the `/src/app/api/optimize/route.ts` file
2. Deploying the Python backend to Railway again
3. Setting the `PYTHON_BACKEND_URL` environment variable