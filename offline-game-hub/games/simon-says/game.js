class SimonSays {
    constructor() {
        this.pads = document.querySelectorAll('.pad');
        this.startBtn = document.getElementById('start-btn-center');
        this.statusEl = document.getElementById('status');
        this.scoreEl = document.getElementById('score');
        this.highScoreEl = document.getElementById('high-score');

        this.sequence = [];
        this.userSequence = [];
        this.isWatching = true;
        this.score = 0;

        this.setupEvents();
        this.loadHighScore();
    }

    loadHighScore() {
        const best = localStorage.getItem('highScore_simon-says') || 0;
        this.highScoreEl.innerText = `BEST: ${best}`;
    }

    init() {
        this.sequence = [];
        this.score = 0;
        this.scoreEl.innerText = 'SCORE: 0';
        document.getElementById('game-over').classList.add('hidden');
        this.nextRound();
    }

    nextRound() {
        this.userSequence = [];
        this.sequence.push(Math.floor(Math.random() * 4));
        this.playSequence();
    }

    async playSequence() {
        this.isWatching = true;
        this.statusEl.innerText = "Watch carefully...";
        this.startBtn.innerText = "...";

        for (let id of this.sequence) {
            await this.flashPad(id);
            await new Promise(r => setTimeout(r, 300));
        }

        this.isWatching = false;
        this.statusEl.innerText = "Your turn!";
        this.startBtn.innerText = "GO!";
    }

    flashPad(id) {
        return new Promise(resolve => {
            const pad = this.pads[id];
            pad.classList.add('active');
            setTimeout(() => {
                pad.classList.remove('active');
                resolve();
            }, 600);
        });
    }

    handleInput(id) {
        if (this.isWatching) return;

        this.flashPad(id);
        this.userSequence.push(id);

        const currentIndex = this.userSequence.length - 1;
        if (this.userSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.endGame();
            return;
        }

        if (this.userSequence.length === this.sequence.length) {
            this.score++;
            this.scoreEl.innerText = `SCORE: ${this.score}`;
            setTimeout(() => this.nextRound(), 1000);
        }
    }

    endGame() {
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;

        const best = parseInt(localStorage.getItem('highScore_simon-says') || 0);
        if (this.score > best) {
            localStorage.setItem('highScore_simon-says', this.score);
            this.loadHighScore();
        }
    }

    setupEvents() {
        this.startBtn.onclick = () => {
            if (this.sequence.length === 0) this.init();
        };

        this.pads.forEach(pad => {
            pad.onclick = () => this.handleInput(parseInt(pad.dataset.id));
        });

        document.getElementById('restart-btn').onclick = () => this.init();
    }
}

new SimonSays();
