const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

let gameActive = false;
let isWaveActive = false;
let wave = 0;
let hp = 100;
let gold = 0;
let fireRate = 1.0;

const castle = { x: 0, y: 150, w: 100, h: 250 };
let enemies = [];
let arrows = [];
let particles = [];

let isAiming = false;
let aimPoint = { x: 0, y: 0 };
let playerPos = { x: 80, y: 180 };

canvas.addEventListener('mousedown', e => {
    if (!gameActive || !isWaveActive) return;
    isAiming = true;
    updateAim(e);
});

canvas.addEventListener('mousemove', e => {
    if (isAiming) updateAim(e);
});

canvas.addEventListener('mouseup', () => {
    if (isAiming) {
        fireArrow();
        isAiming = false;
    }
});

function updateAim(e) {
    const rect = canvas.getBoundingClientRect();
    aimPoint.x = e.clientX - rect.left;
    aimPoint.y = e.clientY - rect.top;
}

function fireArrow() {
    const dx = aimPoint.x - playerPos.x;
    const dy = aimPoint.y - playerPos.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const power = Math.min(dist / 10, 15);
    const angle = Math.atan2(dy, dx);

    arrows.push({
        x: playerPos.x,
        y: playerPos.y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        r: 3
    });
}

function spawnEnemy() {
    const type = Math.random() > 0.8 ? 'GIANT' : 'SOLDIER';
    enemies.push({
        x: canvas.width + 50,
        y: 350,
        hp: type === 'GIANT' ? 10 : 2,
        speed: type === 'GIANT' ? 0.5 : 1.2,
        size: type === 'GIANT' ? 40 : 20,
        type
    });
}

function startWave() {
    if (isWaveActive) return;
    wave++;
    isWaveActive = true;
    document.getElementById('upgrade-menu').classList.add('hidden');

    let count = 5 + wave * 3;
    let spawned = 0;
    const interval = setInterval(() => {
        if (!gameActive) { clearInterval(interval); return; }
        spawnEnemy();
        spawned++;
        if (spawned >= count) clearInterval(interval);
    }, 1500 / (1 + wave * 0.1));
}

function update() {
    if (!gameActive) return;

    if (isWaveActive) {
        // Arrows
        arrows.forEach((a, i) => {
            a.x += a.vx;
            a.y += a.vy;
            a.vy += 0.2; // Gravity

            // Enemy Hit
            enemies.forEach((e, ei) => {
                const dist = Math.hypot(a.x - e.x, a.y - (e.y - e.size/2));
                if (dist < e.size) {
                    e.hp -= 1;
                    arrows.splice(i, 1);
                    createParticles(e.x, e.y - e.size/2, '#f85149');
                    if (e.hp <= 0) {
                        gold += (e.type === 'GIANT' ? 50 : 10);
                        enemies.splice(ei, 1);
                    }
                }
            });

            if (a.y > 350 || a.x > canvas.width) arrows.splice(i, 1);
        });

        // Enemies
        enemies.forEach((e, i) => {
            e.x -= e.speed;
            if (e.x < castle.x + castle.w) {
                hp -= (e.type === 'GIANT' ? 0.5 : 0.1);
                if (hp <= 0) endGame();
            }
        });

        if (enemies.length === 0 && wave > 0) {
            // Check if wave spawning finished (simulated by timeout or flag)
            // For now, if empty, assume wave done
            isWaveActive = false;
            document.getElementById('upgrade-menu').classList.remove('hidden');
        }
    }

    // Particles
    particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    });

    updateUI();
    draw();
    requestAnimationFrame(update);
}

function updateUI() {
    document.getElementById('hp').innerText = Math.ceil(hp);
    document.getElementById('gold').innerText = gold;
    document.getElementById('wave').innerText = wave;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 350, canvas.width, 50);

    // Castle
    ctx.fillStyle = '#30363d';
    ctx.fillRect(castle.x, castle.y, castle.w, castle.h);
    ctx.fillStyle = '#21262d';
    ctx.fillRect(0, castle.y-20, 30, 20);
    ctx.fillRect(40, castle.y-20, 30, 20);
    ctx.fillRect(80, castle.y-20, 20, 20);

    // Player (Archer)
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath(); ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI*2); ctx.fill();

    // Aim Line
    if (isAiming) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(playerPos.x, playerPos.y);
        ctx.lineTo(aimPoint.x, aimPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Arrows
    ctx.strokeStyle = '#fff';
    arrows.forEach(a => {
        const angle = Math.atan2(a.vy, a.vx);
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(angle);
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.restore();
    });

    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.type === 'GIANT' ? '#d29922' : '#f85149';
        ctx.fillRect(e.x - e.size/2, 350 - e.size, e.size, e.size);
    });

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;
}

function createParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 1, color
        });
    }
}

function startGame() {
    gameActive = true; hp = 100; gold = 0; wave = 0; enemies = []; arrows = [];
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('upgrade-menu').classList.remove('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-stats').innerText = `Waves Defended: ${wave}`;
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
document.getElementById('next-wave').onclick = startWave;
document.getElementById('up-hp').onclick = () => {
    if (gold >= 50) { gold -= 50; hp = Math.min(100, hp + 30); updateUI(); }
};
document.getElementById('up-fire').onclick = () => {
    if (gold >= 100) { gold -= 100; fireRate += 0.2; updateUI(); }
};

draw();
