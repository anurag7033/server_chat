document.addEventListener('DOMContentLoaded', () => {
    // Load high scores from localStorage
    const scores = {
        racing: localStorage.getItem('racing_highscore') || 0,
        memory: localStorage.getItem('memory_highscore') || 0,
        ttt: localStorage.getItem('ttt_wins') || 0,
        sudoku: localStorage.getItem('sudoku_wins') || 0,
        snake: localStorage.getItem('snake_highscore') || 0,
        zombie: localStorage.getItem('zombie_highscore') || 0
    };

    // Update UI
    document.getElementById('score-racing').textContent = scores.racing;
    document.getElementById('score-memory').textContent = scores.memory;
    document.getElementById('score-ttt').textContent = scores.ttt;
    document.getElementById('score-sudoku').textContent = scores.sudoku;
    document.getElementById('score-snake').textContent = scores.snake;
    document.getElementById('score-zombie').textContent = scores.zombie;
});
