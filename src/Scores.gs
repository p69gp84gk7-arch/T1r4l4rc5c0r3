/**
 * Saisie et consultation des scores.
 *
 * Une « partie » se décrit par un nombre de volées et un nombre de flèches
 * par volée (3 ou 6). La saisie flèche par flèche (valeur 1 à 10, ou M pour
 * une flèche manquée) alimente à la fois le score total et la répartition
 * par zone de touche utilisée dans les statistiques.
 */

function disciplineParLabel_(label) {
  const l = String(label || '');
  for (let i = 0; i < DISCIPLINES.length; i++) {
    if (DISCIPLINES[i].label === l || DISCIPLINES[i].code === l) return DISCIPLINES[i];
  }
  return null;
}

/**
 * Normalise la liste de flèches envoyée par la page.
 * Accepte les nombres 0 à 10 ainsi que 'M' / 'm' / '' pour une flèche manquée.
 */
function normaliserFleches_(brut) {
  if (!brut) return [];
  const liste = Array.isArray(brut) ? brut : String(brut).split(/[,;\s|]+/);
  const out = [];
  liste.forEach(function (v) {
    const s = String(v === null || v === undefined ? '' : v).trim().toUpperCase();
    if (s === '') return;
    if (s === 'M' || s === '-') { out.push(0); return; }
    if (s === 'X') { out.push(10); return; }   // le X compte 10 points
    const n = Math.round(Number(s));
    if (!isNaN(n) && n >= 0 && n <= POINTS_MAX_FLECHE) out.push(n);
  });
  return out;
}

/** Répartition {0..10: nombre de flèches} d'une liste de flèches. */
function compterZones_(fleches) {
  const z = {};
  ZONES.forEach(function (v) { z[v] = 0; });
  fleches.forEach(function (v) { z[v] = (z[v] || 0) + 1; });
  return z;
}

/** Découpe la liste de flèches en volées, pour l'affichage et le stockage. */
function detailFleches_(fleches, parVolee) {
  const n = Math.max(1, Number(parVolee) || 6);
  const volees = [];
  for (let i = 0; i < fleches.length; i += n) {
    volees.push(fleches.slice(i, i + n).map(function (v) {
      return v === 0 ? 'M' : String(v);
    }).join('-'));
  }
  return volees.join(' | ');
}

function serialiserScore_(r) {
  const nbFleches = toNumber_(r['Nb flèches']);
  const max = toNumber_(r['Max']) || nbFleches * POINTS_MAX_FLECHE;
  const score = toNumber_(r['Score']);
  const zones = {};
  let avecZones = false;
  ZONES.forEach(function (v) {
    const n = toNumber_(r[colonneZone_(v)]);
    zones[v] = n;
    if (n) avecZones = true;
  });

  return {
    id: String(r['ID'] || ''),
    date: isoDate_(r['Date']),
    adherentId: String(r['AdhérentID'] || ''),
    archer: String(r['Archer'] || ''),
    seance: String(r['Séance'] || ''),
    discipline: String(r['Discipline'] || ''),
    distance: toNumber_(r['Distance']),
    blason: String(r['Blason'] || ''),
    volees: toNumber_(r['Nb volées']),
    parVolee: toNumber_(r['Flèches par volée']),
    nbFleches: nbFleches,
    score: score,
    max: max,
    moyenne: nbFleches ? Math.round((score / nbFleches) * 100) / 100 : 0,
    pourcentage: max ? Math.round((score / max) * 1000) / 10 : 0,
    zones: zones,
    avecZones: avecZones,
    detail: String(r['Détail des flèches'] || ''),
    impacts: lireImpacts_(r['Impacts (cm)']),
    rayonBlason: rayonBlason_(r['Blason']),
    dix: zones[10] || 0,
    neuf: zones[9] || 0,
    contexte: String(r['Contexte'] || ''),
    lieu: String(r['Lieu'] || ''),
    notes: String(r['Notes'] || ''),
  };
}

function apiEnregistrerScore(jeton, data) {
  const ctx = contexte_(jeton);
  const r = enregistrerScore_(ctx, data);
  if (r.ok) cloreBrouillon_(ctx, data && data.brouillonId);
  return r;
}

