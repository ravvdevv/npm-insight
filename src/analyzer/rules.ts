import { ScanResult } from './scanFiles';
import { PackageInfo } from './readPackage';

export interface Rule {
  id: string;
  category: string;
  name: string;
  detect: (files: ScanResult, pkg: PackageInfo) => string[]; // Returns list of matching files
  confidence: (files: ScanResult, pkg: PackageInfo) => number;
  recommendations: string[];
  reason: string;
}

// Helper: check if any dependency matches
function hasDep(pkg: PackageInfo, patterns: string[]): boolean {
  return patterns.some(p =>
    pkg.allDependencies.some(d => d.includes(p))
  );
}

// Helper: find files that match regex
function findMatchingFiles(files: ScanResult, pattern: RegExp): string[] {
  const matches: string[] = [];
  for (let i = 0; i < files.files.length; i++) {
    if (pattern.test(files.contents[i])) {
      matches.push(files.files[i]);
    }
  }
  return matches;
}
// Helper: check if content matches regex
function contentMatches(contents: string[], pattern: RegExp): boolean {
  return contents.some(c => pattern.test(c));
}

// Helper: count regex matches across all files
function countMatches(contents: string[], pattern: RegExp): number {
  return contents.reduce((count, c) => {
    const matches = c.match(new RegExp(pattern, 'g'));
    return count + (matches?.length || 0);
  }, 0);
}

