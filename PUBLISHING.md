# Publishing dxscan

## Pre-Publish Checklist

- [ ] Update version in `package.json`
- [ ] Run build: `npm run build`
- [ ] Test locally: `dxscan .`
- [ ] Test on another project: `dxscan /path/to/real-project`
- [ ] Check package contents: `npm pack --dry-run`

## Versioning

Follow semantic versioning:

- `0.0.x` - Bug fixes, minor rule improvements
- `0.x.0` - New rules, new features
- `x.0.0` - Breaking changes (CLI args, output format)

## Dry Run

```bash
# See what will be published
npm pack --dry-run

# Create local tarball for inspection
npm pack
```

## Publish Commands

```bash
# First time: login to npm
npm login

# Publish (public package)
npm publish --access public

# Publish beta version
npm version prerelease --preid=beta
npm publish --tag beta
```

## Post-Publish

```bash
# Verify installation works
npx dxscan@latest .

# Check npm page
# https://www.npmjs.com/package/dxscan
```

## Package Contents

Published package includes:

```
dist/           # Compiled JS
package.json
README.md
```

Excluded (via .npmignore):

```
src/            # TypeScript source
tsconfig.json
node_modules/
```
