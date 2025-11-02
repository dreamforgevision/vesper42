require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class PatternRecognitionEngine {
  
  constructor() {
    this.successThreshold = 7.0;
    this.patterns = [];
  }
  
  async analyzeAllPatterns() {
    console.log('\n🧠 PATTERN RECOGNITION ENGINE - Starting Analysis\n');
    console.log('='.repeat(60));
    
    // Simple query without JOINs
    const { data: scripts, error } = await supabase
      .from('scripts')
      .select('*')
      .gt('imdb_rating', 0)
      .order('imdb_rating', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching scripts:', error);
      return;
    }
    
    if (!scripts || scripts.length === 0) {
      console.log('❌ No scripts with ratings found');
      return;
    }
    
    console.log(`📚 Analyzing ${scripts.length} scripts\n`);
    
    const successful = scripts.filter(s => s.imdb_rating >= this.successThreshold);
    const unsuccessful = scripts.filter(s => s.imdb_rating < this.successThreshold);
    
    console.log(`✅ Successful scripts (${this.successThreshold}+): ${successful.length}`);
    console.log(`❌ Less successful scripts: ${unsuccessful.length}\n`);
    
    await this.analyzeBasicPatterns(successful, unsuccessful);
    
    console.log('\n✅ Pattern analysis complete!\n');
  }
  
  async analyzeBasicPatterns(successful, unsuccessful) {
    console.log('📐 Analyzing Basic Patterns...\n');
    
    // Page count
    const avgPagesSuccess = this.average(successful.map(s => s.page_count || 0));
    const avgPagesUnsuccessful = this.average(unsuccessful.map(s => s.page_count || 0));
    
    console.log(`✓ Page count: ${avgPagesSuccess.toFixed(1)} (successful) vs ${avgPagesUnsuccessful.toFixed(1)} (unsuccessful)`);
    
    // Genre analysis
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
    
    console.log('\n🎭 Top Genres in Successful Scripts:');
    topGenres.forEach(([genre, count]) => {
      const avgRating = this.average(
        successful
          .filter(s => s.genre_tags && s.genre_tags.includes(genre))
          .map(s => s.imdb_rating)
      );
      console.log(`   ✓ ${genre}: ${count} scripts, avg rating ${avgRating.toFixed(1)}`);
    });
    
    // Rating distribution
    console.log('\n⭐ Rating Distribution:');
    console.log(`   Highest: ${successful[0]?.title} (${successful[0]?.imdb_rating})`);
    console.log(`   Average successful: ${this.average(successful.map(s => s.imdb_rating)).toFixed(1)}`);
    console.log(`   Average unsuccessful: ${this.average(unsuccessful.map(s => s.imdb_rating)).toFixed(1)}`);
  }
  
  average(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
}

module.exports = PatternRecognitionEngine;

if (require.main === module) {
  const engine = new PatternRecognitionEngine();
  engine.analyzeAllPatterns()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}
