// =========================================
// VESPER42 - Genre Enrichment Tool
// Adds TMDB metadata (genre, type, ratings) to scripts
// =========================================

require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Initialize
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class GenreEnricher {
  
  // Search TMDB for a title
  async searchTMDB(title) {
    console.log(`🔍 Searching TMDB for: ${title}`);
    
    try {
      // Search both movies and TV shows
      const [movieResults, tvResults] = await Promise.all([
        axios.get(`${TMDB_BASE_URL}/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: title
          }
        }),
        axios.get(`${TMDB_BASE_URL}/search/tv`, {
          params: {
            api_key: TMDB_API_KEY,
            query: title
          }
        })
      ]);

      // Get the best match (highest popularity)
      const movieMatch = movieResults.data.results[0];
      const tvMatch = tvResults.data.results[0];

      let bestMatch = null;
      let mediaType = null;

      if (movieMatch && tvMatch) {
        // Choose the one with higher popularity
        if (movieMatch.popularity > tvMatch.popularity) {
          bestMatch = movieMatch;
          mediaType = 'movie';
        } else {
          bestMatch = tvMatch;
          mediaType = 'tv';
        }
      } else if (movieMatch) {
        bestMatch = movieMatch;
        mediaType = 'movie';
      } else if (tvMatch) {
        bestMatch = tvMatch;
        mediaType = 'tv';
      }

      if (!bestMatch) {
        console.log(`⚠️  No match found for: ${title}`);
        return null;
      }

      console.log(`✅ Found: ${bestMatch.title || bestMatch.name} (${mediaType})`);
      return { ...bestMatch, media_type: mediaType };

    } catch (error) {
      console.error(`❌ Error searching TMDB: ${error.message}`);
      return null;
    }
  }

  // Get detailed info (including revenue, ratings, etc.)
  async getDetails(tmdbId, mediaType) {
    try {
      const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
      const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'credits,keywords'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Error getting details: ${error.message}`);
      return null;
    }
  }

  // Convert TMDB genre IDs to names
  getGenreNames(genreIds, mediaType) {
    const movieGenres = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
      80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
      14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
      9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
      53: 'Thriller', 10752: 'War', 37: 'Western'
    };

    const tvGenres = {
      10759: 'Action & Adventure', 16: 'Animation', 35: 'Comedy',
      80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
      10762: 'Kids', 9648: 'Mystery', 10763: 'News', 10764: 'Reality',
      10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk',
      10768: 'War & Politics', 37: 'Western'
    };

    const genreMap = mediaType === 'movie' ? movieGenres : tvGenres;
    return genreIds.map(id => genreMap[id] || 'Unknown').filter(g => g !== 'Unknown');
  }

  // Enrich a single script
  async enrichScript(script) {
    console.log(`\n📝 Enriching: ${script.title}`);

    // Search TMDB
    const tmdbData = await this.searchTMDB(script.title);
    if (!tmdbData) {
      return { success: false, reason: 'Not found on TMDB' };
    }

    // Get detailed info
    const details = await this.getDetails(tmdbData.id, tmdbData.media_type);
    if (!details) {
      return { success: false, reason: 'Could not fetch details' };
    }

    // Extract genre names
    const genreNames = this.getGenreNames(
      tmdbData.genre_ids || details.genres.map(g => g.id),
      tmdbData.media_type
    );

    // Prepare enriched data
    const enrichedData = {
      tmdb_id: tmdbData.id,
      imdb_id: details.imdb_id || null,
      media_type: tmdbData.media_type, // 'movie' or 'tv'
      genre_tags: genreNames,
      
      // Ratings
      imdb_rating: details.vote_average ? parseFloat(details.vote_average.toFixed(1)) : null,
      
      // Financial (movies only)
      box_office: tmdbData.media_type === 'movie' ? details.revenue : null,
      
      // Additional metadata
      year: tmdbData.media_type === 'movie' 
        ? parseInt(tmdbData.release_date?.split('-')[0]) 
        : parseInt(tmdbData.first_air_date?.split('-')[0]),
      
      // Determine tone from genres
      tone: this.determineTone(genreNames),
      
      // Update timestamp
      updated_at: new Date().toISOString()
    };

    // Update in Supabase
    const { data, error } = await supabase
      .from('scripts')
      .update(enrichedData)
      .eq('id', script.id)
      .select();

    if (error) {
      console.error(`❌ Error updating database: ${error.message}`);
      return { success: false, reason: error.message };
    }

    console.log(`✅ Enriched ${script.title}`);
    console.log(`   Type: ${enrichedData.media_type}`);
    console.log(`   Genres: ${genreNames.join(', ')}`);
    console.log(`   Rating: ${enrichedData.imdb_rating || 'N/A'}`);
    
    return { success: true, data: enrichedData };
  }

  // Determine tone from genres
  determineTone(genres) {
    if (genres.includes('Comedy')) return 'comedic';
    if (genres.includes('Horror') || genres.includes('Thriller')) return 'dark';
    if (genres.includes('Drama')) return 'dramatic';
    if (genres.includes('Action')) return 'intense';
    return 'balanced';
  }

  // Enrich all scripts without TMDB data
  async enrichAll() {
    console.log('\n🚀 Starting genre enrichment...\n');

    // Get all scripts without TMDB data
    const { data: scripts, error } = await supabase
      .from('scripts')
      .select('*')
      .is('tmdb_id', null)
      .limit(100);

    if (error) {
      console.error('❌ Error fetching scripts:', error.message);
      return;
    }

    if (!scripts || scripts.length === 0) {
      console.log('✅ All scripts already enriched!');
      return;
    }

    console.log(`📚 Found ${scripts.length} scripts to enrich\n`);

    let successCount = 0;
    let failCount = 0;

    // Process each script
    for (let i = 0; i < scripts.length; i++) {
      console.log(`[${i + 1}/${scripts.length}]`);
      
      const result = await this.enrichScript(scripts[i]);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.log(`⚠️  Failed: ${result.reason}`);
      }

      // Wait 250ms between requests (TMDB rate limit: 40 req/10 sec)
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    console.log(`\n✅ Enrichment complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    console.log(`   Total: ${scripts.length}\n`);
  }

  // Get statistics by genre and type
  async getStatistics() {
    console.log('\n📊 Generating statistics...\n');

    const { data: scripts, error } = await supabase
      .from('scripts')
      .select('*')
      .not('tmdb_id', 'is', null);

    if (error || !scripts) {
      console.error('❌ Error fetching scripts');
      return;
    }

    // Group by media type
    const byType = {
      movie: scripts.filter(s => s.media_type === 'movie'),
      tv: scripts.filter(s => s.media_type === 'tv')
    };

    // Group by genre
    const genreCounts = {};
    scripts.forEach(script => {
      if (script.genre_tags) {
        script.genre_tags.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    console.log('📺 Media Types:');
    console.log(`   Movies: ${byType.movie.length}`);
    console.log(`   TV Shows: ${byType.tv.length}`);
    console.log('');

    console.log('🎭 Top Genres:');
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedGenres.forEach(([genre, count]) => {
      console.log(`   ${genre}: ${count}`);
    });
    console.log('');
  }
}

// Export for use in other files
module.exports = GenreEnricher;

// If run directly
if (require.main === module) {
  const enricher = new GenreEnricher();
  
  enricher.enrichAll()
    .then(() => enricher.getStatistics())
    .then(() => {
      console.log('🎉 All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
