// EffectsManager.js - Particle systems and visual effects for gravity flips, crystals, checkpoints, and portals.
import * as THREE from 'three';

export class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.shockwaves = [];
        this.ambientParticles = null;

        this.initAmbientDust();
    }

    initAmbientDust() {
        const count = 120;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        const color1 = new THREE.Color(0x00f3ff);
        const color2 = new THREE.Color(0xff00ff);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 150;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;

            const c = Math.random() > 0.5 ? color1 : color2;
            colors[i * 3] = c.r;
            colors[i * 3 + 1] = c.g;
            colors[i * 3 + 2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.25,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.ambientParticles = new THREE.Points(geometry, material);
        this.scene.add(this.ambientParticles);
    }

    createGravityFlipEffect(position, gravityDir) {
        // Shockwave ring
        const ringGeo = new THREE.RingGeometry(0.2, 0.45, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: gravityDir < 0 ? 0xff00a0 : 0x00f3ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);

        this.shockwaves.push({
            mesh: ring,
            life: 0.35,
            maxLife: 0.35,
            scaleSpeed: 18,
            gravityDir
        });

        // Burst particles
        this.spawnBurst(position, gravityDir < 0 ? 0xff00a0 : 0x00f3ff, 20, 4.5);
    }

    createCrystalEffect(position) {
        this.spawnBurst(position, 0x00ffff, 25, 5.0);
        this.spawnBurst(position, 0xffe600, 15, 3.5);
    }

    createCheckpointEffect(position) {
        this.spawnBurst(position, 0x00ff88, 30, 6.0);

        // Rising ring
        const ringGeo = new THREE.TorusGeometry(0.8, 0.08, 12, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);

        this.shockwaves.push({
            mesh: ring,
            life: 0.6,
            maxLife: 0.6,
            scaleSpeed: 5,
            vy: 4
        });
    }

    createDeathEffect(position) {
        this.spawnBurst(position, 0xff2244, 40, 8.0);
        this.spawnBurst(position, 0xffaa00, 20, 5.0);
    }

    createLandingEffect(position, gravityDir) {
        const contactPos = position.clone();
        contactPos.y += (gravityDir > 0 ? -0.7 : 0.7);
        this.spawnBurst(contactPos, 0x88ccff, 10, 2.5);
    }

    spawnBurst(position, colorHex, count, speed) {
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vels = [];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = position.x;
            pos[i * 3 + 1] = position.y;
            pos[i * 3 + 2] = position.z;

            const angle = Math.random() * Math.PI * 2;
            const spread = (Math.random() - 0.5) * Math.PI;
            const spd = speed * (0.4 + Math.random() * 0.8);

            vels.push({
                x: Math.cos(angle) * Math.cos(spread) * spd,
                y: Math.sin(angle) * Math.cos(spread) * spd,
                z: Math.sin(spread) * spd * 0.4
            });
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

        const mat = new THREE.PointsMaterial({
            color: colorHex,
            size: 0.22,
            transparent: true,
            opacity: 1.0,
            blending: THREE.AdditiveBlending
        });

        const points = new THREE.Points(geo, mat);
        this.scene.add(points);

        this.particles.push({
            points,
            vels,
            life: 0.5,
            maxLife: 0.5
        });
    }

    update(dt, playerPos) {
        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            const progress = 1 - sw.life / sw.maxLife;

            const scale = 1 + progress * sw.scaleSpeed;
            sw.mesh.scale.set(scale, scale, scale);
            if (sw.vy) {
                sw.mesh.position.y += sw.vy * dt;
            }
            sw.mesh.material.opacity = (1 - progress) * 0.9;

            if (sw.life <= 0) {
                this.scene.remove(sw.mesh);
                sw.mesh.geometry.dispose();
                sw.mesh.material.dispose();
                this.shockwaves.splice(i, 1);
            }
        }

        // Update particle bursts
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            const progress = 1 - p.life / p.maxLife;

            const posAttr = p.points.geometry.attributes.position;
            const arr = posAttr.array;

            for (let j = 0; j < p.vels.length; j++) {
                arr[j * 3] += p.vels[j].x * dt;
                arr[j * 3 + 1] += p.vels[j].y * dt;
                arr[j * 3 + 2] += p.vels[j].z * dt;

                // slight drag
                p.vels[j].x *= 0.96;
                p.vels[j].y *= 0.96;
                p.vels[j].z *= 0.96;
            }

            posAttr.needsUpdate = true;
            p.points.material.opacity = (1 - progress);

            if (p.life <= 0) {
                this.scene.remove(p.points);
                p.points.geometry.dispose();
                p.points.material.dispose();
                this.particles.splice(i, 1);
            }
        }

        // Follow player with ambient particles smoothly
        if (this.ambientParticles && playerPos) {
            this.ambientParticles.position.x = playerPos.x * 0.2;
            this.ambientParticles.rotation.y += dt * 0.05;
        }
    }

    clear() {
        this.shockwaves.forEach(sw => {
            this.scene.remove(sw.mesh);
            sw.mesh.geometry.dispose();
            sw.mesh.material.dispose();
        });
        this.shockwaves = [];

        this.particles.forEach(p => {
            this.scene.remove(p.points);
            p.points.geometry.dispose();
            p.points.material.dispose();
        });
        this.particles = [];
    }
}
