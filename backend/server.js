// server.js - Vesper42 Backend
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Initialize OpenAI
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Store for temporary data (if Supabase is not connected)
let tempStorage = {
    trends: [],
    social: [],
    predictions: []
};

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date() });
});

// ============ DASHBOARD ENDPOINTS ============
app.get('/api/dashboard/metrics', async (req, res) => {
    try {
        // Try to get from Supabase first
        const { data: trends } = await supabase
            .from('trends')
            .select('*')
            .limit(100);
        
        const { data: social } = await supabase
            .from('social_signals')
            .select('*')
            .limit(100);

        const metrics = {
            totalShows: trends?.length || tempStorage.trends.length || 0,
            avgMomentum: calculateAvgMomentum(trends || tempStorage.trends),
            socialSignals: social?.length || tempStorage.social.length || 0,
            lastUpdate: new Date().toLocaleTimeString()
        };

        res.json(metrics);
    } catch (error) {
        console.error('Dashboard error:', error);
        // Fallback to temp storage
        res.json({
            totalShows: tempStorage.trends.length,
            avgMomentum: calculateAvgMomentum(tempStorage.trends),
            socialSignals: tempStorage.social.length,
            lastUpdate: new Date().toLocaleTimeString()
        });
    }
});

// ============ TRENDS ENDPOINTS ============
app.post('/api/trends/collect', async (req, res) => {
    try {
        console.log('Collecting trends from TMDB...');
        
        // Mock data for testing (replace with real TMDB API call)
        const mockTrends = generateMockTrends();
        
        // Try to save to Supabase
        try {
            const { data, error } = await supabase
                .from('trends')
                .upsert(mockTrends, { onConflict: 'tmdb_id' });
            
            if (error) throw error;
            console.log(`Saved ${mockTrends.length} trends to Supabase`);
        } catch (dbError) {
            console.log('Supabase error, using temp storage:', dbError.message);
            tempStorage.trends = mockTrends;
        }

        res.json({ 
            success: true, 
            count: mockTrends.length,
            message: 'Trends collected successfully'
        });
    } catch (error) {
        console.error('Trends collection error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/trends', async (req, res) => {
    try {
        // Try Supabase first
        const { data, error } = await supabase
            .from('trends')
            .select('*')
            .order('momentum_score', { ascending: false })
            .limit(20);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.log('Using temp storage for trends');
        res.json(tempStorage.trends.slice(0, 20));
    }
});

// ============ PREDICTION ENDPOINTS ============
app.post('/api/predict/score', async (req, res) => {
    try {
        const { title, genre, logline, targetAudience } = req.body;
        
        // Validate input
        if (!title || !genre || !logline || !targetAudience) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Calculate score (mock for now, can integrate OpenAI here)
        const score = Math.floor(Math.random() * 30) + 70; // 70-100 range
        const marketFit = ['Strong', 'Moderate', 'Promising'][Math.floor(Math.random() * 3)];
        
        const result = {
            score,
            marketFit,
            analysis: `Based on current market trends, "${title}" shows ${marketFit.toLowerCase()} potential in the ${genre} genre. The concept appeals to ${targetAudience} demographics.`,
            recommendations: [
                `Consider similar successful ${genre} titles`,
                `Focus on ${targetAudience} marketing channels`,
                'Develop strong character arcs to enhance engagement'
            ],
            timestamp: new Date()
        };

        // Store prediction
        tempStorage.predictions.push({ ...req.body, ...result });

        res.json(result);
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============ SOCIAL ENDPOINTS ============
app.post('/api/social/collect', async (req, res) => {
    try {
        console.log('Collecting social signals...');
        
        // Mock social data
        const mockSocial = generateMockSocialData();
        
        // Try to save to Supabase
        try {
            const { data, error } = await supabase
                .from('social_signals')
                .upsert(mockSocial, { onConflict: 'id' });
            
            if (error) throw error;
            console.log(`Saved ${mockSocial.length} social signals`);
        } catch (dbError) {
            console.log('Using temp storage for social data');
            tempStorage.social = mockSocial;
        }

        res.json({ 
            success: true, 
            count: mockSocial.length,
            shows: new Set(mockSocial.map(s => s.show_title)).size,
            message: 'Social data collected'
        });
    } catch (error) {
        console.error('Social collection error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/social', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('social_signals')
            .select('*')
            .order('buzz_score', { ascending: false })
            .limit(20);

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.log('Using temp storage for social data');
        res.json(tempStorage.social.slice(0, 20));
    }
});

// ============ HELPER FUNCTIONS ============
function calculateAvgMomentum(trends) {
    if (!trends || trends.length === 0) return 0;
    const sum = trends.reduce((acc, t) => acc + (t.momentum_score || 0), 0);
    return (sum / trends.length).toFixed(1);
}

function generateMockTrends() {
    const shows = [
        { title: 'The Last of Us', type: 'tv', genre: 'Drama', rating: 8.8 },
        { title: 'Wednesday', type: 'tv', genre: 'Comedy', rating: 8.2 },
        { title: 'Oppenheimer', type: 'movie', genre: 'Drama', rating: 8.5 },
        { title: 'Barbie', type: 'movie', genre: 'Comedy', rating: 7.3 },
        { title: 'Succession', type: 'tv', genre: 'Drama', rating: 8.9 },
        { title: 'The Bear', type: 'tv', genre: 'Drama', rating: 8.5 },
        { title: 'Dune: Part Two', type: 'movie', genre: 'Sci-Fi', rating: 8.8 },
        { title: 'Spider-Man: Across the Spider-Verse', type: 'movie', genre: 'Animation', rating: 8.7 },
        { title: 'One Piece', type: 'tv', genre: 'Adventure', rating: 8.4 },
        { title: 'Ahsoka', type: 'tv', genre: 'Sci-Fi', rating: 7.9 }
    ];

    return shows.map((show, index) => ({
        tmdb_id: 1000 + index,
        title: show.title,
        media_type: show.type,
        genre: show.genre,
        vote_average: show.rating,
        popularity: Math.floor(Math.random() * 500) + 100,
        momentum_score: (Math.random() * 10).toFixed(1),
        release_date: '2024-01-01',
        created_at: new Date()
    }));
}

function generateMockSocialData() {
    const shows = ['The Last of Us', 'Wednesday', 'Oppenheimer', 'Barbie', 'Succession'];
    
    return shows.map((show, index) => ({
        id: `social_${index}_${Date.now()}`,
        show_title: show,
        platform: 'reddit',
        sentiment_score: (Math.random() * 10).toFixed(1),
        engagement_score: Math.floor(Math.random() * 1000),
        mention_count: Math.floor(Math.random() * 100),
        buzz_score: (Math.random() * 10).toFixed(1),
        collected_at: new Date()
    }));
}

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
    
    // Test Supabase connection
    supabase
        .from('trends')
        .select('count')
        .limit(1)
        .then(() => console.log('✅ Connected to Supabase!'))
        .catch(err => console.log('⚠️ Supabase connection failed, using local storage:', err.message));
});
