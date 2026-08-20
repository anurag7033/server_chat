const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

canvas.width = Math.min(window.innerWidth - 40, 400);
canvas.height = 500;

let gameActive = false;
let score = 0;
let maxScore = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    w: 30, h: 30,
    vy: 0,
    jump: -12,
    gravity: 0.4,
    color: '#00f2ff'
};

let platforms = [];
const platformW = 60;
const platformH = 10;

function initPlatforms() {
    platforms = [];
    for (let i = 0; i < 8; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - platformW),
            y: canvas.height - (i * 70) - 50
        });
    }
}

function update() {
    if (!gameActive) return;

    player.vy += player.gravity;
    player.y += player.vy;

    // Camera following player upwards
    if (player.y < canvas.height / 2) {
        let diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        score += Math.floor(diff / 10);
        scoreEl.innerText = score;

        platforms.forEach(p => {
            p.y += diff;
            if (p.y > canvas.height) {
                p.y = 0;
                p.x = Math.random() * (canvas.width - platformW);
            }
        });
    }

    // Platform collision
    if (player.vy > 0) {
        platforms.forEach(p => {
            if (player.x + player.w > p.x && player.x < p.x + platformW &&
                player.y + player.h > p.y && player.y + player.h < p.y + platformH + player.vy) {
                player.vy = player.jump;
                player.y = p.y - player.h;
            }
        });
    }

    // Wraparound
    if (player.x > canvas.width) player.x = -player.w;
    if (player.x < -player.w) player.x = canvas.width;

    // Death
    if (player.y > canvas.height) endGame();

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Platforms
    ctx.fillStyle = '#3fb950';
    ctx.shadowBlur = 5; ctx.shadowColor = '#3fb950';
    platforms.forEach(p => {
        ctx.fillRect(p.x, p.y, platformW, platformH);
    });
    ctx.shadowBlur = 0;

    // Player
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 10; ctx.shadowColor = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;
}

// Controls
const handleMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = canvas.getBoundingClientRect();
    player.x = x - rect.left - player.w / 2;
};
window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove);

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') player.x -= 20;
    if (e.key === 'ArrowRight') player.x += 20;
});

function startGame() {
    gameActive = true;
    score = 0;
    scoreEl.innerText = '0';
    player.x = canvas.width / 2;
    player.y = canvas.height - 100;
    player.vy = player.jump;
    initPlatforms();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    const high = localStorage.getItem('highScore_jump') || 0;
    highEl.innerText = `Best: ${high}`;

    update();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = `Score: ${score}`;

    const best = parseInt(localStorage.getItem('highScore_jump') || 0);
    if (score > best) localStorage.setItem('highScore_jump', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

const high = localStorage.getItem('highScore_jump') || 0;
highEl.innerText = `Best: ${high}`;
draw();
