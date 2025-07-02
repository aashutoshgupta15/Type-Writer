class TypingTest {
  constructor() {
    this.mode = 'normal';
    this.running = false;
    this.timeLeft = 60;
    this.wpm = 0;
    this.accuracy = 100;
    this.errors = 0;
    this.level = 1;
    this.practiceTime = +localStorage.getItem('practiceTime') || 0;
    this.history = JSON.parse(localStorage.getItem('typingHistory') || '[]');
    this.text = '';
    this.startTime = null;

    this.elements = this.selectElements();
    this.initTheme();
    this.bindEvents();
    this.renderStats();
  }

  selectElements() {
    return {
      textDisplay: document.getElementById('text-display'),
      input: document.getElementById('input-area'),
      timer: document.getElementById('timer'),
      wpm: document.getElementById('wpm'),
      accuracy: document.getElementById('accuracy'),
      errors: document.getElementById('errors'),
      level: document.getElementById('level'),
      start: document.getElementById('start-btn'),
      submit: document.getElementById('submit-btn'),
      reset: document.getElementById('reset-btn'),
      practice: document.getElementById('practice-btn'),
      difficulty: document.getElementById('difficulty'),
      modeBtns: document.querySelectorAll('.mode-btn'),
      results: document.getElementById('results'),
      resultWpm: document.getElementById('result-wpm'),
      resultAcc: document.getElementById('result-accuracy'),
      resultWords: document.getElementById('result-words'),
      resultTime: document.getElementById('result-time'),
      resultErrors: document.getElementById('result-errors'),
      resultLevel: document.getElementById('result-level'),
      avgWpm: document.getElementById('avg-wpm'),
      bestWpm: document.getElementById('best-wpm'),
      totalTests: document.getElementById('total-tests'),
      practiceTime: document.getElementById('practice-time'),
      themeBtn: document.querySelector('.theme-switch'),
      themeIcon: document.querySelector('.theme-icon')
    };
  }

  bindEvents() {
    this.elements.start.onclick = () => this.startTest();
    this.elements.submit.onclick = () => this.finishTest();
    this.elements.reset.onclick = () => this.reset();
    this.elements.practice.onclick = () => document.body.classList.toggle('practice-mode');
    this.elements.input.oninput = () => this.trackInput();
    this.elements.difficulty.onchange = () => this.reset();
    this.elements.modeBtns.forEach(btn => {
      btn.onclick = () => {
        this.mode = btn.dataset.mode;
        this.elements.modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.reset();
      }
    });
    this.elements.themeBtn.onclick = () => this.toggleTheme();
  }

  initTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    this.elements.themeIcon.textContent = theme === 'light' ? '🌞' : '🌙';
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    this.elements.themeIcon.textContent = next === 'light' ? '🌞' : '🌙';
  }

  async fetchText() {
    try {
      const res = await fetch('https://api.quotable.io/random?minLength=120&maxLength=180');
      const data = await res.json();
      return data.content;
    } catch {
      return 'Fallback text: The quick brown fox jumps over the lazy dog.';
    }
  }

  async startTest() {
    this.reset();
    this.text = await this.fetchText();
    this.elements.textDisplay.textContent = this.text;
    this.elements.input.disabled = false;
    this.elements.input.value = '';
    this.elements.input.focus();
    this.running = true;
    this.startTime = Date.now();
    this.countdown = setInterval(() => this.tick(), 1000);
    this.elements.start.disabled = true;
    this.elements.submit.disabled = false;
    this.elements.reset.disabled = false;
  }

  tick() {
    this.timeLeft--;
    this.elements.timer.textContent = this.timeLeft;
    if (this.timeLeft <= 0) this.finishTest();
  }

  finishTest() {
    clearInterval(this.countdown);
    this.running = false;
    const input = this.elements.input.value;
    const words = input.trim().split(/\s+/).length;
    const mins = (Date.now() - this.startTime) / 60000;
    this.wpm = Math.round(words / mins);
    this.accuracy = this.calcAccuracy(input);
    this.level = this.wpm > this.level * 10 ? this.level + 1 : this.level;

    const result = {
      wpm: this.wpm,
      accuracy: this.accuracy,
      level: this.level,
      time: 60 - this.timeLeft,
      words
    };

    this.history.push(result);
    localStorage.setItem('typingHistory', JSON.stringify(this.history));
    this.renderResults(result);
    this.renderStats();
    this.elements.input.disabled = true;
  }

  calcAccuracy(input) {
    let correct = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === this.text[i]) correct++;
    }
    const acc = Math.round((correct / input.length) * 100) || 0;
    this.errors = input.length - correct;
    return acc;
  }

  trackInput() {
    if (!this.running) return;
    const input = this.elements.input.value;
    this.accuracy = this.calcAccuracy(input);
    this.wpm = this.calcWPM(input);
    this.elements.wpm.textContent = this.wpm;
    this.elements.accuracy.textContent = this.accuracy;
    this.elements.errors.textContent = this.errors;
    this.elements.level.textContent = this.level;
  }

  calcWPM(input) {
    const words = input.trim().split(/\s+/).length;
    const mins = (Date.now() - this.startTime) / 60000;
    return Math.round(words / mins);
  }

  renderResults(r) {
    this.elements.results.style.display = 'block';
    this.elements.resultWpm.textContent = r.wpm;
    this.elements.resultAcc.textContent = `${r.accuracy}%`;
    this.elements.resultWords.textContent = r.words;
    this.elements.resultTime.textContent = `${r.time}s`;
    this.elements.resultErrors.textContent = this.errors;
    this.elements.resultLevel.textContent = r.level;
  }

  renderStats() {
    const last10 = this.history.slice(-10);
    const avg = last10.length ? Math.round(last10.reduce((a, b) => a + b.wpm, 0) / last10.length) : 0;
    const best = last10.length ? Math.max(...last10.map(r => r.wpm)) : 0;
    this.elements.avgWpm.textContent = avg;
    this.elements.bestWpm.textContent = best;
    this.elements.totalTests.textContent = this.history.length;
    this.elements.practiceTime.textContent = `${Math.floor(this.practiceTime / 60)} min`;
  }

  reset() {
    clearInterval(this.countdown);
    this.running = false;
    this.timeLeft = 60;
    this.wpm = 0;
    this.accuracy = 100;
    this.errors = 0;
    this.level = 1;
    this.elements.input.disabled = true;
    this.elements.input.value = '';
    this.elements.textDisplay.textContent = 'Click start to begin the test...';
    this.elements.timer.textContent = '60';
    this.elements.wpm.textContent = '0';
    this.elements.accuracy.textContent = '0';
    this.elements.errors.textContent = '0';
    this.elements.level.textContent = '1';
    this.elements.submit.disabled = true;
    this.elements.start.disabled = false;
    this.elements.reset.disabled = true;
    this.elements.results.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => new TypingTest());
