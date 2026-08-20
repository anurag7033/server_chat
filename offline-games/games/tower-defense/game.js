const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

const TILE_SIZE = 50;
const COLS = canvas.width / TILE_SIZE;
const ROWS = canvas.height / TILE_SIZE;

let gameActive = false;
let money = 100;
let lives = 20;
let wave = 0;
let isWaveActive = false;

const path = [
    {x: 0, y: 2}, {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2},
    {x: 3, y: 3}, {x: 3, y: 4}, {x: 3, y: 5}, {x: 3, y: 6},
    {x: 4, y: 6}, {x: 5, y: 6}, {x: 6, y: 6}, {x: 7, y: 6},
    {x: 7, y: 5}, {x: 7, y: 4}, {x: 7, y: 3}, {x: 7, y: 2},
    {x: 8, y: 2}, {x: 9, y: 2}, {x: 10, y: 2}, {x: 11, y: 2},
    {x: 12, y: 2}, {x: 13, y: 2}, {x: 14, y: 2}, {x: 15, y: 2}
];

let towers = [];
let enemies = [];
let projectiles = [];
let selectedTowerType = 'basic';

const TOWER_TYPES = {
    basic: { cost: 50, range: 120, damage: 1, fireRate: 30, color: '#00f2ff', icon: '🗼' },
    fast: { cost: 75, range: 100, damage: 0.5, fireRate: 15, color: '#7000ff', icon: '⚡' },
    sniper: { cost: 150, range: 250, damage: 5, fireRate: 100, color: '#f85149', icon: '🎯' }
};

class Enemy {
    constructor(hp, speed) {
        this.hp = hp;
        this.maxHp = hp;
        this.speed = speed;
        this.pathIndex = 0;
        this.x = path[0].x * TILE_SIZE + TILE_SIZE/2;
        this.y = path[0].y * TILE_SIZE + TILE_SIZE/2;
        this.r = 15;
    }

    update() {
        const target = path[this.pathIndex + 1];
        if (!target) {
            lives--;
            this.hp = 0; // Remove
            return;
        }

        const tx = target.x * TILE_SIZE + TILE_SIZE/2;
        const ty = target.y * TILE_SIZE + TILE_SIZE/2;

        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < this.speed) {
            this.pathIndex++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = '#da3633';
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
        // HP Bar
        ctx.fillStyle = '#333'; ctx.fillRect(this.x-15, this.y-25, 30, 5);
        ctx.fillStyle = '#3fb950'; ctx.fillRect(this.x-15, this.y-25, 30 * (this.hp/this.maxHp), 5);
    }
}

class Tower {
    constructor(x, y, type) {
        this.x = x * TILE_SIZE + TILE_SIZE/2;
        this.y = y * TILE_SIZE + TILE_SIZE/2;
        this.type = type;
        this.config = TOWER_TYPES[type];
        this.timer = 0;
    }

    update() {
        this.timer++;
        if (this.timer >= this.config.fireRate) {
            const target = this.findTarget();
            if (target) {
                projectiles.push(new Projectile(this.x, this.y, target, this.config.damage, this.config.color));
                this.timer = 0;
            }
        }
    }

    findTarget() {
        return enemies.find(e => Math.hypot(this.x - e.x, this.y - e.y) < this.config.range);
    }

