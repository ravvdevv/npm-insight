# dxscan

Scans Node.js projects and detects missing common npm utilities.

## What problem this solves

Many Node.js projects reinvent the wheel or use raw APIs when battle-tested packages exist. This tool scans your codebase and identifies patterns that suggest you might benefit from adding a dedicated package.

## Installation

```bash
npx dxscan .
```

Or install globally:

```bash
npm install -g dxscan
dxscan /path/to/project
```

## Usage

```bash
# Scan current directory
dxscan .

# Scan specific project
dxscan /path/to/project

# JSON output (for CI/scripts)
dxscan . --json
```

## Example Output

```
📦 dxscan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: my-app
Files scanned: 83
Dependencies: 30

Found 2 potential DX insights:

┌─ HTTP Request Retry/Resilience
│  Category: Networking
│  Confidence: ████████░░ 85%
│  Reason: HTTP calls detected without retry/resilience patterns
│
│  Recommended packages:
│    npm install p-retry
│    npm install axios-retry
└─────────────────────────────────────────

┌─ Logging Abstraction
│  Category: Observability
│  Confidence: ████████░░ 80%
│  Reason: heavy console.log usage without structured logging
│
│  Recommended packages:
│    npm install pino
│    npm install winston
└─────────────────────────────────────────
```

## How It Works

1. **Scans** all `.js`, `.ts`, `.tsx` files (ignores `node_modules`, `dist`)
2. **Reads** `package.json` to check existing dependencies
3. **Runs rules** that detect patterns via regex + dependency absence
4. **Filters** results with confidence > 60%
5. **Outputs** sorted by confidence (highest first)

## Supported Insight Types

| ID                  | Category      | Detects                                             |
| ------------------- | ------------- | --------------------------------------------------- |
| `env-management`    | Configuration | `process.env` usage without dotenv                  |
| `cli-parsing`       | CLI           | `process.argv` or bin entry without commander/yargs |
| `logging`           | Observability | Heavy `console.log` without pino/winston            |
| `scheduler`         | Scheduling    | `setInterval` without node-cron                     |
| `config-validation` | Configuration | Config/env without zod/joi validation               |
| `http-retry`        | Networking    | fetch/axios calls without retry logic               |
| `testing`           | Testing       | No test framework in multi-file project             |
| `file-watching`     | Development   | `fs.watch` without chokidar                         |

## Roadmap

- [ ] Custom rule configuration
- [ ] Ignore specific rules via CLI flag
- [ ] Auto-fix suggestions (add to package.json)
- [ ] GitHub Action integration
- [ ] More detection rules (rate limiting, caching, etc.)

## License

MIT
