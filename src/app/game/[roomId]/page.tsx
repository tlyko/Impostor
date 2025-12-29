import GameRoom from '@/components/GameRoom';
import MosaicBackground from '@/components/MosaicBackground';
import { getAllImages } from '@/lib/images';

interface PageProps {
    params: Promise<{
        roomId: string;
    }>;
}

export default async function GamePage({ params }: PageProps) {
    const { roomId } = await params;
    const images = getAllImages();

    return (
        <main className="min-h-screen relative">
            <MosaicBackground images={images} />
            <GameRoom roomId={roomId} />
        </main>
    );
}
