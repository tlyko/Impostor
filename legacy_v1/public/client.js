const socket = io();

// State
let myId = null;
let isHost = false;
let currentMode = 'A';
let currentRoomCode = '';
let cardRevealed = false;

// Background Ambience
let bgImages = [];

async function fetchAndSpawnBackground() {
    try {
        const res = await fetch('/api/images');
        if (res.ok) {
            bgImages = await res.json();
        }
    } catch (e) {
        console.error("Failed to load images", e);
    }

    if (bgImages.length > 0) {
        spawnBackgroundImages();
    }
}

function spawnBackgroundImages() {
    const layer = document.getElementById('background-layer');
    // Spawn 40-60 random items for massive coverage
    const count = Math.floor(Math.random() * 21) + 40;

    for (let i = 0; i < count; i++) {
        const imgPath = bgImages[Math.floor(Math.random() * bgImages.length)];
        const img = document.createElement('img');
        img.src = imgPath;

        // Random massive styles
        const size = Math.floor(Math.random() * 500) + 500; // 500-1000px
        const top = Math.floor(Math.random() * 140) - 20; // -20% to 120%
        const left = Math.floor(Math.random() * 140) - 20; // -20% to 120%
        const rotate = Math.floor(Math.random() * 180) - 90; // -90 to 90 deg
        const opacity = 1; // Fully visible as requested

        img.style.position = 'absolute';
        img.style.width = `${size}px`;
        img.style.top = `${top}%`;
        img.style.left = `${left}%`;
        img.style.transform = `translate(-50%, -50%) rotate(${rotate}deg)`;
        img.style.opacity = opacity;
        // No filters for full clarity
        img.className = "rounded shadow-2xl border-4 border-white border-opacity-5";

        layer.appendChild(img);
    }
}

// Initialize Background
window.addEventListener('load', fetchAndSpawnBackground);

// DOM Elements
const screens = {
    login: document.getElementById('screen-login'),
    lobby: document.getElementById('screen-lobby'),
    game: document.getElementById('screen-game'),
    voting: document.getElementById('screen-voting'),
    results: document.getElementById('screen-results')
};

const inputs = {
    name: document.getElementById('input-name'),
    room: document.getElementById('input-room'),
    customWord: document.getElementById('input-custom-word')
};

const btns = {
    join: document.getElementById('btn-join'),
    modeA: document.getElementById('mode-a-btn'),
    modeB: document.getElementById('mode-b-btn'),
    start: document.getElementById('btn-start'),
    reveal: document.getElementById('card-reveal'),
    callMeeting: document.getElementById('btn-call-meeting'),
    lobbyReturn: document.getElementById('btn-lobby')
};

// UI Helpers
function showScreen(screenName) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

