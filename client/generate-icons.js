// Simple icon generator for PWA
// Run with: node generate-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG-based icon
function createIconSVG(size, text) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="#10b981" text-anchor="middle" dominant-baseline="middle">${text}</text>
  <rect x="${size * 0.05}" y="${size * 0.05}" width="${size * 0.9}" height="${size * 0.9}" fill="none" stroke="#334155" stroke-width="${size * 0.02}"/>
</svg>`;
}

// Note: This creates SVG files. For PNG, you'll need to:
// 1. Use the generate-icons.html file in a browser, or
// 2. Install a package like 'sharp' or 'canvas' to convert SVG to PNG
// 3. Use an online tool to convert SVG to PNG

const publicDir = path.join(__dirname, 'public');

// Create SVG icons (temporary - you'll need PNG for production)
const icon192 = createIconSVG(192, 'S');
const icon512 = createIconSVG(512, 'S');

fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512x512.svg'), icon512);

console.log('✅ Created SVG icons (icon-192x192.svg and icon-512x512.svg)');
console.log('⚠️  Note: You need PNG files for the PWA to work properly.');
console.log('📝 Options:');
console.log('   1. Open public/generate-icons.html in a browser to generate PNG icons');
console.log('   2. Use an online SVG to PNG converter');
console.log('   3. Use your design software to create proper PNG icons');
