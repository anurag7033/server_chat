const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

class Car {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.controls = controls;
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 5;
        this.accel = 0.2;
        this.friction = 0.96;
        this.w = 30;
        this.h = 15;
        this.laps = 0;
        this.checkpoints = [false, false]; // [mid, finish]
    }

    update() {
        if (keys[this.controls.up]) this.speed += this.accel;
        if (keys[this.controls.down]) this.speed -= this.accel;

        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (keys[this.controls.left]) this.angle -= 0.05 * flip;
            if (keys[this.controls.right]) this.angle += 0.05 * flip;
        }

        this.speed *= this.friction;
        if (Math.abs(this.speed) > this.maxSpeed) this.speed = this.maxSpeed * (this.speed > 0 ? 1 : -1);
        if (Math.abs(this.speed) < 0.1) this.speed = 0;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.checkTrack();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
        // Windows
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(5, -this.h/2 + 2, 10, this.h - 4);
        ctx.restore();
    }

    checkTrack() {
        // Track bounds (simple oval)
        const dx = this.x - 400;
        const dy = this.y - 300;
        const dist = Math.sqrt(dx*dx/(350*350) + dy*dy/(250*250));
        const innerDist = Math.sqrt(dx*dx/(200*200) + dy*dy/(100*100));

        if (dist > 1 || innerDist < 1) {
            this.speed *= 0.8; // Grass slowdown
        }

        // Checkpoints
        // Finish line is at x=400, y > 300
        if (this.x > 380 && this.x < 420 && this.y > 400) {
            if (this.checkpoints[0]) {
                this.laps++;
                this.checkpoints = [false, false];
                if (this.laps >= 3) endGame(this.color === '#00f2ff' ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!');
            }
        }
        // Midpoint at x=400, y < 200
        if (this.x > 380 && this.x < 420 && this.y < 200) {
            this.checkpoints[0] = true;
        }
    }
}

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

const p1 = new Car(400, 500, '#00f2ff', { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' });
const p2 = new Car(400, 530, '#f85149', { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' });

let gameActive = false;
let startTime = 0;

function drawTrack() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 150;
    ctx.beginPath();
    ctx.ellipse(400, 300, 275, 175, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Grass
    ctx.fillStyle = '#0a0b10';
    ctx.beginPath();
    ctx.ellipse(400, 300, 200, 100, 0, 0, Math.PI * 2);
    ctx.fill();

    // Finish Line
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(400, 400);
    ctx.lineTo(400, 550);
    ctx.stroke();
    ctx.setLineDash([]);
}

function update() {
    if (!gameActive) return;

    p1.update();
    p2.update();

    const time = ((Date.now() - startTime) / 1000).toFixed(1);
    document.getElementById('timer').innerText = time + 's';
    document.getElementById('laps').innerText = `P1 LAP: ${p1.laps+1} | P2 LAP: ${p2.laps+1}`;

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrack();
    p1.draw();
    p2.draw();
}

function startGame() {
    gameActive = true;
    startTime = Date.now();
    p1.x = 400; p1.y = 500; p1.angle = 0; p1.speed = 0; p1.laps = 0;
    p2.x = 400; p2.y = 530; p2.angle = 0; p2.speed = 0; p2.laps = 0;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    update();
}

function endGame(msg) {
    gameActive = false;
    document.getElementById('win-message').innerText = msg;
    document.getElementById('finish-time').innerText = 'Time: ' + document.getElementById('timer').innerText;
    document.getElementById('game-over').classList.remove('hidden');
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;

draw();
