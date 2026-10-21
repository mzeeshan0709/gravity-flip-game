/**
 * @file CollisionSystem.js
 * @description Accurate 2.5D AABB physics collision resolution, moving platform attachments, and hazard/trigger checks.
 */

/**
 * Manages physics collision detection and response for the player entity against
 * static platforms, moving platforms, disappearing platforms, deadly hazards, and trigger items.
 */
export class CollisionSystem {
    constructor() {}

    /**
     * Resolves all player physics and trigger collisions for the current frame.
     * Uses sub-stepping (3 sub-steps per frame) to prevent tunneling through thin platforms at high velocity.
     * 
     * @param {import('./Player.js').Player} player - The active player entity.
     * @param {import('./LevelManager.js').LevelManager} level - The current active level manager.
     * @param {number} dt - Frame delta time in seconds.
     */
    resolvePlayerCollisions(player, level, dt) {
        if (!player.isAlive) return;

        // Sub-stepping to prevent tunneling at high velocity
        const subSteps = 3;
        const subDt = dt / subSteps;

        for (let step = 0; step < subSteps; step++) {
            // 1. If standing on moving platform, apply platform movement first
            if (player.standingPlatform && player.standingPlatform.type === 'moving' && player.isGrounded) {
                const plat = player.standingPlatform;
                if (plat.deltaPos) {
                    player.position.x += plat.deltaPos.x / subSteps;
                    player.position.y += plat.deltaPos.y / subSteps;
                }
            }

            // 2. Horizontal movement & collision
            player.position.x += player.velocity.x * subDt;
            this.checkHorizontalCollisions(player, level.platforms);

            // 3. Vertical movement & collision
            player.position.y += player.velocity.y * subDt;
            const landedPlatform = this.checkVerticalCollisions(player, level.platforms);

            if (landedPlatform) {
                player.land(landedPlatform);
            } else {
                // If we were grounded, verify if we walked off platform
                if (player.isGrounded) {
                    const stillOn = this.isStillOnPlatform(player, player.standingPlatform);
                    if (!stillOn) {
                        player.isGrounded = false;
                        player.standingPlatform = null;
                    }
                }
            }
        }

        // 4. Hazard Collisions (Spikes, Active Lasers, Void)
        this.checkHazardCollisions(player, level);

        // 5. Trigger Collisions (Crystals, Checkpoints, Portal)
        this.checkTriggerCollisions(player, level);
    }

    /**
     * Checks horizontal collisions and resolves overlap against solid platforms.
     * @param {import('./Player.js').Player} player
     * @param {Array<Object>} platforms
     */
    checkHorizontalCollisions(player, platforms) {
        const pBox = player.getAABB();

        for (const plat of platforms) {
            if (!this.isPlatformSolid(plat)) continue;

            const bBox = plat.getAABB();

            // Check AABB overlap with slight vertical margin
            const overlapX = (pBox.maxX > bBox.minX && pBox.minX < bBox.maxX);
            const overlapY = (pBox.maxY - 0.15 > bBox.minY && pBox.minY + 0.15 < bBox.maxY);

            if (overlapX && overlapY) {
                // Determine collision side
                if (player.velocity.x > 0 && pBox.maxX > bBox.minX && pBox.minX < bBox.minX) {
                    player.position.x = bBox.minX - player.width / 2;
                    player.velocity.x = 0;
                } else if (player.velocity.x < 0 && pBox.minX < bBox.maxX && pBox.maxX > bBox.maxX) {
                    player.position.x = bBox.maxX + player.width / 2;
                    player.velocity.x = 0;
                }
            }
        }
    }