/* ------------------------------------------------------------------ */
/* Brouillon de la séance en cours                                      */
/* ------------------------------------------------------------------ */

/**
 * La séance en cours est recopiée sur le compte de l'archer à mesure qu'il
 * saisit : un rechargement, une batterie vide ou un onglet fermé ne font plus
 * perdre les flèches. Une séance enregistrée ou abandonnée est « close » : le
 * marqueur empêche une sauvegarde partie en retard de la faire réapparaître.
 */
function apiSauverBrouillon(jeton, brouillon) {
  const ctx = contexte_(jeton);
  if (!ctx.compte) return { ok: false, message: 'Compte introuvable.' };
  if (headers_(SHEETS.UTILISATEURS).indexOf('Brouillon') === -1) {
    return { ok: false, absent: true };
  }
  if (!brouillon) {
    ecrireBrouillon_(ctx, '');
    return { ok: true };
  }
  if (brouillon.clos) {
    ecrireBrouillon_(ctx, JSON.stringify({ clos: String(brouillon.clos) }));
    return { ok: true };
  }
  const actuel = lireBrouillon_(ctx.compte);
  if (actuel && actuel.clos && actuel.clos === String(brouillon.id)) {
    return { ok: true, ignore: true };
  }
  const texte = JSON.stringify(brouillon);
  if (texte.length > BROUILLON_MAX_CARACTERES) {
    return { ok: false, message: 'Séance trop volumineuse pour être mise de côté.' };
  }
  ecrireBrouillon_(ctx, texte);
  return { ok: true };
}

function ecrireBrouillon_(ctx, texte) {
  updateObject_(SHEETS.UTILISATEURS, ctx.compte._row, {
    'Brouillon': texte,
    'Brouillon le': texte ? now_() : '',
  });
}

function lireBrouillon_(compte) {
  const brut = compte && compte['Brouillon'];
  if (!brut) return null;
  try { return JSON.parse(String(brut)); } catch (e) { return null; }
}

/** Brouillon à reprendre au démarrage, ou null. */
function brouillonAReprendre_(ctx) {
  // Une séance close est renvoyée aussi : le navigateur saura qu'il ne doit
  // pas reprendre sa propre copie de cette séance, déjà enregistrée.
  const b = lireBrouillon_(ctx.compte);
  if (!b) return null;
  const le = ctx.compte['Brouillon le'];
  b.enregistreLe = le instanceof Date ? le.getTime() : null;
  return b;
}

function cloreBrouillon_(ctx, id) {
  if (!ctx.compte || headers_(SHEETS.UTILISATEURS).indexOf('Brouillon') === -1) return;
  ecrireBrouillon_(ctx, id ? JSON.stringify({ clos: String(id) }) : '');
}

/**
 * Enregistre une partie pour un archer. Utilisée par la saisie individuelle
 * comme par la mini-compétition, qui l'appelle une fois par participant.
 */
