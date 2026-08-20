const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 400;

let gameActive = false;
let turn = 1; // 1 or 2
let scores = { p1: 0, p2: 0 };
let round = 0;

const p1 = { x: 50, y: 350, angle: -Math.PI/4, power: 10, color: '#00f2ff' };
const p2 = { x: 750, y: 350, angle: -3*Math.PI/4, power: 10, color: '#7000ff' };

let arrow = null;
let wind = 0;

const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (gameActive && !arrow) {
        if (turn === 1) {
            if (e.code === 'Space') fireArrow();
        } else {
            if (e.code === 'Enter') fireArrow();
        }
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function fireArrow() {
    const p = turn === 1 ? p1 : p2;
    arrow = {
        x: p.x,
        y: p.y - 20,
        vx: Math.cos(p.angle) * p.power,
        vy: Math.sin(p.angle) * p.power,
        color: p.color
    };
}

function update() {
    if (!gameActive) return;

    // Controls
    const current = turn === 1 ? p1 : p2;
    const up = turn === 1 ? 'KeyW' : 'ArrowUp';
    const down = turn === 1 ? 'KeyS' : 'ArrowDown';
    const left = turn === 1 ? 'KeyA' : 'ArrowLeft';
    const right = turn === 1 ? 'KeyD' : 'ArrowRight';

    if (keys[up]) current.angle -= 0.02;
    if (keys[down]) current.angle += 0.02;
    if (keys[left]) current.power = Math.max(5, current.power - 0.1);
    if (keys[right]) current.power = Math.min(20, current.power + 0.1);

    if (arrow) {
        arrow.vx += wind * 0.01;
        arrow.vy += 0.2; // Gravity
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;

        // Collision with floor
        if (arrow.y > 380) { arrow = null; nextTurn(); }
        // Collision with P1
        else if (turn === 2 && Math.hypot(arrow.x - p1.x, arrow.y - (p1.y - 20)) < 30) {
            scores.p2++;
            arrow = null;
            checkMatchEnd();
        }
        // Collision with P2
        else if (turn === 1 && Math.hypot(arrow.x - p2.x, arrow.y - (p2.y - 20)) < 30) {
            scores.p1++;
            arrow = null;
            checkMatchEnd();
        }
        // Out of bounds
        else if (arrow.x < 0 || arrow.x > canvas.width) { arrow = null; nextTurn(); }
    }

    updateUI();
    draw();
    requestAnimationFrame(update);
}

function nextTurn() {
    turn = turn === 1 ? 2 : 1;
    wind = (Math.random() - 0.5) * 4;
}

function checkMatchEnd() {
    if (scores.p1 >= 3 || scores.p2 >= 3) {
        endGame(scores.p1 >= 3 ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!');
    } else {
        nextTurn();
    }
}

function updateUI() {
    document.getElementById('scores').innerText = `P1: ${scores.p1} | P2: ${scores.p2}`;
    document.getElementById('turn-indicator').innerText = turn === 1 ? "P1'S TURN" : "P2'S TURN";
    document.getElementById('turn-indicator').style.color = turn === 1 ? p1.color : p2.color;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Floor
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 380, canvas.width, 20);

    // Wind Indicator
    ctx.fillStyle = '#d29922';
    ctx.font = '14px Arial';
    ctx.fillText(`WIND: ${wind.toFixed(1)}`, canvas.width/2 - 30, 50);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 60);
    ctx.lineTo(canvas.width/2 + wind * 20, 60);
    ctx.strokeStyle = '#d29922';
    ctx.stroke();

    // Players
    drawPlayer(p1);
    drawPlayer(p2);

    // Arrow
    if (arrow) {
        const angle = Math.atan2(arrow.vy, arrow.vx);
        ctx.save();
        ctx.translate(arrow.x, arrow.y);
        ctx.rotate(angle);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(0, 0); ctx.stroke();
        ctx.restore();
    }
}

function drawPlayer(p) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 15, p.y - 40, 30, 40);
    // Bow
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(p.x, p.y - 20);
    ctx.rotate(p.angle);
    ctx.beginPath();
    ctx.arc(0, 0, 20, -Math.PI/2, Math.PI/2);
    ctx.stroke();
    // Power bar
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(-20, 30, 40, 5);
    ctx.fillStyle = p.color;
    ctx.fillRect(-20, 30, (p.power/20) * 40, 5);
    ctx.restore();
}

function startGame() {
    gameActive = true; scores = { p1: 0, p2: 0 }; turn = 1; arrow = null;
    wind = (Math.random() - 0.5) * 4;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame(msg) {
    gameActive = false;
    document.getElementById('win-message').innerText = msg;
    document.getElementById('game-over').classList.remove('hidden');
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
