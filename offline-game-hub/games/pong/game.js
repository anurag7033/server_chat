const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const diffSelect = document.getElementById('difficulty');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const winStatusEl = document.getElementById('win-status');

canvas.width = 600;
canvas.height = 400;

let gameActive = false;
let playerY = canvas.height / 2 - 40;
let aiY = canvas.height / 2 - 40;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballVX = 5;
let ballVY = 5;
let pScore = 0;
let aiScore = 0;

const paddleW = 10;
const paddleH = 80;
const ballR = 8;

function update() {
    if (!gameActive) return;

    // Ball movement
    ballX += ballVX;
    ballY += ballVY;

    // Wall collision (top/bottom)
    if (ballY - ballR < 0 || ballY + ballR > canvas.height) {
        ballVY = -ballVY;
    }

    // Player Paddle Collision
    if (ballX - ballR < paddleW + 10) {
        if (ballY > playerY && ballY < playerY + paddleH) {
            ballVX = -ballVX;
            ballVX *= 1.05; // Speed up
            // Reflection angle
            let deltaY = ballY - (playerY + paddleH / 2);
            ballVY = deltaY * 0.3;
        } else if (ballX < 0) {
            aiScore++;
            resetBall();
        }
    }

    // AI Paddle Collision
    if (ballX + ballR > canvas.width - paddleW - 10) {
        if (ballY > aiY && ballY < aiY + paddleH) {
            ballVX = -ballVX;
            ballVX *= 1.05;
            let deltaY = ballY - (aiY + paddleH / 2);
            ballVY = deltaY * 0.3;
        } else if (ballX > canvas.width) {
            pScore++;
            resetBall();
        }
    }

    // AI logic
    const diff = diffSelect.value;
    let aiSpeed = 4;
    if (diff === 'medium') aiSpeed = 6;
    if (diff === 'hard') aiSpeed = 9;

    let targetY = ballY - paddleH / 2;
    if (aiY < targetY) aiY += aiSpeed;
    if (aiY > targetY) aiY -= aiSpeed;

    // AI bounds
    if (aiY < 0) aiY = 0;
    if (aiY > canvas.height - paddleH) aiY = canvas.height - paddleH;

    scoreEl.innerText = `${pScore} - ${aiScore}`;

    if (pScore >= 5) endGame("YOU WIN!");
    if (aiScore >= 5) endGame("AI WINS!");

    draw();
    requestAnimationFrame(update);
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballVX = (Math.random() > 0.5 ? 5 : -5);
    ballVY = (Math.random() * 6 - 3);
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.strokeStyle = '#333';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Paddles
    ctx.fillStyle = '#00f2ff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#00f2ff';
    ctx.fillRect(10, playerY, paddleW, paddleH);

    ctx.fillStyle = '#f85149';
    ctx.shadowColor = '#f85149';
    ctx.fillRect(canvas.width - paddleW - 10, aiY, paddleW, paddleH);
    ctx.shadowBlur = 0;

    // Ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
    ctx.fill();
}

// Controls
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const root = document.documentElement;
    const mouseY = e.clientY - rect.top - root.scrollTop;
    playerY = mouseY - paddleH / 2;

    // Bounds
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - paddleH) playerY = canvas.height - paddleH;
});

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    playerY = touchY - paddleH / 2;
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - paddleH) playerY = canvas.height - paddleH;
}, { passive: false });

window.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') playerY -= 20;
    if (e.key === 's' || e.key === 'ArrowDown') playerY += 20;
    if (playerY < 0) playerY = 0;
    if (playerY > canvas.height - paddleH) playerY = canvas.height - paddleH;
});

function startGame() {
    gameActive = true;
    pScore = 0;
    aiScore = 0;
    resetBall();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    update();
}

function endGame(status) {
    gameActive = false;
    winStatusEl.innerText = status;
    gameOverScreen.classList.remove('hidden');
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
