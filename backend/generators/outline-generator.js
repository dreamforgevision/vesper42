// =========================================
// VESPER42 - Script Outline Generator
// Generate winning script outlines based on learned patterns
// =========================================

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class ScriptOutlineGenerator {
  
  constructor() {
    this.patterns = null;
  }
  
  // Load learned patterns from database
  async loadPatterns() {
    const { data: patterns } = await supabase
      .from('learned_patterns')
      .select('*');
    
    this.patterns = patterns || [];
    console.log(`📚 Loaded ${this.patterns.length} learned patterns`);
  }
  
  // Find similar successful scripts
  async findSimilarScripts(genre, limit = 10) {
    console.log(`🔍 Finding similar ${genre} scripts...\n`);
    
    const { data: scripts } = await supabase
      .from('scripts')
      .select('*')
      .contains('genre_tags', [genre])
      .gte('imdb_rating', 7.0)
      .order('imdb_rating', { ascending: false })
      .limit(limit);
    
    if (!scripts || scripts.length === 0) {
      console.log('⚠️  No similar scripts found, using general patterns');
      return [];
    }
    
    console.log(`✅ Found ${scripts.length} similar successful scripts:`);
    scripts.forEach(s => {
      console.log(`   • ${s.title} (${s.imdb_rating})`);
    });
    console.log('');
    
    return scripts;
  }
  
  // Calculate optimal structure based on similar scripts
  async calculateOptimalStructure(similarScripts) {
    if (similarScripts.length === 0) {
      // Default industry standard
      return {
        totalPages: 110,
        act1End: 30,
        act2aMidpoint: 60,
        act2bEnd: 90,
        act3End: 110
      };
    }
    
    // Average from similar scripts
    const avgPages = similarScripts.reduce((sum, s) => sum + (s.page_count || 110), 0) / similarScripts.length;
    
    return {
      totalPages: Math.round(avgPages),
      act1End: Math.round(avgPages * 0.25),
      act2aMidpoint: Math.round(avgPages * 0.50),
      act2bEnd: Math.round(avgPages * 0.75),
      act3End: Math.round(avgPages)
    };
  }
  
  // Get beat timing from database
  async getBeatTiming(similarScripts) {
    if (similarScripts.length === 0) return this.getDefaultBeats();
    
    const scriptIds = similarScripts.map(s => s.id);
    
    const { data: beats } = await supabase
      .from('story_beats')
      .select('beat_type, page_number')
      .in('script_id', scriptIds);
    
    if (!beats || beats.length === 0) return this.getDefaultBeats();
    
    // Group by beat type and average
    const beatsByType = {};
    beats.forEach(b => {
      if (!beatsByType[b.beat_type]) {
        beatsByType[b.beat_type] = [];
      }
      beatsByType[b.beat_type].push(b.page_number);
    });
    
    const averagedBeats = {};
    Object.entries(beatsByType).forEach(([type, pages]) => {
      averagedBeats[type] = Math.round(pages.reduce((sum, p) => sum + p, 0) / pages.length);
    });
    
    return averagedBeats;
  }
  
  // Default industry standard beats
  getDefaultBeats() {
    return {
      'Opening Image': 1,
      'Inciting Incident': 12,
      'End of Act 1': 25,
      'Midpoint': 60,
      'All Is Lost': 75,
      'Climax': 95,
      'Resolution': 110
    };
  }
  
  // Generate full outline
  async generateOutline(premise, genre, targetLength = null) {
    console.log('\n' + '='.repeat(60));
    console.log('✨ GENERATING SCRIPT OUTLINE');
    console.log('='.repeat(60));
    console.log(`\n📝 Premise: "${premise}"`);
    console.log(`🎭 Genre: ${genre}`);
    console.log('');
    
    // Load patterns if not loaded
    if (!this.patterns) {
      await this.loadPatterns();
    }
    
    // Find similar successful scripts
    const similarScripts = await this.findSimilarScripts(genre);
    
    // Calculate optimal structure
    const structure = await this.calculateOptimalStructure(similarScripts);
    const beats = await this.getBeatTiming(similarScripts);
    
    // Override with target length if provided
    if (targetLength) {
      structure.totalPages = targetLength;
      structure.act1End = Math.round(targetLength * 0.25);
      structure.act2aMidpoint = Math.round(targetLength * 0.50);
      structure.act2bEnd = Math.round(targetLength * 0.75);
      structure.act3End = targetLength;
    }
    
    console.log('📐 Optimal Structure:');
    console.log(`   Total Pages: ${structure.totalPages}`);
    console.log(`   Act 1: Pages 1-${structure.act1End}`);
    console.log(`   Act 2A: Pages ${structure.act1End + 1}-${structure.act2aMidpoint}`);
    console.log(`   Act 2B: Pages ${structure.act2aMidpoint + 1}-${structure.act2bEnd}`);
    console.log(`   Act 3: Pages ${structure.act2bEnd + 1}-${structure.act3End}`);
    console.log('');
    
    // Generate the outline
    const outline = {
      premise,
      genre,
      structure,
      
      // ACT 1: Setup
      act1: {
        title: 'ACT 1: SETUP',
        pages: `1-${structure.act1End}`,
        beats: [
          {
            name: 'Opening Image',
            page: beats['Opening Image'] || 1,
            description: 'Establish the protagonist\'s ordinary world. Show their life before the journey begins.',
            example: `Based on successful ${genre} scripts: Introduce protagonist in their normal routine, hint at their flaw/need.`
          },
          {
            name: 'Theme Stated',
            page: 5,
            description: 'Someone states the theme/lesson of the story (often subtly).',
            example: 'A conversation or observation that hints at what the protagonist will learn.'
          },
          {
            name: 'Setup',
            page: '1-10',
            description: 'Establish all the "pieces" - characters, relationships, world rules.',
            example: 'Introduce supporting characters, establish protagonist\'s wants vs needs.'
          },
          {
            name: 'Inciting Incident',
            page: beats['Inciting Incident'] || 12,
            description: 'The event that disrupts the ordinary world and starts the story.',
            example: `In your story: The catalyst that forces the protagonist into action related to: "${premise}"`
          },
          {
            name: 'Debate',
            page: '12-25',
            description: 'Protagonist debates whether to take the journey. Should they? Can they?',
            example: 'Show internal/external resistance. Raise the stakes. Make it personal.'
          },
          {
            name: 'Break into Two',
            page: beats['End of Act 1'] || structure.act1End,
            description: 'Protagonist makes the choice to enter Act 2. Crosses the threshold.',
            example: 'Point of no return. They commit to the goal. Enter the "upside-down world".'
          }
        ]
      },
      
      // ACT 2A: Confrontation
      act2a: {
        title: 'ACT 2A: CONFRONTATION',
        pages: `${structure.act1End + 1}-${structure.act2aMidpoint}`,
        beats: [
          {
            name: 'B Story Begins',
            page: structure.act1End + 5,
            description: 'Introduce the relationship/subplot that will help protagonist learn the theme.',
            example: 'New ally, mentor, or love interest who represents the "need" vs "want".'
          },
          {
            name: 'Fun and Games',
            page: `${structure.act1End + 10}-${structure.act2aMidpoint - 5}`,
            description: 'The "promise of the premise". The fun part. What the poster advertises.',
            example: `Deliver on the ${genre} genre expectations. Show protagonist tackling the problem with initial confidence.`
          },
          {
            name: 'Midpoint',
            page: beats['Midpoint'] || structure.act2aMidpoint,
            description: 'False victory or false defeat. Stakes are raised. Time clock appears/intensifies.',
            example: 'Either: protagonist gets what they want (but not what they need), OR everything falls apart. Either way - everything changes.'
          }
        ]
      },
      
      // ACT 2B: Complications
      act2b: {
        title: 'ACT 2B: COMPLICATIONS',
        pages: `${structure.act2aMidpoint + 1}-${structure.act2bEnd}`,
        beats: [
          {
            name: 'Bad Guys Close In',
            page: `${structure.act2aMidpoint + 5}-${structure.act2bEnd - 15}`,
            description: 'Internal and external forces close in. Things get worse.',
            example: 'If Midpoint was a victory: enemies regroup and hit harder. If defeat: protagonist struggles to recover. Pressure mounts.'
          },
          {
            name: 'All Is Lost',
            page: beats['All Is Lost'] || structure.act2bEnd - 15,
            description: 'Lowest point. The "whiff of death" - something or someone dies (literally or metaphorically).',
            example: 'False defeat. Mentor dies, relationship ends, hope is lost. Opposite of Midpoint.'
          },
          {
            name: 'Dark Night of the Soul',
            page: `${structure.act2bEnd - 10}-${structure.act2bEnd - 5}`,
            description: 'Protagonist wallows in defeat. Seems impossible to win.',
            example: 'Emotional low. Protagonist reflects on failures. Doubt reaches peak.'
          },
          {
            name: 'Break into Three',
            page: structure.act2bEnd,
            description: 'Thanks to B Story, protagonist finds the solution. Synthesis of A and B stories.',
            example: 'Eureka moment. Protagonist realizes what they need (not just want). Finds clarity and resolve.'
          }
        ]
      },
      
      // ACT 3: Resolution
      act3: {
        title: 'ACT 3: RESOLUTION',
        pages: `${structure.act2bEnd + 1}-${structure.act3End}`,
        beats: [
          {
            name: 'Finale',
            page: `${structure.act2bEnd + 1}-${structure.act3End - 5}`,
            description: 'Protagonist executes the new plan. Synthesis of want + need.',
            example: `The big ${genre} climax. Protagonist uses everything they've learned. Faces the antagonist/obstacle with new understanding.`
          },
          {
            name: 'Climax',
            page: beats['Climax'] || structure.act3End - 10,
            description: 'The decisive moment. A vs B. Will protagonist succeed?',
            example: 'The ultimate confrontation. Tension peaks. All or nothing.'
          },
          {
            name: 'Final Image',
            page: beats['Resolution'] || structure.act3End,
            description: 'Mirror of Opening Image. Shows how protagonist has changed.',
            example: 'The "new world". Protagonist in their changed state. Theme proven. Opposite of Opening Image.'
          }
        ]
      },
      
      // Success prediction
      prediction: await this.predictSuccess(similarScripts, genre),
      
      // Recommendations
      recommendations: this.generateRecommendations(similarScripts, structure)
    };
    
    return outline;
  }
  
  // Predict success based on similar scripts
  async predictSuccess(similarScripts, genre) {
    if (similarScripts.length === 0) {
      return {
        probability: 0.65,
        confidence: 'medium',
        reasoning: 'Based on general patterns (no similar scripts in database)'
      };
    }
    
    const avgRating = similarScripts.reduce((sum, s) => sum + s.imdb_rating, 0) / similarScripts.length;
    const probability = Math.min(0.95, avgRating / 10);
    
    return {
      probability: Math.round(probability * 100) / 100,
      confidence: probability > 0.75 ? 'high' : probability > 0.65 ? 'medium' : 'low',
      reasoning: `Based on ${similarScripts.length} similar successful ${genre} scripts (avg rating: ${avgRating.toFixed(1)})`,
      comparables: similarScripts.slice(0, 3).map(s => ({
        title: s.title,
        rating: s.imdb_rating,
        year: s.year
      }))
    };
  }
  
  // Generate recommendations
  generateRecommendations(similarScripts, structure) {
    const recommendations = {
      targetLength: `${structure.totalPages} pages (optimal for this genre)`,
      pacing: 'Follow the beat timing closely for maximum impact',
      characters: '8-12 distinct characters (protagonist + supporting cast)',
      dialogue: 'Keep dialogue concise: 6-9 words per line average'
    };
    
    if (similarScripts.length > 0) {
      const avgBoxOffice = similarScripts
        .filter(s => s.box_office)
        .reduce((sum, s) => sum + s.box_office, 0) / similarScripts.filter(s => s.box_office).length;
      
      if (avgBoxOffice > 0) {
        recommendations.budget = avgBoxOffice > 100000000 
          ? '$40-80M (theatrical tentpole)'
          : avgBoxOffice > 50000000
          ? '$20-40M (mid-budget theatrical)'
          : '$5-20M (indie/streaming)';
      }
    }
    
    return recommendations;
  }
  
  // Print outline in readable format
  printOutline(outline) {
    console.log('\n' + '='.repeat(60));
    console.log('📜 GENERATED SCRIPT OUTLINE');
    console.log('='.repeat(60));
    console.log(`\nTitle: [YOUR TITLE]`);
    console.log(`Premise: ${outline.premise}`);
    console.log(`Genre: ${outline.genre}`);
    console.log(`Length: ${outline.structure.totalPages} pages`);
    
    // Success Prediction
    console.log(`\n📊 SUCCESS PREDICTION:`);
    console.log(`   Probability: ${(outline.prediction.probability * 100).toFixed(0)}%`);
    console.log(`   Confidence: ${outline.prediction.confidence}`);
    console.log(`   ${outline.prediction.reasoning}`);
    
    if (outline.prediction.comparables) {
      console.log(`\n   Similar successful films:`);
      outline.prediction.comparables.forEach(c => {
        console.log(`   • ${c.title} (${c.year}): ${c.rating}/10`);
      });
    }
    
    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS:`);
    Object.entries(outline.recommendations).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });
    
    // Act by Act
    [outline.act1, outline.act2a, outline.act2b, outline.act3].forEach(act => {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`${act.title} (${act.pages})`);
      console.log('─'.repeat(60));
      
      act.beats.forEach(beat => {
        console.log(`\n📍 ${beat.name.toUpperCase()} (Page ${beat.page})`);
        console.log(`   ${beat.description}`);
        console.log(`   ➤ ${beat.example}`);
      });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Outline generation complete!');
    console.log('='.repeat(60) + '\n');
  }
}

module.exports = ScriptOutlineGenerator;

// Test if run directly
if (require.main === module) {
  const generator = new ScriptOutlineGenerator();
  
  // Example: Generate outline for action thriller
  const premise = "A retired CIA agent must rescue his daughter from human traffickers";
  const genre = "Action";
  
  generator.generateOutline(premise, genre, 110)
    .then(outline => {
      generator.printOutline(outline);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error:', error);
      process.exit(1);
    });
}
