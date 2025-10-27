import { watch } from 'chokidar';
import { execSync } from 'child_process';
import { join } from 'path';

const targetFiles = [
  join('client', 'src', '**', '*.tsx'),
  join('client', 'src', '**', '*.ts'),
  join('server', '**', '*.ts'),
];

let timeout: NodeJS.Timeout;

function runTests() {
  clearTimeout(timeout);
  
  timeout = setTimeout(() => {
    console.log('\n🔄 Changes detected, running tests...\n');
    
    try {
      execSync('npm run test:full', { 
        stdio: 'inherit',
        env: { ...process.env, CI: 'false' }
      });
      console.log('\n✅ Tests completed successfully!\n');
    } catch (error) {
      console.log('\n❌ Some tests failed. Check the bug report for details.\n');
    }
  }, 1000); // Debounce for 1 second
}

console.log('👀 Watching for file changes...\n');
console.log('Press Ctrl+C to stop\n');

const watcher = watch(targetFiles, {
  ignored: [
    /node_modules/,
    /dist/,
    /\.git/,
    /test-results/,
    /playwright-report/,
  ],
  persistent: true,
  ignoreInitial: true,
});

watcher
  .on('change', (path) => {
    console.log(`📝 Changed: ${path}`);
    runTests();
  })
  .on('add', (path) => {
    console.log(`➕ Added: ${path}`);
    runTests();
  })
  .on('error', (error) => {
    console.error('Error watching files:', error);
  });

process.on('SIGINT', () => {
  console.log('\n👋 Stopping watcher...');
  watcher.close();
  process.exit(0);
});