    /**
     * Checks vertical collisions and lands or bumps the player against solid platforms.
     * @param {import('./Player.js').Player} player
     * @param {Array<Object>} platforms
     * @returns {Object|null} The platform landed on, if any.
     */
    checkVerticalCollisions(player, platforms) {
        const pBox = player.getAABB();
        let landedPlat = null;

        for (const plat of platforms) {
            if (!this.isPlatformSolid(plat)) continue;

            const bBox = plat.getAABB();

            // Horizontal span must overlap
            const overlapX = (pBox.maxX > bBox.minX + 0.05 && pBox.minX < bBox.maxX - 0.05);
            if (!overlapX) continue;

            if (player.gravityDir > 0) {
                // NORMAL GRAVITY:
                // Landing on floor (moving down or standing): player.bottom <= platform.top
                if (player.velocity.y <= 0 && pBox.minY <= bBox.maxY && pBox.maxY > bBox.maxY) {
                    // Check if player came from above or is within landing threshold
                    if (pBox.minY >= bBox.maxY - 0.5) {
                        player.position.y = bBox.maxY + player.height / 2;
                        player.velocity.y = 0;
                        landedPlat = plat;
                    }
                }
                // Hitting ceiling (jumping up): player.top >= platform.bottom
                else if (player.velocity.y > 0 && pBox.maxY >= bBox.minY && pBox.minY < bBox.minY) {
                    if (pBox.maxY <= bBox.minY + 0.5) {
                        player.position.y = bBox.minY - player.height / 2;
                        player.velocity.y = 0;
                    }
                }
            } else {
                // REVERSED GRAVITY:
                // Landing on ceiling (moving up or standing): player.top >= platform.bottom
                if (player.velocity.y >= 0 && pBox.maxY >= bBox.minY && pBox.minY < bBox.minY) {
                    if (pBox.maxY <= bBox.minY + 0.5) {
                        player.position.y = bBox.minY - player.height / 2;
                        player.velocity.y = 0;
                        landedPlat = plat;
                    }
                }
                // Hitting floor (falling/jumping down): player.bottom <= platform.top
                else if (player.velocity.y < 0 && pBox.minY <= bBox.maxY && pBox.maxY > bBox.maxY) {
                    if (pBox.minY >= bBox.maxY - 0.5) {
                        player.position.y = bBox.maxY + player.height / 2;
                        player.velocity.y = 0;
                    }
                }
            }
        }

        return landedPlat;
    }

    isStillOnPlatform(player, platform) {
        if (!platform || !this.isPlatformSolid(platform)) return false;

        const pBox = player.getAABB();
        const bBox = platform.getAABB();

        const overlapX = (pBox.maxX > bBox.minX + 0.05 && pBox.minX < bBox.maxX - 0.05);
        if (!overlapX) return false;

        if (player.gravityDir > 0) {
            // Normal gravity: on top
            return Math.abs(pBox.minY - bBox.maxY) < 0.25;
        } else {
            // Reversed gravity: on underside
            return Math.abs(pBox.maxY - bBox.minY) < 0.25;
        }
    }

    isPlatformSolid(plat) {
        return !(plat.type === 'disappearing' && !plat.isSolid);
    }

    checkHazardCollisions(player, level) {
        const pBox = player.getAABB();

        // 1. Fall / Fly out of bounds
        if (player.position.y < level.bounds.minY || player.position.y > level.bounds.maxY) {
            player.die();
            return;
        }

        // 2. Spikes
        for (const spike of level.spikes) {
            const sBox = spike.getAABB();
            if (this.boxesOverlap(pBox, sBox, 0.12)) {
                player.die();
                return;
            }
        }

        // 3. Lasers
        for (const laser of level.lasers) {
            if (laser.isActive) {
                const lBox = laser.getAABB();
                if (this.boxesOverlap(pBox, lBox, 0.1)) {
                    player.die();
                    return;
                }
            }
        }
    }

    checkTriggerCollisions(player, level) {
        // 1. Crystals
        for (const crystal of level.crystals) {
            if (!crystal.collected) {
                const dist = player.position.distanceTo(crystal.mesh.position);
                if (dist < 1.25) {
                    level.collectCrystal(crystal);
                }
            }
        }

        // 2. Checkpoints
        for (const cp of level.checkpoints) {
            if (!cp.isActive) {
                const dist = player.position.distanceTo(cp.position);
                if (dist < 1.5) {
                    level.activateCheckpoint(cp, player.gravityDir);
                }
            }
        }

        // 3. Portal
        if (level.portal) {
            const dist = player.position.distanceTo(level.portal.position);
            if (dist < 1.6) {
                level.triggerLevelComplete();
            }
        }
    }

    boxesOverlap(boxA, boxB, margin = 0) {
        return (
            boxA.maxX - margin > boxB.minX &&
            boxA.minX + margin < boxB.maxX &&
            boxA.maxY - margin > boxB.minY &&
            boxA.minY + margin < boxB.maxY
        );
    }
}
