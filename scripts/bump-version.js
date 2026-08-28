import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function bumpVersion() {
  const pkgPath = path.join(rootDir, 'package.json');
  const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
  const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');

  if (!fs.existsSync(pkgPath)) {
    console.error('package.json não encontrado!');
    process.exit(1);
  }

  // 1. Read package.json
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentVersion = pkg.version || '0.1.0';
  const parts = currentVersion.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1; // Bump patch version
  const newVersion = parts.join('.');

  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`[Crescent Version Bump] package.json: ${currentVersion} -> ${newVersion}`);

  // 2. Update src-tauri/tauri.conf.json
  if (fs.existsSync(tauriConfPath)) {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    tauriConf.version = newVersion;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
    console.log(`[Crescent Version Bump] tauri.conf.json: ${currentVersion} -> ${newVersion}`);
  }

  // 3. Update src-tauri/Cargo.toml
  if (fs.existsSync(cargoTomlPath)) {
    let cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
    cargoContent = cargoContent.replace(
      /version\s*=\s*"[^"]+"/,
      `version = "${newVersion}"`
    );
    fs.writeFileSync(cargoTomlPath, cargoContent, 'utf8');
    console.log(`[Crescent Version Bump] Cargo.toml: ${currentVersion} -> ${newVersion}`);
  }

  return newVersion;
}

bumpVersion();
