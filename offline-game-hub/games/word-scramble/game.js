const words = [
    { word: 'NEON', hint: 'The glowing style of this arcade.' },
    { word: 'ZOMBIE', hint: 'A brain-eating undead creature.' },
    { word: 'NINJA', hint: 'A stealthy warrior from Japan.' },
    { word: 'ROCKET', hint: 'Used to launch into space.' },
    { word: 'PUZZLE', hint: 'A game that tests your logic.' },
    { word: 'ARCADE', hint: 'A place to play video games.' },
    { word: 'OFFLINE', hint: 'When you don\'t have internet.' },
    { word: 'CANVAS', hint: 'HTML element for drawing games.' },
    { word: 'PIXEL', hint: 'Smallest element of a digital image.' },
    { word: 'PYTHON', hint: 'A popular programming language.' },
    { word: 'KOTLIN', hint: 'Modern language for Android development.' },
    { word: 'BROWSER', hint: 'App used to access the web.' },
    { word: 'SMARTPHONE', hint: 'A mobile phone with advanced features.' },
    { word: 'COMPUTER', hint: 'An electronic device for processing data.' }
];

class WordScramble {
    constructor() {
        this.wordEl = document.getElementById('word');
        this.hintEl = document.getElementById('hint');
        this.inputEl = document.getElementById('user-input');
        this.scoreEl = document.getElementById('score');
        this.timerEl = document.getElementById('timer');

        this.score = 0;
        this.timer = 30;
        this.timerInterval = null;
        this.currentWord = '';

        this.init();
        this.setupEvents();
    }

    init() {
        this.score = 0;
        this.timer = 30;
        this.scoreEl.innerText = '0';
        this.timerEl.innerText = '30';
        this.nextWord();
        this.startTimer();
        document.getElementById('game-over').classList.add('hidden');
        this.inputEl.value = '';
        this.inputEl.focus();
    }

    nextWord() {
        const item = words[Math.floor(Math.random() * words.length)];
        this.currentWord = item.word;
        this.hintEl.innerText = `Hint: ${item.hint}`;

        let scrambled = this.currentWord.split('').sort(() => Math.random() - 0.5).join('');
        while (scrambled === this.currentWord) {
            scrambled = this.currentWord.split('').sort(() => Math.random() - 0.5).join('');
        }
        this.wordEl.innerText = scrambled;
        this.inputEl.value = '';
    }

    check() {
        const userWord = this.inputEl.value.toUpperCase();
        if (userWord === this.currentWord) {
            this.score++;
            this.scoreEl.innerText = this.score;
            this.timer += 5; // Bonus time
            this.nextWord();
            this.flashEffect('#3fb950');
        } else {
            this.flashEffect('#f85149');
        }
    }

    flashEffect(color) {
        this.inputEl.style.borderColor = color;
        setTimeout(() => this.inputEl.style.borderColor = '#30363d', 300);
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.timerEl.innerText = this.timer;
            if (this.timer <= 0) this.endGame();
        }, 1000);
    }

    endGame() {
        clearInterval(this.timerInterval);
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').innerText = this.score;
        const best = parseInt(localStorage.getItem('highScore_word-scramble') || 0);
        if (this.score > best) localStorage.setItem('highScore_word-scramble', this.score);
    }

    setupEvents() {
        document.getElementById('check-btn').onclick = () => this.check();
        document.getElementById('skip-btn').onclick = () => {
            this.timer -= 3; // Penalty
            this.nextWord();
        };
        document.getElementById('restart-btn').onclick = () => this.init();

        this.inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') this.check();
        };
    }
}

new WordScramble();
