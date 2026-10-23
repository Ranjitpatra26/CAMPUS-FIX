import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = __dirname;
const DIST_DIR = path.join(BACKEND_DIR, 'dist');
const STAGING_DIR = path.join(BACKEND_DIR, '.package-staging');
const OUTPUT_ZIP = path.join(BACKEND_DIR, 'campusfix-lambda.zip');

console.log('=== CampusFix Backend Packaging Pipeline ===');

// 1. Check compiled files in dist/
if (!fs.existsSync(DIST_DIR)) {
  throw new Error(`dist directory not found at: ${DIST_DIR}. Please run build first.`);
}

const requiredFiles = [
  'index.js',
  'router.js',
  'db.js',
  'auth.js',
  'config.js',
  'errors.js',
  'types.js',
  'validation.js',
  'notifications.js'
];

for (const file of requiredFiles) {
  const filePath = path.join(DIST_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required compiled file: ${filePath}`);
  }
}

// 2. Prepare staging directory
if (fs.existsSync(STAGING_DIR)) {
  fs.rmSync(STAGING_DIR, { recursive: true, force: true });
}
fs.mkdirSync(STAGING_DIR, { recursive: true });

// 3. Copy compiled files into staging root
for (const file of requiredFiles) {
  fs.copyFileSync(path.join(DIST_DIR, file), path.join(STAGING_DIR, file));
  console.log(`Copied ${file} to staging root`);
}

// 4. Copy backend package.json into staging root
const pkgSource = path.join(BACKEND_DIR, 'package.json');
const pkgDest = path.join(STAGING_DIR, 'package.json');
fs.copyFileSync(pkgSource, pkgDest);
console.log('Copied package.json to staging root');

// 5. Install only production dependencies
console.log('Installing production dependencies in staging directory...');
execSync('npm install --omit=dev --no-package-lock --no-audit --no-fund', {
  cwd: STAGING_DIR,
  stdio: 'inherit'
});

// Remove any unwanted files/caches created during install if any
const unwantedPaths = [
  path.join(STAGING_DIR, '.package-lock.json'),
  path.join(STAGING_DIR, 'package-lock.json'),
  path.join(STAGING_DIR, 'node_modules', '.vite'),
  path.join(STAGING_DIR, 'node_modules', '.vitest-cache'),
  path.join(STAGING_DIR, 'node_modules', '.package-lock.json')
];

for (const p of unwantedPaths) {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}

// 6. Verify security constraints on staging
const stagingFiles = fs.readdirSync(STAGING_DIR);
console.log('Staging root contents:', stagingFiles);

const forbiddenNames = ['.env', '.git', 'tests', 'src', 'tsconfig.json'];
for (const item of stagingFiles) {
  if (forbiddenNames.some(f => item.toLowerCase().includes(f))) {
    throw new Error(`Forbidden file detected in staging: ${item}`);
  }
}

// 7. Verify handler in staging environment
console.log('Verifying handler in staging environment...');
const stagingIndex = await import(`file://${path.join(STAGING_DIR, 'index.js').replace(/\\/g, '/')}`);
if (typeof stagingIndex.handler !== 'function') {
  throw new Error('Handler is not exported as a function in staging!');
}

const testRes = await stagingIndex.handler({
  requestContext: { http: { method: 'GET', path: '/health' } },
  headers: {}
});

if (testRes.statusCode !== 200) {
  throw new Error(`Staging handler smoke test failed: status ${testRes.statusCode}`);
}
console.log('Staging handler smoke test passed: Health check status 200');

// 8. Create ZIP package
if (fs.existsSync(OUTPUT_ZIP)) {
  fs.unlinkSync(OUTPUT_ZIP);
}

console.log(`Creating ZIP package at ${OUTPUT_ZIP}...`);
// Use PowerShell Compress-Archive or tar
// tar -a -cf <zip> * inside staging directory
execSync(`tar -a -cf "${OUTPUT_ZIP}" *`, {
  cwd: STAGING_DIR,
  stdio: 'inherit'
});

const zipStats = fs.statSync(OUTPUT_ZIP);
console.log(`ZIP created successfully! Size: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB (${zipStats.size} bytes)`);

// 9. Clean up staging directory
fs.rmSync(STAGING_DIR, { recursive: true, force: true });
console.log('Cleaned up staging directory.');
console.log('=== Packaging Completed Successfully ===');
