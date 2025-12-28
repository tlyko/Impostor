import ImpostorGame from '@/components/ImpostorGame';
import BackgroundAmbience from '@/components/BackgroundAmbience';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-white font-sans overflow-hidden relative">
      {/* Base Background Color Layer */}
      <div className="fixed inset-0 bg-[#36393f] -z-20" />

      {/* Background Images Layer (-z-10) */}
      <BackgroundAmbience />

      {/* Game UI Layer (z-50) */}
      <ImpostorGame />
    </main>
  );
}
