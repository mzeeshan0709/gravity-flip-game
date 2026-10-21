# Gravity Flip Adventure

**Gravity Flip Adventure** is a responsive 3D platformer game built with Three.js, JavaScript (ES modules), and Vite. Players switch gravity between floor and ceiling to navigate floating platforms, avoid hazardous lasers and spikes, collect energy crystals, activate checkpoints, and reach the exit portal.

---

### Project Overview

**Gravity Flip Adventure** blends precision platforming with dynamic gravitational mechanics:

- **Objective**: Navigate through 5 distinct sci-fi levels, invert gravity at critical moments, dodge moving and pulsing hazards, collect glowing crystals, and safely reach the vortex exit portal.
- **Gravity Inversion**: With a single input or screen tap, players flip the gravitational pull. Normal gravity pulls the character downward toward the floor, while reversed gravity pulls the character upward toward ceiling catwalks.
- **Dynamic Gameplay**: Players can switch gravity mid-air, jump away from supporting surfaces in both orientations, ride moving elevators, and navigate disappearing platforms.
- **Target Audience**: Designed for casual and hardcore platformer enthusiasts looking for responsive, timing-based obstacle course challenges.
- **Supported Platforms**: Playable directly in modern web browsers on desktop computers (Windows, macOS, Linux) and mobile devices (Android smartphones, iPhones, iPads, and tablets). Mobile browser support enables instant web play and standalone Progressive Web App (PWA) installation without requiring native store downloads.

---

### Features

- **3D World & Lighting**: Rendered using Three.js with dynamic point lights, directional shadows, sci-fi glassmorphism UI, and particle systems.
- **Dynamic Gravity Inversion**: Instant polarity flipping with angular rotation interpolation, momentum conservation, and visual suit color shifts.
- **Fluid Kinematics & Jump Mechanics**: Smooth acceleration/deceleration, directional facing interpolation, and surface-relative jump impulses.
- **Interactive Platforms & Hazards**:
  - Solid floor platforms and ceiling catwalks.
  - Moving platforms that carry player momentum.
  - Phasing / disappearing platforms with warning flicker states.
  - Floor and ceiling spikes.
  - Pulsing and moving laser beams.
- **Collectible Crystals & Scoring**: Glowing rotating crystals awarding points based on difficulty multipliers, plus completion time bonuses and 1–3 star ratings.
- **Checkpoints & Safe Respawning**: Holographic checkpoint beacons that save progress mid-level, with automatic respawn outside hazard zones.
- **5 Handcrafted Levels**: Progressive obstacle courses introducing mechanics from basic flips to high-speed laser gauntlets.
- **3 Difficulty Modes**: Easy, Medium, and Hard modes modifying player movement speeds, gravity strength, platform/laser timing, and score multipliers.
- **Procedural Synthesizer Audio**: Web Audio API sound effects (jumps, flips, crystals, checkpoints, landing, death) and procedural ambient synth background music without external audio files.
- **Full Mobile & Touchscreen Support**: Multi-touch on-screen D-pad and action buttons with pointer capture handling, gesture prevention, and safe-area notch accommodation.
- **Persistent Local Storage**: Automatically saves high scores, best completion times, star ratings, unlocked levels, and audio settings in browser `LocalStorage`.
- **Progressive Web App (PWA)**: Includes a Web App Manifest and Service Worker for offline caching and home screen installation.

---

### Screenshots and Gameplay Preview

*Screenshots can be placed in the `docs/screenshots/` directory to preview gameplay and interface layouts:*

```text
docs/screenshots/
├── main-menu.png         # Main menu and difficulty selection
├── gameplay.png          # Active platforming and gravity switching
├── mobile-controls.png   # On-screen multi-touch controller
└── level-complete.png    # Victory screen with score, stars, and time
```

> **Note for Contributors:** To add gameplay previews, capture 16:9 gameplay images from the browser, place them inside `game/docs/screenshots/`, and link them in this section.

---

### Technologies Used

| Technology | Version / Specification | Role in Project |
|---|---|---|
| **JavaScript (ES Modules)** | ES2022+ | Core game engine, kinematics, collision detection, and UI logic |
| **Three.js** | `^0.181.2` | 3D WebGL scene graph, geometries, standard materials, lighting, and camera follow |
| **Vite** | `^7.2.4` | Development server with Hot Module Replacement and production bundling |
| **Web Audio API** | Native Browser API | Real-time procedural sound effects synthesis and ambient music sequencer |
| **HTML5 & CSS3** | Modern Standards | Responsive layout overlay, glassmorphism UI, and touch input handlers |
| **Service Worker & Manifest** | PWA Standards | Offline asset caching and installable home-screen web app capabilities |

---

### Prerequisites

To run and build the project locally, ensure you have:

- **Node.js**: Recommended version `18.x` or higher (compatible with Node.js 18, 20, and 22).
- **npm**: Version `9.x` or higher (comes bundled with Node.js).
- **Browser**: Any modern browser supporting WebGL and Web Audio API (Chrome, Safari, Firefox, Edge).

