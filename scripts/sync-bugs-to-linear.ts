import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

interface FailedTest {
  title: string;
  file: string;
  duration: number;
  error?: string;
}

interface LinearResponse {
  data?: {
    issueCreate?: {
      issue?: {
        id: string;
        identifier: string;
        title: string;
      };
      success: boolean;
    };
  };
  errors?: Array<{ message: string }>;
}

async function parseBugReport(): Promise<FailedTest[]> {
  const reportPath = join('test-results', 'latest-report.md');
  
  if (!existsSync(reportPath)) {
    console.log('⚠️ No bug report found. Run tests first.');
    return [];
  }
  
  const report = readFileSync(reportPath, 'utf-8');
  const failedTests: FailedTest[] = [];
  
  // Parse markdown to extract failed tests
  let currentTest: Partial<FailedTest> | null = null;
  const lines = report.split('\n');
  
  for (const line of lines) {
    // Start of failed test
    if (line.startsWith('### ') && !line.includes('Summary')) {
      if (currentTest && currentTest.title) {
        failedTests.push(currentTest as FailedTest);
      }
      currentTest = { title: line.substring(4).trim() };
    }
    
    // Extract file
    if (line.startsWith('- **File:**')) {
      if (currentTest) {
        currentTest.file = line.split(':')[1].trim();
      }
    }
    
    // Extract duration
    if (line.startsWith('- **Duration:**')) {
      if (currentTest) {
        const match = line.match(/(\d+)ms/);
        if (match) {
          currentTest.duration = parseInt(match[1]);
        }
      }
    }
    
    // Extract error
    if (line.startsWith('- **Error:**')) {
      if (currentTest) {
        currentTest.error = line.split('`')[1];
      }
    }
  }
  
  if (currentTest && currentTest.title) {
    failedTests.push(currentTest as FailedTest);
  }
  
  return failedTests;
}

async function createLinearIssue(test: FailedTest): Promise<string | null> {
  const linearApiKey = process.env.LINEAR_API_KEY;
  const linearTeamId = process.env.LINEAR_TEAM_ID;
  
  if (!linearApiKey || !linearTeamId) {
    console.log('⚠️ LINEAR_API_KEY and LINEAR_TEAM_ID must be set in environment');
    return null;
  }
  
  const mutation = `
    mutation IssueCreate {
      issueCreate(
        input: {
          title: "${test.title}"
          teamId: "${linearTeamId}"
          description: "# Test Failure\\n\\n**File:** ${test.file}\\n**Duration:** ${test.duration}ms\\n\\n\`\`\`\\n${test.error || 'No error message'}\\n\`\`\`"
          labelIds: []
        }
      ) {
        success
        issue {
          id
          identifier
          title
        }
      }
    }
  `;
  
  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': linearApiKey,
      },
      body: JSON.stringify({ query: mutation }),
    });
    
    const result: LinearResponse = await response.json();
    
    if (result.errors) {
      console.error('Linear API Error:', result.errors);
      return null;
    }
    
    if (result.data?.issueCreate?.success && result.data.issueCreate.issue) {
      const issue = result.data.issueCreate.issue;
      console.log(`✅ Created Linear issue: ${issue.identifier} - ${issue.title}`);
      return issue.identifier;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating Linear issue:', error);
    return null;
  }
}

async function main() {
  console.log('🔄 Syncing bugs to Linear...\n');
  
  const failedTests = await parseBugReport();
  
  if (failedTests.length === 0) {
    console.log('🎉 No bugs to sync!');
    return;
  }
  
  console.log(`Found ${failedTests.length} failed test(s)\n`);
  
  const issues: Array<{ test: string; issue: string }> = [];
  
  for (const test of failedTests) {
    console.log(`Creating issue for: ${test.title}`);
    const issueId = await createLinearIssue(test);
    
    if (issueId) {
      issues.push({ test: test.title, issue: issueId });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Update report with Linear issue IDs
  if (issues.length > 0) {
    const reportPath = join('test-results', 'latest-report.md');
    if (existsSync(reportPath)) {
      let report = readFileSync(reportPath, 'utf-8');
      
      report += `\n## Linear Issues Created\n\n`;
      for (const { test, issue } of issues) {
        report += `- **${test}** → [${issue}](https://linear.app/your-workspace/issue/${issue})\n`;
      }
      
      writeFileSync(reportPath, report);
      console.log(`\n✅ Updated bug report with Linear issue references`);
    }
  }
  
  console.log(`\n✨ Sync complete! Created ${issues.length} issue(s) in Linear`);
}

main();

