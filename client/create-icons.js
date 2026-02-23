// Quick icon generator - creates PNG files using canvas (requires canvas package)
// Alternative: Use the generate-icons.html file in browser

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal valid PNG file (1x1 transparent pixel) - we'll create proper icons
// This is a fallback - better to use generate-icons.html in browser

console.log('📝 Creating placeholder icons...');
console.log('');
console.log('⚠️  For best results, use one of these methods:');
console.log('');
console.log('Method 1 (Recommended):');
console.log('  1. Open public/generate-icons.html in your browser');
console.log('  2. Click "Generate 192x192 Icon" → Click "Download Icon"');
console.log('  3. Save as icon-192x192.png in public folder');
console.log('  4. Click "Generate 512x512 Icon" → Click "Download Icon"');
console.log('  5. Save as icon-512x512.png in public folder');
console.log('');
console.log('Method 2: Install canvas package and run this script:');
console.log('  npm install canvas');
console.log('  node create-icons.js');
console.log('');
console.log('Method 3: Use online tool:');
console.log('  https://realfavicongenerator.net/');
console.log('  https://favicon.io/');

// Try to use canvas if available
try {
  const { createCanvas } = await import('canvas');
  const publicDir = path.join(__dirname, 'public');
  
  function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw "S" letter
    ctx.fillStyle = '#10b981';
    ctx.font = `bold ${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', size / 2, size / 2);
    
    // Border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = size * 0.02;
    ctx.strokeRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9);
    
    return canvas.toBuffer('image/png');
  }
  
  const icon192 = createIcon(192);
  const icon512 = createIcon(512);
  
  fs.writeFileSync(path.join(publicDir, 'icon-192x192.png'), icon192);
  fs.writeFileSync(path.join(publicDir, 'icon-512x512.png'), icon512);
  
  console.log('✅ Icons created successfully!');
  console.log('   - public/icon-192x192.png');
  console.log('   - public/icon-512x512.png');
} catch (error) {
  console.log('❌ Canvas package not found. Using browser method instead.');
  console.log('');
  console.log('👉 Please open public/generate-icons.html in your browser');
  console.log('   and download the icons as described above.');
}
