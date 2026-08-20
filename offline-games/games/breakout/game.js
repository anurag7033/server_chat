const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const winStatusEl = document.getElementById('win-status');
const finalScoreEl = document.getElementById('final-score');

canvas.width = Math.min(window.innerWidth - 40, 500);
canvas.height = 500;

let gameActive = false;
let score = 0;
let lives = 3;

const paddleW = 80;
const paddleH = 15;
let paddleX = (canvas.width - paddleW) / 2;

let ballX = canvas.width / 2;
let ballY = canvas.height - 50;
let ballVX = 4;
let ballVY = -4;
const ballR = 8;

const brickRowCount = 5;
const brickColumnCount = 8;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 15;
const brickWidth = (canvas.width - (brickOffsetLeft * 2) - (brickPadding * (brickColumnCount - 1))) / brickColumnCount;
const brickHeight = 20;

let bricks = [];

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            bricks[c][r] = { x: 0, y: 0, status: 1, color: `hsl(${r * 40 + 180}, 70%, 50%)` };
        }
    }
}

function update() {
    if (!gameActive) return;

    ballX += ballVX;
    ballY += ballVY;

    // Walls
    if (ballX + ballR > canvas.width || ballX - ballR < 0) ballVX = -ballVX;
    if (ballY - ballR < 0) ballVY = -ballVY;

    // Paddle
    if (ballY + ballR > canvas.height - paddleH - 10) {
        if (ballX > paddleX && ballX < paddleX + paddleW) {
            ballVY = -ballVY;
            // Angle based on hit position
            let hitPos = (ballX - (paddleX + paddleW / 2)) / (paddleW / 2);
            ballVX = hitPos * 5;
        } else if (ballY > canvas.height) {
            lives--;
            if (lives <= 0) endGame("GAME OVER");
            else resetBall();
        }
    }

    // Bricks
    let activeBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                activeBricks++;
                if (ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + brickHeight) {
                    ballVY = -ballVY;
                    b.status = 0;
                    score += 10;
                    scoreEl.innerText = `Score: ${score}`;
                }
            }
        }
    }

    if (activeBricks === 0) endGame("YOU WIN!");

    livesEl.innerText = `Lives: ${lives}`;

    draw();
    requestAnimationFrame(update);
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height - 50;
    ballVX = 4;
    ballVY = -4;
    paddleX = (canvas.width - paddleW) / 2;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Paddle
    ctx.fillStyle = '#00f2ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
    ctx.fillRect(paddleX, canvas.height - paddleH - 10, paddleW, paddleH);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    ctx.fill();

    // Bricks
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1) {
                b.x = c * (brickWidth + brickPadding) + brickOffsetLeft;
                b.y = r * (brickHeight + brickPadding) + brickOffsetTop;
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, brickWidth, brickHeight);
            }
        }
    }
}

// Controls
const handleMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = canvas.getBoundingClientRect();
    paddleX = x - rect.left - paddleW / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleW) paddleX = canvas.width - paddleW;
};
window.addEventListener('mousemove', handleMove);
window.addEventListener('touchmove', handleMove);

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') paddleX -= 30;
    if (e.key === 'ArrowRight') paddleX += 30;
    if (paddleX < 0) paddleX = 0;
    if (paddleX > canvas.width - paddleW) paddleX = canvas.width - paddleW;
});

function startGame() {
    gameActive = true;
    score = 0;
    lives = 3;
    scoreEl.innerText = `Score: 0`;
    initBricks();
    resetBall();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    update();
}

function endGame(status) {
    gameActive = false;
    winStatusEl.innerText = status;
    finalScoreEl.innerText = `Score: ${score}`;
    gameOverScreen.classList.remove('hidden');

    const best = parseInt(localStorage.getItem('highScore_breakout') || 0);
    if (score > best) localStorage.setItem('highScore_breakout', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

initBricks();
draw();
