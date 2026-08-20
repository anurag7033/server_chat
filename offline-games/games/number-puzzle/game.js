class NumberPuzzle {
    constructor() {
        this.gridEl = document.getElementById('grid');
        this.movesEl = document.getElementById('moves');
        this.timerEl = document.getElementById('timer');
        this.winScreen = document.getElementById('win-screen');

        this.size = 3;
        this.tiles = [];
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.gameActive = false;

        this.init();
        this.setupEvents();
    }

    init() {
        this.tiles = [...Array(this.size * this.size - 1).keys()].map(i => i + 1);
        this.tiles.push(null); // Empty slot
        this.shuffle();
        this.moves = 0;
        this.timer = 0;
        this.updateUI();
        this.render();
        this.gameActive = true;
        this.startTimer();
        this.winScreen.classList.add('hidden');
    }

    shuffle() {
        // To ensure solvable, we do random valid moves
        for (let i = 0; i < 200; i++) {
            const emptyIdx = this.tiles.indexOf(null);
            const neighbors = this.getNeighbors(emptyIdx);
            const moveIdx = neighbors[Math.floor(Math.random() * neighbors.length)];
            [this.tiles[emptyIdx], this.tiles[moveIdx]] = [this.tiles[moveIdx], this.tiles[emptyIdx]];
        }
    }

    getNeighbors(idx) {
        const neighbors = [];
        const r = Math.floor(idx / this.size);
        const c = idx % this.size;

        if (r > 0) neighbors.push(idx - this.size);
        if (r < this.size - 1) neighbors.push(idx + this.size);
        if (c > 0) neighbors.push(idx - 1);
        if (c < this.size - 1) neighbors.push(idx + 1);

        return neighbors;
    }

    render() {
        this.gridEl.innerHTML = '';
        this.tiles.forEach((val, i) => {
            const tile = document.createElement('div');
            tile.className = 'tile' + (val === null ? ' empty' : '');
            tile.innerText = val || '';
            tile.onclick = () => this.handleMove(i);
            this.gridEl.appendChild(tile);
        });
    }

    handleMove(idx) {
        if (!this.gameActive || this.tiles[idx] === null) return;

        const emptyIdx = this.tiles.indexOf(null);
        const neighbors = this.getNeighbors(idx);

        if (neighbors.includes(emptyIdx)) {
            [this.tiles[idx], this.tiles[emptyIdx]] = [this.tiles[emptyIdx], this.tiles[idx]];
            this.moves++;
            this.updateUI();
            this.render();
            this.checkWin();
        }
    }

    checkWin() {
        const winState = [...Array(this.size * this.size - 1).keys()].map(i => i + 1);
        winState.push(null);

        if (JSON.stringify(this.tiles) === JSON.stringify(winState)) {
            this.gameActive = false;
            clearInterval(this.timerInterval);
            this.winScreen.classList.remove('hidden');
            document.getElementById('final-stats').innerText = `Moves: ${this.moves} | Time: ${this.timer}s`;
        }
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateUI();
        }, 1000);
    }

    updateUI() {
        this.movesEl.innerText = this.moves;
        this.timerEl.innerText = `${this.timer}s`;
    }

    setupEvents() {
        document.getElementById('shuffle-btn').onclick = () => this.init();
        document.getElementById('restart-btn').onclick = () => this.init();
    }
}

new NumberPuzzle();
