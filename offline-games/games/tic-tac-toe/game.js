class TicTacToe {
    constructor() {
        this.cells = document.querySelectorAll('.cell');
        this.statusEl = document.getElementById('status');
        this.pScoreEl = document.getElementById('player-score');
        this.aScoreEl = document.getElementById('ai-score');
        this.diffSelect = document.getElementById('difficulty');

        this.board = Array(9).fill(null);
        this.human = 'X';
        this.ai = 'O';
        this.isGameActive = true;
        this.scores = { player: 0, ai: 0 };

        this.init();
    }

    init() {
        this.board = Array(9).fill(null);
        this.isGameActive = true;
        this.statusEl.innerText = "Your Turn (X)";
        this.cells.forEach(cell => {
            cell.className = 'cell';
            cell.onclick = () => this.handleMove(cell.dataset.index);
        });
        document.getElementById('win-overlay').classList.add('hidden');
    }

    handleMove(index) {
        if (!this.isGameActive || this.board[index]) return;

        this.makeMove(index, this.human);

        if (this.checkWin(this.board, this.human)) {
            this.endGame('YOU WIN!');
            this.scores.player++;
            this.updateScores();
        } else if (this.board.every(cell => cell !== null)) {
            this.endGame('DRAW!');
        } else {
            this.isGameActive = false;
            this.statusEl.innerText = "AI Thinking...";
            setTimeout(() => this.aiMove(), 500);
        }
    }

    aiMove() {
        const diff = this.diffSelect.value;
        let move;

        if (diff === 'easy') {
            const available = this.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
            move = available[Math.floor(Math.random() * available.length)];
        } else if (diff === 'medium') {
            move = Math.random() < 0.5 ? this.minimax(this.board, this.ai).index : this.getRandomMove();
        } else {
            move = this.minimax(this.board, this.ai).index;
        }

        this.makeMove(move, this.ai);

        if (this.checkWin(this.board, this.ai)) {
            this.endGame('AI WINS!');
            this.scores.ai++;
            this.updateScores();
        } else if (this.board.every(cell => cell !== null)) {
            this.endGame('DRAW!');
        } else {
            this.isGameActive = true;
            this.statusEl.innerText = "Your Turn (X)";
        }
    }

    getRandomMove() {
        const available = this.board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        return available[Math.floor(Math.random() * available.length)];
    }

    makeMove(index, player) {
        this.board[index] = player;
        this.cells[index].classList.add(player.toLowerCase());
    }

    checkWin(board, player) {
        const wins = [
            [0,1,2], [3,4,5], [6,7,8], // rows
            [0,3,6], [1,4,7], [2,5,8], // cols
            [0,4,8], [2,4,6]           // diags
        ];
        return wins.some(w => w.every(i => board[i] === player));
    }

    minimax(newBoard, player) {
        const availSpots = newBoard.map((v, i) => v === null ? i : null).filter(v => v !== null);

        if (this.checkWin(newBoard, this.human)) return { score: -10 };
        if (this.checkWin(newBoard, this.ai)) return { score: 10 };
        if (availSpots.length === 0) return { score: 0 };

        const moves = [];
        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];
            newBoard[availSpots[i]] = player;

            if (player === this.ai) {
                const result = this.minimax(newBoard, this.human);
                move.score = result.score;
            } else {
                const result = this.minimax(newBoard, this.ai);
                move.score = result.score;
            }

            newBoard[availSpots[i]] = null;
            moves.push(move);
        }

        let bestMove;
        if (player === this.ai) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    }

    endGame(msg) {
        this.isGameActive = false;
        document.getElementById('win-message').innerText = msg;
        document.getElementById('win-overlay').classList.remove('hidden');
    }

    updateScores() {
        this.pScoreEl.innerText = this.scores.player;
        this.aScoreEl.innerText = this.scores.ai;
    }
}

const game = new TicTacToe();
document.getElementById('reset-btn').onclick = () => {
    game.scores = { player: 0, ai: 0 };
    game.updateScores();
    game.init();
};
document.getElementById('next-round-btn').onclick = () => game.init();
