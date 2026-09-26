/**
 * Couche d'accès au Google Sheet : lecture/écriture ligne à ligne,
 * conversion en objets, et utilitaires partagés.
 */

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Retrouve un onglet par son nom, en tolérant la casse et les espaces
 * (l'onglet livré avec le classeur s'appelle « inscrits » en minuscules).
 */
let _feuilles = {};
let _tables = {};

/* ---------- Cache partagé entre les appels ---------- */

/*
 * Sans cache, chaque appel relit des onglets entiers : la connexion, les
 * paramètres et la liste des archers repartent du classeur à chaque fois.
 * Ces lectures sont désormais gardées quelques heures dans le cache du
 * script, et oubliées dès qu'une écriture touche l'onglet concerné — chaque
 * onglet porte un numéro de version qui change à l'écriture, si bien qu'une
 * donnée périmée n'est jamais servie.
 */
/*
 * Cinq minutes seulement : l'application vide elle-même le cache dès qu'elle
 * écrit, mais une modification faite À LA MAIN dans le classeur ne prévient
 * personne. Cette durée courte garantit qu'une retouche manuelle apparaît vite,
 * tout en évitant de relire les onglets à chaque appel.
 */
const CACHE_DUREE = 300;
const CACHE_MORCEAU = 90000;        // une entrée de cache accepte 100 Ko
const CACHE_TAILLE_MAX = 700000;    // au-delà, on ne met pas en cache

/** Onglets mis en cache : ceux qui changent peu ou se lisent tout le temps. */
function ongletCachable_(name) {
  return name === SHEETS.ADHERENTS || name === SHEETS.UTILISATEURS ||
    name === SHEETS.PARAMETRES || name === SHEETS.SCORES ||
    name === SHEETS.DISPONIBILITES || name === SHEETS.MESSAGES;
}

function cache_() {
  try { return CacheService.getScriptCache(); } catch (e) { return null; }
}

let _versions = null;
function versionOnglet_(name) {
  if (!_versions) {
    try {
      _versions = PropertiesService.getScriptProperties().getProperties() || {};
    } catch (e) {
      _versions = {};
    }
  }
  return String(_versions['V_' + name] || '1');
}

/** Change le numéro de version : le cache de cet onglet devient inaccessible. */
function nouvelleVersionOnglet_(name) {
  const suivante = String((Number(versionOnglet_(name)) || 1) + 1);
  _versions['V_' + name] = suivante;
  try {
    PropertiesService.getScriptProperties().setProperty('V_' + name, suivante);
  } catch (e) { /* quota atteint : le cache expirera de lui-même */ }
}

/*
 * Les cellules de date arrivent du classeur en objets Date ; le passage par
 * JSON les transformerait en texte. On les marque à l'écriture pour les
 * rendre telles quelles à la lecture.
 */
function _cacheRemplacer(cle, valeur) {
  const brut = this[cle];
  return brut instanceof Date ? { __d: brut.getTime() } : valeur;
}

function _cacheRelire(cle, valeur) {
  if (valeur && typeof valeur === 'object' && typeof valeur.__d === 'number') {
    return new Date(valeur.__d);
  }
  return valeur;
}

function lireCache_(cle) {
  const c = cache_();
  if (!c) return null;
  try {
    const tete = c.get(cle);
    if (!tete) return null;
    const nombre = Number(tete);
    if (!isFinite(nombre) || nombre <= 0) return null;
    const cles = [];
    for (let i = 0; i < nombre; i++) cles.push(cle + '#' + i);
    const morceaux = c.getAll(cles);
    let texte = '';
    for (let i = 0; i < nombre; i++) {
      const m = morceaux[cle + '#' + i];
      if (m === undefined || m === null) return null;   // morceau expiré : on recalcule
      texte += m;
    }
    return JSON.parse(texte, _cacheRelire);
  } catch (e) {
    return null;
  }
}

function ecrireCache_(cle, valeur, duree) {
  const c = cache_();
  if (!c) return;
  let texte;
  try {
    texte = JSON.stringify(valeur, _cacheRemplacer);
  } catch (e) {
    return;
  }
  if (!texte || texte.length > CACHE_TAILLE_MAX) return;
  const paquet = {};
  let nombre = 0;
  for (let i = 0; i < texte.length; i += CACHE_MORCEAU) {
    paquet[cle + '#' + nombre] = texte.substring(i, i + CACHE_MORCEAU);
    nombre++;
  }
  paquet[cle] = String(nombre);
  try { c.putAll(paquet, duree || CACHE_DUREE); } catch (e) { /* sans conséquence */ }
}

