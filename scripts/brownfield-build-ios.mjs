#!/usr/bin/env node
/**
 * Build brownfield iOS XCFrameworks without losing the Capacitor ios/ folder.
 *
 * expo-brownfield build:ios looks for a directory under ios/ that contains
 * ReactNativeHostManager.swift (created by expo prebuild with the brownfield plugin).
 * This project's ios/ is from Capacitor and has no such target.
 *
 * This script: backs up ios/ → runs expo prebuild (ios) → runs expo-brownfield build:ios
 * → restores ios/ from backup. Artifacts end up in artifacts/ at project root.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iosPath = path.join(root, 'ios');
const backupPath = path.join(root, 'ios.capacitor.backup');

/** Set to true if expo-brownfield build failed, so we skip restore and leave ios/ for inspection. */
let buildFailed = false;

function run(cmd, args, opts = {}) {
  const full = [cmd, ...args].join(' ');
  console.log(`\n> ${full}\n`);
  execSync(full, { stdio: 'inherit', cwd: root, ...opts });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function moveDir(src, dest) {
  if (fs.existsSync(dest)) rmDir(dest);
  fs.renameSync(src, dest);
}

/** Find directory containing Podfile (ios/ or first subdir that has it). */
function findPodfileDir(iosDir) {
  const inIos = path.join(iosDir, 'Podfile');
  if (fs.existsSync(inIos)) return iosDir;
  const subdirs = fs.readdirSync(iosDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const d of subdirs) {
    const candidate = path.join(iosDir, d.name, 'Podfile');
    if (fs.existsSync(candidate)) return path.join(iosDir, d.name);
  }
  return null;
}

/**
 * Quote unquoted path values in pbxproj that contain spaces or hyphens so CocoaPods' Nanaimo parser accepts them.
 * See https://github.com/CocoaPods/Nanaimo/issues/13
 */
function quotePbxprojPaths(iosDir) {
  function findPbxproj(dir, list = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isFile() && e.name.endsWith('.pbxproj')) list.push(full);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'build') findPbxproj(full, list);
    }
    return list;
  }
  const files = findPbxproj(iosDir);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const lineRe = /^(\s*path\s*=\s*)([^";\n]+)(;\s*)$/gm;
    let changed = false;
    content = content.replace(lineRe, (_, prefix, value, suffix) => {
      if (value.includes(' ') || value.includes('-')) {
        changed = true;
        const escaped = value.replace(/"/g, '\\"');
        return `${prefix}"${escaped}"${suffix}`;
      }
      return prefix + value + suffix;
    });
    if (changed) fs.writeFileSync(file, content, 'utf8');
  }
}

// 1. Back up Capacitor ios/
if (!fs.existsSync(iosPath)) {
  console.error('No ios/ folder found. Run "npx cap add ios" first for Capacitor, or run "npx expo prebuild --platform ios" for brownfield-only.');
  process.exit(1);
}

if (fs.existsSync(backupPath)) {
  console.error('Backup already exists at ios.capacitor.backup. Remove it or restore ios/ manually first.');
  process.exit(1);
}

console.log('Backing up ios/ to ios.capacitor.backup...');
moveDir(iosPath, backupPath);

try {
  // 2. Generate ios/ with brownfield target (contains ReactNativeHostManager.swift)
  console.log('Running expo prebuild (ios)...');
  run('npx', ['expo', 'prebuild', '--platform', 'ios', '--no-install']);

  // 2b. Quote path values in pbxproj when project path contains spaces/hyphens (CocoaPods Nanaimo)
  quotePbxprojPaths(iosPath);

  // 3. Create .xcworkspace (expo-brownfield requires it; CocoaPods creates it)
  const podfileDir = findPodfileDir(iosPath);
  if (!podfileDir) {
    throw new Error('No Podfile found under ios/ after prebuild. Cannot create .xcworkspace.');
  }
  console.log('Running pod install in', path.relative(root, podfileDir), '...');
  execSync('pod install', { stdio: 'inherit', cwd: podfileDir });

  // 4. Build brownfield XCFrameworks
  console.log('Running expo-brownfield build:ios...');
  try {
    run('npx', ['expo-brownfield', 'build:ios', '--release']);
  } catch (err) {
    buildFailed = true;
    console.error('\n[Build failed] ios/ left as prebuild output so you can inspect.');
    console.error('To see the real xcodebuild error, run:');
    console.error('  cd ios && xcodebuild -workspace MK.xcworkspace -scheme MaakBrownfield -configuration Release -destination "generic/platform=iOS"');
    console.error('To restore Capacitor ios/ when done:  rm -rf ios && mv ios.capacitor.backup ios\n');
    throw err;
  }
} finally {
  // 5. Restore Capacitor ios/ (skip if build failed so user can run xcodebuild manually)
  if (!buildFailed) {
    console.log('Restoring ios/ from ios.capacitor.backup...');
    rmDir(iosPath);
    moveDir(backupPath, iosPath);
  }
}

console.log('\nDone. Brownfield artifacts are in artifacts/');
