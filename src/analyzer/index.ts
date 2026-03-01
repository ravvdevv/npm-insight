import { scanFiles, ScanResult } from './scanFiles';
import { readPackage, PackageInfo } from './readPackage';
import { rules, Rule } from './rules';

export interface InsightResult {
  id: string;
  category: string;
  name: string;
  confidence: number;
  reason: string;
  recommendations: string[];
  evidence: string[]; // List of files that triggered the insight
}

export interface AnalysisResult {
  projectPath: string;
  projectName: string;
  filesScanned: number;
  dependencyCount: number;
  insights: InsightResult[];
  healthScore: number;
  timestamp: string;
}

const CONFIDENCE_THRESHOLD = 0.6;

export async function analyze(projectPath: string): Promise<AnalysisResult> {
  // 1. Scan files
  const files = await scanFiles(projectPath);

  // 2. Read package.json
  const pkg = readPackage(projectPath);

  if (!pkg) {
    throw new Error(`No package.json found in ${projectPath}`);
  }

  // 3. Run all rules and collect insights
  const insights: InsightResult[] = [];

  for (const rule of rules) {
    const evidence = rule.detect(files, pkg);
    const confidence = rule.confidence(files, pkg);

    if (evidence.length > 0 && confidence >= CONFIDENCE_THRESHOLD) {
      insights.push({
        id: rule.id,
        category: rule.category,
        name: rule.name,
        confidence,
        reason: rule.reason,
        recommendations: rule.recommendations,
        evidence,
      });
    }
  }

  // 4. Sort by confidence (highest first)
  insights.sort((a, b) => b.confidence - a.confidence);

  // 5. Calculate Health Score
  // Start at 100, deduct confidence * 10 for each insight
  const totalDeduction = insights.reduce((sum, insight) => sum + insight.confidence * 12, 0);
  const healthScore = Math.max(0, Math.round(100 - totalDeduction));

  return {
    projectPath,
    projectName: pkg.name || 'unknown',
    filesScanned: files.files.length,
    dependencyCount: pkg.allDependencies.length,
    insights,
    healthScore,
    timestamp: new Date().toISOString(),
  };
}
