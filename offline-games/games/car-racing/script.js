const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('start-btn');
const menu = document.getElementById('menu');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');

// Layout constants
const LANE_WIDTH = 80;
const LANES = 3;
canvas.width = LANE_WIDTH * LANES;
canvas.height = window.innerHeight;

let score = 0;
let gameActive = false;
let speed = 5;
let player = { x: LANE_WIDTH, y: canvas.height - 120, w: 50, h: 80, lane: 1 };
let obstacles = [];
let frame = 0;

// Highscore
let highscore = localStorage.getItem('racing_highscore') || 0;
highscoreEl.textContent = `Best: ${highscore}`;

// Input
window.addEventListener('keydown', e => {
    if (!gameActive) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') movePlayer(-1);
    if (e.key === 'ArrowRight' || e.key === 'd') movePlayer(1);
});

// Mobile Controls
if ('ontouchstart' in window) {
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('left-btn').addEventListener('touchstart', () => movePlayer(-1));
    document.getElementById('right-btn').addEventListener('touchstart', () => movePlayer(1));
}

function movePlayer(dir) {
    player.lane = Math.max(0, Math.min(LANES - 1, player.lane + dir));
    player.x = player.lane * LANE_WIDTH + (LANE_WIDTH - player.w) / 2;
}

function spawnObstacle() {
    const lane = Math.floor(Math.random() * LANES);
    obstacles.push({
        x: lane * LANE_WIDTH + (LANE_WIDTH - 40) / 2,
        y: -100,
        w: 40,
        h: 70,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    if (frame % Math.max(20, 60 - Math.floor(score / 10)) === 0) spawnObstacle();

    obstacles.forEach((obs, index) => {
        obs.y += speed;
        // Collision
        if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
            player.y < obs.y + obs.h && player.y + player.h > obs.y) {
            gameOver();
        }
        // Off screen
        if (obs.y > canvas.height) {
            obstacles.splice(index, 1);
            score++;
            scoreEl.textContent = `Score: ${score}`;
            if (score % 10 === 0) speed += 0.2;
        }
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road lines
    ctx.setLineDash([20, 20]);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, canvas.height);
        ctx.stroke();
    }

    // Player Car (Neon Blue)
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00f2ff';
    ctx.fillStyle = '#00f2ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Wheels
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x - 5, player.y + 10, 5, 20);
    ctx.fillRect(player.x + player.w, player.y + 10, 5, 20);
    ctx.fillRect(player.x - 5, player.y + 50, 5, 20);
    ctx.fillRect(player.x + player.w, player.y + 50, 5, 20);

    // Obstacles
    ctx.shadowBlur = 0;
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.color;
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    });
}

function startGame() {
    score = 0;
    speed = 5;
    obstacles = [];
    player.lane = 1;
    movePlayer(0);
    gameActive = true;
    menu.style.display = 'none';
    scoreEl.textContent = `Score: ${score}`;
    update();
}

function gameOver() {
    gameActive = false;
    menu.style.display = 'block';
    document.querySelector('#menu h1').textContent = 'GAME OVER';
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('racing_highscore', highscore);
        highscoreEl.textContent = `Best: ${highscore}`;
    }
}

startBtn.addEventListener('click', startGame);
draw();
