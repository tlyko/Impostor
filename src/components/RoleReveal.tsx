'use client';

import React, { useState } from 'react';

interface RoleRevealProps {
    isImpostor: boolean;
    secretWord: string;
}

const RoleReveal: React.FC<RoleRevealProps> = ({ isImpostor, secretWord }) => {
    const [revealed, setRevealed] = useState(false);

    if (!revealed) {
        return (
            <button
                onClick={() => setRevealed(true)}
                className="w-full py-12 border-2 border-dashed border-white/30 rounded-xl hover:bg-white/5 transition flex flex-col items-center justify-center cursor-pointer group"
            >
                <span className="text-2xl font-bold text-gray-400 group-hover:text-white transition">DOTKNIJ ABY ZOBACZYĆ ROLĘ</span>
                <span className="text-sm text-gray-500 mt-2">Upewnij się, że nikt nie patrzy!</span>
            </button>
        );
    }

    return (
        <div className="w-full p-8 rounded-xl bg-black/50 border border-white/10 text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl text-gray-400 mb-2 uppercase tracking-widest">TWOJA ROLA</h2>

            {isImpostor ? (
                <div className="py-8">
                    <h1 className="text-5xl md:text-6xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                        JESTEŚ IMPOSTOREM
                    </h1>
                    <p className="mt-4 text-gray-300">Wtop się w tłum. Nie daj po sobie poznać, że nie znasz słowa.</p>
                </div>
            ) : (
                <div className="py-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-green-400 mb-4 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                        CYWIL
                    </h1>
                    <div className="bg-white/10 p-4 rounded-lg inline-block">
                        <p className="text-sm text-gray-400 mb-1 uppercase">Tajne Słowo</p>
                        <p className="text-3xl font-bold text-white tracking-wide">{secretWord}</p>
                    </div>
                </div>
            )}

            <button
                onClick={() => setRevealed(false)}
                className="mt-6 text-sm text-gray-500 hover:text-white underline"
            >
                Ukryj Rolę
            </button>
        </div>
    );
};

export default RoleReveal;
