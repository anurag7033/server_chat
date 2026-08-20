const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

const GRAVITY = 0.8;

class Entity {
    constructor(x, y, color, name) {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 80;
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.hp = 100;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.direction = 1; // 1: Right, -1: Left
        this.name = name;
    }

    update() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.h > 380) {
            this.y = 380 - this.h;
            this.vy = 0;
        }

        if (this.x < 0) this.x = 0;
        if (this.x + this.w > canvas.width) this.x = canvas.width - this.w;

        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;

        // Sword
        if (this.isAttacking) {
            ctx.fillStyle = '#fff';
            const sx = this.direction === 1 ? this.x + this.w : this.x - 40;
            ctx.fillRect(sx, this.y + 30, 40, 10);
        }
    }

    attack() {
        if (this.attackCooldown <= 0) {
            this.isAttacking = true;
            this.attackCooldown = 30;
            setTimeout(() => this.isAttacking = false, 150);
            return true;
        }
        return false;
    }
}

let gameActive = false;
let stage = 1;
let player;
let enemies = [];
const keys = {};

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if ((e.code === 'Space' || e.code === 'KeyJ') && gameActive) player.attack();
    if ((e.code === 'ArrowUp' || e.code === 'KeyW') && player.vy === 0) player.vy = -15;
});
window.addEventListener('keyup', e => keys[e.code] = false);

function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < stage; i++) {
        enemies.push(new Entity(canvas.width - 100 - i*50, 0, '#f85149', 'Enemy'));
    }
}

function update() {
    if (!gameActive) return;

    // Player controls
    player.vx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) { player.vx = -5; player.direction = -1; }
    if (keys['ArrowRight'] || keys['KeyD']) { player.vx = 5; player.direction = 1; }

    player.update();

    enemies.forEach((e, ei) => {
        e.update();

        // Simple AI
        const dist = player.x - e.x;
        if (Math.abs(dist) > 60) {
            e.vx = dist > 0 ? 2 : -2;
            e.direction = dist > 0 ? 1 : -1;
        } else {
            e.vx = 0;
            if (Math.random() < 0.05) e.attack();
        }

        // Collision Detection
        if (player.isAttacking) {
            const sx = player.direction === 1 ? player.x + player.w : player.x - 40;
            if (sx + 40 > e.x && sx < e.x + e.w && player.y + 50 > e.y && player.y + 30 < e.y + e.h) {
                e.hp -= 2;
                if (e.hp <= 0) enemies.splice(ei, 1);
            }
        }

        if (e.isAttacking) {
            const sx = e.direction === 1 ? e.x + e.w : e.x - 40;
            if (sx + 40 > player.x && sx < player.x + player.w && e.y + 50 > player.y && e.y + 30 < player.y + player.h) {
                player.hp -= 0.5;
            }
        }
    });

    if (enemies.length === 0) {
        stage++;
        player.hp = Math.min(100, player.hp + 20);
        spawnEnemies();
    }

    if (player.hp <= 0) endGame();

    document.getElementById('stage').innerText = stage;
    document.getElementById('hp-bar').style.width = player.hp + '%';

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Floor
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 380, canvas.width, 20);

    player.draw();
    enemies.forEach(e => e.draw());
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameActive) player.attack();
});

function startGame() {
    gameActive = true;
    stage = 1;
    player = new Entity(100, 0, '#00f2ff', 'Hero');
    spawnEnemies();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-stats').innerText = `Stages Cleared: ${stage - 1}`;
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
