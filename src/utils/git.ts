import { execSync } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

export interface GitInfo {
  mainBranch: string;
  repoRoot: string;
}

export function getGitInfo(): GitInfo {
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();

    let mainBranch = 'main';
    try {
      const remote = execSync('git remote', { encoding: 'utf-8' }).trim().split('\n')[0] || 'origin';
      const branches = execSync(`git branch -r`, { encoding: 'utf-8' }).trim();
      if (branches.includes(`${remote}/main`)) {
        mainBranch = 'main';
      } else if (branches.includes(`${remote}/master`)) {
        mainBranch = 'master';
      }
    } catch (e) {
      mainBranch = 'main';
    }

    return { mainBranch, repoRoot };
  } catch (error) {
    throw new Error('Not in a git repository');
  }
}

export function createWorktree(branchName: string, taskId: string): string {
  const gitInfo = getGitInfo();
  const worktreesDir = path.join(os.homedir(), '.oneshot', 'worktrees');

  if (!fs.existsSync(worktreesDir)) {
    fs.mkdirSync(worktreesDir, { recursive: true });
  }

  const worktreePath = path.join(worktreesDir, taskId);

  try {
    execSync(`git fetch origin ${gitInfo.mainBranch}`, { stdio: 'pipe' });
  } catch (e) {
    console.warn('Warning: Could not fetch from origin');
  }

  try {
    execSync(
      `git worktree add "${worktreePath}" -b "${branchName}" origin/${gitInfo.mainBranch}`,
      { stdio: 'pipe' }
    );
  } catch (error) {
    throw new Error(`Failed to create worktree: ${error}`);
  }

  return worktreePath;
}

export function removeWorktree(worktreePath: string): void {
  try {
    execSync(`git worktree remove "${worktreePath}" --force`, { stdio: 'pipe' });
  } catch (error) {
    console.warn(`Warning: Could not remove worktree: ${error}`);
  }
}

export function commitAndPush(worktreePath: string, branchName: string, commitMessage: string): void {
  const cwd = worktreePath;

  try {
    execSync('git add .', { cwd, stdio: 'pipe' });

    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
    if (!status.trim()) {
      throw new Error('No changes to commit');
    }

    execSync(`git commit -m "${commitMessage}"`, { cwd, stdio: 'pipe' });
    execSync(`git push -u origin "${branchName}"`, { cwd, stdio: 'pipe' });
  } catch (error) {
    throw new Error(`Failed to commit and push: ${error}`);
  }
}

export function createPR(worktreePath: string, title: string, body: string): string {
  try {
    const result = execSync(
      `gh pr create --title "${title}" --body "${body}"`,
      { cwd: worktreePath, encoding: 'utf-8' }
    );

    const urlMatch = result.match(/https:\/\/github\.com\/[^\s]+/);
    return urlMatch ? urlMatch[0] : result.trim();
  } catch (error) {
    throw new Error(`Failed to create PR: ${error}`);
  }
}

export function formatBranchName(prefix: string, taskName: string): string {
  const kebab = taskName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${prefix}/${kebab}`;
}

export function updateMainBranch(): string {
  let output = '';

  try {
    const gitInfo = getGitInfo();
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();

    execSync('git fetch origin', { stdio: 'pipe' });
    output += 'Fetched latest from origin\n';

    if (currentBranch !== gitInfo.mainBranch) {
      execSync(`git checkout ${gitInfo.mainBranch}`, { stdio: 'pipe' });
      output += `Switched to ${gitInfo.mainBranch}\n`;
    }

    try {
      execSync(`git pull origin ${gitInfo.mainBranch} --rebase`, { encoding: 'utf-8' });
      output += `Pulled and rebased from origin/${gitInfo.mainBranch}\n`;
    } catch (e) {
      output += `Already up to date with origin/${gitInfo.mainBranch}\n`;
    }

    if (currentBranch !== gitInfo.mainBranch) {
      execSync(`git checkout ${currentBranch}`, { stdio: 'pipe' });
      output += `Switched back to ${currentBranch}\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Failed to update main branch: ${error}`);
  }
}

export function updateFromRemote(worktreePath: string, branchName: string): string {
  const cwd = worktreePath;
  let output = '';

  try {
    execSync('git fetch origin', { cwd, stdio: 'pipe' });
    output += 'Fetched latest from origin\n';

    const gitInfo = getGitInfo();
    try {
      execSync(`git pull origin ${gitInfo.mainBranch} --rebase`, { cwd, encoding: 'utf-8' });
      output += `Pulled and rebased from origin/${gitInfo.mainBranch}\n`;
    } catch (e) {
      output += `No changes from origin/${gitInfo.mainBranch}\n`;
    }

    try {
      execSync(`git pull origin ${branchName}`, { cwd, encoding: 'utf-8' });
      output += `Pulled latest from origin/${branchName}\n`;
    } catch (e) {
      output += `No changes from origin/${branchName}\n`;
    }

    return output;
  } catch (error) {
    throw new Error(`Failed to update from remote: ${error}`);
  }
}
