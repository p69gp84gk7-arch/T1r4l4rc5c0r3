/* Prend les captures d'écran du guide : node capturer.js [filtre] */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCENES = require('./scenes.js');
const SORTIE = path.join(__dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const filtre = process.argv[2] ? new RegExp(process.argv[2]) : null;

(async function () {
  const navigateur = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--hide-scrollbars', '--font-render-hinting=none'],
  });
  for (const s of SCENES) {
    if (filtre && !filtre.test(s.nom)) continue;
    const contexte = await navigateur.createBrowserContext();
    const page = await contexte.newPage();
    await page.setViewport({ width: 390, height: s.hauteur || 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    const erreurs = [];
    page.on('pageerror', function (e) { erreurs.push(e.message); });
    let cadre = null;
    for (let essai = 0; essai < 3; essai++) {
      await page.goto('http://localhost:8790/serveur.html' + (s.u ? '?u=' + s.u : ''), { waitUntil: 'load' });
      await new Promise(function (r) { setTimeout(r, 1800); });
      cadre = page.frames().find(function (f) { return /app\.html/.test(f.url()); });
      // Un fichier mal chargé laisse l'écran de connexion : on recommence.
      const pret = await cadre.evaluate(function () { return document.getElementById('app').style.display !== 'none'; });
      if (pret || !s.u) break;
      erreurs.length = 0;
    }
    await cadre.addStyleTag({ content: '::-webkit-scrollbar{display:none} *{scrollbar-width:none}' + (s.garderBulle ? '' : ' #message{display:none !important}') });
    const code = 'const pause = ms => new Promise(r => setTimeout(r, ms));\n' +
      (s.garderModale ? '' : 'if (typeof fermerModale === "function") fermerModale(); await pause(350);\n') +
      (s.actions || '') +
      (s.defiler ? '\nconst cible = document.querySelector(' + JSON.stringify(s.defiler) + ');' +
        'if (cible) { const y = cible.getBoundingClientRect().top + window.scrollY - (' + (s.decalage || 90) + '); window.scrollTo(0, Math.max(0, y)); }' : '') +
      '\nawait pause(' + (s.attente || 700) + ');';
    try {
      await cadre.evaluate(function (c) { return eval('(async () => {' + c + '\n})()'); }, code);
    } catch (e) {
      erreurs.push('scène : ' + e.message);
    }
    await page.screenshot({ path: path.join(SORTIE, s.nom + '.png') });
    console.log((erreurs.length ? '⚠ ' : '✓ ') + s.nom + (erreurs.length ? '  ' + erreurs.join(' | ') : ''));
    await contexte.close();
  }
  await navigateur.close();
})();
