const fs = require('fs');
const path = require('path');

const imagesDir = path.join(process.cwd(), 'public/images');
const outputFile = path.join(process.cwd(), 'public/images.json');

if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
    const images = files.map(f => '/images/' + f);
    fs.writeFileSync(outputFile, JSON.stringify(images, null, 2));
    console.log(`✅ Generated public/images.json with ${images.length} images.`);
} else {
    console.log('⚠️ No images directory found. Created empty list.');
    fs.writeFileSync(outputFile, '[]');
}
