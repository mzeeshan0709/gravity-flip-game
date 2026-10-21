# Game Controls and Input System

**Gravity Flip Adventure** supports dual input paradigms: full physical desktop keyboard controls and a dedicated multi-touch on-screen controller for mobile and tablet devices.

---

### Desktop Keyboard & Mouse Controls

During active gameplay, the character can be controlled via standard WASD or Arrow Keys:

| Action | Primary Key | Secondary Key | Description |
|---|---|---|---|
| **Move Left** | `A` | `Left Arrow (←)` | Accelerates the character leftward along the X axis. |
| **Move Right** | `D` | `Right Arrow (→)` | Accelerates the character rightward along the X axis. |
| **Jump** | `W` | `Up Arrow (↑)` | Propels character away from supporting surface (Up in normal gravity, Down in reversed gravity). |
| **Flip Gravity** | `Spacebar` | — | Inverts gravitational pull instantly between floor and ceiling. |
| **Pause / Resume** | `Escape` | `P` | Toggles pause state and opens the pause menu. |
| **Quick Restart** | `R` | — | Restarts the current level from the starting position. |
| **Mute Audio** | `M` | — | Mutes or unmutes all sound effects and background synthesizer music. |

#### Menu & UI Navigation (Desktop)
- Use standard **Mouse Left-Click** on any button or modal element.
- Hover states provide glowing visual feedback and subtle scaling animations.

---

### Mobile & Touchscreen Controls

On smartphones and tablets, an overlay touch controller appears automatically when touch events or small viewports are detected:

```text
 ┌──────────────────────────────────────────────────────────────┐
 │ [LEVEL 1]  [SCORE: 0]  [CRYSTALS: 0/5]   [▼ DOWN]   [⏸ PAUSE]│
 │                                                              │
 │                                                              │
 │                                                              │
 │                                                              │
 │   [ ◀ ] [ ▶ ]                              [ JUMP ⬆ ]        │
 │    (Move D-Pad)                            [ FLIP ⚡ ]        │
 └──────────────────────────────────────────────────────────────┘
```

#### Touch Control Layout

| On-Screen Button | Location | Action |
|---|---|---|
| **◀ (Left Arrow)** | Bottom-Left Area | Moves character left while held. |
| **▶ (Right Arrow)** | Bottom-Left Area | Moves character right while held. |
| **JUMP ⬆** | Bottom-Right Area (Top) | Executes jump away from surface when tapped. |
| **FLIP ⚡** | Bottom-Right Area (Bottom) | Inverts gravity polarity when tapped. |
| **⏸ (Pause)** | Top-Right HUD Bar | Opens Pause Modal overlay. |

---

### Multi-Touch & Input Architecture

The `InputManager` is engineered to provide precise, zero-latency feedback across various hardware configurations:

1. **Independent Pointer Tracking**: Utilizes `pointerdown`, `pointerup`, `pointercancel`, and `lostpointercapture` to map pointer IDs independently via `Map<pointerId, action>`. Players can simultaneously hold a movement button with one thumb and tap Jump/Flip with the other.
2. **Gesture Suppression**: Configured with CSS `touch-action: none; user-select: none;` on canvas and touch buttons to prevent accidental double-tap zooming, scrolling, or text selection.
3. **Lost Capture & Blur Recovery**: Automatically clears all held keys and active pointers when window focus is lost (`window.blur`), preventing character drift or stuck keys.
4. **Form Input Isolation**: Ignores gameplay keystrokes whenever the active target is an `<input>` or `<textarea>` element.
