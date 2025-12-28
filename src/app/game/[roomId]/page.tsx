import GameRoom from '@/components/GameRoom';
import MosaicBackground from '@/components/MosaicBackground';

interface PageProps {
    params: Promise<{
        roomId: string;
    }>;
}

export default async function GamePage({ params }: PageProps) {
    const { roomId } = await params;

    return (
        <main className="min-h-screen relative">
            <MosaicBackground />
            <GameRoom roomId={roomId} />
        </main>
    );
}