/**
 * Mémorise le résultat d'un calcul tant que les onglets dont il dépend n'ont
 * pas changé. `cle` décrit le calcul (archer, filtres…).
 */
function memoCalcul_(cle, onglets, calcul) {
  const version = (onglets || []).map(versionOnglet_).join('.');
  const complete = 'calc|' + cle + '|' + version;
  const garde = lireCache_(complete);
  if (garde) return garde;
  const resultat = calcul();
  if (resultat) ecrireCache_(complete, resultat);
  return resultat;
}

/**
 * Oublie les lectures mémorisées : à appeler après toute écriture qui ne
 * passe pas par appendObject_ / updateObject_ / deleteRow_. Le cache partagé
 * entre appels est invalidé en même temps.
 */
function oublierTables_(name) {
  if (name) {
    delete _tables[name];
    if (ongletCachable_(name)) nouvelleVersionOnglet_(name);
    return;
  }
  _tables = {};
  _feuilles = {};
  Object.keys(SHEETS).forEach(function (k) {
    if (ongletCachable_(SHEETS[k])) nouvelleVersionOnglet_(SHEETS[k]);
  });
}

function findSheet_(name) {
  if (_feuilles[name]) return _feuilles[name];
  const trouvee = chercherFeuille_(name);
  if (trouvee) _feuilles[name] = trouvee;
  return trouvee;
}

function chercherFeuille_(name) {
  const ss = ss_();
  const direct = ss.getSheetByName(name);
  if (direct) return direct;
  const cible = String(name).trim().toLowerCase();
  const match = ss.getSheets().filter(function (s) {
    return s.getName().trim().toLowerCase() === cible;
  });
  return match.length ? match[0] : null;
}

/** L'onglet existe-t-il ? Utile pour dégrader proprement après une mise à jour. */
function ongletPresent_(nom) {
  return !!findSheet_(nom);
}

function sheet_(name) {
  const sh = findSheet_(name);
  if (!sh) {
    throw new Error(
      'Onglet « ' + name + ' » introuvable. Lancez « Tir à l’arc ▸ Installer / réparer » depuis le menu du Sheet.'
    );
  }
  return sh;
}

/** Entêtes de l'onglet, en cache par exécution. */
function headers_(name) {
  const sh = sheet_(name);
  const last = sh.getLastColumn();
  if (last === 0) return [];
  return sh.getRange(1, 1, 1, last).getValues()[0].map(String);
}

/**
 * Lit tout un onglet et renvoie un tableau d'objets {colonne: valeur}.
 * Chaque objet porte `_row`, l'index de ligne réel dans le Sheet.
 */
function readTable_(name) {
  // Un même appel relit souvent les mêmes onglets (compte, inscrit, scores) :
  // la lecture est mémorisée le temps de l'exécution, et oubliée à l'écriture.
  if (_tables[name]) return _tables[name].slice();

  // Puis le cache partagé, qui évite de rouvrir le classeur d'un appel à
  // l'autre tant que l'onglet n'a pas changé.
  if (ongletCachable_(name)) {
    const cle = 'onglet|' + name + '|' + versionOnglet_(name);
    const garde = lireCache_(cle);
    if (garde) {
      _tables[name] = garde;
      return garde.slice();
    }
    const lu = lireOnglet_(name);
    _tables[name] = lu;
    ecrireCache_(cle, lu);
    return lu.slice();
  }

  _tables[name] = lireOnglet_(name);
  return _tables[name].slice();
}

function lireOnglet_(name) {
  const sh = sheet_(name);
  const lastRow = sh.getLastRow();
  const lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol === 0) return [];
  const values = sh.getRange(1, 1, lastRow, lastCol).getValues();
  const head = values[0].map(String);
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row.every(function (c) { return c === '' || c === null; })) continue;
    const obj = { _row: i + 1 };
    head.forEach(function (h, j) { obj[h] = row[j]; });
    out.push(obj);
  }
  return out;
}

/** Ajoute une ligne à partir d'un objet, en respectant l'ordre des entêtes. */
function appendObject_(name, obj) {
  const sh = sheet_(name);
  const head = headers_(name);
  const row = head.map(function (h) {
    return obj[h] === undefined ? '' : obj[h];
  });
  sh.appendRow(row);
  oublierTables_(name);
  return sh.getLastRow();
}

