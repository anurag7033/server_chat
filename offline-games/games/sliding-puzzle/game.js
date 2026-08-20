class SlidingPuzzle {
    constructor() {
        this.gridEl = document.getElementById('grid');
        this.movesEl = document.getElementById('moves');
        this.winScreen = document.getElementById('win-screen');

        this.size = 4;
        this.tiles = [];
        this.moves = 0;
        this.gameActive = false;

        this.init();
        this.setupEvents();
    }

    init() {
        this.tiles = [...Array(this.size * this.size - 1).keys()].map(i => i + 1);
        this.tiles.push(null);
        this.shuffle();
        this.moves = 0;
        this.updateUI();
        this.render();
        this.gameActive = true;
        this.winScreen.classList.add('hidden');
    }

    shuffle() {
        for (let i = 0; i < 300; i++) {
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
            this.winScreen.classList.remove('hidden');
            document.getElementById('final-moves').innerText = `Moves: ${this.moves}`;
        }
    }

    updateUI() { this.movesEl.innerText = this.moves; }

    setupEvents() {
        document.getElementById('shuffle-btn').onclick = () => this.init();
        document.getElementById('restart-btn').onclick = () => this.init();
    }
}
new SlidingPuzzle();
