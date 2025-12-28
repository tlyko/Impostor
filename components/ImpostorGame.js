'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';

let socket;

export default function ImpostorGame() {
    // UI State
    const [view, setView] = useState('LOGIN'); // LOGIN, LOBBY, GAME, VOTING, RESULTS
    const [name, setName] = useState('');
    const [roomCodeInput, setRoomCodeInput] = useState('');

    // Game State
    const [roomCode, setRoomCode] = useState('');
    const [players, setPlayers] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [myId, setMyId] = useState(null);
    const [gameState, setGameState] = useState('LOBBY');

    // Role & Gameplay
    const [role, setRole] = useState(null);
    const [secretWord, setSecretWord] = useState('');
    const [cardRevealed, setCardRevealed] = useState(false);

    // Voting
    const [voteCounts, setVoteCounts] = useState({ total: 0, required: 0, details: {} });

    // Results
    const [lastResult, setLastResult] = useState(null);

    // Host Controls
    const [mode, setMode] = useState('A');
    const [customWord, setCustomWord] = useState('');

    // Initialize Socket
    useEffect(() => {
        const socketInitializer = async () => {
            // Connect to external socket URL if defined (for Hybrid deployment), otherwise default to local
            const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
            const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || '/api/socket';

            await fetch(SOCKET_URL ? `${SOCKET_URL}${SOCKET_PATH}` : '/api/socket').catch(() => { });

            socket = io(SOCKET_URL, {
                path: SOCKET_PATH,
                addTrailingSlash: false,
                reconnection: true,
            });

            socket.on('connect', () => {
                console.log('Connected to socket', socket.id);
                setMyId(socket.id);
            });

            socket.on('playerInfo', (info) => {
                setMyId(info.id);
                setIsHost(info.isHost);
            });

            socket.on('roomUpdate', (room) => {
                setRoomCode(room.code);
                setPlayers(room.players);
                setGameState(room.gameState);

                // Sync UI view with game state (safeguard)
                if (room.gameState === 'LOBBY') setView('LOBBY');
                else if (room.gameState === 'GAME') setView('GAME');
                else if (room.gameState === 'VOTING') setView('VOTING');
                else if (room.gameState === 'END') setView('RESULTS');

                setVoteCounts(room.voteCounts);
            });

            socket.on('gameStarted', (data) => {
                setRole(data.role);
                setSecretWord(data.secretWord);
                setCardRevealed(false);
                setView('GAME');
            });

            socket.on('voteResult', (res) => {
                if (!res.success) alert(res.message);
            });

            socket.on('gameEnd', (res) => {
                setLastResult(res);
                setView('RESULTS');
            });

            socket.on('connect_error', (err) => {
                console.error("Socket connection error:", err);
            });
        };

        socketInitializer();

        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    // Actions
    const joinGame = () => {
        if (!name) return alert("Proszę wpisać nazwę");
        let code = roomCodeInput.trim();
        if (!code) code = Math.random().toString(36).substring(2, 6).toUpperCase();

        socket.emit('joinRoom', { name, roomCode: code });
    };

    const startGame = () => {
        if (mode === 'B' && !customWord) return alert("Proszę wpisać sekretne słowo!");
        socket.emit('startGame', { roomCode, mode, customWord });
    };

    const callMeeting = () => {
        if (confirm("Zwołać nadzwyczajne zebranie?")) socket.emit('callMeeting', { roomCode });
    };

    const castVote = (targetId) => {
        socket.emit('castVote', { roomCode, targetId });
    };

    const playAgain = () => {
        socket.emit('playAgain', { roomCode });
    };

    // --- RENDER HELPERS (Using hex colors directly correctly) ---

    if (view === 'LOGIN') {
        return (
            <div className="w-full max-w-md bg-[#202225] p-8 rounded-lg shadow-xl relative z-50 mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center text-[#7289da]">Impostor</h1>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-[#b9bbbe] uppercase mb-2">Nick</label>
                        <input className="w-full bg-[#2f3136] p-3 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#7289da]"
                            value={name} onChange={e => setName(e.target.value)} placeholder="Twoja nazwa" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#b9bbbe] uppercase mb-2">Kod Pokoju</label>
                        <input className="w-full bg-[#2f3136] p-3 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#7289da]"
                            value={roomCodeInput} onChange={e => setRoomCodeInput(e.target.value)} placeholder="Zostaw puste by utworzyć nowy" />
                    </div>
                    <button onClick={joinGame} className="w-full bg-[#7289da] hover:bg-blue-600 text-white font-bold py-3 rounded transition duration-200">
                        Dołącz do Gry
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'LOBBY') {
        return (
            <div className="w-full max-w-md bg-[#202225] p-8 rounded-lg shadow-xl relative z-50 mx-auto">
                <h2 className="text-2xl font-bold mb-2 text-center text-white">Lobby: <span className="text-[#7289da] select-all">{roomCode}</span></h2>
                <p className="text-center text-[#b9bbbe] text-sm mb-6">Oczekiwanie na graczy...</p>

                <div className="bg-[#2f3136] p-4 rounded mb-6 min-h-[150px]">
                    <h3 className="text-xs font-bold text-[#b9bbbe] uppercase mb-3">Gracze</h3>
                    <ul className="space-y-2">
                        {players.map(p => (
                            <li key={p.id} className="bg-[#36393f] p-2 rounded flex justify-between items-center text-white">
                                <span className="font-semibold">{p.name}</span>
                                {p.isHost && <span className="text-xs bg-[#7289da] px-1 rounded text-white uppercase ml-2">Host</span>}
                            </li>
                        ))}
                    </ul>
                </div>

                {isHost ? (
                    <div className="space-y-4 border-t border-[#36393f] pt-4">
                        <h3 className="text-xs font-bold text-[#b9bbbe] uppercase mb-2">Panel Hosta</h3>
                        <div className="flex space-x-2 mb-4">
                            <button onClick={() => setMode('A')} className={`flex-1 py-2 rounded text-sm font-semibold transition ring-2 ${mode === 'A' ? 'bg-[#2f3136] ring-[#7289da] text-white' : 'bg-[#2f3136] text-[#b9bbbe]'}`}>
                                Tryb A (Losowy)
                            </button>
                            <button onClick={() => setMode('B')} className={`flex-1 py-2 rounded text-sm font-semibold transition ring-2 ${mode === 'B' ? 'bg-[#2f3136] ring-[#7289da] text-white' : 'bg-[#2f3136] text-[#b9bbbe]'}`}>
                                Tryb B (Własny)
                            </button>
                        </div>
                        {mode === 'B' && (
                            <div>
                                <label className="block text-xs font-bold text-[#b9bbbe] uppercase mb-2">Sekretne Słowo</label>
                                <input className="w-full bg-[#2f3136] p-3 rounded text-white focus:outline-none focus:ring-2 focus:ring-[#7289da]"
                                    value={customWord} onChange={e => setCustomWord(e.target.value)} placeholder="Wpisz słowo..." />
                            </div>
                        )}
                        <button onClick={startGame} className="w-full bg-[#43b581] hover:bg-green-600 text-white font-bold py-3 rounded transition duration-200">
                            Start Gry
                        </button>
                    </div>
                ) : (
                    <div className="text-center text-[#b9bbbe] italic">Czekam na hosta...</div>
                )}
            </div>
        );
    }

    if (view === 'GAME') {
        return (
            <div className="w-full max-w-md bg-[#202225] p-8 rounded-lg shadow-xl text-center relative z-50 mx-auto">
                <h2 className="text-2xl font-bold mb-6 text-white">Przydzielono Rolę</h2>

                <div className="relative bg-[#2f3136] p-8 rounded-lg mb-8 cursor-pointer group" onClick={() => setCardRevealed(!cardRevealed)}>
                    {!cardRevealed ? (
                        <div className="bg-[#2f3136] rounded-lg flex items-center justify-center border-2 border-dashed border-[#b9bbbe] h-32">
                            <span className="text-[#b9bbbe] font-bold uppercase tracking-wider group-hover:text-white transition">Kliknij by odkryć</span>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {role === 'impostor' ? (
                                <>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide text-[#f04747]">Jesteś IMPOSTOREM</h3>
                                    <p className="text-lg text-[#b9bbbe]">Wtop się w tłum. Odgadnij sekretne słowo!</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold mb-2 uppercase tracking-wide text-[#7289da]">Jesteś ZAŁOGANTEM</h3>
                                    <p className="text-lg text-[#b9bbbe]">Sekretne słowo to:</p>
                                    <span className="text-2xl font-bold text-white block mt-2">{secretWord}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <button onClick={callMeeting} className="w-full bg-[#f04747] hover:bg-red-600 text-white font-bold py-3 rounded transition duration-200 uppercase tracking-wide">
                    Zwołaj Zebranie
                </button>
            </div>
        );
    }

    if (view === 'VOTING') {
        const myVote = voteCounts.details?.[myId];
        return (
            <div className="w-full max-w-md bg-[#202225] p-8 rounded-lg shadow-xl relative z-50 mx-auto">
                <h2 className="text-2xl font-bold mb-2 text-center text-white">Nadzwyczajne Zebranie!</h2>
                <p className="text-center text-[#f04747] font-bold text-sm mb-6 animate-pulse">GŁOSOWANIE TRWA</p>

                <div className="bg-[#2f3136] p-4 rounded mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-bold text-[#b9bbbe] uppercase">Kto jest Impostorem?</h3>
                        <span className="text-xs font-bold text-[#7289da]">{voteCounts.total}/{voteCounts.required} głosów</span>
                    </div>
                    <div className="space-y-2">
                        {players.map(p => {
                            const votesReceived = Object.values(voteCounts.details || {}).filter(id => id === p.id).length;

                            return (
                                <div key={p.id} className="flex justify-between items-center bg-[#36393f] p-3 rounded hover:bg-opacity-80 transition text-white">
                                    <span className="font-bold">{p.name} {votesReceived > 0 ? '🗳️' : ''}</span>
                                    {!myVote ? (
                                        <button onClick={() => castVote(p.id)} className="bg-[#f04747] hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded uppercase">
                                            Głosuj
                                        </button>
                                    ) : (
                                        myVote === p.id && <span className="text-xs text-[#f04747] font-bold uppercase">Twój głos</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p className="text-center text-[#b9bbbe] text-xs">Przedyskutujcie i zagłosujcie.</p>
            </div>
        );
    }

    if (view === 'RESULTS') {
        return (
            <div className="w-full max-w-md bg-[#202225] p-8 rounded-lg shadow-xl text-center relative z-50 mx-auto">
                <h2 className="text-3xl font-bold mb-4 text-white">
                    {lastResult?.result === 'CREW_WIN' ?
                        <span className="text-[#43b581]">Załoga Wygrywa!</span> :
                        <span className="text-[#f04747]">Impostor Wygrywa!</span>
                    }
                </h2>

                <div className="bg-[#2f3136] p-6 rounded mb-8 space-y-4">
                    <div>
                        <p className="text-xs font-bold text-[#b9bbbe] uppercase">Sekretne Słowo</p>
                        <p className="text-xl text-[#7289da] font-bold">{lastResult?.secretWord}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#b9bbbe] uppercase">Impostorem Był</p>
                        <p className="text-xl text-[#f04747] font-bold">{lastResult?.impostorName || "Nieznany"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#b9bbbe] uppercase">Wyrzucony</p>
                        <p className="text-lg text-white">{lastResult?.ejectedName ? `${lastResult?.ejectedName} został wyrzucony` : "Nikt nie został wyrzucony."}</p>
                    </div>
                </div>

                {isHost && (
                    <button onClick={playAgain} className="w-full bg-[#7289da] hover:bg-blue-600 text-white font-bold py-3 rounded transition duration-200">
                        Powrót do Lobby
                    </button>
                )}
            </div>
        );
    }

    return null;
}
