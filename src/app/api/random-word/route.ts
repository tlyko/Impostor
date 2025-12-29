import { NextResponse } from 'next/server';
import nouns from '@/data/nouns.json';

export const runtime = 'edge';

export async function GET() {
    const randomWord = nouns[Math.floor(Math.random() * nouns.length)];
    return NextResponse.json({ word: randomWord });
}
