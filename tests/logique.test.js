/**
 * Tests de la logique métier, hors Google Apps Script.
 * Lancer depuis la racine du projet :  node tests/logique.test.js src
 */
const fs = require('fs');
const vm = require('vm');
const dir = process.argv[2];
const ctx = { console };
vm.createContext(ctx);
['Config.gs', 'Data.gs', 'Auth.gs', 'Cible.gs', 'Scores.gs', 'Statistiques.gs', 'Calendrier.gs'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(dir + '/' + f, 'utf8'), ctx, { filename: f });
});
// Stubs minimaux des services Apps Script utilisés par les fonctions testées.
vm.runInContext(`
  var _params = { 'Saison en cours': '2026-2027' };
  params_ = function () { return _params; };
  ss_ = function () { return { getSpreadsheetTimeZone: function () { return 'Europe/Paris'; } }; };
  Utilities = { formatDate: function (d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  } };
`, ctx);

// Les `const` de haut niveau ne sont pas exposés sur le contexte : on les évalue.
function constante(nom) { return vm.runInContext(nom, ctx); }

let ko = 0;
function verifie(titre, obtenu, attendu) {
  const a = JSON.stringify(obtenu), b = JSON.stringify(attendu);
  const ok = a === b;
  if (!ok) ko++;
  console.log((ok ? '  ok   ' : '  ÉCHEC') + '  ' + titre + (ok ? '' : '\n         obtenu ' + a + '\n         attendu ' + b));
}

const f = ctx.normaliserFleches_(['10', '9', 'M', 'X', '', 7]);
verifie('normalisation des flèches (M=0, X=10)', f, [10, 9, 0, 10, 7]);
verifie('score total', f.reduce((t, v) => t + v, 0), 36);

const z = ctx.compterZones_(f);
verifie('comptage zone 10', z[10], 2);
verifie('comptage manquées', z[0], 1);

verifie('détail par volées de 3', ctx.detailFleches_([10, 9, 8, 7, 0, 6], 3), '10-9-8 | 7-M-6');

const syn = ctx.synthetiserZones_(ctx.compterZones_([10, 10, 9, 8, 7, 5, 3, 1, 0, 0]));
verifie('total flèches', syn.total, 10);
verifie('points cumulés', syn.points, 53);
verifie('moyenne par flèche', syn.moyenne, 5.3);
const jaune = syn.parCouronne.find(c => c.code === 'jaune');
verifie('couronne jaune (9-10)', [jaune.nombre, jaune.pourcentage], [3, 30]);
const manque = syn.parCouronne.find(c => c.code === 'manque');
verifie('flèches manquées', manque.nombre, 2);
verifie('histogramme ordonné 10 → M', syn.parZone.map(x => x.zone).join(','), '10,9,8,7,6,5,4,3,2,1,M');

verifie('catégorie U18 (né en 2012, saison 2026-2027)', ctx.categoriePour_('2012-05-04'), 'U18');
verifie('catégorie S1 (né en 1995)', ctx.categoriePour_('1995-01-20'), 'S1');
verifie('catégorie S3 (né en 1970)', ctx.categoriePour_('1970-11-02'), 'S3');
verifie('date française acceptée', ctx.isoDate_(ctx.parseDate_('04/05/2012')), '2012-05-04');
verifie('saison déduite de l’année de fin', ctx.anneeReference_('2026-2027'), 2027);

verifie('identifiant NOMPrénom', ctx.identifiantPour_('Fontaine', 'Camille'), 'FONTAINECamille');
verifie('identifiant sans accent ni espace', ctx.identifiantPour_('Le Goff', 'Jean-Éric'), 'LEGOFFJeaneric');
verifie('identifiants comparés sans casse ni espace',
  ctx.normaliserIdentifiant_('le goff jean eric'), ctx.normaliserIdentifiant_('LEGOFFJeaneric'));

verifie('volées proposées', constante('VOLEES'), [6, 10]);
verifie('flèches par volée', constante('FLECHES_PAR_VOLEE'), [3, 6]);
verifie('distances du club (débutants 10 et 15 m, pas de 20 m)', constante('DISTANCES'), [10, 15, 18, 30, 50]);
verifie('blason à 18 m', constante('BLASON_PAR_DISTANCE')[18], '40 cm');
verifie('blason à 30 m', constante('BLASON_PAR_DISTANCE')[30], '80 cm');
verifie('mot de passe par défaut', constante('MOT_DE_PASSE_DEFAUT'), '1234');

