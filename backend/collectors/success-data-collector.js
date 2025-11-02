// =========================================
// VESPER42 - Success Data Collector
// Collect awards, actors, and critical reviews
// =========================================

require('dotenv').config();

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

class SuccessDataCollector {
  
  // Get detailed movie/TV data from TMDB
  async getDetailedData(tmdbId, mediaType) {
    console.log(`🔍 Fetching detailed ${mediaType} data for TMDB ID: ${tmdbId}`);
    
    try {
      const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
      
      // Get full details including credits
      const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          append_to_response: 'credits,keywords,reviews,external_ids'
        }
      });
      
      const data = response.data;
      
      return {
        tmdb_id: tmdbId,
        imdb_id: data.imdb_id || data.external_ids?.imdb_id,
        title: data.title || data.name,
        media_type: mediaType,
        
        // Financial
        budget: data.budget || null,
        revenue: data.revenue || null,
        
        // Ratings
        vote_average: data.vote_average,
        vote_count: data.vote_count,
        popularity: data.popularity,
        
        // Cast & Crew
        cast: data.credits?.cast || [],
        crew: data.credits?.crew || [],
        
        // Reviews sample
        reviews: data.reviews?.results || [],
        
        // Keywords (useful for pattern matching)
        keywords: mediaType === 'movie' 
          ? data.keywords?.keywords || []
          : data.keywords?.results || []
      };
      
    } catch (error) {
      console.error(`❌ Error fetching detailed data:`, error.message);
      return null;
    }
  }
  
  // Save actors to database
  async saveActors(castData, scriptId) {
    console.log(`👥 Saving actors...`);
    
    const savedActors = [];
    
    for (const member of castData.slice(0, 10)) { // Top 10 cast members
      try {
        // Check if actor exists
        let { data: existingActor } = await supabase
          .from('actors')
          .select('id')
          .eq('tmdb_id', member.id)
          .single();
        
        let actorId;
        
        if (!existingActor) {
          // Create new actor
          const { data: newActor, error } = await supabase
            .from('actors')
            .insert({
              name: member.name,
              tmdb_id: member.id,
              best_genres: [], // Will populate later
              typecast_roles: []
            })
            .select()
            .single();
          
          if (error) {
            console.error(`Error saving actor ${member.name}:`, error.message);
            continue;
          }
          
          actorId = newActor.id;
        } else {
          actorId = existingActor.id;
        }
        
        // Save performance
        const { error: perfError } = await supabase
          .from('performances')
          .upsert({
            actor_id: actorId,
            script_id: scriptId,
            character_name: member.character,
            role_type: member.order < 3 ? 'lead' : member.order < 10 ? 'supporting' : 'ensemble'
          }, { onConflict: 'actor_id,script_id' });
        
        if (perfError) {
          console.error(`Error saving performance:`, perfError.message);
        } else {
          savedActors.push(member.name);
        }
        
      } catch (error) {
        console.error(`Error processing actor ${member.name}:`, error.message);
      }
    }
    
    console.log(`✅ Saved ${savedActors.length} actors`);
    return savedActors;
  }
  
  // Save critical reviews
  async saveReviews(reviewsData, scriptId) {
    console.log(`📰 Saving critical reviews...`);
    
    if (!reviewsData || reviewsData.length === 0) {
      console.log(`⚠️  No reviews available`);
      return;
    }
    
    // Extract top critic quotes
    const topCriticQuotes = reviewsData.slice(0, 5).map(review => ({
      author: review.author,
      content: review.content?.substring(0, 500), // First 500 chars
      rating: review.author_details?.rating || null
    }));
    
    const { error } = await supabase
      .from('critical_reviews')
      .upsert({
        script_id: scriptId,
        source: 'TMDB',
        top_critic_quotes: topCriticQuotes
      }, { onConflict: 'script_id,source' });
    
    if (error) {
      console.error(`Error saving reviews:`, error.message);
    } else {
      console.log(`✅ Saved ${reviewsData.length} reviews`);
    }
  }
  
  // Fetch awards data (using external API or manual data)
  async fetchAwardsData(imdbId, title, year) {
    console.log(`🏆 Checking awards for: ${title} (${year})`);
    
    // For now, we'll use a simplified awards check
    // In production, you'd integrate with OMDb API or similar
    
    const awards = [];
    
    // Check if title/year matches known Oscar winners
    const oscarWinners = this.getOscarWinners();
    const match = oscarWinners.find(w => 
      w.title.toLowerCase() === title.toLowerCase() && 
      Math.abs(w.year - year) <= 1
    );
    
    if (match) {
      awards.push({
        award_name: 'Academy Award',
        category: match.category,
        year: match.year,
        winner_name: title
      });
    }
    
    return awards;
  }
  
  // Simplified Oscar winners list (you'd expand this)
  getOscarWinners() {
    return [
      { title: 'The Godfather', year: 1972, category: 'Best Picture' },
      { title: 'The Godfather Part II', year: 1974, category: 'Best Picture' },
      { title: 'Pulp Fiction', year: 1994, category: 'Best Original Screenplay' },
      { title: 'The Shawshank Redemption', year: 1994, category: 'Nominated' },
      { title: 'Forrest Gump', year: 1994, category: 'Best Picture' },
      { title: 'The Matrix', year: 1999, category: 'Best Visual Effects' },
      { title: 'Gladiator', year: 2000, category: 'Best Picture' },
      { title: 'The Lord of the Rings: The Return of the King', year: 2003, category: 'Best Picture' },
      { title: 'The Dark Knight', year: 2008, category: 'Best Supporting Actor' },
      { title: 'Inception', year: 2010, category: 'Best Cinematography' },
      { title: 'The Social Network', year: 2010, category: 'Best Adapted Screenplay' },
      { title: '12 Years a Slave', year: 2013, category: 'Best Picture' },
      { title: 'Parasite', year: 2019, category: 'Best Picture' },
      { title: 'Everything Everywhere All at Once', year: 2022, category: 'Best Picture' },
      { title: 'Oppenheimer', year: 2023, category: 'Best Picture' }
    ];
  }
  
  // Save awards to database
  async saveAwards(awardsData, scriptId) {
    if (!awardsData || awardsData.length === 0) {
      console.log(`⚠️  No awards found`);
      return;
    }
    
    console.log(`🏆 Saving ${awardsData.length} awards...`);
    
    for (const award of awardsData) {
      const { error } = await supabase
        .from('awards')
        .insert({
          award_name: award.award_name,
          category: award.category,
          year: award.year,
          winner_type: 'script',
          script_id: scriptId,
          winner_name: award.winner_name,
          prestige_level: 'major'
        });
      
      if (error) {
        console.error(`Error saving award:`, error.message);
      }
    }
    
    console.log(`✅ Saved awards`);
  }
  
  // Enrich a single script with success data
  async enrichScript(scriptId) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Enriching script with success data...`);
    console.log('='.repeat(60));
    
    try {
      // Get script from database
      const { data: script, error } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();
      
      if (error || !script) {
        console.error('❌ Script not found');
        return null;
      }
      
      if (!script.tmdb_id) {
        console.log('⚠️  Script has no TMDB ID, skipping...');
        return null;
      }
      
      console.log(`📽️  Processing: ${script.title}`);
      
      // Get detailed data from TMDB
      const detailedData = await this.getDetailedData(
        script.tmdb_id, 
        script.media_type || 'movie'
      );
      
      if (!detailedData) {
        console.log('❌ Could not fetch detailed data');
        return null;
      }
      
      // Save actors and performances
      if (detailedData.cast && detailedData.cast.length > 0) {
        await this.saveActors(detailedData.cast, scriptId);
      }
      
      // Save reviews
      if (detailedData.reviews && detailedData.reviews.length > 0) {
        await this.saveReviews(detailedData.reviews, scriptId);
      }
      
      // Fetch and save awards
      const awards = await this.fetchAwardsData(
        detailedData.imdb_id,
        script.title,
        script.year
      );
      
      if (awards.length > 0) {
        await this.saveAwards(awards, scriptId);
      }
      
      // Update script with additional data
      const { error: updateError } = await supabase
        .from('scripts')
        .update({
          imdb_id: detailedData.imdb_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', scriptId);
      
      if (updateError) {
        console.error('Error updating script:', updateError.message);
      }
      
      console.log(`\n✅ Successfully enriched: ${script.title}`);
      
      return {
        success: true,
        script: script.title,
        actors: detailedData.cast?.length || 0,
        reviews: detailedData.reviews?.length || 0,
        awards: awards.length
      };
      
    } catch (error) {
      console.error('❌ Error enriching script:', error.message);
      return null;
    }
  }
  
  // Enrich all scripts with success data
  async enrichAllScripts() {
    console.log('\n🚀 ENRICHING ALL SCRIPTS WITH SUCCESS DATA\n');
    
    // Get all scripts with TMDB IDs
    const { data: scripts, error } = await supabase
      .from('scripts')
      .select('id, title, tmdb_id, media_type')
      .not('tmdb_id', 'is', null)
      .order('created_at', { ascending: true });
    
    if (error || !scripts || scripts.length === 0) {
      console.log('❌ No scripts found with TMDB IDs');
      return;
    }
    
    console.log(`📚 Found ${scripts.length} scripts to enrich\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < scripts.length; i++) {
      console.log(`\n[${i + 1}/${scripts.length}]`);
      
      const result = await this.enrichScript(scripts[i].id);
      
      if (result && result.success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUCCESS DATA ENRICHMENT COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📚 Total: ${scripts.length}`);
    console.log('='.repeat(60));
    
    await this.printStats();
  }
  
  // Print database statistics
  async printStats() {
    console.log('\n📈 DATABASE STATISTICS:\n');
    
    const { count: actorCount } = await supabase
      .from('actors')
      .select('*', { count: 'exact', head: true });
    console.log(`   Actors: ${actorCount || 0}`);
    
    const { count: perfCount } = await supabase
      .from('performances')
      .select('*', { count: 'exact', head: true });
    console.log(`   Performances: ${perfCount || 0}`);
    
    const { count: awardCount } = await supabase
      .from('awards')
      .select('*', { count: 'exact', head: true });
    console.log(`   Awards: ${awardCount || 0}`);
    
    const { count: reviewCount } = await supabase
      .from('critical_reviews')
      .select('*', { count: 'exact', head: true });
    console.log(`   Reviews: ${reviewCount || 0}`);
    
    console.log('\n💾 All success data saved!\n');
  }
}

module.exports = SuccessDataCollector;

// Run if called directly
if (require.main === module) {
  const collector = new SuccessDataCollector();
  
  collector.enrichAllScripts()
    .then(() => {
      console.log('🎉 Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
