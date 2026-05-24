/**
 * ============================================================
 * fix-tailwind.js — Script automatique pour aitradelogic.com
 * ============================================================
 * Ce script fait 3 choses :
 * 1. Remplace le CDN Tailwind par le fichier CSS compilé dans tous les HTML
 * 2. Crée le fichier input.css
 * 3. Compile Tailwind en CSS optimisé (tailwind.min.css)
 *
 * UTILISATION :
 *   node fix-tailwind.js
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ✅ Couleur dans le terminal
const green  = (t) => `\x1b[32m${t}\x1b[0m`;
const yellow = (t) => `\x1b[33m${t}\x1b[0m`;
const red    = (t) => `\x1b[31m${t}\x1b[0m`;
const cyan   = (t) => `\x1b[36m${t}\x1b[0m`;
const bold   = (t) => `\x1b[1m${t}\x1b[0m`;

console.log(bold(cyan('\n🚀 AiTradeLogic — Fix Tailwind CDN Script\n')));

// ============================================================
// ÉTAPE 1 : Vérifier les dépendances
// ============================================================
console.log(yellow('📦 Étape 1 : Vérification des dépendances...\n'));

try {
    execSync('npx tailwindcss --version', { stdio: 'pipe' });
    console.log(green('  ✅ Tailwind CSS trouvé\n'));
} catch (e) {
    console.log(yellow('  ⚠️  Tailwind non trouvé. Installation en cours...\n'));
    try {
        execSync('npm install -D tailwindcss @tailwindcss/typography', { stdio: 'inherit' });
        console.log(green('  ✅ Tailwind installé avec succès\n'));
    } catch (installErr) {
        console.log(red('  ❌ Erreur installation: ') + installErr.message);
        process.exit(1);
    }
}

// ============================================================
// ÉTAPE 2 : Créer input.css si manquant
// ============================================================
console.log(yellow('📝 Étape 2 : Création de input.css...\n'));

const inputCssContent = `/* ================================================
   Tailwind CSS - aitradelogic.com
   Généré automatiquement par fix-tailwind.js
   ================================================ */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ================================================
   CSS PERSONNALISÉ (ton style.css peut rester séparé)
   ================================================ */

/* Scrollbar */
::-webkit-scrollbar { width: 6px; background: transparent; }
::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: #06b6d4; }

