const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = Math.min(window.innerWidth - 40, 450);
canvas.height = Math.min(window.innerHeight - 150, 600);

let gameActive = false;
let score = 0;
let speed = 4;
let frame = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    w: 30,
    h: 50,
    color: '#ff7b08'
};

let obstacles = [];
let stars = [];

// Init stars
for(let i=0; i<30; i++) {
    stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*2+1 });
}

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function handleMove(e) {
    if (!gameActive) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const rect = canvas.getBoundingClientRect();
    player.x = x - rect.left;
}
canvas.addEventListener('mousemove', handleMove);
canvas.addEventListener('touchmove', handleMove);

function spawnObstacle() {
    const size = Math.random() * 30 + 15;
    obstacles.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        size: size,
        speed: speed * (0.8 + Math.random() * 0.5),
        angle: 0,
        rotSpeed: (Math.random() - 0.5) * 0.1
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    score += 0.1;
    if (frame % 500 === 0) speed += 0.5;

    // Movement
    if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > player.w/2) player.x -= 7;
    if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - player.w/2) player.x += 7;

    // Stars
    stars.forEach(s => {
        s.y += speed/2;
        if (s.y > canvas.height) { s.y = 0; s.x = Math.random()*canvas.width; }
    });

    // Obstacles
    if (frame % Math.max(10, 40 - Math.floor(speed)) === 0) spawnObstacle();
    obstacles.forEach((obs, i) => {
        obs.y += obs.speed;
        obs.angle += obs.rotSpeed;

        // Collision
        const dist = Math.hypot(player.x - (obs.x + obs.size/2), player.y - (obs.y + obs.size/2));
        if (dist < (obs.size/2 + 15)) endGame();

        if (obs.y > canvas.height) obstacles.splice(i, 1);
    });

    document.getElementById('score').innerText = `Score: ${Math.floor(score)}`;

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.s, s.s));

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15; ctx.shadowColor = player.color;
    // Rocket Body
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-15, 25);
    ctx.lineTo(15, 25);
    ctx.fill();
    // Flame
    ctx.fillStyle = '#f85149';
    ctx.fillRect(-5, 25, 10, 10 + Math.random()*10);
    ctx.restore();
    ctx.shadowBlur = 0;

    // Obstacles
    ctx.fillStyle = '#8b949e';
    obstacles.forEach(obs => {
        ctx.save();
        ctx.translate(obs.x + obs.size/2, obs.y + obs.size/2);
        ctx.rotate(obs.angle);
        ctx.fillRect(-obs.size/2, -obs.size/2, obs.size, obs.size);
        ctx.restore();
    });
}

function startGame() {
    gameActive = true;
    score = 0;
    speed = 4;
    obstacles = [];
    frame = 0;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');

    const high = localStorage.getItem('highScore_rocket') || 0;
    document.getElementById('high-score').innerText = `Best: ${Math.floor(high)}`;

    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Score: ${Math.floor(score)}`;

    const best = parseInt(localStorage.getItem('highScore_rocket') || 0);
    if (score > best) localStorage.setItem('highScore_rocket', Math.floor(score));
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
