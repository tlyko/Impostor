import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
    const imagesDir = path.join(process.cwd(), 'public', 'images');

    try {
        const files = await fs.promises.readdir(imagesDir);
        const images = files
            .filter(file => /\.(png|jpe?g|gif)$/i.test(file))
            .map(file => `images/${file}`);

        return NextResponse.json(images);
    } catch (e) {
        // Directory might not exist yet or empty
        console.error(e);
        return NextResponse.json([]);
    }
}