// --- Géométrie du blason ---
verifie('rayon du blason 40 cm', ctx.rayonBlason_('40 cm'), 20);
verifie('10 au centre', ctx.valeurPourRayon_(0, '40 cm'), 10);
verifie('limite du 10 (2 cm)', ctx.valeurPourRayon_(2, '40 cm'), 10);
// Règle du cordon : la flèche touche le trait (rayon du tube ≈ 2,75 mm) ▸ zone du dessus.
verifie('cordon du 10 (2,1 cm)', ctx.valeurPourRayon_(2.1, '40 cm'), 10);
verifie('franchement dans le 9', ctx.valeurPourRayon_(2.5, '40 cm'), 9);
verifie('bord du blason', ctx.valeurPourRayon_(20, '40 cm'), 1);
verifie('hors blason', ctx.valeurPourRayon_(20.4, '40 cm'), 0);
verifie('même position, blason 80 cm', ctx.valeurPourRayon_(2.1, '80 cm'), 10);

// --- Blasons de compétition ---
verifie('rayon du blason 122 cm', ctx.rayonBlason_('122 cm'), 61);
verifie('blason réduit : hors zone 6 ▸ manquée', ctx.valeurPourRayon_(12, '40 cm réduit (6-10)'), 0);
verifie('blason réduit : zone 6 comptée', ctx.valeurPourRayon_(9.5, '40 cm réduit (6-10)'), 6);
verifie('trispot : 10 sur la mouche du haut',
  ctx.valeurPourPoint_(0, -20, 'Trispot 40 cm vertical'), 10);
verifie('trispot : 8 à 5 cm de la mouche du bas',
  ctx.valeurPourPoint_(0, 15, 'Trispot 40 cm vertical'), 8);
verifie('trispot : entre les mouches ▸ manquée',
  ctx.valeurPourPoint_(9, 10, 'Trispot 40 cm vertical'), 0);

const g = ctx.groupement_([{ x: 0, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 4 }]);
verifie('centre du groupe', [g.centreX, g.centreY], [1, 1.3]);
verifie('diamètre du groupe', g.diametre, 5);
verifie('trois impacts mesurés', g.nombre, 3);

verifie('impacts relus depuis le Sheet',
  ctx.lireImpacts_('1.5:-2,0:0'), [{ x: 1.5, y: -2 }, { x: 0, y: 0 }]);
verifie('impacts réécrits', ctx.ecrireImpacts_([{ x: 1.53, y: -2 }, null]), '1.5:-2,');

// --- Aire couverte par une volée ---
verifie('aire d’un carré de 4 cm de côté',
  ctx.aireGroupe_([{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}]), 16);
verifie('aire d’un triangle', ctx.aireGroupe_([{x:0,y:0},{x:6,y:0},{x:0,y:4}]), 12);
verifie('point intérieur ignoré par l’enveloppe',
  ctx.aireGroupe_([{x:0,y:0},{x:6,y:0},{x:0,y:4},{x:1,y:1}]), 12);
verifie('deux flèches ne délimitent aucune aire',
  ctx.aireGroupe_([{x:0,y:0},{x:3,y:3}]), 0);
verifie('aire du disque de groupement', ctx.aireDisque_(4), 12.6);

// --- Périmètre : la ficelle qu'on passerait autour des flèches ---
verifie('périmètre d’un carré de 4 cm',
  ctx.perimetreGroupe_([{x:0,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}]), 16);
verifie('périmètre d’un triangle 3-4-5',
  ctx.perimetreGroupe_([{x:0,y:0},{x:3,y:0},{x:0,y:4}]), 12);
verifie('flèche intérieure sans effet sur la ficelle',
  ctx.perimetreGroupe_([{x:0,y:0},{x:3,y:0},{x:0,y:4},{x:0.5,y:0.5}]), 12);
verifie('deux flèches : aller-retour',
  ctx.perimetreGroupe_([{x:0,y:0},{x:0,y:3}]), 6);
verifie('une seule flèche : pas de ficelle', ctx.perimetreGroupe_([{x:1,y:1}]), 0);
verifie('périmètre joint à la mesure de groupement',
  ctx.groupement_([{x:0,y:0},{x:3,y:0},{x:0,y:4}]).perimetre, 12);

// --- Centrage : 100 % au centre, 0 % au bord ---
verifie('groupe pile au centre', ctx.centrage_(0, '40 cm'), 100);
verifie('groupe décalé de 2 cm sur blason 40 cm', ctx.centrage_(2, '40 cm'), 90);
verifie('même écart sur blason 80 cm', ctx.centrage_(2, '80 cm'), 95);
verifie('groupe au bord du blason', ctx.centrage_(20, '40 cm'), 0);
verifie('au-delà du blason, jamais négatif', ctx.centrage_(30, '40 cm'), 0);
verifie('centrage joint au groupement',
  ctx.groupement_([{x:2,y:0},{x:2,y:0},{x:2,y:0}], '40 cm').centrage, 90);

