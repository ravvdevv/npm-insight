#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { analyze } from './analyzer';
import { formatHuman } from './output/human';
import { formatJson } from './output/json';

// Simple colors (no dependencies)
const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

// Simple spinner
class Spinner {
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private i = 0;
  private interval?: ReturnType<typeof setInterval>;
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  start() {
    process.stdout.write('\x1b[?25l'); // Hide cursor
    this.interval = setInterval(() => {
      process.stdout.write(`\r${c.cyan(this.frames[this.i])} ${this.text}`);
      this.i = (this.i + 1) % this.frames.length;
    }, 80);
  }

  stop(success = true) {
    if (this.interval) clearInterval(this.interval);
    process.stdout.write('\x1b[?25h'); // Show cursor
    process.stdout.write(`\r${success ? c.green('✓') : c.red('✗')} ${this.text}\n`);
  }
}

const program = new Command();

program
  .name('dxscan')
  .description('Command-line utility for Node.js that checks for absent standard npm packages in a project.')
  .version('0.0.1')
  .argument('[path]', 'Path to project directory', '.')
  .option('--json', 'Output results as JSON')
  .option('--no-spinner', 'Disable progress spinner')
  .action(async (targetPath: string, options: { json?: boolean; spinner?: boolean }) => {
    const absolutePath = path.resolve(targetPath);

    // Validate path exists
    if (!fs.existsSync(absolutePath)) {
      console.error(c.red(`Error: Path does not exist: ${absolutePath}`));
      process.exit(1);
    }

    // Check for package.json
    const pkgPath = path.join(absolutePath, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      console.error(c.red(`Error: No package.json found in ${absolutePath}`));
      console.error(c.dim('dxscan requires a Node.js project with package.json'));
      process.exit(1);
    }

    const spinner = options.spinner !== false && !options.json ? new Spinner('Scanning project...') : null;

    try {
      spinner?.start();
      const result = await analyze(absolutePath);
      spinner?.stop(true);

      if (options.json) {
        console.log(formatJson(result));
      } else {
        console.log(formatHuman(result));
      }
    } catch (err) {
      spinner?.stop(false);
      console.error(c.red(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program.parse();
