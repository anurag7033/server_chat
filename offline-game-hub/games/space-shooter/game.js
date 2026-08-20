const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = Math.min(window.innerWidth, 500);
canvas.height = window.innerHeight - 80;

let gameActive = false;
let score = 0;
let lives = 3;
let frame = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    w: 40,
    h: 40,
    color: '#00f2ff'
};

let bullets = [];
let enemies = [];
let particles = [];
let stars = [];

// Init stars
for(let i=0; i<50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2 + 1
    });
}

// Mouse/Touch controls
const handleMove = (e) => {
    if (!gameActive) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = canvas.getBoundingClientRect();
    player.x = x - rect.left;
    // Keep in bounds
    if (player.x < player.w/2) player.x = player.w/2;
    if (player.x > canvas.width - player.w/2) player.x = canvas.width - player.w/2;
};
window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove);

function shoot() {
    bullets.push({ x: player.x, y: player.y - 20, v: -10, r: 4 });
}

function spawnEnemy() {
    const types = [
        { hp: 1, speed: 2, color: '#3fb950', score: 10 },
        { hp: 2, speed: 1.5, color: '#f85149', score: 25 },
        { hp: 1, speed: 4, color: '#d29922', score: 20 }
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    enemies.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -50,
        w: 30, h: 30,
        ...type
    });
}

function update() {
    if (!gameActive) return;

    frame++;

    // Stars
    stars.forEach(s => {
        s.y += s.s;
        if (s.y > canvas.height) s.y = 0;
    });

    // Auto shoot
    if (frame % 15 === 0) shoot();

    // Bullets
    bullets.forEach((b, i) => {
        b.y += b.v;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Enemies
    if (frame % Math.max(30, 60 - Math.floor(score/100)) === 0) spawnEnemy();

    enemies.forEach((e, ei) => {
        e.y += e.speed;

        // Collision with player
        if (Math.hypot(player.x - e.x, player.y - e.y) < 35) {
            lives--;
            enemies.splice(ei, 1);
            createExplosion(e.x, e.y, e.color);
            if (lives <= 0) endGame();
            updateLives();
        }

        // Collision with bullet
        bullets.forEach((b, bi) => {
            if (Math.hypot(b.x - e.x, b.y - e.y) < 20) {
                e.hp--;
                bullets.splice(bi, 1);
                if (e.hp <= 0) {
                    score += e.score;
                    createExplosion(e.x, e.y, e.color);
                    enemies.splice(ei, 1);
                    document.getElementById('score').innerText = `Score: ${score}`;
                }
            }
        });

        if (e.y > canvas.height) {
            enemies.splice(ei, 1);
            lives--;
            updateLives();
            if (lives <= 0) endGame();
        }
    });

    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function updateLives() {
    document.getElementById('lives').innerText = '❤️'.repeat(lives);
}

function createExplosion(x, y, color) {
    for(let i=0; i<10; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color
        });
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.s, s.s);
    });

    // Particles
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Player (Spaceship)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 25);
    ctx.lineTo(player.x - 20, player.y + 15);
    ctx.lineTo(player.x + 20, player.y + 15);
    ctx.fill();
    // Thruster glow
    ctx.fillStyle = '#f85149';
    ctx.fillRect(player.x - 5, player.y + 15, 10, 10 + Math.random() * 10);

    // Bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
    });

    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y + 20);
        ctx.lineTo(e.x - 15, e.y - 15);
        ctx.lineTo(e.x + 15, e.y - 15);
        ctx.fill();
    });
}

function startGame() {
    gameActive = true; score = 0; lives = 3;
    bullets = []; enemies = []; particles = [];
    updateLives();
    document.getElementById('score').innerText = 'Score: 0';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Score: ${score}`;

    const best = localStorage.getItem('highScore_space-shooter') || 0;
    if (score > best) localStorage.setItem('highScore_space-shooter', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
draw();
