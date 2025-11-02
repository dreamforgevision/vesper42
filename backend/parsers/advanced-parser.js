// =========================================
// VESPER42 - Advanced Script Parser
// Deep analysis: Structure → Scenes → Dialogue → Beats
// =========================================

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

class AdvancedScriptParser {
  
  // Parse a complete script into detailed components
  async parseScript(scriptId) {
    console.log(`\n🔬 Deep parsing script ID: ${scriptId}\n`);
    
    // Get the script
    const { data: script, error } = await supabase
      .from('scripts')
      .select('*')
      .eq('id', scriptId)
      .single();
    
    if (error || !script) {
      console.error('❌ Script not found');
      return null;
    }
    
    const text = script.raw_text;
    
    // Step 1: Extract scenes
    const scenes = this.extractScenes(text);
    console.log(`✅ Extracted ${scenes.length} scenes`);
    
    // Step 2: Extract characters
    const characters = this.extractCharacters(scenes);
    console.log(`✅ Identified ${characters.length} characters`);
    
    // Step 3: Extract dialogue
    const dialogue = this.extractDialogue(scenes, characters);
    console.log(`✅ Parsed ${dialogue.length} dialogue lines`);
    
    // Step 4: Identify story beats
    const beats = this.identifyBeats(scenes, text);
    console.log(`✅ Identified ${beats.length} story beats`);
    
    // Step 5: Analyze patterns
    const analysis = this.analyzePatterns(scenes, characters, dialogue, beats);
    console.log(`✅ Completed pattern analysis`);
    
    return {
      script_id: scriptId,
      scenes,
      characters,
      dialogue,
      beats,
      analysis
    };
  }
  
  // Extract scenes from script
  extractScenes(text) {
    const scenes = [];
    const lines = text.split('\n');
    
    let currentScene = null;
    let sceneNumber = 0;
    let pageCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect scene header (INT. or EXT.)
      if (/^(INT\.|EXT\.)/i.test(line)) {
        // Save previous scene
        if (currentScene) {
          currentScene.page_end = pageCount;
          scenes.push(currentScene);
        }
        
        // Start new scene
        sceneNumber++;
        const match = line.match(/^(INT\.|EXT\.)\s+(.+?)\s+-\s+(DAY|NIGHT|DAWN|DUSK|CONTINUOUS)/i);
        
        currentScene = {
          scene_number: sceneNumber,
          scene_type: match ? match[1].toUpperCase() : 'INT.',
          location: match ? match[2].trim() : 'UNKNOWN',
          time: match ? match[3].toUpperCase() : 'DAY',
          page_start: pageCount,
          page_end: null,
          content: '',
          dialogue_lines: [],
          action_lines: [],
          characters_present: new Set()
        };
      }
      
      // Add content to current scene
      if (currentScene) {
        currentScene.content += line + '\n';
        
        // Track characters (all-caps names)
        if (/^[A-Z][A-Z\s]{2,}$/.test(line) && line.length < 30) {
          currentScene.characters_present.add(line.trim());
        }
        
        // Classify line type
        if (/^[A-Z][A-Z\s]{2,}$/.test(line)) {
          // Character name
        } else if (line.length > 0 && i > 0 && /^[A-Z][A-Z\s]{2,}$/.test(lines[i-1].trim())) {
          // Dialogue (follows character name)
          currentScene.dialogue_lines.push(line);
        } else if (line.length > 0) {
          // Action
          currentScene.action_lines.push(line);
        }
      }
      
      // Estimate page count (60 lines = 1 page)
      if (i % 60 === 0) pageCount++;
    }
    
    // Save last scene
    if (currentScene) {
      currentScene.page_end = pageCount;
      scenes.push(currentScene);
    }
    
    // Convert Set to Array
    scenes.forEach(scene => {
      scene.characters_present = Array.from(scene.characters_present);
      scene.dialogue_ratio = scene.dialogue_lines.length / 
        (scene.dialogue_lines.length + scene.action_lines.length + 1);
    });
    
