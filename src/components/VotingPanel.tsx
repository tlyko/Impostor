'use client';

import React from 'react';

interface Player {
    id: string;
    name: string;
    isHost: boolean;
    votes: number;
    voters: string[]; // Names of people who voted for this player
    suspectedBy: string[]; // Names of people suspecting this player
}

interface VotingPanelProps {
    players: Player[]; // Now receives the array directly
    onVote: (targetPlayerId: string) => void;
    hasVoted: boolean;
}

const VotingPanel: React.FC<VotingPanelProps> = ({ players, onVote, hasVoted }) => {
    const [selectedId, setSelectedId] = React.useState<string | null>(null);

    // Sort by votes descending for results
    const sortedPlayers = [...players].sort((a, b) => b.votes - a.votes);

    const handleConfirm = () => {
        if (selectedId) {
            onVote(selectedId);
            setSelectedId(null);
        }
    };

    return (
        <div className="w-full relative pb-20"> {/* Add padding for fixed button */}
            <h2 className="text-3xl font-bold text-center mb-6 text-yellow-400 tracking-widest uppercase drop-shadow-md">
                Zagłosuj na Impostora
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {players.map((player) => (
                    <button
                        key={player.id}
                        onClick={() => {
                            if (!hasVoted) {
                                setSelectedId(player.id);
                            }
                        }}
                        disabled={hasVoted}
                        className={`
              relative flex flex-col items-start p-4 rounded-lg transform transition-all w-full
              ${hasVoted
                                ? 'bg-gray-800/50 cursor-default opacity-50'
                                : selectedId === player.id
                                    ? 'bg-red-600/20 border-2 border-red-500 scale-[1.02] shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                                    : 'bg-white/10 hover:bg-white/20 hover:scale-[1.01] border border-white/10 active:scale-95 cursor-pointer'}
            `}
                    >
                        <div className="flex items-center justify-between w-full mb-2">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${hasVoted ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xl font-medium text-white">{player.name}</span>
                            </div>

                            {/* Vote count badge */}
                            {player.votes > 0 && (
                                <div className="bg-red-600 text-white text-md font-bold px-4 py-1 rounded-full shadow-lg border border-red-400">
                                    {player.votes} 🗳️
                                </div>
                            )}
                        </div>

                        {/* Public Voters List (CONFIRMED) */}
                        {player.voters.length > 0 && (
                            <div className="w-full pl-14 text-left mb-1">
                                <p className="text-[10px] text-red-400 uppercase tracking-widest mb-1 font-bold">Zagłosowali:</p>
                                <div className="flex flex-wrap gap-2">
                                    {player.voters.map((voterName, idx) => (
                                        <span key={idx} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded shadow-sm border border-red-400">
                                            {voterName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Live Suspicions List (THINKING) */}
                        {player.suspectedBy.length > 0 && (
                            <div className="w-full pl-14 text-left">
                                <p className="text-[10px] text-yellow-400 uppercase tracking-widest mb-1 font-bold">Podejrzewają:</p>
                                <div className="flex flex-wrap gap-2">
                                    {player.suspectedBy.map((name, idx) => (
                                        <span key={idx} className="text-xs bg-yellow-500/20 text-yellow-200 px-2 py-0.5 rounded border border-yellow-500/30 flex items-center gap-1">
                                            👀 {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {hasVoted && (
                <div className="mt-6 text-center text-gray-400 animate-pulse">
                    Oczekiwanie na głosy innych...
                </div>
            )}

            {/* Confirmation Button Overlay */}
            {!hasVoted && selectedId && (
                <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-50 animate-bounce-in">
                    <button
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-500 text-white font-black text-xl py-4 px-12 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.6)] border-4 border-red-800 uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        POTWIERDŹ GŁOS 🔪
                    </button>
                </div>
            )}
        </div>
    );
};

export default VotingPanel;
