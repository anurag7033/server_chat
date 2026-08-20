const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameActive = false;
let xp = 0;
let level = 1;
let hp = 100;
let frame = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 15,
    speed: 4,
    color: '#00f2ff'
};

let enemies = [];
let bullets = [];
let gems = [];
let particles = [];

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

let mouse = { x: canvas.width/2, y: canvas.height/2 };
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function spawnEnemy() {
    let x, y;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { x = -50; y = Math.random() * canvas.height; }
    else if (side === 1) { x = canvas.width + 50; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = -50; }
    else { x = Math.random() * canvas.width; y = canvas.height + 50; }

    enemies.push({
        x, y,
        r: 12 + Math.random() * 10,
        speed: 1 + Math.random() * 1.5,
        hp: 1 + Math.floor(level/2),
        color: '#f85149'
    });
}

function update() {
    if (!gameActive) return;

    frame++;

    // Movement
    let vx = 0, vy = 0;
    if (keys['KeyW']) vy -= 1;
    if (keys['KeyS']) vy += 1;
    if (keys['KeyA']) vx -= 1;
    if (keys['KeyD']) vx += 1;

    // Follow mouse if no keys
    if (vx === 0 && vy === 0) {
        const dx = mouse.x - player.x;
        const dy = mouse.y - player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            vx = dx / dist;
            vy = dy / dist;
        }
    }

    if (vx !== 0 || vy !== 0) {
        const mag = Math.sqrt(vx*vx + vy*vy);
        player.x += (vx/mag) * player.speed;
        player.y += (vy/mag) * player.speed;
    }

    // Auto Shoot
    if (frame % Math.max(5, 20 - level) === 0 && enemies.length > 0) {
        const target = enemies[0]; // Nearest logic could be added
        const angle = Math.atan2(target.y - player.y, target.x - player.x);
        bullets.push({
            x: player.x, y: player.y,
            vx: Math.cos(angle) * 10,
            vy: Math.sin(angle) * 10,
            r: 3
        });
    }

    // Bullets
    bullets.forEach((b, i) => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    });

    // Enemies
    if (frame % Math.max(10, 40 - level*2) === 0) spawnEnemy();
    enemies.forEach((e, ei) => {
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;

        // Player collision
        if (Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r) {
            hp -= 0.5;
            if (hp <= 0) endGame();
        }

        // Bullet collision
        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.r) {
                e.hp--;
                bullets.splice(bi, 1);
                if (e.hp <= 0) {
                    gems.push({ x: e.x, y: e.y, r: 5, color: '#7000ff' });
                    enemies.splice(ei, 1);
                }
            }
        });
    });

    // Gems
    gems.forEach((g, gi) => {
        const dist = Math.hypot(player.x - g.x, player.y - g.y);
        if (dist < 100) { // Magnet
            const angle = Math.atan2(player.y - g.y, player.x - g.x);
            g.x += Math.cos(angle) * 6;
            g.y += Math.sin(angle) * 6;
        }
        if (dist < player.r + g.r) {
            xp += 10;
            if (xp >= level * 100) { xp = 0; level++; }
            gems.splice(gi, 1);
        }
    });

    document.getElementById('xp').innerText = xp;
    document.getElementById('level').innerText = level;
    document.getElementById('hp-bar').style.width = hp + '%';

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars background
    ctx.fillStyle = '#fff';
    for(let i=0; i<20; i++) {
        const x = (frame + i*100) % canvas.width;
        const y = (i*50) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
    }

    // Gems
    gems.forEach(g => {
        ctx.fillStyle = g.color;
        ctx.shadowBlur = 10; ctx.shadowColor = g.color;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
    });

    // Enemies
    ctx.fillStyle = '#f85149';
    enemies.forEach(e => {
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();
    });

    // Player
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15; ctx.shadowColor = player.color;
    ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
}

function startGame() {
    gameActive = true;
    xp = 0; level = 1; hp = 100; enemies = []; bullets = []; gems = [];
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-stats').innerText = `Level Reached: ${level}`;
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