function enregistrerScore_(ctx, data) {
  const d = data || {};
  const cibleId = String(d.adherentId || ctx.id);

  if (cibleId !== ctx.id && !ctx.saisitPourAutres) {
    return { ok: false, message: 'Vous ne pouvez saisir que vos propres scores.' };
  }
  const archer = trouverAdherentParId_(cibleId);
  if (!archer) return { ok: false, message: 'Archer introuvable.' };
  if (!d.discipline) return { ok: false, message: 'Choisissez une discipline.' };

  const parVolee = toNumber_(d.parVolee) || 6;
  const volees = toNumber_(d.volees) || 0;
  const nom = archer['Prénom'] + ' ' + archer['Nom'];
  if (volees <= 0) return { ok: false, message: 'Indiquez le nombre de volées.' };
  if (parVolee <= 0) return { ok: false, message: 'Indiquez le nombre de flèches par volée.' };

  const blason = d.blason || '';
  const impacts = normaliserImpacts_(d.impacts, blason);

  // Un impact pointé sur la cible fait foi : sa valeur se déduit du rayon.
  const fleches = normaliserFleches_(d.fleches);
  impacts.forEach(function (i, k) {
    if (!i) return;
    const rayon = Math.sqrt(i.x * i.x + i.y * i.y);
    fleches[k] = valeurPourRayon_(rayon, blason);
  });

  const prevues = volees * parVolee;

  let nbFleches, score, zones, detail;
  if (fleches.length) {
    if (fleches.length > prevues) {
      return {
        ok: false,
        message: 'Vous avez saisi ' + fleches.length + ' flèches pour ' + prevues + ' annoncées.',
      };
    }
    // Une partie interrompue reste comparable : seules les flèches réellement
    // saisies comptent, les cases laissées vides ne sont pas des manquées.
    nbFleches = fleches.length;
    score = fleches.reduce(function (t, v) { return t + v; }, 0);
    zones = compterZones_(fleches);
    detail = detailFleches_(fleches, parVolee);
  } else {
    // Saisie rapide : score global sans détail des flèches.
    nbFleches = prevues;
    score = toNumber_(d.score);
    zones = compterZones_([]);
    detail = '';
    const max = prevues * POINTS_MAX_FLECHE;
    if (score < 0 || score > max) {
      return { ok: false, message: 'Score impossible : il doit être compris entre 0 et ' + max + '.' };
    }
  }

  const max = nbFleches * POINTS_MAX_FLECHE;
  const ligne = {
    'Date': parseDate_(d.date) || now_(),
    'AdhérentID': cibleId,
    'Archer': archer['Prénom'] + ' ' + archer['Nom'],
    'Séance': String(d.seance || '').trim(),
    'Discipline': d.discipline,
    'Distance': toNumber_(d.distance),
    'Blason': blason,
    'Nb volées': volees,
    'Flèches par volée': parVolee,
    'Nb flèches': nbFleches,
    'Score': score,
    'Max': max,
    'Moyenne par flèche': nbFleches ? Math.round((score / nbFleches) * 100) / 100 : 0,
    'Détail des flèches': detail,
    'Impacts (cm)': fleches.length ? ecrireImpacts_(impacts.slice(0, fleches.length)) : '',
    'Contexte': d.contexte || 'Entraînement',
    'Lieu': String(d.lieu || ''),
    'Notes': String(d.notes || ''),
    'Saisi par': ctx.nom,
  };
  ZONES.forEach(function (v) { ligne[colonneZone_(v)] = zones[v] || 0; });

  if (d.id) {
    const existant = trouverScoreParId_(d.id);
    if (!existant) return { ok: false, message: 'Score introuvable.' };
    if (String(existant['AdhérentID']) !== ctx.id && !ctx.saisitPourAutres) {
      return { ok: false, message: 'Modification non autorisée.' };
    }
    updateObject_(SHEETS.SCORES, existant._row, ligne);
    log_('score_modifie', { id: d.id }, ctx.id);
    return { ok: true, id: String(d.id), message: 'Score mis à jour (' + score + '/' + max + ').' };
  }

  ligne['ID'] = uid_('SCO');
  ligne['Créé le'] = now_();
  appendObject_(SHEETS.SCORES, ligne);
  log_('score_ajoute', { id: ligne['ID'], archer: cibleId, score: score }, ctx.id);

  return {
    ok: true,
    id: ligne['ID'],
    adherentId: cibleId,
    archer: nom,
    score: score,
    max: max,
    moyenne: ligne['Moyenne par flèche'],
    message: 'Score enregistré : ' + score + '/' + max + '.',
  };
}

function trouverScoreParId_(id) {
  const rows = readTable_(SHEETS.SCORES);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i]['ID']) === String(id)) return rows[i];
  }
  return null;
}

/**
 * Liste des parties.
 * Un archer ne voit que les siennes ; l'encadrement peut demander celles d'un
 * autre archer (`adherentId`) ou toutes celles du club (`tous`).
 */
function apiListeScores(jeton, options) {
  return listeScores_(contexte_(jeton), options);
}

