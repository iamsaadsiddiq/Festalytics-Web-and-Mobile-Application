import pkg from 'xlsx';
const { readFile, utils } = pkg;
import fs from 'fs';
import path from 'path';

const excelPath = 'Marriage Halls - Training ready data.xlsx';
const sourceDir = 'Marriage hall'; // Source images
const publicDir = 'public/Marriage Hall'; // Where they will be served from by Vite
const dataFile = 'src/data/halls.json';

// Ensure data dir exists
if (!fs.existsSync('src/data')) {
  fs.mkdirSync('src/data', { recursive: true });
}

// Ensure the target public dir exists (we copied it earlier)
const readDir = fs.existsSync(publicDir) ? publicDir : sourceDir;

const workbook = readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = utils.sheet_to_json(worksheet);

// String Normalization Helper
const slugify = (str) => {
  if (!str) return '';
  return str.toLowerCase()
            .replace(/[^\w\s-]/g, '') // remove special characters
            .replace(/\s+/g, ' ')     // replace multiple spaces with single space
            .trim();
};

// Get all folders
let folders = [];
if (fs.existsSync(readDir)) {
  folders = fs.readdirSync(readDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

// Pre-compute slugified folder names for faster matching
const slugifiedFolders = folders.map(f => ({ original: f, slug: slugify(f) }));

const unmatchedHalls = [];

// Map data
const processedData = data.map(row => {
  const hallName = row.hall_name || '';
  const slugifiedHallName = slugify(hallName);
  
  // Find matching folder using slugified names
  let matchedFolder = slugifiedFolders.find(f => f.slug === slugifiedHallName);
  
  // Fallback: try finding a folder that contains the hall name or vice versa
  if (!matchedFolder) {
     matchedFolder = slugifiedFolders.find(f => f.slug.includes(slugifiedHallName) || slugifiedHallName.includes(f.slug));
  }

  let images = [];
  if (matchedFolder) {
    const folderPath = path.join(readDir, matchedFolder.original);
    const files = fs.readdirSync(folderPath);
    // Grab the first available image file (.jpg, .png, .webp, .jpeg)
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
    });

    if (imageFiles.length > 0) {
      // Ensure all image paths are correctly prefixed to point to the public/Marriage Hall/ directory
      // Vite handles public/ as root /
      images = imageFiles.map(img => `/Marriage Hall/${encodeURIComponent(matchedFolder.original)}/${encodeURIComponent(img)}`);
    } else {
      unmatchedHalls.push(`${hallName} (Folder found but no images inside)`);
      images = ['/images/placeholder-hall.jpg'];
    }
  } else {
    unmatchedHalls.push(`${hallName} (No matching folder found)`);
    images = ['/images/placeholder-hall.jpg']; // Fallback Mechanism
  }

  return {
    ...row,
    images
  };
});

fs.writeFileSync(dataFile, JSON.stringify(processedData, null, 2));
console.log(`Saved ${processedData.length} records to ${dataFile}`);

if (unmatchedHalls.length > 0) {
  console.log('\n--- Debugging Helper: Unmatched Halls ---');
  console.log(`Failed to find folder or images for ${unmatchedHalls.length} halls:`);
  unmatchedHalls.forEach(hall => console.log(`- ${hall}`));
  console.log('-----------------------------------------\n');
}
