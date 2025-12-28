'use client';

import React from 'react';

interface Player {
    name: string;
    isHost: boolean;
    votes: number;
    id: string; // Helper to pass ID
}

interface VotingPanelProps {
    players: Record<string, Omit<Player, 'id'>>; // Firebase object
    onVote: (targetPlayerId: string) => void;
    hasVoted: boolean;
}

const VotingPanel: React.FC<VotingPanelProps> = ({ players, onVote, hasVoted }) => {
    const playerList = Object.entries(players).map(([id, p]) => ({ ...p, id }));

    // Sort by votes descending for results
    const sortedPlayers = [...playerList].sort((a, b) => b.votes - a.votes);

    return (
        <div className="w-full">
            <h2 className="text-3xl font-bold text-center mb-6 text-yellow-400 tracking-widest uppercase Drop-shadow-md">
                Zagłosuj na Impostora
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {playerList.map((player) => (
                    <button
                        key={player.id}
                        onClick={() => !hasVoted && onVote(player.id)}
                        disabled={hasVoted}
                        className={`
              relative flex items-center justify-between p-4 rounded-lg transform transition-all
              ${hasVoted
                                ? 'bg-gray-800/50 cursor-default'
                                : 'bg-white/10 hover:bg-white/20 hover:scale-[1.02] border border-white/10 active:scale-95 cursor-pointer'}
            `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${hasVoted ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xl font-medium text-white">{player.name}</span>
                        </div>

                        {/* Show votes always or only after end? Requirement says "Show results after voting" - usually implying instant feedback or end phase. 
                Let's show votes here if the game state allows, but the component just receives 'votes'. 
                We will update the GameRoom to handle visibility logic. 
                For now, we ALWAYS show votes count if it's > 0 to let people see consensus as it builds? 
                Or maybe hide it? 
                "Show results after voting" implies a results phase.
                Let's show a checkmark if you voted for them.
            */}

                        {/* If we want to show votes live: */}
                        {player.votes > 0 && (
                            <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                {player.votes} GŁOSÓW
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
        </div>
    );
};

export default VotingPanel;
