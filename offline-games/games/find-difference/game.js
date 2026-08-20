const canvasL = document.getElementById('canvasLeft');
const canvasR = document.getElementById('canvasRight');
const ctxL = canvasL.getContext('2d');
const ctxR = canvasR.getContext('2d');

canvasL.width = canvasR.width = 350;
canvasL.height = canvasR.height = 450;

let gameActive = false;
let foundCount = 0;
let timeLeft = 60;
let timerInterval;
let shapes = [];
let differences = [];

function initLevel() {
    shapes = [];
    differences = [];
    foundCount = 0;
    timeLeft = 60;
    updateUI();

    // Generate 15 random background shapes
    for(let i=0; i<15; i++) {
        shapes.push(randomShape());
    }

    // Generate 5 differences
    for(let i=0; i<5; i++) {
        const s = randomShape();
        differences.push({
            shape: s,
            found: false,
            // Difference type: 0=Color change, 1=Missing on Left, 2=Different Size
            type: Math.floor(Math.random() * 3)
        });
    }

    draw();
}

function randomShape() {
    return {
        x: Math.random() * 300 + 25,
        y: Math.random() * 400 + 25,
        r: Math.random() * 20 + 10,
        color: `hsl(${Math.random() * 360}, 60%, 50%)`,
        type: Math.random() > 0.5 ? 'circle' : 'rect'
    };
}

function drawShape(ctx, s) {
    ctx.fillStyle = s.color;
    if (s.type === 'circle') {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
    } else {
        ctx.fillRect(s.x - s.r, s.y - s.r, s.r*2, s.r*2);
    }
}

function draw() {
    ctxL.clearRect(0, 0, canvasL.width, canvasL.height);
    ctxR.clearRect(0, 0, canvasR.width, canvasR.height);

    // Draw background shapes on both
    shapes.forEach(s => {
        drawShape(ctxL, s);
        drawShape(ctxR, s);
    });

    // Draw differences
    differences.forEach(d => {
        const s = d.shape;
        if (d.type === 0) { // Color change
            drawShape(ctxL, s);
            const alt = {...s, color: 'white'};
            drawShape(ctxR, alt);
        } else if (d.type === 1) { // Missing on Left
            // skip L
            drawShape(ctxR, s);
        } else { // Different size
            drawShape(ctxL, s);
            const alt = {...s, r: s.r * 0.5};
            drawShape(ctxR, alt);
        }

        if (d.found) {
            ctxR.strokeStyle = '#3fb950';
            ctxR.lineWidth = 3;
            ctxR.beginPath(); ctx.arc(s.x, s.y, s.r + 10, 0, Math.PI*2); ctxR.stroke();
        }
    });
}

canvasR.addEventListener('mousedown', (e) => {
    if (!gameActive) return;
    const rect = canvasR.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    differences.forEach(d => {
        if (!d.found) {
            const dist = Math.hypot(x - d.shape.x, y - d.shape.y);
            if (dist < d.shape.r + 20) {
                d.found = true;
                foundCount++;
                updateUI();
                draw();
                if (foundCount === 5) showWin();
            }
        }
    });
});

function updateUI() {
    document.getElementById('found').innerText = foundCount;
    document.getElementById('timer').innerText = timeLeft;
}

function startGame() {
    gameActive = true;
    initLevel();
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function showWin() {
    gameActive = false;
    clearInterval(timerInterval);
    document.getElementById('win-screen').classList.remove('hidden');
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    document.getElementById('game-over').classList.remove('hidden');
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
document.getElementById('next-btn').onclick = startGame;

initLevel();