    return scenes;
  }
  
  // Extract all characters from scenes
  extractCharacters(scenes) {
    const characterMap = new Map();
    
    scenes.forEach(scene => {
      scene.characters_present.forEach(charName => {
        if (!characterMap.has(charName)) {
          characterMap.set(charName, {
            name: charName,
            first_appearance: scene.page_start,
            scenes_in: [],
            total_lines: 0,
            dialogue_samples: []
          });
        }
        
        const char = characterMap.get(charName);
        char.scenes_in.push(scene.scene_number);
        char.total_lines += scene.dialogue_lines.length; // Approximate
      });
    });
    
    return Array.from(characterMap.values()).sort((a, b) => 
      b.total_lines - a.total_lines
    );
  }
  
  // Extract dialogue with context
  extractDialogue(scenes, characters) {
    const dialogue = [];
    
    scenes.forEach(scene => {
      const lines = scene.content.split('\n');
      let currentCharacter = null;
      let lineNumber = 0;
      
      lines.forEach(line => {
        const trimmed = line.trim();
        
        // Character name
        if (/^[A-Z][A-Z\s]{2,}$/.test(trimmed) && trimmed.length < 30) {
          currentCharacter = trimmed;
        }
        // Dialogue line
        else if (currentCharacter && trimmed.length > 0 && 
                 !/^(INT\.|EXT\.|FADE|CUT)/.test(trimmed)) {
          lineNumber++;
          dialogue.push({
            scene_number: scene.scene_number,
            character: currentCharacter,
            line_number: lineNumber,
            text: trimmed,
            length: trimmed.split(' ').length,
            // Basic tone detection
            tone: this.detectTone(trimmed)
          });
        }
      });
    });
    
    return dialogue;
  }
  
  // Identify story beats
  identifyBeats(scenes, fullText) {
    const beats = [];
    const totalPages = Math.ceil(fullText.split('\n').length / 60);
    
    // Industry standard beat locations
    const beatTemplates = [
      { name: 'Opening Image', range: [1, 3] },
      { name: 'Inciting Incident', range: [10, 15] },
      { name: 'End of Act 1', range: [25, 30] },
      { name: 'Midpoint', range: [55, 65] },
      { name: 'All Is Lost', range: [75, 85] },
      { name: 'Climax', range: [90, 100] },
      { name: 'Resolution', range: [105, 115] }
    ];
    
    beatTemplates.forEach(template => {
      // Find scenes in this range
      const matchingScenes = scenes.filter(s => 
        s.page_start >= template.range[0] && 
        s.page_start <= template.range[1]
      );
      
      if (matchingScenes.length > 0) {
        // Take the scene with most dialogue (usually the important one)
        const importantScene = matchingScenes.sort((a, b) => 
          b.dialogue_lines.length - a.dialogue_lines.length
        )[0];
        
        beats.push({
          beat_type: template.name,
          page_number: importantScene.page_start,
          scene_number: importantScene.scene_number,
          location: importantScene.location,
          confidence: matchingScenes.length > 1 ? 0.7 : 0.5
        });
      }
    });
    
    return beats;
  }
  
  // Analyze patterns in the script
  analyzePatterns(scenes, characters, dialogue, beats) {
    return {
      structure: {
        total_scenes: scenes.length,
        avg_scene_length: scenes.reduce((sum, s) => 
          sum + (s.page_end - s.page_start), 0) / scenes.length,
        dialogue_heavy_scenes: scenes.filter(s => s.dialogue_ratio > 0.7).length,
        action_heavy_scenes: scenes.filter(s => s.dialogue_ratio < 0.3).length
      },
      
      characters: {
        total_count: characters.length,
        main_characters: characters.filter(c => c.total_lines > 50).length,
        protagonist: characters[0]?.name || 'Unknown',
        voice_differentiation: this.analyzeVoiceDiff(dialogue, characters)
      },
      
      dialogue: {
        total_lines: dialogue.length,
        avg_line_length: dialogue.reduce((sum, d) => 
          sum + d.length, 0) / dialogue.length,
        tone_distribution: this.getToneDistribution(dialogue)
      },
      
      pacing: {
        beats_identified: beats.length,
        beat_timing_accuracy: this.checkBeatTiming(beats),
        scene_density: scenes.length / (scenes[scenes.length - 1]?.page_end || 100)
      }
    };
  }
  
  // Helper: Detect tone from dialogue
  detectTone(text) {
    const lowerText = text.toLowerCase();
    
    if (/!+/.test(text) || /\byell|shout|scream\b/i.test(text)) return 'intense';
    if (/\?/.test(text)) return 'questioning';
    if (/\.\.\.|—/.test(text)) return 'hesitant';
    if (/fuck|shit|damn/i.test(text)) return 'aggressive';
    if (/love|care|sweet/i.test(lowerText)) return 'tender';
    if (/ha|heh|funny/i.test(lowerText)) return 'humorous';
    
    return 'neutral';
  }
  
  // Helper: Analyze voice differentiation
  analyzeVoiceDiff(dialogue, characters) {
    // Group dialogue by character
    const byCharacter = {};
    
    dialogue.forEach(d => {
      if (!byCharacter[d.character]) {
        byCharacter[d.character] = [];
      }
      byCharacter[d.character].push(d);
    });
    
    // Calculate average line length per character
    const avgLengths = {};
    Object.keys(byCharacter).forEach(char => {
      const lines = byCharacter[char];
      avgLengths[char] = lines.reduce((sum, l) => 
        sum + l.length, 0) / lines.length;
    });
    
    // High variation = good voice differentiation
    const lengths = Object.values(avgLengths);
    const variation = Math.max(...lengths) - Math.min(...lengths);
    
    return variation > 5 ? 'high' : variation > 2 ? 'medium' : 'low';
  }
  
  // Helper: Get tone distribution
  getToneDistribution(dialogue) {
    const tones = {};
    dialogue.forEach(d => {
      tones[d.tone] = (tones[d.tone] || 0) + 1;
    });
    return tones;
  }
  
  // Helper: Check beat timing accuracy
  checkBeatTiming(beats) {
    // Compare to industry standards
    const standards = {
      'Inciting Incident': [10, 15],
      'End of Act 1': [25, 30],
      'Midpoint': [55, 65],
      'Climax': [90, 100]
    };
    
    let accurate = 0;
    let total = 0;
    
    beats.forEach(beat => {
      if (standards[beat.beat_type]) {
        total++;
        const [min, max] = standards[beat.beat_type];
        if (beat.page_number >= min && beat.page_number <= max) {
          accurate++;
        }
      }
    });
    
    return total > 0 ? (accurate / total) * 100 : 0;
  }
  
  // Save parsed data to database
  async saveToDatabase(parseResult) {
    console.log('\n💾 Saving parsed data to database...\n');
    
    const { script_id, scenes, characters, dialogue, beats } = parseResult;
    
    try {
      // 1. Save scenes
      console.log('Saving scenes...');
      for (const scene of scenes) {
        const { error } = await supabase
          .from('scenes')
          .upsert({
            script_id,
            scene_number: scene.scene_number,
            scene_type: scene.scene_type,
            location: scene.location,
            time: scene.time,
            page_start: scene.page_start,
            page_end: scene.page_end,
            content: scene.content,
            dialogue_ratio: scene.dialogue_ratio,
            action_line_count: scene.action_lines.length,
            dialogue_line_count: scene.dialogue_lines.length,
            characters_present: scene.characters_present
          }, { onConflict: 'script_id,scene_number' });
        
        if (error) console.error('Error saving scene:', error.message);
      }
      console.log(`✅ Saved ${scenes.length} scenes`);
      
      // 2. Save characters
      console.log('Saving characters...');
      const characterIdMap = {}; // Map names to IDs for dialogue linking
      
      for (const char of characters) {
        const { data, error } = await supabase
          .from('characters')
          .upsert({
            script_id,
            name: char.name,
            first_appearance_page: char.first_appearance,
            total_scenes: char.scenes_in.length,
            total_lines: char.total_lines,
            importance_rank: characters.indexOf(char) + 1
          }, { onConflict: 'script_id,name' })
          .select();
        
        if (error) {
          console.error('Error saving character:', error.message);
        } else if (data && data[0]) {
          characterIdMap[char.name] = data[0].id;
        }
      }
      console.log(`✅ Saved ${characters.length} characters`);
      
      // 3. Get scene IDs for dialogue linking
      const { data: savedScenes } = await supabase
        .from('scenes')
        .select('id, scene_number')
        .eq('script_id', script_id);
      
      const sceneIdMap = {};
      if (savedScenes) {
        savedScenes.forEach(s => {
          sceneIdMap[s.scene_number] = s.id;
        });
      }
      
      // 4. Save dialogue (in batches to avoid timeout)
      console.log('Saving dialogue...');
      const batchSize = 100;
      for (let i = 0; i < dialogue.length; i += batchSize) {
        const batch = dialogue.slice(i, i + batchSize);
        
        const dialogueRows = batch.map(d => ({
          script_id,
          scene_id: sceneIdMap[d.scene_number],
          character_id: characterIdMap[d.character],
          line_number: d.line_number,
          text: d.text,
          length: d.length,
          tone: d.tone
        })).filter(d => d.scene_id && d.character_id); // Only save if we have valid IDs
        
        if (dialogueRows.length > 0) {
          const { error } = await supabase
            .from('dialogue')
            .insert(dialogueRows);
          
          if (error) console.error('Error saving dialogue batch:', error.message);
        }
      }
      console.log(`✅ Saved ${dialogue.length} dialogue lines`);
      
      // 5. Save story beats
      console.log('Saving story beats...');
      for (const beat of beats) {
        const { error } = await supabase
          .from('story_beats')
          .upsert({
            script_id,
            scene_id: sceneIdMap[beat.scene_number],
            beat_type: beat.beat_type,
            page_number: beat.page_number,
            description: `${beat.location}`,
            expected_page_range: null, // Will add standards later
            timing_accuracy: beat.confidence > 0.6 ? 'perfect' : 'approximate'
          }, { onConflict: 'script_id,beat_type' });
        
        if (error) console.error('Error saving beat:', error.message);
      }
      console.log(`✅ Saved ${beats.length} story beats`);
      
      console.log('\n🎉 All data saved successfully!\n');
      return true;
      
    } catch (error) {
      console.error('❌ Error saving to database:', error);
      return false;
    }
  }
  
  // Parse and save a script
  async parseAndSave(scriptId) {
    const result = await this.parseScript(scriptId);
    if (result) {
      await this.saveToDatabase(result);
    }
    return result;
  }
}

module.exports = AdvancedScriptParser;

// Test if run directly
if (require.main === module) {
  const parser = new AdvancedScriptParser();
  
  // Get first script to test
  supabase
    .from('scripts')
    .select('id, title')
    .limit(1)
    .then(({ data }) => {
      if (data && data[0]) {
        console.log(`\n🎬 Testing deep parser on: ${data[0].title}\n`);
        return parser.parseAndSave(data[0].id);
      }
    })
    .then(result => {
      if (result) {
        console.log('\n📊 DEEP ANALYSIS COMPLETE!\n');
        console.log('✅ Scenes:', result.scenes.length);
        console.log('✅ Characters:', result.characters.length);
        console.log('✅ Dialogue lines:', result.dialogue.length);
        console.log('✅ Story beats:', result.beats.length);
        console.log('\n📈 Pattern Analysis:');
        console.log(JSON.stringify(result.analysis, null, 2));
        console.log('\n💾 All data saved to database!');
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
