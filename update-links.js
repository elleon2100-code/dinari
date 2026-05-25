const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'src') continue;
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk('.');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Navbar desktop
  const navMatch = content.match(/<li>\s*<a href="([^"]*?)(?:guias|como-salir-de-deudas)\/?(index\.html)?" class="navbar__link"(?:[^>]*)>Guías<\/a>\s*<\/li>/);
  if (navMatch) {
    const prefix = navMatch[1];
    const newNav = `${navMatch[0]}\n        <li><a href="${prefix}sobre-dinari/index.html" class="navbar__link">Sobre Dinari</a></li>`;
    if (!content.includes(`href="${prefix}sobre-dinari/index.html" class="navbar__link"`)) {
      content = content.replace(navMatch[0], newNav);
      changed = true;
    }
  }

  // 2. Mobile menu
  const mobMatch = content.match(/<a href="([^"]*?)(?:guias|como-salir-de-deudas)\/?(index\.html)?" class="mobile-menu__link"(?:[^>]*)>Guías<\/a>/);
  if (mobMatch) {
    const prefix = mobMatch[1];
    const newMob = `${mobMatch[0]}\n  <a href="${prefix}sobre-dinari/index.html" class="mobile-menu__link">Sobre Dinari</a>`;
    if (!content.includes(`href="${prefix}sobre-dinari/index.html" class="mobile-menu__link"`)) {
      content = content.replace(mobMatch[0], newMob);
      changed = true;
    }
  }

  // 3. Footer
  const footerMatch = content.match(/<div>\s*<p class="footer__heading">Legal<\/p>/);
  const privMatch = content.match(/href="([^"]*?)privacidad\/?(index\.html)?" class="footer__link"/);
  
  if (footerMatch && privMatch) {
    const prefix = privMatch[1];
    if (!content.includes('<p class="footer__heading">Dinari</p>')) {
      const newFooter = `<div>\n        <p class="footer__heading">Dinari</p>\n        <ul class="footer__links">\n          <li><a href="${prefix}sobre-dinari/index.html" class="footer__link">Sobre Dinari</a></li>\n          <li><a href="${prefix}guias/index.html" class="footer__link">Guías Financieras</a></li>\n        </ul>\n      </div>\n      ${footerMatch[0]}`;
      content = content.replace(footerMatch[0], newFooter);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
