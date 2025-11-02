// =========================================
// VESPER42 - Batch Script Parser
// Parse all scripts in database
// =========================================

require('dotenv').config();

const AdvancedScriptParser = require('./advanced-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class BatchParser {
  constructor() {
    this.parser = new AdvancedScriptParser();
    this.successCount = 0;
    this.failCount = 0;
    this.skippedCount = 0;
  }

  async parseAllScripts() {
    console.log('\n🚀 BATCH PARSING - Starting deep analysis of all scripts...\n');
    
    // Get all scripts that haven't been parsed yet
    const { data: scripts, error } = await supabase
      .from('scripts')
      .select('id, title, processed')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching scripts:', error.message);
      return;
    }

    if (!scripts || scripts.length === 0) {
      console.log('📭 No scripts found in database.');
      return;
    }

    console.log(`📚 Found ${scripts.length} scripts to process\n`);

    // Process each script
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${i + 1}/${scripts.length}] Processing: ${script.title}`);
      console.log('='.repeat(60));

      // Check if already parsed (has scenes)
      const { data: existingScenes } = await supabase
        .from('scenes')
        .select('id')
        .eq('script_id', script.id)
        .limit(1);

      if (existingScenes && existingScenes.length > 0) {
        console.log('⏭️  Already parsed, skipping...');
        this.skippedCount++;
        continue;
      }

      // Parse the script
      try {
        const result = await this.parser.parseAndSave(script.id);
        
        if (result) {
          this.successCount++;
          console.log(`\n✅ Successfully parsed ${script.title}`);
          console.log(`   - Scenes: ${result.scenes.length}`);
          console.log(`   - Characters: ${result.characters.length}`);
          console.log(`   - Dialogue: ${result.dialogue.length} lines`);
          console.log(`   - Beats: ${result.beats.length}`);
        } else {
          this.failCount++;
          console.log(`\n❌ Failed to parse ${script.title}`);
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        this.failCount++;
        console.error(`\n❌ Error parsing ${script.title}:`, error.message);
      }
    }

    // Final report
    this.printReport();
  }

  printReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH PARSING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ Successfully parsed: ${this.successCount}`);
    console.log(`⏭️  Skipped (already parsed): ${this.skippedCount}`);
    console.log(`❌ Failed: ${this.failCount}`);
    console.log(`📚 Total processed: ${this.successCount + this.failCount + this.skippedCount}`);
    console.log('='.repeat(60));
    console.log('\n🎉 All scripts have been analyzed!\n');
    
    this.printDatabaseStats();
  }

  async printDatabaseStats() {
    console.log('📈 DATABASE STATISTICS:\n');

    // Count scenes
    const { count: sceneCount } = await supabase
      .from('scenes')
      .select('*', { count: 'exact', head: true });
    console.log(`   Scenes: ${sceneCount || 0}`);

    // Count characters
    const { count: charCount } = await supabase
      .from('characters')
      .select('*', { count: 'exact', head: true });
    console.log(`   Characters: ${charCount || 0}`);

    // Count dialogue
    const { count: dialogueCount } = await supabase
      .from('dialogue')
      .select('*', { count: 'exact', head: true });
    console.log(`   Dialogue lines: ${dialogueCount || 0}`);

    // Count beats
    const { count: beatCount } = await supabase
      .from('story_beats')
      .select('*', { count: 'exact', head: true });
    console.log(`   Story beats: ${beatCount || 0}`);

    console.log('\n💾 All data saved to Supabase!\n');
  }
}

// Run the batch parser
if (require.main === module) {
  const batchParser = new BatchParser();
  
  batchParser.parseAllScripts()
    .then(() => {
      console.log('🏁 Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = BatchParser;
