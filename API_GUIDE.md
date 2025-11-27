# Octo Studio API Guide

A guide for fetching artworks from the Octo Studio API.

## Base URL

**Local Development:**
```
http://localhost:3000
```

**Production (after Vercel deployment):**
```
https://your-project.vercel.app
```

---

## Endpoints

### 1. Get Latest Artwork

Fetch the most recently generated artwork.

**Endpoint:**
```
GET /api/artworks/latest
```

**Response:**
```json
{
  "id": "012",
  "title": "Signal 012: Drifting Colorscapes",
  "description": "A visual journey through drifting particles...",
  "date": "2025-11-26",
  "tags": ["generative", "ai-generated", "simple-modular", ...],
  "imageUrl": "https://wepwkddoljsgkhelrplp.supabase.co/storage/v1/object/public/artworks/images/012_ai_signal.png",
  "thumbnailUrl": "https://wepwkddoljsgkhelrplp.supabase.co/storage/v1/object/public/artworks/thumbnails/012_ai_signal.png",
  "template": "simpleModular",
  "colors": ["#FF9A8B", "#FFD29D", "#6EEDD8", "#D3B6F7"],
  "mood": "whimsical, soothing",
  "config": { ... }
}
```

**Example Usage:**

**JavaScript (Fetch):**
```javascript
async function getLatestArtwork() {
  const response = await fetch('https://your-api.vercel.app/api/artworks/latest');
  const artwork = await response.json();
  
  console.log(artwork.title);
  console.log(artwork.imageUrl);      // Full-size (2400x2400)
  console.log(artwork.thumbnailUrl);  // Thumbnail (400x400)
  
  return artwork;
}
```

**cURL:**
```bash
curl https://your-api.vercel.app/api/artworks/latest
```

**Python:**
```python
import requests

response = requests.get('https://your-api.vercel.app/api/artworks/latest')
artwork = response.json()

print(artwork['title'])
print(artwork['imageUrl'])      # Full-size (2400x2400)
print(artwork['thumbnailUrl'])  # Thumbnail (400x400)
```

---

### 2. Get All Artworks

Fetch all artworks with optional filtering.

**Endpoint:**
```
GET /api/artworks?limit=10&sort=desc
```

**Query Parameters:**
- `limit` (optional): Number of artworks to return (default: 100)
- `sort` (optional): Sort order - `desc` (newest first) or `asc` (oldest first) (default: `desc`)

**Response:**
```json
{
  "count": 12,
  "artworks": [
    {
      "id": "012",
      "title": "Signal 012: Drifting Colorscapes",
      "imageUrl": "...",
      "thumbnailUrl": "...",
      ...
    },
    {
      "id": "011",
      ...
    }
  ]
}
```

**Example Usage:**

**JavaScript:**
```javascript
async function getRecentArtworks(limit = 5) {
  const response = await fetch(
    `https://your-api.vercel.app/api/artworks?limit=${limit}&sort=desc`
  );
  const data = await response.json();
  
  return data.artworks; // Array of artwork objects
}
```

---

### 3. Get Artwork by ID

Fetch a specific artwork by its ID.

**Endpoint:**
```
GET /api/artworks/:id
```

**Example:**
```
GET /api/artworks/012
```

**Response:**
```json
{
  "id": "012",
  "title": "Signal 012: Drifting Colorscapes",
  "imageUrl": "...",
  "thumbnailUrl": "...",
  ...
}
```

**Example Usage:**

**JavaScript:**
```javascript
async function getArtworkById(id) {
  const response = await fetch(
    `https://your-api.vercel.app/api/artworks/${id}`
  );
  
  if (response.status === 404) {
    throw new Error('Artwork not found');
  }
  
  return await response.json();
}
```

---

## Image URLs

Each artwork includes two image URLs:

1. **`imageUrl`** - Full-size image (2400x2400 pixels)
   - Use for: Detail views, full-screen displays, downloads
   - Example: `https://wepwkddoljsgkhelrplp.supabase.co/storage/v1/object/public/artworks/images/012_ai_signal.png`

2. **`thumbnailUrl`** - Thumbnail image (400x400 pixels)
   - Use for: Gallery listings, previews, cards
   - Example: `https://wepwkddoljsgkhelrplp.supabase.co/storage/v1/object/public/artworks/thumbnails/012_ai_signal.png`

**Note:** Older artworks may have `imageUrl` and `thumbnailUrl` set to `null`. In that case, you can construct URLs using the `file` field:
- Full-size: `https://your-api.vercel.app/images/{file}.png`
- Thumbnail: `https://your-api.vercel.app/thumbnails/{file}_thumb.png`

---

## Complete Example: React Component