export const rules: Rule[] = [
  // 1. Env Management
  {
    id: 'env-management',
    category: 'Configuration',
    name: 'Environment Variable Management',
    detect: (files, pkg) => {
      const hasDotenv = hasDep(pkg, ['dotenv', 'env-cmd', '@t3-oss/env']);
      if (hasDotenv) return [];
      return findMatchingFiles(files, /process\.env\./);
    },
    confidence: (files, pkg) => {
      const envCount = countMatches(files.contents, /process\.env\./);
      if (envCount > 10) return 0.95;
      if (envCount > 5) return 0.85;
      if (envCount > 0) return 0.7;
      return 0;
    },
    recommendations: ['dotenv', 'env-cmd', '@t3-oss/env-core'],
    reason: 'project uses process.env but lacks env management library',
  },

  // 2. CLI Arg Parsing
  {
    id: 'cli-parsing',
    category: 'CLI',
    name: 'CLI Argument Parsing',
    detect: (files, pkg) => {
      const hasCli = hasDep(pkg, ['commander', 'yargs', 'cac', 'meow', 'minimist', 'arg']);
      if (hasCli) return [];

      const hasBin = !!pkg.bin;
      const matchedFiles = findMatchingFiles(files, /process\.argv/);

      if (hasBin && matchedFiles.length === 0) {
        // If it has a bin entry but no direct process.argv usage caught by regex,
        // we still say it's detected but we might not have a specific file evidence
        // except the package.json bin (which is handled separately or just implied)
        return ['package.json (bin)'];
      }

      return matchedFiles;
    },
    confidence: (files, pkg) => {
      const hasBin = !!pkg.bin;
      const usesArgs = contentMatches(files.contents, /process\.argv/);
      if (hasBin && usesArgs) return 0.95;
      if (hasBin) return 0.85;
      if (usesArgs) return 0.75;
      return 0;
    },
    recommendations: ['commander', 'cac', 'yargs'],
    reason: 'project has CLI entry or uses process.argv without arg parser',
  },

  // 3. Logging Abstraction
  {
    id: 'logging',
    category: 'Observability',
    name: 'Logging Abstraction',
    detect: (files, pkg) => {
      const hasLogger = hasDep(pkg, ['winston', 'pino', 'bunyan', 'loglevel', 'signale', 'consola']);
      if (hasLogger) return [];

      const consoleCount = countMatches(files.contents, /console\.(log|error|warn|info)/);
      if (consoleCount <= 10) return [];

      return findMatchingFiles(files, /console\.(log|error|warn|info)/);
    },
    confidence: (files, pkg) => {
      const count = countMatches(files.contents, /console\.(log|error|warn|info)/);
      if (count > 50) return 0.9;
      if (count > 20) return 0.8;
      if (count > 10) return 0.7;
      return 0.5;
    },
    recommendations: ['pino', 'winston', 'consola'],
    reason: 'heavy console.log usage without structured logging',
  },

  // 4. Cron / Scheduler
  {
    id: 'scheduler',
    category: 'Scheduling',
    name: 'Task Scheduling',
    detect: (files, pkg) => {
      const hasScheduler = hasDep(pkg, ['node-cron', 'cron', 'node-schedule', 'agenda', 'bull']);
      if (hasScheduler) return [];

      return findMatchingFiles(files, /setInterval\s*\(|schedule|cron|every.*minutes/i);
    },
    confidence: (files, pkg) => {
      const intervalCount = countMatches(files.contents, /setInterval\s*\(/);
      const hasCronPattern = contentMatches(files.contents, /cron|schedule/i);
      if (hasCronPattern) return 0.85;
      if (intervalCount > 3) return 0.8;
      if (intervalCount > 0) return 0.65;
      return 0;
    },
    recommendations: ['node-cron', 'node-schedule', 'agenda'],
    reason: 'uses setInterval or schedule patterns without dedicated scheduler',
  },

  // 5. Config Validation
  {
    id: 'config-validation',
    category: 'Configuration',
    name: 'Configuration Validation',
    detect: (files, pkg) => {
      const hasValidator = hasDep(pkg, ['zod', 'joi', 'yup', 'ajv', 'convict', 'envalid']);
      if (hasValidator) return [];

      const configFiles = files.files.filter(f => /config\.(js|ts|json)$/i.test(f));
      const envUsageFiles = findMatchingFiles(files, /process\.env\./);

      return [...new Set([...configFiles, ...envUsageFiles])];
    },
    confidence: (files, pkg) => {
      const envCount = countMatches(files.contents, /process\.env\./);
      const hasConfigFile = files.files.some(f => /config\.(js|ts|json)$/i.test(f));
      if (envCount > 10 && hasConfigFile) return 0.9;
      if (envCount > 5) return 0.75;
      if (hasConfigFile) return 0.7;
      return 0.6;
    },
    recommendations: ['zod', 'envalid', 'convict'],
    reason: 'config/env usage without schema validation',
  },

  // 6. HTTP Retry
  {
    id: 'http-retry',
    category: 'Networking',
    name: 'HTTP Request Retry/Resilience',
    detect: (files, pkg) => {
      const hasRetry = hasDep(pkg, ['p-retry', 'axios-retry', 'got', 'ky', 'retry', 'cockatiel']);
      const hasAxiosRetry = hasDep(pkg, ['axios-retry']);
      if (hasRetry || hasAxiosRetry) return [];

      return findMatchingFiles(files, /fetch\s*\(|axios\.|got\.|ky\./);
    },
    confidence: (files, pkg) => {
      const fetchCount = countMatches(files.contents, /fetch\s*\(|axios\.|http\.(get|post)/);
      if (fetchCount > 10) return 0.85;
      if (fetchCount > 5) return 0.75;
      if (fetchCount > 0) return 0.65;
      return 0;
    },
    recommendations: ['p-retry', 'axios-retry', 'got', 'ky'],
    reason: 'HTTP calls detected without retry/resilience patterns',
  },

  // 7. Testing Tools
  {
    id: 'testing',
    category: 'Testing',
    name: 'Testing Framework',
    detect: (files, pkg) => {
      const hasTestFramework = hasDep(pkg, ['jest', 'mocha', 'vitest', 'ava', 'tape', '@testing-library']);
      if (hasTestFramework) return [];

      if (files.files.length > 5) {
        return ['Project has > 5 files but no test framework'];
      }
      return [];
    },
    confidence: (files, pkg) => {
      const fileCount = files.files.length;
      const hasTestScript = pkg.scripts.test && pkg.scripts.test.includes('no test');
      if (hasTestScript && fileCount > 20) return 0.95;
      if (fileCount > 30) return 0.85;
      if (fileCount > 10) return 0.75;
      return 0.6;
    },
    recommendations: ['vitest', 'jest', '@testing-library/react'],
    reason: 'no testing framework detected in project with multiple files',
  },

  // 8. File Watching
  {
    id: 'file-watching',
    category: 'Development',
    name: 'File Watching',
    detect: (files, pkg) => {
      const hasWatcher = hasDep(pkg, ['chokidar', 'nodemon', 'watchpack', 'nsfw']);
      if (hasWatcher) return [];

      return findMatchingFiles(files, /fs\.watch\s*\(/);
    },
    confidence: (files, pkg) => {
      const watchCount = countMatches(files.contents, /fs\.watch\s*\(/);
      if (watchCount > 2) return 0.9;
      if (watchCount > 0) return 0.75;
      return 0;
    },
    recommendations: ['chokidar', 'nodemon'],
    reason: 'using fs.watch directly instead of robust file watcher',
  },
];
