#!/usr/bin/env node

/**
 * Validation test for Phase 7 Continuity Dashboard
 * Verifies that dashboard files exist and are properly structured
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'dashboard/index.html',
  'dashboard/dashboard.js',
  'dashboard/README.md',
  'REFERENCE_MAP.json'
];

const REQUIRED_HTML_ELEMENTS = [
  'graph-container',
  'legend',
  'info-panel',
  'vis-network'
];

const REQUIRED_JS_FUNCTIONS = [
  'loadReferenceMap',
  'renderGraph',
  'applyFilters',
  'showNodeInfo'
];

let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
  const symbols = {
    success: '✓',
    error: '✗',
    info: 'ℹ'
  };
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${symbols[type]} ${message}${colors.reset}`);
}

function testFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    log(`File exists: ${filePath}`, 'success');
    testsPassed++;
    return true;
  } else {
    log(`File missing: ${filePath}`, 'error');
    testsFailed++;
    return false;
  }
}

function testHtmlStructure() {
  const htmlPath = path.join(process.cwd(), 'dashboard/index.html');
  if (!fs.existsSync(htmlPath)) {
    log('Cannot test HTML structure - file does not exist', 'error');
    testsFailed++;
    return;
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  
  REQUIRED_HTML_ELEMENTS.forEach(element => {
    if (htmlContent.includes(element)) {
      log(`HTML contains required element: ${element}`, 'success');
      testsPassed++;
    } else {
      log(`HTML missing required element: ${element}`, 'error');
      testsFailed++;
    }
  });
}

function testJavaScriptStructure() {
  const jsPath = path.join(process.cwd(), 'dashboard/dashboard.js');
  if (!fs.existsSync(jsPath)) {
    log('Cannot test JavaScript structure - file does not exist', 'error');
    testsFailed++;
    return;
  }

  const jsContent = fs.readFileSync(jsPath, 'utf8');
  
  REQUIRED_JS_FUNCTIONS.forEach(func => {
    if (jsContent.includes(`function ${func}`) || jsContent.includes(`async function ${func}`)) {
      log(`JavaScript contains required function: ${func}`, 'success');
      testsPassed++;
    } else {
      log(`JavaScript missing required function: ${func}`, 'error');
      testsFailed++;
    }
  });
}

function testReferenceMap() {
  const refMapPath = path.join(process.cwd(), 'REFERENCE_MAP.json');
  if (!fs.existsSync(refMapPath)) {
    log('REFERENCE_MAP.json does not exist', 'error');
    testsFailed++;
    return;
  }

  try {
    const refMapContent = JSON.parse(fs.readFileSync(refMapPath, 'utf8'));
    
    if (refMapContent.nodes && Array.isArray(refMapContent.nodes)) {
      log(`REFERENCE_MAP.json has valid nodes array (${refMapContent.nodes.length} nodes)`, 'success');
      testsPassed++;
    } else {
      log('REFERENCE_MAP.json missing or invalid nodes array', 'error');
      testsFailed++;
    }

    if (refMapContent.edges && Array.isArray(refMapContent.edges)) {
      log(`REFERENCE_MAP.json has valid edges array (${refMapContent.edges.length} edges)`, 'success');
      testsPassed++;
    } else {
      log('REFERENCE_MAP.json missing or invalid edges array', 'error');
      testsFailed++;
    }

    // Validate node structure
    if (refMapContent.nodes && refMapContent.nodes.length > 0) {
      const firstNode = refMapContent.nodes[0];
      if (firstNode.canonical_id && firstNode.type && firstNode.name) {
        log('REFERENCE_MAP.json nodes have required fields', 'success');
        testsPassed++;
      } else {
        log('REFERENCE_MAP.json nodes missing required fields', 'error');
        testsFailed++;
      }
    }

  } catch (error) {
    log(`REFERENCE_MAP.json parsing error: ${error.message}`, 'error');
    testsFailed++;
  }
}

function testPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('package.json does not exist', 'error');
    testsFailed++;
    return;
  }

  try {
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    if (packageContent.scripts && packageContent.scripts.dashboard) {
      log('package.json has dashboard script', 'success');
      testsPassed++;
    } else {
      log('package.json missing dashboard script', 'error');
      testsFailed++;
    }

  } catch (error) {
    log(`package.json parsing error: ${error.message}`, 'error');
    testsFailed++;
  }
}

// Run all tests
console.log('\n🧪 Running Phase 7 Dashboard Validation Tests\n');

console.log('📁 Testing file existence...');
REQUIRED_FILES.forEach(testFileExists);

console.log('\n📝 Testing HTML structure...');
testHtmlStructure();

console.log('\n⚙️  Testing JavaScript structure...');
testJavaScriptStructure();

console.log('\n🗺️  Testing REFERENCE_MAP.json...');
testReferenceMap();

console.log('\n📦 Testing package.json...');
testPackageJson();

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed\n`);

if (testsFailed === 0) {
  log('All tests passed! Dashboard is ready to use.', 'success');
  process.exit(0);
} else {
  log(`${testsFailed} test(s) failed. Please review the errors above.`, 'error');
  process.exit(1);
}
