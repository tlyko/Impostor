const { Server } = require("socket.io");

// Game Constants
const LOCATIONS = [
    "Stacja Kosmiczna", "Łódź Podwodna", "Kino", "Szpital",
    "Szkoła", "Statek Piracki", "Supermarket", "Bank", "Cyrk", "Pociąg"
];

// State - In-memory (Note: resets on server restart/redeploy)
let rooms = {};

// Helper: Public state
function getRoomPublicState(room) {
    return {
        code: room.code,
        players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            isHost: p.id === room.host,
            // Don't leak role here
        })),
        gameState: room.gameState,
        voteCounts: countVotes(room)
    };
}

function countVotes(room) {
    if (room.gameState !== 'VOTING' && room.gameState !== 'END') return {};
    const totalVotes = Object.keys(room.votes).length;
    const totalPlayers = room.players.length;
    return { total: totalVotes, required: totalPlayers, details: room.votes };
}

function processVotes(io, room) {
    const voteTallies = {};
    Object.values(room.votes).forEach(targetId => {
        voteTallies[targetId] = (voteTallies[targetId] || 0) + 1;
    });

    let maxVotes = 0;
    let candidate = null;

    for (const [target, count] of Object.entries(voteTallies)) {
        if (count > maxVotes) {
            maxVotes = count;
            candidate = target;
        } else if (count === maxVotes) {
            candidate = null; // Tie
        }
    }

    const majority = Math.floor(room.players.length / 2) + 1;

    if (candidate && maxVotes >= majority) {
        // Ejected!
        const ejectedPlayer = room.players.find(p => p.id === candidate);
        const isImpostor = (candidate === room.impostorId);

        io.to(room.code).emit('gameEnd', {
            result: isImpostor ? 'CREW_WIN' : 'IMPOSTOR_WIN',
            impostorName: room.players.find(p => p.id === room.impostorId)?.name,
            secretWord: room.secretWord,
            ejectedName: ejectedPlayer?.name
        });
        room.gameState = 'END';
    } else {
        io.to(room.code).emit('voteResult', { success: false, message: "Brak większości głosów. Dyskusja trwa." });
        room.gameState = 'GAME';
        room.votes = {}; // Reset votes
    }

    io.to(room.code).emit('roomUpdate', getRoomPublicState(room));
}

function socketHandler(io) {
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Join Room
        socket.on('joinRoom', ({ name, roomCode }) => {
            roomCode = roomCode.toUpperCase();
            socket.join(roomCode);

            if (!rooms[roomCode]) {
                rooms[roomCode] = {
                    code: roomCode,
                    host: socket.id,
                    players: [],
                    gameState: 'LOBBY',
                    secretWord: '',
                    impostorId: null,
                    votes: {},
                    settings: { mode: 'A' },
                    votingStatus: {}
                };
            }

            const room = rooms[roomCode];
            room.players.push({
                id: socket.id,
                name: name,
                isHost: socket.id === room.host,
                role: null,
                isDead: false
            });

            io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));

            socket.emit('playerInfo', {
                id: socket.id,
                isHost: socket.id === room.host
            });
        });

        // Start Game
        socket.on('startGame', ({ roomCode, mode, customWord }) => {
            const room = rooms[roomCode];
            if (!room || room.host !== socket.id) return;

            room.votes = {};
            room.settings.mode = mode;
            if (mode === 'A') {
                room.secretWord = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
            } else {
                room.secretWord = customWord || "Tajemnicze Miejsce";
            }

            const playerIds = room.players.map(p => p.id);
            const impostorIndex = Math.floor(Math.random() * playerIds.length);
            room.impostorId = playerIds[impostorIndex];

            room.players.forEach(p => {
                p.role = (p.id === room.impostorId) ? 'impostor' : 'crew';
                p.isDead = false;
            });

            room.gameState = 'GAME';

            room.players.forEach(p => {
                io.to(p.id).emit('gameStarted', {
                    role: p.role,
                    secretWord: (p.role === 'impostor') ? null : room.secretWord
                });
            });

            io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));
        });

        // Call Meeting
        socket.on('callMeeting', ({ roomCode }) => {
            const room = rooms[roomCode];
            if (!room) return;
            room.gameState = 'VOTING';
            room.votes = {};
            io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));
        });

        // Cast Vote
        socket.on('castVote', ({ roomCode, targetId }) => {
            const room = rooms[roomCode];
            if (!room || room.gameState !== 'VOTING') return;

            room.votes[socket.id] = targetId;

            if (Object.keys(room.votes).length === room.players.length) {
                processVotes(io, room);
            } else {
                io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));
            }
        });

        // Play Again
        socket.on('playAgain', ({ roomCode }) => {
            const room = rooms[roomCode];
            if (!room || room.host !== socket.id) return;

            room.gameState = 'LOBBY';
            room.secretWord = '';
            room.impostorId = null;
            room.votes = {};
            room.players.forEach(p => p.role = null);

            io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));
        });

        // Disconnect
        socket.on('disconnect', () => {
            for (const code in rooms) {
                const room = rooms[code];
                const playerIndex = room.players.findIndex(p => p.id === socket.id);

                if (playerIndex !== -1) {
                    room.players.splice(playerIndex, 1);
                    if (room.players.length === 0) {
                        delete rooms[code];
                    } else {
                        if (room.host === socket.id) {
                            room.host = room.players[0].id;
                            io.to(room.host).emit('playerInfo', { id: room.host, isHost: true });
                        }
                        io.to(code).emit('roomUpdate', getRoomPublicState(room));
                    }
                    break;
                }
            }
        });
    });
}

module.exports = socketHandler;
