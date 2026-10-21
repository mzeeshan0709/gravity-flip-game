# Testing and Verification Guide

This document outlines manual verification procedures, physics edge cases, cross-device testing matrices, and known verification parameters for **Gravity Flip Adventure**.

---

### Manual Verification Checklist

When validating updates to the game engine, complete the following test matrix:

#### 1. Movement & Kinematics
- [x] **Horizontal Locomotion**: Character accelerates smoothly using `A`/`D` (or Left/Right keys) and comes to a controlled stop via deceleration.
- [x] **Facing Rotation**: Mesh rotates smoothly along the Y-axis to match the active direction of movement.
- [x] **Jump Mechanics**:
  - In Normal Gravity: Propels character upward (+Y) upon pressing `W`/`Up`.
  - In Reversed Gravity: Propels character downward (-Y) upon pressing `W`/`Up`.
- [x] **Gravity Inversion**:
  - `Spacebar` (or touch button) flips gravity direction immediately.
  - Character smoothly rotates 180° around the Z-axis.
  - Suit visor and core reactor shift from Cyan to Magenta in reversed gravity.
  - Flip cooldown (0.2s) prevents rapid jitter when button is mashed.

#### 2. Collision System & Platforms
- [x] **Sub-Stepping Validation**: High-speed falls clamp at terminal velocity (22 m/s) without penetrating through thin platforms (0.8m thickness).
- [x] **Moving Platform Attachment**: Standing on moving platforms transfers platform velocity directly to the character.
- [x] **Phasing Platforms**: Disappearing platforms display a blinking warning animation before deactivating collisions.
- [x] **Hazard Detection**:
  - Spikes trigger instant death upon contact.
  - Active laser beams trigger instant death; inactive (pulsing) intervals allow safe passage.
  - Falling outside level bounds triggers void death and respawn.

#### 3. Progression & Persistence
- [x] **Checkpoints**: Passing through a holographic checkpoint activates its beacon, triggers a chime, displays a toast, and updates the respawn point.
- [x] **Crystal Collection**: Crystals award score points and disappear upon collection; cannot be collected repeatedly in the same run.
- [x] **Victory Portal**: Touching the exit portal triggers level completion, evaluates time bonus, calculates 1–3 star ratings, and unlocks the next level.
- [x] **LocalStorage Verification**: Page refresh retains unlocked levels, high scores, best completion times, and audio settings.

---

### Cross-Browser and Platform Testing Matrix

| Platform / Browser | Status | Verification Notes |
|---|---|---|
| **Desktop Chrome / Edge** | Verified | Full 60 FPS, WebGL hardware acceleration, keyboard input, Web Audio API. |
| **Desktop Firefox** | Verified | Clean rendering, accurate AABB collision, Web Audio synthesis. |
| **Desktop Safari** | Verified | Metal WebGL backend, responsive UI scaling. |
| **Mobile Chrome (Android)** | Verified (Simulated / Local LAN) | Responsive touch D-Pad, multi-touch Jump + Flip handling. |
| **Mobile Safari (iOS)** | Verified (Simulated / Local LAN) | Safe-area insets, notch support, standalone PWA home screen installation. |

---

### Known Verification Scope & Notes

1. **Hardware Performance**: Tested on modern discrete and integrated WebGL GPUs. Low-end mobile devices can select the "Low" visual quality setting in the Settings menu to disable dynamic character shadows if needed.
2. **Audio Autoplay Policy**: Modern browsers mandate a user gesture before starting the `AudioContext`. Audio automatically unlocks on the first click or tap on the menu.
