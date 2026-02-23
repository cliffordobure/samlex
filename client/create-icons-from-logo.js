// Create PWA icons from your logo
// Usage: node create-icons-from-logo.js [path-to-your-logo.png]

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const { createCanvas, loadImage } = await import('canvas');
  
  // Get logo path from command line or use default
  const logoPath = process.argv[2] || path.join(__dirname, 'logo.png');
  const publicDir = path.join(__dirname, 'public');
  
  console.log('🎨 Creating PWA icons from logo...');
  console.log(`📁 Looking for logo at: ${logoPath}`);
  
  // Check if logo exists
  if (!fs.existsSync(logoPath)) {
    console.log('');
    console.log('❌ Logo file not found!');
    console.log('');
    console.log('📝 Instructions:');
    console.log('   1. Place your logo file (PNG, JPG, or SVG) in the client folder');
    console.log('   2. Name it "logo.png" (or provide the path)');
    console.log('   3. Run: node create-icons-from-logo.js [path-to-logo]');
    console.log('');
    console.log('💡 Example:');
    console.log('   node create-icons-from-logo.js ./my-logo.png');
    console.log('   node create-icons-from-logo.js ../assets/logo.jpg');
    process.exit(1);
  }
  
  console.log('✅ Logo found!');
  console.log('📐 Loading and resizing...');
  
  // Load the logo image
  const logo = await loadImage(logoPath);
  
  // Function to create icon with padding and background
  function createIcon(size, logoImage) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Create a nice background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Calculate logo size (80% of icon size with padding)
    const padding = size * 0.1;
    const logoSize = size - (padding * 2);
    
    // Calculate position to center the logo
    const x = padding;
    const y = padding;
    
    // Draw logo with rounded corners effect
    ctx.save();
    
    // Create rounded rectangle path
    const radius = size * 0.15;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + logoSize - radius, y);
    ctx.quadraticCurveTo(x + logoSize, y, x + logoSize, y + radius);
    ctx.lineTo(x + logoSize, y + logoSize - radius);
    ctx.quadraticCurveTo(x + logoSize, y + logoSize, x + logoSize - radius, y + logoSize);
    ctx.lineTo(x + radius, y + logoSize);
    ctx.quadraticCurveTo(x, y + logoSize, x, y + logoSize - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
    
    // Draw the logo
    ctx.drawImage(logoImage, x, y, logoSize, logoSize);
    ctx.restore();
    
    return canvas.toBuffer('image/png');
  }
  
  // Create both icon sizes - save to assets folder
  const assetsDir = path.join(publicDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  console.log('🖼️  Creating 192x192 icon...');
  const icon192 = createIcon(192, logo);
  fs.writeFileSync(path.join(assetsDir, 'icon-192x192.png'), icon192);
  console.log('   ✅ Created assets/icon-192x192.png');
  
  console.log('🖼️  Creating 512x512 icon...');
  const icon512 = createIcon(512, logo);
  fs.writeFileSync(path.join(assetsDir, 'icon-512x512.png'), icon512);
  console.log('   ✅ Created assets/icon-512x512.png');
  
  console.log('');
  console.log('🎉 Success! Icons created from your logo!');
  console.log('');
  console.log('📦 Next steps:');
  console.log('   1. Commit the new icon files');
  console.log('   2. Push to trigger Vercel deployment');
  console.log('   3. The PWA will use your logo!');
  console.log('');
  
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('canvas')) {
    console.log('❌ Canvas package not found!');
    console.log('');
    console.log('📦 Install it first:');
    console.log('   npm install --save-dev canvas');
    console.log('');
  } else {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
  process.exit(1);
}
