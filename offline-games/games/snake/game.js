const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

const gridSize = 20;
let tileCount;
let snake = [];
let food = { x: 5, y: 5 };
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let score = 0;
let gameActive = false;
let gameSpeed = 100;

function resize() {
    const size = Math.min(window.innerWidth - 40, window.innerHeight - 150, 400);
    canvas.width = canvas.height = Math.floor(size / gridSize) * gridSize;
    tileCount = canvas.width / gridSize;
}

window.addEventListener('resize', resize);
resize();

function init() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    scoreEl.innerText = `Score: ${score}`;
    const high = localStorage.getItem('highScore_snake') || 0;
    highEl.innerText = `Best: ${high}`;
    spawnFood();
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
    // Don't spawn on snake
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        spawnFood();
    }
}

function update() {
    if (!gameActive) return;

    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        endGame();
        return;
    }

    // Self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = `Score: ${score}`;
        spawnFood();
    } else {
        snake.pop();
    }

    draw();
    setTimeout(update, gameSpeed);
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (faint)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for(let i=0; i<=tileCount; i++) {
        ctx.beginPath(); ctx.moveTo(i*gridSize, 0); ctx.lineTo(i*gridSize, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i*gridSize); ctx.lineTo(canvas.width, i*gridSize); ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#f85149';
    ctx.shadowBlur = 10; ctx.shadowColor = '#f85149';
    ctx.beginPath();
    ctx.arc(food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    snake.forEach((segment, i) => {
        ctx.fillStyle = i === 0 ? '#00f2ff' : '#00aaff';
        if (i === 0) {
            ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
        }
        ctx.fillRect(segment.x * gridSize + 1, segment.y * gridSize + 1, gridSize - 2, gridSize - 2);
        ctx.shadowBlur = 0;
    });
}

window.addEventListener('keydown', e => {
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            if (dy !== 1) { nextDx = 0; nextDy = -1; }
            break;
        case 'ArrowDown':
        case 'KeyS':
            if (dy !== -1) { nextDx = 0; nextDy = 1; }
            break;
        case 'ArrowLeft':
        case 'KeyA':
            if (dx !== 1) { nextDx = -1; nextDy = 0; }
            break;
        case 'ArrowRight':
        case 'KeyD':
            if (dx !== -1) { nextDx = 1; nextDy = 0; }
            break;
    }
});

// Swipe support
let touchStartX, touchStartY;
window.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', e => {
    const dxTouch = e.changedTouches[0].clientX - touchStartX;
    const dyTouch = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dxTouch) > Math.abs(dyTouch)) {
        if (Math.abs(dxTouch) > 30) {
            if (dxTouch > 0 && dx !== -1) { nextDx = 1; nextDy = 0; }
            else if (dxTouch < 0 && dx !== 1) { nextDx = -1; nextDy = 0; }
        }
    } else {
        if (Math.abs(dyTouch) > 30) {
            if (dyTouch > 0 && dy !== -1) { nextDx = 0; nextDy = 1; }
            else if (dyTouch < 0 && dy !== 1) { nextDx = 0; nextDy = -1; }
        }
    }
}, { passive: true });

function startGame() {
    gameActive = true;
    init();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = `Score: ${score}`;

    const best = parseInt(localStorage.getItem('highScore_snake') || 0);
    if (score > best) localStorage.setItem('highScore_snake', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

init();
draw();