// --- Reconstitution des volées depuis la colonne « Détail des flèches » ---
const partie = {
  detail: '10-9-8 | 7-M-6', parVolee: 3, blason: '40 cm',
  impacts: [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:4,y:0},{x:0,y:4},{x:4,y:4}],
};
const vol = ctx.detailVolees_(partie);
verifie('deux volées reconstituées', vol.length, 2);
verifie('flèches de la première volée', vol[0].fleches, ['10','9','8']);
verifie('total de la première volée', vol[0].total, 27);
verifie('moyenne de la première volée', vol[0].moyenne, 9);
verifie('flèche manquée relue', vol[1].fleches, ['7','M','6']);
verifie('total de la seconde volée', vol[1].total, 13);
verifie('périmètre de la première volée', vol[0].perimetre, 3.4);
verifie('surface de la première volée', vol[0].aire, 0.5);
verifie('impacts rattachés à la bonne volée', vol[1].impacts.length, 3);
verifie('partie saisie au clavier : aucune volée',
  ctx.detailVolees_({ detail: '', parVolee: 6, blason: '40 cm', impacts: [] }).length, 0);

// --- Une mini-compétition crée une séance par archer ---
vm.runInContext(`
  var lignesEcrites = [];
  readTable_ = function () { return []; };
  appendObject_ = function (onglet, ligne) { lignesEcrites.push(ligne); return 2; };
  trouverAdherentParId_ = function (id) {
    return { 'ID': id, 'Prénom': 'Archer', 'Nom': id };
  };
  uid_ = function (p) { return p + '-' + lignesEcrites.length; };
  log_ = function () {};
  now_ = function () { return new Date('2026-09-13'); };
  contexte_ = function () {
    return { id: 'ADH-1', nom: 'Encadrant', estEncadrant: true, estAdmin: true, saisitPourAutres: true, voitScores: true };
  };
`, ctx);

const competition = ctx.apiEnregistrerCompetition('jeton', {
  date: '2026-04-12', seance: 'Concours interne', contexte: 'Concours club',
  discipline: 'Salle', distance: 18, blason: '40 cm', volees: 6, parVolee: 3,
  archers: [
    { adherentId: 'ADH-1', nom: 'A', fleches: [10, 9, 8], impacts: [null, null, null] },
    { adherentId: 'ADH-2', nom: 'B', fleches: [9, 9, 7], impacts: [null, null, null] },
    { adherentId: 'ADH-3', nom: 'C', fleches: [8, 8, 8], impacts: [null, null, null] },
  ],
});
verifie('compétition enregistrée', competition.ok, true);
verifie('une ligne de score par archer', vm.runInContext('lignesEcrites.length', ctx), 3);
verifie('chaque ligne porte son archer',
  vm.runInContext('lignesEcrites.map(function (l) { return l["AdhérentID"]; })', ctx),
  ['ADH-1', 'ADH-2', 'ADH-3']);
verifie('même séance pour tous',
  vm.runInContext('lignesEcrites.every(function (l) { return l["Séance"] === "Concours interne"; })', ctx),
  true);
verifie('classement trié par score',
  competition.classement.map(function (c) { return c.score; }), [27, 25, 24]);

// --- Jetons de session et liens d'accès direct ---
vm.runInContext(`
  var motDePasseCourant = 'arc2027';
  PropertiesService = { getScriptProperties: function () {
    return { getProperty: function () { return 'secret-de-test'; }, setProperty: function () {} };
  } };
  Utilities.computeHmacSha256Signature = function (message, cle) {
    // Signature de test, déterministe : suffisante pour vérifier la mécanique.
    var somme = 0, sortie = [];
    var texte = String(message) + '|' + String(cle);
    for (var i = 0; i < texte.length; i++) somme = (somme * 31 + texte.charCodeAt(i)) % 999983;
    for (var j = 0; j < 8; j++) sortie.push((somme >> j) & 0xff);
    return sortie;
  };
  Utilities.base64EncodeWebSafe = function (octets) { return octets.join('-'); };
  trouverCompteParAdherent_ = function () { return { 'Mot de passe': motDePasseCourant }; };
`, ctx);

const jetonCourt = ctx.creerJeton_('ADH-1');
verifie('le jeton ouvre bien la fiche', (ctx.lireJeton_(jetonCourt) || {})['ID'], 'ADH-1');
verifie('jeton signé, quatre parties', jetonCourt.split('.').length, 4);
verifie('signature falsifiée refusée', ctx.lireJeton_(jetonCourt.replace(/.$/, 'x')), null);

const lienAn = ctx.creerJeton_('ADH-1', 365);
verifie('le lien d’accès direct reste valable', (ctx.lireJeton_(lienAn) || {})['ID'], 'ADH-1');
vm.runInContext("motDePasseCourant = 'nouveau-mdp';", ctx);
verifie('changer de mot de passe invalide les liens', ctx.lireJeton_(lienAn), null);

