# VESPER42 - Complete Setup Guide

This guide will walk you through setting up VESPER42 from scratch.

---

## Prerequisites

### Required Software
- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Required Accounts
- **Supabase** account ([Sign up](https://supabase.com/))

### System Requirements
- **OS:** macOS, Linux, or Windows 10+
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 500MB for dependencies

---

## Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/vesper42.git
cd vesper42
```

---

## Step 2: Database Setup (Supabase)

### 2.1 Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name:** vesper42
   - **Database Password:** (choose a strong password)
   - **Region:** (closest to you)
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### 2.2 Get API Credentials

1. In your project dashboard, click **Settings** (gear icon)
2. Go to **API** section
3. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 2.3 Create Database Tables

1. Click **SQL Editor** in sidebar
2. Click **New Query**
3. Paste and run this SQL:
```sql
-- Scripts table
CREATE TABLE scripts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  genre_tags TEXT[],
  imdb_rating NUMERIC(3,1),
  page_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scenes table
CREATE TABLE scenes (
  id SERIAL PRIMARY KEY,
  script_id INTEGER REFERENCES scripts(id),
  scene_number INTEGER,
  location TEXT,
  time_of_day TEXT,
  page_start INTEGER,
  page_end INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dialogue table
CREATE TABLE dialogue (
  id SERIAL PRIMARY KEY,
  scene_id INTEGER REFERENCES scenes(id),
  character_name TEXT,
  line_text TEXT,
  line_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Learned patterns table
CREATE TABLE learned_patterns (
  id SERIAL PRIMARY KEY,
  pattern_type TEXT,
  genre TEXT,
  description TEXT,
  success_rate NUMERIC(5,2),
  sample_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_scripts_genre ON scripts USING GIN(genre_tags);
CREATE INDEX idx_scripts_rating ON scripts(imdb_rating);
CREATE INDEX idx_scenes_script ON scenes(script_id);
CREATE INDEX idx_dialogue_scene ON dialogue(scene_id);
```

4. Click **RUN**

---

## Step 3: Backend Setup

### 3.1 Install Dependencies
```bash
cd backend
npm install
```

**Packages installed:**
- express (API server)
- cors (cross-origin requests)
- dotenv (environment variables)
- @supabase/supabase-js (database client)

### 3.2 Configure Environment

Create `.env` file:
```bash
nano .env
```

Paste your credentials:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
NODE_ENV=development
```

**Save:** `Ctrl+O` → `Enter` → `Ctrl+X`

### 3.3 Verify Setup
```bash
node api-server.js
```

**Expected output:**
```
============================================================
VESPER42 ENTERTAINMENT INTELLIGENCE API
============================================================

Server: http://localhost:3001

Endpoints:
   GET  /api/health
   GET  /api/stats
   GET  /api/genres
   GET  /api/examples/:genre
   POST /api/generate-outline

============================================================
```

### 3.4 Test API

Open new terminal:
```bash
curl http://localhost:3001/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "message": "VESPER42 Entertainment Intelligence API",
  "timestamp": "2024-11-01T12:00:00.000Z"
}
```

---

## Step 4: Frontend Setup

### 4.1 Install Dependencies

Open new terminal:
```bash
cd ~/Documents/vesper42/dashboard
npm install
```

**Packages installed:**
- react & react-dom (UI framework)
- @mui/material (component library)
- @mui/icons-material (icons)
- @testing-library/react (testing)

### 4.2 Start Development Server
```bash
npm start
```

**Expected:**
```
Compiled successfully!

You can now view vesper42 in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

### 4.3 Verify Frontend

1. Browser should auto-open to http://localhost:3000
2. You should see:
   - VESPER42 logo in header
   - "Entertainment Intelligence" subtitle
   - 4 navigation tabs
   - Dashboard with metrics

---

## Step 5: Populate Database (Optional)

If you want real data instead of empty tables:

### Option A: Manual Entry

Use Supabase Table Editor to add scripts manually.

### Option B: Bulk Import

Create a script to import from CSV/JSON (not included in this version).

---

## Step 6: Run Tests

### Backend Tests
```bash
cd backend
npm test
```

**Expected:** All 10 tests pass

### Frontend Tests
```bash
cd dashboard
npm test
```

**Expected:** All 5 tests pass

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill it
kill -9 <PID>
```

### Cannot Connect to API

**Error:** `Unable to connect to API server`

**Solutions:**
1. Make sure backend is running: `node api-server.js`
2. Check `.env` file has correct credentials
3. Verify Supabase project is active

### Missing Dependencies

**Error:** `Cannot find module 'xxx'`

**Solution:**
```bash
npm install
```

### Supabase Connection Error

**Error:** `Invalid API key`

**Solutions:**
1. Double-check SUPABASE_KEY in `.env`
2. Make sure you copied the **anon/public** key, not service_role
3. Verify no extra spaces in `.env` file

### React Port Conflict

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Use different port
PORT=3002 npm start
```

---

## Development Workflow

### Daily Development

1. **Start Backend:**
```bash
cd backend
node api-server.js
```

2. **Start Frontend (new terminal):**
```bash
cd dashboard
npm start
```

3. **Run Tests:**
```bash
# Backend
cd backend
npm test

# Frontend
cd dashboard
npm test
```

### Before Committing
```bash
# Run all tests
cd backend && npm test
cd ../dashboard && npm test

# Check for errors
npm run build
```

---

## Next Steps

- ✅ Basic setup complete
- [ ] [Deploy to production](./DEPLOYMENT.md)
- [ ] [API documentation](./API.md)
- [ ] [Contributing guidelines](./CONTRIBUTING.md)

---

## Need Help?

- **Issues:** [GitHub Issues](https://github.com/yourusername/vesper42/issues)
- **Email:** support@dreamforgevision.com
- **Docs:** [Full Documentation](./README.md)

---

**Setup complete! 🎉**
