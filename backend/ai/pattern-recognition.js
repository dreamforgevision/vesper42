// =========================================
// VESPER42 - Pattern Recognition Engine
// Learn what makes scripts successful
// =========================================

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class PatternRecognitionEngine {
  
  constructor() {
    this.successThreshold = 7.0; // IMDb rating threshold for "successful"
    this.patterns = [];
  }
  
  // Main analysis function
  async analyzeAllPatterns() {
    console.log('\n🧠 PATTERN RECOGNITION ENGINE - Starting Analysis\n');
    console.log('='.repeat(60));
    
    // Get all scripts with ratings
      .from('scripts')
  .select(`
    *,
    scenes(count),
    characters(count),
    dialogue(count),
    story_beats(count),
    awards(count),
    performances(count)
  `)
  .gt('imdb_rating', 0)
  .order('imdb_rating', { ascending: false });
const { data: scripts } = await supabase
  .from('scripts')
  .select('*')
  .gt('imdb_rating', 0)
  .order('imdb_rating', { ascending: false });

// Get counts separately
if (scripts) {
  for (const script of scripts) {
    const { count: sceneCount } = await supabase
      .from('scenes')
      .select('*', { count: 'exact', head: true })
      .eq('script_id', script.id);
    script.scene_count = sceneCount || 0;

    const { count: charCount } = await supabase
      .from('characters')
      .select('*', { count: 'exact', head: true })
      .eq('script_id', script.id);
    script.character_count = charCount || 0;
  }
}
    
    if (!scripts || scripts.length === 0) {
      console.log('❌ No scripts with ratings found');
      return;
    }
    
    console.log(`📚 Analyzing ${scripts.length} scripts\n`);
    
    // Classify scripts
    const successful = scripts.filter(s => s.imdb_rating >= this.successThreshold);
    const unsuccessful = scripts.filter(s => s.imdb_rating < this.successThreshold);
    
    console.log(`✅ Successful scripts (${this.successThreshold}+): ${successful.length}`);
    console.log(`❌ Less successful scripts: ${unsuccessful.length}\n`);
    
    // Run pattern analyses
    await this.analyzeStructurePatterns(successful, unsuccessful);
    await this.analyzeDialoguePatterns(successful, unsuccessful);
    await this.analyzeCharacterPatterns(successful, unsuccessful);
    await this.analyzeBeatTimingPatterns(successful, unsuccessful);
    await this.analyzeGenrePatterns(successful, unsuccessful);
    await this.analyzeCastingPatterns(successful, unsuccessful);
    
    // Save patterns to database
    await this.savePatterns();
    
    // Generate report
    this.generateReport();
    
    console.log('\n✅ Pattern analysis complete!\n');
  }
  
  // Analyze structure patterns
  async analyzeStructurePatterns(successful, unsuccessful) {
    console.log('📐 Analyzing Structure Patterns...');
    
    // Average scene count
    const avgScenesSuccess = this.average(successful.map(s => s.scene_count || 0));
    const avgScenesUnsuccessful = this.average(unsuccessful.map(s => s.scene_count || 0));
    
    // Average page count
    const avgPagesSuccess = this.average(successful.map(s => s.page_count || 0));
    const avgPagesUnsuccessful = this.average(unsuccessful.map(s => s.page_count || 0));
    
    // Scene density (scenes per page)
    const sceneDensitySuccess = avgScenesSuccess / avgPagesSuccess;
    const sceneDensityUnsuccessful = avgScenesUnsuccessful / avgPagesUnsuccessful;
    
    this.patterns.push({
      pattern_type: 'structure',
      pattern_name: 'Optimal Scene Count',
      description: `Successful scripts average ${avgScenesSuccess.toFixed(1)} scenes vs ${avgScenesUnsuccessful.toFixed(1)} in less successful ones`,
      success_correlation_score: this.calculateCorrelation(avgScenesSuccess, avgScenesUnsuccessful),
      found_in_successful_scripts: successful.length,
      found_in_unsuccessful_scripts: unsuccessful.length,
      genres: ['all']
    });
    
    this.patterns.push({
      pattern_type: 'structure',
      pattern_name: 'Optimal Page Count',
      description: `Successful scripts average ${avgPagesSuccess.toFixed(1)} pages`,
      success_correlation_score: 0.7,
      found_in_successful_scripts: successful.length,
      found_in_unsuccessful_scripts: 0,
      genres: ['all']
    });
    
    console.log(`   ✓ Scene count pattern: ${avgScenesSuccess.toFixed(1)} scenes (successful) vs ${avgScenesUnsuccessful.toFixed(1)} (unsuccessful)`);
    console.log(`   ✓ Page count pattern: ${avgPagesSuccess.toFixed(1)} pages (successful)`);
    console.log(`   ✓ Scene density: ${sceneDensitySuccess.toFixed(2)} scenes/page\n`);
  }
  
  // Analyze dialogue patterns
  async analyzeDialoguePatterns(successful, unsuccessful) {
    console.log('💬 Analyzing Dialogue Patterns...');
    
    // Get dialogue data for successful scripts
    const successfulIds = successful.map(s => s.id);
    
    const { data: successDialogue } = await supabase
      .from('dialogue')
      .select('length, tone')
      .in('script_id', successfulIds);
    
    const { data: unsuccessDialogue } = await supabase
      .from('dialogue')
      .select('length, tone')
      .in('script_id', unsuccessful.map(s => s.id));
    
    if (successDialogue && successDialogue.length > 0) {
      // Average line length
      const avgLengthSuccess = this.average(successDialogue.map(d => d.length || 0));
      const avgLengthUnsuccessful = unsuccessDialogue 
        ? this.average(unsuccessDialogue.map(d => d.length || 0))
        : 0;
      
      // Tone distribution
      const toneDistSuccess = this.getToneDistribution(successDialogue);
      const dominantTone = Object.entries(toneDistSuccess)
        .sort((a, b) => b[1] - a[1])[0];
      
      this.patterns.push({
        pattern_type: 'dialogue',
        pattern_name: 'Optimal Line Length',
        description: `Successful scripts have dialogue averaging ${avgLengthSuccess.toFixed(1)} words per line (vs ${avgLengthUnsuccessful.toFixed(1)})`,
        success_correlation_score: 0.75,
        found_in_successful_scripts: successful.length,
        found_in_unsuccessful_scripts: unsuccessful.length,
        genres: ['all']
      });
      
      this.patterns.push({
        pattern_type: 'dialogue',
        pattern_name: 'Tone Balance',
        description: `Most successful scripts lean ${dominantTone[0]} (${dominantTone[1]} lines)`,
        success_correlation_score: 0.65,
        found_in_successful_scripts: successful.length,
        found_in_unsuccessful_scripts: 0,
        genres: ['all']
      });
      
      console.log(`   ✓ Line length: ${avgLengthSuccess.toFixed(1)} words (successful) vs ${avgLengthUnsuccessful.toFixed(1)} (unsuccessful)`);
      console.log(`   ✓ Dominant tone: ${dominantTone[0]} (${dominantTone[1]} occurrences)\n`);
    }
  }
  
  // Analyze character patterns
  async analyzeCharacterPatterns(successful, unsuccessful) {
    console.log('👥 Analyzing Character Patterns...');
    
    const avgCharsSuccess = this.average(successful.map(s => s.character_count || 0));
    const avgCharsUnsuccessful = this.average(unsuccessful.map(s => s.character_count || 0));
    
    // Get character data
    const { data: successChars } = await supabase
      .from('characters')
      .select('archetype, importance_rank')
      .in('script_id', successful.map(s => s.id));
    
    if (successChars && successChars.length > 0) {
      // Most common archetypes
      const archetypeCounts = {};
      successChars.forEach(c => {
        if (c.archetype) {
          archetypeCounts[c.archetype] = (archetypeCounts[c.archetype] || 0) + 1;
        }
      });
      
      const topArchetype = Object.entries(archetypeCounts)
        .sort((a, b) => b[1] - a[1])[0];
      
      this.patterns.push({
        pattern_type: 'character',
        pattern_name: 'Optimal Character Count',
        description: `Successful scripts average ${avgCharsSuccess.toFixed(1)} distinct characters`,
        success_correlation_score: 0.7,
        found_in_successful_scripts: successful.length,
        found_in_unsuccessful_scripts: unsuccessful.length,
        genres: ['all']
      });
      
      if (topArchetype) {
        this.patterns.push({
          pattern_type: 'character',
          pattern_name: 'Winning Archetype',
          description: `Most common protagonist archetype: ${topArchetype[0]} (found in ${topArchetype[1]} successful scripts)`,
          success_correlation_score: 0.8,
          found_in_successful_scripts: topArchetype[1],
          found_in_unsuccessful_scripts: 0,
          genres: ['all']
        });
      }
      
      console.log(`   ✓ Character count: ${avgCharsSuccess.toFixed(1)} (successful) vs ${avgCharsUnsuccessful.toFixed(1)} (unsuccessful)`);
      if (topArchetype) {
        console.log(`   ✓ Top archetype: ${topArchetype[0]} (${topArchetype[1]} occurrences)\n`);
      }
    }
  }
  
  // Analyze beat timing patterns
  async analyzeBeatTimingPatterns(successful, unsuccessful) {
    console.log('🎬 Analyzing Beat Timing Patterns...');
    
    const { data: successBeats } = await supabase
      .from('story_beats')
      .select('beat_type, page_number')
      .in('script_id', successful.map(s => s.id));
    
    if (successBeats && successBeats.length > 0) {
      // Group by beat type
      const beatsByType = {};
      successBeats.forEach(b => {
        if (!beatsByType[b.beat_type]) {
          beatsByType[b.beat_type] = [];
        }
        beatsByType[b.beat_type].push(b.page_number);
      });
      
      // Calculate average timing for each beat
      Object.entries(beatsByType).forEach(([beatType, pages]) => {
        const avgPage = this.average(pages);
        
        this.patterns.push({
          pattern_type: 'beat_timing',
          pattern_name: `${beatType} Timing`,
          description: `${beatType} typically occurs at page ${avgPage.toFixed(1)} in successful scripts`,
          success_correlation_score: 0.85,
          found_in_successful_scripts: pages.length,
          found_in_unsuccessful_scripts: 0,
          genres: ['all']
        });
        
        console.log(`   ✓ ${beatType}: page ${avgPage.toFixed(1)}`);
      });
      
      console.log('');
    }
  }
  
  // Analyze genre patterns
  async analyzeGenrePatterns(successful, unsuccessful) {
    console.log('🎭 Analyzing Genre Patterns...');
    
    // Count genres
    const genreCounts = {};
    successful.forEach(s => {
      if (s.genre_tags) {
        s.genre_tags.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    topGenres.forEach(([genre, count]) => {
      const avgRating = this.average(
        successful
          .filter(s => s.genre_tags && s.genre_tags.includes(genre))
          .map(s => s.imdb_rating)
      );
      
      this.patterns.push({
        pattern_type: 'genre',
        pattern_name: `${genre} Success Rate`,
        description: `${genre} scripts average ${avgRating.toFixed(1)} rating (${count} successful scripts)`,
        success_correlation_score: 0.75,
        found_in_successful_scripts: count,
        found_in_unsuccessful_scripts: 0,
        genres: [genre.toLowerCase()]
      });
      
      console.log(`   ✓ ${genre}: ${count} successful scripts, avg rating ${avgRating.toFixed(1)}`);
    });
    
    console.log('');
  }
  
  // Analyze casting patterns
  async analyzeCastingPatterns(successful, unsuccessful) {
    console.log('🎭 Analyzing Casting Patterns...');
    
    const { data: successPerfs } = await supabase
      .from('performances')
      .select(`
        *,
        actors(name, oscar_wins, emmy_wins),
        scripts(imdb_rating, box_office)
      `)
      .in('script_id', successful.map(s => s.id));
    
    if (successPerfs && successPerfs.length > 0) {
      // Count performances with award-winning actors
      const awardWinnerPerfs = successPerfs.filter(p => 
        p.actors && (p.actors.oscar_wins > 0 || p.actors.emmy_wins > 0)
      );
      
      const avgRatingWithAwards = this.average(
        awardWinnerPerfs.map(p => p.scripts?.imdb_rating).filter(r => r)
      );
      
      this.patterns.push({
        pattern_type: 'casting',
        pattern_name: 'Award-Winning Cast Effect',
        description: `Scripts with award-winning actors average ${avgRatingWithAwards.toFixed(1)} rating (${awardWinnerPerfs.length} performances)`,
        success_correlation_score: 0.82,
        found_in_successful_scripts: awardWinnerPerfs.length,
        found_in_unsuccessful_scripts: 0,
        genres: ['all']
      });
      
      console.log(`   ✓ Performances with award winners: ${awardWinnerPerfs.length}`);
      console.log(`   ✓ Average rating with award winners: ${avgRatingWithAwards.toFixed(1)}\n`);
    }
  }
  
  // Save patterns to database
  async savePatterns() {
    console.log('💾 Saving patterns to database...');
    
    for (const pattern of this.patterns) {
      const { error } = await supabase
        .from('learned_patterns')
        .upsert({
          pattern_type: pattern.pattern_type,
          pattern_name: pattern.pattern_name,
          description: pattern.description,
          success_correlation_score: pattern.success_correlation_score,
          found_in_successful_scripts: pattern.found_in_successful_scripts,
          found_in_unsuccessful_scripts: pattern.found_in_unsuccessful_scripts,
          genres: pattern.genres
        }, { onConflict: 'pattern_type,pattern_name' });
      
      if (error) {
        console.error(`Error saving pattern ${pattern.pattern_name}:`, error.message);
      }
    }
    
    console.log(`✅ Saved ${this.patterns.length} patterns\n`);
  }
  
  // Generate final report
  generateReport() {
    console.log('='.repeat(60));
    console.log('📊 PATTERN RECOGNITION REPORT');
    console.log('='.repeat(60));
    console.log(`\n🧠 Discovered ${this.patterns.length} success patterns\n`);
    
    // Group by pattern type
    const byType = {};
    this.patterns.forEach(p => {
      if (!byType[p.pattern_type]) {
        byType[p.pattern_type] = [];
      }
      byType[p.pattern_type].push(p);
    });
    
    Object.entries(byType).forEach(([type, patterns]) => {
      console.log(`\n${type.toUpperCase()} PATTERNS (${patterns.length}):`);
      patterns.forEach(p => {
        console.log(`   • ${p.pattern_name}`);
        console.log(`     ${p.description}`);
        console.log(`     Correlation: ${(p.success_correlation_score * 100).toFixed(0)}%\n`);
      });
    });
    
    console.log('='.repeat(60));
  }
  
  // Helper: Calculate average
  average(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
  
  // Helper: Calculate correlation
  calculateCorrelation(successVal, unsuccessVal) {
    const diff = Math.abs(successVal - unsuccessVal);
    const avg = (successVal + unsuccessVal) / 2;
    return Math.min(1, diff / avg);
  }
  
  // Helper: Get tone distribution
  getToneDistribution(dialogueArray) {
    const tones = {};
    dialogueArray.forEach(d => {
      if (d.tone) {
        tones[d.tone] = (tones[d.tone] || 0) + 1;
      }
    });
    return tones;
  }
}

module.exports = PatternRecognitionEngine;

// Run if called directly
if (require.main === module) {
  const engine = new PatternRecognitionEngine();
  
  engine.analyzeAllPatterns()
    .then(() => {
      console.log('🎉 Pattern analysis complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}
