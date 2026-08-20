const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = Math.min(window.innerWidth - 40, 800);
canvas.height = Math.min(window.innerHeight - 150, 500);

let gameActive = false;
let score = 0;
let timeLeft = 30;
let targets = [];
let shotsFired = 0;
let shotsHit = 0;
let combo = 0;
let timerInterval;

function spawnTarget() {
    const r = Math.random() * 20 + 10;
    targets.push({
        x: Math.random() * (canvas.width - r*2) + r,
        y: Math.random() * (canvas.height - r*2) + r,
        r: r,
        life: 2000, // 2 seconds
        spawnTime: Date.now(),
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
    });
}

function update() {
    if (!gameActive) return;

    const now = Date.now();
    targets = targets.filter(t => {
        if (now - t.spawnTime > t.life) {
            combo = 0;
            updateUI();
            return false;
        }
        return true;
    });

    if (targets.length < 3 && Math.random() < 0.05) spawnTarget();

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    targets.forEach(t => {
        const age = Date.now() - t.spawnTime;
        const scale = 1 - (age / t.life);

        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r * scale, 0, Math.PI * 2);
        ctx.fill();

        // Rings
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.7 * scale, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(t.x, t.y, t.r * 0.4 * scale, 0, Math.PI * 2); ctx.stroke();
    });
}

canvas.addEventListener('mousedown', (e) => {
    if (!gameActive) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    shotsFired++;
    let hit = false;

    targets.forEach((t, i) => {
        const dist = Math.hypot(x - t.x, y - t.y);
        if (dist < t.r) {
            hit = true;
            shotsHit++;
            combo++;
            // Small target = more points
            const pts = Math.floor((30 - t.r) * 5) * Math.min(combo, 5);
            score += pts;
            targets.splice(i, 1);
            spawnTarget();
        }
    });

    if (!hit) combo = 0;
    updateUI();
});

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('timer').innerText = timeLeft;
    document.getElementById('combo').innerText = `COMBO: x${combo}`;
}

function startGame() {
    gameActive = true;
    score = 0;
    timeLeft = 30;
    targets = [];
    shotsFired = 0;
    shotsHit = 0;
    combo = 0;
    updateUI();

    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) endGame();
    }, 1000);

    update();
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = `Score: ${score}`;
    const acc = shotsFired > 0 ? Math.floor((shotsHit / shotsFired) * 100) : 0;
    document.getElementById('accuracy').innerText = `Accuracy: ${acc}%`;

    const best = parseInt(localStorage.getItem('highScore_shooting') || 0);
    if (score > best) localStorage.setItem('highScore_shooting', score);
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
