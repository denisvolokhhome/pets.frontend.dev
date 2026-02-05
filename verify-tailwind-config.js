/**
 * Standalone verification script for Tailwind configuration
 * This script verifies the Tailwind configuration without running the full test suite
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${description}`);
    passCount++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${description}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    failCount++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error('Expected value to be defined');
      }
    },
    toBeArray() {
      if (!Array.isArray(actual)) {
        throw new Error(`Expected array but got ${typeof actual}`);
      }
    },
    toBeGreaterThan(expected) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeLessThan(expected) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    }
  };
}

console.log(`\n${colors.bold}Tailwind Configuration Verification${colors.reset}\n`);

// Test 1: Verify tailwind.config.js exists
test('tailwind.config.js file exists', () => {
  const configPath = path.join(__dirname, 'tailwind.config.js');
  expect(fs.existsSync(configPath)).toBe(true);
});

// Load the Tailwind config
let tailwindConfig;
try {
  tailwindConfig = require('./tailwind.config.js');
} catch (error) {
  console.log(`${colors.red}Failed to load tailwind.config.js: ${error.message}${colors.reset}`);
  process.exit(1);
}

console.log(`\n${colors.bold}Configuration File Structure Tests${colors.reset}`);

// Test 2: Content paths
test('should have content array defined (Requirement 1.5)', () => {
  expect(tailwindConfig.content).toBeDefined();
  expect(tailwindConfig.content).toBeArray();
  expect(tailwindConfig.content.length).toBeGreaterThan(0);
});

test('should scan src directory for HTML, TS, and JS files (Requirement 1.5)', () => {
  const hasCorrectPattern = tailwindConfig.content.some(pattern => 
    pattern.includes('src') && 
    (pattern.includes('{html,ts,js}') || 
     (pattern.includes('*.html') && pattern.includes('*.ts') && pattern.includes('*.js')))
  );
  if (!hasCorrectPattern) {
    throw new Error('Content array does not include pattern for src/**/*.{html,ts,js}');
  }
});

// Test 3: Colors
test('should define primary color #FF6B6B (Requirement 1.2)', () => {
  expect(tailwindConfig.theme).toBeDefined();
  expect(tailwindConfig.theme.extend).toBeDefined();
  expect(tailwindConfig.theme.extend.colors).toBeDefined();
  expect(tailwindConfig.theme.extend.colors.primary).toBe('#FF6B6B');
});

test('should define secondary color #4ECDC4 (Requirement 1.2)', () => {
  expect(tailwindConfig.theme.extend.colors.secondary).toBe('#4ECDC4');
});

// Test 4: Typography
test('should define Poppins font for headings (Requirement 1.3)', () => {
  expect(tailwindConfig.theme.extend.fontFamily).toBeDefined();
  expect(tailwindConfig.theme.extend.fontFamily.heading).toBeDefined();
  expect(tailwindConfig.theme.extend.fontFamily.heading).toBeArray();
  expect(tailwindConfig.theme.extend.fontFamily.heading[0]).toBe('Poppins');
});

test('should define Inter font for body text (Requirement 1.3)', () => {
  expect(tailwindConfig.theme.extend.fontFamily.body).toBeDefined();
  expect(tailwindConfig.theme.extend.fontFamily.body).toBeArray();
  expect(tailwindConfig.theme.extend.fontFamily.body[0]).toBe('Inter');
});

// Test 5: Border radius
test('should define 12px border radius (Requirement 1.4)', () => {
  expect(tailwindConfig.theme.extend.borderRadius).toBeDefined();
  expect(tailwindConfig.theme.extend.borderRadius.default).toBe('12px');
});

console.log(`\n${colors.bold}Styles File Tests${colors.reset}`);

// Test 6: Verify styles.css exists
test('styles.css file exists', () => {
  const stylesPath = path.join(__dirname, 'src/styles.css');
  expect(fs.existsSync(stylesPath)).toBe(true);
});

// Load styles.css
let stylesContent;
try {
  const stylesPath = path.join(__dirname, 'src/styles.css');
  stylesContent = fs.readFileSync(stylesPath, 'utf-8');
} catch (error) {
  console.log(`${colors.red}Failed to load styles.css: ${error.message}${colors.reset}`);
  process.exit(1);
}

// Test 7: Tailwind directives
test('should contain @tailwind base directive (Requirement 1.6)', () => {
  expect(stylesContent).toContain('@tailwind base');
});

test('should contain @tailwind components directive (Requirement 1.6)', () => {
  expect(stylesContent).toContain('@tailwind components');
});

test('should contain @tailwind utilities directive (Requirement 1.6)', () => {
  expect(stylesContent).toContain('@tailwind utilities');
});

test('should have all three directives in correct order (Requirement 1.6)', () => {
  const baseIndex = stylesContent.indexOf('@tailwind base');
  const componentsIndex = stylesContent.indexOf('@tailwind components');
  const utilitiesIndex = stylesContent.indexOf('@tailwind utilities');

  expect(baseIndex).toBeGreaterThan(-1);
  expect(componentsIndex).toBeGreaterThan(-1);
  expect(utilitiesIndex).toBeGreaterThan(-1);
  expect(baseIndex).toBeLessThan(componentsIndex);
  expect(componentsIndex).toBeLessThan(utilitiesIndex);
});

// Summary
console.log(`\n${colors.bold}Test Summary${colors.reset}`);
console.log(`${colors.green}Passed: ${passCount}${colors.reset}`);
console.log(`${colors.red}Failed: ${failCount}${colors.reset}`);

if (failCount > 0) {
  console.log(`\n${colors.red}${colors.bold}Some tests failed!${colors.reset}`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}${colors.bold}All tests passed!${colors.reset}`);
  process.exit(0);
}
