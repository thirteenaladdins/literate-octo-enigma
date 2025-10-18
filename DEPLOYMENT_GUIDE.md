# Deployment Guide

## Quick Deploy Options

### Option 1: GitHub Pages (Recommended for this project)

1. **Add homepage to package.json:**
   ```bash
   # Add this line to package.json
   "homepage": "https://yourusername.github.io/literate-octo-enigma"
   ```

2. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add deploy scripts to package.json:**
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Update GitHub Secrets:**
   - Go to Settings → Secrets → Actions
   - Update `PORTFOLIO_URL` to your GitHub Pages URL

### Option 2: Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow prompts** and get your deployment URL

4. **Update environment:**
   - Set `PORTFOLIO_URL` in your `.env` file
   - Update GitHub Secret `PORTFOLIO_URL` to your Vercel URL

### Option 3: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   netlify deploy --prod
   ```

3. **Get your site URL** and update configuration

## How Artwork Links Work

### URL Structure

When an artwork is posted to Twitter, the link follows this pattern:
```
https://your-site.com#019
```

### Navigation Flow

1. **User clicks Twitter link** → `https://your-site.com#019`
2. **App loads** and reads the hash (`019`)
3. **App finds artwork** with ID `019` in `artworks.json`
4. **App displays** the artwork in fullscreen viewer

### Testing Links

After deployment, test that hash navigation works:

```bash
# Visit these URLs in your browser
https://your-site.com         # Should show grid
https://your-site.com#019     # Should open artwork 019
https://your-site.com#006     # Should open artwork 006
```

## Update Portfolio URL

### For Local Development

1. **Edit `.env` file:**
   ```bash
   PORTFOLIO_URL=https://your-deployed-site.com
   ```

### For GitHub Actions (Production)

1. **Go to GitHub:** Settings → Secrets and variables → Actions
2. **Update secret:** `PORTFOLIO_URL`
3. **Set value:** `https://your-deployed-site.com`

### Verify Configuration

After updating, run a test:

```bash
npm run test:artwork
```

The tweet should now include your real website URL like:
```
Signal 020: Your Artwork Title

https://your-site.com#020
```

## Important Notes

### React Router vs Hash Navigation

This app uses **hash navigation** (`#`) instead of React Router because:
- ✅ Works with any hosting provider (no server config needed)
- ✅ Compatible with GitHub Pages
- ✅ Simple and reliable for static sites
- ✅ Twitter links work immediately after clicking

### OAuth Callback URL

If you're using OAuth2 for Twitter, make sure your callback URL in the Twitter Developer Portal matches your deployment:

**Local Development:**
```
http://localhost:3001/api/twitter/oauth2/callback
```

**Production:**
If you need OAuth in production, you'll need to:
1. Deploy the Express server separately (Railway, Render, Heroku)
2. Update `TWITTER_REDIRECT_URL` to point to your production server
3. Add the production callback URL in Twitter Developer Portal

## Deployment Checklist

- [ ] Choose hosting platform (GitHub Pages, Vercel, Netlify)
- [ ] Deploy the React app
- [ ] Get the deployed URL
- [ ] Update `PORTFOLIO_URL` in `.env` (local)
- [ ] Update `PORTFOLIO_URL` in GitHub Secrets (for automation)
- [ ] Test hash navigation works: `https://yoursite.com#019`
- [ ] Generate test artwork and verify tweet link
- [ ] Update README with live site URL

## Example Deployment URLs

Based on your GitHub username and repo name, your URL might be:

- **GitHub Pages:** `https://yourusername.github.io/literate-octo-enigma`
- **Vercel:** `https://literate-octo-enigma.vercel.app`
- **Netlify:** `https://literate-octo-enigma.netlify.app`
- **Custom:** `https://signals.yourname.com`

Choose one and update your configuration!

