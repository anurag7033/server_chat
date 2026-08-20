document.addEventListener('DOMContentLoaded', () => {
    const gameIds = [
        'car-racing', 'memory-card', 'tic-tac-toe', 'sudoku', 'snake', 'zombie-shooter',
        'highway-racer', 'space-shooter', 'ninja-runner', '2048', 'minesweeper',
        'word-scramble', 'simon-says', 'pong', 'breakout', 'flappy-bird',
        'dino', 'jump', 'zombie-survival', 'dungeon-crawler', 'tower-defense',
        'castle-defender', 'archery', 'helicopter', 'shooting', 'aliens',
        'sword', 'void', 'rocket', 'number-puzzle', 'sliding-puzzle', 'find-difference'
    ];

    gameIds.forEach(id => {
        const score = localStorage.getItem(`highScore_${id}`) || 0;
        const el = document.getElementById(`score-${id}`);
        if (el) {
            el.textContent = score;
        }
    });
});