function listeScores_(ctx, options) {
  const opt = options || {};

  let cible = ctx.id;
  if (opt.tous && ctx.voitScores) {
    cible = null;
  } else if (opt.adherentId &&
      (ctx.voitScores || String(opt.adherentId) === ctx.id)) {
    cible = String(opt.adherentId);
  }

  let rows = readTable_(SHEETS.SCORES);
  if (cible) rows = rows.filter(function (r) { return String(r['AdhérentID']) === cible; });
  if (opt.discipline) rows = rows.filter(function (r) { return String(r['Discipline']) === opt.discipline; });

  let liste = rows.map(serialiserScore_);
  if (opt.depuis) {
    liste = liste.filter(function (s) { return s.date >= opt.depuis; });
  }
  if (opt.recherche) {
    const q = String(opt.recherche).toLowerCase();
    liste = liste.filter(function (s) {
      return (s.archer + ' ' + s.seance + ' ' + s.lieu).toLowerCase().indexOf(q) !== -1;
    });
  }
  liste.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  return {
    ok: true,
    scores: liste.slice(0, opt.limite || 100),
    total: liste.length,
    club: !cible,
  };
}

function apiSupprimerScore(jeton, id) {
  const ctx = contexte_(jeton);
  const r = trouverScoreParId_(id);
  if (!r) return { ok: false, message: 'Score introuvable.' };
  if (String(r['AdhérentID']) !== ctx.id && !ctx.estEncadrant) {
    return { ok: false, message: 'Suppression non autorisée.' };
  }
  deleteRow_(SHEETS.SCORES, r._row);
  log_('score_supprime', { id: id }, ctx.id);
  return { ok: true, message: 'Score supprimé.' };
}

/** Derniers scores du club, pour le tableau de bord encadrant. */
function derniersScoresClub_(limite) {
  const liste = readTable_(SHEETS.SCORES).map(serialiserScore_);
  liste.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  return liste.slice(0, limite || 8);
}

/**
 * Mini-compétition : une même partie saisie pour plusieurs archers.
 *
 * `data` porte les réglages communs (date, discipline, distance, blason,
 * format des volées, nom de la séance) et la liste `archers`, chacun avec ses
 * flèches et ses impacts. Une ligne de score est créée par participant, toutes
 * partageant le même nom de séance : elles se retrouvent ensuite ensemble.
 */
function apiEnregistrerCompetition(jeton, data) {
  return enregistrerCompetition_(contexte_(jeton), data);
}

function enregistrerCompetition_(ctx, data) {
  if (!ctx.saisitPourAutres) {
    return { ok: false, message: 'Mini-compétition réservée à l’encadrement (paramètre « Saisie ouverte à tous »).' };
  }
  const d = data || {};
  const participants = d.archers || [];
  if (participants.length < 2) {
    return { ok: false, message: 'Une mini-compétition demande au moins deux archers.' };
  }

  const resultats = [];
  const echecs = [];
  participants.forEach(function (part) {
    const ligne = {
      adherentId: part.adherentId,
      fleches: part.fleches,
      impacts: part.impacts,
      score: part.score,
      date: d.date,
      seance: d.seance,
      contexte: d.contexte,
      discipline: d.discipline,
      distance: d.distance,
      blason: d.blason,
      volees: d.volees,
      parVolee: d.parVolee,
      lieu: d.lieu,
    };
    const r = enregistrerScore_(ctx, ligne);
    if (r.ok) resultats.push(r);
    else echecs.push((part.nom || part.adherentId) + ' : ' + r.message);
  });

  if (!resultats.length) {
    return { ok: false, message: 'Aucun score enregistré. ' + echecs.join(' ') };
  }
  resultats.sort(function (a, b) { return b.score - a.score; });
  log_('competition_enregistree', { seance: d.seance, archers: resultats.length }, ctx.id);

  if (resultats.length) cloreBrouillon_(ctx, d.brouillonId);
  return {
    ok: true,
    classement: resultats,
    echecs: echecs,
    message: resultats.length + ' score(s) enregistré(s)' +
      (echecs.length ? ', ' + echecs.length + ' en échec.' : '.'),
  };
}

/* ------------------------------------------------------------------ */
/* Mini-compétition suivie en direct                                    */
/* ------------------------------------------------------------------ */

/**
 * Plusieurs téléphones autour du même pas de tir : l'encadrant ouvre la
 * mini-compétition, chaque archer voit les scores arriver et remplit sa
 * propre carte. L'état complet tient dans une ligne de l'onglet
 * Compétitions ; `Version` évite de renvoyer l'état quand rien n'a bougé.
 */
