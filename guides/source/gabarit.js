/* Mise en page commune des deux guides : HTML imprimé en PDF par Chrome. */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'src', 'Logo.html');
const LOGO = (fs.readFileSync(SRC, 'utf8').match(/LOGO_COMPLET = '([^']+)'/) || [])[1];

function image(nom) {
  const f = path.join(__dirname, 'captures', nom + '.png');
  return 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
}

function telephone(nom, legende) {
  return '<figure class="tel"><div class="cadre"><img src="' + image(nom) + '"></div>' +
    (legende ? '<figcaption>' + legende + '</figcaption>' : '') + '</figure>';
}

function bloc(b) {
  const visuels = (b.images || []).map(function (i) { return telephone(i[0], i[1]); }).join('');
  const texte = (b.titre ? '<h3>' + b.titre + '</h3>' : '') + (b.html || '');
  if (!visuels) return '<div class="bloc plein">' + texte + '</div>';
  return '<div class="bloc' + (b.images.length > 1 ? ' double' : '') + '">' +
    '<div class="visuels">' + visuels + '</div><div class="texte">' + texte + '</div></div>';
}

function page(g) {
  const sommaire = g.sections.map(function (s, i) {
    return '<li><span class="num">' + (i + 1) + '</span><span>' + s.titre + '</span>' +
      (s.resume ? '<em>' + s.resume + '</em>' : '') + '</li>';
  }).join('');
  const corps = g.sections.map(function (s, i) {
    return '<section' + (s.nouvellePage === false ? '' : ' class="saut"') + '>' +
      '<div class="entete-section"><span class="num">' + (i + 1) + '</span><h2>' + s.titre + '</h2></div>' +
      (i === 0 ? '<div class="lecture">' + g.lecture + '</div>' : '') +
      (s.intro ? '<p class="intro">' + s.intro + '</p>' : '') +
      (s.blocs || []).map(bloc).join('') + '</section>';
  }).join('');

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${g.titre}</title>
<style>
  @page { size: A4; margin: 16mm 15mm 17mm; }
  :root { --vert: #15594a; --vert-fort: #0f4438; --vert-clair: #e3eee9; --or: #c1912f; --encre: #16211c;
    --doux: #5f6f68; --trait: #e2dfd6; --fond: #f4f3ef; --${g.accent || 'accent'}: 1; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: var(--encre); font: 10.4pt/1.5 "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif; }
  h1, h2, h3 { margin: 0; letter-spacing: -.01em; }
  p { margin: 0 0 7pt; }
  ul, ol { margin: 0 0 7pt; padding-left: 15pt; }
  li { margin-bottom: 3pt; }
  strong { font-weight: 650; }
  code, .k { font-family: "SF Mono", Menlo, monospace; font-size: 9pt; background: var(--vert-clair);
    color: var(--vert-fort); padding: .5pt 3pt; border-radius: 3pt; }
  .bouton { display: inline-block; font-size: 9pt; font-weight: 650; padding: 0 5pt; border-radius: 4pt;
    background: var(--vert); color: #fff; white-space: nowrap; line-height: 1.55; }
  .bouton.clair { background: var(--vert-clair); color: var(--vert-fort); }

  /* Couverture */
  .couverture { height: 262mm; display: flex; flex-direction: column; justify-content: space-between;
    padding: 6mm 4mm 2mm; page-break-after: always; }
  .couverture .logo { width: 72mm; }
  .couverture .bande { height: 3mm; width: 34mm; background: var(--or); border-radius: 2mm; margin: 0 0 9mm; }
  .couverture .sur { font-size: 11pt; text-transform: uppercase; letter-spacing: .14em; color: var(--vert); font-weight: 650; }
  .couverture h1 { font-size: 40pt; line-height: 1.05; color: var(--vert-fort); margin: 3mm 0 6mm; }
  .couverture .accroche { font-size: 13.5pt; color: var(--doux); max-width: 135mm; line-height: 1.45; }
  .couverture .pied { display: flex; justify-content: space-between; align-items: flex-end;
    border-top: 1px solid var(--trait); padding-top: 5mm; font-size: 9.5pt; color: var(--doux); }
  .couverture .apercus { display: flex; gap: 6mm; margin: 4mm 0; }
  .couverture .apercus .tel { width: 46mm; }

  /* Sommaire */
  .sommaire h2 { font-size: 20pt; color: var(--vert-fort); margin-bottom: 6mm; }
  .sommaire ol { list-style: none; padding: 0; margin: 0; }
  .sommaire li { display: grid; grid-template-columns: 11mm 1fr; column-gap: 2mm; padding: 1.7mm 0;
    border-bottom: 1px solid var(--trait); font-size: 11pt; font-weight: 600; line-height: 1.3; }
  .sommaire li em { grid-column: 2; font-style: normal; font-weight: 400; color: var(--doux); font-size: 9.5pt; }
  .sommaire .num, .entete-section .num { display: inline-flex; align-items: center; justify-content: center;
    width: 7.5mm; height: 7.5mm; border-radius: 50%; background: var(--vert); color: #fff; font-size: 10pt; font-weight: 700; }
  .lecture { margin: 0 0 6mm; background: var(--fond); border-radius: 4mm; padding: 5mm 6mm; font-size: 10pt; }
  .lecture h3 { color: var(--vert); font-size: 11pt; margin-bottom: 2mm; }

  /* Sections */
  section.saut { page-break-before: always; }
  .entete-section { display: flex; align-items: center; gap: 3mm; margin-bottom: 4mm;
    padding-bottom: 3mm; border-bottom: 2.2pt solid var(--vert); }
  .entete-section h2 { font-size: 18pt; color: var(--vert-fort); }
  .intro { font-size: 11pt; color: #33423b; margin-bottom: 5mm; }
  .bloc { display: grid; grid-template-columns: 48mm 1fr; gap: 7mm; margin: 0 0 6mm; break-inside: avoid; }
  .bloc.double { grid-template-columns: 1fr; }
  .bloc.double .visuels { display: flex; gap: 6mm; justify-content: flex-start; }
  .bloc.double .visuels .tel { width: 48mm; }
  .bloc.plein { display: block; }
  .bloc h3 { font-size: 12.5pt; color: var(--vert); margin-bottom: 2.5mm; }
  .texte ol li::marker { color: var(--vert); font-weight: 700; }

  /* Téléphone */
  .tel { margin: 0; }
  .tel .cadre { background: #1b2420; border-radius: 6.5mm; padding: 1.6mm; box-shadow: 0 1.2mm 3.5mm rgba(16,32,27,.18); }
  .tel img { display: block; width: 100%; border-radius: 5.2mm; }
  .tel figcaption { font-size: 8.5pt; color: var(--doux); text-align: center; margin-top: 2mm; line-height: 1.35; }

  /* Encadrés */
  .astuce, .attention { border-radius: 3mm; padding: 3mm 4mm; margin: 3mm 0 0; font-size: 9.6pt; break-inside: avoid; }
  .astuce { background: var(--vert-clair); border-left: 1.2mm solid var(--vert); }
  .attention { background: #fbf1e0; border-left: 1.2mm solid #c1912f; }
  .astuce strong:first-child, .attention strong:first-child { display: block; margin-bottom: .8mm; }
  table { width: 100%; border-collapse: collapse; font-size: 9.6pt; margin: 2mm 0 4mm; break-inside: avoid; }
  th, td { text-align: left; padding: 2mm 2.4mm; border-bottom: 1px solid var(--trait); vertical-align: top; }
  th { background: var(--vert); color: #fff; font-weight: 650; }
  td.c, th.c { text-align: center; }
  tr:nth-child(even) td { background: #faf9f6; }
  .oui { color: var(--vert); font-weight: 700; }
  .non { color: #b8b3a6; }
  .faq h3 { font-size: 11pt; color: var(--encre); margin: 4mm 0 1.2mm; }
  .faq p { color: #33423b; }
</style></head><body>
<div class="couverture">
  <div>
    <img class="logo" src="${LOGO}">
  </div>
  <div>
    <div class="bande"></div>
    <div class="sur">${g.sur}</div>
    <h1>${g.titre}</h1>
    <p class="accroche">${g.accroche}</p>
    <div class="apercus">${g.apercus.map(function (a) { return telephone(a); }).join('')}</div>
  </div>
  <div class="pied"><span>Arc Club Luchonnais · Espace archers · saison 2026-2027</span><span>${g.version}</span></div>
</div>
<div class="sommaire"><h2>Sommaire</h2><ol>${sommaire}</ol></div>
${corps}
</body></html>`;
}

module.exports = { page: page };
