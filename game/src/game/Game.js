/**
 * @file Game.js
 * @description Main game engine, Three.js renderer, camera tracking, game loop, and state management.
 */
import * as THREE from 'three';
import { storage } from '../storage/StorageManager.js';
import { audio } from '../audio/AudioManager.js';
import { InputManager } from './InputManager.js';
import { EffectsManager } from './EffectsManager.js';
import { Player } from './Player.js';
import { CollisionSystem } from './CollisionSystem.js';
import { LevelManager } from './LevelManager.js';
import { UIManager } from '../ui/UIManager.js';

/**
 * Enumeration of active game engine states.
 * @readonly
 * @enum {string}
 */
export const GAME_STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    DYING: 'DYING',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE'
};

/**
 * Main game orchestrator managing Three.js scene, lighting, camera follow logic,
 * lifecycle state transitions, and fixed/variable delta simulation ticks.
 */
export class Game {
    constructor() {
        this.state = GAME_STATES.MENU;
        this.clock = new THREE.Clock();

        this.initThree();
        this.initManagers();
        this.setupWindowListeners();

        // Bind global callbacks
        window.__onLevelCompleted = (data) => this.onLevelCompleted(data);

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.canvas = document.querySelector('canvas.game');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x060913);
        this.scene.fog = new THREE.FogExp2(0x060913, 0.022);

