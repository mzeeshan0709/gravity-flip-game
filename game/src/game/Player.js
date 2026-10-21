/**
 * @file Player.js
 * @description 3D Character model, physics state, gravity flipping, suit lighting, and procedural animations.
 */
import * as THREE from 'three';
import { audio } from '../audio/AudioManager.js';

/**
 * Represents the cybernetic player character in the 3D scene.
 * Handles procedural kinematics, AABB bounding calculations, gravity inversion state,
 * dynamic suit emissive updates, and dedicated point light illumination.
 */
export class Player {
    /**
     * @param {THREE.Scene} scene - The active Three.js scene.
     * @param {import('./EffectsManager.js').EffectsManager} effects - Particle effects manager.
     */
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;

        // Bounding dimensions
        this.width = 0.8;
        this.height = 1.4;
        this.depth = 0.8;

        // Physics State
        this.position = new THREE.Vector3(0, 2, 0);
        this.velocity = new THREE.Vector2(0, 0);
        this.gravityDir = 1; // 1 = Normal (pulls down -Y), -1 = Reversed (pulls up +Y)
        this.isGrounded = false;
        this.standingPlatform = null;

        // Gameplay parameters (adjusted by difficulty)
        this.moveSpeed = 10.0;
        this.acceleration = 55.0;
        this.deceleration = 45.0;
        this.jumpForce = 12.5;
        this.gravityStrength = 28.0;
        this.maxFallSpeed = 22.0;

        // Flip & State cooldowns
        this.flipCooldown = 0.15;
        this.flipTimer = 0;
        this.isAlive = true;
        this.deathTimer = 0;

        // Animation states
        this.facing = 1; // 1 = Right, -1 = Left
        this.targetFacingRot = 0;
        this.currentFacingRot = 0;
        this.targetFlipRot = 0;
        this.currentFlipRot = 0;
        this.runCycle = 0;
        this.squashStretch = new THREE.Vector3(1, 1, 1);

