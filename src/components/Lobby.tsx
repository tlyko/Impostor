'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, set, get, child } from 'firebase/database';

const Lobby: React.FC = () => {
    const router = useRouter();
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    const createRoom = async () => {
        if (!name.trim()) return setError('Proszę podać imię.');

        // Generate a random 4-letter room code
        const newRoomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        const playerId = Math.random().toString(36).substring(2, 10);

        // Save to localStorage so we know who we are
        localStorage.setItem('impostor_playerId', playerId);
        localStorage.setItem('impostor_name', name);

        // Initialize room in Firebase
        await set(ref(db, `rooms/${newRoomCode}`), {
            status: 'LOBBY',
            word: '', // Set later
            impostorId: '', // Set later
            players: {
                [playerId]: {
                    name,
                    isHost: true,
                    votes: 0
                }
            }
        });

        router.push(`/game/${newRoomCode}`);
    };

    const joinRoom = async () => {
        if (!name.trim()) return setError('Proszę podać imię.');
        if (!roomCode.trim()) return setError('Proszę podać kod pokoju.');

        const cleanRoomCode = roomCode.toUpperCase();
        const roomRef = ref(db);

        try {
            const snapshot = await get(child(roomRef, `rooms/${cleanRoomCode}`));
            if (snapshot.exists()) {
                const playerId = Math.random().toString(36).substring(2, 10);
                localStorage.setItem('impostor_playerId', playerId);
                localStorage.setItem('impostor_name', name);

                // Add player to room
                await set(ref(db, `rooms/${cleanRoomCode}/players/${playerId}`), {
                    name,
                    isHost: false,
                    votes: 0
                });

                router.push(`/game/${cleanRoomCode}`);
            } else {
                setError('Pokój nie istnieje.');
            }
        } catch (err) {
            setError('Błąd podczas dołączania do pokoju.');
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 text-white">
            <h1 className="text-4xl font-bold mb-8 tracking-wider drop-shadow-lg">IMPOSTOR</h1>

            {error && <p className="mb-4 text-red-400 bg-red-900/50 px-3 py-1 rounded">{error}</p>}

            <input
                type="text"
                placeholder="TWOJE IMIĘ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 mb-4 bg-black/40 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white transition"
            />

            <div className="w-full flex flex-col gap-4">
                <button
                    onClick={createRoom}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg font-bold tracking-widest uppercase transition transform hover:scale-105 shadow-lg"
                >
                    STWÓRZ POKÓJ
                </button>

                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="KOD"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        className="flex-1 p-4 bg-black/40 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white uppercase text-center tracking-widest"
                        maxLength={4}
                    />
                    <button
                        onClick={joinRoom}
                        className="flex-1 py-4 bg-white/20 hover:bg-white/30 rounded-lg font-bold tracking-widest uppercase transition"
                    >
                        DOŁĄCZ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Lobby;
