# VESPER42 - API Documentation

Complete reference for the VESPER42 Entertainment Intelligence API.

**Base URL:** `http://localhost:3001/api`

**Production:** `https://api.vesper42.com/api` (when deployed)

---

## Authentication

Currently, the API does not require authentication for development.

For production deployment, implement:
- API keys
- Rate limiting
- CORS restrictions

---

## Endpoints

### 1. Health Check

Check if API server is running.

#### Request
```http
GET /api/health
```

#### Response

**Status:** `200 OK`
```json
{
  "status": "ok",
  "message": "VESPER42 Entertainment Intelligence API",
  "timestamp": "2024-11-01T12:34:56.789Z"
}
```

#### Example
```bash
curl http://localhost:3001/api/health
```

---

### 2. Get Statistics

Retrieve database statistics and metrics.

#### Request
```http
GET /api/stats
```

#### Response

**Status:** `200 OK`
```json
{
  "success": true,
  "stats": {
    "scripts": 100,
    "scenes": 4750,
    "dialogue_lines": 32400,
    "learned_patterns": 850
  }
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `scripts` | integer | Total number of analyzed scripts |
| `scenes` | integer | Total number of extracted scenes |
| `dialogue_lines` | integer | Total dialogue lines analyzed |
| `learned_patterns` | integer | Number of identified success patterns |

#### Example
```bash
curl http://localhost:3001/api/stats
```
```javascript
// JavaScript
const response = await fetch('http://localhost:3001/api/stats');
const data = await response.json();
console.log(data.stats.scripts); // 100
```

---

### 3. Get Genres

Retrieve list of available genres.

#### Request
```http
GET /api/genres
```

#### Response

**Status:** `200 OK`
```json
{
  "success": true,
  "genres": [
    "Action",
    "Adventure",
    "Comedy",
    "Crime",
    "Drama",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller"
  ]
}
```

#### Example
```bash
curl http://localhost:3001/api/genres
```

---

### 4. Get Genre Examples

Retrieve example scripts for a specific genre.

#### Request
```http
GET /api/examples/:genre
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `genre` | string | Yes | Genre name (case-sensitive) |

#### Response

**Status:** `200 OK`
```json
{
  "success": true,
  "examples": [
    {
      "title": "Aliens",
      "rating": 8.0,
      "year": 1986,
      "page_count": 120
    },
    {
      "title": "Predator",
      "rating": 7.5,
      "year": 1987,
      "page_count": 103
    }
  ]
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Script title |
| `rating` | float | IMDB rating (0.0-10.0) |
| `year` | integer | Release year |
| `page_count` | integer | Script length in pages |

#### Example
```bash
curl http://localhost:3001/api/examples/Action
```
```javascript
// JavaScript
const genre = 'Drama';
const response = await fetch(`http://localhost:3001/api/examples/${genre}`);
const data = await response.json();
console.log(data.examples);
```

---

### 5. Generate Outline

Generate a complete screenplay outline based on premise and genre.

#### Request
```http
POST /api/generate-outline
Content-Type: application/json
```

#### Request Body
```json
{
  "premise": "A retired CIA agent must rescue his daughter from human traffickers",
  "genre": "Action",
  "targetLength": 110
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `premise` | string | Yes | One-sentence story premise |
| `genre` | string | Yes | Script genre (must match available genres) |
| `targetLength` | integer | No | Target page count (default: genre average) |

#### Response

**Status:** `200 OK`
```json
{
  "success": true,
  "outline": {
    "premise": "A retired CIA agent must rescue his daughter from human traffickers",
    "genre": "Action",
    "structure": {
      "totalPages": 110,
      "act1End": 28,
      "act2aMidpoint": 55,
      "act2bEnd": 83,
      "act3End": 110
    },
    "prediction": {
      "probability": 0.75,
      "confidence": "high",
      "reasoning": "Based on 4 similar successful Action scripts (avg rating: 7.5)",
      "comparables": [
        {
          "title": "Aliens",
          "rating": 8.0,
          "year": 1986
        },
        {
          "title": "Predator",
          "rating": 7.5,
          "year": 1987
        },
        {
          "title": "American Sniper",
          "rating": 7.4,
          "year": 2014
        }
      ]
    },
    "recommendations": {
      "targetLength": "110 pages",
      "pacing": "Follow beat timing for maximum impact",
      "characters": "8-12 distinct characters",
      "dialogue": "Keep lines concise: 6-9 words average"
    },
    "act1": {
      "title": "ACT 1: SETUP",
      "pages": "1-28",
      "beats": [
        {
          "name": "Opening Image",
          "page": 1,
          "description": "Establish protagonist ordinary world before journey begins",
          "example": "Introduce protagonist in normal routine for Action genre"
        },
        {
          "name": "Inciting Incident",
          "page": 12,
          "description": "Event that disrupts ordinary world and starts story",
          "example": "Catalyst forcing protagonist into action: A retired CIA agent must rescue his daughter from human traffickers"
        },
        {
          "name": "Break into Two",
          "page": 28,
          "description": "Protagonist commits to the journey",
          "example": "Point of no return - enters new world"
        }
      ]
    },
    "act2a": { ... },
    "act2b": { ... },
    "act3": { ... }
  }
}
```

#### Error Responses

**Status:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Missing required fields: premise and genre"
}
```

#### Example
```bash
curl -X POST http://localhost:3001/api/generate-outline \
  -H "Content-Type: application/json" \
  -d '{
    "premise": "A hacker discovers a conspiracy",
    "genre": "Thriller",
    "targetLength": 105
  }'