// Join Game
btns.join.addEventListener('click', () => {
    const name = inputs.name.value.trim();
    let roomCode = inputs.room.value.trim();

    if (!name) return alert("Proszę wpisać nazwę");
    if (!roomCode) {
        roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    currentRoomCode = roomCode;
    socket.emit('joinRoom', { name, roomCode });
});

// Socket Events
socket.on('playerInfo', (info) => {
    myId = info.id;
    isHost = info.isHost;

    // Update Host UI
    if (isHost) {
        document.getElementById('host-controls').classList.remove('hidden');
        document.getElementById('waiting-msg').classList.add('hidden');
    } else {
        document.getElementById('host-controls').classList.add('hidden');
        document.getElementById('waiting-msg').classList.remove('hidden');
    }
});

socket.on('roomUpdate', (room) => {
    if (room.gameState === 'LOBBY') {
        showScreen('lobby');
        document.getElementById('lobby-code').innerText = room.code;

        const listContainer = document.getElementById('lobby-list');
        listContainer.innerHTML = '';
        room.players.forEach(p => {
            const li = document.createElement('li');
            li.className = "bg-discord-bg p-2 rounded flex justify-between items-center";
            li.innerHTML = `<span class="font-semibold text-white">${p.name}</span> ${p.isHost ? '<span class="text-xs bg-discord-accent px-1 rounded text-white uppercase ml-2">Host</span>' : ''}`;
            listContainer.appendChild(li);
        });

    } else if (room.gameState === 'GAME') {
        showScreen('game');
    } else if (room.gameState === 'VOTING') {
        showScreen('voting');
        updateVotingUI(room);
    }
});

socket.on('gameStarted', (data) => {
    showScreen('game');
    const roleTitle = document.getElementById('role-title');
    const roleDesc = document.getElementById('role-desc');

    // Reset Reveal State
    cardRevealed = false;
    document.getElementById('card-hidden').classList.remove('hidden');
    document.getElementById('card-content').classList.add('hidden');
    document.getElementById('card-content').classList.remove('opacity-100');

    if (data.role === 'impostor') {
        roleTitle.innerText = "Jesteś IMPOSTOREM";
        roleTitle.className = "text-xl font-bold mb-2 uppercase tracking-wide text-discord-red";
        roleDesc.innerText = "Wtop się w tłum. Odgadnij sekretne słowo!";
    } else {
        roleTitle.innerText = "Jesteś ZAŁOGANTEM";
        roleTitle.className = "text-xl font-bold mb-2 uppercase tracking-wide text-discord-accent";
        roleDesc.innerHTML = `Sekretne słowo to: <br><span class="text-2xl font-bold text-white block mt-2">${data.secretWord}</span>`;
    }
});

socket.on('voteResult', (res) => {
    if (!res.success) {
        alert(res.message);
    }
});

socket.on('gameEnd', (res) => {
    showScreen('results');
    const title = document.getElementById('result-title');

    if (res.result === 'CREW_WIN') {
        title.innerHTML = '<span class="text-discord-green">Załoga Wygrywa!</span>';
    } else {
        title.innerHTML = '<span class="text-discord-red">Impostor Wygrywa!</span>';
    }

    document.getElementById('result-word').innerText = res.secretWord;
    document.getElementById('result-impostor').innerText = res.impostorName || "Nieznany";
    document.getElementById('result-ejected').innerText = res.ejectedName ? `${res.ejectedName} został wyrzucony` : "Nikt nie został wyrzucony.";

    // Only host can restart
    btns.lobbyReturn.style.display = isHost ? 'block' : 'none';
});

// Host Controls
btns.modeA.addEventListener('click', () => {
    currentMode = 'A';
    btns.modeA.classList.add('ring-2', 'ring-discord-accent', 'text-white');
    btns.modeA.classList.remove('text-discord-gray');

    btns.modeB.classList.remove('ring-2', 'ring-discord-accent', 'text-white');
    btns.modeB.classList.add('text-discord-gray');

    document.getElementById('custom-word-area').classList.add('hidden');
});

btns.modeB.addEventListener('click', () => {
    currentMode = 'B';
    btns.modeB.classList.add('ring-2', 'ring-discord-accent', 'text-white');
    btns.modeB.classList.remove('text-discord-gray');

    btns.modeA.classList.remove('ring-2', 'ring-discord-accent', 'text-white');
    btns.modeA.classList.add('text-discord-gray');

    document.getElementById('custom-word-area').classList.remove('hidden');
});

btns.start.addEventListener('click', () => {
    const customWord = inputs.customWord.value.trim();
    if (currentMode === 'B' && !customWord) return alert("Proszę wpisać sekretne słowo!");

    socket.emit('startGame', {
        roomCode: currentRoomCode,
        mode: currentMode,
        customWord: customWord
    });
});

// Game Interaction
btns.reveal.addEventListener('click', () => {
    cardRevealed = !cardRevealed;
    const hidden = document.getElementById('card-hidden');
    const content = document.getElementById('card-content');

    if (cardRevealed) {
        hidden.classList.add('hidden');
        content.classList.remove('hidden');
        // Small delay for fade in
        setTimeout(() => content.classList.add('opacity-100'), 10);
    } else {
        content.classList.remove('opacity-100');
        setTimeout(() => {
            content.classList.add('hidden');
            hidden.classList.remove('hidden');
        }, 300);
    }
});

btns.callMeeting.addEventListener('click', () => {
    if (confirm("Zwołać nadzwyczajne zebranie?")) {
        socket.emit('callMeeting', { roomCode: currentRoomCode });
    }
});

btns.lobbyReturn.addEventListener('click', () => {
    socket.emit('playAgain', { roomCode: currentRoomCode });
});

// Voting Logic
function updateVotingUI(room) {
    const list = document.getElementById('voting-list');
    list.innerHTML = '';

    const countSpan = document.getElementById('vote-count');
    countSpan.innerText = `${room.voteCounts.total}/${room.voteCounts.required} głosów`;

    room.players.forEach(p => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center bg-discord-bg p-3 rounded hover:bg-opacity-80 transition";

        // Check if I already voted
        const myVote = room.voteCounts.details[myId]; // my vote target
        const hasVoted = Boolean(myVote);

        div.innerHTML = `
            <span class="font-bold text-white">${p.name} ${Object.values(room.voteCounts.details || {}).filter(id => id === p.id).length > 0 ? '🗳️' : ''}</span> 
        `; // Note: In a real game you might not show votes, but here we can show total received if we want, or just who voted.
        // Requirement: "Shows a list of all players with 'Vote' buttons next to them."
        // "Real-time vote counting (e.g., '3/5 votes')" refers to TOTAL votes usually.

        if (!hasVoted) {
            const btn = document.createElement('button');
            btn.className = "bg-discord-red hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded uppercase";
            btn.innerText = "Głosuj";
            btn.onclick = () => {
                socket.emit('castVote', { roomCode: currentRoomCode, targetId: p.id });
            };
            div.appendChild(btn);
        } else {
            if (myVote === p.id) {
                const badge = document.createElement('span');
                badge.className = "text-xs text-discord-red font-bold uppercase";
                badge.innerText = "Twój głos";
                div.appendChild(badge);
            }
        }

        list.appendChild(div);
    });
}
