/**
 * AuraCalc — Modern Glassmorphic Calculator
 * Full-featured interactive engine with scientific operations, audio synthesis,
 * history tracking, theme persistence, and physical keyboard mapping.
 */

'use strict';

// -----------------------------------------------------------------------------
// State Management
// -----------------------------------------------------------------------------
const state = {
  currentInput: '0',
  expression: '',
  hasComputed: false,
  angleMode: 'deg', // 'deg' | 'rad'
  memoryValue: 0,
  soundEnabled: true,
  theme: 'nebula',
  history: []
};

// -----------------------------------------------------------------------------
// DOM Elements
// -----------------------------------------------------------------------------
const elements = {
  body: document.body,
  calculatorCard: document.getElementById('calculatorCard'),
  expressionDisplay: document.getElementById('expressionDisplay'),
  resultDisplay: document.getElementById('resultDisplay'),
  angleModeBadge: document.getElementById('angleModeBadge'),
  memoryBadge: document.getElementById('memoryBadge'),
  copyResultBtn: document.getElementById('copyResultBtn'),
  scientificToggleBtn: document.getElementById('scientificToggleBtn'),
  scientificTray: document.getElementById('scientificTray'),
  historyToggleBtn: document.getElementById('historyToggleBtn'),
  historyPanel: document.getElementById('historyPanel'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  soundOnIcon: document.querySelector('.sound-on-icon'),
  soundOffIcon: document.querySelector('.sound-off-icon'),
  themeMenuBtn: document.getElementById('themeMenuBtn'),
  themeDropdown: document.getElementById('themeDropdown'),
  themeOptions: document.querySelectorAll('.theme-option'),
  toast: document.getElementById('toastNotification'),
  toastMessage: document.getElementById('toastMessage')
};

// -----------------------------------------------------------------------------
// Web Audio API Sound Synthesizer (Zero External Dependencies)
// -----------------------------------------------------------------------------
let audioCtx = null;

function initAudio() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
}

function playSound(type = 'tap') {
  if (!state.soundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'number') {
      // Crisp subtle click
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'operator') {
      // Warm mid tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'equals') {
      // Ascending chord chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else if (type === 'clear') {
      // Soft low blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      // General tap
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    }
  } catch {
    // Graceful fallback if Web Audio is blocked or unsupported
  }
}

// -----------------------------------------------------------------------------
// Toast Notification
// -----------------------------------------------------------------------------
let toastTimer = null;
function showToast(message) {
  if (toastTimer) clearTimeout(toastTimer);
  elements.toastMessage.textContent = message;
  elements.toast.classList.remove('hidden');
  toastTimer = setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2200);
}

// -----------------------------------------------------------------------------
// Formatters & UI Updaters
// -----------------------------------------------------------------------------
function formatDisplayNumber(numStr) {
  if (numStr === 'Error' || numStr === 'Undefined' || numStr === 'Infinity' || numStr === '-Infinity') {
    return numStr;
  }
  if (!numStr) return '0';

  // If scientific notation, return as is
  if (numStr.includes('e') || numStr.includes('E')) {
    return numStr;
  }

  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  // Handle negative sign properly
  const isNegative = integerPart.startsWith('-');
  const cleanInt = isNegative ? integerPart.slice(1) : integerPart;

  const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (isNegative ? '-' : '') + formattedInt + decimalPart;
}

function updateDisplay() {
  const formatted = formatDisplayNumber(state.currentInput);
  elements.resultDisplay.textContent = formatted;
  elements.expressionDisplay.textContent = state.expression;

  // Auto scale display font size based on length
  const len = formatted.length;
  elements.resultDisplay.classList.remove('text-lg', 'text-md', 'text-sm');
  if (len > 15) {
    elements.resultDisplay.classList.add('text-sm');
  } else if (len > 11) {
    elements.resultDisplay.classList.add('text-md');
  } else if (len > 8) {
    elements.resultDisplay.classList.add('text-lg');
  }

  // Update memory badge
  if (state.memoryValue !== 0) {
    elements.memoryBadge.classList.remove('hidden');
  } else {
    elements.memoryBadge.classList.add('hidden');
  }

  // Update angle mode badge
  elements.angleModeBadge.textContent = state.angleMode.toUpperCase();
}

