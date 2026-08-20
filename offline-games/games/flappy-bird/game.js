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
let frame = 0;

const bird = {
    x: 50,
    y: 200,
    w: 30,
    h: 24,
    gravity: 0.25,
    velocity: 0,
    jump: -5
};

let pipes = [];
const pipeWidth = 50;
const pipeGap = 150;
const pipeSpeed = 2;

function spawnPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        passed: false
    });
}

function update() {
    if (!gameActive) return;

    frame++;

    // Bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    if (bird.y + bird.h > canvas.height || bird.y < 0) endGame();

    // Pipes
    if (frame % 100 === 0) spawnPipe();

    pipes.forEach((p, i) => {
        p.x -= pipeSpeed;

        // Collision
        if (bird.x + bird.w > p.x && bird.x < p.x + pipeWidth) {
            if (bird.y < p.topHeight || bird.y + bird.h > p.topHeight + pipeGap) {
                endGame();
            }
        }

        // Score
        if (!p.passed && bird.x > p.x + pipeWidth) {
            p.passed = true;
            score++;
            scoreEl.innerText = score;
        }

        if (p.x < -pipeWidth) pipes.splice(i, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bird
    ctx.fillStyle = '#00f2ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
    ctx.fillRect(bird.x, bird.y, bird.w, bird.h);
    // Eye
    ctx.fillStyle = '#fff';
    ctx.fillRect(bird.x + 20, bird.y + 5, 5, 5);
    ctx.shadowBlur = 0;

    // Pipes
    ctx.fillStyle = '#3fb950';
    pipes.forEach(p => {
        // Top Pipe
        ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
        // Bottom Pipe
        ctx.fillRect(p.x, p.topHeight + pipeGap, pipeWidth, canvas.height - (p.topHeight + pipeGap));
    });
}

function flap() {
    if (!gameActive) return;
    bird.velocity = bird.jump;
}

window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') flap();
});
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    flap();
});

function startGame() {
    gameActive = true;
    score = 0;
    scoreEl.innerText = '0';
    bird.y = 200;
    bird.velocity = 0;
    pipes = [];
    frame = 0;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    const high = localStorage.getItem('highScore_flappy-bird') || 0;
    highEl.innerText = `Best: ${high}`;

    update();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = `Score: ${score}`;

    const best = parseInt(localStorage.getItem('highScore_flappy-bird') || 0);
    if (score > best) localStorage.setItem('highScore_flappy-bird', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

const high = localStorage.getItem('highScore_flappy-bird') || 0;
highEl.innerText = `Best: ${high}`;
draw();
