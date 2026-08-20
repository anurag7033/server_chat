const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let gameActive = false;
let score = 0;
let health = 100;
let frame = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 20,
    angle: 0,
    speed: 4
};

let bullets = [];
let zombies = [];
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
    if (gameActive) shoot();
});

function shoot() {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    bullets.push({
        x: player.x + Math.cos(angle) * 30,
        y: player.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        r: 5
    });
}

function spawnZombie() {
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -50 : canvas.width + 50;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? -50 : canvas.height + 50;
    }

    zombies.push({
        x, y,
        r: 20,
        speed: 1 + Math.random() * 2,
        hp: 2,
        color: '#3fb950'
    });
}

function update() {
    if (!gameActive) return;

    frame++;

    // Player Movement
    if (keys['KeyW'] && player.y > 0) player.y -= player.speed;
    if (keys['KeyS'] && player.y < canvas.height) player.y += player.speed;
    if (keys['KeyA'] && player.x > 0) player.x -= player.speed;
    if (keys['KeyD'] && player.x < canvas.width) player.x += player.speed;

    // Angle to mouse
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Bullets
    bullets.forEach((b, i) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    });

    // Zombies
    if (frame % Math.max(20, 60 - Math.floor(score/5)) === 0) spawnZombie();

    zombies.forEach((z, zi) => {
        const angle = Math.atan2(player.y - z.y, player.x - z.x);
        z.x += Math.cos(angle) * z.speed;
        z.y += Math.sin(angle) * z.speed;

        // Player Collision
        const dist = Math.hypot(player.x - z.x, player.y - z.y);
        if (dist < player.r + z.r) {
            health -= 0.5;
            if (health <= 0) endGame();
        }

        // Bullet Collision
        bullets.forEach((b, bi) => {
            const bDist = Math.hypot(b.x - z.x, b.y - z.y);
            if (bDist < b.r + z.r) {
                z.hp--;
                bullets.splice(bi, 1);
                if (z.hp <= 0) {
                    zombies.splice(zi, 1);
                    score++;
                    createBlood(z.x, z.y);
                }
            }
        });
    });

    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });

    document.getElementById('score').innerText = `Kills: ${score}`;
    document.getElementById('health-bar').style.width = `${health}%`;

    draw();
    requestAnimationFrame(update);
}

function createBlood(x, y) {
    for(let i=0; i<8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1,
            color: '#f85149'
        });
    }
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#00f2ff';
    ctx.fillRect(-20, -20, 40, 40);
    // Gun
    ctx.fillStyle = '#fff';
    ctx.fillRect(15, -5, 20, 10);
    ctx.restore();

    // Bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
    });

    // Zombies
    zombies.forEach(z => {
        ctx.fillStyle = z.color;
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(z.x + 5, z.y - 5, 4, 4);
        ctx.fillRect(z.x + 5, z.y + 1, 4, 4);
    });
}

function startGame() {
    gameActive = true; score = 0; health = 100;
    bullets = []; zombies = []; particles = [];
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Kills: ${score}`;

    const best = localStorage.getItem('highScore_zombie-shooter') || 0;
    if (score > best) localStorage.setItem('highScore_zombie-shooter', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
draw();
