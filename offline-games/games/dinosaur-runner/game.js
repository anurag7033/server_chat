const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

canvas.width = Math.min(window.innerWidth - 40, 600);
canvas.height = 200;

let gameActive = false;
let score = 0;
let frame = 0;
let speed = 6;

const dino = {
    x: 50,
    y: 150,
    w: 40,
    h: 40,
    vy: 0,
    gravity: 0.6,
    jump: -12,
    isDucking: false
};

let obstacles = [];

function spawnObstacle() {
    const type = Math.random() < 0.2 ? 'bird' : 'cactus';
    obstacles.push({
        x: canvas.width,
        y: type === 'bird' ? 120 : 150,
        w: type === 'bird' ? 40 : 25,
        h: type === 'bird' ? 30 : 40,
        type: type
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    score += 0.15;
    scoreEl.innerText = Math.floor(score).toString().padStart(5, '0');

    if (frame % 500 === 0) speed += 0.5;

    // Dino logic
    dino.vy += dino.gravity;
    dino.y += dino.vy;

    const groundY = 150;
    if (dino.y > groundY) {
        dino.y = groundY;
        dino.vy = 0;
    }

    // Obstacles
    if (frame % Math.floor(100 / (speed / 6)) === 0 && Math.random() < 0.3) spawnObstacle();

    obstacles.forEach((obs, i) => {
        obs.x -= speed;

        // Collision
        const dw = dino.w - 10;
        const dh = dino.isDucking ? 20 : dino.h - 5;
        const dy = dino.isDucking ? dino.y + 20 : dino.y;

        if (dino.x < obs.x + obs.w && dino.x + dw > obs.x &&
            dy < obs.y + obs.h && dy + dh > obs.y) {
            endGame();
        }

        if (obs.x < -100) obstacles.splice(i, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.strokeStyle = '#30363d';
    ctx.beginPath();
    ctx.moveTo(0, 190);
    ctx.lineTo(canvas.width, 190);
    ctx.stroke();

    // Dino
    ctx.fillStyle = '#00f2ff';
    if (dino.isDucking) {
        ctx.fillRect(dino.x, dino.y + 20, dino.w + 10, 20);
    } else {
        ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
        // Eye
        ctx.fillStyle = '#000';
        ctx.fillRect(dino.x + 25, dino.y + 10, 5, 5);
    }

    // Obstacles
    ctx.fillStyle = '#8b949e';
    obstacles.forEach(obs => {
        if (obs.type === 'bird') {
            ctx.fillStyle = '#f85149';
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        } else {
            ctx.fillStyle = '#3fb950';
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
    });
}

function jump() {
    if (dino.y === 150 && !dino.isDucking) {
        dino.vy = dino.jump;
    }
}

window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
    if (e.code === 'ArrowDown') dino.isDucking = true;
});
window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') dino.isDucking = false;
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    jump();
});

function startGame() {
    gameActive = true;
    score = 0;
    speed = 6;
    obstacles = [];
    frame = 0;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    const high = localStorage.getItem('highScore_dino') || 0;
    highEl.innerText = `HI ${parseInt(high).toString().padStart(5, '0')}`;

    update();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalScoreEl.innerText = `Score: ${Math.floor(score)}`;

    const best = parseInt(localStorage.getItem('highScore_dino') || 0);
    if (score > best) localStorage.setItem('highScore_dino', Math.floor(score));
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

const high = localStorage.getItem('highScore_dino') || 0;
highEl.innerText = `HI ${parseInt(high).toString().padStart(5, '0')}`;
draw();
