class Minesweeper {
    constructor() {
        this.gridEl = document.getElementById('grid');
        this.mineCountEl = document.getElementById('mine-count');
        this.timerEl = document.getElementById('timer');
        this.difficultySelect = document.getElementById('difficulty');

        this.settings = {
            easy: { rows: 9, cols: 9, mines: 10 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };

        this.rows = 0;
        this.cols = 0;
        this.mineTotal = 0;
        this.grid = [];
        this.mines = new Set();
        this.flagged = new Set();
        this.revealed = new Set();
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;

        this.init();
        this.setupEvents();
    }

    init() {
        const diff = this.difficultySelect.value;
        const config = this.settings[diff];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineTotal = config.mines;

        this.gameOver = false;
        this.mines.clear();
        this.flagged.clear();
        this.revealed.clear();
        this.stopTimer();
        this.timer = 0;
        this.timerEl.innerText = '000';
        this.mineCountEl.innerText = this.mineTotal;

        this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        this.createGrid();
        this.plantMines();

        document.getElementById('game-over').classList.add('hidden');
        document.getElementById('win-screen').classList.add('hidden');
    }

    createGrid() {
        this.gridEl.innerHTML = '';
        this.grid = [];
        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                // Click handlers
                cell.onclick = (e) => this.revealCell(r, c);
                cell.oncontextmenu = (e) => {
                    e.preventDefault();
                    this.toggleFlag(r, c);
                };

                // Mobile long press for flag
                let timer;
                cell.ontouchstart = () => { timer = setTimeout(() => this.toggleFlag(r, c), 500); };
                cell.ontouchend = () => clearTimeout(timer);

                this.gridEl.appendChild(cell);
                this.grid[r][c] = cell;
            }
        }
    }

    plantMines() {
        while (this.mines.size < this.mineTotal) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            this.mines.add(`${r},${c}`);
        }
    }

    startTimer() {
        if (!this.timerInterval) {
            this.timerInterval = setInterval(() => {
                this.timer++;
                this.timerEl.innerText = this.timer.toString().padStart(3, '0');
            }, 1000);
        }
    }

    stopTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
    }

    revealCell(r, c) {
        if (this.gameOver || this.flagged.has(`${r},${c}`) || this.revealed.has(`${r},${c}`)) return;

        this.startTimer();

        if (this.mines.has(`${r},${c}`)) {
            this.endGame(false);
            return;
        }

        this.revealed.add(`${r},${c}`);
        const cell = this.grid[r][c];
        cell.classList.add('revealed');

        const mineCount = this.countNeighboringMines(r, c);
        if (mineCount > 0) {
            cell.innerText = mineCount;
            cell.classList.add(`val-${mineCount}`);
        } else {
            // Flood fill
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        this.revealCell(nr, nc);
                    }
                }
            }
        }

        if (this.revealed.size === (this.rows * this.cols) - this.mineTotal) {
            this.endGame(true);
        }
    }

    countNeighboringMines(r, c) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (this.mines.has(`${r + dr},${c + dc}`)) count++;
            }
        }
        return count;
    }

    toggleFlag(r, c) {
        if (this.gameOver || this.revealed.has(`${r},${c}`)) return;

        const key = `${r},${c}`;
        if (this.flagged.has(key)) {
            this.flagged.delete(key);
            this.grid[r][c].classList.remove('flagged');
        } else {
            if (this.flagged.size < this.mineTotal) {
                this.flagged.add(key);
                this.grid[r][c].classList.add('flagged');
            }
        }
        this.mineCountEl.innerText = this.mineTotal - this.flagged.size;
    }

    endGame(win) {
        this.gameOver = true;
        this.stopTimer();

        if (win) {
            document.getElementById('win-screen').classList.remove('hidden');
            document.getElementById('final-time').innerText = this.timer;
            // Save score
            const best = parseInt(localStorage.getItem('highScore_minesweeper') || 9999);
            if (this.timer < best) localStorage.setItem('highScore_minesweeper', this.timer);
        } else {
            document.getElementById('game-over').classList.remove('hidden');
            // Show all mines
            this.mines.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                this.grid[r][c].classList.add('mine');
                this.grid[r][c].innerText = '💣';
            });
        }
    }

    setupEvents() {
        this.difficultySelect.onchange = () => this.init();
        document.getElementById('restart-btn').onclick = () => this.init();
        document.getElementById('play-again-btn').onclick = () => this.init();
    }
}

new Minesweeper();
