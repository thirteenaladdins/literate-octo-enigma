# Portfolio URL Setup Guide

## Current Status

✅ **Hash-based navigation is now working!**
- Clicking a tile updates the URL: `https://yoursite.com#019`
- Direct links work: Users can share/bookmark specific artworks
- Twitter links will deep-link to specific artworks

## Next Step: Deploy & Configure URL

### Tell me your deployment choice:

**Option A: GitHub Pages (Easiest)**
```bash
npm run deploy
```
Your site will be at: `https://YOUR_GITHUB_USERNAME.github.io/literate-octo-enigma`

**Option B: Vercel (Fast)**
- Push to GitHub
- Connect to Vercel
- Auto-deploys on every push
- Get URL like: `https://literate-octo-enigma.vercel.app`

**Option C: Netlify**
```bash
npm run build
netlify deploy --prod
```
Get URL like: `https://literate-octo-enigma.netlify.app`

**Option D: Custom Domain**
- Deploy to any of the above
- Add your custom domain in platform settings

## After Deployment

### 1. Update Local `.env`

```bash
# Edit .env file
PORTFOLIO_URL=https://your-actual-site.com
```

### 2. Update GitHub Secrets (for automation)

```bash
# Go to: https://github.com/YOUR_USERNAME/literate-octo-enigma/settings/secrets/actions
# Update or add:
# Name: PORTFOLIO_URL
# Value: https://your-actual-site.com
```

### 3. Test It Works

Visit these URLs to test hash navigation:
```
https://your-site.com          # Should show artwork grid
https://your-site.com#019      # Should open artwork 019
https://your-site.com#006      # Should open artwork 006
```

## Quick Deploy to GitHub Pages

If you want to use GitHub Pages, run these commands:

### Step 1: Update homepage in package.json

The homepage is currently set to `"."` (relative paths).
Update it to your GitHub Pages URL:

```json
{
  "homepage": "https://YOUR_GITHUB_USERNAME.github.io/literate-octo-enigma"
}
```

### Step 2: Deploy

```bash
npm run deploy
```

### Step 3: Enable GitHub Pages

1. Go to your repo on GitHub
2. Settings → Pages
3. Source: Deploy from branch
4. Branch: `gh-pages` → `/ (root)` → Save

### Step 4: Update Environment

```bash
# In .env
PORTFOLIO_URL=https://YOUR_GITHUB_USERNAME.github.io/literate-octo-enigma

# In GitHub Secrets
PORTFOLIO_URL=https://YOUR_GITHUB_USERNAME.github.io/literate-octo-enigma
```

## Example Tweet After Setup

Before:
```
Signal 019: Harmony of Floating Spheres

https://your-portfolio.com#019
```

After:
```
Signal 019: Harmony of Floating Spheres

https://yourusername.github.io/literate-octo-enigma#019
```

When someone clicks that link:
1. They land on your deployed site
2. The hash (#019) is detected
3. Artwork 019 opens automatically in fullscreen
4. Perfect sharing experience! 🎨

## What's Your GitHub Username?

Once you tell me, I can update the package.json homepage field for you!

Or if you're using Vercel/Netlify/custom domain, let me know and I'll help configure that instead.

