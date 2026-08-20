const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score-display');
const highEl = document.getElementById('high-score-display');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

// Canvas scaling for responsiveness
function resize() {
    canvas.width = Math.min(window.innerWidth, 500);
    canvas.height = window.innerHeight - 100;
}
window.addEventListener('resize', resize);
resize();

// Game State
let gameActive = false;
let score = 0;
let speed = 5;
let frame = 0;
let enemies = [];
let roadOffset = 0;

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 120,
    w: 50,
    h: 90,
    color: '#00f2ff',
    targetX: canvas.width / 2 - 25
};

// Controls
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Touch Controls
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

let moveLeft = false;
let moveRight = false;

leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft = true; });
leftBtn.addEventListener('touchend', () => moveLeft = false);
rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); moveRight = true; });
rightBtn.addEventListener('touchend', () => moveRight = false);

function spawnEnemy() {
    const lanes = 3;
    const laneWidth = canvas.width / lanes;
    const lane = Math.floor(Math.random() * lanes);

    enemies.push({
        x: lane * laneWidth + (laneWidth - 50) / 2,
        y: -100,
        w: 50,
        h: 90,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    score += 0.1;
    scoreEl.innerText = `Score: ${Math.floor(score)}`;

    // Increase difficulty
    if (Math.floor(score) % 100 === 0 && speed < 15) {
        speed += 0.005;
    }

    // Player Movement
    const moveSpeed = 7;
    if (keys['ArrowLeft'] || keys['KeyA'] || moveLeft) {
        if (player.x > 0) player.x -= moveSpeed;
    }
    if (keys['ArrowRight'] || keys['KeyD'] || moveRight) {
        if (player.x + player.w < canvas.width) player.x += moveSpeed;
    }

    // Road Animation
    roadOffset += speed;
    if (roadOffset > 40) roadOffset = 0;

    // Enemy logic
    if (frame % Math.floor(100 / (speed / 5)) === 0) spawnEnemy();

    enemies.forEach((enemy, index) => {
        enemy.y += speed;

        // Collision Check
        if (
            player.x < enemy.x + enemy.w &&
            player.x + player.w > enemy.x &&
            player.y < enemy.y + enemy.h &&
            player.y + player.h > enemy.y
        ) {
            endGame();
        }

        // Remove off-screen
        if (enemy.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });

    draw();
    requestAnimationFrame(update);
}

function drawCar(x, y, w, h, color, isPlayer = false) {
    // Car Body
    ctx.fillStyle = color;
    ctx.shadowBlur = isPlayer ? 15 : 5;
    ctx.shadowColor = color;
    ctx.fillRect(x, y, w, h);

    // Windshield
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x + 5, y + 15, w - 10, 20);

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(x - 5, y + 10, 5, 20);
    ctx.fillRect(x + w, y + 10, 5, 20);
    ctx.fillRect(x - 5, y + h - 30, 5, 20);
    ctx.fillRect(x + w, y + h - 30, 5, 20);

    // Reset shadow
    ctx.shadowBlur = 0;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Road Lines
    ctx.strokeStyle = '#333';
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -roadOffset;

    const lanes = 3;
    const laneWidth = canvas.width / lanes;
    for (let i = 1; i < lanes; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, canvas.height);
        ctx.stroke();
    }

    // Draw Player
    drawCar(player.x, player.y, player.w, player.h, player.color, true);

    // Draw Enemies
    enemies.forEach(enemy => {
        drawCar(enemy.x, enemy.y, enemy.w, enemy.h, enemy.color);
    });
}

function startGame() {
    gameActive = true;
    score = 0;
    speed = 5;
    enemies = [];
    player.x = canvas.width / 2 - 25;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    const high = localStorage.getItem('highScore_car-racing') || 0;
    highEl.innerText = `Best: ${high}`;

    update();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = `Final Score: ${Math.floor(score)}`;

    // Global helper from main.js is not here, so we implement locally
    const currentHigh = parseInt(localStorage.getItem('highScore_car-racing') || 0);
    if (Math.floor(score) > currentHigh) {
        localStorage.setItem('highScore_car-racing', Math.floor(score));
    }
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// Initial High Score Load
const initialHigh = localStorage.getItem('highScore_car-racing') || 0;
highEl.innerText = `Best: ${initialHigh}`;
draw();
