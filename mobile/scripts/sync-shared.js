// Copies the recipe reader and recipe prompt from the web app so both apps behave the same.
// Run after changing web/js/parser.js or web/js/content.js:  npm run sync-shared
const fs = require('fs');
const path = require('path');

const from = path.join(__dirname, '..', '..', 'web', 'js');
const to = path.join(__dirname, '..', 'src', 'shared');
fs.mkdirSync(to, { recursive: true });

for (const file of ['parser.js', 'content.js']) {
  const source = fs.readFileSync(path.join(from, file), 'utf8');
  const header = `// AUTO-COPIED from web/js/${file} by scripts/sync-shared.js. Edit the web file, then run: npm run sync-shared\n`;
  fs.writeFileSync(path.join(to, file), header + source);
  console.log(`synced ${file}`);
}