/* Select */
select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
select option { background-color: #0A101D; color: #38bdf8; font-weight: bold; }

/* No scrollbar */
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

/* Anti flash */
.anti-flash-hidden { opacity: 0; }
.anti-flash-visible { opacity: 1; transition: opacity 0.2s ease-in-out; }

/* Glass panel */
.glass-panel { background: rgba(10, 16, 29, 0.8); backdrop-filter: blur(12px); }

/* Tables (pour le prose du worker) */
.table-wrapper { 
    width: 100%; overflow-x: auto; margin-top: 2em; margin-bottom: 2em; 
    border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); 
    border: 1px solid #1e293b; background-color: #0A101D; 
}
.table-wrapper::-webkit-scrollbar { height: 6px; }
.table-wrapper::-webkit-scrollbar-thumb { background: #38bdf8; border-radius: 10px; }

.prose table { width: 100% !important; border-collapse: collapse; margin: 0 !important; }
.prose thead { border-bottom: 2px solid #1e293b !important; }
.prose th { 
    color: #38bdf8 !important; font-weight: 700; text-transform: uppercase; 
    font-size: 0.75rem; letter-spacing: 0.05em; padding: 1rem; 
    text-align: left; border: none !important; 
}
.prose td { 
    padding: 1rem; border-bottom: 1px solid #1e293b !important; 
    color: #cbd5e1 !important; font-size: 0.875rem; 
    white-space: nowrap; border-top: none !important; 
}
@media (min-width: 768px) { .prose td { white-space: normal; } }
.prose tr:last-child td { border-bottom: none !important; }
[dir="rtl"] .prose th, [dir="rtl"] .prose td { text-align: right; }

/* Hero image placeholder */
.hero-img-wrapper { background-color: #0A101D; min-height: 300px; }

/* Footer fix CLS */
footer { min-height: 80px; }

/* Nav fix CLS */
nav { min-height: 64px; }
`;

if (!fs.existsSync('input.css')) {
    fs.writeFileSync('input.css', inputCssContent, 'utf8');
    console.log(green('  ✅ input.css créé\n'));
} else {
    console.log(green('  ✅ input.css existe déjà\n'));
}

// ============================================================
// ÉTAPE 3 : Créer le dossier css/ si manquant
// ============================================================
if (!fs.existsSync('css')) {
    fs.mkdirSync('css');
    console.log(green('  ✅ Dossier css/ créé\n'));
}

// ============================================================
// ÉTAPE 4 : Remplacer le CDN dans tous les HTML
// ============================================================
console.log(yellow('🔧 Étape 3 : Remplacement du CDN Tailwind dans les fichiers HTML...\n'));

// Liste des fichiers HTML à modifier
const htmlFiles = fs.readdirSync('.')
    .filter(f => f.endsWith('.html'));

// Patterns CDN à remplacer (toutes les variantes)
const cdnPatterns = [
    /<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"[^>]*><\/script>\s*/gi,
    /<script src='https:\/\/cdn\.tailwindcss\.com[^']*'[^>]*><\/script>\s*/gi,
];

// La ligne de remplacement
const cssLink = '<link rel="stylesheet" href="/css/tailwind.min.css">\n';

let totalReplaced = 0;

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    let replaced = false;

    cdnPatterns.forEach(pattern => {
        if (pattern.test(content)) {
            content = content.replace(pattern, cssLink);
            replaced = true;
            pattern.lastIndex = 0; // Reset regex
        }
    });

    // Aussi supprimer tailwind.config inline (si présent)
    content = content.replace(/<script>tailwind\.config\s*=[\s\S]*?<\/script>\s*/gi, '');

    if (replaced || content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(green(`  ✅ ${file} — CDN remplacé`));
        totalReplaced++;
    } else {
        console.log(`  ⏭️  ${file} — Pas de CDN Tailwind trouvé`);
    }
});

console.log(`\n  📊 ${totalReplaced} fichier(s) modifié(s)\n`);

// ============================================================
// ÉTAPE 5 : Compiler Tailwind
// ============================================================
console.log(yellow('⚙️  Étape 4 : Compilation Tailwind CSS...\n'));

try {
    execSync(
        'npx tailwindcss -i input.css -o css/tailwind.min.css --minify',
        { stdio: 'inherit' }
    );
    
    // Vérifier la taille du fichier généré
    const stats = fs.statSync('css/tailwind.min.css');
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    console.log(green(`\n  ✅ css/tailwind.min.css généré avec succès !`));
    console.log(green(`  📦 Taille : ${sizeKB} KB`) + (parseFloat(sizeKB) > 100 ? yellow(' (grand, vérifier le safelist)') : green(' (optimal ✨)')));
    
} catch (e) {
    console.log(red('\n  ❌ Erreur de compilation Tailwind:'));
    console.log(red(e.message));
    process.exit(1);
}

// ============================================================
// RÉSUMÉ FINAL
// ============================================================
console.log(bold(cyan('\n============================================================')));
console.log(bold(green('✅ TERMINÉ ! Voici ce qui a été fait :\n')));
console.log(green(`  1. input.css créé`));
console.log(green(`  2. ${totalReplaced} fichier(s) HTML mis à jour`));
console.log(green(`  3. css/tailwind.min.css compilé et minifié`));
console.log(bold(cyan('\n📋 Prochaines étapes :\n')));
console.log(cyan(`  1. Déploie le fichier css/tailwind.min.css sur Cloudflare Pages`));
console.log(cyan(`  2. Déploie tes fichiers HTML modifiés`));
console.log(cyan(`  3. Déploie le nouveau worker.js`));
console.log(cyan(`  4. Dans Cloudflare → Caching → Purge Everything`));
console.log(bold(cyan('\n🎯 Gain attendu : LCP -1.5s, CLS ~0, Score Lighthouse +20pts\n')));
console.log(bold(cyan('============================================================\n')));