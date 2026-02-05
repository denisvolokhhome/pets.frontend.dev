/**
 * Unit Tests for Bootstrap Removal
 * 
 * These tests verify that Bootstrap has been completely removed from the project
 * while ensuring bootstrap-icons is retained.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 * 
 * Run with: node test-bootstrap-removal-unit.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(description, testFn) {
  totalTests++;
  try {
    testFn();
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${description}`);
  } catch (error) {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${description}`);
    failures.push({ description, error: error.message });
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined but got ${JSON.stringify(actual)}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined but got undefined`);
      }
    },
    toMatch(pattern) {
      if (!pattern.test(actual)) {
        throw new Error(`Expected ${JSON.stringify(actual)} to match pattern ${pattern}`);
      }
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(item) {
      if (!actual.includes(item)) {
        throw new Error(`Expected array to contain ${JSON.stringify(item)}`);
      }
    }
  };
}

function describe(suiteName, suiteFn) {
  console.log(`\n${colors.cyan}${suiteName}${colors.reset}`);
  suiteFn();
}

// Main test execution
console.log(`${colors.blue}Bootstrap Removal Unit Tests${colors.reset}`);
console.log('='.repeat(50));

const projectRoot = __dirname;
const packageJsonPath = path.join(projectRoot, 'package.json');
const angularJsonPath = path.join(projectRoot, 'angular.json');

let packageJson;
let angularJson;

try {
  // Read package.json
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
  packageJson = JSON.parse(packageJsonContent);

  // Read angular.json
  const angularJsonContent = fs.readFileSync(angularJsonPath, 'utf-8');
  angularJson = JSON.parse(angularJsonContent);
} catch (error) {
  console.error(`${colors.red}Error reading configuration files:${colors.reset}`, error.message);
  process.exit(1);
}

describe('Requirement 2.1: Bootstrap package removed from package.json', () => {
  test('should not contain bootstrap in dependencies', () => {
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies['bootstrap']).toBeUndefined();
  });

  test('should not contain bootstrap in devDependencies', () => {
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies['bootstrap']).toBeUndefined();
  });
});

describe('Requirement 2.2: Bootstrap CSS removed from angular.json', () => {
  test('should not reference Bootstrap CSS in build styles', () => {
    const buildStyles = angularJson.projects['pets.frontend.dev'].architect.build.options.styles;
    expect(buildStyles).toBeDefined();
    
    const hasBootstrapCss = buildStyles.some(style => 
      typeof style === 'string' && style.includes('bootstrap') && style.includes('.css')
    );
    
    expect(hasBootstrapCss).toBe(false);
  });

  test('should not reference Bootstrap CSS in test styles', () => {
    const testStyles = angularJson.projects['pets.frontend.dev'].architect.test.options.styles;
    expect(testStyles).toBeDefined();
    
    const hasBootstrapCss = testStyles.some(style => 
      typeof style === 'string' && style.includes('bootstrap') && style.includes('.css')
    );
    
    expect(hasBootstrapCss).toBe(false);
  });
});

describe('Requirement 2.3: Bootstrap JS removed from angular.json', () => {
  test('should not reference Bootstrap JS in build scripts', () => {
    const buildScripts = angularJson.projects['pets.frontend.dev'].architect.build.options.scripts;
    expect(buildScripts).toBeDefined();
    
    const hasBootstrapJs = buildScripts.some(script => 
      typeof script === 'string' && script.includes('bootstrap') && script.includes('.js')
    );
    
    expect(hasBootstrapJs).toBe(false);
  });

  test('should not reference Bootstrap JS in test scripts', () => {
    const testScripts = angularJson.projects['pets.frontend.dev'].architect.test.options.scripts;
    expect(testScripts).toBeDefined();
    
    const hasBootstrapJs = testScripts.some(script => 
      typeof script === 'string' && script.includes('bootstrap') && script.includes('.js')
    );
    
    expect(hasBootstrapJs).toBe(false);
  });
});

describe('Requirement 2.4: Bootstrap Icons retained', () => {
  test('should contain bootstrap-icons in dependencies', () => {
    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies['bootstrap-icons']).toBeDefined();
  });

  test('should have a valid bootstrap-icons version', () => {
    const version = packageJson.dependencies['bootstrap-icons'];
    expect(version).toMatch(/^\^?\d+\.\d+\.\d+$/);
  });
});

describe('Additional verification', () => {
  test('should have Tailwind CSS installed', () => {
    expect(packageJson.devDependencies).toBeDefined();
    expect(packageJson.devDependencies['tailwindcss']).toBeDefined();
  });

  test('should not have any Bootstrap-related packages except bootstrap-icons', () => {
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const bootstrapPackages = Object.keys(allDependencies).filter(pkg => 
      pkg.toLowerCase().includes('bootstrap')
    );

    // Only bootstrap-icons should remain
    expect(bootstrapPackages).toEqual(['bootstrap-icons']);
  });
});

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`${colors.blue}Test Summary${colors.reset}`);
console.log(`Total: ${totalTests}`);
console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);

if (failures.length > 0) {
  console.log(`\n${colors.red}Failures:${colors.reset}`);
  failures.forEach(({ description, error }) => {
    console.log(`  ${colors.red}✗${colors.reset} ${description}`);
    console.log(`    ${error}`);
  });
}

console.log('='.repeat(50));

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);
