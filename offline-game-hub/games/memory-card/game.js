class MemoryGame {
    constructor() {
        this.gridEl = document.getElementById('grid');
        this.movesEl = document.getElementById('moves');
        this.timerEl = document.getElementById('timer');
        this.diffSelect = document.getElementById('difficulty');

        this.icons = ['🏎️', '🚀', '🥷', '🧟', '🐍', '🔢', '⭕', '🧠', '🏹', '🚁', '👽', '🔫', '💣', '🧙', '⚔️', '🏰', '🪙', '🎮'];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.lockBoard = false;

        this.init();
        this.setupEvents();
    }

    init() {
        const diff = this.diffSelect.value;
        const config = { easy: { r: 4, c: 4 }, medium: { r: 4, c: 5 }, hard: { r: 6, c: 6 } }[diff];
        const totalCards = config.r * config.c;
        const pairsCount = totalCards / 2;

        this.gridEl.style.gridTemplateColumns = `repeat(${config.c}, 1fr)`;
        this.moves = 0;
        this.matchedPairs = 0;
        this.timer = 0;
        this.movesEl.innerText = '0';
        this.timerEl.innerText = '0s';
        this.stopTimer();
        this.gridEl.innerHTML = '';
        this.flippedCards = [];
        this.lockBoard = false;
        document.getElementById('win-screen').classList.add('hidden');

        // Select icons and duplicate for pairs
        const gameIcons = [...this.icons.slice(0, pairsCount), ...this.icons.slice(0, pairsCount)];
        gameIcons.sort(() => Math.random() - 0.5);

        gameIcons.forEach(icon => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.icon = icon;
            card.innerHTML = `
                <div class="card-face card-back">?</div>
                <div class="card-face card-front">${icon}</div>
            `;
            card.onclick = () => this.flipCard(card);
            this.gridEl.appendChild(card);
        });
    }

    flipCard(card) {
        if (this.lockBoard || card === this.flippedCards[0] || card.classList.contains('matched')) return;

        this.startTimer();
        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.movesEl.innerText = this.moves;
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.icon === card2.dataset.icon;

        if (isMatch) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.flippedCards = [];
            if (this.matchedPairs === this.gridEl.children.length / 2) this.win();
        } else {
            this.lockBoard = true;
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.lockBoard = false;
            }, 1000);
        }
    }

    startTimer() {
        if (!this.timerInterval) {
            this.timerInterval = setInterval(() => {
                this.timer++;
                this.timerEl.innerText = `${this.timer}s`;
            }, 1000);
        }
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    win() {
        this.stopTimer();
        document.getElementById('win-screen').classList.remove('hidden');
        document.getElementById('final-moves').innerText = this.moves;
        document.getElementById('final-time').innerText = this.timer;

        const bestMoves = parseInt(localStorage.getItem(`bestMoves_memory_${this.diffSelect.value}`) || 999);
        if (this.moves < bestMoves) localStorage.setItem(`bestMoves_memory_${this.diffSelect.value}`, this.moves);
    }

    setupEvents() {
        this.diffSelect.onchange = () => this.init();
        document.getElementById('restart-btn').onclick = () => this.init();
    }
}

new MemoryGame();
