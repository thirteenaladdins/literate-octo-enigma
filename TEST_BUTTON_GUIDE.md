# Test Artwork Button Guide

## 🎨 Overview

A floating test button has been added to your React app that lets you trigger the entire AI artwork generation pipeline with one click from the UI.

## 📦 What Was Added

### New Files
- `server.js` - Express API server for triggering artwork generation
- `scripts/testArtworkFlow.js` - Standalone test script wrapper
- `src/components/TestArtworkButton.js` - React UI component

### Modified Files
- `package.json` - Added express, cors, concurrently dependencies and new scripts
- `src/App.js` - Integrated TestArtworkButton component (dev mode only)
- `src/App.css` - Added test button styles

## 🚀 How to Use

### Step 1: Start Both Servers

You have two options:

**Option A: Run both together (recommended)**
```bash
npm run dev:all
```

This runs both the React dev server (port 3000) and the API server (port 3001) concurrently.

**Option B: Run separately**
```bash
# Terminal 1: API server
npm run server

# Terminal 2: React app
npm start
```

### Step 2: Use the Test Button

1. Open your app at http://localhost:3000
2. Look for the floating test button in the bottom-right corner
3. Check/uncheck "Dry Run" option:
   - ✅ **Checked (default)**: Generates artwork but doesn't post to Twitter
   - ☐ **Unchecked**: Full run including Twitter posting
4. Click "🎨 Generate Test Artwork"
5. Wait 30-60 seconds while the AI generates the artwork
6. View the results in the card

### Step 3: Check Results

**Success:** 
- ✅ Green success message appears
- View detailed output by clicking "View Output"
- Check `src/sketches/` for new artwork file
- Check `screenshots/` for captured image
- If not dry run, check Twitter for posted tweet

**Error:**
- ❌ Red error message with details
- Check the console for more information
- Verify API server is running
- Check `.env` file has correct credentials

## 🔧 Available Commands

```bash
# Run both server and app together
npm run dev:all

# Run API server only
npm run server

# Run React app only
npm start

# Test from command line (dry run)
npm run test:artwork -- --dry-run

# Test from command line (full)
npm run test:artwork
```

## 📍 Endpoints

The API server provides:

- `GET /api/health` - Health check
- `POST /api/test-artwork` - Trigger artwork generation
  - Body: `{ "dryRun": true/false }`

## ⚙️ Configuration

The test button only appears in **development mode**. In production builds, it will be automatically hidden.

To show it in production, modify `src/App.js`:
```jsx
// Change this line:
{process.env.NODE_ENV === "development" && <TestArtworkButton />}

// To this:
<TestArtworkButton />
```

## 🎯 What Happens When You Click

1. **UI → API**: Browser sends POST request to `http://localhost:3001/api/test-artwork`
2. **API → Script**: Express server calls `generateDailyArtwork.js`
3. **OpenAI**: AI generates a unique art concept
4. **Art Generator**: Concept is translated to P5.js code
5. **File System**: Sketch file is created in `src/sketches/`
6. **Metadata**: `artworks.json` is updated
7. **Registry**: `sketches/index.js` is regenerated
8. **Puppeteer**: Screenshot is captured
9. **Twitter** (if not dry run): Artwork is posted
10. **Response**: Results are sent back to UI

## 📝 Example Response

```json
{
  "success": true,
  "message": "Artwork generated successfully (dry run - no Twitter post)",
  "output": "Generated art concept: Cosmic Dance...\n✅ Daily artwork generated successfully!"
}
```

## 🐛 Troubleshooting

### "Failed to connect to server"
**Solution:** Start the API server with `npm run server`

### "OpenAI API key is required"
**Solution:** Add `OPENAI_API_KEY` to your `.env` file

### "Twitter credentials are incomplete"
**Solution:** Add all 4 Twitter credentials to `.env` file

### Button doesn't appear
**Solution:** Make sure you're running in development mode (`npm start` not `npm run build`)

### Request times out
**Solution:** The process can take 60+ seconds. The timeout is set to 2 minutes. If it still times out, check the server logs for errors.

## 🎨 UI Features

- **Dry Run Toggle**: Safely test without posting to Twitter
- **Loading State**: Shows spinner and progress message
- **Success/Error Display**: Clear feedback with expandable details
- **Responsive**: Works on mobile and desktop
- **Fixed Position**: Floats in bottom-right, doesn't interfere with content

## 🔒 Security Note

- The test button only appears in development
- API server is for local testing only
- Never expose the API server to public internet
- Keep your `.env` file secure

## 💡 Tips

- Use dry run first to test the pipeline
- Check the expanded output to see AI concept details
- Each test creates a real artwork file (they won't duplicate on same day)
- Screenshots are auto-cleaned after 7 days
- You can manually trigger from command line with `npm run test:artwork`

## 📚 Related Documentation

- See `QUICK_START.md` for initial setup
- See `IMPLEMENTATION_SUMMARY.md` for system overview
- See `README.md` for full documentation

---

**Ready to test?** Run `npm run dev:all` and click the button! 🚀