        this.initMesh();
    }

    initMesh() {
        this.mesh = new THREE.Group();

        // Materials
        this.armorMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.35,
            roughness: 0.25,
            metalness: 0.35
        });

        this.accentMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00f3ff,
            emissiveIntensity: 1.2,
            roughness: 0.15,
            metalness: 0.2
        });

        this.visorMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00f3ff,
            emissiveIntensity: 1.5,
            roughness: 0.1,
            metalness: 0.9
        });

        this.coreMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            emissive: 0x00f3ff,
            emissiveIntensity: 1.8,
            roughness: 0.1
        });

        this.jointMat = new THREE.MeshStandardMaterial({
            color: 0x475569,
            emissive: 0x1e293b,
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.3
        });

        // Dedicated Character Illumination Light
        this.playerLight = new THREE.PointLight(0x00f3ff, 2.2, 10, 2.0);
        this.playerLight.position.set(0, 0.4, 1.2);
        this.mesh.add(this.playerLight);

        // 1. Torso
        const torsoGeo = new THREE.BoxGeometry(0.5, 0.55, 0.35);
        this.torso = new THREE.Mesh(torsoGeo, this.armorMat);
        this.torso.position.y = 0.05;
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        // Chest Armor Plate overlay
        const chestPlateGeo = new THREE.BoxGeometry(0.42, 0.42, 0.06);
        const chestPlate = new THREE.Mesh(chestPlateGeo, this.armorMat);
        chestPlate.position.set(0, 0.04, 0.16);
        this.torso.add(chestPlate);

        // Belt / Waist Trim
        const beltGeo = new THREE.BoxGeometry(0.52, 0.08, 0.37);
        const belt = new THREE.Mesh(beltGeo, this.accentMat);
        belt.position.set(0, -0.22, 0);
        this.torso.add(belt);

        // Reactor Core
        const coreGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 16);
        this.core = new THREE.Mesh(coreGeo, this.coreMat);
        this.core.rotation.x = Math.PI / 2;
        this.core.position.set(0, 0.08, 0.18);
        this.torso.add(this.core);

        // Jetpack
        const jetpackGeo = new THREE.BoxGeometry(0.35, 0.45, 0.15);
        this.jetpack = new THREE.Mesh(jetpackGeo, this.armorMat);
        this.jetpack.position.set(0, 0.05, -0.22);
        this.torso.add(this.jetpack);

        // Thruster Nozzles
        const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.12, 12);
        const nozzleL = new THREE.Mesh(nozzleGeo, this.jointMat);
        nozzleL.position.set(-0.1, -0.25, -0.22);
        this.torso.add(nozzleL);

        const nozzleR = new THREE.Mesh(nozzleGeo, this.jointMat);
        nozzleR.position.set(0.1, -0.25, -0.22);
        this.torso.add(nozzleR);

        // Thruster Glow Rings
        const thrustGlowGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.04, 12);
        const thrustGlowL = new THREE.Mesh(thrustGlowGeo, this.accentMat);
        thrustGlowL.position.set(-0.1, -0.32, -0.22);
        this.torso.add(thrustGlowL);

        const thrustGlowR = new THREE.Mesh(thrustGlowGeo, this.accentMat);
        thrustGlowR.position.set(0.1, -0.32, -0.22);
        this.torso.add(thrustGlowR);

        // 2. Head
        this.headGroup = new THREE.Group();
        this.headGroup.position.y = 0.45;

        const helmetGeo = new THREE.BoxGeometry(0.42, 0.38, 0.42);
        this.helmet = new THREE.Mesh(helmetGeo, this.armorMat);
        this.helmet.castShadow = true;
        this.headGroup.add(this.helmet);

        // Helmet Crest / Antenna
        const crestGeo = new THREE.BoxGeometry(0.1, 0.06, 0.44);
        const crest = new THREE.Mesh(crestGeo, this.accentMat);
        crest.position.set(0, 0.21, 0);
        this.headGroup.add(crest);

        // Helmet Ear Pods
        const earGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.46, 12);
        const ears = new THREE.Mesh(earGeo, this.accentMat);
        ears.rotation.z = Math.PI / 2;
        ears.position.set(0, 0, 0);
        this.headGroup.add(ears);

        const visorGeo = new THREE.BoxGeometry(0.36, 0.18, 0.1);
        this.visor = new THREE.Mesh(visorGeo, this.visorMat);
        this.visor.position.set(0, 0.02, 0.2);
        this.headGroup.add(this.visor);

        this.mesh.add(this.headGroup);

        // 3. Limbs (Left & Right Arms, Left & Right Legs)
        const limbGeo = new THREE.BoxGeometry(0.15, 0.45, 0.15);

        // Left Arm
        this.armL = new THREE.Mesh(limbGeo, this.jointMat);
        this.armL.position.set(-0.35, 0.05, 0);
        this.armL.castShadow = true;

        const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), this.armorMat);
        shoulderL.position.set(0, 0.16, 0);
        this.armL.add(shoulderL);

        const gauntletL = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.17), this.accentMat);
        gauntletL.position.set(0, -0.15, 0);
        this.armL.add(gauntletL);

        this.mesh.add(this.armL);

        // Right Arm
        this.armR = new THREE.Mesh(limbGeo, this.jointMat);
        this.armR.position.set(0.35, 0.05, 0);
        this.armR.castShadow = true;

        const shoulderR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), this.armorMat);
        shoulderR.position.set(0, 0.16, 0);
        this.armR.add(shoulderR);

        const gauntletR = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.17), this.accentMat);
        gauntletR.position.set(0, -0.15, 0);
        this.armR.add(gauntletR);

        this.mesh.add(this.armR);

        // Left Leg
        this.legL = new THREE.Mesh(limbGeo, this.jointMat);
        this.legL.position.set(-0.18, -0.45, 0);
        this.legL.castShadow = true;

        const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), this.armorMat);
        thighL.position.set(0, 0.12, 0);
        this.legL.add(thighL);

        const bootL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.22), this.armorMat);
        bootL.position.set(0, -0.15, 0.02);
        this.legL.add(bootL);

        const bootTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.23), this.accentMat);
        bootTrimL.position.set(0, -0.21, 0.02);
        this.legL.add(bootTrimL);

        this.mesh.add(this.legL);

        // Right Leg
        this.legR = new THREE.Mesh(limbGeo, this.jointMat);
        this.legR.position.set(0.18, -0.45, 0);
        this.legR.castShadow = true;

        const thighR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), this.armorMat);
        thighR.position.set(0, 0.12, 0);
        this.legR.add(thighR);

        const bootR = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.22), this.armorMat);
        bootR.position.set(0, -0.15, 0.02);
        this.legR.add(bootR);

        const bootTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.04, 0.23), this.accentMat);
        bootTrimR.position.set(0, -0.21, 0.02);
        this.legR.add(bootTrimR);

        this.mesh.add(this.legR);

        // Gravity Ring Aura (Subtle glowing ring around feet/center)
        const auraGeo = new THREE.RingGeometry(0.45, 0.52, 24);
        this.auraMat = new THREE.MeshBasicMaterial({
            color: 0x00f3ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35
        });
        this.aura = new THREE.Mesh(auraGeo, this.auraMat);
        this.aura.rotation.x = Math.PI / 2;
        this.aura.position.y = -0.65;
        this.mesh.add(this.aura);

        this.scene.add(this.mesh);
    }

    /**
     * Applies difficulty scaling parameters to player kinematics.
     * @param {'easy'|'medium'|'hard'} diff
     */
    setDifficultyParameters(diff) {
        if (diff === 'easy') {
            this.moveSpeed = 9.5;
            this.gravityStrength = 24.0;
            this.jumpForce = 11.5;
        } else if (diff === 'medium') {
            this.moveSpeed = 10.5;
            this.gravityStrength = 28.0;
            this.jumpForce = 12.5;
        } else if (diff === 'hard') {
            this.moveSpeed = 11.5;
            this.gravityStrength = 32.0;
            this.jumpForce = 13.5;
        }
    }

    /**
     * Resets player state and positions the character at the specified coordinates.
     * @param {number} x - Target horizontal position.
     * @param {number} y - Target vertical position.
     * @param {number} [gravityDir=1] - Starting gravity direction (1 for down, -1 for up).
     */
    reset(x = 0, y = 2, gravityDir = 1) {
        this.position.set(x, y, 0);
        this.velocity.set(0, 0);
        this.gravityDir = gravityDir;
        this.targetFlipRot = gravityDir < 0 ? Math.PI : 0;
        this.currentFlipRot = this.targetFlipRot;
        this.isGrounded = false;
        this.standingPlatform = null;
        this.isAlive = true;
        this.deathTimer = 0;
        this.flipTimer = 0;
        this.squashStretch.set(1, 1, 1);
        this.mesh.visible = true;
        this.updateVisorColor();
        this.updateMeshTransform();
    }

    /**
     * Inverts the gravitational polarity (Normal ↔ Reversed).
     */
    flipGravity() {
        if (!this.isAlive || this.flipTimer > 0) return;

        this.gravityDir = -this.gravityDir;
        this.targetFlipRot = this.gravityDir < 0 ? Math.PI : 0;
        this.flipTimer = this.flipCooldown;
        this.isGrounded = false;
        this.standingPlatform = null;

        // Sound & Visual effect
        audio.playGravityFlip();
        if (this.effects) {
            this.effects.createGravityFlipEffect(this.position, this.gravityDir);
        }

        this.updateVisorColor();
    }

    /**
     * Updates visor, core, trim, and suit light colors based on current gravity polarity.
     */
    updateVisorColor() {
        const isReversed = this.gravityDir < 0;
        const colorHex = isReversed ? 0xff00a0 : 0x00f3ff;
        const armorColor = isReversed ? 0xf472b6 : 0x38bdf8;
        const armorEmissive = isReversed ? 0x831843 : 0x0284c7;

        if (this.armorMat) {
            this.armorMat.color.setHex(armorColor);
            this.armorMat.emissive.setHex(armorEmissive);
        }
        if (this.accentMat) {
            this.accentMat.color.setHex(colorHex);
            this.accentMat.emissive.setHex(colorHex);
        }
        if (this.visorMat) {
            this.visorMat.color.setHex(colorHex);
            this.visorMat.emissive.setHex(colorHex);
        }
        if (this.coreMat) {
            this.coreMat.color.setHex(colorHex);
            this.coreMat.emissive.setHex(colorHex);
        }
        if (this.auraMat) {
            this.auraMat.color.setHex(colorHex);
        }
        if (this.playerLight) {
            this.playerLight.color.setHex(colorHex);
        }
    }

    /**
     * Executes a jump impulse directed away from the supporting platform surface.
     */
    jump() {
        if (!this.isAlive || !this.isGrounded) return;

        // Jump impulse directed away from supporting surface
        if (this.gravityDir > 0) {
            // Normal gravity: jump UP (+Y)
            this.velocity.y = this.jumpForce;
        } else {
            // Reversed gravity: jump DOWN (-Y)
            this.velocity.y = -this.jumpForce;
        }

        this.isGrounded = false;
        this.standingPlatform = null;
        this.squashStretch.set(0.75, 1.3, 0.75);

        audio.playJump();
    }

    /**
     * Resolves player landing on a supporting platform.
     * @param {Object} platform - The platform entity landed on.
     */
    land(platform) {
        if (!this.isGrounded) {
            this.isGrounded = true;
            this.standingPlatform = platform || null;
            this.squashStretch.set(1.3, 0.7, 1.3);
            audio.playLanding();
            if (this.effects) {
                this.effects.createLandingEffect(this.position, this.gravityDir);
            }
        }
    }

    /**
     * Triggers player death state and failure visual effects.
     */
    die() {
        if (!this.isAlive) return;

        this.isAlive = false;
        this.deathTimer = 0.8;
        this.mesh.visible = false;
        audio.playDeath();
        if (this.effects) {
            this.effects.createDeathEffect(this.position);
        }
    }

    /**
     * Updates kinematics, inputs, gravity acceleration, and cooldown timers per frame.
     * @param {number} dt - Frame delta time in seconds.
     * @param {Object} input - Current input state from InputManager.
     */
    updatePhysics(dt, input) {
        if (!this.isAlive) {
            this.deathTimer -= dt;
            return;
        }

        if (this.flipTimer > 0) {
            this.flipTimer -= dt;
        }

        // Horizontal Movement
        let moveInput = 0;
        if (input.keys.left) moveInput -= 1;
        if (input.keys.right) moveInput += 1;

        if (moveInput !== 0) {
            this.facing = moveInput;
            this.targetFacingRot = moveInput > 0 ? 0 : Math.PI;

            const targetVx = moveInput * this.moveSpeed;
            if (Math.sign(this.velocity.x) === moveInput) {
                this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, this.acceleration, dt);
            } else {
                this.velocity.x = THREE.MathUtils.damp(this.velocity.x, targetVx, this.deceleration * 1.5, dt);
            }
        } else {
            this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, this.deceleration, dt);
        }

        // Jump & Flip Inputs
        if (input.consumeJustPressed('jump')) {
            this.jump();
        }
        if (input.consumeJustPressed('flip')) {
            this.flipGravity();
        }

        // Apply Gravity
        const grav = this.gravityStrength * this.gravityDir;
        this.velocity.y -= grav * dt;

        // Clamp Terminal Velocity
        if (this.gravityDir > 0) {
            this.velocity.y = Math.max(-this.maxFallSpeed, this.velocity.y);
        } else {
            this.velocity.y = Math.min(this.maxFallSpeed, this.velocity.y);
        }
    }

    /**
     * Updates character procedural animations, limb oscillations, and squash/stretch interpolation.
     * @param {number} dt - Frame delta time in seconds.
     */
    updateAnimations(dt) {
        if (!this.isAlive) return;

        // Smooth Facing Rotation
        this.currentFacingRot = THREE.MathUtils.damp(this.currentFacingRot, this.targetFacingRot, 18, dt);

        // Smooth Gravity Flip Rotation (Upside down on Z axis)
        this.currentFlipRot = THREE.MathUtils.damp(this.currentFlipRot, this.targetFlipRot, 20, dt);

        // Squash and stretch decay
        this.squashStretch.x = THREE.MathUtils.damp(this.squashStretch.x, 1, 12, dt);
        this.squashStretch.y = THREE.MathUtils.damp(this.squashStretch.y, 1, 12, dt);
        this.squashStretch.z = THREE.MathUtils.damp(this.squashStretch.z, 1, 12, dt);

        // Limb swinging
        const speedRatio = Math.abs(this.velocity.x) / this.moveSpeed;
        if (this.isGrounded && speedRatio > 0.1) {
            this.runCycle += dt * 14 * speedRatio;
            const swing = Math.sin(this.runCycle) * 0.65;
            this.legL.rotation.x = swing;
            this.legR.rotation.x = -swing;
            this.armL.rotation.x = -swing;
            this.armR.rotation.x = swing;
            this.torso.position.y = 0.05 + Math.abs(Math.sin(this.runCycle * 2)) * 0.05;
        } else if (!this.isGrounded) {
            // Airborne tuck
            this.legL.rotation.x = -0.4;
            this.legR.rotation.x = 0.4;
            this.armL.rotation.x = 0.6;
            this.armR.rotation.x = -0.6;
            this.torso.position.y = 0.05;
        } else {
            // Idle breathing
            this.legL.rotation.x = 0;
            this.legR.rotation.x = 0;
            this.armL.rotation.x = 0;
            this.armR.rotation.x = 0;
            this.torso.position.y = 0.05 + Math.sin(Date.now() * 0.003) * 0.02;
        }

        // Aura pulse
        this.aura.rotation.z += dt * 2.0;

        this.updateMeshTransform();
    }

    updateMeshTransform() {
        this.mesh.position.set(this.position.x, this.position.y, 0);
        this.mesh.rotation.y = this.currentFacingRot;
        this.mesh.rotation.z = this.currentFlipRot;
        this.mesh.scale.set(this.squashStretch.x, this.squashStretch.y, this.squashStretch.z);
    }

    /**
     * Calculates the Axis-Aligned Bounding Box (AABB) for collision checks.
     * @returns {{minX: number, maxX: number, minY: number, maxY: number}}
     */
    getAABB() {
        return {
            minX: this.position.x - this.width / 2,
            maxX: this.position.x + this.width / 2,
            minY: this.position.y - this.height / 2,
            maxY: this.position.y + this.height / 2
        };
    }
}
