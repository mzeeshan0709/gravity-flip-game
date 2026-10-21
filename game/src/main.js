// main.js - Entry point for Gravity Flip Adventure.
import './style.css';
import { Game } from './game/Game.js';

window.addEventListener('DOMContentLoaded', () => {
    // Instantiate game
    window.__gameInstance = new Game();

    // Register PWA service worker if available
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost')) {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.log('ServiceWorker registration skipped or failed:', err);
        });
    }
});
