# 🎬 Miss Player | Cinema Mode · One-Handed Web Video Player

[中文](README.md) | **English** | [日本語](README-JA.md) | [한국어](README-KO.md)

> **Crafted for effortless one-handed mobile control and the ultimate video viewing experience. Say goodbye to intrusive pop-up ads and tiny letterboxed screens. Enjoy one-tap timestamp teleportation, infinite A-B loop playback, and seamless multi-device cloud synchronization!**

---

### 💡 Why Miss Player?
When watching web videos on your phone or desktop browser, have you ever run into these frustrations:
- 📱 **Tiny Portrait Viewports**: Huge black bars on the top and bottom, surrounded by cluttered recommendation feeds, leaving your hands tired and strained?
- 🛑 **Relentless Pop-up Ads**: Clicking once opens three unwanted redirect tabs, causing endless accidental taps?
- ⏩ **Guessing the Highlights**: Blindly scrubbing the seek bar hoping not to miss the best moments?
- 🔁 **Tedious Replay Loops**: Manually rewinding the progress bar over and over just to re-watch a favorite clip?
- 💻 **No Cross-Device Sync**: Bookmarked timestamps on your PC completely vanish when you switch to your phone?

**Miss Player solves all these pain points with a single click!**

---

## 🌟 Key Features

### 1. 📱 Cinema-Grade "One-Handed Mode" — The Ultimate Portrait Experience
- **Immersive Full-Screen Viewport**: Tap the floating pink capsule button at the bottom to instantly enter a cinema-grade immersive player.
- **Free Panning & Minimap Radar**: Smart zoom & auto-centering. Gently slide your thumb across the screen to pan vertically and horizontally in real-time, aided by a sleek bottom handle bar and haptic feedback.
- **Ultra-Fast Gestures**:
  - **Press & Hold to Boost**: Long-press anywhere on the screen to trigger 2x / 3x speed playback;
  - **Double Tap to Play/Pause**: Quick double-tap to toggle playback;
  - **Swipe Down to Dismiss**: Smoothly swipe down with one thumb to exit the player effortlessly.

### 2. 💬 Multi-Source Top Comments & Smart Highlight Timestamps — No More Blind Scrubbing
- **Real-Time Multi-Source Aggregation**: Fetches authentic top comments across Jable, JavDB, JavLibrary, and more.
- **AI-Level Smart Noise Filter**: Built-in multi-stage filtering rules automatically strip away spam, bot ads, deceptive links, and low-quality banter, leaving only high-value plot breakdowns and highlight discussions.
- **One-Tap Highlight Timestamps**:
  - Automatically identifies all timestamp patterns in comments (e.g., `12:35`, `34m20s`, `1:05:20`);
  - Converts timestamps into **highlighted clickable capsules** for instant teleportation to that exact scene;
  - One-click convert any recommended interval into an A-B loop segment!

### 3. 🔁 A-B Loop & Multi-Marker Segment System — The Ultimate Reviewing Tool
- **Seamless A-B Looping**: One-tap to set start and end points for continuous, uninterrupted playback of your favorite clips.
- **Colorful Pill Tabs**: Supports multiple markers per video with custom labels, color categories, and fine-tuned millisecond trimming.
- **Marker Bottom Sheet**: Swipe up from the bottom anytime to reveal the full marker drawer and switch points instantly.

### 4. ☁️ WebDAV Smart Multi-Device Cloud Sync — Continuity across Phone / PC / Tablet
- **Cross-Platform Config & Marker Sync**: Compatible with Nutstore (Jianguoyun), Alist, Nextcloud, Nginx, or any standard WebDAV service.
- **CRDT-Based Distributed Smart Merge**: Timestamps saved on your PC are automatically and silently pulled to your mobile device within 25 seconds; features a 30-day tombstone mechanism to ensure deletions stay accurately in sync.
- **Adaptive Form Factor Isolation**: Keeps the comment sidebar expanded on Desktop while maintaining pure one-handed mode on Mobile without config conflicts.

### 5. ⚡ Web Privileges & Pure Experience Enhancements
- **Powerful Adblock**: Eliminates pop-ups, malicious redirects, and embedded banners.
- **Auto Login**: Remembers multi-domain credentials and skips manual password entry.
- **Auto Highest Quality**: Automatically defaults to 1080P/4K high-bitrate streaming upon load.
- **Full Info Auto-Expansion**: Expands video descriptions, cast details, and full titles automatically.
- **Auto Pause on Blur / Tab Switch**: Automatically pauses and mutes video when switching tabs or backgrounding the browser (toggleable in Settings).

---

## 🚀 Performance & Experience: Smooth as Native iOS
- ⚡ **Sub-Millisecond Responsiveness (INP < 3ms)**: Tap the floating button for instant, zero-lag activation.
- 🎯 **Zero Cumulative Layout Shift (CLS 0.00)**: Employs in-place DOM placeholder technology to eliminate page jitter when toggling the player.
- 🍎 **Deep iOS Safari Optimization**: Prevents system full-screen hijacking and fully adapts to iPhone Dynamic Island and bottom Safe Area insets.

---

## 🛠️ Installation & Setup

### 📱 Apple Devices (iOS / iPadOS)
1. **Recommended Option 1**: Install [Stay for Safari](https://apps.apple.com/app/stay-for-safari-userscripts/id1591620171) (Free tier works great) from the App Store, then open the script release page to install.
2. **Recommended Option 2**: Install the [Userscripts](https://apps.apple.com/app/userscripts/id1463298887) Safari extension from the App Store.

### 🤖 Android Devices
- Use **Via Browser**, **Kiwi Browser**, **Firefox**, or **Edge** with the [Tampermonkey Extension](https://www.tampermonkey.net/) installed, then install this script with one click.

### 💻 Desktop (Windows / macOS)
- Install [Tampermonkey](https://www.tampermonkey.net/) or [ScriptCat](https://scriptcat.org/) on Chrome, Edge, Firefox, or Safari for the ultimate big-screen experience.

---

> 💬 **Feedback & Support**: If you encounter any bugs, broken sites, or have feature suggestions, feel free to leave a comment or open an issue!
