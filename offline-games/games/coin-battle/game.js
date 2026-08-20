const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

let gameActive = false;
let timer = 60;
let scores = { p1: 0, p2: 0 };
let coins = [];
let timerInterval;

const p1 = { x: 100, y: 250, r: 20, color: '#00f2ff', speed: 5 };
const p2 = { x: 700, y: 250, r: 20, color: '#f85149', speed: 5 };

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function spawnCoin() {
    coins.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: Math.random() * (canvas.height - 40) + 20,
        r: 10,
        value: Math.random() > 0.9 ? 5 : 1
    });
}

function update() {
    if (!gameActive) return;

    // P1 Movement
    if (keys['KeyW'] && p1.y > p1.r) p1.y -= p1.speed;
    if (keys['KeyS'] && p1.y < canvas.height - p1.r) p1.y += p1.speed;
    if (keys['KeyA'] && p1.x > p1.r) p1.x -= p1.speed;
    if (keys['KeyD'] && p1.x < canvas.width - p1.r) p1.x += p1.speed;

    // P2 Movement
    if (keys['ArrowUp'] && p2.y > p2.r) p2.y -= p2.speed;
    if (keys['ArrowDown'] && p2.y < canvas.height - p2.r) p2.y += p2.speed;
    if (keys['ArrowLeft'] && p2.x > p2.r) p2.x -= p2.speed;
    if (keys['ArrowRight'] && p2.x < canvas.width - p2.r) p2.x += p2.speed;

    // Coin Collision
    coins.forEach((c, i) => {
        if (Math.hypot(p1.x - c.x, p1.y - c.y) < p1.r + c.r) {
            scores.p1 += c.value;
            coins.splice(i, 1);
            spawnCoin();
        } else if (Math.hypot(p2.x - c.x, p2.y - c.y) < p2.r + c.r) {
            scores.p2 += c.value;
            coins.splice(i, 1);
            spawnCoin();
        }
    });

    if (coins.length < 5) spawnCoin();

    updateUI();
    draw();
    requestAnimationFrame(update);
}

function updateUI() {
    document.getElementById('scores').innerText = `P1: ${scores.p1} | P2: ${scores.p2}`;
    document.getElementById('timer').innerText = timer + 's';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Coins
    coins.forEach(c => {
        ctx.fillStyle = c.value === 5 ? '#ff7b08' : '#f2cf66';
        ctx.shadowBlur = 10; ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Players
    ctx.fillStyle = p1.color;
    ctx.shadowBlur = 15; ctx.shadowColor = p1.color;
    ctx.beginPath(); ctx.arc(p1.x, p1.y, p1.r, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = p2.color;
    ctx.shadowColor = p2.color;
    ctx.beginPath(); ctx.arc(p2.x, p2.y, p2.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
}

function startGame() {
    gameActive = true;
    timer = 60;
    scores = { p1: 0, p2: 0 };
    coins = [];
    p1.x = 100; p1.y = 250;
    p2.x = 700; p2.y = 250;
    for(let i=0; i<5; i++) spawnCoin();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        if (timer <= 0) endGame();
    }, 1000);

    update();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    const msg = document.getElementById('win-message');
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-scores').innerText = `P1: ${scores.p1} | P2: ${scores.p2}`;

    if (scores.p1 === scores.p2) msg.innerText = 'DRAW!';
    else if (scores.p1 > scores.p2) msg.innerText = 'PLAYER 1 WINS!';
    else msg.innerText = 'PLAYER 2 WINS!';
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
