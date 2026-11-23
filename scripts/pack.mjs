import { execFileSync, execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const TRACK_MAP = {
  de1: 'de-1-so-tay-chi-doan',
  de2: 'de-2-tai-mat-cong-dan',
  de3: 'de-3-ocop-len-san',
  de4: 'de-4-chong-lua-101'
};

const ALL_TRACKS = Object.values(TRACK_MAP);

const args = process.argv.slice(2);
let appArg = 'all';
let skipBuild = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--app' && args[i + 1]) {
    appArg = args[i + 1];
    i++;
  } else if (args[i] === '--skip-build') {
    skipBuild = true;
  }
}

const resolvedTarget = TRACK_MAP[appArg] || appArg;
const targets = resolvedTarget === 'all' ? ALL_TRACKS : [resolvedTarget];

for (const folder of targets) {
  if (!ALL_TRACKS.includes(folder)) {
    throw new Error(`Unknown track '${folder}'. Use all, de1..de4, or exact folder name.`);
  }
}

const releaseDir = resolve('release');
mkdirSync(releaseDir, { recursive: true });

function createZip(sourceDir, destZip) {
  if (existsSync(destZip)) {
    rmSync(destZip, { force: true });
  }

  if (process.platform === 'win32') {
    execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        '$ErrorActionPreference = "Stop"; Compress-Archive -Path (Join-Path $env:PACK_SRC "*") -DestinationPath $env:PACK_DEST -Force'
      ],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          PACK_SRC: sourceDir,
          PACK_DEST: destZip
        }
      }
    );
  } else {
    execFileSync('zip', ['-rq', destZip, '.'], { cwd: sourceDir, stdio: 'inherit' });
  }
}

const EXCLUDED_NAMES = new Set(['node_modules', 'dist', '.git', '.codegraph', 'coverage']);

function shouldCopySource(srcPath) {
  const normalized = srcPath.replace(/\\/g, '/');
  const base = normalized.split('/').pop() || '';
  if (EXCLUDED_NAMES.has(base)) return false;
  if (base === '.env' || base.startsWith('.env.')) {
    if (base !== '.env.example') return false;
  }
  if (base.endsWith('.log')) return false;
  return true;
}

for (const folder of targets) {
  const trackDir = resolve(folder);
  const distDir = resolve(trackDir, 'dist');

  if (!skipBuild) {
    console.log(`[pack] Building ${folder} (VITE_BASE_PATH=/)...`);
    execSync('npx vite build', {
      cwd: trackDir,
      stdio: 'inherit',
      env: { ...process.env, VITE_BASE_PATH: '/' }
    });
  }

  if (!existsSync(distDir)) {
    throw new Error(`Missing dist/ in ${folder}. Run build first or omit --skip-build.`);
  }

  const distZip = resolve(releaseDir, `${folder}-dist.zip`);
  console.log(`[pack] Creating ${folder}-dist.zip...`);
  createZip(distDir, distZip);

  const stageRoot = mkdtempSync(join(tmpdir(), `pack-${folder}-`));
  try {
    cpSync(trackDir, stageRoot, {
      recursive: true,
      filter: (src) => shouldCopySource(src)
    });
    const srcZip = resolve(releaseDir, `${folder}-source.zip`);
    console.log(`[pack] Creating ${folder}-source.zip...`);
    createZip(stageRoot, srcZip);
  } finally {
    rmSync(stageRoot, { recursive: true, force: true });
  }
}

console.log(`[pack] Done. Packages written to ${releaseDir}`);
