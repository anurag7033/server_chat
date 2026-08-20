const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

let gameActive = false;
let score = 0;
let arrowsLeft = 10;
let wind = 0;

const playerPos = { x: 100, y: 300 };
const target = { x: 700, y: 200, r: 80 };

let arrows = [];
let isAiming = false;
let aimPoint = { x: 0, y: 0 };

canvas.addEventListener('mousedown', e => {
    if (!gameActive || arrowsLeft <= 0 || isAiming) return;
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
    const dx = playerPos.x - aimPoint.x; // Opposite direction for "pull back" feel
    const dy = playerPos.y - aimPoint.y;
    const power = Math.min(Math.sqrt(dx*dx + dy*dy) / 8, 15);
    const angle = Math.atan2(dy, dx);

    arrows.push({
        x: playerPos.x,
        y: playerPos.y,
        vx: Math.cos(angle) * power,
        vy: Math.sin(angle) * power,
        stuck: false,
        path: []
    });
    arrowsLeft--;
    document.getElementById('arrows').innerText = arrowsLeft;
}

function update() {
    if (!gameActive) return;

    arrows.forEach((a, i) => {
        if (!a.stuck) {
            a.vx += wind * 0.01;
            a.vy += 0.15; // Gravity
            a.x += a.vx;
            a.y += a.vy;
            a.path.push({x: a.x, y: a.y});

            // Target hit check
            if (a.x > target.x - 10 && a.x < target.x + 10) {
                const dist = Math.abs(a.y - target.y);
                if (dist < target.r) {
                    a.stuck = true;
                    a.x = target.x; // Stick to target surface
                    calculateScore(dist);
                }
            }

            // Out of bounds
            if (a.y > canvas.height || a.x > canvas.width || a.x < 0) {
                if (!a.stuck) arrows.splice(i, 1);
            }
        }
    });

    if (arrowsLeft === 0 && !arrows.some(a => !a.stuck)) {
        setTimeout(endGame, 1000);
    }

    draw();
    requestAnimationFrame(update);
}

function calculateScore(dist) {
    let pts = 0;
    let msg = "";
    if (dist < 10) { pts = 100; msg = "BULLSEYE!"; }
    else if (dist < 30) { pts = 50; msg = "GREAT!"; }
    else if (dist < 50) { pts = 20; msg = "GOOD!"; }
    else { pts = 10; msg = "HIT!"; }

    score += pts;
    document.getElementById('score').innerText = score;
    showFeedback(msg + " +" + pts);

    // New wind for next shot
    wind = (Math.random() - 0.5) * 4;
    document.getElementById('wind').innerText = `WIND: ${wind.toFixed(1)}`;
}

function showFeedback(text) {
    const el = document.getElementById('feedback');
    el.innerText = text;
    el.classList.remove('hidden');
    // Force reflow for animation restart
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = null;
    setTimeout(() => el.classList.add('hidden'), 1000);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Ground
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 380, canvas.width, 20);

    // Target
    const colors = ['#fff', '#f85149', '#fff', '#f85149', '#d29922'];
    for(let i=0; i<5; i++) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r - i*15, 0, Math.PI*2);
        ctx.fill();
    }

    // Player
    ctx.fillStyle = '#00f2ff';
    ctx.beginPath(); ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI*2); ctx.fill();

    // Aim Assist
    if (isAiming) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const dx = playerPos.x - aimPoint.x;
        const dy = playerPos.y - aimPoint.y;
        ctx.moveTo(playerPos.x, playerPos.y);
        ctx.lineTo(playerPos.x + dx, playerPos.y + dy);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Arrows
    ctx.lineWidth = 2;
    arrows.forEach(a => {
        ctx.strokeStyle = '#fff';
        const angle = a.stuck ? 0 : Math.atan2(a.vy, a.vx);
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(angle);
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(0, 0); ctx.stroke();
        // Fletching
        ctx.strokeStyle = '#00f2ff';
        ctx.beginPath(); ctx.moveTo(-15, -3); ctx.lineTo(-10, 0); ctx.lineTo(-15, 3); ctx.stroke();
        ctx.restore();
    });
}

function startGame() {
    gameActive = true; score = 0; arrowsLeft = 10; arrows = [];
    wind = (Math.random() - 0.5) * 4;
    document.getElementById('score').innerText = '0';
    document.getElementById('arrows').innerText = '10';
    document.getElementById('wind').innerText = `WIND: ${wind.toFixed(1)}`;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame() {
    gameActive = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Final Score: ${score}`;

    const best = parseInt(localStorage.getItem('highScore_archery') || 0);
    if (score > best) localStorage.setItem('highScore_archery', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
