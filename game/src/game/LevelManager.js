/**
 * @file LevelManager.js
 * @description Level layouts, procedural platform generation, hazard animations, collectibles, checkpoints, and victory resolution.
 */
import * as THREE from 'three';
import { audio } from '../audio/AudioManager.js';

/**
 * Manages the construction, state updates, hazard cycles, collectible tracking,
 * and completion triggers for all 5 playable levels.
 */
export class LevelManager {
    /**
     * @param {THREE.Scene} scene - The active Three.js scene.
     * @param {import('./EffectsManager.js').EffectsManager} effects - Particle effects manager.
     */
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;

        this.currentLevelIndex = 1;
        this.difficulty = 'medium';

        // Entities container
        this.levelGroup = new THREE.Group();
        this.scene.add(this.levelGroup);

        this.platforms = [];
        this.spikes = [];
        this.lasers = [];
        this.crystals = [];
        this.checkpoints = [];
        this.portal = null;

        // Level stats & state
        this.startPos = { x: 0, y: 2, gravityDir: 1 };
        this.activeCheckpoint = null;
        this.bounds = { minY: -12, maxY: 24, minX: -5, maxX: 150 };
        this.score = 0;
        this.crystalsCollected = 0;
        this.totalCrystals = 0;
        this.levelTime = 0;
        this.levelCompleted = false;

