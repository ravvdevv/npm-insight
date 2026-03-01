import * as fs from 'fs';
import * as path from 'path';

export interface PackageInfo {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  bin: Record<string, string> | string | undefined;
  allDependencies: string[]; // Combined list of dep names
}

export function readPackage(projectPath: string): PackageInfo | null {
  const packagePath = path.resolve(projectPath, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(packagePath, 'utf-8');
    const pkg = JSON.parse(content);

    const dependencies = pkg.dependencies || {};
    const devDependencies = pkg.devDependencies || {};

    return {
      name: pkg.name || '',
      version: pkg.version || '',
      dependencies,
      devDependencies,
      scripts: pkg.scripts || {},
      bin: pkg.bin,
      allDependencies: [
        ...Object.keys(dependencies),
        ...Object.keys(devDependencies),
      ],
    };
  } catch (err) {
    return null;
  }
}
