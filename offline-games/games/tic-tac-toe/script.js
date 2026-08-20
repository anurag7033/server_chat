const boardEl = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('reset');
const winCountEl = document.getElementById('win-count');
const pveBtn = document.getElementById('pve-btn');
const pvpBtn = document.getElementById('pvp-btn');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let vsCPU = true;
let wins = localStorage.getItem('ttt_wins') || 0;
winCountEl.textContent = wins;

const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

cells.forEach(cell => cell.addEventListener('click', () => handleCellClick(cell)));
resetBtn.addEventListener('click', resetGame);
pveBtn.addEventListener('click', () => { vsCPU = true; pveBtn.classList.add('active'); pvpBtn.classList.remove('active'); resetGame(); });
pvpBtn.addEventListener('click', () => { vsCPU = false; pvpBtn.classList.add('active'); pveBtn.classList.remove('active'); resetGame(); });

function handleCellClick(cell) {
    const index = cell.dataset.index;
    if (board[index] !== '' || !gameActive) return;

    makeMove(index, currentPlayer);

    if (gameActive && vsCPU && currentPlayer === 'O') {
        setTimeout(cpuMove, 500);
    }
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].textContent = player;

    if (checkWin(player)) {
        statusEl.textContent = `${player} Wins!`;
        gameActive = false;
        if (player === 'X') {
            wins++;
            localStorage.setItem('ttt_wins', wins);
            winCountEl.textContent = wins;
        }
        return;
    }

    if (board.every(cell => cell !== '')) {
        statusEl.textContent = "It's a Draw!";
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusEl.textContent = vsCPU && currentPlayer === 'O' ? "CPU is thinking..." : `${currentPlayer}'s Turn`;

    if (vsCPU && currentPlayer === 'O' && gameActive) {
        setTimeout(cpuMove, 500);
    }
}

function checkWin(player) {
    return winPatterns.some(pattern => {
        return pattern.every(index => board[index] === player);
    });
}

function cpuMove() {
    const bestMove = minimax(board, 'O').index;
    makeMove(bestMove, 'O');
}

function minimax(newBoard, player) {
    const availSpots = newBoard.map((v, i) => v === '' ? i : null).filter(v => v !== null);

    if (checkWin('X')) return { score: -10 };
    if (checkWin('O')) return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
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

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    statusEl.textContent = "Your Turn (X)";
    cells.forEach(cell => cell.textContent = '');
}