```jsx
import { useState, useEffect } from 'react';

function LatestArtwork() {
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLatest() {
      try {
        const response = await fetch('https://your-api.vercel.app/api/artworks/latest');
        const data = await response.json();
        setArtwork(data);
      } catch (error) {
        console.error('Failed to fetch artwork:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLatest();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!artwork) return <div>No artwork found</div>;

  return (
    <div>
      <h2>{artwork.title}</h2>
      <p>{artwork.description}</p>
      
      {/* Thumbnail for preview */}
      <img 
        src={artwork.thumbnailUrl || artwork.thumbnail} 
        alt={artwork.title}
        style={{ maxWidth: '400px' }}
      />
      
      {/* Full-size image (lazy load) */}
      <a href={artwork.imageUrl || artwork.image} target="_blank" rel="noopener">
        View Full Size
      </a>
      
      <div>
        <strong>Tags:</strong> {artwork.tags.join(', ')}
      </div>
      <div>
        <strong>Mood:</strong> {artwork.mood}
      </div>
    </div>
  );
}
```

---

## Complete Example: Next.js API Route

```javascript
// pages/api/latest-artwork.js
export default async function handler(req, res) {
  try {
    const response = await fetch('https://your-api.vercel.app/api/artworks/latest');
    const artwork = await response.json();
    
    res.status(200).json(artwork);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
}
```

---

## Complete Example: Gallery Component

```jsx
function ArtworkGallery() {
  const [artworks, setArtworks] = useState([]);

  useEffect(() => {
    async function fetchArtworks() {
      const response = await fetch(
        'https://your-api.vercel.app/api/artworks?limit=12&sort=desc'
      );
      const data = await response.json();
      setArtworks(data.artworks);
    }
    
    fetchArtworks();
  }, []);

  return (
    <div className="gallery">
      {artworks.map(artwork => (
        <div key={artwork.id} className="artwork-card">
          <img 
            src={artwork.thumbnailUrl || artwork.thumbnail}
            alt={artwork.title}
          />
          <h3>{artwork.title}</h3>
          <p>{artwork.description}</p>
          <a href={artwork.imageUrl || artwork.image}>
            View Full Size
          </a>
        </div>
      ))}
    </div>
  );
}
```

---

## Artwork Object Structure

```typescript
interface Artwork {
  id: string;                    // e.g., "012"
  title: string;                 // e.g., "Signal 012: Drifting Colorscapes"
  description: string;           // Artistic description
  date: string;                   // ISO date: "2025-11-26"
  tags: string[];                // Array of tags
  imageUrl: string | null;       // Full-size image URL (2400x2400)
  thumbnailUrl: string | null;   // Thumbnail URL (400x400)
  file: string;                  // Base filename: "012_ai_signal"
  thumbnail: string;             // Legacy thumbnail field
  category: string;              // "generative"
  status: string;                // "published"
  displayMode: string;           // "image"
  template: string;              // Template name: "simpleModular", "flowField", etc.
  colors: string[];              // Array of hex colors
  movement: string;              // Movement description
  density: number;               // Density value (20-100)
  mood: string;                  // Mood description
  seed: number;                  // Random seed for reproducibility
  config: object;                // Full configuration object
}
```

---

## Error Handling

**404 Not Found:**
```json
{
  "error": "Artwork not found"
}
```

**500 Server Error:**
The API may return a 500 error if the metadata file is missing or corrupted.

---

## Health Check

Check if the API is running:

**Endpoint:**
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-26T12:00:00.000Z"
}
```

---

## CORS

The API has CORS enabled, so you can call it from any domain. No authentication required.

---

## Rate Limiting

Currently, there are no rate limits. However, be respectful and cache responses when possible.

---

## Tips

1. **Cache the latest artwork** - Since new artworks are generated daily, you can cache the response for up to 24 hours.

2. **Use thumbnails for listings** - Always use `thumbnailUrl` for gallery views to improve performance.

3. **Lazy load full-size images** - Only load `imageUrl` when the user clicks to view the full artwork.

4. **Handle null URLs** - Older artworks may have `null` image URLs. Fall back to constructing URLs from the `file` field.

5. **Poll for updates** - If you want to show new artworks automatically, poll `/api/artworks/latest` every few hours and compare the `id` or `date` field.

---

## Example: Auto-Update Latest Artwork

```javascript
let lastArtworkId = null;

async function checkForNewArtwork() {
  const response = await fetch('https://your-api.vercel.app/api/artworks/latest');
  const artwork = await response.json();
  
  if (artwork.id !== lastArtworkId) {
    console.log('New artwork!', artwork.title);
    lastArtworkId = artwork.id;
    // Update your UI
  }
}

// Check every hour
setInterval(checkForNewArtwork, 60 * 60 * 1000);
```

---

## Support

For issues or questions, check the repository or open an issue.

