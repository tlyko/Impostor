import fs from 'fs';
import path from 'path';

export function getAllImages(): string[] {
    try {
        const imagesDirectory = path.join(process.cwd(), 'public/images');
        const filenames = fs.readdirSync(imagesDirectory);

        const images = filenames
            .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map((file) => `/images/${file}`);

        // Shuffle the array to ensure randomness on each load
        return images.sort(() => Math.random() - 0.5);
    } catch (error) {
        console.error('Error reading image directory:', error);
        return [];
    }
}