    draw() {
        ctx.fillStyle = this.config.color;
        ctx.font = '24px Arial';
        ctx.fillText(this.config.icon, this.x - 12, this.y + 8);

        if (gameActive && selectedTowerType === this.type && Math.hypot(this.x - mouse.x, this.y - mouse.y) < 25) {
            ctx.strokeStyle = this.config.color;
            ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.arc(this.x, this.y, this.config.range, 0, Math.PI*2); ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

class Projectile {
    constructor(x, y, target, dmg, color) {
        this.x = x; this.y = y; this.target = target;
        this.dmg = dmg; this.color = color;
        this.speed = 7;
    }

    update() {
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < this.speed) {
            this.target.hp -= this.dmg;
            this.x = this.target.x; this.y = this.target.y;
            return true; // Hit
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            return false;
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI*2); ctx.fill();
    }
}

let mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
    if (!gameActive) return;
    const gx = Math.floor(mouse.x / TILE_SIZE);
    const gy = Math.floor(mouse.y / TILE_SIZE);

    if (canPlaceTower(gx, gy)) {
        const config = TOWER_TYPES[selectedTowerType];
        if (money >= config.cost) {
            towers.push(new Tower(gx, gy, selectedTowerType));
            money -= config.cost;
            updateUI();
        }
    }
});

function canPlaceTower(gx, gy) {
    if (path.some(p => p.x === gx && p.y === gy)) return false;
    if (towers.some(t => Math.floor(t.x/TILE_SIZE) === gx && Math.floor(t.y/TILE_SIZE) === gy)) return false;
    return true;
}

function startWave() {
    if (isWaveActive) return;
    wave++;
    isWaveActive = true;
    let count = 5 + wave * 2;
    let spawned = 0;
    const interval = setInterval(() => {
        enemies.push(new Enemy(1 + wave, 1 + wave*0.1));
        spawned++;
        if (spawned >= count) clearInterval(interval);
    }, 1000);
}

function update() {
    if (!gameActive) return;

    enemies.forEach((e, i) => {
        e.update();
        if (e.hp <= 0) {
            if (e.hp <= 0 && e.pathIndex < path.length - 1) money += 5;
            enemies.splice(i, 1);
        }
    });

    if (enemies.length === 0 && isWaveActive) {
        isWaveActive = false;
        money += 20; // Wave bonus
        updateUI();
    }

    towers.forEach(t => t.update());
    projectiles.forEach((p, i) => {
        if (p.update()) projectiles.splice(i, 1);
        else if (!enemies.includes(p.target)) projectiles.splice(i, 1);
    });

    if (lives <= 0) endGame();
    updateUI();
    draw();
    requestAnimationFrame(update);
}

function updateUI() {
    document.getElementById('money').innerText = money;
    document.getElementById('lives').innerText = lives;
    document.getElementById('wave').innerText = wave;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Path
    ctx.fillStyle = '#21262d';
    path.forEach(p => {
        ctx.fillRect(p.x * TILE_SIZE, p.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });

    // Grid (faint)
    ctx.strokeStyle = '#1a1a1a';
    for(let i=0; i<COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i*TILE_SIZE, 0); ctx.lineTo(i*TILE_SIZE, canvas.height); ctx.stroke();
    }
    for(let i=0; i<ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i*TILE_SIZE); ctx.lineTo(canvas.width, i*TILE_SIZE); ctx.stroke();
    }

    towers.forEach(t => t.draw());
    enemies.forEach(e => e.draw());
    projectiles.forEach(p => p.draw());

    // Hover effect
    if (gameActive) {
        const gx = Math.floor(mouse.x / TILE_SIZE);
        const gy = Math.floor(mouse.y / TILE_SIZE);
        if (canPlaceTower(gx, gy)) {
            ctx.fillStyle = 'rgba(0, 242, 255, 0.1)';
            ctx.fillRect(gx*TILE_SIZE, gy*TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else {
            ctx.fillStyle = 'rgba(248, 81, 73, 0.1)';
            ctx.fillRect(gx*TILE_SIZE, gy*TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function startGame() {
    gameActive = true; money = 100; lives = 20; wave = 0;
    towers = []; enemies = []; projectiles = [];
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    updateUI();
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-stats').innerText = `Waves Survived: ${wave}`;
}

document.querySelectorAll('.shop-item').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.shop-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTowerType = btn.dataset.type;
    };
});

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
document.getElementById('next-wave-btn').onclick = startWave;

draw();