function competitionsPresentes_() {
  return ongletPresent_(SHEETS.COMPETITIONS);
}

function ongletCompetitionsAbsent_() {
  return {
    ok: false, absent: true,
    message: 'Onglet « Compétitions » manquant : lancez « Installer / réparer » dans le classeur.',
  };
}

function lireCompetition_(id) {
  const lignes = readTable_(SHEETS.COMPETITIONS);
  for (let i = 0; i < lignes.length; i++) {
    if (String(lignes[i]['ID']) === String(id)) return lignes[i];
  }
  return null;
}

function analyserJson_(valeur, defaut) {
  try { return JSON.parse(String(valeur || '')) || defaut; } catch (e) { return defaut; }
}

function serialiserCompetition_(r) {
  return {
    id: String(r['ID']),
    date: isoDate_(r['Date']),
    seance: String(r['Séance'] || ''),
    createur: String(r['Créée par'] || ''),
    reglages: analyserJson_(r['Réglages'], {}),
    participants: analyserJson_(r['Participants'], []),
    cartes: analyserJson_(r['Cartes'], {}),
    version: toNumber_(r['Version']),
    statut: String(r['Statut'] || 'En cours'),
  };
}

/** Un participant, son créateur et l'encadrement voient la compétition. */
function accesCompetition_(ctx, c) {
  if (ctx.estEncadrant) return true;
  if (c.createur === ctx.id) return true;
  return (c.participants || []).some(function (p) { return String(p.id) === ctx.id; });
}

/** Saisie ouverte : chaque participant remplit toutes les cartes ; sinon la sienne. */
function peutSaisirCarte_(ctx, c, adherentId) {
  if (!accesCompetition_(ctx, c)) return false;
  return ctx.saisitPourAutres || String(adherentId) === ctx.id;
}

function apiOuvrirCompetition(jeton, data) {
  const ctx = contexte_(jeton);
  if (!ctx.saisitPourAutres) {
    return { ok: false, message: 'Seul l’encadrement ouvre une mini-compétition en direct.' };
  }
  if (!competitionsPresentes_()) return ongletCompetitionsAbsent_();

  const d = data || {};
  const participants = (d.archers || []).map(function (a) {
    return { id: String(a.id), nom: String(a.nom || '') };
  });
  if (participants.length < 2) {
    return { ok: false, message: 'Choisissez au moins deux archers.' };
  }

  // Maintenant que chacun peut passer en direct, deux archers risquaient
  // d'ouvrir chacun leur compétition et de ne jamais se voir. Si une
  // compétition en cours réunit déjà l'un de ces archers, on la rejoint
  // (en y ajoutant les nouveaux participants) au lieu d'en créer une autre.
  const verrou = LockService.getScriptLock();
  try { verrou.waitLock(15000); } catch (e) {
    return { ok: false, message: 'Serveur occupé, réessayez.' };
  }
  try {
    oublierTables_(SHEETS.COMPETITIONS);
    const ids = participants.map(function (p) { return p.id; });
    const existantes = readTable_(SHEETS.COMPETITIONS).filter(function (r) {
      if (String(r['Statut']) !== 'En cours') return false;
      return analyserJson_(r['Participants'], []).some(function (p) {
        return ids.indexOf(String(p.id)) !== -1;
      });
    });
    if (existantes.length) {
      const r = existantes[existantes.length - 1];
      const c = serialiserCompetition_(r);
      let ajouts = 0;
      participants.forEach(function (p) {
        if (!c.participants.some(function (x) { return String(x.id) === p.id; })) {
          c.participants.push(p);
          ajouts++;
        }
      });
      if (ajouts) {
        updateObject_(SHEETS.COMPETITIONS, r._row, {
          'Participants': JSON.stringify(c.participants),
          'Version': c.version + 1,
          'Modifié le': now_(),
        });
      }
      log_('competition_rejointe', { id: c.id, ajouts: ajouts }, ctx.id);
      return { ok: true, rejointe: true, competition: serialiserCompetition_(lireCompetition_(c.id)) };
    }
  } finally {
    verrou.releaseLock();
  }

  // Une seule compétition ouverte à la fois : la précédente est close.
  readTable_(SHEETS.COMPETITIONS).forEach(function (r) {
    if (String(r['Statut']) === 'En cours' && String(r['Créée par']) === ctx.id) {
      updateObject_(SHEETS.COMPETITIONS, r._row, { 'Statut': 'Abandonnée', 'Modifié le': now_() });
    }
  });

  const cartes = {};
  (d.cartes && typeof d.cartes === 'object' ? Object.keys(d.cartes) : []).forEach(function (k) {
    cartes[k] = d.cartes[k];
  });

  const id = uid_('CMP');
  appendObject_(SHEETS.COMPETITIONS, {
    'ID': id,
    'Date': d.date || isoDate_(now_()),
    'Séance': d.seance || '',
    'Créée par': ctx.id,
    'Réglages': JSON.stringify(d.reglages || {}),
    'Participants': JSON.stringify(participants),
    'Cartes': JSON.stringify(cartes),
    'Version': 1,
    'Statut': 'En cours',
    'Créé le': now_(),
    'Modifié le': now_(),
  });
  log_('competition_ouverte', { id: id, archers: participants.length }, ctx.id);
  return { ok: true, competition: serialiserCompetition_(lireCompetition_(id)) };
}

