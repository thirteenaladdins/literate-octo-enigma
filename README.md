# Signals from an Unfinished Machine

An AI-powered generative art portfolio that creates unique P5.js artworks daily using OpenAI, automatically posts them to Twitter, and showcases them in a beautiful React-based gallery.

## Features

- 🎨 **AI-Generated Art**: Daily unique generative artworks created by OpenAI
- 🤖 **Automated Pipeline**: GitHub Actions workflow generates, commits, and posts artwork automatically
- 🐦 **Twitter Integration**: Automatically posts new artworks to Twitter
- 📸 **Screenshot Capture**: Uses Puppeteer to capture high-quality artwork images
- 🎭 **Multiple Templates**: 5 distinct visual styles (particles, grids, orbitals, flow fields, noise waves)
- 🌐 **Modern React UI**: Beautiful, responsive portfolio interface
- 🔄 **Daily Automation**: Runs every day at 7:05 AM UTC

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

## AI Artwork Generation

### Overview

This project includes an automated AI-powered artwork generation system that creates unique generative art daily.

### How It Works

1. **OpenAI Concept Generation**: The system uses OpenAI's GPT-4 to generate creative concepts for generative art, including:
   - Visual template selection
   - Color palettes
   - Movement patterns
   - Element density
   - Artistic mood and description

2. **P5.js Code Generation**: The AI concept is translated into working P5.js code using predefined templates:
   - `particleSystem` - Floating particles with organic movement
   - `gridPattern` - Structured grid-based compositions
   - `orbitalMotion` - Circular orbiting patterns
   - `flowField` - Flowing organic patterns
   - `noiseWaves` - Wave-like patterns using Perlin noise

3. **Screenshot Capture**: Puppeteer renders the sketch and captures a 1200x1200px image

4. **Twitter Posting**: The artwork is automatically posted to Twitter with its AI-generated title

5. **GitHub Commit**: All changes are committed and pushed to the repository

### Setting Up Automation

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Configure GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add:

- `OPENAI_API_KEY` - Your OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- `TWITTER_API_KEY` - Twitter API key
- `TWITTER_API_SECRET` - Twitter API secret  
- `TWITTER_ACCESS_TOKEN` - Twitter access token
- `TWITTER_ACCESS_TOKEN_SECRET` - Twitter access token secret
- `PORTFOLIO_URL` - Your portfolio website URL

#### 3. Get Twitter API Credentials

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 1.0a with Read and Write permissions
4. Generate API keys and access tokens
5. Add them to GitHub Secrets

#### 4. Test Locally

Create a `.env` file (use `env.example` as template):

```bash
cp env.example .env
```

Fill in your credentials, then test:

```bash
# Dry run (no Twitter posting)
npm run generate:daily -- --dry-run

# Full run with Twitter posting
npm run generate:daily
```

### Manual Workflow Trigger

You can manually trigger the artwork generation from the GitHub Actions tab:

1. Go to Actions → Daily AI Artwork Signal
2. Click "Run workflow"
3. Choose branch and click "Run workflow"

### Available Scripts

#### `npm run generate:daily`

Generates a new AI artwork, commits it, and posts to Twitter. Options:
- `--dry-run` - Skip Twitter posting
- `--tomorrow` - Use tomorrow's date

#### `npm run add:placeholder`

Generates a simple placeholder artwork (legacy system).

### Template System

Templates are located in `scripts/templates/`:

- Each template is a function that accepts parameters (colors, density, movement, shapes)
- Returns a complete P5.js sketch as a string
- Parameterized to allow AI concept customization

### Services

Located in `scripts/services/`:

- **openaiService.js** - OpenAI API integration for concept generation
- **artGenerator.js** - Translates AI concepts into P5.js code
- **screenshotService.js** - Puppeteer-based screenshot capture
- **twitterService.js** - Twitter API integration for posting

### Troubleshooting

**OpenAI API Errors**
- Verify your API key is valid and has credits
- Check the console output for specific error messages

**Twitter API Errors**
- Ensure all 4 credentials are correct
- Verify your app has Read and Write permissions
- Check rate limits (1 post every few seconds)

**Puppeteer Errors**
- GitHub Actions installs chromium dependencies automatically
- For local issues, install chromium: `npx puppeteer browsers install chrome`

**Screenshot Issues**
- Ensure sketches use valid P5.js syntax
- Check that the sketch renders within 3 seconds
- Verify the canvas size is set correctly

### Architecture

```
scripts/
├── generateDailyArtwork.js   # Main orchestration script
├── services/
│   ├── openaiService.js       # AI concept generation
│   ├── artGenerator.js        # P5.js code generation
│   ├── screenshotService.js   # Image capture
│   └── twitterService.js      # Social media posting
└── templates/
    ├── particleSystem.js      # Particle template
    ├── gridPattern.js         # Grid template
    ├── orbitalMotion.js       # Orbital template
    ├── flowField.js           # Flow field template
    └── noiseWaves.js          # Noise waves template
```

### Contributing

To add new templates:

1. Create a new file in `scripts/templates/`
2. Export a function that accepts `params` and returns P5.js code
3. Add the template name to `openaiService.js` validation
4. Add the template to `artGenerator.js` templates object

### License

MIT
