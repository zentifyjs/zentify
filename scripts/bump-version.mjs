import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('🚀 Memulai proses update versi (Bump Version)...\n');
  const packages = await fs.readdir(packagesDir, { withFileTypes: true });
  
  for (const pkg of packages) {
    if (!pkg.isDirectory()) continue;
    
    const pkgJsonPath = path.join(packagesDir, pkg.name, 'package.json');
    try {
      const content = await fs.readFile(pkgJsonPath, 'utf-8');
      const pkgJson = JSON.parse(content);
      const currentVersion = pkgJson.version;
      
      if (!currentVersion) continue;

      console.log(`📦 Package: \x1b[36m${pkgJson.name}\x1b[0m (Saat ini: \x1b[33m${currentVersion}\x1b[0m)`);
      
      let nextRc = '';
      let nextStable = '';
      
      // Cek apakah versi saat ini memiliki format RC (-rc-X)
      const rcMatch = currentVersion.match(/^(\d+\.\d+\.\d+)-rc-(\d+)$/);
      // Cek apakah format RC alternatif (-rc.X)
      const rcDotMatch = currentVersion.match(/^(\d+\.\d+\.\d+)-rc\.(\d+)$/);
      
      if (rcMatch) {
        const base = rcMatch[1];
        const rcNum = parseInt(rcMatch[2], 10);
        nextRc = `${base}-rc-${rcNum + 1}`;
        nextStable = base;
      } else if (rcDotMatch) {
        const base = rcDotMatch[1];
        const rcNum = parseInt(rcDotMatch[2], 10);
        nextRc = `${base}-rc.${rcNum + 1}`;
        nextStable = base;
      } else {
        // Jika stable, maka patch-nya naik
        const parts = currentVersion.split('.');
        if (parts.length === 3) {
          const patch = parseInt(parts[2], 10);
          nextRc = `${parts[0]}.${parts[1]}.${patch + 1}-rc-1`;
          nextStable = `${parts[0]}.${parts[1]}.${patch + 1}`;
        }
      }
      
      console.log(`  1) Lanjutkan RC (\x1b[32m${nextRc}\x1b[0m)`);
      console.log(`  2) Rilis Stable (\x1b[32m${nextStable}\x1b[0m)`);
      console.log(`  3) Lewati (Skip)`);
      
      const answer = await rl.question('  Pilih (1/2/3): ');
      
      let newVersion = currentVersion;
      if (answer === '1') newVersion = nextRc;
      else if (answer === '2') newVersion = nextStable;
      
      if (newVersion !== currentVersion) {
        pkgJson.version = newVersion;
        // Pertahankan indentasi 2 spasi dan baris baru di akhir
        await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
        console.log(`  ✅ Berhasil diupdate ke \x1b[32m${newVersion}\x1b[0m\n`);
      } else {
        console.log(`  ⏭️ Dilewati\n`);
      }
      
    } catch (e) {
      // Abaikan jika package.json tidak ada atau tidak valid
    }
  }
  
  rl.close();
  console.log('🎉 Selesai!');
}

main();
