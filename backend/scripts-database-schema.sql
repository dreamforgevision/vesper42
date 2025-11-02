-- =========================================
-- VESPER42 - Scripts Database Schema
-- Phase 2: Script Collection & Analysis
-- =========================================

-- Main scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  writer TEXT,
  year INTEGER,
  source TEXT, -- 'imsdb', 'scriptsSlug', etc.
  source_url TEXT,
  raw_text TEXT, -- The full script text
  
  -- Structure Analysis (auto-calculated)
  page_count INTEGER,
  scene_count INTEGER,
  act_structure JSONB, -- {acts: 3, page_breaks: [30, 60]}
  
  -- Character Analysis
  character_count INTEGER,
  main_characters JSONB, -- [{name: "John", lines: 150, scenes: 45}]
  
  -- Dialogue Analysis
  dialogue_ratio FLOAT, -- percentage of script that's dialogue vs action
  avg_scene_length FLOAT,
  total_dialogue_lines INTEGER,
  
  -- Success Metrics (from TMDB/IMDB)
  tmdb_id INTEGER,
  imdb_id TEXT,
  box_office BIGINT, -- in USD
  imdb_rating FLOAT,
  rotten_tomatoes_score INTEGER,
  metacritic_score INTEGER,
  awards JSONB, -- [{name: "Oscar", category: "Best Picture", year: 2020}]
  
  -- Classification
  genre_tags TEXT[], -- ['action', 'sci-fi']
  themes TEXT[], -- ['redemption', 'family']
  tone TEXT, -- 'dark', 'comedic', 'dramatic'
  
  -- Processing Status
  processed BOOLEAN DEFAULT false,
  analysis_version TEXT DEFAULT '1.0',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patterns discovered from analyzing scripts
CREATE TABLE IF NOT EXISTS script_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pattern_type TEXT NOT NULL, -- 'opening_scene', 'act_break', 'climax', etc.
  genre TEXT,
  description TEXT,
  
  -- Pattern characteristics
  typical_page_location INTEGER, -- where does this usually happen?
  success_correlation FLOAT, -- how often does this pattern appear in successful scripts?
  
  -- Examples
  example_scripts JSONB, -- [{script_id: "...", title: "...", timestamp: 45}]
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Predictions history
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Input
  concept_title TEXT NOT NULL,
  concept_description TEXT,
  genre TEXT[],
  target_audience TEXT,
  
  -- Prediction Output
  success_probability FLOAT, -- 0.0 to 1.0
  confidence_level FLOAT,
  predicted_rating FLOAT,
  predicted_revenue BIGINT,
  
  -- Reasoning
  reasoning JSONB, -- [{factor: "Genre trending", impact: "+15%"}]
  similar_scripts JSONB, -- [{script_id, similarity_score}]
  
  -- Recommendations
  recommended_platform TEXT, -- 'theatrical', 'streaming', 'hybrid'
  recommended_budget_range TEXT, -- '$20M-$40M'
  recommended_release_window TEXT, -- 'Summer 2026'
  
  -- Meta
  model_version TEXT DEFAULT '1.0',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_scripts_title ON scripts(title);
CREATE INDEX IF NOT EXISTS idx_scripts_year ON scripts(year);
CREATE INDEX IF NOT EXISTS idx_scripts_genre ON scripts USING GIN(genre_tags);
CREATE INDEX IF NOT EXISTS idx_scripts_processed ON scripts(processed);
CREATE INDEX IF NOT EXISTS idx_scripts_tmdb ON scripts(tmdb_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success! Your database is ready for Phase 2! 🚀
