// UIManager.js - User Interface manager for menus, HUD, level select, modals, and mobile touch controls.
import { storage } from '../storage/StorageManager.js';
import { audio } from '../audio/AudioManager.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.container = document.body;

        this.initUIElements();
        this.bindEvents();
    }

    initUIElements() {
        // Create root UI overlay
        this.uiRoot = document.createElement('div');
        this.uiRoot.id = 'game-ui-root';
        this.uiRoot.innerHTML = `
            <!-- In-Game HUD -->
            <div id="hud" class="ui-screen hidden">
                <div class="hud-top">
                    <div class="hud-item hud-level">
                        <span class="hud-label">LEVEL</span>
                        <span id="hud-level-name" class="hud-value">1 — The First Flip</span>
                    </div>
                    <div class="hud-item hud-score">
                        <span class="hud-label">SCORE</span>
                        <span id="hud-score-val" class="hud-value">0</span>
                    </div>
                    <div class="hud-item hud-crystals">
                        <span class="hud-label">CRYSTALS</span>
                        <span id="hud-crystals-val" class="hud-value">💎 0 / 5</span>
                    </div>
                    <div class="hud-item hud-time">
                        <span class="hud-label">TIME</span>
                        <span id="hud-time-val" class="hud-value">00:00.0</span>
                    </div>
                    <div class="hud-item hud-gravity">
                        <span class="hud-label">GRAVITY</span>
                        <span id="hud-gravity-badge" class="gravity-badge normal">▼ DOWN</span>
                    </div>
                    <button id="btn-hud-pause" class="btn-icon" title="Pause Game">⏸</button>
                </div>

                <!-- Toast Notification -->
                <div id="toast-notification" class="toast hidden">
                    <span id="toast-text">CHECKPOINT ACTIVATED! ⚡</span>
                </div>
            </div>

            <!-- Mobile Touch Controls -->
            <div id="touch-controls" class="touch-overlay hidden">
                <div class="touch-group touch-left">
                    <button id="touch-btn-left" class="touch-btn touch-btn-dir" data-action="left">◀</button>
                    <button id="touch-btn-right" class="touch-btn touch-btn-dir" data-action="right">▶</button>
                </div>
                <div class="touch-group touch-right">
                    <button id="touch-btn-jump" class="touch-btn touch-btn-action jump" data-action="jump">JUMP ⬆</button>
                    <button id="touch-btn-flip" class="touch-btn touch-btn-action flip" data-action="flip">FLIP ⚡</button>
                </div>
            </div>

            <!-- Main Menu Screen -->
            <div id="screen-main-menu" class="ui-screen menu-screen">
                <div class="menu-card glass-panel">
                    <div class="game-logo">
                        <h1 class="glow-title">GRAVITY FLIP</h1>
                        <span class="sub-title">ADVENTURE</span>
                    </div>
                    <div class="menu-actions">
                        <button id="btn-play" class="btn btn-primary pulse-btn">PLAY GAME</button>
                        <button id="btn-level-select" class="btn btn-secondary">LEVEL SELECT</button>
                        <button id="btn-difficulty-menu" class="btn btn-secondary">DIFFICULTY: <span id="current-diff-label">MEDIUM</span></button>
                        <button id="btn-how-to-play" class="btn btn-secondary">HOW TO PLAY</button>
                        <button id="btn-settings" class="btn btn-secondary">SETTINGS</button>
                    </div>
                    <div class="menu-footer">
                        <span>Desktop: A/D (Move) • W (Jump) • Space (Flip) • Esc (Pause)</span>
                    </div>
                </div>
            </div>

            <!-- Level Select Screen -->
            <div id="screen-level-select" class="ui-screen menu-screen hidden">
                <div class="menu-card glass-panel level-select-card">
                    <h2 class="panel-title">SELECT LEVEL</h2>
                    <div id="level-cards-container" class="level-cards-grid">
                        <!-- Populated dynamically -->
                    </div>
                    <div class="panel-buttons">
                        <button id="btn-level-back" class="btn btn-secondary">BACK TO MENU</button>
                    </div>
                </div>
            </div>

            <!-- Difficulty Select Modal -->
            <div id="modal-difficulty" class="ui-modal hidden">
                <div class="modal-card glass-panel">
                    <h2 class="panel-title">SELECT DIFFICULTY</h2>
                    <div class="difficulty-options">
                        <div class="diff-card" data-diff="easy">
                            <h3>EASY</h3>
                            <p>Gentle gravity, slower hazard speeds, generous checkpoints, relaxed platforming.</p>
                            <span class="diff-multiplier">Score Multiplier: 1.0x</span>
                        </div>
                        <div class="diff-card" data-diff="medium">
                            <h3>MEDIUM</h3>
                            <p>Standard gravity, moving platforms, laser hazards, balanced challenge.</p>
                            <span class="diff-multiplier">Score Multiplier: 1.5x</span>
                        </div>
                        <div class="diff-card" data-diff="hard">
                            <h3>HARD</h3>
                            <p>Fast gravity, rapid lasers, high-speed hazards, for master platformers.</p>
                            <span class="diff-multiplier">Score Multiplier: 2.0x</span>
                        </div>
                    </div>
                    <div class="panel-buttons">
                        <button id="btn-diff-close" class="btn btn-secondary">BACK</button>
                    </div>
                </div>
            </div>

            <!-- How To Play Modal -->
            <div id="modal-how-to-play" class="ui-modal hidden">
                <div class="modal-card glass-panel how-to-play-card">
                    <h2 class="panel-title">HOW TO PLAY</h2>
                    <div class="instructions-content">
                        <div class="instruction-section">
                            <h3>⚡ Core Mechanic: Gravity Flip</h3>
                            <p>Under <strong>Normal Gravity</strong>, you fall down towards the floor. Under <strong>Reversed Gravity</strong>, you fall up towards the ceiling! Switch gravity mid-air or while grounded to navigate obstacles.</p>
                        </div>
                        <div class="instruction-section">
                            <h3>🎮 Desktop Controls</h3>
                            <ul>
                                <li><strong>A / Left Arrow:</strong> Move Left</li>
                                <li><strong>D / Right Arrow:</strong> Move Right</li>
                                <li><strong>W / Up Arrow:</strong> Jump (away from surface)</li>
                                <li><strong>Spacebar:</strong> Flip Gravity</li>
                                <li><strong>Escape / P:</strong> Pause Game</li>
                                <li><strong>R:</strong> Quick Restart Level</li>
                                <li><strong>M:</strong> Toggle Audio</li>
                            </ul>
                        </div>
                        <div class="instruction-section">
                            <h3>📱 Mobile & Touch Controls</h3>
                            <p>Use on-screen direction arrows [◀ ▶] on the left to move, and [JUMP] and [FLIP ⚡] on the right. Multi-touch is fully supported!</p>
                        </div>
                        <div class="instruction-section">
                            <h3>💎 Objectives & Hazards</h3>
                            <p>Collect glowing crystals for high scores, pass glowing green checkpoints to save your respawn point, avoid red spikes & laser beams, and enter the purple vortex portal to finish each level!</p>
                        </div>
                    </div>
                    <div class="panel-buttons">
                        <button id="btn-how-to-close" class="btn btn-primary">GOT IT!</button>
                    </div>
                </div>
            </div>

            <!-- Settings Modal -->
            <div id="modal-settings" class="ui-modal hidden">
                <div class="modal-card glass-panel settings-card">
                    <h2 class="panel-title">SETTINGS</h2>
                    <div class="settings-group">
                        <div class="setting-item">
                            <label>Sound Effects</label>
                            <input type="checkbox" id="setting-sfx-toggle" checked />
                        </div>
                        <div class="setting-item">
                            <label>SFX Volume</label>
                            <input type="range" id="setting-sfx-vol" min="0" max="1" step="0.05" value="0.8" />
                        </div>
                        <div class="setting-item">
                            <label>Music</label>
                            <input type="checkbox" id="setting-music-toggle" checked />
                        </div>
                        <div class="setting-item">
                            <label>Music Volume</label>
                            <input type="range" id="setting-music-vol" min="0" max="1" step="0.05" value="0.5" />
                        </div>
                        <div class="setting-item">
                            <label>Visual Quality</label>
                            <select id="setting-quality-select">
                                <option value="high">High (Full Shadows & Particles)</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low (Mobile Optimized)</option>
                            </select>
                        </div>
                    </div>
                    <div class="panel-buttons">
                        <button id="btn-reset-save" class="btn btn-danger">RESET PROGRESS</button>
                        <button id="btn-settings-close" class="btn btn-secondary">CLOSE</button>
                    </div>
                </div>
            </div>

            <!-- Pause Modal -->
            <div id="modal-pause" class="ui-modal hidden">
                <div class="modal-card glass-panel pause-card">
                    <h2 class="panel-title">GAME PAUSED</h2>
                    <div class="menu-actions">
                        <button id="btn-pause-resume" class="btn btn-primary">RESUME</button>
                        <button id="btn-pause-restart" class="btn btn-secondary">RESTART LEVEL</button>
                        <button id="btn-pause-settings" class="btn btn-secondary">SETTINGS</button>
                        <button id="btn-pause-levels" class="btn btn-secondary">LEVEL SELECT</button>
                        <button id="btn-pause-main-menu" class="btn btn-secondary">MAIN MENU</button>
                    </div>
                </div>
            </div>

            <!-- Level Complete / Victory Modal -->
            <div id="modal-victory" class="ui-modal hidden">
                <div class="modal-card glass-panel victory-card">
                    <h2 class="victory-title glow-title">LEVEL COMPLETED!</h2>
                    <div class="victory-stars" id="victory-stars-display">
                        ★★★
                    </div>
                    <div class="victory-stats">
                        <div class="stat-row">
                            <span>Level:</span>
                            <span id="victory-level-name">Level 1</span>
                        </div>
                        <div class="stat-row">
                            <span>Crystals Collected:</span>
                            <span id="victory-crystals-val">5 / 5</span>
                        </div>
                        <div class="stat-row">
                            <span>Completion Time:</span>
                            <span id="victory-time-val">00:18.4</span>
                        </div>
                        <div class="stat-row highlight">
                            <span>Final Score:</span>
                            <span id="victory-score-val">1,850</span>
                        </div>
                        <div id="victory-record-notice" class="record-badge hidden">NEW HIGH SCORE! 🏆</div>
                    </div>
                    <div class="panel-buttons">
                        <button id="btn-victory-next" class="btn btn-primary pulse-btn">NEXT LEVEL</button>
                        <button id="btn-victory-replay" class="btn btn-secondary">REPLAY</button>
                        <button id="btn-victory-levels" class="btn btn-secondary">LEVEL SELECT</button>
                        <button id="btn-victory-menu" class="btn btn-secondary">MAIN MENU</button>
                    </div>
                </div>
            </div>
        `;

        this.container.appendChild(this.uiRoot);

        // Bind global toast helper
        window.__showCheckpointToast = () => this.showCheckpointToast();
    }

    bindEvents() {
        const input = this.game.input;

        // Bind mobile touch buttons to input manager
        input.bindTouchButton(document.getElementById('touch-btn-left'), 'left');
        input.bindTouchButton(document.getElementById('touch-btn-right'), 'right');
        input.bindTouchButton(document.getElementById('touch-btn-jump'), 'jump');
        input.bindTouchButton(document.getElementById('touch-btn-flip'), 'flip');

        // Main Menu buttons
        document.getElementById('btn-play').addEventListener('click', () => {
            audio.playButtonClick();
            this.game.startLevel(1);
        });

        document.getElementById('btn-level-select').addEventListener('click', () => {
            audio.playButtonClick();
            this.showLevelSelectScreen();
        });

        document.getElementById('btn-difficulty-menu').addEventListener('click', () => {
            audio.playButtonClick();
            this.showDifficultyModal();
        });

        document.getElementById('btn-how-to-play').addEventListener('click', () => {
            audio.playButtonClick();
            this.showModal('modal-how-to-play');
        });

        document.getElementById('btn-how-to-close').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-how-to-play');
        });

        document.getElementById('btn-settings').addEventListener('click', () => {
            audio.playButtonClick();
            this.showSettingsModal();
        });

        document.getElementById('btn-settings-close').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-settings');
        });

        // Difficulty cards
        document.querySelectorAll('.diff-card').forEach(card => {
            card.addEventListener('click', () => {
                const diff = card.dataset.diff;
                audio.playButtonClick();
                this.selectDifficulty(diff);
                this.hideModal('modal-difficulty');
            });
        });

        document.getElementById('btn-diff-close').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-difficulty');
        });

        // Level Select screen
        document.getElementById('btn-level-back').addEventListener('click', () => {
            audio.playButtonClick();
            this.showScreen('screen-main-menu');
        });

        // HUD Pause button
        document.getElementById('btn-hud-pause').addEventListener('click', () => {
            audio.playButtonClick();
            this.game.pauseGame();
        });

        // Pause Menu
        document.getElementById('btn-pause-resume').addEventListener('click', () => {
            audio.playButtonClick();
            this.game.resumeGame();
        });

        document.getElementById('btn-pause-restart').addEventListener('click', () => {
            audio.playButtonClick();
            this.game.restartCurrentLevel();
        });

        document.getElementById('btn-pause-settings').addEventListener('click', () => {
            audio.playButtonClick();
            this.showSettingsModal();
        });

        document.getElementById('btn-pause-levels').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-pause');
            this.showLevelSelectScreen();
        });

        document.getElementById('btn-pause-main-menu').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-pause');
            this.game.returnToMainMenu();
        });

        // Victory Screen buttons
        document.getElementById('btn-victory-next').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-victory');
            const nextLvl = this.game.levelManager.currentLevelIndex + 1;
            if (nextLvl <= 5) {
                this.game.startLevel(nextLvl);
            } else {
                this.showLevelSelectScreen();
            }
        });

        document.getElementById('btn-victory-replay').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-victory');
            this.game.startLevel(this.game.levelManager.currentLevelIndex);
        });

        document.getElementById('btn-victory-levels').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-victory');
            this.showLevelSelectScreen();
        });

        document.getElementById('btn-victory-menu').addEventListener('click', () => {
            audio.playButtonClick();
            this.hideModal('modal-victory');
            this.game.returnToMainMenu();
        });

        // Settings Controls
        const sfxToggle = document.getElementById('setting-sfx-toggle');
        const sfxVol = document.getElementById('setting-sfx-vol');
        const musicToggle = document.getElementById('setting-music-toggle');
        const musicVol = document.getElementById('setting-music-vol');
        const qualSelect = document.getElementById('setting-quality-select');

        sfxToggle.addEventListener('change', (e) => audio.setSoundEnabled(e.target.checked));
        sfxVol.addEventListener('input', (e) => audio.setSfxVolume(parseFloat(e.target.value)));
        musicToggle.addEventListener('change', (e) => audio.setMusicEnabled(e.target.checked));
        musicVol.addEventListener('input', (e) => audio.setMusicVolume(parseFloat(e.target.value)));
        qualSelect.addEventListener('change', (e) => {
            storage.updateSettings({ visualQuality: e.target.value });
        });

        document.getElementById('btn-reset-save').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all game progress?')) {
                storage.resetProgress();
                this.updateDifficultyLabel();
                this.hideModal('modal-settings');
                this.showScreen('screen-main-menu');
            }
        });

        this.updateDifficultyLabel();
    }

    showScreen(screenId) {
        document.querySelectorAll('.ui-screen').forEach(s => s.classList.add('hidden'));
        document.querySelectorAll('.ui-modal').forEach(m => m.classList.add('hidden'));

        const target = document.getElementById(screenId);
        if (target) target.classList.remove('hidden');

        // Touch controls visibility
        const isPlaying = (screenId === 'hud');
        const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 1024);
        const touchOverlay = document.getElementById('touch-controls');

        if (isPlaying && isTouchDevice) {
            touchOverlay.classList.remove('hidden');
        } else {
            touchOverlay.classList.add('hidden');
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }

    showDifficultyModal() {
        const currentDiff = storage.getDifficulty();
        document.querySelectorAll('.diff-card').forEach(card => {
            if (card.dataset.diff === currentDiff) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
        this.showModal('modal-difficulty');
    }

    selectDifficulty(diff) {
        storage.setDifficulty(diff);
        this.updateDifficultyLabel();
        this.game.setDifficulty(diff);
    }

    updateDifficultyLabel() {
        const diff = storage.getDifficulty();
        const lbl = document.getElementById('current-diff-label');
        if (lbl) lbl.textContent = diff.toUpperCase();
    }

    showSettingsModal() {
        const settings = storage.getSettings();
        document.getElementById('setting-sfx-toggle').checked = settings.soundEnabled;
        document.getElementById('setting-sfx-vol').value = settings.sfxVolume ?? 0.8;
        document.getElementById('setting-music-toggle').checked = settings.musicEnabled;
        document.getElementById('setting-music-vol').value = settings.musicVolume ?? 0.5;
        document.getElementById('setting-quality-select').value = settings.visualQuality || 'high';

        this.showModal('modal-settings');
    }

    showLevelSelectScreen() {
        this.renderLevelCards();
        this.showScreen('screen-level-select');
    }

    renderLevelCards() {
        const container = document.getElementById('level-cards-container');
        container.innerHTML = '';

        const difficulty = storage.getDifficulty();

        for (let i = 1; i <= 5; i++) {
            const unlocked = storage.isLevelUnlocked(i);
            const progress = storage.getLevelProgress(i);
            const levelData = this.game.levelManager.getLevelData(i);

            const card = document.createElement('div');
            card.className = `level-card glass-panel ${unlocked ? 'unlocked' : 'locked'}`;

            const bestScore = progress.highScores?.[difficulty] || 0;
            const bestTime = progress.bestTimes?.[difficulty];
            const starsEarned = progress.stars?.[difficulty] || 0;

            let starsStr = '';
            for (let s = 1; s <= 3; s++) {
                starsStr += (s <= starsEarned) ? '★' : '☆';
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="level-num">LEVEL 0${i}</span>
                    <span class="level-stars">${unlocked ? starsStr : '🔒'}</span>
                </div>
                <h3 class="level-card-title">${levelData.name.split('—')[1] || levelData.name}</h3>
                <div class="level-stats-preview">
                    ${unlocked ? `
                        <div>Best Score: <strong>${bestScore.toLocaleString()}</strong></div>
                        <div>Best Time: <strong>${bestTime ? this.formatTime(bestTime) : '--:--'}</strong></div>
                    ` : `<div class="locked-text">Complete Level ${i - 1} to unlock</div>`}
                </div>
                <button class="btn btn-small ${unlocked ? 'btn-primary' : 'btn-disabled'}" ${unlocked ? '' : 'disabled'}>
                    ${unlocked ? 'START' : 'LOCKED'}
                </button>
            `;

            if (unlocked) {
                card.addEventListener('click', () => {
                    audio.playButtonClick();
                    this.game.startLevel(i);
                });
            }

            container.appendChild(card);
        }
    }

    updateHUD(levelIndex, levelName, score, crystals, totalCrystals, time, gravityDir) {
        document.getElementById('hud-level-name').textContent = `${levelIndex} — ${levelName.split('—')[1] || levelName}`;
        document.getElementById('hud-score-val').textContent = score.toLocaleString();
        document.getElementById('hud-crystals-val').textContent = `💎 ${crystals} / ${totalCrystals}`;
        document.getElementById('hud-time-val').textContent = this.formatTime(time);

        const badge = document.getElementById('hud-gravity-badge');
        if (gravityDir > 0) {
            badge.textContent = '▼ DOWN';
            badge.className = 'gravity-badge normal';
        } else {
            badge.textContent = '▲ UP (FLIPPED)';
            badge.className = 'gravity-badge reversed';
        }
    }

    showCheckpointToast() {
        const toast = document.getElementById('toast-notification');
        toast.classList.remove('hidden');
        toast.classList.add('toast-anim');

        setTimeout(() => {
            toast.classList.remove('toast-anim');
            toast.classList.add('hidden');
        }, 1800);
    }

    showVictoryModal(data) {
        const { levelIndex, score, time, crystalsCollected, totalCrystals, difficulty } = data;
        const levelData = this.game.levelManager.getLevelData(levelIndex);

        // Calculate stars
        let stars = 1;
        if (crystalsCollected === totalCrystals) stars++;
        if (time <= (levelData.parTime || 30) * 1.2) stars++;

        const { isNewHighScore } = storage.recordLevelCompletion(levelIndex, difficulty, score, time, stars);

        document.getElementById('victory-level-name').textContent = levelData.name;
        document.getElementById('victory-crystals-val').textContent = `${crystalsCollected} / ${totalCrystals}`;
        document.getElementById('victory-time-val').textContent = this.formatTime(time);
        document.getElementById('victory-score-val').textContent = score.toLocaleString();

        let starsStr = '';
        for (let s = 1; s <= 3; s++) {
            starsStr += (s <= stars) ? '★' : '☆';
        }
        document.getElementById('victory-stars-display').textContent = starsStr;

        const recordBadge = document.getElementById('victory-record-notice');
        if (isNewHighScore) {
            recordBadge.classList.remove('hidden');
        } else {
            recordBadge.classList.add('hidden');
        }

        // Configure next level button
        const nextBtn = document.getElementById('btn-victory-next');
        if (levelIndex < 5) {
            nextBtn.textContent = 'NEXT LEVEL ⏩';
            nextBtn.classList.remove('hidden');
        } else {
            nextBtn.textContent = 'ALL LEVELS COMPLETED! 🎉';
        }

        this.showModal('modal-victory');
    }

    formatTime(sec) {
        if (!sec && sec !== 0) return '00:00.0';
        const mins = Math.floor(sec / 60);
        const secs = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 10);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    }
}
