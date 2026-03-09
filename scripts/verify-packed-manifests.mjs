import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const packages = [
  {
    name: '@md-lark-converter/core',
    dir: 'packages/core',
  },
  {
    name: '@md-lark-converter/cli',
    dir: 'packages/cli',
  },
];

const dependencySections = [
  'dependencies',
  'peerDependencies',
  'optionalDependencies',
];

const tempDir = mkdtempSync(join(tmpdir(), 'md-lark-pack-'));
const offenders = [];

try {
  for (const pkg of packages) {
    execFileSync('pnpm', ['pack', '--pack-destination', tempDir], {
      cwd: pkg.dir,
      stdio: 'pipe',
      encoding: 'utf8',
    });

    const pkgJson = JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf8'));
    const archiveName = `${pkgJson.name.replace('@', '').replace('/', '-')}-${pkgJson.version}.tgz`;
    const packedManifestText = execFileSync('tar', ['-xOf', join(tempDir, archiveName), 'package/package.json'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const packedManifest = JSON.parse(packedManifestText);

    for (const section of dependencySections) {
      for (const [name, version] of Object.entries(packedManifest[section] ?? {})) {
        if (typeof version === 'string' && version.startsWith('workspace:')) {
          offenders.push(`${pkg.name} -> ${section}.${name} = ${version}`);
        }
      }
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

if (offenders.length > 0) {
  console.error('Found unresolved workspace protocol dependencies in packed manifests:');
  for (const offender of offenders) {
    console.error(`- ${offender}`);
  }
  process.exit(1);
}

console.log('Packed manifests are free of workspace protocol dependencies.');
