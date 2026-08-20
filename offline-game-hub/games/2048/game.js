class Game2048 {
    constructor() {
        this.gridSize = 4;
        this.score = 0;
        this.grid = [];
        this.container = document.getElementById('grid-container');
        this.scoreEl = document.getElementById('score');
        this.bestEl = document.getElementById('best-score');
        this.gameOverEl = document.getElementById('game-over');
        this.winScreenEl = document.getElementById('win-screen');
        this.finalScoreEl = document.getElementById('final-score');

        this.init();
        this.setupEventListeners();
    }

    init() {
        this.grid = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(0));
        this.score = 0;
        this.scoreEl.innerText = '0';
        this.bestEl.innerText = localStorage.getItem('highScore_2048') || '0';
        this.container.innerHTML = '';

        // Create background cells
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            this.container.appendChild(cell);
        }

        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 0) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    render() {
        // Clear existing tiles
        const tiles = this.container.querySelectorAll('.tile');
        tiles.forEach(t => t.remove());

        const cellSize = this.container.clientWidth / 4;
        const padding = 10;
        const actualTileSize = (this.container.clientWidth - (padding * 5)) / 4;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const val = this.grid[r][c];
                if (val !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${val}`;
                    tile.innerText = val;
                    tile.style.left = `${padding + c * (actualTileSize + padding)}px`;
                    tile.style.top = `${padding + r * (actualTileSize + padding)}px`;
                    tile.style.width = `${actualTileSize}px`;
                    tile.style.height = `${actualTileSize}px`;
                    this.container.appendChild(tile);
                }
            }
        }
    }

    move(direction) {
        let moved = false;
        const newGrid = JSON.parse(JSON.stringify(this.grid));

        if (direction === 'left' || direction === 'right') {
            for (let r = 0; r < this.gridSize; r++) {
                let row = newGrid[r].filter(val => val !== 0);
                if (direction === 'right') row.reverse();

                for (let i = 0; i < row.length - 1; i++) {
                    if (row[i] === row[i+1]) {
                        row[i] *= 2;
                        this.score += row[i];
                        row.splice(i + 1, 1);
                        if (row[i] === 2048) this.showWin();
                    }
                }

                while (row.length < this.gridSize) row.push(0);
                if (direction === 'right') row.reverse();

                if (JSON.stringify(newGrid[r]) !== JSON.stringify(row)) moved = true;
                newGrid[r] = row;
            }
        } else {
            for (let c = 0; c < this.gridSize; c++) {
                let col = [];
                for (let r = 0; r < this.gridSize; r++) col.push(newGrid[r][c]);
                col = col.filter(val => val !== 0);
                if (direction === 'down') col.reverse();

                for (let i = 0; i < col.length - 1; i++) {
                    if (col[i] === col[i+1]) {
                        col[i] *= 2;
                        this.score += col[i];
                        col.splice(i + 1, 1);
                        if (col[i] === 2048) this.showWin();
                    }
                }

                while (col.length < this.gridSize) col.push(0);
                if (direction === 'down') col.reverse();

                for (let r = 0; r < this.gridSize; r++) {
                    if (newGrid[r][c] !== col[r]) moved = true;
                    newGrid[r][c] = col[r];
                }
            }
        }

        if (moved) {
            this.grid = newGrid;
            this.addRandomTile();
            this.scoreEl.innerText = this.score;
            this.render();
            this.checkGameOver();
        }
    }

    checkGameOver() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === 0) return;
                if (c < this.gridSize - 1 && this.grid[r][c] === this.grid[r][c+1]) return;
                if (r < this.gridSize - 1 && this.grid[r][c] === this.grid[r+1][c]) return;
            }
        }
        this.finalScoreEl.innerText = this.score;
        this.gameOverEl.classList.remove('hidden');

        const best = parseInt(localStorage.getItem('highScore_2048') || 0);
        if (this.score > best) localStorage.setItem('highScore_2048', this.score);
    }

    showWin() {
        this.winScreenEl.classList.remove('hidden');
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.move('left');
            if (e.key === 'ArrowRight') this.move('right');
            if (e.key === 'ArrowUp') this.move('up');
            if (e.key === 'ArrowDown') this.move('down');
        });

        // Swipe support
        let touchStartX, touchStartY;
        this.container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) this.move(dx > 0 ? 'right' : 'left');
            } else {
                if (Math.abs(dy) > 30) this.move(dy > 0 ? 'down' : 'up');
            }
        }, { passive: true });

        document.getElementById('restart-btn').onclick = () => {
            this.gameOverEl.classList.add('hidden');
            this.init();
        };

        document.getElementById('continue-btn').onclick = () => {
            this.winScreenEl.classList.add('hidden');
        };
    }
}

new Game2048();
