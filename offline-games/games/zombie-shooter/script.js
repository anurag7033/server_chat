const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const killEl = document.getElementById('kills');
const waveEl = document.getElementById('wave');
const menu = document.getElementById('menu');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = { x: canvas.width/2, y: canvas.height/2, radius: 20, speed: 4, angle: 0 };
let bullets = [];
let zombies = [];
let gameActive = false;
let kills = 0;
let wave = 1;
let keys = {};

// Mobile state
let isMobile = 'ontouchstart' in window;
let joystick = { x: 0, y: 0, active: false };

if (isMobile) {
    document.getElementById('joystick-container').style.display = 'block';
    document.getElementById('fire-btn').style.display = 'flex';
    setupMobileControls();
}

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => {
    if (!isMobile) player.angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
});
window.addEventListener('mousedown', shoot);

function shoot() {
    if (!gameActive) return;
    bullets.push({
        x: player.x + Math.cos(player.angle) * 20,
        y: player.y + Math.sin(player.angle) * 20,
        vx: Math.cos(player.angle) * 8,
        vy: Math.sin(player.angle) * 8
    });
}

function spawnWave() {
    for (let i = 0; i < wave * 5; i++) {
        let x, y;
        if (Math.random() > 0.5) {
            x = Math.random() > 0.5 ? -50 : canvas.width + 50;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() > 0.5 ? -50 : canvas.height + 50;
        }
        zombies.push({ x, y, radius: 15, speed: 1 + Math.random() + (wave * 0.1) });
    }
}

function update() {
    if (!gameActive) return;

    // Move player
    if (keys['w'] || joystick.y < -0.2) player.y -= player.speed;
    if (keys['s'] || joystick.y > 0.2) player.y += player.speed;
    if (keys['a'] || joystick.x < -0.2) player.x -= player.speed;
    if (keys['d'] || joystick.x > 0.2) player.x += player.speed;

    // Bullets
    bullets.forEach((b, i) => {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) bullets.splice(i, 1);
    });

    // Zombies
    zombies.forEach((z, zi) => {
        let dx = player.x - z.x;
        let dy = player.y - z.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        z.x += (dx/dist) * z.speed;
        z.y += (dy/dist) * z.speed;

        // Player collision
        if (dist < player.radius + z.radius) gameOver();

        // Bullet collision
        bullets.forEach((b, bi) => {
            let bdx = b.x - z.x;
            let bdy = b.y - z.y;
            if (Math.sqrt(bdx*bdx + bdy*bdy) < z.radius + 5) {
                zombies.splice(zi, 1);
                bullets.splice(bi, 1);
                kills++;
                killEl.textContent = kills;
            }
        });
    });

    if (zombies.length === 0) {
        wave++;
        waveEl.textContent = wave;
        spawnWave();
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff'; // Gun
    ctx.fillRect(10, -5, 20, 10);
    ctx.restore();

    // Bullets
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
        ctx.fill();
    });

    // Zombies
    ctx.fillStyle = '#f00';
    zombies.forEach(z => {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.radius, 0, Math.PI*2);
        ctx.fill();
    });
}

function startGame() {
    kills = 0;
    wave = 1;
    zombies = [];
    bullets = [];
    player.x = canvas.width/2;
    player.y = canvas.height/2;
    gameActive = true;
    menu.style.display = 'none';
    killEl.textContent = '0';
    waveEl.textContent = '1';
    spawnWave();
    update();
}

function gameOver() {
    gameActive = false;
    menu.style.display = 'block';
    document.querySelector('#menu h1').textContent = 'YOU DIED';
    localStorage.setItem('zombie_highscore', Math.max(kills, localStorage.getItem('zombie_highscore') || 0));
}

function setupMobileControls() {
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    const fire = document.getElementById('fire-btn');

    base.addEventListener('touchstart', e => { joystick.active = true; });
    window.addEventListener('touchmove', e => {
        if (!joystick.active) return;
        let touch = e.touches[0];
        let rect = base.getBoundingClientRect();
        let centerX = rect.left + rect.width/2;
        let centerY = rect.top + rect.height/2;
        let dx = touch.clientX - centerX;
        let dy = touch.clientY - centerY;
        let dist = Math.min(50, Math.sqrt(dx*dx + dy*dy));
        let angle = Math.atan2(dy, dx);

        joystick.x = (Math.cos(angle) * dist) / 50;
        joystick.y = (Math.sin(angle) * dist) / 50;

        knob.style.transform = `translate(${joystick.x * 25}px, ${joystick.y * 25}px)`;
        player.angle = angle;
    });
    window.addEventListener('touchend', () => {
        joystick.active = false;
        joystick.x = 0;
        joystick.y = 0;
        knob.style.transform = `translate(0, 0)`;
    });
    fire.addEventListener('touchstart', (e) => {
        e.preventDefault();
        shoot();
    });
}

document.getElementById('start-btn').addEventListener('click', startGame);
draw();
