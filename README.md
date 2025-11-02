# VESPER42 - Entertainment Intelligence Platform

![VESPER42 Logo](./screenshots/logo.png)

> Advanced screenplay analysis and generation platform powered by data from 100+ successful films and TV shows.

**Built by Dream Forge Vision**

---

## 🎯 Overview

VESPER42 is an AI-powered entertainment intelligence platform that analyzes screenplay structure, predicts success probability, and generates professional script outlines based on proven Hollywood patterns.

### Key Features

- **📊 Analytics Dashboard** - Real-time metrics from 100 analyzed scripts, 4,750+ scenes, and 32,000+ dialogue lines
- **📚 Script Library** - Comprehensive database of successful screenplays with ratings, genres, and metadata
- **📈 Advanced Analytics** - Genre distribution, structure insights, and pattern recognition
- **🤖 Script Generator** - AI-powered outline generation using industry-standard beat timing
- **🎯 Success Prediction** - Data-driven probability scoring based on comparable successful films
- **⚡ Professional Structure** - Complete 3-act structure with precise page timing

---

## 🖼️ Screenshots

### Dashboard Overview
![Dashboard](./screenshots/overview.png)

### Script Library
![Script Library](./screenshots/library.png)

### Analytics
![Analytics](./screenshots/analytics.png)

### Script Generator
![Generator Input](./screenshots/generator-input.png)
![Generator Output](./screenshots/generator-output.png)

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Material-UI (MUI)** - Component library
- **Inter Font** - Professional typography
- **Custom Theme** - Dark mode Enterprise design

### Backend
- **Node.js + Express** - API server
- **Supabase** - PostgreSQL database
- **RESTful API** - 5 main endpoints

### Testing
- **Jest** - Testing framework
- **Supertest** - API testing
- **React Testing Library** - Component testing
- **15 passing tests** - Backend + Frontend coverage

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/vesper42.git
cd vesper42
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
node api-server.js
```

3. **Setup Frontend**
```bash
cd ../dashboard
npm install
npm start
```

4. **Open in browser**
```
Frontend: http://localhost:3000
Backend: http://localhost:3001
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:3001/api`

#### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "VESPER42 Entertainment Intelligence API",
  "timestamp": "2024-11-01T12:00:00.000Z"
}
```

#### `GET /stats`
Returns database statistics

**Response:**
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

#### `GET /genres`
Returns list of available genres

**Response:**
```json
{
  "success": true,
  "genres": ["Action", "Drama", "Crime", "Thriller", "Sci-Fi", ...]
}
```

#### `GET /examples/:genre`
Returns example scripts for a specific genre

**Parameters:**
- `genre` (string) - Genre name (e.g., "Action")

**Response:**
```json
{
  "success": true,
  "examples": [
    {
      "title": "Aliens",
      "rating": 8.0,
      "year": 1986,
      "page_count": 120
    }
  ]
}
```

#### `POST /generate-outline`
Generates a complete screenplay outline

**Request Body:**
```json
{
  "premise": "A retired CIA agent must rescue his daughter",
  "genre": "Action",
  "targetLength": 110
}
```

**Response:**
```json
{
  "success": true,
  "outline": {
    "premise": "A retired CIA agent must rescue his daughter",
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
      "reasoning": "Based on 4 similar successful Action scripts",
      "comparables": [...]
    },
    "act1": { ... },
    "act2a": { ... },
    "act2b": { ... },
    "act3": { ... }
  }
}
```

---

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

**Coverage:**
- ✅ 10/10 tests passing
- API endpoints validation
- Error handling
- Input validation
- Structure verification

### Run Frontend Tests
```bash
cd dashboard
npm test
```

**Coverage:**
- ✅ 5/5 tests passing
- Component rendering
- Navigation
- User interactions

### Generate Coverage Reports
```bash
npm run test:coverage
```

---

## 📊 Data

### Dataset
- **100 analyzed screenplays** from successful films (1970-2024)
- **IMDB rating threshold:** 7.0+
- **Genres covered:** Action, Drama, Crime, Thriller, Sci-Fi, Comedy, Horror, Romance, and more

### Analysis Depth
- Complete 3-act structure breakdown
- Scene-by-scene analysis (4,750+ scenes)
- Dialogue patterns (32,400+ lines)
- Character relationships (850+ patterns)
- Beat timing optimization

---

## 🎨 Design Philosophy

### Professional & Analytical
- Dark theme for extended viewing comfort
- Inter font for maximum readability
- Data-driven UI with clear hierarchy
- Minimal use of decorative elements
- Focus on content and functionality

### Enterprise-Grade
- Consistent spacing and alignment
- Smooth animations and transitions
- Responsive design (desktop, tablet, mobile)
- Accessible color contrast
- Professional tooltips and error messages

---

## 🔧 Configuration

### Environment Variables (Backend)

Create `.env` file in `backend/` directory:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Frontend Configuration

The frontend connects to backend at `http://localhost:3001` by default.

To change this, edit `src/components/*/API_BASE` constant.

---

## 📦 Project Structure
```
vesper42/
├── backend/
│   ├── api-server.js           # Express API server
│   ├── __tests__/              # API tests
│   ├── package.json
│   └── .env
├── dashboard/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScriptsList.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── GenerateScript.jsx
│   │   │   └── Logo.jsx
│   │   ├── App.js
│   │   ├── theme.js
│   │   └── index.js
│   └── package.json
├── screenshots/                # UI screenshots
└── README.md
```

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd dashboard
vercel deploy --prod
```

### Backend (Railway/Render)
```bash
cd backend
# Follow Railway/Render deployment instructions
```

---

## 🤝 Contributing

This is a proprietary project by Dream Forge Vision.

---

## 📄 License

© 2024 Dream Forge Vision. All rights reserved.

---

## 👨‍💻 Developer

Built by Dream Forge Vision

For inquiries: contact@dreamforgevision.com

---

## 🙏 Acknowledgments

- Dataset compiled from publicly available screenplays
- Inspired by industry-standard screenplay structure (Save the Cat, Hero's Journey)
- Material-UI for component library
- Supabase for database infrastructure

---

## 📈 Roadmap

### Planned Features
- [ ] PDF export for generated outlines
- [ ] User accounts and saved outlines
- [ ] Advanced search and filtering
- [ ] Character name generator
- [ ] Dialogue analyzer
- [ ] Comparative analysis tool
- [ ] Mobile app

---

**Built with 💙 by Dream Forge Vision**
