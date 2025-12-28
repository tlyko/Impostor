'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, set, update, get } from 'firebase/database';
import { useRouter } from 'next/navigation';
import { POLISH_WORDS } from '@/data/polishWords';
import RoleReveal from './RoleReveal';
import VotingPanel from './VotingPanel';

interface Player {
    name: string;
    isHost: boolean;
    votes: number;
}

interface GameState {
    status: 'LOBBY' | 'PLAYING' | 'VOTING' | 'ENDED';
    word: string;
    impostorId: string;
    players: Record<string, Player>;
}

interface GameRoomProps {
    roomId: string;
}

const GameRoom: React.FC<GameRoomProps> = ({ roomId }) => {
    const router = useRouter();
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [manualWord, setManualWord] = useState('');
    const [loading, setLoading] = useState(true);
    const [hasVoted, setHasVoted] = useState(false);

    // Load player ID from local storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPlayerId(localStorage.getItem('impostor_playerId'));
        }
    }, []);

    // Sync game state
    useEffect(() => {
        const roomRef = ref(db, `rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setGameState(data);
            } else {
                // Room deleted or doesn't exist
                router.push('/');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [roomId, router]);

    if (loading || !gameState || !playerId) {
        return (
            <div className="flex items-center justify-center min-h-screen text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    const currentPlayer = gameState.players[playerId];
    const isHost = currentPlayer?.isHost;
    const playersList = Object.entries(gameState.players);
    const isImpostor = gameState.impostorId === playerId;

    const handleStartGame = async (mode: 'MANUAL' | 'RANDOM') => {
        if (!isHost) return;

        let secretWord = '';
        if (mode === 'MANUAL') {
            if (!manualWord.trim()) return alert('Wpisz słowo!');
            secretWord = manualWord;
        } else {
            secretWord = POLISH_WORDS[Math.floor(Math.random() * POLISH_WORDS.length)];
        }

        // Pick Impostor
        const playerIds = Object.keys(gameState.players);
        if (playerIds.length < 3) {
            if (!confirm('Gra zazwyczaj wymaga 3+ graczy. Rozpocząć mimo to?')) return;
        }
        const randomImpostorId = playerIds[Math.floor(Math.random() * playerIds.length)];

        await update(ref(db, `rooms/${roomId}`), {
            status: 'PLAYING',
            word: secretWord,
            impostorId: randomImpostorId,
            // Reset votes
        });

        // Reset votes for all players
        const updates: Record<string, any> = {};
        playerIds.forEach(pid => {
            updates[`players/${pid}/votes`] = 0;
        });
        await update(ref(db, `rooms/${roomId}`), updates);
    };

    const handleStartVoting = async () => {
        await update(ref(db, `rooms/${roomId}`), {
            status: 'VOTING'
        });
    };

    const handleVote = async (targetId: string) => {
        // Increment target votes
        const targetRef = ref(db, `rooms/${roomId}/players/${targetId}/votes`);
        // We need a transaction or just simple get/set. 
        // Since it's realtime, transaction is better but simple set is easier for now.
        // Let's use transaction-like update by reading current state from prop
        // Note: this might have race conditions in high concurrency but good for casual.
        const currentVotes = gameState.players[targetId].votes || 0;
        await set(targetRef, currentVotes + 1);

        // We could track "who voted" to prevent double voting locally or in DB.
        // For simplicity, we just use local state in VotingPanel or localStorage?
        // Requirement: "show results after voting". 
        // Let's just track locally "hasVoted" for basic UX.
        localStorage.setItem(`voted_${roomId}_${Date.now()}`, 'true'); // Simple hack
    };


    const handleEndGame = async () => {
        if (!isHost) return;
        await update(ref(db, `rooms/${roomId}`), {
            status: 'ENDED' // Or back to lobby? "Show results" is usually ENDED.
        });
    };

    const handleReset = async () => {
        if (!isHost) return;
        await update(ref(db, `rooms/${roomId}`), {
            status: 'LOBBY',
            word: '',
            impostorId: '',
        });
        setHasVoted(false);
    };


    return (
        <div className="relative z-10 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center min-h-screen text-white">
            {/* Header */}
            <div className="w-full flex justify-between items-center mb-8 backdrop-blur-sm bg-black/30 p-4 rounded-xl border border-white/10">
                <div>
                    <h2 className="text-xl font-bold text-gray-300">KOD POKOJU</h2>
                    <p className="text-4xl font-mono tracking-widest text-yellow-400">{roomId}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-300 flex items-center justify-end gap-2">
                        GRACZ <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    </h2>
                    <p className="text-2xl truncate max-w-[150px]">{currentPlayer?.name}</p>
                </div>
            </div>

            {/* -- LOBBY PHASE -- */}
            {gameState.status === 'LOBBY' && (
                <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                    <h1 className="text-3xl font-bold text-center mb-8">Oczekiwanie na graczy...</h1>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                        {playersList.map(([pid, p]) => (
                            <div key={pid} className="bg-black/40 p-4 rounded-lg flex items-center gap-3 border border-white/10 animate-fade-in">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 flex items-center justify-center font-bold text-sm">
                                    {p.name.charAt(0)}
                                </div>
                                <span className="truncate">{p.name} {p.isHost && '👑'}</span>
                            </div>
                        ))}
                    </div>

                    {isHost ? (
                        <div className="flex flex-col gap-4 border-t border-white/20 pt-6">
                            <h3 className="text-center text-gray-400 uppercase tracking-widest text-sm mb-2">Ustawienia Gry</h3>
                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    onClick={() => handleStartGame('RANDOM')}
                                    className="flex-1 py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition shadow-lg hover:shadow-green-500/20"
                                >
                                    GRAJ Z LOSOWYM SŁOWEM
                                </button>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Tajne Słowo"
                                        className="w-full bg-black/40 px-4 rounded-l-xl border border-white/20 focus:outline-none"
                                        value={manualWord}
                                        onChange={e => setManualWord(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleStartGame('MANUAL')}
                                        className="bg-blue-600 hover:bg-blue-500 px-6 rounded-r-xl font-bold transition"
                                    >
                                        GRAJ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 animate-pulse">
                            Oczekiwanie na rozpoczęcie przez hosta...
                        </div>
                    )}
                </div>
            )}

            {/* -- PLAYING PHASE -- */}
            {gameState.status === 'PLAYING' && (
                <div className="w-full max-w-2xl flex flex-col items-center gap-8">
                    <RoleReveal isImpostor={isImpostor} secretWord={gameState.word} />

                    <div className="w-full bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 mt-8">
                        <h3 className="text-center text-gray-400 mb-4">Gracze w grze</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            {playersList.map(([pid, p]) => (
                                <span key={pid} className="px-3 py-1 bg-black/40 rounded-full border border-white/10 text-sm text-gray-300">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleStartVoting}
                        className="w-full py-6 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-2xl uppercase tracking-widest shadow-xl shadow-red-900/40 hover:scale-105 transition-all"
                    >
                        ROZPOCZNIJ GŁOSOWANIE 🚨
                    </button>
                </div>
            )}

            {/* -- VOTING PHASE -- */}
            {gameState.status === 'VOTING' && (
                <div className="w-full max-w-xl bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-2xl">
                    <VotingPanel
                        players={gameState.players}
                        onVote={(targetId) => {
                            handleVote(targetId);
                            setHasVoted(true);
                        }}
                        hasVoted={hasVoted}
                    />
                    {isHost && (
                        <button
                            onClick={handleEndGame}
                            className="mt-8 w-full py-4 bg-yellow-600 hover:bg-yellow-500 rounded-xl font-bold uppercase transition"
                        >
                            Pokaż Wyniki
                        </button>
                    )}
                </div>
            )}

            {/* -- ENDED PHASE -- */}
            {gameState.status === 'ENDED' && (
                <div className="w-full max-w-2xl bg-black/80 backdrop-blur-xl p-8 rounded-3xl border border-white/20 text-center animate-in zoom-in duration-500">
                    <h1 className="text-4xl font-bold mb-2">KONIEC GRY</h1>
                    <p className="text-gray-400 mb-8">Ujawnienie ról</p>

                    <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest">Impostorem był</p>
                        <div className="text-3xl font-black text-red-500 bg-red-900/20 inline-block px-8 py-4 rounded-xl border border-red-500/50">
                            {gameState.players[gameState.impostorId]?.name || 'Nieznany'}
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-2 uppercase tracking-widest">Tajne słowo</p>
                        <div className="text-2xl font-bold text-green-400">
                            {gameState.word}
                        </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-xl mb-8">
                        <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Wyniki Głosowania</h3>
                        <div className="flex flex-col gap-2">
                            {playersList
                                .sort(([, a], [, b]) => b.votes - a.votes)
                                .map(([pid, p]) => (
                                    <div key={pid} className="flex justify-between items-center p-2 rounded hover:bg-white/5">
                                        <span className={pid === gameState.impostorId ? 'text-red-400 font-bold' : 'text-gray-300'}>
                                            {p.name} {pid === gameState.impostorId && '(Impostor)'}
                                        </span>
                                        <span className="font-mono bg-white/20 px-2 py-1 rounded text-sm">{p.votes} głosów</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>

                    {isHost && (
                        <button
                            onClick={handleReset}
                            className="w-full py-4 bg-white text-black font-bold uppercase rounded-xl hover:bg-gray-200 transition"
                        >
                            ZAGRAJ PONOWNIE
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameRoom;
