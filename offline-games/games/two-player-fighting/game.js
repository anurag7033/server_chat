const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 500;

const GRAVITY = 0.8;

class Fighter {
    constructor({ position, velocity, color, offset, keys, name }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 50;
        this.height = 150;
        this.lastKey = '';
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset,
            width: 100,
            height: 50
        };
        this.color = color;
        this.isAttacking = false;
        this.health = 100;
        this.keys = keys;
        this.name = name;
        this.isJumping = false;
    }

    draw() {
        // Character Body
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15; ctx.shadowColor = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
        ctx.shadowBlur = 0;

        // Attack Box (only when attacking)
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height
            );
        }
    }

    update() {
        this.draw();
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Gravity & Floor
        if (this.position.y + this.height + this.velocity.y >= canvas.height - 20) {
            this.velocity.y = 0;
            this.position.y = canvas.height - 20 - this.height;
            this.isJumping = false;
        } else {
            this.velocity.y += GRAVITY;
        }

        // Screen Bounds
        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;
    }

    attack() {
        this.isAttacking = true;
        setTimeout(() => { this.isAttacking = false; }, 100);
    }
}

const p1 = new Fighter({
    position: { x: 100, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#00f2ff',
    offset: { x: 0, y: 0 },
    name: 'Player 1'
});

const p2 = new Fighter({
    position: { x: 850, y: 0 },
    velocity: { x: 0, y: 0 },
    color: '#7000ff',
    offset: { x: -50, y: 0 },
    name: 'Player 2'
});

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowLeft: { pressed: false },
    ArrowUp: { pressed: false }
};

window.addEventListener('keydown', (e) => {
    // P1
    if (e.key === 'a') keys.a.pressed = true;
    if (e.key === 'd') keys.d.pressed = true;
    if (e.key === 'w' && !p1.isJumping) { p1.velocity.y = -20; p1.isJumping = true; }
    if (e.key === 'j') p1.attack();

    // P2
    if (e.key === 'ArrowLeft') keys.ArrowLeft.pressed = true;
    if (e.key === 'ArrowRight') keys.ArrowRight.pressed = true;
    if (e.key === 'ArrowUp' && !p2.isJumping) { p2.velocity.y = -20; p2.isJumping = true; }
    if (e.key === '1') p2.attack();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'a') keys.a.pressed = false;
    if (e.key === 'd') keys.d.pressed = false;
    if (e.key === 'ArrowLeft') keys.ArrowLeft.pressed = false;
    if (e.key === 'ArrowRight') keys.ArrowRight.pressed = false;
});

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x &&
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    );
}

let gameActive = false;
let timer = 60;
let timerId;

function decreaseTimer() {
    if (timer > 0) {
        timerId = setTimeout(decreaseTimer, 1000);
        timer--;
        document.getElementById('timer').innerText = timer;
    }
    if (timer === 0) determineWinner();
}

function determineWinner() {
    clearTimeout(timerId);
    gameActive = false;
    const msg = document.getElementById('win-message');
    document.getElementById('game-over').classList.remove('hidden');

    if (p1.health === p2.health) msg.innerText = 'DRAW!';
    else if (p1.health > p2.health) msg.innerText = 'P1 WINS!';
    else msg.innerText = 'P2 WINS!';
}

function animate() {
    if (!gameActive) return;
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background Floor
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);

    p1.update();
    p2.update();

    // P1 Movement
    p1.velocity.x = 0;
    if (keys.a.pressed) p1.velocity.x = -5;
    else if (keys.d.pressed) p1.velocity.x = 5;

    // P2 Movement
    p2.velocity.x = 0;
    if (keys.ArrowLeft.pressed) p2.velocity.x = -5;
    else if (keys.ArrowRight.pressed) p2.velocity.x = 5;

    // Collision Detection
    if (p1.isAttacking && rectangularCollision({ rectangle1: p1, rectangle2: p2 })) {
        p1.isAttacking = false;
        p2.health -= 10;
        document.getElementById('p2-hp').style.width = p2.health + '%';
        if (p2.health <= 0) determineWinner();
    }

    if (p2.isAttacking && rectangularCollision({ rectangle1: p2, rectangle2: p1 })) {
        p2.isAttacking = false;
        p1.health -= 10;
        document.getElementById('p1-hp').style.width = p1.health + '%';
        if (p1.health <= 0) determineWinner();
    }
}

function startGame() {
    gameActive = true;
    timer = 60;
    p1.health = 100;
    p2.health = 100;
    p1.position = { x: 100, y: 0 };
    p2.position = { x: 850, y: 0 };
    document.getElementById('p1-hp').style.width = '100%';
    document.getElementById('p2-hp').style.width = '100%';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    decreaseTimer();
    animate();
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = startGame;