// -----------------------------------------------------------------------------
// Math Precision Helpers
// -----------------------------------------------------------------------------
function sanitizeNumber(n) {
  if (!Number.isFinite(n)) {
    if (isNaN(n)) return 'Error';
    return n > 0 ? 'Infinity' : '-Infinity';
  }
  // Trim floating point artifacts like 0.1 + 0.2 = 0.30000000000000004
  const rounded = parseFloat(n.toPrecision(12));
  return String(rounded);
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // JS Number max representation
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

// -----------------------------------------------------------------------------
// Core Expression Evaluator
// -----------------------------------------------------------------------------
function evaluateExpressionString(expr) {
  try {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![a-zA-Z0-9_])/g, `(${Math.E})`);

    // Ensure balanced parentheses
    const openParens = (sanitized.match(/\(/g) || []).length;
    const closeParens = (sanitized.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      sanitized += ')'.repeat(openParens - closeParens);
    }

    // Safety check: only allow valid mathematical characters
    if (/[^0-9+\-*/().\s*^]/.test(sanitized)) {
      return 'Error';
    }

    // Safe evaluation using Function constructor with no global scope leakage
    const result = Function(`"use strict"; return (${sanitized});`)();
    return sanitizeNumber(result);
  } catch {
    return 'Error';
  }
}

// -----------------------------------------------------------------------------
// Calculator Actions
// -----------------------------------------------------------------------------
function inputNumber(digit) {
  playSound('number');
  if (state.hasComputed) {
    state.currentInput = digit;
    state.expression = '';
    state.hasComputed = false;
  } else if (state.currentInput === '0' || state.currentInput === 'Error') {
    state.currentInput = digit;
  } else {
    // Limit max digit length to prevent infinite overflow
    if (state.currentInput.replace(/[^0-9]/g, '').length < 16) {
      state.currentInput += digit;
    }
  }
  updateDisplay();
}

function inputDecimal() {
  playSound('number');
  if (state.hasComputed) {
    state.currentInput = '0.';
    state.expression = '';
    state.hasComputed = false;
  } else if (!state.currentInput.includes('.')) {
    state.currentInput += '.';
  }
  updateDisplay();
}

function inputOperator(op) {
  playSound('operator');
  if (state.currentInput === 'Error') {
    state.currentInput = '0';
  }

  if (state.hasComputed) {
    state.expression = `${state.currentInput} ${op} `;
    state.hasComputed = false;
    state.currentInput = '0';
  } else {
    // If expression ends with an operator and currentInput is "0", replace last operator
    const trimmed = state.expression.trim();
    const lastChar = trimmed.slice(-1);
    const isOp = ['+', '-', '×', '÷', '^'].includes(lastChar);

    if (state.currentInput === '0' && isOp && state.expression.length > 0) {
      state.expression = trimmed.slice(0, -1) + `${op} `;
    } else {
      state.expression += `${state.currentInput} ${op} `;
      state.currentInput = '0';
    }
  }
  updateDisplay();
}

function handleNegate() {
  playSound('tap');
  if (state.currentInput === '0' || state.currentInput === 'Error') return;
  if (state.currentInput.startsWith('-')) {
    state.currentInput = state.currentInput.slice(1);
  } else {
    state.currentInput = '-' + state.currentInput;
  }
  updateDisplay();
}

function handlePercent() {
  playSound('operator');
  if (state.currentInput === 'Error') return;
  const val = parseFloat(state.currentInput);
  if (!isNaN(val)) {
    state.currentInput = sanitizeNumber(val / 100);
    updateDisplay();
  }
}

function handleDelete() {
  playSound('clear');
  if (state.hasComputed || state.currentInput === 'Error') {
    state.currentInput = '0';
    state.hasComputed = false;
  } else if (state.currentInput.length > 1) {
    state.currentInput = state.currentInput.slice(0, -1);
    if (state.currentInput === '-' || state.currentInput === '') {
      state.currentInput = '0';
    }
  } else {
    state.currentInput = '0';
  }
  updateDisplay();
}

function handleAllClear() {
  playSound('clear');
  state.currentInput = '0';
  state.expression = '';
  state.hasComputed = false;
  updateDisplay();
}

function insertConstantOrToken(token) {
  playSound('tap');
  if (token === 'π') {
    state.currentInput = sanitizeNumber(Math.PI);
    state.hasComputed = false;
  } else if (token === 'e') {
    state.currentInput = sanitizeNumber(Math.E);
    state.hasComputed = false;
  } else if (token === '^') {
    inputOperator('^');
    return;
  } else if (token === '(') {
    if (state.expression === '' || state.hasComputed) {
      state.expression = '(';
      state.currentInput = '0';
      state.hasComputed = false;
    } else {
      state.expression += '(';
    }
  } else if (token === ')') {
    state.expression += `${state.currentInput}) `;
    state.currentInput = '0';
  }
  updateDisplay();
}

