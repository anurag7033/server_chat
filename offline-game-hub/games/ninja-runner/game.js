const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = Math.min(window.innerWidth, 800);
canvas.height = 400;

let gameActive = false;
let distance = 0;
let speed = 5;
let frame = 0;

const player = {
    x: 100,
    y: 300,
    w: 40, h: 60,
    vy: 0,
    isJumping: false,
    isSliding: false,
    isAttacking: false,
    attackCooldown: 0,
    color: '#7000ff'
};

let obstacles = [];
let coins = [];
let particles = [];

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if ((e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') && !player.isJumping) jump();
    if (e.code === 'ArrowDown' || e.code === 'KeyS') player.isSliding = true;
    if (e.code === 'KeyJ') attack();
});
window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') player.isSliding = false;
});

// Mobile
document.getElementById('jump-btn').onclick = jump;
document.getElementById('slide-btn').ontouchstart = () => player.isSliding = true;
document.getElementById('slide-btn').ontouchend = () => player.isSliding = false;
document.getElementById('attack-btn').onclick = attack;

function jump() {
    if (!player.isJumping) {
        player.vy = -15;
        player.isJumping = true;
    }
}

function attack() {
    if (player.attackCooldown <= 0) {
        player.isAttacking = true;
        player.attackCooldown = 30;
        setTimeout(() => player.isAttacking = false, 200);
    }
}

function spawnObstacle() {
    const type = Math.random() < 0.7 ? 'ground' : 'air';
    obstacles.push({
        x: canvas.width + 100,
        y: type === 'ground' ? 340 : 250,
        w: 40, h: type === 'ground' ? 60 : 40,
        type: type,
        isEnemy: Math.random() < 0.3
    });
}

function update() {
    if (!gameActive) return;

    frame++;
    distance += speed / 10;
    speed += 0.001;

    if (player.attackCooldown > 0) player.attackCooldown--;

    // Gravity
    player.vy += 0.8;
    player.y += player.vy;

    if (player.y > 340 - (player.isSliding ? 30 : 60)) {
        player.y = 340 - (player.isSliding ? 30 : 60);
        player.vy = 0;
        player.isJumping = false;
    }

    // Obstacles
    if (frame % Math.floor(120 / (speed/5)) === 0) spawnObstacle();

    obstacles.forEach((obs, i) => {
        obs.x -= speed;

        // Collision
        const ph = player.isSliding ? 30 : 60;
        if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
            player.y < obs.y + obs.h && player.y + ph > obs.y) {

            if (obs.isEnemy && player.isAttacking) {
                obstacles.splice(i, 1);
                scoreEffect(obs.x, obs.y);
            } else {
                endGame();
            }
        }

        if (obs.x < -100) obstacles.splice(i, 1);
    });

    document.getElementById('score').innerText = `${Math.floor(distance)}m`;
    draw();
    requestAnimationFrame(update);
}

function scoreEffect(x, y) {
    for(let i=0; i<5; i++) {
        particles.push({
            x, y, vx: Math.random() * 4 - 2, vy: -Math.random() * 5, life: 1, color: '#fff'
        });
    }
}

function draw() {
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 340, canvas.width, 60);

    // Player
    ctx.fillStyle = player.color;
    const ph = player.isSliding ? 30 : 60;
    ctx.fillRect(player.x, player.y, player.w, ph);

    if (player.isAttacking) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(player.x + 40, player.y + 10, 30, 10);
    }

    // Obstacles
    obstacles.forEach(obs => {
        ctx.fillStyle = obs.isEnemy ? '#f85149' : '#8b949e';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        if (obs.isEnemy) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(obs.x + 5, obs.y + 10, 5, 5);
        }
    });

    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.05;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
        if (p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;
}

function startGame() {
    gameActive = true; distance = 0; speed = 7; obstacles = []; particles = [];
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-dist').innerText = `Distance: ${Math.floor(distance)}m`;
    const best = localStorage.getItem('highScore_ninja-runner') || 0;
    if (distance > best) localStorage.setItem('highScore_ninja-runner', Math.floor(distance));
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

const best = localStorage.getItem('highScore_ninja-runner') || 0;
document.getElementById('high-score').innerText = `Best: ${best}m`;
draw();
