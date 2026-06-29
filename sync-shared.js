const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'shared');
const destVscode = path.resolve(__dirname, 'vscode-extension', 'src', 'shared');
const destBrowser = path.resolve(__dirname, 'browser-extension', 'shared');

const targets = [
  { name: 'VS Code Extension', path: destVscode },
  { name: 'Browser Extension', path: destBrowser }
];

const isCI = process.env.CI || process.argv.includes('--copy');

// Recursive copy helper
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean target directory/file/symlink
function cleanTarget(targetPath) {
  if (fs.existsSync(targetPath) || fs.lstatSync(targetPath).isSymbolicLink()) {
    const stat = fs.lstatSync(targetPath);
    if (stat.isSymbolicLink() || stat.isFile()) {
      fs.unlinkSync(targetPath);
    } else if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  }
}

console.log(`[Sync Shared] Initiating sync. Mode: ${isCI ? 'CI/Copy' : 'Local/Symlink'}`);

targets.forEach((target) => {
  try {
    // Ensure parent folder exists
    const parentDir = path.dirname(target.path);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Clean existing target
    try {
      cleanTarget(target.path);
    } catch (e) {
      // Ignore if not exists
    }

    if (isCI) {
      // CI Mode: Copy files recursively
      copyDirSync(srcDir, target.path);
      console.log(`[Sync Shared] Copied shared directory to ${target.name}`);
    } else {
      // Local Mode: Create junction/symlink
      const type = process.platform === 'win32' ? 'junction' : 'dir';
      fs.symlinkSync(srcDir, target.path, type);
      console.log(`[Sync Shared] Linked shared directory to ${target.name} using ${type}`);
    }
  } catch (err) {
    console.error(`[Sync Shared Error] Failed to sync ${target.name}:`, err.message);
    
    // Fallback to copy if symlink failed
    if (!isCI) {
      console.log(`[Sync Shared] Falling back to copying files for ${target.name}...`);
      try {
        cleanTarget(target.path);
        copyDirSync(srcDir, target.path);
        console.log(`[Sync Shared] Successfully copied shared files as fallback to ${target.name}`);
      } catch (copyErr) {
        console.error(`[Sync Shared Error] Fallback copy also failed:`, copyErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
});

console.log('[Sync Shared] Completed successfully.');
