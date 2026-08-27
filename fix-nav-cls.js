/**
 * fix-nav-cls.js — Fix CLS navbar min-height
 * Ajoute style="min-height:64px" à toutes les <nav> dans les HTML
 */

const fs = require('fs');

const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));

let totalFixed = 0;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Ajouter min-height:64px à la nav si pas déjà présent
    if (content.includes('<nav style="min-height:64px" class="flex items-center justify-between') && 
        !content.includes('min-height:64px')) {
        content = content.replace(
            '<nav style="min-height:64px" class="flex items-center justify-between',
            '<nav style="min-height:64px" class="flex items-center justify-between'
        );
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ ${file} — fixed`);
        totalFixed++;
    } else {
        console.log(`⏭️  ${file} — skipped`);
    }
});

console.log(`\n✅ Done! ${totalFixed} file(s) fixed`);
console.log(`\nNext steps:`);
console.log(`  git add *.html`);
console.log(`  git commit -m "fix: CLS navbar min-height"`);
console.log(`  git push`);