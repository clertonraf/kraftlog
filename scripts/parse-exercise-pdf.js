const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Path to the PDF file
const pdfPath = process.argv[2] || '/Users/clerton/workspace/KraftLogImport/tmp/lista-de-videos-de-exercicios.pdf';

console.log('Parsing PDF:', pdfPath);

// Extract text from PDF using pdftotext
exec(`pdftotext "${pdfPath}" -`, (error, stdout, stderr) => {
  if (error) {
    console.error('Error extracting PDF:', error);
    return;
  }

  const lines = stdout.split('\n').filter(line => line.trim());
  const exercises = [];
  const youtubeRegex = /https:\/\/youtu\.be\/[a-zA-Z0-9_-]+/;
  
  let currentMuscleGroup = '';
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Skip header lines
    if (line.includes('Vídeos dos Exercícios') || 
        line.includes('Alguns exercícios') ||
        line.includes('Execução em Vídeo') ||
        line.includes('Exercício') ||
        line.includes('Leandro Twin') ||
        line.includes('CREF:') ||
        line.includes('WhatsApp:') ||
        line.includes('www.')) {
      i++;
      continue;
    }
    
    // Check if it's a muscle group header (single word lines that aren't URLs)
    if (!youtubeRegex.test(line) && !line.includes(' ') && line.length > 3 && 
        !line.startsWith('http') && line !== line.toLowerCase()) {
      currentMuscleGroup = line;
      i++;
      continue;
    }
    
    // Check if it's an exercise name (not a URL)
    if (!youtubeRegex.test(line) && line.length > 3 && !line.startsWith('http')) {
      const exerciseName = line;
      
      // Look ahead for the YouTube URL
      let j = i + 1;
      let videoUrl = '';
      while (j < lines.length && j < i + 5) {
        const nextLine = lines[j].trim();
        if (youtubeRegex.test(nextLine)) {
          videoUrl = nextLine;
          break;
        }
        j++;
      }
      
      exercises.push({
        name: exerciseName,
        muscleGroup: currentMuscleGroup,
        videoUrl: videoUrl || null
      });
    }
    
    i++;
  }
  
  // Output results
  console.log('\n=== Parsed Exercises ===');
  console.log(JSON.stringify(exercises, null, 2));
  console.log(`\nTotal exercises found: ${exercises.length}`);
  
  // Write to file
  const outputPath = path.join(__dirname, '../tmp/exercises-parsed.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(exercises, null, 2));
  console.log(`\nWritten to: ${outputPath}`);
});