Verify your environment:

```bash
node --version
npm --version
```

---

### Installation and Setup

1. **Clone or navigate to the repository**:
   ```bash
   cd game
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open the game**:
   Vite will display the local development URL in your terminal:
   ```text
   http://localhost:5173/
   ```
   Open this URL in your web browser.

---

### How to Play

1. **Start the Game**: Click **PLAY GAME** from the main menu, or choose a specific unlocked level via **LEVEL SELECT**.
2. **Select Difficulty**: Choose between **Easy**, **Medium**, or **Hard** depending on your desired challenge.
3. **Traverse Platforms**: Move left or right, jumping across gaps and timing your runs over moving platforms.
4. **Invert Gravity**: Press `Spacebar` (or tap `FLIP ⚡`) to reverse gravity and land on ceiling structures.
5. **Dodge Hazards**: Avoid touching red floor/ceiling spikes and time your movement through pulsing laser beams.
6. **Collect Crystals**: Gather glowing cyan crystals throughout the course to maximize your final score.
7. **Activate Checkpoints**: Run through holographic beacons to save your checkpoint in case of hazards.
8. **Enter the Portal**: Reach the swirling exit portal at the end of the course to complete the level and unlock the next stage.

---

### Controls

#### Desktop Keyboard & Mouse

| Action | Primary Key | Secondary Key | Description |
|---|---|---|---|
| **Move Left** | `A` | `Left Arrow (←)` | Run leftward |
| **Move Right** | `D` | `Right Arrow (→)` | Run rightward |
| **Jump** | `W` | `Up Arrow (↑)` | Jump away from supporting platform |
| **Flip Gravity** | `Spacebar` | — | Invert gravitational pull (Floor ↔ Ceiling) |
| **Pause / Resume** | `Escape` | `P` | Pause gameplay and show menu |
| **Quick Restart** | `R` | — | Restart current level |
| **Mute Sound** | `M` | — | Toggle master audio mute |

*Menus and dialogs can be navigated using standard mouse clicks.*

#### Mobile & Touchscreen Controls

On smartphones and tablets, on-screen touch buttons appear automatically:

- **◀ / ▶ (Bottom-Left)**: Run left or right while held.
- **JUMP ⬆ (Bottom-Right)**: Jump away from the platform surface.
- **FLIP ⚡ (Bottom-Right)**: Flip gravity polarity immediately.
- **⏸ (Top-Right HUD)**: Open the pause menu.

*The touch controller supports multi-touch, enabling simultaneous running and jumping/flipping.*

---

### Difficulty Modes

Difficulty settings dynamically adjust gameplay parameters in real time:

| Feature / Parameter | Easy | Medium | Hard |
|---|---|---|---|
| **Player Speed** | $9.5\text{ m/s}$ | $10.5\text{ m/s}$ | $11.5\text{ m/s}$ |
| **Gravity Strength** | $24.0\text{ m/s}^2$ | $28.0\text{ m/s}^2$ | $32.0\text{ m/s}^2$ |
| **Jump Force** | $11.5\text{ m/s}$ | $12.5\text{ m/s}$ | $13.5\text{ m/s}$ |
| **Hazard & Moving Platform Speed** | $0.8\times$ (Slower) | $1.0\times$ (Standard) | $1.25\times$ (Faster) |
| **Laser Pulse Interval** | $1.25\times$ (Generous) | $1.0\times$ (Standard) | $0.8\times$ (Tight) |
| **Score Multiplier** | $1.0\times$ | $1.5\times$ | $2.0\times$ |

---

### Levels and Progression

The game features 5 handcrafted levels of increasing complexity:

1. **Level 1 — The First Flip**:
   - *Theme*: Fundamentals of horizontal movement, jumping, gravity flipping, crystal pickups, and checkpoint activation.
   - *Crystals*: 5 | *Checkpoints*: 1 | *Par Time*: 25s
2. **Level 2 — Ceiling Crossing**:
   - *Theme*: Navigating alternating floor and ceiling catwalks across chasms with static floor spikes.
   - *Crystals*: 7 | *Checkpoints*: 2 | *Par Time*: 35s
3. **Level 3 — Moving Machinery**:
   - *Theme*: Dynamic horizontal and vertical moving platforms over hazard pits with synchronized gravity flips.
   - *Crystals*: 8 | *Checkpoints*: 2 | *Par Time*: 40s
4. **Level 4 — Laser Laboratory**:
   - *Theme*: Disappearing (phasing) platforms with warning flickers combined with pulsing vertical and horizontal laser barriers.
   - *Crystals*: 10 | *Checkpoints*: 2 | *Par Time*: 45s
5. **Level 5 — The Gravity Core**:
   - *Theme*: High-speed elevators, moving laser security beams, narrow ceiling walkways, and tight timing sequences.
   - *Crystals*: 12 | *Checkpoints*: 3 | *Par Time*: 55s

---

### Project Structure

```text
game/
├── dist/                          # Production build output (generated by npm run build)
├── docs/                          # Detailed architecture, controls, and testing guides
│   ├── CONTROLS.md                # In-depth input mapping and multi-touch reference
│   ├── DEVELOPMENT.md             # Architecture, math models, and coding standards
│   ├── INSTALLATION.md            # Detailed setup and local network testing steps
│   └── TESTING.md                 # Verification matrices and checklist
├── public/                        # Static assets and PWA configuration
│   ├── manifest.json              # Web App Manifest
│   ├── sw.js                      # Service Worker for offline caching
│   ├── tode.svg                   # Vector icon asset
│   └── models/                    # 3D model assets
├── src/                           # Application source code
│   ├── audio/
│   │   └── AudioManager.js        # Web Audio API procedural sound synthesizer
│   ├── game/
│   │   ├── CollisionSystem.js     # Sub-stepped 2.5D AABB physics and trigger checks
│   │   ├── EffectsManager.js      # Particle bursts, shockwaves, and ambient dust
│   │   ├── Game.js                # Engine lifecycle, Three.js renderer, and state machine
│   │   ├── InputManager.js        # Keyboard and multi-touch pointer event handlers
│   │   ├── LevelManager.js        # Level geometry, hazards, checkpoints, and portals
│   │   └── Player.js              # Character kinematics, suit lighting, and animations
│   ├── storage/
│   │   └── StorageManager.js      # LocalStorage save schema and high scores
│   ├── ui/
│   │   └── UIManager.js           # Glassmorphism menus, HUD, modals, and touch buttons
│   ├── main.js                    # Application entry point and PWA registration
│   └── style.css                  # Responsive stylesheet, animations, and HUD styling
├── index.html                     # HTML5 entry document and mobile viewport settings
├── package.json                   # Dependencies and npm script definitions
└── README.md                      # Primary project documentation
```

---

### Available Commands

The following npm scripts are defined in `package.json`:

```bash
# Start the local development server (with HMR)
npm run dev

