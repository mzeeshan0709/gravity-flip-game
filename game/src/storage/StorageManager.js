// StorageManager.js - Handles local storage persistence for settings, level progress, and high scores.

const STORAGE_KEY = 'gravity_flip_adventure_save_v1';

const DEFAULT_SAVE = {
    settings: {
        soundEnabled: true,
        musicEnabled: true,
        masterVolume: 0.8,
        sfxVolume: 0.8,
        musicVolume: 0.5,
        visualQuality: 'high', // 'low', 'medium', 'high'
        difficulty: 'medium'   // 'easy', 'medium', 'hard'
    },
    progress: {
        unlockedLevels: 1,
        levels: {
            1: { completed: false, highScores: { easy: 0, medium: 0, hard: 0 }, bestTimes: { easy: null, medium: null, hard: null }, stars: { easy: 0, medium: 0, hard: 0 } },
            2: { completed: false, highScores: { easy: 0, medium: 0, hard: 0 }, bestTimes: { easy: null, medium: null, hard: null }, stars: { easy: 0, medium: 0, hard: 0 } },
            3: { completed: false, highScores: { easy: 0, medium: 0, hard: 0 }, bestTimes: { easy: null, medium: null, hard: null }, stars: { easy: 0, medium: 0, hard: 0 } },
            4: { completed: false, highScores: { easy: 0, medium: 0, hard: 0 }, bestTimes: { easy: null, medium: null, hard: null }, stars: { easy: 0, medium: 0, hard: 0 } },
            5: { completed: false, highScores: { easy: 0, medium: 0, hard: 0 }, bestTimes: { easy: null, medium: null, hard: null }, stars: { easy: 0, medium: 0, hard: 0 } }
        }
    }
};

class StorageManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
            const parsed = JSON.parse(raw);
            // Merge defaults in case of missing keys
            return {
                settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
                progress: {
                    unlockedLevels: parsed.progress?.unlockedLevels || 1,
                    levels: { ...DEFAULT_SAVE.progress.levels, ...(parsed.progress?.levels || {}) }
                }
            };
        } catch (e) {
            console.warn('LocalStorage unavailable or corrupt, using default settings.', e);
            return JSON.parse(JSON.stringify(DEFAULT_SAVE));
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save to localStorage.', e);
        }
    }

    getSettings() {
        return this.data.settings;
    }

    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.save();
    }

    getDifficulty() {
        return this.data.settings.difficulty || 'medium';
    }

    setDifficulty(diff) {
        this.data.settings.difficulty = diff;
        this.save();
    }

    getLevelProgress(levelIndex) {
        return this.data.progress.levels[levelIndex] || {
            completed: false,
            highScores: { easy: 0, medium: 0, hard: 0 },
            bestTimes: { easy: null, medium: null, hard: null },
            stars: { easy: 0, medium: 0, hard: 0 }
        };
    }

    isLevelUnlocked(levelIndex) {
        if (levelIndex === 1) return true;
        return (this.data.progress.unlockedLevels >= levelIndex);
    }

    recordLevelCompletion(levelIndex, difficulty, score, time, stars) {
        if (!this.data.progress.levels[levelIndex]) {
            this.data.progress.levels[levelIndex] = {
                completed: false,
                highScores: { easy: 0, medium: 0, hard: 0 },
                bestTimes: { easy: null, medium: null, hard: null },
                stars: { easy: 0, medium: 0, hard: 0 }
            };
        }

        const lvl = this.data.progress.levels[levelIndex];
        lvl.completed = true;

        if (!lvl.highScores) lvl.highScores = { easy: 0, medium: 0, hard: 0 };
        if (!lvl.bestTimes) lvl.bestTimes = { easy: null, medium: null, hard: null };
        if (!lvl.stars) lvl.stars = { easy: 0, medium: 0, hard: 0 };

        const prevBestScore = lvl.highScores[difficulty] || 0;
        const prevBestTime = lvl.bestTimes[difficulty];
        const prevBestStars = lvl.stars[difficulty] || 0;

        const isNewHighScore = score > prevBestScore;
        const isNewBestTime = prevBestTime === null || time < prevBestTime;

        if (isNewHighScore) lvl.highScores[difficulty] = score;
        if (isNewBestTime) lvl.bestTimes[difficulty] = time;
        if (stars > prevBestStars) lvl.stars[difficulty] = stars;

        // Unlock next level if applicable
        if (this.data.progress.unlockedLevels < levelIndex + 1) {
            this.data.progress.unlockedLevels = levelIndex + 1;
        }

        this.save();

        return { isNewHighScore, isNewBestTime };
    }

    resetProgress() {
        this.data.progress = JSON.parse(JSON.stringify(DEFAULT_SAVE.progress));
        this.save();
    }
}

export const storage = new StorageManager();
