const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameActive = false;
let startTime = 0;
let survivedTime = 0;
let hp = 100;
let hunger = 100;
let ammo = 30;
let dayCount = 1;
let frame = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 15,
    angle: 0,
    speed: 3
};

let bullets = [];
let zombies = [];
let items = [];
let particles = [];

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

let mouse = { x: 0, y: 0 };
window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', () => {
    if (gameActive && ammo > 0) shoot();
});

function shoot() {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    bullets.push({
        x: player.x + Math.cos(angle) * 20,
        y: player.y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        r: 4
    });
    ammo--;
    document.getElementById('ammo-count').innerText = ammo;
}

function spawnZombie() {
    // Distance from player logic
    let x, y;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { x = -50; y = Math.random() * canvas.height; }
    else if (side === 1) { x = canvas.width + 50; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = -50; }
    else { x = Math.random() * canvas.width; y = canvas.height + 50; }

    const isNight = (frame % 2400) > 1200;
    zombies.push({
        x, y,
        r: 15,
        speed: (isNight ? 2 : 1) + Math.random(),
        hp: isNight ? 3 : 2,
        color: isNight ? '#da3633' : '#3fb950'
    });
}

function spawnItem() {
    const types = [
        { type: 'food', color: '#d29922', label: '🍗' },
        { type: 'meds', color: '#f85149', label: '💊' },
        { type: 'ammo', color: '#00f2ff', label: '📦' }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    items.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        ...type
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    survivedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('timer').innerText = `SURVIVED: ${survivedTime}s`;

    // Hunger logic
    if (frame % 60 === 0) {
        hunger -= 0.5;
        if (hunger <= 0) {
            hunger = 0;
            hp -= 0.5;
        }
    }

    // Day/Night and Stats
    const cyclePos = frame % 2400;
    dayCount = Math.floor(frame / 2400) + 1;
    document.getElementById('day-count').innerText = dayCount;
    document.getElementById('hp-bar').style.width = `${hp}%`;
    document.getElementById('hunger-bar').style.width = `${hunger}%`;

    if (hp <= 0) endGame();

    // Movement
    let vx = 0, vy = 0;
    if (keys['KeyW']) vy -= 1;
    if (keys['KeyS']) vy += 1;
    if (keys['KeyA']) vx -= 1;
    if (keys['KeyD']) vx += 1;

    if (vx !== 0 || vy !== 0) {
        const mag = Math.sqrt(vx * vx + vy * vy);
        player.x += (vx / mag) * player.speed;
        player.y += (vy / mag) * player.speed;
    }

    // Boundaries
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Items
    if (frame % 300 === 0 && items.length < 10) spawnItem();
    items.forEach((item, i) => {
        if (Math.hypot(player.x - item.x, player.y - item.y) < 30) {
            if (item.type === 'food') hunger = Math.min(100, hunger + 20);
            if (item.type === 'meds') hp = Math.min(100, hp + 20);
            if (item.type === 'ammo') {
                ammo += 15;
                document.getElementById('ammo-count').innerText = ammo;
            }
            items.splice(i, 1);
        }
    });

    // Bullets
    bullets.forEach((b, i) => {
        b.x += b.vx; b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    });

    // Zombies
    const spawnRate = Math.max(10, 60 - dayCount * 5);
    if (frame % spawnRate === 0) spawnZombie();

    zombies.forEach((z, zi) => {
        const angle = Math.atan2(player.y - z.y, player.x - z.x);
        z.x += Math.cos(angle) * z.speed;
        z.y += Math.sin(angle) * z.speed;

        // Player collision
        if (Math.hypot(player.x - z.x, player.y - z.y) < player.r + z.r) {
            hp -= 0.2;
        }

        // Bullet collision
        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - z.x, b.y - z.y) < b.r + z.r) {
                z.hp--;
                bullets.splice(bi, 1);
                if (z.hp <= 0) {
                    zombies.splice(zi, 1);
                    createParticles(z.x, z.y, z.color);
                }
            }
        });
    });

    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function createParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            color
        });
    }
}

function draw() {
    const isNight = (frame % 2400) > 1200;
    ctx.fillStyle = isNight ? '#050510' : '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Items
    ctx.font = '20px Arial';
    items.forEach(item => {
        ctx.fillText(item.label, item.x - 10, item.y + 10);
    });

    // Bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    });

    // Zombies
    zombies.forEach(z => {
        ctx.fillStyle = z.color;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
    });

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath(); ctx.arc(0, 0, player.r, 0, Math.PI * 2); ctx.fill();
    // Gun
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, -3, 15, 6);
    ctx.restore();

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;

    // Overlay for night
    if (isNight) {
        const gradient = ctx.createRadialGradient(player.x, player.y, 50, player.x, player.y, 300);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function startGame() {
    gameActive = true;
    startTime = Date.now();
    hp = 100; hunger = 100; ammo = 30; dayCount = 1; frame = 0;
    zombies = []; bullets = []; items = []; particles = [];
    document.getElementById('ammo-count').innerText = ammo;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-time').innerText = `Survived: ${survivedTime}s`;

    const best = parseInt(localStorage.getItem('highScore_zombie-survival') || 0);
    if (survivedTime > best) localStorage.setItem('highScore_zombie-survival', survivedTime);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
draw();