/** Compétition en cours à laquelle l'archer est convié, s'il y en a une. */
function apiCompetitionEnCours(jeton) {
  const ctx = contexte_(jeton);
  if (!competitionsPresentes_()) return { ok: true, aucune: true };
  const ouvertes = readTable_(SHEETS.COMPETITIONS)
    .filter(function (r) { return String(r['Statut'] || '') === 'En cours'; })
    .map(serialiserCompetition_)
    .filter(function (c) { return accesCompetition_(ctx, c); });
  if (!ouvertes.length) return { ok: true, aucune: true };
  return { ok: true, competition: ouvertes[ouvertes.length - 1] };
}

/** État partagé ; `version` connue de l'appareil pour éviter les renvois inutiles. */
function apiEtatCompetition(jeton, id, version) {
  const ctx = contexte_(jeton);
  if (!competitionsPresentes_()) return ongletCompetitionsAbsent_();
  const r = lireCompetition_(id);
  if (!r) return { ok: false, message: 'Mini-compétition introuvable.' };
  const c = serialiserCompetition_(r);
  if (!accesCompetition_(ctx, c)) {
    return { ok: false, message: 'Vous ne participez pas à cette mini-compétition.' };
  }
  if (Number(version) === c.version) return { ok: true, inchange: true, version: c.version, statut: c.statut };
  return { ok: true, competition: c };
}

/**
 * Enregistre la carte d'un archer et renvoie l'état complet.
 * Le verrou évite que deux téléphones n'écrivent en même temps.
 */
function apiMajCarteCompetition(jeton, id, carte) {
  const ctx = contexte_(jeton);
  if (!competitionsPresentes_()) return ongletCompetitionsAbsent_();
  const verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(15000);
  } catch (e) {
    return { ok: false, message: 'Une autre saisie est en cours, réessayez.' };
  }
  try {
    oublierTables_(SHEETS.COMPETITIONS);
    const r = lireCompetition_(id);
    if (!r) return { ok: false, message: 'Mini-compétition introuvable.' };
    const c = serialiserCompetition_(r);
    if (c.statut !== 'En cours') return { ok: true, competition: c };

    const cible = String((carte && carte.adherentId) || ctx.id);
    if (!peutSaisirCarte_(ctx, c, cible)) {
      return { ok: false, message: 'Vous ne pouvez remplir que votre propre carte.' };
    }
    c.cartes[cible] = {
      fleches: (carte && carte.fleches) || [],
      impacts: (carte && carte.impacts) || [],
      index: (carte && carte.index) || 0,
      validees: (carte && carte.validees) || [],
      parQui: ctx.id,
      le: now_().getTime(),
    };
    const version = c.version + 1;
    updateObject_(SHEETS.COMPETITIONS, r._row, {
      'Cartes': JSON.stringify(c.cartes),
      'Version': version,
      'Modifié le': now_(),
    });
    c.version = version;
    return { ok: true, competition: c };
  } finally {
    verrou.releaseLock();
  }
}

