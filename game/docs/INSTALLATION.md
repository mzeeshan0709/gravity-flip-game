# Installation and Setup Guide

This guide provides step-by-step instructions for installing, configuring, running, and troubleshooting **Gravity Flip Adventure** locally on your development machine or mobile testing environment.

---

### Prerequisites

Before running the project, ensure you have the following installed on your machine:

- **Node.js**: Recommended version `18.x` or higher (compatible with Node.js 18, 20, or 22).
- **npm**: Version `9.x` or higher (bundled with Node.js).
- **Web Browser**: Any modern browser with WebGL and Web Audio API support (Chrome, Firefox, Safari, Edge, or Opera).

#### Verifying Environment Versions

Run the following commands in your terminal to confirm your installed versions:

```bash
node --version
npm --version
```

---

### Local Installation

Follow these steps to set up and launch the game on your local development environment:

#### 1. Navigate to the Game Directory

Open your terminal and change directory into the `game` folder:

```bash
cd game
```

#### 2. Install Project Dependencies

Install the required npm packages (`three` and `vite`):

```bash
npm install
```

#### 3. Start the Local Development Server

Run the Vite development server:

```bash
npm run dev
```

Vite will start an ultra-fast Hot Module Replacement (HMR) server and print the local URL in your terminal:

```text
  VITE v7.2.4  ready in 220 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### 4. Open in Your Browser

Open the displayed URL (typically [http://localhost:5173/](http://localhost:5173/)) in your preferred browser to play the game.

---

### Mobile Testing over Local Network (Wi-Fi)

To test touch controls and performance on physical Android smartphones, iPhones, or iPads:

#### 1. Start Vite with Network Exposure

Run the development server with the `--host` flag:

```bash
npm run dev -- --host
```

Vite will display both local and network URLs:

```text
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.120:5173/
```

#### 2. Connect Your Mobile Device

1. Ensure your smartphone or tablet is connected to the **same Wi-Fi network** as your computer.
2. Open Chrome (Android) or Safari (iOS) on your device.
3. Type the network URL (e.g., `http://192.168.1.120:5173/`) into your mobile browser address bar.
4. Tap anywhere on the screen to initialize the Web Audio API context and test the multi-touch on-screen buttons.

*Note: If the page does not load on your phone, ensure your computer's OS firewall allows inbound connections on port 5173.*

---

### Building for Production

To compile and bundle the project into optimized, minified static assets:

```bash
npm run build
```

This creates a `dist/` directory containing:
- `dist/index.html` — Minified HTML document.
- `dist/assets/` — Bundled, tree-shaken JavaScript modules and CSS stylesheets.
- `dist/manifest.json` — PWA Web App Manifest.
- `dist/sw.js` — Service Worker for offline caching.

#### Previewing the Production Build

You can preview the production bundle locally using Vite's built-in preview server:

```bash
npm run preview
```

---

### Troubleshooting Common Issues

| Issue | Cause | Solution |
|---|---|---|
| `npm install` fails | Corrupted cache or outdated npm | Run `npm cache clean --force` and try reinstalling. |
| Port 5173 already in use | Another process is occupying the port | Vite will automatically switch to port `5174` or higher. Check the terminal output. |
| Blank screen on launch | WebGL disabled or hardware acceleration off | Check browser settings to ensure WebGL and hardware acceleration are enabled (`chrome://gpu`). |
| No sound playing | Browser autoplay policy blocking audio | Click anywhere on the menu or screen. Audio context starts after first user gesture. |
| Cannot access via phone IP | Firewall blocking port 5173 or different Wi-Fi | Ensure both devices share the exact same Wi-Fi SSID and allow port 5173 in OS firewall. |
| Touch buttons not responding | Screen zoom or gesture interference | The viewport is configured with `user-scalable=no, touch-action=none` for optimal touch tracking. |
