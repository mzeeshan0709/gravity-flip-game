// InputManager.js - Manages desktop keyboard and mobile touch input with multi-touch support.

export class InputManager {
    constructor() {
        this.keys = {
            left: false,
            right: false,
            jump: false,
            flip: false,
            pause: false,
            restart: false,
            mute: false
        };

        this.justPressed = {
            left: false,
            right: false,
            jump: false,
            flip: false,
            pause: false,
            restart: false,
            mute: false
        };

        // Touch active pointers mapping
        this.activePointers = new Map(); // pointerId -> action

        this.setupKeyboardListeners();
        this.setupWindowListeners();
    }

    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            // Ignore keystrokes if typing inside input fields
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const code = e.code;

            if (code === 'KeyA' || code === 'ArrowLeft') {
                if (!this.keys.left) this.justPressed.left = true;
                this.keys.left = true;
            }
            if (code === 'KeyD' || code === 'ArrowRight') {
                if (!this.keys.right) this.justPressed.right = true;
                this.keys.right = true;
            }
            if (code === 'KeyW' || code === 'ArrowUp') {
                if (!this.keys.jump) this.justPressed.jump = true;
                this.keys.jump = true;
            }
            if (code === 'Space') {
                e.preventDefault(); // Prevent page scroll
                if (!this.keys.flip) this.justPressed.flip = true;
                this.keys.flip = true;
            }
            if (code === 'Escape' || code === 'KeyP') {
                if (!this.keys.pause) this.justPressed.pause = true;
                this.keys.pause = true;
            }
            if (code === 'KeyR') {
                if (!this.keys.restart) this.justPressed.restart = true;
                this.keys.restart = true;
            }
            if (code === 'KeyM') {
                if (!this.keys.mute) this.justPressed.mute = true;
                this.keys.mute = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;

            if (code === 'KeyA' || code === 'ArrowLeft') {
                this.keys.left = false;
            }
            if (code === 'KeyD' || code === 'ArrowRight') {
                this.keys.right = false;
            }
            if (code === 'KeyW' || code === 'ArrowUp') {
                this.keys.jump = false;
            }
            if (code === 'Space') {
                this.keys.flip = false;
            }
            if (code === 'Escape' || code === 'KeyP') {
                this.keys.pause = false;
            }
            if (code === 'KeyR') {
                this.keys.restart = false;
            }
            if (code === 'KeyM') {
                this.keys.mute = false;
            }
        });
    }

    setupWindowListeners() {
        const resetInputs = () => this.reset();
        window.addEventListener('blur', resetInputs);
        window.addEventListener('visibilitychange', () => {
            if (document.hidden) resetInputs();
        });
    }

    bindTouchButton(element, action) {
        if (!element) return;

        const handlePointerDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                element.setPointerCapture(e.pointerId);
            } catch (err) {}

            this.activePointers.set(e.pointerId, action);
            if (!this.keys[action]) {
                this.justPressed[action] = true;
            }
            this.keys[action] = true;
            element.classList.add('active');
        };

        const handleRelease = (e) => {
            if (e.type === 'pointerup') {
                e.preventDefault();
                e.stopPropagation();
            }
            try {
                element.releasePointerCapture(e.pointerId);
            } catch (err) {}

            this.activePointers.delete(e.pointerId);
            element.classList.remove('active');

            // Re-evaluate if any other pointer is holding this action
            let stillActive = false;
            for (const [, act] of this.activePointers) {
                if (act === action) {
                    stillActive = true;
                    break;
                }
            }
            if (!stillActive) {
                this.keys[action] = false;
            }
        };

        element.addEventListener('pointerdown', handlePointerDown);
        element.addEventListener('pointerup', handleRelease);
        element.addEventListener('pointercancel', handleRelease);
        element.addEventListener('lostpointercapture', handleRelease);
    }

    reset() {
        for (const k in this.keys) {
            this.keys[k] = false;
            this.justPressed[k] = false;
        }
        this.activePointers.clear();
        document.querySelectorAll('.touch-btn').forEach(btn => btn.classList.remove('active'));
    }

    update() {
        // Clear justPressed triggers after they have been checked in the game update
    }

    consumeJustPressed(action) {
        const val = this.justPressed[action];
        this.justPressed[action] = false;
        return val;
    }
}
