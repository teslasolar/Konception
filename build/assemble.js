#!/usr/bin/env node
// ============================================
// KONOMI KONCEPTION - Build Assembler
// Combines all components into single HTML file
// ============================================

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const BUILD_DIR = __dirname;
const OUTPUT_FILE = path.join(BUILD_DIR, 'konomi-konception.html');

// Component files in order of dependency
const SCRIPT_FILES = [
  'core/utils.js',
  'crypto/sha256.js',
  'crypto/aes256.js',
  'compression/lz77.js',
  'vm/vm.js',
  'db/btree.js',
  'ai/transformer.js',
  'render/renderer.js',
  'test/framework.js',
  'app/main.js'
];

const STYLE_FILE = 'app/styles.css';
const TEMPLATE_FILE = 'app/template.html';

function readFile(filePath) {
  const fullPath = path.join(SRC_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function assemble() {
  console.log('KONOMI KONCEPTION - Build Assembler');
  console.log('=' .repeat(50));

  // Read template
  console.log('Reading template...');
  let template = readFile(TEMPLATE_FILE);

  // Read and combine styles
  console.log('Combining styles...');
  const styles = readFile(STYLE_FILE);
  template = template.replace('/* STYLES_PLACEHOLDER */', styles);

  // Read and combine scripts
  console.log('Combining scripts...');
  const scripts = SCRIPT_FILES.map(file => {
    console.log(`  - ${file}`);
    return readFile(file);
  }).join('\n\n');
  template = template.replace('/* SCRIPTS_PLACEHOLDER */', scripts);

  // Calculate size
  const sizeBytes = Buffer.byteLength(template, 'utf-8');
  const sizeKB = (sizeBytes / 1024).toFixed(2);

  // Write output
  console.log('Writing output...');
  fs.writeFileSync(OUTPUT_FILE, template, 'utf-8');

  console.log('=' .repeat(50));
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`Size: ${sizeKB} KB (${sizeBytes} bytes)`);
  console.log('Build complete!');

  return { outputFile: OUTPUT_FILE, sizeBytes, sizeKB };
}

// Run if called directly
if (require.main === module) {
  assemble();
}

module.exports = { assemble };
