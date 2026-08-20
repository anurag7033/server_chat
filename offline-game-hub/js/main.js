// Global Game Hub Logic
document.addEventListener('DOMContentLoaded', () => {
    const gameGrid = document.getElementById('game-grid');
    const searchInput = document.getElementById('search-input');
    const categoryBtns = document.querySelectorAll('.cat-btn');

    // Sample Game Data (Will expand as we add more)
    const games = [
        { id: 'car-racing', name: 'Car Racing', category: 'racing', desc: 'Endless highway dodging action.', diff: 'medium', icon: '🏎️' },
        { id: 'highway-racer', name: 'Highway Racer', category: 'racing', desc: 'High-speed traffic overtaking.', diff: 'medium', icon: '🏎️' },
        { id: 'zombie-shooter', name: 'Zombie Shooter', category: 'action', desc: 'Survive the undead waves.', diff: 'hard', icon: '🧟' },
        { id: 'space-shooter', name: 'Space Shooter', category: 'action', desc: 'Defend the galaxy from aliens.', diff: 'medium', icon: '🚀' },
        { id: 'ninja-runner', name: 'Ninja Runner', category: 'arcade', desc: 'Fast-paced endless platformer.', diff: 'hard', icon: '🥷' },
        { id: '2048', name: '2048', category: 'puzzle', desc: 'Merge the numbers to reach 2048.', diff: 'medium', icon: '🔢' },
        { id: 'minesweeper', name: 'Minesweeper', category: 'puzzle', desc: 'Clear the grid without hitting mines.', diff: 'hard', icon: '💣' },
        { id: 'sudoku', name: 'Sudoku', category: 'puzzle', desc: 'Logic-based number placement.', diff: 'hard', icon: '🔢' },
        { id: 'memory-card', name: 'Memory Card', category: 'puzzle', desc: 'Classic pair matching brain game.', diff: 'easy', icon: '🧠' },
        { id: 'tic-tac-toe', name: 'Tic Tac Toe', category: 'puzzle', desc: 'Play against an unbeatable AI.', diff: 'hard', icon: '⭕' },
        { id: 'word-scramble', name: 'Word Scramble', category: 'puzzle', desc: 'Unscramble the letters to find words.', diff: 'easy', icon: '🔤' },
        { id: 'simon-says', name: 'Simon Says', category: 'arcade', desc: 'Repeat the sequence of colors.', diff: 'medium', icon: '🧠' },
        { id: 'snake', name: 'Snake', category: 'arcade', desc: 'Classic hungry snake game.', diff: 'easy', icon: '🐍' },
        { id: 'pong', name: 'Pong', category: 'arcade', desc: 'Classic table tennis against AI.', diff: 'easy', icon: '🏓' },
        { id: 'breakout', name: 'Breakout', category: 'arcade', desc: 'Smash bricks with a bouncing ball.', diff: 'medium', icon: '🧱' },
        { id: 'flappy-bird', name: 'Flappy Bird', category: 'arcade', desc: 'Flap your wings and avoid pipes.', diff: 'hard', icon: '🐦' },
        { id: 'dinosaur-runner', name: 'Dinosaur Runner', category: 'arcade', desc: 'Dodge obstacles in the desert.', diff: 'medium', icon: '🦖' },
        { id: 'jump-runner', name: 'Jump Runner', category: 'arcade', desc: 'Jump high on platforms and avoid falling.', diff: 'medium', icon: '🏃' },
        { id: 'zombie-survival', name: 'Zombie Survival', category: 'adventure', desc: 'Survive day and night waves.', diff: 'hard', icon: '🧟' },
        { id: 'dungeon-crawler', name: 'Dungeon Crawler', category: 'adventure', desc: 'Explore rooms and find the key.', diff: 'medium', icon: '🧙' },
        { id: 'tower-defense', name: 'Tower Defense', category: 'adventure', desc: 'Protect your base with towers.', diff: 'hard', icon: '🗼' },
        { id: 'castle-defender', name: 'Castle Defender', category: 'action', desc: 'Defend your castle with arrows.', diff: 'medium', icon: '🏰' },
        { id: 'archery', name: 'Archery', category: 'arcade', desc: 'Master the bow and arrow.', diff: 'medium', icon: '🏹' },
        { id: 'two-player-fighting', name: '2P Fighting', category: '2player', desc: 'Local 1v1 neon combat.', diff: 'medium', icon: '⚔️' },
        { id: 'two-player-racing', name: '2P Racing', category: '2player', desc: 'Local split-keyboard racing.', diff: 'medium', icon: '🏎️' },
        { id: 'two-player-archery', name: '2P Archery', category: '2player', desc: 'Alternating arrow duel.', diff: 'hard', icon: '🏹' },
        { id: 'coin-battle', name: '2P Coin Battle', category: '2player', desc: 'Collect the most coins!', diff: 'easy', icon: '🪙' },
        { id: 'helicopter', name: 'Neon Copter', category: 'arcade', desc: 'Fly through narrow gaps.', diff: 'medium', icon: '🚁' },
        { id: 'shooting-gallery', name: 'Shooting Gallery', category: 'action', desc: 'Test your reaction speed.', diff: 'easy', icon: '🔫' },
        { id: 'alien-invasion', name: 'Alien Invasion', category: 'action', desc: 'Defend Earth from above.', diff: 'medium', icon: '👽' },
        { id: 'sword-fighter', name: 'Neon Blade', category: 'action', desc: 'Side-scrolling sword combat.', diff: 'hard', icon: '⚔️' },
        { id: 'space-survival', name: 'Void Survivor', category: 'adventure', desc: 'Endless space survival RPG.', diff: 'hard', icon: '🧑‍🚀' },
        { id: 'rocket-dodge', name: 'Rocket Dodge', category: 'arcade', desc: 'Dodge asteroids in space.', diff: 'medium', icon: '🚀' },
        { id: 'number-puzzle', name: 'Number Puzzle', category: 'puzzle', desc: 'Arrange numbers in order.', diff: 'easy', icon: '🔢' },
        { id: 'sliding-puzzle', name: 'Sliding Puzzle', category: 'puzzle', desc: 'The classic 15-puzzle.', diff: 'medium', icon: '🧩' },
        { id: 'find-difference', name: 'Find Difference', category: 'puzzle', desc: 'Find 5 differences in scenes.', diff: 'easy', icon: '🔍' }
    ];

    function renderGames(filter = 'all', search = '') {
        gameGrid.innerHTML = '';

        const filtered = games.filter(g => {
            const matchesCat = filter === 'all' || g.category === filter;
            const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
            return matchesCat && matchesSearch;
        });

        filtered.forEach(game => {
            const isFav = localStorage.getItem(`fav_${game.id}`) === 'true';
            const highScore = localStorage.getItem(`highScore_${game.id}`) || 0;

            const card = document.createElement('a');
            card.href = `games/${game.id}/index.html`;
            card.className = 'game-card';
            card.innerHTML = `
                <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${game.id}">★</button>
                <span class="card-icon">${game.icon}</span>
                <h3>${game.name}</h3>
                <p>${game.desc}</p>
                <div class="card-footer">
                    <span class="difficulty ${game.diff}">${game.diff}</span>
                    <span class="high-score">Best: ${highScore}</span>
                    <span class="play-btn">PLAY</span>
                </div>
            `;

            // Favorite Toggle Logic
            const favBtn = card.querySelector('.fav-btn');
            favBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = favBtn.dataset.id;
                const active = favBtn.classList.toggle('active');
                localStorage.setItem(`fav_${id}`, active);
            });

            gameGrid.appendChild(card);
        });
    }

    // Search Input Event
    searchInput.addEventListener('input', (e) => {
        const activeCat = document.querySelector('.cat-btn.active').dataset.cat;
        renderGames(activeCat, e.target.value);
    });

    // Category Filter Event
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderGames(btn.dataset.cat, searchInput.value);
        });
    });

    // Initial Render
    renderGames();
});

// Helper for games to save high score
window.saveScore = function(gameId, score) {
    const current = parseInt(localStorage.getItem(`highScore_${gameId}`) || 0);
    if (score > current) {
        localStorage.setItem(`highScore_${gameId}`, score);
    }
};

// Helper to get settings
window.getSettings = function() {
    return {
        sound: localStorage.getItem('hub_sound') !== 'false',
        music: localStorage.getItem('hub_music') !== 'false',
        vibrate: localStorage.getItem('hub_vibrate') !== 'false'
    };
};
