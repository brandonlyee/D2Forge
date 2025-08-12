# D2 Stat Tuner Deployment Guide

## Quick Deployment (Recommended)

### Backend Deployment (Railway)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway:**
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repo
   - Railway will auto-detect the Dockerfile
   - Set environment variables if needed
   - Deploy automatically

3. **Get Backend URL:**
   - Copy the deployed URL (e.g., `https://your-app.railway.app`)

### Frontend Deployment (Vercel)

1. **Set Environment Variable:**
   ```bash
   cd d2-stat-tuner-frontend
   echo "PYTHON_BACKEND_URL=https://your-backend.railway.app" > .env.production
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Select the `d2-stat-tuner-frontend` folder
   - Set build command: `npm run build`
   - Deploy automatically

## Alternative: All-in-One Railway Deployment

1. **Create monorepo structure:**
   ```bash
   # Create a single Dockerfile for both frontend and backend
   ```

2. **Use Railway templates:**
   - Deploy full-stack app in one go
   - Costs $5/month but simpler setup

## Free Options

### Vercel + Render (Free Tiers)
- **Frontend:** Vercel (free)
- **Backend:** Render (750 hours/month free)

### GitHub Pages + Railway (Mostly Free)
- **Frontend:** GitHub Pages (static export)
- **Backend:** Railway (pay as you go)

## Domain Setup

1. **Custom domain (optional):**
   - Buy domain (e.g., `d2stattuner.com`)
   - Point to Vercel deployment
   - Add SSL certificate (automatic)

## Monitoring & Analytics

1. **Add analytics:**
   - Vercel Analytics (free)
   - Google Analytics
   - Plausible (privacy-focused)

2. **Error monitoring:**
   - Sentry (free tier)
   - Railway built-in logs

## Cost Estimate

**Free Tier:**
- Vercel: Free
- Render: Free (with limitations)
- **Total: $0/month**

**Paid Tier:**
- Vercel Pro: $20/month (if needed)
- Railway: $5/month
- **Total: $5-25/month**

## Performance Tips

1. **Frontend optimizations:**
   - Next.js automatic optimizations
   - Image optimization enabled
   - CDN through Vercel

2. **Backend optimizations:**
   - Cache piece generation results
   - Add request rate limiting
   - Monitor solver performance

## Community Features to Add

1. **Share builds:**
   - Generate shareable URLs
   - Save/load configurations

2. **Build analytics:**
   - Track popular stat combinations
   - Show community trends

3. **User accounts (future):**
   - Save favorite builds
   - Build history

## Security Considerations

1. **Rate limiting:**
   - Prevent solver abuse
   - Limit requests per IP

2. **Input validation:**
   - Already implemented in API
   - Frontend validation in place

3. **CORS:**
   - Properly configured for production URLs