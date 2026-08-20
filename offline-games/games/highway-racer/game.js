const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Config
canvas.width = Math.min(window.innerWidth, 450);
canvas.height = window.innerHeight - 80;

let gameActive = false;
let distance = 0;
let speed = 8;
let nearMissCount = 0;
let frame = 0;
let traffic = [];
let roadLines = [];

const player = {
    x: canvas.width / 2 - 20,
    y: canvas.height - 150,
    w: 40,
    h: 80,
    color: '#00f2ff'
};

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Mobile
let moveLeft = false, moveRight = false;
document.getElementById('left-btn').ontouchstart = () => moveLeft = true;
document.getElementById('left-btn').ontouchend = () => moveLeft = false;
document.getElementById('right-btn').ontouchstart = () => moveRight = true;
document.getElementById('right-btn').ontouchend = () => moveRight = false;

function spawnTraffic() {
    const lanes = 4;
    const laneW = canvas.width / lanes;
    const lane = Math.floor(Math.random() * lanes);

    traffic.push({
        x: lane * laneW + (laneW - 40) / 2,
        y: -100,
        w: 40,
        h: 80,
        speed: speed * (0.4 + Math.random() * 0.3),
        color: `hsl(${Math.random() * 360}, 50%, 40%)`,
        passed: false
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    distance += speed / 10;
    speed += 0.001;

    document.getElementById('score').innerText = `${Math.floor(distance)}m`;
    document.getElementById('speed-meter').innerText = `${Math.floor(speed * 20)} km/h`;

    // Movement
    if ((keys['ArrowLeft'] || keys['KeyA'] || moveLeft) && player.x > 5) player.x -= 5;
    if ((keys['ArrowRight'] || keys['KeyD'] || moveRight) && player.x < canvas.width - player.w - 5) player.x += 5;

    // Traffic
    if (frame % 60 === 0) spawnTraffic();

    traffic.forEach((car, i) => {
        car.y += speed - car.speed;

        // Collision
        if (player.x < car.x + car.w && player.x + player.w > car.x &&
            player.y < car.y + car.h && player.y + player.h > car.y) {
            endGame();
        }

        // Near Miss Bonus
        if (!car.passed && car.y > player.y - 20 && car.y < player.y + player.h + 20) {
            const dist = Math.abs(player.x - car.x);
            if (dist < 50 && dist > 35) {
                nearMissCount++;
                distance += 50; // Bonus
                car.passed = true;
                showBonus();
            }
        }

        if (car.y > canvas.height) traffic.splice(i, 1);
    });

    draw();
    requestAnimationFrame(update);
}

function showBonus() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('NEAR MISS! +50m', canvas.width/2 - 70, 100);
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Road lines
    ctx.strokeStyle = '#333';
    ctx.setLineDash([30, 30]);
    ctx.lineDashOffset = -(distance * 10) % 60;
    for(let i=1; i<4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (canvas.width/4), 0);
        ctx.lineTo(i * (canvas.width/4), canvas.height);
        ctx.stroke();
    }

    // Player
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 10; ctx.shadowColor = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // Traffic
    traffic.forEach(car => {
        ctx.fillStyle = car.color;
        ctx.fillRect(car.x, car.y, car.w, car.h);
    });
}

function startGame() {
    gameActive = true;
    distance = 0; speed = 8; traffic = []; nearMissCount = 0;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-dist').innerText = `Distance: ${Math.floor(distance)}m`;
    document.getElementById('near-misses').innerText = `Near Misses: ${nearMissCount}`;

    const best = localStorage.getItem('highScore_highway-racer') || 0;
    if (distance > best) localStorage.setItem('highScore_highway-racer', Math.floor(distance));
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
draw();