// --- Cache partagé entre les appels ---
// Contexte neuf : les tests précédents ont remplacé readTable_ par un bouchon.
const ctxCache = { console };
vm.createContext(ctxCache);
['Config.gs', 'Data.gs'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(dir + '/' + f, 'utf8'), ctxCache, { filename: f });
});
vm.runInContext(`
  var _faussesEntrees = {};
  var _ouvertures = 0;
  CacheService = { getScriptCache: function () { return {
    get: function (c) { return _faussesEntrees[c] === undefined ? null : _faussesEntrees[c]; },
    getAll: function (cles) {
      var out = {};
      cles.forEach(function (c) { if (_faussesEntrees[c] !== undefined) out[c] = _faussesEntrees[c]; });
      return out;
    },
    putAll: function (paquet) {
      Object.keys(paquet).forEach(function (c) {
        if (String(paquet[c]).length > 100000) throw new Error('entrée de cache trop grosse');
        _faussesEntrees[c] = paquet[c];
      });
    },
  }; } };
  var _proprietes = {};
  PropertiesService = { getScriptProperties: function () { return {
    getProperties: function () { return JSON.parse(JSON.stringify(_proprietes)); },
    setProperty: function (c, v) { _proprietes[c] = v; },
    getProperty: function (c) { return _proprietes[c] || null; },
  }; } };
  Utilities = { formatDate: function (d) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  } };
  ss_ = function () { return { getSpreadsheetTimeZone: function () { return 'Europe/Paris'; } }; };
  // Un onglet de 400 parties, avec de vraies dates et de longues colonnes.
  var _lignes = [];
  for (var i = 0; i < 400; i++) {
    _lignes.push({ _row: i + 2, 'ID': 'SCO' + i, 'Date': new Date(2026, 0, 1 + (i % 300)),
      'Score': 250 + (i % 50), 'Impacts (cm)': new Array(40).join('1.5:2.5,') });
  }
  lireOnglet_ = function () { _ouvertures++; return _lignes; };
`, ctxCache);

const lu1 = ctxCache.readTable_('Scores');
ctxCache.readTable_('Scores');
verifie('lecture d’un onglet de 400 parties', lu1.length, 400);
verifie('une seule ouverture du classeur par exécution', vm.runInContext('_ouvertures', ctxCache), 1);

// Appel suivant : la mémoire d'exécution est vide, le cache partagé prend le relais.
vm.runInContext('_tables = {};', ctxCache);
const lu3 = ctxCache.readTable_('Scores');
verifie('le cache évite de rouvrir le classeur', vm.runInContext('_ouvertures', ctxCache), 1);
verifie('contenu complet relu du cache', lu3.length, 400);
verifie('les dates restent des dates',
  Object.prototype.toString.call(lu3[5]['Date']), '[object Date]');
verifie('date identique à l’originale',
  ctxCache.isoDate_(lu3[5]['Date']), ctxCache.isoDate_(lu1[5]['Date']));
verifie('gros onglet découpé en morceaux de moins de 100 Ko',
  Object.keys(vm.runInContext('_faussesEntrees', ctxCache)).length > 2, true);

// Une écriture change la version : le cache précédent n'est plus servi.
ctxCache.oublierTables_('Scores');
const lu4 = ctxCache.readTable_('Scores');
verifie('après écriture, le classeur est relu', vm.runInContext('_ouvertures', ctxCache), 2);
verifie('contenu toujours complet', lu4.length, 400);

// Résultat de calcul mémorisé, invalidé par une écriture.
let calculs = 0;
const calcul = function () { calculs++; return { total: 42 }; };
const r1 = ctxCache.memoCalcul_('test', ['Scores'], calcul);
const r2 = ctxCache.memoCalcul_('test', ['Scores'], calcul);
verifie('calcul mémorisé : une seule exécution', [calculs, r1.total, r2.total], [1, 42, 42]);
ctxCache.oublierTables_('Scores');
ctxCache.memoCalcul_('test', ['Scores'], calcul);
verifie('un score enregistré refait le calcul', calculs, 2);

// Un onglet vivant (mini-compétition en direct) n'est jamais mis en cache.
vm.runInContext('_tables = {}; _ouvertures = 0;', ctxCache);
ctxCache.readTable_('Compétitions');
vm.runInContext('_tables = {};', ctxCache);
ctxCache.readTable_('Compétitions');
verifie('le direct lit toujours le classeur', vm.runInContext('_ouvertures', ctxCache), 2);

console.log(ko ? '\n' + ko + ' test(s) en échec' : '\nTous les tests passent.');
process.exit(ko ? 1 : 0);
