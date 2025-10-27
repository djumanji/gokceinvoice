import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface TestResult {
  title: string;
  status: 'passed' | 'failed';
  error?: string;
  duration: number;
}

interface TestSuite {
  file: string;
  results: TestResult[];
}

function parseTestOutput(output: string): TestSuite[] {
  const suites: TestSuite[] = [];
  const lines = output.split('\n');
  
  let currentSuite: TestSuite | null = null;
  let currentTest: TestResult | null = null;
  
  for (const line of lines) {
    // New test file
    if (line.includes('Running') && line.includes('.spec.ts')) {
      const match = line.match(/tests\/([^.]+)\.spec\.ts/);
      if (match) {
        if (currentSuite) {
          suites.push(currentSuite);
        }
        currentSuite = { file: match[1], results: [] };
      }
    }
    
    // Test result
    if (line.includes('✓') || line.includes('×')) {
      const match = line.match(/[✓×]\s+(\d+)\s+(.+?)\s+\((\d+)ms\)/);
      if (match && currentSuite) {
        if (currentTest) {
          currentSuite.results.push(currentTest);
        }
        currentTest = {
          title: match[2],
          status: match[0].includes('✓') ? 'passed' : 'failed',
          duration: parseInt(match[3]),
        };
      }
    }
    
    // Error message
    if (line.includes('Error:') && currentTest) {
      currentTest.error = line.trim();
    }
  }
  
  if (currentSuite) {
    if (currentTest) {
      currentSuite.results.push(currentTest);
    }
    suites.push(currentSuite);
  }
  
  return suites;
}

function generateBugReport(suites: TestSuite[]): string {
  const timestamp = new Date().toISOString();
  const failedTests = suites.flatMap(s => s.results.filter(r => r.status === 'failed'));
  const passedTests = suites.flatMap(s => s.results.filter(r => r.status === 'passed'));
  
  let report = `# Bug Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${suites.flatMap(s => s.results).length}\n`;
  report += `- **Passed:** ${passedTests.length} ✅\n`;
  report += `- **Failed:** ${failedTests.length} ❌\n\n`;
  
  if (failedTests.length === 0) {
    report += `🎉 **All tests passed!** No bugs detected.\n\n`;
  } else {
    report += `## Failed Tests\n\n`;
    
    for (const test of failedTests) {
      report += `### ${test.title}\n\n`;
      report += `- **File:** ${test.file}\n`;
      report += `- **Duration:** ${test.duration}ms\n`;
      if (test.error) {
        report += `- **Error:** \`${test.error}\`\n`;
      }
      report += `\n`;
    }
    
    report += `## Recommendations\n\n`;
    report += `1. Review the failed tests above\n`;
    report += `2. Check test screenshots in \`test-results/\` directory\n`;
    report += `3. Run tests locally: \`npm test\`\n`;
    report += `4. Fix issues and commit changes\n\n`;
  }
  
  report += `## Test Coverage\n\n`;
  for (const suite of suites) {
    report += `### ${suite.file}\n\n`;
    for (const result of suite.results) {
      const status = result.status === 'passed' ? '✅' : '❌';
      report += `- ${status} ${result.title}\n`;
    }
    report += `\n`;
  }
  
  return report;
}

async function main() {
  console.log('🧪 Running Playwright tests...');
  
  try {
    // Create test results directory
    if (!existsSync('test-results')) {
      mkdirSync('test-results', { recursive: true });
    }
    
    // Run tests and capture output
    const output = execSync('npx playwright test --reporter=list', { 
      encoding: 'utf-8',
      stdio: 'pipe',
    }).toString();
    
    console.log(output);
    
    // Parse results
    const suites = parseTestOutput(output);
    
    // Generate markdown report
    const report = generateBugReport(suites);
    
    // Save to file
    const reportPath = join('test-results', 'bug-report.md');
    writeFileSync(reportPath, report);
    console.log(`\n📝 Bug report saved to: ${reportPath}`);
    
    // Also save as latest
    writeFileSync('test-results/latest-report.md', report);
    console.log(`📝 Latest report saved to: test-results/latest-report.md`);
    
  } catch (error: any) {
    console.error('Error running tests:', error.message);
    process.exit(1);
  }
}

main();