        // Camera (2.5D Side Perspective)
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 4, 18);
        this.cameraTarget = new THREE.Vector3(0, 2, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting
        this.ambientLight = new THREE.AmbientLight(0x2a3b5c, 1.1);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xe2f1ff, 1.3);
        this.dirLight.position.set(10, 20, 15);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 1024;
        this.dirLight.shadow.mapSize.height = 1024;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 60;
        this.dirLight.shadow.camera.left = -20;
        this.dirLight.shadow.camera.right = 20;
        this.dirLight.shadow.camera.top = 20;
        this.dirLight.shadow.camera.bottom = -20;
        this.scene.add(this.dirLight);

        // Atmospheric Point Lights (Cyan and Magenta rim glow)
        this.rimLightCyan = new THREE.PointLight(0x00f3ff, 1.5, 30);
        this.rimLightCyan.position.set(-10, 10, 8);
        this.scene.add(this.rimLightCyan);

        this.rimLightMagenta = new THREE.PointLight(0xff00a0, 1.5, 30);
        this.rimLightMagenta.position.set(20, 15, 8);
        this.scene.add(this.rimLightMagenta);
    }

    initManagers() {
        this.input = new InputManager();
        this.effects = new EffectsManager(this.scene);
        this.player = new Player(this.scene, this.effects);
        this.collision = new CollisionSystem();
        this.levelManager = new LevelManager(this.scene, this.effects);
        this.ui = new UIManager(this);

        // Apply saved difficulty
        const diff = storage.getDifficulty();
        this.setDifficulty(diff);
    }

    setupWindowListeners() {
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    setDifficulty(diff) {
        this.difficulty = diff;
        this.player.setDifficultyParameters(diff);
    }

    startLevel(levelIndex) {
        this.state = GAME_STATES.PLAYING;
        const info = this.levelManager.loadLevel(levelIndex, this.difficulty);

        this.player.reset(info.startPos.x, info.startPos.y, info.startPos.gravityDir);
        this.camera.position.set(info.startPos.x, info.startPos.y + 2, 18);
        this.cameraTarget.set(info.startPos.x, info.startPos.y, 0);

        this.ui.showScreen('hud');
        audio.startMusic();
    }

    restartCurrentLevel() {
        this.ui.hideModal('modal-pause');
        this.startLevel(this.levelManager.currentLevelIndex);
    }

    returnToMainMenu() {
        this.state = GAME_STATES.MENU;
        this.levelManager.clearLevel();
        this.effects.clear();
        this.player.mesh.visible = false;
        this.ui.showScreen('screen-main-menu');
    }

    pauseGame() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
            this.ui.showModal('modal-pause');
        }
    }

    resumeGame() {
        if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.ui.hideModal('modal-pause');
        }
    }

    respawnPlayer() {
        const respawn = this.levelManager.getRespawnPoint();
        this.player.reset(respawn.x, respawn.y, respawn.gravityDir);
        this.state = GAME_STATES.PLAYING;
    }

    onLevelCompleted(data) {
        this.state = GAME_STATES.LEVEL_COMPLETE;
        this.ui.showVictoryModal(data);
    }

    animate() {
        requestAnimationFrame(this.animate);

        const rawDt = this.clock.getDelta();
        // Clamp delta time to avoid huge tunneling jumps during tab switches or frame drops
        const dt = Math.min(rawDt, 0.05);

        this.handleGlobalInputs();

        if (this.state === GAME_STATES.PLAYING) {
            this.updateGameplay(dt);
        } else if (this.state === GAME_STATES.DYING) {
            this.updateDying(dt);
        } else if (this.state === GAME_STATES.MENU) {
            this.updateMenuPreview();
        }

        // Always update visual effects
        this.effects.update(dt, this.player.position);

        // Render frame
        this.renderer.render(this.scene, this.camera);
    }

    handleGlobalInputs() {
        // Pause toggle
        if (this.input.consumeJustPressed('pause')) {
            if (this.state === GAME_STATES.PLAYING) {
                this.pauseGame();
            } else if (this.state === GAME_STATES.PAUSED) {
                this.resumeGame();
            }
        }

        // Restart hotkey (R)
        if (this.input.consumeJustPressed('restart')) {
            if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
                this.restartCurrentLevel();
            }
        }

        // Mute hotkey (M)
        if (this.input.consumeJustPressed('mute')) {
            const currentSound = audio.soundEnabled;
            audio.setSoundEnabled(!currentSound);
            audio.setMusicEnabled(!currentSound);
        }
    }

    updateGameplay(dt) {
        // 1. Update Player Physics & Inputs
        this.player.updatePhysics(dt, this.input);

        // 2. Collision Resolution
        this.collision.resolvePlayerCollisions(this.player, this.levelManager, dt);

        // 3. Player Animations
        this.player.updateAnimations(dt);

        // 4. Check if player died
        if (!this.player.isAlive) {
            this.state = GAME_STATES.DYING;
        }

        // 5. Update Level dynamics (moving platforms, lasers, crystals, portal)
        this.levelManager.update(dt);

        // 6. Update Camera Follow
        this.updateCameraFollow(dt);

        // 7. Update HUD
        const lvlData = this.levelManager.getLevelData(this.levelManager.currentLevelIndex);
        this.ui.updateHUD(
            this.levelManager.currentLevelIndex,
            lvlData.name,
            this.levelManager.score,
            this.levelManager.crystalsCollected,
            this.levelManager.totalCrystals,
            this.levelManager.levelTime,
            this.player.gravityDir
        );
    }

    updateDying(dt) {
        this.player.updatePhysics(dt, this.input);
        this.levelManager.update(dt);

        if (this.player.deathTimer <= 0) {
            this.respawnPlayer();
        }
    }

    updateMenuPreview() {
        // Gentle camera pan in menu
        const time = Date.now() * 0.0005;
        this.camera.position.x = Math.sin(time) * 4;
        this.camera.position.y = 3 + Math.cos(time * 0.8);
        this.camera.lookAt(0, 2, 0);
    }

    updateCameraFollow(dt) {
        // Smooth 2.5D tracking
        const targetX = this.player.position.x + this.player.facing * 1.5;
        const targetY = this.player.position.y + (this.player.gravityDir > 0 ? 1.0 : -1.0);

        this.cameraTarget.x = THREE.MathUtils.damp(this.cameraTarget.x, targetX, 5.0, dt);
        this.cameraTarget.y = THREE.MathUtils.damp(this.cameraTarget.y, targetY, 4.0, dt);

        // Clamp camera target within level bounds
        this.cameraTarget.y = Math.max(this.levelManager.bounds.minY + 4, Math.min(this.levelManager.bounds.maxY - 4, this.cameraTarget.y));

        this.camera.position.x = this.cameraTarget.x;
        this.camera.position.y = this.cameraTarget.y + 1.2;
        this.camera.position.z = 17.5;

        this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y, 0);

        // Move directional and point lights with camera
        this.dirLight.position.x = this.camera.position.x + 10;
        this.dirLight.target.position.x = this.cameraTarget.x;
        this.dirLight.target.updateMatrixWorld();

        this.rimLightCyan.position.x = this.camera.position.x - 12;
        this.rimLightMagenta.position.x = this.camera.position.x + 15;
    }
}
