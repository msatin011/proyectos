const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../../../pwa/service-worker-app.js');
const indexPath = path.join(__dirname, '../../../pwa/index.html');

function bumpVersion() {
    // 1. Update Service Worker
    if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf8');
        // Match 'proyectos-pwa-vXX'
        const regex = /const CACHE_NAME = 'proyectos-pwa-v(\d+)';/;
        const match = content.match(regex);

        if (match) {
            const currentVersion = parseInt(match[1]);
            const newVersion = currentVersion + 1;
            const newContent = content.replace(regex, `const CACHE_NAME = 'proyectos-pwa-v${newVersion}';`);
            fs.writeFileSync(swPath, newContent);
            console.log(`✅ Bumped Service Worker cache to v${newVersion}`);

            // 2. Update Index.html (app.js?v=XX) to force reload of logic
            updateIndexHtml(newVersion);
        } else {
            console.error('❌ Could not find CACHE_NAME pattern in service-worker-app.js');
        }
    } else {
        console.error('❌ service-worker-app.js not found at:', swPath);
    }
}

function updateIndexHtml(version) {
    if (fs.existsSync(indexPath)) {
        let content = fs.readFileSync(indexPath, 'utf8');
        // Match src="app.js?v=XX" or src="app.js"
        // We want to replace it with src="app.js?v=NEW_VERSION"
        const regex = /src="app\.js(\?v=\d+)?"/;

        if (regex.test(content)) {
            const newContent = content.replace(regex, `src="app.js?v=${version}"`);
            fs.writeFileSync(indexPath, newContent);
            console.log(`✅ Updated index.html app.js reference to v${version}`);
        } else {
            console.warn('⚠️ Could not find app.js script tag in index.html to update version.');
        }
    }
}

bumpVersion();
