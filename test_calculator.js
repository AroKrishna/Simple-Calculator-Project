/**
 * Automated test suite for AuraCalc core math and evaluation logic.
 */

// Math precision helper
function sanitizeNumber(n) {
  if (!Number.isFinite(n)) {
    if (isNaN(n)) return 'Error';
    return n > 0 ? 'Infinity' : '-Infinity';
  }
  const rounded = parseFloat(n.toPrecision(12));
  return String(rounded);
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function evaluateExpressionString(expr) {
  try {
    let sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/\^/g, '**')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e(?![a-zA-Z0-9_])/g, `(${Math.E})`);

    const openParens = (sanitized.match(/\(/g) || []).length;
    const closeParens = (sanitized.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      sanitized += ')'.repeat(openParens - closeParens);
    }

    if (/[^0-9+\-*/().\s*^]/.test(sanitized)) {
      return 'Error';
    }

    const result = Function(`"use strict"; return (${sanitized});`)();
    return sanitizeNumber(result);
  } catch {
    return 'Error';
  }
}

function formatDisplayNumber(numStr) {
  if (numStr === 'Error' || numStr === 'Undefined' || numStr === 'Infinity' || numStr === '-Infinity') {
    return numStr;
  }
  if (!numStr) return '0';
  if (numStr.includes('e') || numStr.includes('E')) return numStr;

  const parts = numStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  const isNegative = integerPart.startsWith('-');
  const cleanInt = isNegative ? integerPart.slice(1) : integerPart;
  const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (isNegative ? '-' : '') + formattedInt + decimalPart;
}

// Test cases
const tests = [
  { name: 'Addition', run: () => evaluateExpressionString('12 + 28') === '40' },
  { name: 'Floating point precision', run: () => evaluateExpressionString('0.1 + 0.2') === '0.3' },
  { name: 'Multiplication & Order of Ops', run: () => evaluateExpressionString('5 + 4 × 3') === '17' },
  { name: 'Division', run: () => evaluateExpressionString('100 ÷ 4') === '25' },
  { name: 'Division by zero', run: () => evaluateExpressionString('10 ÷ 0') === 'Infinity' },
  { name: 'Exponentiation', run: () => evaluateExpressionString('2 ^ 10') === '1024' },
  { name: 'Parentheses handling', run: () => evaluateExpressionString('(5 + 5) × 2') === '20' },
  { name: 'Unclosed parentheses auto-repair', run: () => evaluateExpressionString('(8 + 2') === '10' },
  { name: 'Constants π and e', run: () => {
    const piVal = parseFloat(evaluateExpressionString('π'));
    const eVal = parseFloat(evaluateExpressionString('e'));
    return Math.abs(piVal - Math.PI) < 1e-6 && Math.abs(eVal - Math.E) < 1e-6;
  }},
  { name: 'Factorial', run: () => factorial(5) === 120 && factorial(0) === 1 },
  { name: 'Number formatting with commas', run: () => formatDisplayNumber('1234567.89') === '1,234,567.89' && formatDisplayNumber('-9876543') === '-9,876,543' }
];

let passed = 0;
for (const t of tests) {
  const ok = t.run();
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${t.name}`);
  if (ok) passed++;
}

console.log(`\nTests Summary: ${passed}/${tests.length} passed.`);
if (passed !== tests.length) process.exit(1);
