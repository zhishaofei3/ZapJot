const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║  Quick Notes Extension Dev Server     ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);
console.log('');

// Files to watch
const watchFiles = [
  'popup.html',
  'popup.css',
  'popup.js',
  'manifest.json',
  'icons/**/*'
];

console.log(`${colors.yellow}📁 Watching for changes...${colors.reset}`);
console.log('');

// Initialize watcher
const watcher = chokidar.watch(watchFiles, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: false
});

let isReloading = false;

// Function to trigger reload
function triggerReload(file) {
  if (isReloading) return;
  
  isReloading = true;
  const fileName = path.basename(file);
  console.log(`${colors.green}✓${colors.reset} ${fileName} changed - Reload extension in Chrome`);
  console.log(`${colors.blue}  →${colors.reset} Press ${colors.yellow}Cmd+R${colors.reset} (Mac) or ${colors.yellow}Ctrl+R${colors.reset} (Windows/Linux) in chrome://extensions/`);
  console.log('');
  
  setTimeout(() => {
    isReloading = false;
  }, 1000);
}

// Watcher events
watcher
  .on('ready', () => {
    console.log(`${colors.green}✓${colors.reset} File watcher initialized`);
    console.log(`${colors.blue}ℹ${colors.reset} Edit any file and save to see changes`);
    console.log(`${colors.blue}ℹ${colors.reset} Remember to refresh the extension in Chrome after changes`);
    console.log('');
  })
  .on('add', (file) => {
    console.log(`${colors.green}✓${colors.reset} File added: ${path.basename(file)}`);
  })
  .on('change', (file) => {
    triggerReload(file);
  })
  .on('unlink', (file) => {
    console.log(`${colors.yellow}⚠${colors.reset} File removed: ${path.basename(file)}`);
  })
  .on('error', (error) => {
    console.error(`${colors.yellow}⚠${colors.reset} Watcher error:`, error);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('');
  console.log(`${colors.yellow}👋 Dev server stopped${colors.reset}`);
  watcher.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  watcher.close();
  process.exit(0);
});
