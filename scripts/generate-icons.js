import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mascotPath = join(__dirname, '../src/assets/mascot.png');
const publicPath = join(__dirname, '../public');

// Icon sizes needed
const iconSizes = {
  'favicon.ico': [{ size: 32, name: 'favicon-32x32.png' }, { size: 16, name: 'favicon-16x16.png' }],
  'apple-touch-icon.png': 180,
  'pwa-192x192.png': 192,
  'pwa-512x512.png': 512,
};

async function generateIcons() {
  try {
    console.log('Generating app icons from mascot...');
    
    // Load the mascot image
    const image = sharp(mascotPath);
    const metadata = await image.metadata();
    
    console.log(`Source image: ${metadata.width}x${metadata.height}`);
    
    // Generate favicon as PNG (modern browsers accept PNG for favicon)
    // Note: For true ICO format with multiple resolutions, use a package like 'png-to-ico'
    console.log('\nGenerating favicon...');
    const favicon32 = await image
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // Write as favicon.png (correctly named)
    await writeFile(join(publicPath, 'favicon.png'), favicon32);
    console.log('✅ Created favicon.png (32x32)');

    // Also write as favicon.ico for legacy support (browsers will accept PNG data)
    await writeFile(join(publicPath, 'favicon.ico'), favicon32);
    console.log('✅ Created favicon.ico (32x32 PNG format)');
    
    // Generate apple-touch-icon
    console.log('\nGenerating apple-touch-icon...');
    await image
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicPath, 'apple-touch-icon.png'));
    console.log('✅ Created apple-touch-icon.png (180x180)');
    
    // Generate PWA icons
    console.log('\nGenerating PWA icons...');
    await image
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicPath, 'pwa-192x192.png'));
    console.log('✅ Created pwa-192x192.png');
    
    await image
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(join(publicPath, 'pwa-512x512.png'));
    console.log('✅ Created pwa-512x512.png');
    
    console.log('\n🎉 All icons generated successfully!');
    console.log(`   Location: ${publicPath}`);
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