# Expose the development server to your local Wi-Fi network for mobile testing
npm run dev -- --host

# Compile and bundle the project for production
npm run build

# Preview the compiled production build locally
npm run preview
```

---

### Build and Deployment

#### Production Build

To build the static application:

```bash
npm run build
```

This compiles all JavaScript and CSS files into the `dist/` directory.

#### Static Hosting

The contents of `dist/` can be deployed directly to any static web hosting platform:

- **GitHub Pages**: Upload the `dist/` folder or configure GitHub Actions to build and deploy.
- **Vercel / Netlify / Cloudflare Pages**: Connect the repository, set the root directory to `game`, build command to `npm run build`, and output directory to `dist`.

---

### Troubleshooting and FAQs

| Symptom | Cause | Resolution |
|---|---|---|
| **No audio heard on launch** | Browser autoplay policy blocked audio initialization | Click or tap anywhere on the screen. The Web Audio context initializes on the first user interaction. |
| **Character appears in dark shadows** | Directional light moved out of view or low settings | The player character includes a built-in chest `PointLight` and emissive suit trim that illuminate the character in all environments. |
| **Cannot connect from mobile device** | Computer firewall blocking port 5173 or separate networks | Run `npm run dev -- --host`, verify both devices are connected to the same Wi-Fi network, and permit inbound traffic on port 5173. |
| **Touch buttons trigger page zoom** | Browser default pinch/double-tap gestures | The application applies `touch-action: none; user-select: none;` and viewport meta tags to prevent unintended browser zooming. |
| **Stuck keys after alt-tabbing** | Browser blur missed keyup event | The `InputManager` automatically binds to `window.blur` to reset all held inputs upon loss of focus. |

---

### Known Limitations

- **Browser WebGL Support Required**: Devices with disabled hardware acceleration or outdated WebGL drivers may experience lower frame rates.
- **Gamepad / Controller API**: Gamepad input is not currently mapped; standard keyboard and touchscreen controls are supported.

---

### Future Improvements

- Additional themed world environments (e.g., Cyberpunk City, Quantum Core).
- Gamepad / Bluetooth controller integration via the Gamepad API.
- Global online leaderboards using cloud storage APIs.
- Custom level editor for user-created obstacle courses.

---

### Contributing

Contributions, bug reports, and suggestions are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/new-level`.
3. Commit your changes: `git commit -m "Add new obstacle course level"`.
4. Push to the branch: `git push origin feature/new-level`.
5. Open a Pull Request.

---

### License

This project is licensed under the **MIT License**. See the repository license file for details.

---

### Credits and Acknowledgments

- **Three.js**: Lightweight 3D rendering engine ([threejs.org](https://threejs.org/)).
- **Vite**: Modern front-end tooling and build bundler ([vite.dev](https://vite.dev/)).
- **Web Audio API**: W3C specification for real-time procedural audio synthesis.

---

### Supporting Documentation

For detailed guides, refer to:
- [Installation and Setup Guide](docs/INSTALLATION.md)
- [Controls and Input Reference](docs/CONTROLS.md)
- [Development and Architecture Guide](docs/DEVELOPMENT.md)
- [Testing and Verification Guide](docs/TESTING.md)
