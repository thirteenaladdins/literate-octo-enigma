# Quick Start Guide - AI Artwork Generation

## 🚀 Get Started in 5 Minutes

### Step 1: Get API Keys

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

#### Twitter API Credentials
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new Project and App
3. Go to your App Settings → Keys and tokens
4. Generate:
   - API Key and Secret
   - Access Token and Secret (with Read and Write permissions)

### Step 2: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret" for each:

```
OPENAI_API_KEY = sk-...
TWITTER_API_KEY = your_api_key
TWITTER_API_SECRET = your_api_secret
TWITTER_ACCESS_TOKEN = your_access_token
TWITTER_ACCESS_TOKEN_SECRET = your_access_token_secret
PORTFOLIO_URL = https://your-site.com
```

### Step 3: Test Locally (Optional)

```bash
# Create .env file
cp env.example .env

# Edit .env with your credentials
# (use any text editor)

# Test without posting to Twitter
npm run generate:daily -- --dry-run
```

### Step 4: Run!

**Option A: Wait for automatic run**
- Runs daily at 7:05 AM UTC automatically

**Option B: Manual trigger**
1. Go to Actions tab on GitHub
2. Click "Daily AI Artwork Signal"
3. Click "Run workflow"
4. Click green "Run workflow" button

## 📋 Common Commands

```bash
# Dry run (no Twitter post)
npm run generate:daily -- --dry-run

# Full run with Twitter
npm run generate:daily

# Use tomorrow's date
npm run generate:daily -- --tomorrow

# Install dependencies
npm install

# Start dev server (to view artworks)
npm start
```

## 🎨 What Happens Each Day

1. AI generates a unique art concept
2. System creates P5.js sketch code
3. Puppeteer captures a screenshot
4. Tweet is posted with artwork image
5. Code is committed to repository
6. Artwork appears in your portfolio

## ⚠️ Troubleshooting

**"OpenAI API key is required"**
- Check that OPENAI_API_KEY is set in GitHub Secrets
- Verify the key starts with `sk-`

**"Twitter credentials are incomplete"**
- Ensure all 4 Twitter secrets are set
- Verify your app has Read and Write permissions

**"Artwork already exists"**
- The system prevents duplicates for the same day
- Use `--tomorrow` flag or wait until tomorrow

**Puppeteer errors**
- GitHub Actions installs dependencies automatically
- For local testing: `npx puppeteer browsers install chrome`

## 📦 What's Installed

The system uses:
- **OpenAI GPT-4** - For creative concept generation
- **Puppeteer** - For capturing artwork screenshots
- **Twitter API v2** - For posting to social media
- **P5.js** - For generative art rendering

## 🎯 Expected Costs

- **OpenAI**: ~$0.001-0.01 per artwork (varies by model/usage)
- **Twitter API**: Free with standard access
- **GitHub Actions**: Free for public repos

## 📱 Example Tweet Format

```
Signal 006: Cosmic Dance of Digital Fireflies

https://your-portfolio.com#006
```

With a 1200x1200px image of the generated artwork.

## 🔒 Security Best Practices

- ✅ Never commit .env files
- ✅ Use GitHub Secrets for all credentials
- ✅ Rotate API keys periodically
- ✅ Monitor OpenAI usage/costs
- ✅ Review Twitter posts regularly

## 💡 Tips

- Test with `--dry-run` first to verify everything works
- Check the Actions log for detailed error messages
- Each artwork is unique - no two days are the same
- Screenshots are automatically cleaned up after 7 days
- The legacy `npm run add:placeholder` still works

## 📚 Learn More

See the full README.md for:
- Detailed architecture
- Template creation guide
- Advanced customization
- Contributing guidelines

---

**Questions?** Check the logs in GitHub Actions or review IMPLEMENTATION_SUMMARY.md

