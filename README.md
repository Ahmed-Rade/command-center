# ⚡ Command Center

A personal hacker-style browser dashboard. Minimal. Fast. No dependencies.

![Theme](https://img.shields.io/badge/theme-hacker--terminal-39d353?style=flat-square)
![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)

---

## 📁 File Structure

```
command-center/
├── index.html       # Main layout & markup
├── style.css        # All styling, themes, animations
├── script.js        # All logic, commands, widgets
└── README.md        # This file
```

---

## ✨ Features

| Widget | Description |
|---|---|
| 🕐 Clock | Live time · UAE UTC+04:00 |
| 🌤 Weather | Auto-detects location via Geolocation API · Open-Meteo |
| 📋 Todo | Add / complete / delete tasks · persisted in localStorage |
| 🍅 Pomodoro | 25/5 work-break timer with ring animation |
| 📝 Notes | Auto-saving scratchpad |
| 🖥 Log | Command history log |
| ⚡ Quick Links | 8 shortcuts with Alt+Key bindings |
| 🔋 Battery | Live battery % + charging indicator |
| 🎨 Themes | dark / light / solarized / dracula |
| 🌌 Backgrounds | matrix / stars / grid / clean |
| 🔍 Search | Google / DuckDuckGo / Bing (switchable) |

---

## 💻 Commands

```bash
:calc <expr>           # Calculator  e.g. :calc 2+2
:todo add <task>       # Add task
:todo clear            # Clear all tasks
:pomo start/stop       # Pomodoro control
:theme dark            # Switch theme (dark/light/solarized/dracula)
:engine google         # Switch search engine (google/duckduckgo/bing)
:bg matrix             # Switch background (matrix/stars/grid/clean)
:price <ticker>        # Crypto/currency price
:myip                  # Show network info
:weather               # Refresh weather
:log clear             # Clear command log
:clear                 # Wipe notes
:help                  # Show all commands
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Focus command input |
| `Escape` | Clear / close |
| `?` | Toggle shortcuts overlay |
| `Alt+N` | Focus notes |
| `Alt+T` | Focus todo input |
| `Alt+P` | Start/pause Pomodoro |
| `Alt+R` | Refresh weather |
| `Alt+G/M/D/Y/A/C` | Open GitHub / Mail / Drive / YouTube / ChatGPT / Claude |

---

## 🚀 Usage

**Option 1 — GitHub Pages (recommended)**
```
Enabled automatically after upload → visit https://<username>.github.io/<repo>
```

**Option 2 — Local server**
```bash
cd command-center
python3 -m http.server 8080
# Open: http://localhost:8080
```

> ⚠️ Do NOT open `index.html` directly via `file://` — CSS/JS may be blocked by browser security policies.

---

## 🛠 Tech Stack

- Vanilla HTML5 / CSS3 / JavaScript (ES6+)
- [Open-Meteo API](https://open-meteo.com/) — free weather, no key needed
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) + [Orbitron](https://fonts.google.com/specimen/Orbitron) — Google Fonts
- Zero npm. Zero frameworks. Zero build step.

---

## 📄 License

MIT — free to use and modify.
