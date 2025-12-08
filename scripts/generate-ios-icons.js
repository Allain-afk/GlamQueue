/**
 * Generate iOS-compatible PWA icons
 * 
 * iOS requires full-bleed square icons WITHOUT rounded corners.
 * Apple automatically applies its superellipse mask.
 * 
 * Run: node scripts/generate-ios-icons.js
 * Requires: npm install sharp
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon sizes for iOS/PWA
const sizes = [
  { size: 72, name: 'apple-touch-icon-72x72.png' },
  { size: 96, name: 'apple-touch-icon-96x96.png' },
  { size: 120, name: 'apple-touch-icon-120x120.png' },
  { size: 128, name: 'apple-touch-icon-128x128.png' },
  { size: 144, name: 'apple-touch-icon-144x144.png' },
  { size: 152, name: 'apple-touch-icon-152x152.png' },
  { size: 167, name: 'apple-touch-icon-167x167.png' }, // iPad Pro
  { size: 180, name: 'apple-touch-icon-180x180.png' }, // iPhone 6 Plus+
  { size: 192, name: 'apple-touch-icon-192x192.png' },
  { size: 512, name: 'apple-touch-icon-512x512.png' },
  { size: 1024, name: 'apple-touch-icon-1024x1024.png' }, // App Store
];

const inputDir = path.join(__dirname, '../android/app/src/main/res/mipmap-xxxhdpi');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('Generating iOS-compatible icons...\n');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Load foreground and background
    const foregroundPath = path.join(inputDir, 'ic_launcher_foreground.png');
    const backgroundPath = path.join(inputDir, 'ic_launcher_background.png');

    // Check if files exist
    if (!fs.existsSync(foregroundPath)) {
      console.error('Error: ic_launcher_foreground.png not found');
      console.log('Using ic_launcher.png as fallback...');
      
      // Fallback to regular launcher icon
      const launcherPath = path.join(inputDir, 'ic_launcher.png');
      for (const { size, name } of sizes) {
        await sharp(launcherPath)
          .resize(size, size, {
            fit: 'cover',
            position: 'center'
          })
          .png()
          .toFile(path.join(outputDir, name));
        console.log(`✓ Generated ${name}`);
      }
      return;
    }

    // Get foreground dimensions
    const foregroundMeta = await sharp(foregroundPath).metadata();
    const fgSize = Math.min(foregroundMeta.width, foregroundMeta.height);

    for (const { size, name } of sizes) {
      // Create a square canvas with background color
      const canvas = sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 74, g: 44, b: 42, alpha: 1 } // Brown background from your icon
        }
      });

      // Resize foreground to fit (with some padding for iOS safe zone)
      // iOS recommends keeping important content within 80% of icon
      const fgTargetSize = Math.round(size * 0.85);
      const fgOffset = Math.round((size - fgTargetSize) / 2);

      const foregroundResized = await sharp(foregroundPath)
        .resize(fgTargetSize, fgTargetSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Composite foreground onto background
      await canvas
        .composite([
          {
            input: foregroundResized,
            top: fgOffset,
            left: fgOffset,
          }
        ])
        .png()
        .toFile(path.join(outputDir, name));

      console.log(`✓ Generated ${name}`);
    }

    console.log('\n✅ All iOS icons generated successfully!');
    console.log(`\nIcons saved to: ${outputDir}`);
    console.log('\nNext steps:');
    console.log('1. Update index.html to use apple-touch-icon-*.png');
    console.log('2. Rebuild the project: npm run build');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

