import { promises as fs } from 'fs';
import path from 'path';

const searchDirs = [
  'app',
  'components',
  'lib',
  'types',
];

const fileExtensions = ['.ts', '.tsx', '.md', '.txt'];

async function walkDir(dir) {
  let results = [];
  const list = await fs.readdir(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(await walkDir(filePath));
    } else {
      if (fileExtensions.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

async function main() {
  const root = 'c:/Users/USER/Documents/unikom';
  
  let allFiles = [];
  const rootFiles = await fs.readdir(root);
  for (const file of rootFiles) {
    const filePath = path.join(root, file);
    const stat = await fs.stat(filePath);
    if (!stat.isDirectory() && fileExtensions.includes(path.extname(file))) {
      allFiles.push(filePath);
    } else if (stat.isDirectory() && searchDirs.includes(file)) {
      const files = await walkDir(filePath);
      allFiles = allFiles.concat(files);
    }
  }

  let modifiedCount = 0;

  for (const filePath of allFiles) {
    const content = await fs.readFile(filePath, 'utf8');
    
    let newContent = content;

    // 1. Replace specific long terms first to avoid overlaps
    newContent = newContent.replace(/Universitas Amikom Yogyakarta/gi, 'STMIK AMIKOM Surakarta');
    newContent = newContent.replace(/Universitas Amikom Surakarta/gi, 'STMIK AMIKOM Surakarta');
    
    // 2. Replace "Universitas Amikom"
    newContent = newContent.replace(/Universitas Amikom/gi, 'STMIK AMIKOM Surakarta');
    
    // 3. Replace standalone "Universitas" -> "STMIK" 
    // Or if the user meant "Universitas" -> "STMIK AMIKOM Surakarta", let's just use STMIK so it doesn't break things like "Universitas XYZ"
    newContent = newContent.replace(/Universitas/gi, 'STMIK AMIKOM Surakarta'); 
    
    // 4. "Yogyakarta" -> "Surakarta" (so "STMIK AMIKOM Yogyakarta" would become Surakarta... but we already did STMIK AMIKOM Surakarta). We can just replace Yogyakarta with Surakarta
    newContent = newContent.replace(/Yogyakarta/gi, 'STMIK AMIKOM Surakarta');
    
    // Cleanup double occurrences that might happen if original text was "Universitas Amikom Yogyakarta" and regexes overlap (shouldn't, if done sequentially)
    newContent = newContent.replace(/STMIK AMIKOM Surakarta Amikom Surakarta/gi, 'STMIK AMIKOM Surakarta');
    newContent = newContent.replace(/STMIK AMIKOM Surakarta STMIK AMIKOM Surakarta/gi, 'STMIK AMIKOM Surakarta');

    // Tracer Study
    newContent = newContent.replace(/Tracer Study/g, 'Sistem Alumni');
    newContent = newContent.replace(/tracer study/g, 'sistem alumni');
    newContent = newContent.replace(/Tracer study/g, 'Sistem alumni');
    newContent = newContent.replace(/tracer Study/g, 'sistem Alumni');
    // Also TracerStudy
    newContent = newContent.replace(/TracerStudy/gi, 'SistemAlumni');

    if (content !== newContent) {
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(`Modified: ${filePath}`);
      modifiedCount++;
    }
  }
  console.log(`Finished. Modified ${modifiedCount} files.`);
}

main().catch(console.error);