/**
 * Validation d'UNE volée d'une carte. Le téléphone n'envoie que la volée
 * qu'il vient de valider ; le serveur la range à sa place sans toucher aux
 * autres volées ni aux autres cartes. Deux archers qui valident en même temps
 * ne peuvent donc plus s'écraser, et une copie périmée d'une carte ne repart
 * jamais. Une volée notée sur d'autres réglages (blason, flèches par volée)
 * que ceux de la compétition est refusée : ses points seraient faux.
 * op : { adherentId, volee, parVolee, blason, fleches[], impacts[], validee }
 */
function apiValiderVoleeCompetition(jeton, id, op) {
  const ctx = contexte_(jeton);
  if (!competitionsPresentes_()) return ongletCompetitionsAbsent_();
  const verrou = LockService.getScriptLock();
  try {
    verrou.waitLock(15000);
  } catch (e) {
    return { ok: false, reessayer: true, message: 'Serveur occupé, nouvel essai automatique.' };
  }
  try {
    oublierTables_(SHEETS.COMPETITIONS);
    const r = lireCompetition_(id);
    if (!r) return { ok: false, message: 'Mini-compétition introuvable.' };
    const c = serialiserCompetition_(r);
    if (c.statut !== 'En cours') return { ok: false, message: 'Mini-compétition clôturée.', competition: c };

    const cible = String((op && op.adherentId) || ctx.id);
    if (!peutSaisirCarte_(ctx, c, cible)) {
      return { ok: false, message: 'Vous ne pouvez remplir que votre propre carte.', competition: c };
    }
    const v = Math.floor(toNumber_(op && op.volee));
    const par = Math.floor(toNumber_(op && op.parVolee));
    const parAttendu = Math.floor(toNumber_(c.reglages.parVolee));
    const volees = Math.floor(toNumber_(c.reglages.volees));
    if (!(par > 0) || v < 0 || (volees > 0 && v >= volees)) {
      return { ok: false, message: 'Volée invalide.', competition: c };
    }
    if ((parAttendu > 0 && par !== parAttendu) ||
        (c.reglages.blason && op.blason && String(op.blason) !== String(c.reglages.blason))) {
      return { ok: false, message: 'Les réglages de la partie ont changé : refaites la volée ' + (v + 1) + '.',
        competition: c };
    }

    const carte = c.cartes[cible] || {};
    const fleches = (carte.fleches || []).slice();
    const impacts = (carte.impacts || []).slice();
    const validees = (carte.validees || []).slice();
    for (let f = 0; f < par; f++) {
      const x = (op.fleches || [])[f];
      const valeur = x === null || x === undefined || x === '' ? null : Number(x);
      const i = (op.impacts || [])[f];
      fleches[v * par + f] = valeur !== null && isFinite(valeur) ? Math.max(0, Math.min(10, valeur)) : null;
      impacts[v * par + f] = i && isFinite(Number(i.x)) && isFinite(Number(i.y))
        ? { x: Number(i.x), y: Number(i.y) } : null;
    }
    for (let k = 0; k < fleches.length; k++) {
      if (fleches[k] === undefined) fleches[k] = null;
      if (impacts[k] === undefined) impacts[k] = null;
    }
    validees[v] = op.validee !== false;
    for (let k = 0; k < validees.length; k++) validees[k] = !!validees[k];
    let index = fleches.length;
    for (let k = 0; k < fleches.length; k++) if (fleches[k] === null) { index = k; break; }

    c.cartes[cible] = {
      fleches: fleches, impacts: impacts, index: index, validees: validees,
      parQui: ctx.id, le: now_().getTime(),
    };
    const version = c.version + 1;
    updateObject_(SHEETS.COMPETITIONS, r._row, {
      'Cartes': JSON.stringify(c.cartes),
      'Version': version,
      'Modifié le': now_(),
    });
    c.version = version;
    return { ok: true, competition: c };
  } finally {
    verrou.releaseLock();
  }
}

/** Seuls le créateur de la compétition et l'encadrement la pilotent. */
function pilotageCompetition_(ctx, c) {
  return ctx.estEncadrant || c.createur === ctx.id;
}

