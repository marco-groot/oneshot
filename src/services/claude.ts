import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Conf from 'conf';
import type { ClaudeResponse } from '../types.js';

const config = new Conf({ projectName: 'oneshot' });

export class ClaudeService {
  constructor() {
    try {
      execSync('claude --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error(
        'Claude CLI not found or not authenticated.\n' +
        'Please install and authenticate with Claude CLI:\n' +
        '  1. Install: npm install -g @anthropic-ai/claude-code\n' +
        '  2. Run: claude\n' +
        '  3. Follow the authentication prompts'
      );
    }
  }

  static setApiKey(key: string): void {
    config.set('apiKey', key);
  }

  static getStoredApiKey(): string | undefined {
    return config.get('apiKey') as string | undefined;
  }

  static clearApiKey(): void {
    config.delete('apiKey');
  }

  async executeTask(taskName: string): Promise<ClaudeResponse> {
    const tempDir = path.join(os.tmpdir(), `oneshot-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const promptFile = path.join(tempDir, 'prompt.txt');
    fs.writeFileSync(promptFile, `Execute the following task: ${taskName}`);

    try {
      const output = execSync(`claude "${taskName}"`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        content: output,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
        },
      };
    } catch (error) {
      throw new Error(`Claude execution failed: ${error}`);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async executeTaskInWorktree(prompt: string, worktreePath: string): Promise<ClaudeResponse> {
    return new Promise((resolve, reject) => {
      const fullPrompt = `You are working in a git worktree at: ${worktreePath}

Please complete the following task. Make all necessary changes to files in this directory:

${prompt}

Important:
- Make all changes directly in the worktree
- Ensure all changes are saved
- The changes will be automatically committed and pushed`;

      const claudeProcess = spawn('claude', [fullPrompt], {
        cwd: worktreePath,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      claudeProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      claudeProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      claudeProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            content: output || 'Task completed successfully',
            usage: {
              inputTokens: 0,
              outputTokens: 0,
            },
          });
        } else {
          reject(new Error(`Claude execution failed (code ${code}): ${errorOutput || output}`));
        }
      });

      claudeProcess.on('error', (error) => {
        reject(new Error(`Failed to start Claude CLI: ${error.message}`));
      });
    });
  }
}
