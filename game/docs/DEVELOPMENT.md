# Development and Architecture Guide

This document describes the software architecture, design patterns, physics simulation, procedural audio engine, and development conventions used in **Gravity Flip Adventure**.

---

### System Architecture Overview

The game is structured using modular ES6 classes without external physics or audio framework overhead:

```text
src/
├── main.js                 # Entry point & PWA service worker registration
├── style.css               # Glassmorphism theme, responsiveness, animations
├── audio/
│   └── AudioManager.js     # Web Audio API sound synthesis and ambient BGM
├── game/
│   ├── Game.js             # Main engine loop, camera tracking, scene lifecycle
│   ├── Player.js           # Kinematics, mesh hierarchy, suit lights & animations
│   ├── CollisionSystem.js  # Sub-stepped AABB physics & trigger resolution
│   ├── LevelManager.js     # Level layouts, hazards, moving platforms & portals
│   ├── InputManager.js     # Multi-touch pointer tracker & keyboard mapper
│   └── EffectsManager.js   # Particle bursts, shockwaves & ambient dust
├── storage/
│   └── StorageManager.js   # LocalStorage schema & progress persistence
└── ui/
    └── UIManager.js        # DOM HUD, glassmorphism modals & button bindings
```

---

### Core Subsystems

#### 1. Game State Machine (`Game.js`)
The engine operates on a deterministic finite state machine defined by `GAME_STATES`:
- `MENU`: Preview camera panning across the level, rendering idle animations.
- `PLAYING`: Active physics simulation, timer increments, and player control.
- `PAUSED`: Physics, particle, and timer updates suspended; render loop preserves frame.
- `DYING`: Player input disabled, failure particle burst active, respawn countdown.
- `LEVEL_COMPLETE`: Victory modal displayed, completion metrics computed.

#### 2. Physics & Collision Resolution (`CollisionSystem.js`)
- **Sub-Stepping**: Divides each frame's delta time (`dt`) into 3 discrete sub-steps (`dt / 3`) to prevent tunneling at high terminal velocities.
- **Moving Platform Coupling**: Translates player along moving platform vectors before evaluating kinematic collisions.
- **Axis-Aligned Bounding Box (AABB)**: Evaluates horizontal and vertical overlaps separately to ensure robust ledge catching and platform landing from both floor and ceiling orientations.

#### 3. Character Kinematics & Gravity Inversion (`Player.js`)
- **Kinematic Variables**:
  - Normal Gravity: Accelerates downward along $-Y$ axis (`velocity.y -= gravityStrength * dt`).
  - Reversed Gravity: Accelerates upward along $+Y$ axis (`velocity.y += gravityStrength * dt`).
- **Surface Jumping**: Jump impulse direction dynamically scales with gravity state:
  $$\text{Impulse}_Y = \text{jumpForce} \times \text{gravityDir}$$
- **Orientation Interpolation**: Character models smoothly rotate along the $Z$ axis towards target rotation ($0$ for floor, $\pi$ for ceiling) and the $Y$ axis towards travel direction using `THREE.MathUtils.damp`.
- **Dynamic Lighting**: Includes an attached `THREE.PointLight` on the character chest that shifts between electric cyan (`0x00f3ff`) and neon magenta (`0xff00a0`) upon gravity inversion.

#### 4. Procedural Audio Synthesizer (`AudioManager.js`)
- Employs the native **Web Audio API** with zero external audio assets.
- **Procedural Sound FX**:
  - *Jump*: Frequency sweep oscillator ($180\text{ Hz} \to 420\text{ Hz}$).
  - *Gravity Flip*: Resonant low-pass filter sweep with pink noise burst.
  - *Crystal Pickup*: Two-tone arpeggio sine wave ($880\text{ Hz} \to 1320\text{ Hz}$).
  - *Checkpoint*: Chime chord ($523\text{ Hz}, 659\text{ Hz}, 784\text{ Hz}$).
  - *Level Complete*: Ascending fanfare.
- **Ambient Synth BGM**: Step sequencer scheduling chord progression pads and arpeggiated bass notes.

#### 5. Local Storage Persistence Schema (`StorageManager.js`)
Persisted under key `gravity_flip_adventure_save_v1`:

```json
{
  "settings": {
    "soundEnabled": true,
    "musicEnabled": true,
    "masterVolume": 0.8,
    "sfxVolume": 0.8,
    "musicVolume": 0.5,
    "visualQuality": "high",
    "difficulty": "medium"
  },
  "progress": {
    "unlockedLevels": 1,
    "levels": {
      "1": {
        "completed": false,
        "highScores": { "easy": 0, "medium": 0, "hard": 0 },
        "bestTimes": { "easy": null, "medium": null, "hard": null },
        "stars": { "easy": 0, "medium": 0, "hard": 0 }
      }
    }
  }
}
```

---

### Difficulty Scaling Matrix

Difficulty modes adjust game parameters dynamically without altering underlying geometry:

| Parameter | Easy | Medium | Hard |
|---|---|---|---|
| **Player Move Speed** | $9.5\text{ m/s}$ | $10.5\text{ m/s}$ | $11.5\text{ m/s}$ |
| **Gravity Acceleration** | $24.0\text{ m/s}^2$ | $28.0\text{ m/s}^2$ | $32.0\text{ m/s}^2$ |
| **Jump Impulse Force** | $11.5\text{ m/s}$ | $12.5\text{ m/s}$ | $13.5\text{ m/s}$ |
| **Moving Platform Speed** | $0.8\times$ | $1.0\times$ | $1.25\times$ |
| **Laser Pulse Interval** | $1.25\times$ (Slower) | $1.0\times$ (Normal) | $0.8\times$ (Faster) |
| **Score Multiplier** | $1.0\times$ | $1.5\times$ | $2.0\times$ |

---

### Code Conventions & Guidelines

1. **Pure ES Modules**: Use standard `import` and `export` statements.
2. **Object Pooling & Resource Disposal**: Reuse `THREE.Geometry` and `THREE.Material` instances via `LevelManager.initSharedResources()` to minimize garbage collection spikes.
3. **Delta-Time Normalization**: All kinematics and particle lifespans must scale with frame delta time `dt`, clamped to a maximum step of $0.05\text{s}$ to avoid instability during tab suspension.