function handleScientificFunction(funcName) {
  playSound('operator');
  const val = parseFloat(state.currentInput);
  if (isNaN(val)) return;

  let result = 0;
  let label = '';

  switch (funcName) {
    case 'sin': {
      const rad = state.angleMode === 'deg' ? (val * Math.PI) / 180 : val;
      // Precision handling for sin(180 deg) = 0
      result = Math.abs(Math.sin(rad)) < 1e-15 ? 0 : Math.sin(rad);
      label = `sin(${val})`;
      break;
    }
    case 'cos': {
      const rad = state.angleMode === 'deg' ? (val * Math.PI) / 180 : val;
      result = Math.abs(Math.cos(rad)) < 1e-15 ? 0 : Math.cos(rad);
      label = `cos(${val})`;
      break;
    }
    case 'tan': {
      if (state.angleMode === 'deg' && Math.abs(val % 180) === 90) {
        result = NaN;
      } else {
        const rad = state.angleMode === 'deg' ? (val * Math.PI) / 180 : val;
        result = Math.tan(rad);
      }
      label = `tan(${val})`;
      break;
    }
    case 'ln':
      result = val <= 0 ? NaN : Math.log(val);
      label = `ln(${val})`;
      break;
    case 'log':
      result = val <= 0 ? NaN : Math.log10(val);
      label = `log(${val})`;
      break;
    case 'sqrt':
      result = val < 0 ? NaN : Math.sqrt(val);
      label = `√(${val})`;
      break;
    case 'square':
      result = val * val;
      label = `sqr(${val})`;
      break;
    case 'fact':
      result = factorial(val);
      label = `${val}!`;
      break;
    default:
      return;
  }

  const computedStr = sanitizeNumber(result);
  saveHistoryEntry(`${label}`, computedStr);
  state.currentInput = computedStr;
  state.hasComputed = true;
  updateDisplay();
}

function handleEquals() {
  playSound('equals');
  if (state.hasComputed) return;

  let fullExpression = state.expression;
  if (state.currentInput !== '0' || fullExpression === '') {
    fullExpression += state.currentInput;
  } else {
    // If expression ends with trailing operator, evaluate with currentInput
    fullExpression = fullExpression.trim();
  }

  if (!fullExpression) return;

  const result = evaluateExpressionString(fullExpression);
  saveHistoryEntry(fullExpression, result);

  state.expression = `${fullExpression} =`;
  state.currentInput = result;
  state.hasComputed = true;
  updateDisplay();
}

// -----------------------------------------------------------------------------
// Memory Functions
// -----------------------------------------------------------------------------
function handleMemory(action) {
  playSound('tap');
  const current = parseFloat(state.currentInput) || 0;
  switch (action) {
    case 'mem-clear':
      state.memoryValue = 0;
      showToast('Memory Cleared (MC)');
      break;
    case 'mem-recall':
      state.currentInput = sanitizeNumber(state.memoryValue);
      state.hasComputed = true;
      showToast(`Recalled ${state.memoryValue} (MR)`);
      break;
    case 'mem-add':
      state.memoryValue += current;
      showToast(`Added to Memory (M+)`);
      break;
    case 'mem-sub':
      state.memoryValue -= current;
      showToast(`Subtracted from Memory (M-)`);
      break;
  }
  updateDisplay();
}

// -----------------------------------------------------------------------------
// History Management & Persistence
// -----------------------------------------------------------------------------
function loadHistory() {
  try {
    const saved = localStorage.getItem('auracalc_history');
    if (saved) {
      state.history = JSON.parse(saved);
      renderHistory();
    }
  } catch {
    state.history = [];
  }
}

function saveHistoryEntry(expression, result) {
  if (result === 'Error') return;
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const entry = {
    id: Date.now(),
    expression,
    result,
    time: timeStr
  };
  state.history.unshift(entry);
  if (state.history.length > 40) {
    state.history.pop();
  }
  try {
    localStorage.setItem('auracalc_history', JSON.stringify(state.history));
  } catch {}
  renderHistory();
}

function clearHistory() {
  playSound('clear');
  state.history = [];
  try {
    localStorage.removeItem('auracalc_history');
  } catch {}
  renderHistory();
  showToast('History Cleared');
}

