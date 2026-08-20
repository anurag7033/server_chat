const grid = document.getElementById('game-grid');
const timerEl = document.getElementById('timer');
const movesEl = document.getElementById('moves');
const bestEl = document.getElementById('best');
const symbols = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉', '🥑', '🥦', '🥕', '🌽', '🥨', '🌮', '🍕', '🍔', '🍦', '🍩'];

let cards = [];
let flippedCards = [];
let moves = 0;
let timer = 0;
let interval;
let gameStarted = false;
let currentDifficulty = 4;

function initGame(size) {
    currentDifficulty = size;
    const totalCards = size * 4;
    const pairs = totalCards / 2;
    const gameSymbols = [...symbols.slice(0, pairs), ...symbols.slice(0, pairs)];

    // Shuffle
    gameSymbols.sort(() => Math.random() - 0.5);

    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${size === 4 ? 4 : (size === 5 ? 5 : 6)}, 1fr)`;

    cards = [];
    flippedCards = [];
    moves = 0;
    timer = 0;
    gameStarted = false;
    clearInterval(interval);
    timerEl.textContent = '0';
    movesEl.textContent = '0';
    bestEl.textContent = localStorage.getItem(`memory_best_${size}`) || '--';

    gameSymbols.forEach((symbol, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-face card-front">?</div>
            <div class="card-face card-back">${symbol}</div>
        `;
        card.dataset.symbol = symbol;
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
        cards.push(card);
    });
}

function flipCard(card) {
    if (!gameStarted) {
        gameStarted = true;
        interval = setInterval(() => {
            timer++;
            timerEl.textContent = timer;
        }, 1000);
    }

    if (flippedCards.length < 2 && !card.classList.contains('flipped')) {
        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            moves++;
            movesEl.textContent = moves;
            checkMatch();
        }
    }
}

function checkMatch() {
    const [c1, c2] = flippedCards;
    if (c1.dataset.symbol === c2.dataset.symbol) {
        flippedCards = [];
        if (cards.every(c => c.classList.contains('flipped'))) {
            win();
        }
    } else {
        setTimeout(() => {
            c1.classList.remove('flipped');
            c2.classList.remove('flipped');
            flippedCards = [];
        }, 1000);
    }
}

function win() {
    clearInterval(interval);
    document.getElementById('win-message').classList.remove('hidden');

    const key = `memory_best_${currentDifficulty}`;
    const best = localStorage.getItem(key);
    if (!best || moves < parseInt(best)) {
        localStorage.setItem(key, moves);
        localStorage.setItem('memory_highscore', moves); // Main hub score
    }
}

// Start with 4x4
initGame(4);
