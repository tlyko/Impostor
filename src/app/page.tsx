import Lobby from '@/components/Lobby';
import MosaicBackground from '@/components/MosaicBackground';
import { getAllImages } from '@/lib/images';

export default function Home() {
  const images = getAllImages();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative">
      <MosaicBackground images={images} />
      <Lobby />

      <footer className="absolute bottom-4 text-center text-xs text-white/30">
        <p>GRA TOWARZYSKA</p>
      </footer>
    </main>
  );
}
