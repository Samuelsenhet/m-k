import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = join(__dirname, '../src/assets/mascot.png');
const outputPath = join(__dirname, '../src/assets/mascot-transparent.png');

async function removeBackground() {
  try {
    console.log('Processing image to remove black background...');
    
    // Load the image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`Image dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`Image format: ${metadata.format}`);
    
    // Convert to RGBA and process
    const processed = await image
      .ensureAlpha() // Ensure alpha channel exists
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = processed;
    const { width, height, channels } = info;
    
    // Process pixels: make black/dark pixels transparent
    // Threshold: pixels darker than this will become transparent
    const threshold = 30; // Adjust this value (0-255) to control sensitivity
    
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      
      // If pixel is dark (black background), make it transparent
      if (brightness < threshold) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      } else {
        // For lighter pixels, keep them but adjust alpha slightly if needed
        // This helps with anti-aliasing edges
        if (brightness < threshold + 20) {
          // Gradual fade for edge pixels
          const fade = (brightness - threshold) / 20;
          data[i + 3] = Math.round(255 * fade);
        } else {
          data[i + 3] = 255; // Fully opaque
        }
      }
    }
    
    // Save as PNG with transparency
    await sharp(data, {
      raw: {
        width,
        height,
        channels: 4
      }
    })
    .png()
    .toFile(outputPath);
    
    console.log(`✅ Successfully created transparent PNG: ${outputPath}`);
    console.log(`   Original: ${inputPath}`);
    console.log(`   New file: ${outputPath}`);
    
  } catch (error) {
    console.error('Error processing image:', error);
    process.exit(1);
  }
}

removeBackground();