/** Met à jour les champs fournis sur une ligne existante. */
function updateObject_(name, rowIndex, patch) {
  const sh = sheet_(name);
  const head = headers_(name);
  const range = sh.getRange(rowIndex, 1, 1, head.length);
  const current = range.getValues()[0];
  head.forEach(function (h, j) {
    if (Object.prototype.hasOwnProperty.call(patch, h)) current[j] = patch[h];
  });
  range.setValues([current]);
  oublierTables_(name);
}

function deleteRow_(name, rowIndex) {
  sheet_(name).deleteRow(rowIndex);
  oublierTables_(name);
}

/** Identifiant court, lisible et unique (ex. ADH-M8K3QZ). */
function uid_(prefix) {
  const s = Utilities.getUuid().replace(/-/g, '').toUpperCase();
  return prefix + '-' + s.substring(0, 6);
}

function now_() {
  return new Date();
}

function tz_() {
  return ss_().getSpreadsheetTimeZone() || 'Europe/Paris';
}

/** Formate une date en ISO court (yyyy-MM-dd) ou '' si vide/invalide. */
function isoDate_(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, tz_(), 'yyyy-MM-dd');
}

function parseDate_(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const fr = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (fr) return new Date(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toNumber_(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(String(value).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function addMonths_(date, months) {
  const d = new Date(date.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

function joursEntre_(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** Lit l'onglet Paramètres sous forme de dictionnaire {clé: valeur}. */
let _paramsCache = null;

function params_() {
  if (_paramsCache) return _paramsCache;
  const rows = readTable_(SHEETS.PARAMETRES);
  const out = {};
  rows.forEach(function (r) {
    if (r['Paramètre']) out[String(r['Paramètre'])] = r['Valeur'];
  });
  _paramsCache = out;   // valable le temps d'une exécution seulement
  return out;
}

function param_(key, defaut) {
  const v = params_()[key];
  return v === undefined || v === '' ? defaut : v;
}

/**
 * Adresse de l'application telle que la connaissent les archers.
 *
 * `ScriptApp.getService().getUrl()` renvoie le dernier déploiement enregistré,
 * qui n'est pas forcément celui qu'on a diffusé — il peut même être privé. La
 * ligne « URL de l'application » de l'onglet Paramètres fait donc foi dès
 * qu'elle est renseignée : c'est elle qui part dans les liens d'accès direct
 * et dans les emails.
 */
function urlApplication_() {
  const declaree = String(param_('URL de l’application', '')).trim();
  if (declaree) return declaree;
  try {
    return ScriptApp.getService().getUrl() || '';
  } catch (e) {
    return '';
  }
}

/**
 * Saison FFTA courante : du 1er septembre au 31 août.
 * Renvoie une chaîne « 2025-2026 ».
 */
function saisonCourante_() {
  const forced = params_()['Saison en cours'];
  if (forced) return String(forced).trim();
  const d = now_();
  const y = d.getFullYear();
  return d.getMonth() >= 8 ? y + '-' + (y + 1) : (y - 1) + '-' + y;
}

/** Année civile de fin de saison, référence des catégories d'âge FFTA. */
function anneeReference_(saison) {
  const s = saison || saisonCourante_();
  const m = String(s).match(/(\d{4})\s*-\s*(\d{4})/);
  return m ? Number(m[2]) : new Date().getFullYear();
}

/** Catégorie FFTA déduite de la date de naissance. */
function categoriePour_(dateNaissance, saison) {
  const d = parseDate_(dateNaissance);
  if (!d) return '';
  const age = anneeReference_(saison) - d.getFullYear();
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (age <= CATEGORIES[i].ageMax) return CATEGORIES[i].code;
  }
  return 'S3';
}

function estJeune_(categorie) {
  return ['U11', 'U13', 'U15', 'U18', 'U21'].indexOf(String(categorie)) !== -1;
}

/** Journalise une action dans l'onglet Journal (best effort). */
function log_(action, details, acteur) {
  try {
    appendObject_(SHEETS.JOURNAL, {
      'Horodatage': now_(),
      'Acteur': acteur || '',
      'Action': action,
      'Détails': typeof details === 'string' ? details : JSON.stringify(details),
    });
  } catch (e) {
    console.warn('Journal indisponible : ' + e.message);
  }
}
