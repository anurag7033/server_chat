const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;
const COLS = 15;
const ROWS = 10;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

let gameActive = false;
let level = 1;
let hp = 10;
let gold = 0;
let hasKey = false;

let map = [];
let player = { x: 1, y: 1 };
let enemies = [];
let items = [];

const TILES = {
    FLOOR: 0,
    WALL: 1,
    DOOR: 2,
    KEY: 3,
    GOLD: 4,
    TRAP: 5
};

const keys = {};
window.addEventListener('keydown', e => {
    if (!gameActive) return;
    const oldX = player.x;
    const oldY = player.y;

    if (e.code === 'ArrowUp' || e.code === 'KeyW') player.y--;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') player.y++;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') player.x--;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') player.x++;

    // Collision
    if (map[player.y][player.x] === TILES.WALL) {
        player.x = oldX; player.y = oldY;
    } else if (map[player.y][player.x] === TILES.DOOR) {
        if (hasKey) completeLevel();
        else { player.x = oldX; player.y = oldY; }
    } else {
        checkTile(player.x, player.y);
    }

    moveEnemies();
    draw();
});

function generateLevel() {
    map = Array(ROWS).fill().map(() => Array(COLS).fill(TILES.WALL));

    // Simple carver
    for(let y=1; y<ROWS-1; y++) {
        for(let x=1; x<COLS-1; x++) {
            if (Math.random() > 0.2) map[y][x] = TILES.FLOOR;
        }
    }

    player = { x: 1, y: 1 };
    map[1][1] = TILES.FLOOR;

    // Place Key
    let kx, ky;
    do { kx = Math.floor(Math.random()*(COLS-2))+1; ky = Math.floor(Math.random()*(ROWS-2))+1; }
    while (map[ky][kx] !== TILES.FLOOR);
    map[ky][kx] = TILES.KEY;

    // Place Door
    let dx, dy;
    do { dx = Math.floor(Math.random()*(COLS-2))+1; dy = Math.floor(Math.random()*(ROWS-2))+1; }
    while (map[dy][dx] !== TILES.FLOOR || (dx===kx && dy===ky));
    map[dy][dx] = TILES.DOOR;

    // Place Enemies
    enemies = [];
    for(let i=0; i<level+1; i++) {
        let ex, ey;
        do { ex = Math.floor(Math.random()*(COLS-2))+1; ey = Math.floor(Math.random()*(ROWS-2))+1; }
        while (map[ey][ex] !== TILES.FLOOR || (ex===1 && ey===1));
        enemies.push({ x: ex, y: ey, type: Math.random() > 0.7 ? 'STALKER' : 'PATROL' });
    }

    // Place Gold
    for(let i=0; i<5; i++) {
        let gx, gy;
        do { gx = Math.floor(Math.random()*(COLS-2))+1; gy = Math.floor(Math.random()*(ROWS-2))+1; }
        while (map[gy][gx] !== TILES.FLOOR);
        map[gy][gx] = TILES.GOLD;
    }

    hasKey = false;
    updateUI();
}

function checkTile(x, y) {
    if (map[y][x] === TILES.KEY) {
        hasKey = true;
        map[y][x] = TILES.FLOOR;
    } else if (map[y][x] === TILES.GOLD) {
        gold += 10;
        map[y][x] = TILES.FLOOR;
    } else if (map[y][x] === TILES.TRAP) {
        hp--;
        if (hp <= 0) endGame();
    }
    updateUI();
}

function moveEnemies() {
    enemies.forEach(e => {
        let dx = 0, dy = 0;
        if (e.type === 'STALKER') {
            if (player.x > e.x) dx = 1; else if (player.x < e.x) dx = -1;
            if (player.y > e.y) dy = 1; else if (player.y < e.y) dy = -1;
        } else {
            if (Math.random() > 0.5) dx = Math.random() > 0.5 ? 1 : -1;
            else dy = Math.random() > 0.5 ? 1 : -1;
        }

        const newX = e.x + dx;
        const newY = e.y + dy;

        if (map[newY] && map[newY][newX] !== TILES.WALL && map[newY][newX] !== TILES.DOOR) {
            e.x = newX; e.y = newY;
        }

        if (e.x === player.x && e.y === player.y) {
            hp -= 2;
            if (hp <= 0) endGame();
        }
    });
}

function updateUI() {
    document.getElementById('level').innerText = level;
    document.getElementById('hp').innerText = hp;
    document.getElementById('gold').innerText = gold;
    document.getElementById('has-key').innerText = hasKey ? 'YES' : 'NO';
    document.getElementById('has-key').style.color = hasKey ? '#00f2ff' : '#f85149';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let y=0; y<ROWS; y++) {
        for(let x=0; x<COLS; x++) {
            const t = map[y][x];
            if (t === TILES.WALL) ctx.fillStyle = '#21262d';
            else if (t === TILES.DOOR) ctx.fillStyle = hasKey ? '#3fb950' : '#8b949e';
            else if (t === TILES.KEY) ctx.fillStyle = '#f2cf66';
            else if (t === TILES.GOLD) ctx.fillStyle = '#f2cf66';
            else ctx.fillStyle = '#0d1117';

            ctx.fillRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#1a1a1a';
            ctx.strokeRect(x*TILE_SIZE, y*TILE_SIZE, TILE_SIZE, TILE_SIZE);

            if (t === TILES.KEY) ctx.fillText('🔑', x*TILE_SIZE+10, y*TILE_SIZE+25);
            if (t === TILES.DOOR) ctx.fillText('🚪', x*TILE_SIZE+10, y*TILE_SIZE+25);
            if (t === TILES.GOLD) ctx.fillText('💰', x*TILE_SIZE+10, y*TILE_SIZE+25);
        }
    }

    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = '#f85149';
        ctx.beginPath(); ctx.arc(e.x*TILE_SIZE+TILE_SIZE/2, e.y*TILE_SIZE+TILE_SIZE/2, 12, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText('😈', e.x*TILE_SIZE+8, e.y*TILE_SIZE+25);
    });

    // Player
    ctx.fillStyle = '#00f2ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
    ctx.beginPath(); ctx.arc(player.x*TILE_SIZE+TILE_SIZE/2, player.y*TILE_SIZE+TILE_SIZE/2, 15, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000'; ctx.fillText('🧙', player.x*TILE_SIZE+8, player.y*TILE_SIZE+25);
}

function startGame() {
    gameActive = true; level = 1; hp = 10; gold = 0;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    generateLevel();
    draw();
}

function completeLevel() {
    gameActive = false;
    document.getElementById('level-complete').classList.remove('hidden');
}

function nextLevel() {
    level++;
    hp = Math.min(10, hp + 2);
    document.getElementById('level-complete').classList.add('hidden');
    gameActive = true;
    generateLevel();
    draw();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-stats').innerText = `Reached Level: ${level} | Gold: ${gold}`;
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('next-level-btn').onclick = nextLevel;
document.getElementById('restart-btn').onclick = startGame;

ctx.font = '20px Arial';
generateLevel();
draw();
