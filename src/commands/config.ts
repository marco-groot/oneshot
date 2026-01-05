import { ClaudeService } from '../services/claude.js';
import Conf from 'conf';
import * as readline from 'readline';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const config = new Conf({ projectName: 'oneshot' });

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function readApiKeyFromZshrc(): string | null {
  try {
    const zshrcPath = path.join(os.homedir(), '.zshrc');
    if (!fs.existsSync(zshrcPath)) {
      return null;
    }

    const content = fs.readFileSync(zshrcPath, 'utf-8');
    const match = content.match(/export\s+ANTHROPIC_API_KEY=["']?([^"'\s]+)["']?/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}

export async function runInteractiveConfig(): Promise<void> {
  console.log('Welcome to oneshot configuration!\n');
  console.log('Note: Oneshot uses the Claude CLI for authentication.');
  console.log('Make sure you have run "claude" and authenticated via the web.\n');

  const setupApiKey = await prompt('Would you like to set up an API key anyway? (y/n, usually not needed): ');

  if (setupApiKey.toLowerCase() === 'y' || setupApiKey.toLowerCase() === 'yes') {
    const readPermission = await prompt('Read API key from .zshrc? (y/n): ');

    if (readPermission.toLowerCase() === 'y' || readPermission.toLowerCase() === 'yes') {
      const apiKey = readApiKeyFromZshrc();
      if (apiKey) {
        ClaudeService.setApiKey(apiKey);
        console.log('✓ API key found and saved successfully\n');
      } else {
        console.log('✗ No ANTHROPIC_API_KEY found in .zshrc');
        const manualKey = await prompt('Please enter your API key manually (or press Enter to skip): ');
        if (manualKey) {
          ClaudeService.setApiKey(manualKey);
          console.log('✓ API key saved successfully\n');
        } else {
          console.log('Skipping API key setup\n');
        }
      }
    } else {
      const manualKey = await prompt('Please enter your API key (or press Enter to skip): ');
      if (manualKey) {
        ClaudeService.setApiKey(manualKey);
        console.log('✓ API key saved successfully\n');
      } else {
        console.log('Skipping API key setup\n');
      }
    }
  } else {
    console.log('Skipping API key setup (using Claude CLI authentication)\n');
  }

  const branchPrefix = await prompt('Enter your branch prefix (e.g., if you enter "marco", branches will be "marco/your-task-name"): ');
  if (branchPrefix) {
    config.set('branchPrefix', branchPrefix);
    console.log(`✓ Branch prefix set to "${branchPrefix}"`);
    console.log(`  All branches will be prefixed: ${branchPrefix}/your-task-name\n`);
  } else {
    console.log('Skipping branch prefix setup\n');
  }

  console.log('Configuration complete!');
}

export function setConfig(key: string, value: string): void {
  if (key === 'apiKey') {
    ClaudeService.setApiKey(value);
    console.log('✓ API key saved successfully');
  } else if (key === 'branchPrefix') {
    config.set('branchPrefix', value);
    console.log('✓ Branch prefix saved successfully');
  } else {
    console.error(`Unknown config key: ${key}`);
    process.exit(1);
  }
}

export function getConfig(key: string): void {
  if (key === 'apiKey') {
    const apiKey = ClaudeService.getStoredApiKey();
    if (apiKey) {
      const masked = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
      console.log(`apiKey: ${masked}`);
    } else {
      console.log('apiKey: not set');
    }
  } else if (key === 'branchPrefix') {
    const prefix = config.get('branchPrefix') as string | undefined;
    console.log(`branchPrefix: ${prefix || 'not set'}`);
  } else {
    console.error(`Unknown config key: ${key}`);
    process.exit(1);
  }
}

export function clearConfig(key: string): void {
  if (key === 'apiKey') {
    ClaudeService.clearApiKey();
    console.log('✓ API key cleared');
  } else if (key === 'branchPrefix') {
    config.delete('branchPrefix');
    console.log('✓ Branch prefix cleared');
  } else {
    console.error(`Unknown config key: ${key}`);
    process.exit(1);
  }
}
