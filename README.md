# ⚡ Command Center

A simple personal start page. Search, links, tasks, notes. Large text, clear buttons, no setup.

![Stack](https://img.shields.io/badge/stack-HTML%20%2F%20CSS%20%2F%20JS-0a5cc2?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)

Live: https://ahmed-rade.github.io/command-center/

---

## ✨ What's new (v2 · Clean theme)

- **Clean theme by default** — light, high contrast, Atkinson Hyperlegible font (made for easy reading). Dark version one tap away (🌙 Dark).
- **Simple view** — only Search, Quick Access, Today, Todo and Notes. Press **More tools** for Pomodoro, Timer, Calculator, Habits, Pins, Quote, Log and Status.
- **Text size A− / A+** — four steps, remembered.
- **🎤 Voice search** — tap the mic and speak (Chrome / Edge / Safari).
- **Today card** — full date plus the five prayer times and a countdown to the next one. Uses your location (falls back to Sharjah). Hide it with ✕.
- **Big tiles** — Quick Access links are large, easy to tap.
- **Plain greeting & clock** — "Good morning," and a calm clock, no hacker styling.
- **Full Arabic (العربية)** — every label, message, date, weather, theme name and notification translated, with right-to-left layout and the Cairo font. English mode contains no Arabic. Switch with `English | العربية` or `:lang ar` / `:lang en`. Your own text (todos, notes, pins) is never altered.
- **Polish pass** — sentence case instead of ALL CAPS, bigger to-do rows with always-visible edit/delete, "Clear completed" button, friendly empty states, first visit follows your device's light/dark setting, fixed phone layout.
- **v3 layout** — full-width, free-flowing tiles (no gaps, no side bars) tuned for phones, laptops and large screens.
- **Sections menu (☰)** — show or hide any panel with a switch; each panel also has a − button. Nothing is ever lost.
- **Fullscreen (⛶) everywhere** — Todo, Notes, Quick access and Today included.
- **Today fullscreen** — Islamic geometric design, Hijri date, big next-prayer countdown.
- **Quick access editor** — real site icons automatically, one-tap popular sites (Gemini, DeepSeek, ChatGPT, Claude…), emoji picker, or upload your own image. Reorder with ↑ ↓.
- **Clear all data** now wipes local data, cookies, caches, service worker and IndexedDB. Browser permissions can only be reset by you (lock icon → Site settings).
- **UI font** works in every theme (Theme default / JetBrains / Space Mono / Inter / Orbitron).
- Old themes (26) still available under 🎨 THEME.

On first load after the update, your theme switches to Clean once. Your data (todos, notes, links) is untouched.

---

## 📁 File Structure

```
command-center/
├── index.html         # Layout & markup
├── style.css          # Base styles + 26 legacy themes
├── simple.css         # Clean theme + simple view (loads last)
├── script.js          # Core logic, commands, widgets
├── simple.js          # Text size, view toggle, voice, Today card
├── lang.js            # Arabic completion layer (strings, RTL fixes)
├── sw.js              # Offline cache + timer notifications
├── site.webmanifest   # Install as app
└── README.md
```

---

## ✨ All Features

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
| 🌐 Network | Live online/offline detection (auto-updates) |
| 🎨 Themes | 26 themes + custom accent color · pick via 🎨 THEME button or `:theme <name>` |
| 🔤 UI Font | JetBrains Mono / Space Mono / Inter / Orbitron — pick in theme picker |
| 📐 Density | Comfortable / Compact layout toggle |
| 👤 Display Name | Click your name in the greeting to edit it |
| 🌌 Backgrounds | matrix / stars / grid / clean / aurora |
| 🔍 Search | Google / DuckDuckGo / Bing (switchable) |
| 💬 Quote | Daily rotating quote · refresh for a random one |
| 🧘 Zen Mode | Hides all panels but Notes · `Alt+Z` or `:zen` |
| ⇅ Backup | Export/import all data as JSON · `:export` / `:import` |
| 🔁 Convert | Unit converter · km/mi, kg/lb, °C/°F, m/ft, L/gal, cm/in |
| 🎲 Random | Coin flip & dice roll · `:flip` / `:roll <n>` |
| 🔊 Sound FX | Synthesized hover/click/type tones, unique per theme · independent toggles via 🔊 SOUND popover or `:sound on/off/hover/click/type` |

---

## 💻 Commands

```bash
:calc <expr>           # Calculator  e.g. :calc 2+2
:todo add <task>       # Add task
:todo clear            # Clear all tasks
:pomo start/stop       # Pomodoro control
:theme dark            # Switch theme (26 themes — see 🎨 THEME button)
:engine google         # Switch search engine (google/duckduckgo/bing)
:bg matrix             # Switch background (matrix/stars/grid/clean)
:price <ticker>        # Crypto/currency price
:myip                  # Show network info
:weather               # Refresh weather
:convert <n> <a> <b>   # Unit conversion  e.g. :convert 10 km mi
:flip                  # Coin flip
:roll <n>              # Dice roll (default d6)
:export                # Download full backup (JSON)
:import                # Restore from backup file
:zen                   # Toggle zen / focus mode
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
| `Alt+Z` | Toggle zen / focus mode |
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
