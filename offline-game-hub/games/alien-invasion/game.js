const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = Math.min(window.innerWidth - 40, 600);
canvas.height = 500;

let gameActive = false;
let score = 0;
let lives = 3;
let frame = 0;

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    w: 50,
    h: 30,
    color: '#3fb950',
    speed: 5
};

let bullets = [];
let aliens = [];
let alienDirection = 1;
let alienSpeed = 1;

function initAliens() {
    aliens = [];
    const rows = 4;
    const cols = 8;
    const spacing = 40;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            aliens.push({
                x: c * (spacing + 20) + 50,
                y: r * (spacing + 10) + 50,
                w: 30, h: 20,
                hp: 1,
                color: `hsl(${120 - r * 20}, 70%, 50%)`
            });
        }
    }
}

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameActive) shoot();
});
window.addEventListener('keyup', e => keys[e.code] = false);

function shoot() {
    if (bullets.length < 5) {
        bullets.push({ x: player.x + player.w/2, y: player.y, v: -7, r: 3 });
    }
}

function update() {
    if (!gameActive) return;

    frame++;

    // Player movement
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > 0) player.x -= player.speed;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - player.w) player.x += player.speed;

    // Bullets
    bullets.forEach((b, i) => {
        b.y += b.v;
        if (b.y < 0) bullets.splice(i, 1);
    });

    // Aliens
    let hitWall = false;
    aliens.forEach(a => {
        a.x += alienDirection * alienSpeed;
        if (a.x + a.w > canvas.width || a.x < 0) hitWall = true;

        // Collision with bullets
        bullets.forEach((b, bi) => {
            if (b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h) {
                score += 10;
                bullets.splice(bi, 1);
                aliens.splice(aliens.indexOf(a), 1);
            }
        });

        // Landed check
        if (a.y + a.h > player.y) endGame();
    });

    if (hitWall) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 20);
        alienSpeed += 0.1;
    }

    if (aliens.length === 0) {
        alienSpeed += 0.5;
        initAliens();
    }

    document.getElementById('score').innerText = score;
    document.getElementById('alien-count').innerText = aliens.length;

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillRect(player.x + player.w/2 - 5, player.y - 10, 10, 10);

    // Bullets
    ctx.fillStyle = '#fff';
    bullets.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    });

    // Aliens
    aliens.forEach(a => {
        ctx.fillStyle = a.color;
        ctx.fillRect(a.x, a.y, a.w, a.h);
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(a.x + 5, a.y + 5, 5, 5);
        ctx.fillRect(a.x + 20, a.y + 5, 5, 5);
    });
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameActive) shoot();
});

function startGame() {
    gameActive = true;
    score = 0;
    lives = 3;
    alienSpeed = 1;
    bullets = [];
    initAliens();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Final Score: ${score}`;

    const best = parseInt(localStorage.getItem('highScore_aliens') || 0);
    if (score > best) localStorage.setItem('highScore_aliens', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
