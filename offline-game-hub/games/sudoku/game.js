class Sudoku {
    constructor() {
        this.boardEl = document.getElementById('sudoku-board');
        this.numPadEl = document.getElementById('num-pad');
        this.timerEl = document.getElementById('timer');
        this.diffSelect = document.getElementById('difficulty');

        this.grid = [];
        this.initial = [];
        this.selected = null;
        this.timer = 0;
        this.timerInterval = null;

        this.init();
        this.setupEvents();
    }

    init() {
        this.stopTimer();
        this.timer = 0;
        this.updateTimerDisplay();
        this.generate();
        this.render();
        this.startTimer();
        document.getElementById('win-screen').classList.add('hidden');
    }

    generate() {
        // Create full solved board
        const solved = Array(81).fill(0);
        this.solve(solved);

        // Remove numbers based on difficulty
        const diff = this.diffSelect.value;
        const removeCount = { easy: 30, medium: 45, hard: 55 }[diff];

        this.grid = [...solved];
        const indices = Array.from({length: 81}, (_, i) => i).sort(() => Math.random() - 0.5);
        for (let i = 0; i < removeCount; i++) {
            this.grid[indices[i]] = 0;
        }
        this.initial = [...this.grid];
    }

    solve(board) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) {
                const r = Math.floor(i / 9);
                const c = i % 9;
                const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
                for (let n of nums) {
                    if (this.isValid(board, r, c, n)) {
                        board[i] = n;
                        if (this.solve(board)) return true;
                        board[i] = 0;
                    }
                }
                return false;
            }
        }
        return true;
    }

    isValid(board, r, c, n) {
        for (let i = 0; i < 9; i++) {
            if (board[r * 9 + i] === n || board[i * 9 + c] === n) return false;
        }
        const sr = Math.floor(r / 3) * 3;
        const sc = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[(sr + i) * 9 + (sc + j)] === n) return false;
            }
        }
        return true;
    }

    render() {
        this.boardEl.innerHTML = '';
        this.grid.forEach((val, i) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (this.initial[i] !== 0) cell.classList.add('fixed');
            if (this.selected === i) cell.classList.add('selected');
            cell.innerText = val === 0 ? '' : val;
            cell.onclick = () => {
                if (this.initial[i] === 0) {
                    this.selected = i;
                    this.render();
                }
            };
            this.boardEl.appendChild(cell);
        });

        // Num Pad
        this.numPadEl.innerHTML = '';
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.className = 'num-btn';
            btn.innerText = i;
            btn.onclick = () => this.input(i);
            this.numPadEl.appendChild(btn);
        }
    }

    input(n) {
        if (this.selected !== null) {
            this.grid[this.selected] = n;
            this.render();
            this.checkWin();
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    updateTimerDisplay() {
        const m = Math.floor(this.timer / 60).toString().padStart(2, '0');
        const s = (this.timer % 60).toString().padStart(2, '0');
        this.timerEl.innerText = `${m}:${s}`;
    }

    checkWin() {
        if (!this.grid.includes(0)) {
            // Verify board (simple check)
            let win = true;
            for(let i=0; i<81; i++) {
                const val = this.grid[i];
                this.grid[i] = 0;
                if(!this.isValid(this.grid, Math.floor(i/9), i%9, val)) {
                    win = false;
                    this.grid[i] = val;
                    break;
                }
                this.grid[i] = val;
            }
            if (win) {
                this.stopTimer();
                document.getElementById('win-screen').classList.remove('hidden');
                document.getElementById('final-time').innerText = this.timerEl.innerText;
                const best = parseInt(localStorage.getItem('highScore_sudoku') || 99999);
                if (this.timer < best) localStorage.setItem('highScore_sudoku', this.timer);
            }
        }
    }

    setupEvents() {
        document.getElementById('erase-btn').onclick = () => this.input(0);
        document.getElementById('new-game-btn').onclick = () => this.init();
        document.getElementById('play-again-btn').onclick = () => this.init();
        this.diffSelect.onchange = () => this.init();

        // Key support
        window.onkeydown = (e) => {
            if (e.key >= '1' && e.key <= '9') this.input(parseInt(e.key));
            if (e.key === 'Backspace' || e.key === '0') this.input(0);
        };
    }
}

new Sudoku();