function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = `
      <div class="history-empty" id="historyEmpty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <p>No calculations yet</p>
        <span>Your past equations will appear here</span>
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = state.history.map(item => `
    <div class="history-item" data-result="${item.result}" data-expr="${item.expression}" tabindex="0" role="button" title="Click to recall this result">
      <span class="history-item-time">${item.time}</span>
      <span class="history-item-expr">${item.expression}</span>
      <span class="history-item-result">= ${formatDisplayNumber(item.result)}</span>
    </div>
  `).join('');

  // Add click listeners to history items
  elements.historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      playSound('tap');
      const res = item.dataset.result;
      state.currentInput = res;
      state.hasComputed = true;
      updateDisplay();
      showToast(`Recalled ${res}`);
    });
  });
}

// -----------------------------------------------------------------------------
// Theme Management & Persistence
// -----------------------------------------------------------------------------
function setTheme(themeName) {
  state.theme = themeName;
  elements.body.setAttribute('data-theme', themeName);
  try {
    localStorage.setItem('auracalc_theme', themeName);
  } catch {}

  elements.themeOptions.forEach(opt => {
    if (opt.dataset.themeValue === themeName) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

function loadTheme() {
  try {
    const saved = localStorage.getItem('auracalc_theme');
    if (saved) {
      setTheme(saved);
    }
  } catch {}
}

// -----------------------------------------------------------------------------
// Sound Toggle
// -----------------------------------------------------------------------------
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  try {
    localStorage.setItem('auracalc_sound', state.soundEnabled ? 'true' : 'false');
  } catch {}
  updateSoundUI();
  if (state.soundEnabled) {
    playSound('tap');
    showToast('Sound On');
  } else {
    showToast('Sound Muted');
  }
}

function updateSoundUI() {
  if (state.soundEnabled) {
    elements.soundOnIcon.classList.remove('hidden');
    elements.soundOffIcon.classList.add('hidden');
  } else {
    elements.soundOnIcon.classList.add('hidden');
    elements.soundOffIcon.classList.remove('hidden');
  }
}

function loadSoundPreference() {
  try {
    const saved = localStorage.getItem('auracalc_sound');
    if (saved !== null) {
      state.soundEnabled = saved === 'true';
    }
  } catch {}
  updateSoundUI();
}

// -----------------------------------------------------------------------------
// Clipboard Copy
// -----------------------------------------------------------------------------
async function copyResult() {
  playSound('tap');
  try {
    await navigator.clipboard.writeText(state.currentInput);
    showToast(`Copied ${state.currentInput} to clipboard`);
  } catch {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = state.currentInput;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast(`Copied ${state.currentInput} to clipboard`);
  }
}

// -----------------------------------------------------------------------------
// Button Action Router
// -----------------------------------------------------------------------------
function handleButtonClick(btn) {
  const action = btn.dataset.action;
  const value = btn.dataset.value;

  switch (action) {
    case 'number':
      inputNumber(value);
      break;
    case 'decimal':
      inputDecimal();
      break;
    case 'operator':
      inputOperator(value);
      break;
    case 'equals':
      handleEquals();
      break;
    case 'all-clear':
      handleAllClear();
      break;
    case 'delete':
      handleDelete();
      break;
    case 'negate':
      handleNegate();
      break;
    case 'percent':
      handlePercent();
      break;
    case 'sci-func':
      handleScientificFunction(value);
      break;
    case 'insert':
      insertConstantOrToken(value);
      break;
    case 'deg-rad':
      playSound('tap');
      state.angleMode = state.angleMode === 'deg' ? 'rad' : 'deg';
      updateDisplay();
      showToast(`Angle Mode: ${state.angleMode.toUpperCase()}`);
      break;
    case 'mem-clear':
    case 'mem-recall':
    case 'mem-add':
    case 'mem-sub':
      handleMemory(action);
      break;
  }
}

// -----------------------------------------------------------------------------
// Keyboard Event Listener & Button Animation
// -----------------------------------------------------------------------------
function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    // Ignore if user is typing in another input element
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    let targetBtn = null;

    if (e.key >= '0' && e.key <= '9') {
      targetBtn = document.getElementById(`btn${e.key}`);
      inputNumber(e.key);
    } else if (e.key === '.') {
      targetBtn = document.getElementById('btnDecimal');
      inputDecimal();
    } else if (e.key === '+') {
      targetBtn = document.getElementById('btnAdd');
      inputOperator('+');
    } else if (e.key === '-') {
      targetBtn = document.getElementById('btnSubtract');
      inputOperator('-');
    } else if (e.key === '*' || e.key === 'x') {
      targetBtn = document.getElementById('btnMultiply');
      inputOperator('×');
    } else if (e.key === '/') {
      e.preventDefault();
      targetBtn = document.getElementById('btnDivide');
      inputOperator('÷');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      targetBtn = document.getElementById('btnEquals');
      handleEquals();
    } else if (e.key === 'Backspace') {
      targetBtn = document.getElementById('btnDelete');
      handleDelete();
    } else if (e.key === 'Escape') {
      targetBtn = document.getElementById('btnAllClear');
      handleAllClear();
    } else if (e.key === '%') {
      targetBtn = document.getElementById('btnPercent');
      handlePercent();
    } else if (e.key === '(') {
      targetBtn = document.getElementById('btnParenOpen');
      insertConstantOrToken('(');
    } else if (e.key === ')') {
      targetBtn = document.getElementById('btnParenClose');
      insertConstantOrToken(')');
    } else if (e.key === '^') {
      targetBtn = document.getElementById('btnPower');
      insertConstantOrToken('^');
    } else if (e.key.toLowerCase() === 'h') {
      elements.historyToggleBtn.click();
    } else if (e.key.toLowerCase() === 'a') {
      elements.scientificToggleBtn.click();
    }

    // Visual tactile feedback on corresponding on-screen key
    if (targetBtn) {
      targetBtn.classList.add('btn-pressed');
      setTimeout(() => targetBtn.classList.remove('btn-pressed'), 120);
    }
  });
}

// -----------------------------------------------------------------------------
// Initialize App & Event Bindings
// -----------------------------------------------------------------------------
function initApp() {
  // Load saved preferences
  loadTheme();
  loadSoundPreference();
  loadHistory();
  updateDisplay();

  // Attach button click listeners on all calculator buttons
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => handleButtonClick(btn));
  });

  // Sound toggle button
  elements.soundToggleBtn.addEventListener('click', toggleSound);

  // Copy result button
  elements.copyResultBtn.addEventListener('click', copyResult);

  // Angle mode badge click toggle
  elements.angleModeBadge.addEventListener('click', () => {
    playSound('tap');
    state.angleMode = state.angleMode === 'deg' ? 'rad' : 'deg';
    updateDisplay();
    showToast(`Angle Mode: ${state.angleMode.toUpperCase()}`);
  });

  // Scientific Mode Tray Toggle
  elements.scientificToggleBtn.addEventListener('click', () => {
    playSound('tap');
    const isCollapsed = elements.scientificTray.classList.contains('collapsed');
    if (isCollapsed) {
      elements.scientificTray.classList.remove('collapsed');
      elements.scientificTray.setAttribute('aria-hidden', 'false');
      elements.scientificToggleBtn.classList.add('active');
    } else {
      elements.scientificTray.classList.add('collapsed');
      elements.scientificTray.setAttribute('aria-hidden', 'true');
      elements.scientificToggleBtn.classList.remove('active');
    }
  });

  // History Panel Toggle
  elements.historyToggleBtn.addEventListener('click', () => {
    playSound('tap');
    const isHidden = elements.historyPanel.classList.contains('hidden');
    const wrapper = document.querySelector('.calculator-wrapper');
    if (isHidden) {
      elements.historyPanel.classList.remove('hidden');
      wrapper.classList.add('history-expanded');
      elements.historyToggleBtn.style.color = 'var(--text-accent)';
    } else {
      elements.historyPanel.classList.add('hidden');
      wrapper.classList.remove('history-expanded');
      elements.historyToggleBtn.style.color = '';
    }
  });

  // Clear History
  elements.clearHistoryBtn.addEventListener('click', clearHistory);

  // Theme Dropdown Toggle
  elements.themeMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.themeDropdown.classList.toggle('hidden');
  });

  // Theme Options Selection
  elements.themeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      playSound('tap');
      setTheme(opt.dataset.themeValue);
      elements.themeDropdown.classList.add('hidden');
      showToast(`Theme changed to ${opt.textContent.trim()}`);
    });
  });

  // Close dropdown on outside click
  window.addEventListener('click', (e) => {
    if (!elements.themeDropdown.contains(e.target) && e.target !== elements.themeMenuBtn) {
      elements.themeDropdown.classList.add('hidden');
    }
  });

  // Physical Keyboard support
  setupKeyboardListeners();
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
