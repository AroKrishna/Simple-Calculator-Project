# 🌌 AuraCalc — Modern Glassmorphic Web Calculator

AuraCalc is a state-of-the-art web calculator with glassmorphic aesthetics, fluid micro-animations, standard and scientific calculation modes, real-time expression history, audio feedback, and full physical keyboard support.

---

## ✨ Features

- **💎 Glassmorphic Aesthetic**: Multi-layered frosted glass panels (`backdrop-filter: blur(28px)`), ambient floating glow orbs, and dynamic border gradients.
- **🎨 4 Curated Color Themes**:
  - **Nebula Glow**: Deep space indigo with electric cyan & rose neon accents *(Default)*.
  - **Cyber Mint**: High-contrast matrix obsidian with vivid emerald and cyan glows.
  - **Sunset Luxe**: Deep velvet slate with warm copper, amber, and coral tones.
  - **Frosted Light**: Ultra-clean Apple-inspired crisp frosted glass light mode.
- **🔬 Dual Calculation Modes**:
  - **Standard Mode**: Basic arithmetic ($+$, $-$, $\times$, $\div$), percentages, negation ($\pm$), all-clear, and backspace.
  - **Scientific Mode (`ADV`)**: Trigonometric functions ($\sin$, $\cos$, $\tan$ with DEG / RAD toggle), logarithmic ($\ln$, $\log_{10}$), square root ($\sqrt{x}$), power ($x^y$), square ($x^2$), factorial ($n!$), constants ($\pi$, $e$), and parenthesis expressions.
- **💾 Memory Registers**: Full memory management (`MC`, `MR`, `M+`, `M-`) with visual indicator badge.
- **📜 Calculation History**: Collapsible side drawer logging past operations with timestamps; click any historical equation to restore its value instantly.
- **🎵 Synthesized Audio Feedback**: Built-in Web Audio API tone generator (crisp clicks, warm operator tones, and triumphant completion chimes) with a one-click mute/unmute toggle.
- **⌨️ Physical Keyboard Support**: Complete keyboard shortcuts with visual tactile feedback on screen.
- **📋 Instant Clipboard Copy**: One-click result copying with sleek floating toast notifications.

---

## 🚀 Getting Started

### Option 1: Direct File Launch
Simply double-click [`index.html`](file:///c:/ARO/Projects/Calculator/index.html) to open it directly in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server
Run any local development server from this directory:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve .
```

Then visit [http://localhost:8080](http://localhost:8080) in your browser.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` – `9` | Input Numbers |
| `.` | Input Decimal point |
| `+` | Addition |
| `-` | Subtraction |
| `*` or `x` | Multiplication |
| `/` | Division |
| `Enter` or `=` | Calculate Result |
| `Backspace` | Delete last character |
| `Escape` | All Clear (AC) |
| `%` | Percentage |
| `(` and `)` | Parentheses |
| `^` | Power ($x^y$) |
| `H` | Toggle History Drawer |
| `A` | Toggle Scientific Mode |

---

## 📁 File Structure

```
c:/ARO/Projects/Calculator/
├── index.html           # Semantic HTML structure & SVG icons
├── style.css            # Glassmorphic design system & animations
├── script.js            # Math parser, audio synthesizer & state engine
├── test_calculator.js   # Automated unit tests for calculation engine
└── README.md            # Documentation and keyboard guide
```
