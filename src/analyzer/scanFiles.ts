import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

export interface ScanResult {
  files: string[];
  contents: string[];
}

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.git/**',
  '**/coverage/**',
];

export async function scanFiles(projectPath: string): Promise<ScanResult> {
  const absolutePath = path.resolve(projectPath);
  
  // Find all .js, .ts, .tsx files
  const files = await glob('**/*.{js,ts,tsx}', {
    cwd: absolutePath,
    ignore: IGNORE_PATTERNS,
    nodir: true,
    absolute: true,
  });

  const contents: string[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      contents.push(content);
    } catch (err) {
      // Skip files that can't be read
      contents.push('');
    }
  }

  return { files, contents };
}
