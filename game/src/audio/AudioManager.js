// AudioManager.js - Web Audio API synthesized sound effects and dynamic background music.
import { storage } from '../storage/StorageManager.js';

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.isInitialized = false;

        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.bgmStep = 0;

        // Load persisted settings
        const settings = storage.getSettings();
        this.soundEnabled = settings.soundEnabled;
        this.musicEnabled = settings.musicEnabled;
        this.masterVolume = settings.masterVolume ?? 0.8;
        this.sfxVolume = settings.sfxVolume ?? 0.8;
        this.musicVolume = settings.musicVolume ?? 0.5;
    }

    init() {
        if (this.isInitialized) return;

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                console.warn('Web Audio API not supported.');
                return;
            }

            this.ctx = new AudioContextClass();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.soundEnabled ? this.masterVolume : 0, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.isInitialized = true;

            if (this.ctx.state === 'suspended') {
                const resumeCtx = () => {
                    if (this.ctx && this.ctx.state === 'suspended') {
                        this.ctx.resume();
                    }
                    window.removeEventListener('pointerdown', resumeCtx);
                    window.removeEventListener('keydown', resumeCtx);
                    window.removeEventListener('touchstart', resumeCtx);
                };
                window.addEventListener('pointerdown', resumeCtx);
                window.addEventListener('keydown', resumeCtx);
                window.addEventListener('touchstart', resumeCtx);
            }
        } catch (e) {
            console.warn('Failed to initialize AudioContext:', e);
        }
    }

    ensureContext() {
        if (!this.isInitialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        storage.updateSettings({ soundEnabled: enabled });
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(enabled ? this.masterVolume : 0, this.ctx.currentTime, 0.05);
        }
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        storage.updateSettings({ musicEnabled: enabled });
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setTargetAtTime(enabled ? this.musicVolume : 0, this.ctx.currentTime, 0.05);
        }
        if (enabled && !this.bgmPlaying) {
            this.startMusic();
        } else if (!enabled && this.bgmPlaying) {
            this.stopMusic();
        }
    }

    setMasterVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
        storage.updateSettings({ masterVolume: this.masterVolume });
        if (this.masterGain && this.ctx && this.soundEnabled) {
            this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
        }
    }

    setSfxVolume(vol) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        storage.updateSettings({ sfxVolume: this.sfxVolume });
        if (this.sfxGain && this.ctx) {
            this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.05);
        }
    }

    setMusicVolume(vol) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
        storage.updateSettings({ musicVolume: this.musicVolume });
        if (this.musicGain && this.ctx && this.musicEnabled) {
            this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
        }
    }

    // --- Sound Effects ---

    playJump() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(480, now + 0.15);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    }

    playGravityFlip() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.22);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);
            filter.Q.value = 4.0;

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    }

    playCrystal() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            freqs.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = now + idx * 0.04;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0, now);
                gain.gain.setValueAtTime(0.25, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.22);
            });
        } catch (e) {}
    }

    playCheckpoint() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [329.63, 440.0, 554.37, 659.25]; // E4, A4, C#5, E5
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const noteTime = now + idx * 0.08;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.3, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.35);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.38);
            });
        } catch (e) {}
    }

    playDeath() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            // Noise burst + low pitch drop
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.4);
        } catch (e) {}
    }

    playLevelComplete() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const melody = [
                { f: 523.25, d: 0.12 }, // C5
                { f: 659.25, d: 0.12 }, // E5
                { f: 783.99, d: 0.12 }, // G5
                { f: 1046.5, d: 0.35 }  // C6
            ];

            let offset = 0;
            melody.forEach(({ f, d }) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = now + offset;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, t);

                gain.gain.setValueAtTime(0.35, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + d);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(t);
                osc.stop(t + d + 0.05);

                offset += d * 0.9;
            });
        } catch (e) {}
    }

    playButtonClick() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    }

    playLanding() {
        if (!this.soundEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(110, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {}
    }

    // --- Dynamic Procedural BGM (Sci-Fi Ambient Synth) ---

    startMusic() {
        if (!this.musicEnabled || this.bgmPlaying) return;
        this.ensureContext();
        if (!this.ctx) return;

        this.bgmPlaying = true;
        this.bgmStep = 0;
        this.scheduleBgmTick();
    }

    stopMusic() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    scheduleBgmTick() {
        if (!this.bgmPlaying || !this.ctx) return;

        const bpm = 120;
        const stepDuration = 60 / bpm / 2; // 16th notes = 0.125s

        const chords = [
            [130.81, 196.00, 261.63, 311.13], // C minor (C3, G3, C4, Eb4)
            [116.54, 174.61, 233.08, 293.66], // Bb major (Bb2, F3, Bb3, D4)
            [103.83, 155.56, 207.65, 261.63], // Ab major (Ab2, Eb3, Ab3, C4)
            [123.47, 185.00, 246.94, 293.66]  // G minor (G2, D3, G3, Bb3)
        ];

        const chordIdx = Math.floor((this.bgmStep / 16) % chords.length);
        const currentChord = chords[chordIdx];
        const stepInBar = this.bgmStep % 16;

        const now = this.ctx.currentTime;

        // Bassline on beat 0, 4, 8, 12
        if (stepInBar % 4 === 0) {
            this.playSynthNote(currentChord[0], now, stepDuration * 3.5, 'sawtooth', 0.15, 300);
        }

        // Arpeggiated synth
        const arpNote = currentChord[stepInBar % currentChord.length] * 2;
        if (stepInBar % 2 === 0) {
            this.playSynthNote(arpNote, now, stepDuration * 1.5, 'sine', 0.08, 1200);
        }

        // Ambient pad chord at start of bar
        if (stepInBar === 0) {
            currentChord.forEach(f => {
                this.playSynthNote(f * 1.5, now, stepDuration * 15, 'triangle', 0.04, 600);
            });
        }

        this.bgmStep++;

        this.bgmTimer = setTimeout(() => {
            this.scheduleBgmTick();
        }, stepDuration * 1000);
    }

    playSynthNote(freq, time, duration, waveType = 'sawtooth', volume = 0.1, cutoff = 800) {
        if (!this.musicGain || !this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = waveType;
            osc.frequency.setValueAtTime(freq, time);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(cutoff, time);

            gain.gain.setValueAtTime(volume, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicGain);

            osc.start(time);
            osc.stop(time + duration + 0.02);
        } catch (e) {}
    }
}

export const audio = new AudioManager();