        // Shared Geometries & Materials for efficiency
        this.initSharedResources();
    }

    initSharedResources() {
        this.materials = {
            floor: new THREE.MeshStandardMaterial({
                color: 0x111c2a,
                roughness: 0.4,
                metalness: 0.8
            }),
            platformGlowCyan: new THREE.MeshStandardMaterial({
                color: 0x182c44,
                emissive: 0x00f3ff,
                emissiveIntensity: 0.35,
                roughness: 0.3,
                metalness: 0.7
            }),
            platformGlowMagenta: new THREE.MeshStandardMaterial({
                color: 0x2a1438,
                emissive: 0xff00a0,
                emissiveIntensity: 0.35,
                roughness: 0.3,
                metalness: 0.7
            }),
            platformMoving: new THREE.MeshStandardMaterial({
                color: 0x242a12,
                emissive: 0xe6ff00,
                emissiveIntensity: 0.4,
                roughness: 0.2,
                metalness: 0.8
            }),
            platformPhasing: new THREE.MeshStandardMaterial({
                color: 0x0a2a30,
                emissive: 0x00ffea,
                emissiveIntensity: 0.6,
                transparent: true,
                opacity: 0.9,
                roughness: 0.2
            }),
            spike: new THREE.MeshStandardMaterial({
                color: 0xff1e40,
                emissive: 0xff1e40,
                emissiveIntensity: 0.6,
                roughness: 0.2,
                metalness: 0.9
            }),
            crystal: new THREE.MeshStandardMaterial({
                color: 0x00ffff,
                emissive: 0x00d8ff,
                emissiveIntensity: 0.8,
                roughness: 0.1,
                metalness: 0.9
            }),
            laserBeam: new THREE.MeshBasicMaterial({
                color: 0xff0044,
                transparent: true,
                opacity: 0.85
            }),
            cpInactive: new THREE.MeshStandardMaterial({
                color: 0x334155,
                emissive: 0xff4400,
                emissiveIntensity: 0.5
            }),
            cpActive: new THREE.MeshStandardMaterial({
                color: 0x00ff88,
                emissive: 0x00ff88,
                emissiveIntensity: 0.9
            }),
            portalRing: new THREE.MeshStandardMaterial({
                color: 0x8a2be2,
                emissive: 0x8a2be2,
                emissiveIntensity: 0.8,
                roughness: 0.2
            }),
            portalVortex: new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            })
        };
    }

    loadLevel(levelIndex, difficulty = 'medium') {
        this.currentLevelIndex = levelIndex;
        this.difficulty = difficulty;
        this.clearLevel();

        this.levelCompleted = false;
        this.score = 0;
        this.crystalsCollected = 0;
        this.levelTime = 0;
        this.activeCheckpoint = null;

        const levelData = this.getLevelData(levelIndex);
        this.startPos = { ...levelData.startPos };
        this.bounds = { ...levelData.bounds };

        // 1. Build Platforms
        levelData.platforms.forEach(pData => this.createPlatform(pData));

        // 2. Build Spikes
        levelData.spikes.forEach(sData => this.createSpike(sData));

        // 3. Build Lasers
        levelData.lasers.forEach(lData => this.createLaser(lData));

        // 4. Build Crystals
        this.totalCrystals = levelData.crystals.length;
        levelData.crystals.forEach(cData => this.createCrystal(cData));

        // 5. Build Checkpoints
        levelData.checkpoints.forEach(cpData => this.createCheckpoint(cpData));

        // 6. Build Exit Portal
        if (levelData.portal) {
            this.createPortal(levelData.portal);
        }

        // 7. Add level decor background
        this.createBackgroundDecor(levelData.themeColor || 0x00f3ff);

        return {
            levelName: levelData.name,
            levelIndex: this.currentLevelIndex,
            totalCrystals: this.totalCrystals,
            startPos: this.startPos
        };
    }

    clearLevel() {
        while (this.levelGroup.children.length > 0) {
            const obj = this.levelGroup.children[0];
            this.levelGroup.remove(obj);
            if (obj && typeof obj.traverse === 'function') {
                obj.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                });
            }
        }

        this.platforms = [];
        this.spikes = [];
        this.lasers = [];
        this.crystals = [];
        this.checkpoints = [];
        this.portal = null;
    }

    createPlatform(data) {
        const { x, y, w, h = 1.0, d = 2.5, type = 'static', path = null, speed = 2.0, phaseInterval = 2.0, glow = 'cyan' } = data;

        const geo = new THREE.BoxGeometry(w, h, d);
        let mat = this.materials.floor;

        if (type === 'moving') {
            mat = this.materials.platformMoving;
        } else if (type === 'disappearing') {
            mat = this.materials.platformPhasing.clone();
        } else if (glow === 'magenta') {
            mat = this.materials.platformGlowMagenta;
        } else if (glow === 'cyan') {
            mat = this.materials.platformGlowCyan;
        }

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.levelGroup.add(mesh);

        // Platform object
        const platform = {
            mesh,
            type,
            width: w,
            height: h,
            depth: d,
            isSolid: true,
            deltaPos: new THREE.Vector2(0, 0),
            getAABB: () => ({
                minX: mesh.position.x - w / 2,
                maxX: mesh.position.x + w / 2,
                minY: mesh.position.y - h / 2,
                maxY: mesh.position.y + h / 2
            })
        };

        if (type === 'moving' && path) {
            // Apply difficulty speed scaling
            const speedScale = this.difficulty === 'easy' ? 0.8 : (this.difficulty === 'hard' ? 1.25 : 1.0);
            platform.path = path; // { from: {x, y}, to: {x, y} }
            platform.speed = speed * speedScale;
            platform.progress = 0;
            platform.dir = 1;
            platform.prevPos = new THREE.Vector2(x, y);
        }

        if (type === 'disappearing') {
            const intervalScale = this.difficulty === 'easy' ? 1.4 : (this.difficulty === 'hard' ? 0.8 : 1.0);
            platform.interval = phaseInterval * intervalScale;
            platform.timer = Math.random() * platform.interval;
            platform.phase = 'active'; // 'active', 'warning', 'inactive'
        }

        this.platforms.push(platform);
    }

    createSpike(data) {
        const { x, y, count = 1, orientation = 'floor' } = data; // 'floor' points up, 'ceiling' points down
        const spikeW = 0.8;
        const spikeH = 0.9;

        const group = new THREE.Group();
        group.position.set(x, y, 0);

        const coneGeo = new THREE.ConeGeometry(0.35, spikeH, 8);
        const rotZ = orientation === 'ceiling' ? Math.PI : 0;

        for (let i = 0; i < count; i++) {
            const cone = new THREE.Mesh(coneGeo, this.materials.spike);
            cone.position.x = (i - (count - 1) / 2) * spikeW;
            cone.position.y = orientation === 'ceiling' ? -spikeH / 2 : spikeH / 2;
            cone.rotation.z = rotZ;
            cone.castShadow = true;
            group.add(cone);
        }

        this.levelGroup.add(group);

        const totalW = count * spikeW;
        this.spikes.push({
            group,
            orientation,
            getAABB: () => {
                const minY = orientation === 'ceiling' ? y - spikeH : y;
                const maxY = orientation === 'ceiling' ? y : y + spikeH;
                return {
                    minX: x - totalW / 2,
                    maxX: x + totalW / 2,
                    minY,
                    maxY
                };
            }
        });
    }

    createLaser(data) {
        const { x, y, length = 6.0, orientation = 'vertical', pulseInterval = 0, movePath = null, speed = 2.0 } = data;
        const group = new THREE.Group();
        group.position.set(x, y, 0);

        const beamThickness = 0.15;
        const beamGeo = orientation === 'vertical'
            ? new THREE.BoxGeometry(beamThickness, length, beamThickness)
            : new THREE.BoxGeometry(length, beamThickness, beamThickness);

        const beamMat = this.materials.laserBeam.clone();
        const beamMesh = new THREE.Mesh(beamGeo, beamMat);
        group.add(beamMesh);

        // Emitter Caps
        const capGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const capMat = this.materials.floor;
        const cap1 = new THREE.Mesh(capGeo, capMat);
        const cap2 = new THREE.Mesh(capGeo, capMat);

        if (orientation === 'vertical') {
            cap1.position.y = -length / 2;
            cap2.position.y = length / 2;
        } else {
            cap1.position.x = -length / 2;
            cap2.position.x = length / 2;
        }
        group.add(cap1);
        group.add(cap2);

        this.levelGroup.add(group);

        const laserObj = {
            group,
            beamMesh,
            orientation,
            length,
            isActive: true,
            pulseInterval,
            timer: 0,
            movePath,
            speed: this.difficulty === 'easy' ? speed * 0.75 : (this.difficulty === 'hard' ? speed * 1.3 : speed),
            progress: 0,
            dir: 1,
            getAABB: () => {
                const halfL = length / 2;
                const halfT = beamThickness / 2 + 0.1;
                return {
                    minX: group.position.x - (orientation === 'vertical' ? halfT : halfL),
                    maxX: group.position.x + (orientation === 'vertical' ? halfT : halfL),
                    minY: group.position.y - (orientation === 'vertical' ? halfL : halfT),
                    maxY: group.position.y + (orientation === 'vertical' ? halfL : halfT)
                };
            }
        };

        this.lasers.push(laserObj);
    }

    createCrystal(data) {
        const { x, y } = data;
        const geo = new THREE.OctahedronGeometry(0.35, 0);
        const mesh = new THREE.Mesh(geo, this.materials.crystal);
        mesh.position.set(x, y, 0);
        mesh.castShadow = true;
        this.levelGroup.add(mesh);

        this.crystals.push({
            mesh,
            collected: false,
            baseY: y,
            rotSpeed: 2.5 + Math.random()
        });
    }

    createCheckpoint(data) {
        const { x, y } = data;
        const group = new THREE.Group();
        group.position.set(x, y, 0);

        // Base
        const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.2, 16);
        const base = new THREE.Mesh(baseGeo, this.materials.floor);
        group.add(base);

        // Pillar
        const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.4, 12);
        const pillar = new THREE.Mesh(pillarGeo, this.materials.floor);
        pillar.position.y = 0.7;
        group.add(pillar);

        // Beacon Crystal
        const beaconGeo = new THREE.OctahedronGeometry(0.3, 0);
        const beacon = new THREE.Mesh(beaconGeo, this.materials.cpInactive.clone());
        beacon.position.y = 1.6;
        group.add(beacon);

        this.levelGroup.add(group);

        this.checkpoints.push({
            group,
            beacon,
            position: new THREE.Vector3(x, y + 0.8, 0),
            respawnX: x,
            respawnY: y + 1.0,
            isActive: false
        });
    }

    createPortal(data) {
        const { x, y } = data;
        const group = new THREE.Group();
        group.position.set(x, y, 0);

        // Outer Ring
        const ringGeo = new THREE.TorusGeometry(1.2, 0.15, 16, 32);
        const ring = new THREE.Mesh(ringGeo, this.materials.portalRing);
        group.add(ring);

        // Inner Vortex Disc
        const discGeo = new THREE.CircleGeometry(1.1, 24);
        const disc = new THREE.Mesh(discGeo, this.materials.portalVortex);
        group.add(disc);

        this.levelGroup.add(group);

        this.portal = {
            group,
            ring,
            disc,
            position: new THREE.Vector3(x, y, 0)
        };
    }

    createBackgroundDecor(themeColor) {
        // Futuristic floating monolithic background structures
        const count = 12;
        const mat = new THREE.MeshStandardMaterial({
            color: 0x080e18,
            roughness: 0.9,
            metalness: 0.1
        });

        const accentMat = new THREE.MeshBasicMaterial({
            color: themeColor,
            transparent: true,
            opacity: 0.25
        });

        for (let i = 0; i < count; i++) {
            const w = 4 + Math.random() * 8;
            const h = 15 + Math.random() * 30;
            const d = 3 + Math.random() * 6;
            const geo = new THREE.BoxGeometry(w, h, d);
            const mesh = new THREE.Mesh(geo, mat);

            mesh.position.set(i * 12 - 10, -5 + Math.random() * 10, -10 - Math.random() * 15);
            this.levelGroup.add(mesh);

            // Subtle neon strip on background monolith
            const stripGeo = new THREE.BoxGeometry(0.2, h, 0.2);
            const strip = new THREE.Mesh(stripGeo, accentMat);
            strip.position.set(mesh.position.x + w / 2 - 0.2, mesh.position.y, mesh.position.z + d / 2 + 0.1);
            this.levelGroup.add(strip);
        }
    }

    update(dt) {
        this.levelTime += dt;

        // 1. Update Moving Platforms
        for (const plat of this.platforms) {
            if (plat.type === 'moving' && plat.path) {
                const { from, to } = plat.path;
                plat.progress += dt * (plat.speed / 10) * plat.dir;

                if (plat.progress >= 1) {
                    plat.progress = 1;
                    plat.dir = -1;
                } else if (plat.progress <= 0) {
                    plat.progress = 0;
                    plat.dir = 1;
                }

                // Smooth cosine easing
                const t = (1 - Math.cos(plat.progress * Math.PI)) / 2;
                const newX = THREE.MathUtils.lerp(from.x, to.x, t);
                const newY = THREE.MathUtils.lerp(from.y, to.y, t);

                plat.deltaPos.set(newX - plat.mesh.position.x, newY - plat.mesh.position.y);
                plat.mesh.position.set(newX, newY, 0);
            }

            // 2. Update Disappearing Platforms
            if (plat.type === 'disappearing') {
                plat.timer += dt;
                const cycle = plat.timer % (plat.interval * 3);

                if (cycle < plat.interval * 1.8) {
                    // Solid Active
                    plat.isSolid = true;
                    plat.mesh.material.opacity = 0.9;
                    plat.mesh.material.emissiveIntensity = 0.6;
                } else if (cycle < plat.interval * 2.3) {
                    // Warning Flickering
                    plat.isSolid = true;
                    const flicker = Math.sin(plat.timer * 25) > 0 ? 0.8 : 0.2;
                    plat.mesh.material.opacity = flicker;
                    plat.mesh.material.emissiveIntensity = flicker * 0.8;
                } else {
                    // Inactive Phased Out
                    plat.isSolid = false;
                    plat.mesh.material.opacity = 0.08;
                    plat.mesh.material.emissiveIntensity = 0.05;
                }
            }
        }

        // 3. Update Lasers
        for (const laser of this.lasers) {
            // Pulse cycle
            if (laser.pulseInterval > 0) {
                laser.timer += dt;
                const pulseCycle = laser.timer % laser.pulseInterval;
                laser.isActive = pulseCycle < laser.pulseInterval * 0.65;
                laser.beamMesh.visible = laser.isActive;
            }

            // Moving laser
            if (laser.movePath) {
                const { from, to } = laser.movePath;
                laser.progress += dt * (laser.speed / 10) * laser.dir;

                if (laser.progress >= 1) {
                    laser.progress = 1;
                    laser.dir = -1;
                } else if (laser.progress <= 0) {
                    laser.progress = 0;
                    laser.dir = 1;
                }

                const t = (1 - Math.cos(laser.progress * Math.PI)) / 2;
                laser.group.position.x = THREE.MathUtils.lerp(from.x, to.x, t);
                laser.group.position.y = THREE.MathUtils.lerp(from.y, to.y, t);
            }
        }

        // 4. Update Crystals animation
        for (const crystal of this.crystals) {
            if (!crystal.collected) {
                crystal.mesh.rotation.y += dt * crystal.rotSpeed;
                crystal.mesh.rotation.x += dt * 0.8;
                crystal.mesh.position.y = crystal.baseY + Math.sin(this.levelTime * 3 + crystal.baseY) * 0.15;
            }
        }

        // 5. Update Checkpoints animation
        for (const cp of this.checkpoints) {
            if (cp.beacon) {
                cp.beacon.rotation.y += dt * (cp.isActive ? 3.0 : 1.0);
            }
        }

        // 6. Update Portal animation
        if (this.portal) {
            this.portal.ring.rotation.z += dt * 1.5;
            this.portal.disc.rotation.z -= dt * 2.5;
            const pulse = 1 + Math.sin(this.levelTime * 4) * 0.08;
            this.portal.group.scale.set(pulse, pulse, pulse);
        }
    }

    collectCrystal(crystal) {
        crystal.collected = true;
        crystal.mesh.visible = false;
        this.crystalsCollected++;

        const mult = this.difficulty === 'easy' ? 1 : (this.difficulty === 'hard' ? 2 : 1.5);
        this.score += Math.round(100 * mult);

        audio.playCrystal();
        if (this.effects) {
            this.effects.createCrystalEffect(crystal.mesh.position);
        }
    }

    activateCheckpoint(cp, gravityDir) {
        // Deactivate others
        this.checkpoints.forEach(c => {
            c.isActive = false;
            c.beacon.material = this.materials.cpInactive;
        });

        cp.isActive = true;
        cp.beacon.material = this.materials.cpActive;
        this.activeCheckpoint = {
            x: cp.respawnX,
            y: cp.respawnY,
            gravityDir
        };

        audio.playCheckpoint();
        if (this.effects) {
            this.effects.createCheckpointEffect(cp.position);
        }

        // Trigger UI notification
        if (window.__showCheckpointToast) {
            window.__showCheckpointToast();
        }
    }

    getRespawnPoint() {
        if (this.activeCheckpoint) {
            return this.activeCheckpoint;
        }
        return this.startPos;
    }

    triggerLevelComplete() {
        if (this.levelCompleted) return;
        this.levelCompleted = true;

        // Calculate time bonus
        const mult = this.difficulty === 'easy' ? 1 : (this.difficulty === 'hard' ? 2 : 1.5);
        const parTime = this.getLevelData(this.currentLevelIndex).parTime || 30;
        const timeBonus = Math.max(0, Math.round((parTime * 2 - this.levelTime) * 20 * mult));
        this.score += timeBonus;

        audio.playLevelComplete();

        if (window.__onLevelCompleted) {
            window.__onLevelCompleted({
                levelIndex: this.currentLevelIndex,
                score: this.score,
                time: this.levelTime,
                crystalsCollected: this.crystalsCollected,
                totalCrystals: this.totalCrystals,
                difficulty: this.difficulty
            });
        }
    }

    // --- 5 Rich, Distinct Playable Level Definitions ---
    getLevelData(index) {
        switch (index) {
            case 1:
                return {
                    name: "Level 1 — The First Flip",
                    themeColor: 0x00f3ff,
                    parTime: 25,
                    bounds: { minY: -8, maxY: 18, minX: -5, maxX: 55 },
                    startPos: { x: 0, y: 1.5, gravityDir: 1 },
                    platforms: [
                        // Ground Section 1
                        { x: 2, y: 0, w: 10, h: 1, glow: 'cyan' },
                        // Ceiling 1 (Gravity Flip Target)
                        { x: 12, y: 8, w: 8, h: 1, glow: 'cyan' },
                        // Mid Floating Step
                        { x: 18, y: 3, w: 5, h: 1, glow: 'cyan' },
                        // Ground Section 2
                        { x: 28, y: 0, w: 12, h: 1, glow: 'cyan' },
                        // High Ceiling Corridor
                        { x: 38, y: 9, w: 10, h: 1, glow: 'cyan' },
                        // Final Exit Platform
                        { x: 48, y: 1, w: 8, h: 1, glow: 'cyan' }
                    ],
                    spikes: [],
                    lasers: [],
                    crystals: [
                        { x: 4, y: 1.5 },
                        { x: 12, y: 6.5 }, // On ceiling underside
                        { x: 18, y: 4.5 },
                        { x: 28, y: 1.5 },
                        { x: 38, y: 7.5 }
                    ],
                    checkpoints: [
                        { x: 24, y: 0.5 }
                    ],
                    portal: { x: 48, y: 3.2 }
                };

            case 2:
                return {
                    name: "Level 2 — Ceiling Crossing",
                    themeColor: 0xff00a0,
                    parTime: 35,
                    bounds: { minY: -10, maxY: 20, minX: -5, maxX: 75 },
                    startPos: { x: 0, y: 1.5, gravityDir: 1 },
                    platforms: [
                        // Starting Base
                        { x: 2, y: 0, w: 8, h: 1, glow: 'magenta' },
                        // Upper Ceiling Runway
                        { x: 12, y: 10, w: 10, h: 1, glow: 'magenta' },
                        // Floating Low Platform
                        { x: 22, y: -1, w: 6, h: 1, glow: 'magenta' },
                        // Upper Ceiling 2
                        { x: 32, y: 11, w: 10, h: 1, glow: 'magenta' },
                        // Mid Ground Hub
                        { x: 44, y: 0, w: 10, h: 1, glow: 'magenta' },
                        // Ceiling Bridge with Gap
                        { x: 54, y: 10, w: 8, h: 1, glow: 'magenta' },
                        // Final Platform
                        { x: 64, y: 1, w: 8, h: 1, glow: 'magenta' }
                    ],
                    spikes: [
                        // Ceiling Spikes above Mid Ground
                        { x: 44, y: 8, count: 4, orientation: 'ceiling' },
                        // Floor Spikes in chasms
                        { x: 32, y: -3, count: 6, orientation: 'floor' }
                    ],
                    lasers: [],
                    crystals: [
                        { x: 3, y: 1.5 },
                        { x: 10, y: 8.5 },
                        { x: 14, y: 8.5 },
                        { x: 22, y: 0.5 },
                        { x: 32, y: 9.5 },
                        { x: 44, y: 1.5 },
                        { x: 54, y: 8.5 }
                    ],
                    checkpoints: [
                        { x: 22, y: -0.5 },
                        { x: 42, y: 0.5 }
                    ],
                    portal: { x: 65, y: 3.2 }
                };

            case 3:
                return {
                    name: "Level 3 — Moving Machinery",
                    themeColor: 0xe6ff00,
                    parTime: 45,
                    bounds: { minY: -10, maxY: 22, minX: -5, maxX: 90 },
                    startPos: { x: 0, y: 1.5, gravityDir: 1 },
                    platforms: [
                        // Start
                        { x: 2, y: 0, w: 8, h: 1, glow: 'cyan' },
                        // Horizontal Moving Platform 1
                        {
                            x: 12, y: 1, w: 5, h: 0.8, type: 'moving',
                            path: { from: { x: 8, y: 1 }, to: { x: 18, y: 1 } },
                            speed: 3.5
                        },
                        // Ceiling Landing
                        { x: 24, y: 10, w: 7, h: 1, glow: 'magenta' },
                        // Vertical Moving Elevator
                        {
                            x: 32, y: 4, w: 5, h: 0.8, type: 'moving',
                            path: { from: { x: 32, y: 1 }, to: { x: 32, y: 8 } },
                            speed: 3.0
                        },
                        // Central Solid Hub
                        { x: 42, y: 0, w: 10, h: 1, glow: 'cyan' },
                        // Ceiling Moving Platform
                        {
                            x: 54, y: 11, w: 5, h: 0.8, type: 'moving',
                            path: { from: { x: 50, y: 11 }, to: { x: 62, y: 11 } },
                            speed: 4.0
                        },
                        // Lower Step
                        { x: 68, y: -1, w: 6, h: 1, glow: 'cyan' },
                        // Final Platform
                        { x: 78, y: 1, w: 8, h: 1, glow: 'cyan' }
                    ],
                    spikes: [
                        // Spike Pit 1 under moving platform
                        { x: 13, y: -4, count: 12, orientation: 'floor' },
                        // Ceiling spikes near central hub
                        { x: 42, y: 9, count: 6, orientation: 'ceiling' },
                        // Spike Pit 2 under ceiling moving platform
                        { x: 56, y: -4, count: 14, orientation: 'floor' }
                    ],
                    lasers: [],
                    crystals: [
                        { x: 3, y: 1.5 },
                        { x: 13, y: 3.0 },
                        { x: 24, y: 8.5 },
                        { x: 32, y: 5.5 },
                        { x: 42, y: 1.5 },
                        { x: 56, y: 9.5 },
                        { x: 68, y: 0.5 },
                        { x: 74, y: 3.0 }
                    ],
                    checkpoints: [
                        { x: 24, y: 9.5 },
                        { x: 40, y: 0.5 }
                    ],
                    portal: { x: 79, y: 3.2 }
                };

            case 4:
                return {
                    name: "Level 4 — Laser Laboratory",
                    themeColor: 0xff0044,
                    parTime: 55,
                    bounds: { minY: -12, maxY: 24, minX: -5, maxX: 105 },
                    startPos: { x: 0, y: 1.5, gravityDir: 1 },
                    platforms: [
                        // Start
                        { x: 2, y: 0, w: 8, h: 1, glow: 'cyan' },
                        // Disappearing Platform 1
                        { x: 12, y: 1, w: 5, h: 0.8, type: 'disappearing', phaseInterval: 2.2 },
                        // Disappearing Platform 2 (Ceiling)
                        { x: 20, y: 10, w: 5, h: 0.8, type: 'disappearing', phaseInterval: 2.2 },
                        // Safe Island 1
                        { x: 28, y: 0, w: 7, h: 1, glow: 'cyan' },
                        // Ceiling Runway
                        { x: 38, y: 11, w: 10, h: 1, glow: 'magenta' },
                        // Moving Platform between Laser Gates
                        {
                            x: 52, y: 2, w: 5, h: 0.8, type: 'moving',
                            path: { from: { x: 48, y: 2 }, to: { x: 58, y: 2 } },
                            speed: 3.5
                        },
                        // Safe Island 2
                        { x: 66, y: 1, w: 8, h: 1, glow: 'cyan' },
                        // Dual Phasing Stepping Stones
                        { x: 76, y: 2, w: 4, h: 0.8, type: 'disappearing', phaseInterval: 1.8 },
                        { x: 84, y: 9, w: 4, h: 0.8, type: 'disappearing', phaseInterval: 1.8 },
                        // Final Platform
                        { x: 94, y: 1, w: 8, h: 1, glow: 'cyan' }
                    ],
                    spikes: [
                        { x: 12, y: -4, count: 8, orientation: 'floor' },
                        { x: 76, y: -4, count: 12, orientation: 'floor' }
                    ],
                    lasers: [
                        // Pulsing Laser 1
                        { x: 16, y: 5, length: 10, orientation: 'vertical', pulseInterval: 3.0 },
                        // Moving Laser Gate
                        {
                            x: 38, y: 4, length: 6, orientation: 'vertical',
                            movePath: { from: { x: 34, y: 4 }, to: { x: 42, y: 4 } },
                            speed: 2.5
                        },
                        // Pulsing Laser Gate 2
                        { x: 62, y: 5, length: 10, orientation: 'vertical', pulseInterval: 2.5 },
                        // Horizontal Laser in final section
                        { x: 80, y: 5, length: 8, orientation: 'horizontal', pulseInterval: 2.8 }
                    ],
                    crystals: [
                        { x: 3, y: 1.5 },
                        { x: 12, y: 2.5 },
                        { x: 20, y: 8.5 },
                        { x: 28, y: 1.5 },
                        { x: 38, y: 9.5 },
                        { x: 52, y: 3.5 },
                        { x: 66, y: 2.5 },
                        { x: 76, y: 3.5 },
                        { x: 84, y: 7.5 },
                        { x: 90, y: 3.0 }
                    ],
                    checkpoints: [
                        { x: 28, y: 0.5 },
                        { x: 65, y: 1.5 }
                    ],
                    portal: { x: 95, y: 3.2 }
                };

            case 5:
                return {
                    name: "Level 5 — The Gravity Core",
                    themeColor: 0x8a2be2,
                    parTime: 65,
                    bounds: { minY: -14, maxY: 26, minX: -5, maxX: 125 },
                    startPos: { x: 0, y: 1.5, gravityDir: 1 },
                    platforms: [
                        // 1. Initial Launchpad
                        { x: 2, y: 0, w: 8, h: 1, glow: 'cyan' },
                        // 2. High-Speed Moving Elevator
                        {
                            x: 12, y: 4, w: 4, h: 0.8, type: 'moving',
                            path: { from: { x: 12, y: 0 }, to: { x: 12, y: 10 } },
                            speed: 4.5
                        },
                        // 3. Ceiling Inversion Platform
                        { x: 22, y: 12, w: 8, h: 1, glow: 'magenta' },
                        // 4. Sequence of Alternating Phasing Steps
                        { x: 32, y: 2, w: 4, h: 0.8, type: 'disappearing', phaseInterval: 1.6 },
                        { x: 38, y: 11, w: 4, h: 0.8, type: 'disappearing', phaseInterval: 1.6 },
                        { x: 44, y: 1, w: 4, h: 0.8, type: 'disappearing', phaseInterval: 1.6 },
                        // 5. Central Reactor Hub
                        { x: 54, y: 0, w: 8, h: 1, glow: 'cyan' },
                        // 6. Oscillating Diagonal Moving Platform
                        {
                            x: 66, y: 5, w: 5, h: 0.8, type: 'moving',
                            path: { from: { x: 62, y: 1 }, to: { x: 72, y: 11 } },
                            speed: 4.0
                        },
                        // 7. Upper Core Catwalk
                        { x: 80, y: 12, w: 8, h: 1, glow: 'magenta' },
                        // 8. Dual Moving Platforms over Core Laser Sea
                        {
                            x: 90, y: 2, w: 4, h: 0.8, type: 'moving',
                            path: { from: { x: 88, y: 2 }, to: { x: 94, y: 2 } },
                            speed: 3.5
                        },
                        {
                            x: 100, y: 10, w: 4, h: 0.8, type: 'moving',
                            path: { from: { x: 98, y: 10 }, to: { x: 104, y: 10 } },
                            speed: 3.5
                        },
                        // 9. Final Chamber
                        { x: 112, y: 1, w: 10, h: 1, glow: 'cyan' }
                    ],
                    spikes: [
                        { x: 22, y: 10, count: 4, orientation: 'ceiling' },
                        { x: 38, y: -4, count: 18, orientation: 'floor' },
                        { x: 66, y: -4, count: 16, orientation: 'floor' },
                        { x: 80, y: 10, count: 4, orientation: 'ceiling' }
                    ],
                    lasers: [
                        // Reactor Beams
                        { x: 28, y: 6, length: 12, orientation: 'vertical', pulseInterval: 2.2 },
                        { x: 50, y: 6, length: 12, orientation: 'vertical', pulseInterval: 2.2 },
                        // Moving Core Hazard
                        {
                            x: 76, y: 6, length: 10, orientation: 'vertical',
                            movePath: { from: { x: 74, y: 6 }, to: { x: 78, y: 6 } },
                            speed: 3.0
                        },
                        // Bottom Laser Sea
                        { x: 95, y: -2, length: 24, orientation: 'horizontal', pulseInterval: 0 }
                    ],
                    crystals: [
                        { x: 3, y: 1.5 },
                        { x: 12, y: 6.0 },
                        { x: 22, y: 10.5 },
                        { x: 32, y: 3.5 },
                        { x: 38, y: 9.5 },
                        { x: 44, y: 2.5 },
                        { x: 54, y: 1.5 },
                        { x: 66, y: 6.0 },
                        { x: 80, y: 10.5 },
                        { x: 90, y: 3.5 },
                        { x: 100, y: 8.5 },
                        { x: 108, y: 2.5 }
                    ],
                    checkpoints: [
                        { x: 22, y: 11.5 },
                        { x: 53, y: 0.5 },
                        { x: 80, y: 11.5 }
                    ],
                    portal: { x: 113, y: 3.2 }
                };

            default:
                return this.getLevelData(1);
        }
    }
}