/**
 * Réglages partagés : le créateur les modifie, tous les téléphones les
 * reçoivent avec l'état suivant — personne ne tire sur des réglages différents.
 */
function apiMajReglagesCompetition(jeton, id, reglages) {
  const ctx = contexte_(jeton);
  if (!competitionsPresentes_()) return ongletCompetitionsAbsent_();
  const verrou = LockService.getScriptLock();
  try { verrou.waitLock(15000); } catch (e) {
    return { ok: false, message: 'Serveur occupé, réessayez.' };
  }
  try {
    oublierTables_(SHEETS.COMPETITIONS);
    const r = lireCompetition_(id);
    if (!r) return { ok: false, message: 'Mini-compétition introuvable.' };
    const c = serialiserCompetition_(r);
    if (!pilotageCompetition_(ctx, c)) {
      return { ok: false, message: 'Seul le créateur de la mini-compétition change ses réglages.' };
    }
    if (c.statut !== 'En cours') return { ok: true, competition: c };
    const nouveaux = Object.assign({}, c.reglages, reglages || {});
    updateObject_(SHEETS.COMPETITIONS, r._row, {
      'Réglages': JSON.stringify(nouveaux),
      'Séance': nouveaux.seance || c.seance,
      'Version': c.version + 1,
      'Modifié le': now_(),
    });
    return { ok: true, competition: serialiserCompetition_(lireCompetition_(id)) };
  } finally {
    verrou.releaseLock();
  }
}

/**
 * Clôt la mini-compétition : `enregistrer` crée une ligne de score par archer,
 * sinon la séance est simplement abandonnée. Réservé au créateur et à
 * l'encadrement ; le verrou et le contrôle du statut empêchent un double
 * enregistrement quand deux téléphones valident en même temps.
 */
function apiFermerCompetition(jeton, id, enregistrer) {
  const ctx = contexte_(jeton);
  if (!competitionsPresentes_()) return ongletCompetitionsAbsent_();
  const verrou = LockService.getScriptLock();
  try { verrou.waitLock(25000); } catch (e) {
    return { ok: false, message: 'Serveur occupé, réessayez.' };
  }
  try {
    oublierTables_(SHEETS.COMPETITIONS);
    const r = lireCompetition_(id);
    if (!r) return { ok: false, message: 'Mini-compétition introuvable.' };
    const c = serialiserCompetition_(r);
    if (!pilotageCompetition_(ctx, c)) {
      return { ok: false, message: 'Seul le créateur de la mini-compétition peut l’enregistrer.' };
    }
    if (c.statut !== 'En cours') {
      return {
        ok: false, dejaFaite: true,
        message: c.statut === 'Enregistrée'
          ? 'Cette mini-compétition est déjà enregistrée.' : 'Cette mini-compétition est close.',
      };
    }

    if (!enregistrer) {
      updateObject_(SHEETS.COMPETITIONS, r._row, { 'Statut': 'Abandonnée', 'Modifié le': now_() });
      log_('competition_abandonnee', { id: id }, ctx.id);
      return { ok: true, abandonnee: true, message: 'Mini-compétition abandonnée.' };
    }

    const data = Object.assign({}, c.reglages, { date: c.reglages.date || c.date, seance: c.seance });
    data.archers = c.participants.map(function (p) {
      const carte = c.cartes[p.id] || {};
      const fleches = [];
      const impacts = [];
      (carte.fleches || []).forEach(function (v, i) {
        if (v === undefined || v === null) return;
        fleches.push(v);
        impacts.push((carte.impacts || [])[i] || null);
      });
      return { adherentId: p.id, nom: p.nom, fleches: fleches, impacts: impacts };
    }).filter(function (a) { return a.fleches.length; });

    // Statut posé avant l'écriture des scores : un second appel s'arrête net.
    updateObject_(SHEETS.COMPETITIONS, r._row, { 'Statut': 'Enregistrée', 'Modifié le': now_() });
    const resultat = enregistrerCompetition_(ctx, data);
    if (!resultat.ok) {
      updateObject_(SHEETS.COMPETITIONS, r._row, { 'Statut': 'En cours', 'Modifié le': now_() });
    }
    return resultat;
  } finally {
    verrou.releaseLock();
  }
}
