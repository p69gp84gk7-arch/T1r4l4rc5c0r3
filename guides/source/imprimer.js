/* Imprime les deux guides en PDF : node imprimer.js */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const gabarit = require('./gabarit.js');

const GUIDES = [
  { fichier: 'guide-archer', contenu: require('./contenu-archer.js') },
  { fichier: 'guide-dirigeants', contenu: require('./contenu-dirigeants.js') },
];
// Les PDF vont dans guides/ (publié avec la page d'accueil) ; le HTML
// intermédiaire reste ici, dans apercu/.
const SORTIE = path.join(__dirname, '..');
const APERCU = path.join(__dirname, 'apercu');
fs.mkdirSync(APERCU, { recursive: true });

(async function () {
  const nav = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true,
  });
  for (const g of GUIDES) {
    const html = gabarit.page(g.contenu);
    const fichierHtml = path.join(APERCU, g.fichier + '.html');
    fs.writeFileSync(fichierHtml, html);
    const page = await nav.newPage();
    await page.goto('file://' + fichierHtml, { waitUntil: 'load' });
    await page.pdf({
      path: path.join(SORTIE, g.fichier + '.pdf'),
      format: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;font:7.5pt -apple-system,Helvetica,Arial;color:#8a958f;' +
        'display:flex;justify-content:space-between;padding:0 15mm">' +
        '<span>Arc Club Luchonnais · ' + g.contenu.titre + '</span>' +
        '<span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    });
    await page.close();
    console.log('✓ ' + g.fichier + '.pdf');
  }
  await nav.close();
})();
