#!/usr/bin/env python3
"""Simulateur : le vrai code serveur tourne dans la page parente, sur un classeur en mémoire."""
import pathlib
SRC = pathlib.Path(__file__).resolve().parents[2] / "src"
ICI = pathlib.Path(__file__).parent
(ICI / 'gs').mkdir(exist_ok=True)
noms = sorted(p.stem for p in SRC.glob('*.gs'))
for n in noms:
    (ICI / 'gs' / (n + '.js')).write_text((SRC / (n + '.gs')).read_text(encoding='utf-8'), encoding='utf-8')

PONT = """<script>
window.JETON_INITIAL = parent.jetonPour ? parent.jetonPour(new URLSearchParams(location.search).get('u')) : '';
const google = { script: { run: (function () {
  function chaine(ok, ko) { return new Proxy({}, { get: function (_, n) {
    if (n === 'withSuccessHandler') return function (f) { return chaine(f, ko); };
    if (n === 'withFailureHandler') return function (f) { return chaine(ok, f); };
    return function () { const a = [].slice.call(arguments);
      setTimeout(function () {
        let r;
        try { r = parent.SIM(n, a); } catch (e) { if (ko) ko({ message: e.message }); else console.error(e); return; }
        if (ok) ok(r);
      }, 40); };
  } }); }
  return chaine(null, null); })() } };
</script>"""

idx = (SRC / 'Index.html').read_text(encoding='utf-8')
sty = (SRC / 'Styles.html').read_text(encoding='utf-8')
js = (SRC / 'JavaScript.html').read_text(encoding='utf-8')
logo = (SRC / 'Logo.html').read_text(encoding='utf-8')
page = (idx.replace("<?!= lienIcone() ?>", "")
           .replace("<?!= include('Styles'); ?>", sty)
           .replace("<?!= include('Logo'); ?>", logo)
           .replace("<?!= include('JavaScript'); ?>", js)
           .replace("<?!= jetonInitial ?>", PONT)
           .replace("<?= nomClub() ?>", "Arc Club Luchonnais")
           .replace("<?= saisonAffichee() ?>", "2026-2027"))
assert '<?' not in page, page[page.index('<?'):page.index('<?') + 80]
page = page.replace('<head>', '<head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', 1)
(ICI / 'app.html').write_text(page, encoding='utf-8')

scripts = '\n'.join('<script src="gs/%s.js"></script>' % n for n in noms)
serveur = """<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;background:#fff}iframe{border:0;width:100vw;height:100vh;display:block}</style>
<script src="faux-google.js"></script>
%s
<script src="donnees-demo.js"></script>
<script>
// Chaque appel est une exécution Apps Script : la mémoire d'exécution repart de zéro.
window.SIM = function (nom, args) {
  _tables = {}; _feuilles = {}; _paramsCache = null; _versions = null;
  if (typeof window[nom] !== 'function') throw new Error('Fonction serveur inconnue : ' + nom);
  const r = window[nom].apply(null, JSON.parse(JSON.stringify(args)));
  return r === undefined ? r : JSON.parse(JSON.stringify(r));
};
window.jetonPour = function (id) {
  _tables = {}; _feuilles = {}; _paramsCache = null; _versions = null;
  return id ? creerJeton_(id) : '';
};
</script></head><body>
<iframe id="app"></iframe>
<script>document.getElementById('app').src = 'app.html' + location.search;</script>
</body></html>""" % scripts
(ICI / 'serveur.html').write_text(serveur, encoding='utf-8')
print('simulateur prêt :', len(noms), 'fichiers serveur')
