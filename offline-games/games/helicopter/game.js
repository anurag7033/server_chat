const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalDistEl = document.getElementById('final-dist');

canvas.width = Math.min(window.innerWidth - 40, 600);
canvas.height = 400;

let gameActive = false;
let distance = 0;
let speed = 5;
let frame = 0;

const copter = {
    x: 100,
    y: 200,
    w: 40,
    h: 20,
    vy: 0,
    gravity: 0.25,
    lift: -0.6
};

let obstacles = [];
let particles = [];
let isLifting = false;

function spawnObstacle() {
    const minH = 50;
    const gap = 150;
    const h = Math.random() * (canvas.height - gap - minH*2) + minH;
    obstacles.push({
        x: canvas.width,
        topH: h,
        gap: gap,
        w: 50
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    distance += speed / 10;
    scoreEl.innerText = `${Math.floor(distance)}m`;

    if (frame % 500 === 0) speed += 0.5;

    // Physics
    copter.vy += isLifting ? copter.lift : copter.gravity;
    copter.y += copter.vy;

    // Bounds
    if (copter.y < 0 || copter.y + copter.h > canvas.height) endGame();

    // Obstacles
    if (frame % 100 === 0) spawnObstacle();

    obstacles.forEach((obs, i) => {
        obs.x -= speed;

        // Collision
        if (copter.x + copter.w > obs.x && copter.x < obs.x + obs.w) {
            if (copter.y < obs.topH || copter.y + copter.h > obs.topH + obs.gap) {
                endGame();
            }
        }

        if (obs.x < -obs.w) obstacles.splice(i, 1);
    });

    // Trail Particles
    if (frame % 2 === 0) {
        particles.push({
            x: copter.x,
            y: copter.y + copter.h / 2,
            vx: -speed,
            vy: (Math.random() - 0.5) * 2,
            life: 1
        });
    }

    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        if (p.life <= 0) particles.splice(i, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Particles
    ctx.fillStyle = '#00f2ff';
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;

    // Obstacles
    ctx.fillStyle = '#30363d';
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth = 2;
    obstacles.forEach(obs => {
        ctx.fillRect(obs.x, 0, obs.w, obs.topH);
        ctx.strokeRect(obs.x, 0, obs.w, obs.topH);
        ctx.fillRect(obs.x, obs.topH + obs.gap, obs.w, canvas.height - (obs.topH + obs.gap));
        ctx.strokeRect(obs.x, obs.topH + obs.gap, obs.w, canvas.height - (obs.topH + obs.gap));
    });

    // Copter
    ctx.fillStyle = '#00f2ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00f2ff';
    ctx.fillRect(copter.x, copter.y, copter.w, copter.h);
    // Rotor
    ctx.fillStyle = '#fff';
    const rx = copter.x + copter.w/2 + Math.sin(frame*0.5) * 20;
    ctx.fillRect(rx - 10, copter.y - 5, 20, 2);
    ctx.shadowBlur = 0;
}

const handleStart = (e) => { e.preventDefault(); isLifting = true; };
const handleEnd = () => { isLifting = false; };

window.addEventListener('mousedown', handleStart);
window.addEventListener('mouseup', handleEnd);
window.addEventListener('touchstart', handleStart);
window.addEventListener('touchend', handleEnd);
window.addEventListener('keydown', e => { if (e.code === 'Space') isLifting = true; });
window.addEventListener('keyup', e => { if (e.code === 'Space') isLifting = false; });

function startGame() {
    gameActive = true;
    distance = 0;
    speed = 5;
    copter.y = 200;
    copter.vy = 0;
    obstacles = [];
    particles = [];
    frame = 0;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    const high = localStorage.getItem('highScore_helicopter') || 0;
    highEl.innerText = `Best: ${high}m`;

    update();
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
    finalDistEl.innerText = `Distance: ${Math.floor(distance)}m`;

    const best = parseInt(localStorage.getItem('highScore_helicopter') || 0);
    if (distance > best) localStorage.setItem('highScore_helicopter', Math.floor(distance));
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

const initialHigh = localStorage.getItem('highScore_helicopter') || 0;
highEl.innerText = `Best: ${initialHigh}m`;
draw();
