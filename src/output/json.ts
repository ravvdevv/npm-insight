import { AnalysisResult } from '../analyzer';

export function formatJson(result: AnalysisResult): string {
  // result object already has 'insights' property
  return JSON.stringify(result, null, 2);
}
