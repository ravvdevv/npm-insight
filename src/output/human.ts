import * as path from 'path';
import { AnalysisResult } from '../analyzer';

// Simple colors
const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  white: (s: string) => `\x1b[97m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
};

const pad = (s: string, n: number) => s.padEnd(n);
const LABEL_WIDTH = 14;
const BANNER = `
${c.white(' ██████╗ ██╗  ██╗███████╗ ██████╗ █████╗ ███╗   ██╗')}
${c.white(' ██╔══██╗╚██╗██╔╝██╔════╝██╔════╝██╔══██╗████╗  ██║')}
${c.white(' ██║  ██║ ╚███╔╝ ███████╗██║     ███████║██╔██╗ ██║')}
${c.white(' ██║  ██║ ██╔██╗ ╚════██║██║     ██╔══██║██║╚██╗██║')}
${c.white(' ██████╔╝██╔╝ ██╗███████║╚██████╗██║  ██║██║ ╚████║')}
${c.white(' ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝')}
${c.gray('    D E V E L O P E R   E X P E R I E N C E   S C A N')}
`;

export function formatHuman(result: AnalysisResult): string {
  const lines: string[] = [];

  const scoreColor = result.healthScore >= 90 ? c.green : (result.healthScore >= 70 ? c.yellow : c.red);
  const healthLabel = result.healthScore >= 90 ? 'Excellent' : (result.healthScore >= 70 ? 'Good' : (result.healthScore >= 50 ? 'Fair' : 'Critical'));

  lines.push(BANNER);
  lines.push(`  ${c.dim('Project:')}  ${c.bold(result.projectName)}  ${scoreColor(`(${result.healthScore}% - ${healthLabel})`)}`);
  lines.push(`  ${c.dim('Context:')}  ${result.filesScanned} files, ${result.dependencyCount} deps`);
  lines.push('');

  if (result.insights.length === 0) {
    lines.push(c.green('  ✓ No DX insights detected!'));
    lines.push(c.gray('    Your project is following standard best practices.'));
    lines.push('');
    return lines.join('\n');
  }

  const insightWord = result.insights.length === 1 ? 'insight' : 'insights';
  lines.push(`  ${c.yellow('⚠')} ${c.bold(`Found ${result.insights.length} potential ${insightWord}:`)}`);
  lines.push('');

  for (const insight of result.insights) {
    const confidencePercent = Math.round(insight.confidence * 100);
    const bar = getConfidenceBar(insight.confidence);

    lines.push(`  ${c.cyan('┌─')} ${c.bold(insight.name)}`);
    lines.push(`  ${c.cyan('│')}  ${c.dim(pad('Category:', LABEL_WIDTH))} ${insight.category}`);
    lines.push(`  ${c.cyan('│')}  ${c.dim(pad('Confidence:', LABEL_WIDTH))} ${bar} ${c.bold(confidencePercent + '%')}`);
    lines.push(`  ${c.cyan('│')}  ${c.dim(pad('Why:', LABEL_WIDTH))} ${insight.reason}`);

    if (insight.evidence.length > 0) {
      const displayEvidence = insight.evidence
        .slice(0, 3)
        .map(f => path.basename(f))
        .join(', ');
      const more = insight.evidence.length > 3 ? ` (+${insight.evidence.length - 3} more)` : '';
      lines.push(`  ${c.cyan('│')}  ${c.dim(pad('Found in:', LABEL_WIDTH))} ${c.gray(displayEvidence + more)}`);
    }

    lines.push(`  ${c.cyan('│')}`);
    lines.push(`  ${c.cyan('│')}  ${c.dim('Suggested Packages:')}`);
    for (const rec of insight.recommendations.slice(0, 3)) {
      lines.push(`  ${c.cyan('│')}    ${c.green('→')} ${c.magenta(rec)} ${c.gray(`(npm install ${rec})`)}`);
    }
    lines.push(`  ${c.cyan('└────────────────────────────────────────────')}`);
    lines.push('');
  }

  lines.push(`  ${c.gray(`Run with ${c.white('--json')} for raw data.`)}`);
  lines.push('');

  return lines.join('\n');
}

function getConfidenceBar(confidence: number): string {
  const filled = Math.round(confidence * 10);
  const empty = 10 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  if (confidence >= 0.85) return `\x1b[32m${bar}\x1b[0m`; // green
  if (confidence >= 0.7) return `\x1b[33m${bar}\x1b[0m`;  // yellow
  return `\x1b[90m${bar}\x1b[0m`; // gray
}