```
```javascript
// JavaScript
const response = await fetch('http://localhost:3001/api/generate-outline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    premise: 'A hacker discovers a conspiracy',
    genre: 'Thriller',
    targetLength: 105
  })
});

const data = await response.json();
console.log(data.outline.structure);
```

---

## Response Structure Reference

### Outline Object
```typescript
interface Outline {
  premise: string;
  genre: string;
  structure: Structure;
  prediction: Prediction;
  recommendations: Recommendations;
  act1: Act;
  act2a: Act;
  act2b: Act;
  act3: Act;
}

interface Structure {
  totalPages: number;
  act1End: number;
  act2aMidpoint: number;
  act2bEnd: number;
  act3End: number;
}

interface Prediction {
  probability: number;  // 0.0-1.0
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  comparables: Comparable[];
}

interface Comparable {
  title: string;
  rating: number;
  year: number;
}

interface Recommendations {
  targetLength: string;
  pacing: string;
  characters: string;
  dialogue: string;
}

interface Act {
  title: string;
  pages: string;
  beats: Beat[];
}

interface Beat {
  name: string;
  page: number | string;
  description: string;
  example: string;
}
```

---

## Rate Limiting

**Development:** No limits

**Production (recommended):**
- 100 requests per hour per IP
- 10 requests per minute for `/generate-outline`

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Endpoint doesn't exist |
| 500 | Internal Server Error | Server error |

---

## Best Practices

### 1. Handle Errors
```javascript
try {
  const response = await fetch('http://localhost:3001/api/stats');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  // Use data
} catch (error) {
  console.error('API Error:', error);
}
```

### 2. Cache Responses
```javascript
// Cache genres list (rarely changes)
const genres = await fetch('/api/genres')
  .then(r => r.json())
  .then(d => d.genres);

localStorage.setItem('genres', JSON.stringify(genres));
```

### 3. Validate Input
```javascript
// Before calling generate-outline
if (!premise || premise.length < 10) {
  throw new Error('Premise too short');
}

if (!validGenres.includes(genre)) {
  throw new Error('Invalid genre');
}
```

---

## Support

For API questions or issues:
- Email: api@dreamforgevision.com
- GitHub Issues: [vesper42/issues](https://github.com/yourusername/vesper42/issues)

---

**Last Updated:** November 2024  
**API Version:** 1.0.0
