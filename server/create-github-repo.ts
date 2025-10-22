import { getUncachableGitHubClient } from './github';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function createAndPushRepo() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const user = await octokit.rest.users.getAuthenticated();
    console.log(`Authenticated as: ${user.data.login}`);
    
    const repoName = process.env.REPL_SLUG || 'my-replit-project';
    
    console.log(`Creating repository: ${repoName}`);
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      private: false,
      auto_init: false,
      description: 'Created from Replit'
    });
    
    console.log(`Repository created: ${repo.data.html_url}`);
    
    const remoteUrl = `https://${user.data.login}:TOKEN@github.com/${user.data.login}/${repoName}.git`;
    
    console.log('Configuring git...');
    await execAsync('git config --global user.email "replit@replit.com"');
    await execAsync('git config --global user.name "Replit User"');
    
    console.log('Checking git status...');
    try {
      await execAsync('git status');
      console.log('Git repository already initialized');
    } catch {
      console.log('Initializing git repository...');
      await execAsync('git init');
    }
    
    console.log('Staging files...');
    await execAsync('git add .');
    
    console.log('Creating commit...');
    try {
      await execAsync('git commit -m "Initial commit from Replit"');
    } catch (e: any) {
      if (e.message.includes('nothing to commit')) {
        console.log('Nothing to commit');
      } else {
        throw e;
      }
    }
    
    console.log('Adding remote...');
    try {
      await execAsync(`git remote add origin ${remoteUrl.replace('TOKEN', await getAccessTokenForGit())}`);
    } catch (e: any) {
      if (e.message.includes('remote origin already exists')) {
        console.log('Remote already exists, updating...');
        await execAsync(`git remote set-url origin ${remoteUrl.replace('TOKEN', await getAccessTokenForGit())}`);
      } else {
        throw e;
      }
    }
    
    console.log('Checking for existing branch...');
    const { stdout: branchOutput } = await execAsync('git branch --show-current');
    const currentBranch = branchOutput.trim() || 'main';
    
    if (currentBranch !== 'main') {
      console.log('Renaming branch to main...');
      await execAsync('git branch -M main');
    }
    
    console.log('Pushing to GitHub...');
    await execAsync('git push -u origin main');
    
    console.log('\n✅ Success!');
    console.log(`Repository URL: ${repo.data.html_url}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('GitHub API Error:', error.response.data);
    }
    throw error;
  }
}

async function getAccessTokenForGit() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
  
  if (!accessToken) {
    throw new Error('GitHub access token not found');
  }
  
  return accessToken;
}

createAndPushRepo();
