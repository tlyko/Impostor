const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

// API to list background images
app.get('/api/images', (req, res) => {
    const imagesDir = path.join(__dirname, 'public', 'images');
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to scan images' });
        }
        // Filter for images
        const images = files
            .filter(file => /\.(png|jpe?g|gif)$/i.test(file))
            .map(file => `images/${file}`);
        res.json(images);
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Game Constants
const LOCATIONS = [
    "Stacja Kosmiczna", "Łódź Podwodna", "Kino", "Szpital",
    "Szkoła", "Statek Piracki", "Supermarket", "Bank", "Cyrk", "Pociąg"
];

// State
const rooms = {};

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
                gameState: 'LOBBY', // LOBBY, GAME, VOTING, END
                secretWord: '',
                impostorId: null,
                votes: {},
                settings: { mode: 'A' }, // Default Mode A
                votingStatus: {} // Who voted for whom
            };
        }

        const room = rooms[roomCode];

        // Add player
        room.players.push({
            id: socket.id,
            name: name,
            isHost: socket.id === room.host,
            role: null, // 'crew' or 'impostor'
            isDead: false
        });

        // Notify everyone in room
        io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));

        // Send host status to this user
        socket.emit('playerInfo', {
            id: socket.id,
            isHost: socket.id === room.host
        });
    });

    // Start Game
    socket.on('startGame', ({ roomCode, mode, customWord }) => {
        const room = rooms[roomCode];
        if (!room || room.host !== socket.id) return;

        // Reset previous game state elements
        room.votes = {};
        room.votingStatus = {};

        // Logic for Mode
        room.settings.mode = mode;
        if (mode === 'A') {
            room.secretWord = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
        } else {
            room.secretWord = customWord || "Tajemnicze Miejsce";
        }

        // Select Impostor
        const playerIds = room.players.map(p => p.id);
        const impostorIndex = Math.floor(Math.random() * playerIds.length);
        room.impostorId = playerIds[impostorIndex];

        // Assign Roles
        room.players.forEach(p => {
            p.role = (p.id === room.impostorId) ? 'impostor' : 'crew';
            p.isDead = false; // Reset death status if needed for expanded rules, currently just game over
        });

        room.gameState = 'GAME';

        // Send individual role info
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
        room.votes = {}; // Reset votes for this session

        io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));
    });

    // Cast Vote
    socket.on('castVote', ({ roomCode, targetId }) => {
        const room = rooms[roomCode];
        if (!room || room.gameState !== 'VOTING') return;

        // Record vote
        room.votes[socket.id] = targetId;

        // Check if everyone voted
        if (Object.keys(room.votes).length === room.players.length) {
            processVotes(room);
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
        room.votingStatus = {};
        room.players.forEach(p => p.role = null);

        io.to(roomCode).emit('roomUpdate', getRoomPublicState(room));
    });

    // Handle Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Find room user was in
        for (const code in rooms) {
            const room = rooms[code];
            const playerIndex = room.players.findIndex(p => p.id === socket.id);

            if (playerIndex !== -1) {
                // Remove player
                room.players.splice(playerIndex, 1);

                // If room empty, delete
                if (room.players.length === 0) {
                    delete rooms[code];
                } else {
                    // Update host if host left
                    if (room.host === socket.id) {
                        room.host = room.players[0].id;
                        // Notify new host
                        io.to(room.host).emit('playerInfo', { id: room.host, isHost: true });
                    }
                    io.to(code).emit('roomUpdate', getRoomPublicState(room));
                }
                break;
            }
        }
    });
});

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
    const counts = {};
    if (room.gameState !== 'VOTING' && room.gameState !== 'END') return {};

    // In voting phase, we might want to hide exact counts until end, 
    // but request says "Real-time vote counting (e.g., "3/5 votes")"
    // We will send how many people voted basically, or who voted for whom if transparent.
    // Let's send a map of PlayerID -> Number of votes received (if we want that)
    // or just list who has voted. 
    // The requirement says "Real-time vote counting (e.g., "3/5 votes")" which usually implies 
    // knowing HOW MANY votes have been cast total vs total players.

    // However, "If a player gets majority votes -> Game Over" implies we check results.
    // "Shows a list of all players with 'Vote' buttons next to them".

    // Let's return just the number of votes CAST so far for the UI status
    const totalVotes = Object.keys(room.votes).length;
    const totalPlayers = room.players.length;
    return { total: totalVotes, required: totalPlayers, details: room.votes };
}

function processVotes(room) {
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

    // Logic: Majority required? Or just plurality?
    // Request: "If a player gets majority votes -> Game Over"
    // If 5 players, majority is 3. If 4 players, majority is 3.
    // Let's assume strict majority (> 50%).

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
        // No majority or tie - In Spyfall usually game continues for time limit, 
        // but here "Any player can trigger Call Meeting". 
        // If vote fails, we probably go back to discussion or game over?
        // Let's assume we go back to GAME to discuss more? Or maybe Impostor wins if no decision?
        // Let's go back to GAME for simplicty unless specified.
        // Actually, usually in these games if you vote wrong you lose.
        // BUT, if "nobody" receives majority, we might just resume.
        // Let's resume game if no majority.

        io.to(room.code).emit('voteResult', { success: false, message: "Brak większości głosów. Dyskusja trwa." });
        room.gameState = 'GAME';
        room.votes = {}; // Reset votes
    }

    io.to(room.code).emit('roomUpdate', getRoomPublicState(room));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
