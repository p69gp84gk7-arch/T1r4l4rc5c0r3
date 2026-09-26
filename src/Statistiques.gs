/**
 * Statistiques par archer : répartition des flèches par zone de touche,
 * couronnes du blason, moyennes et évolution — partie par partie.
 */

/** Couronnes du blason FFTA, de la plus haute à la plus basse. */
const COURONNES = [
  { code: 'jaune', label: 'Jaune (9-10)', valeurs: [9, 10], couleur: '#e8b430' },
  { code: 'rouge', label: 'Rouge (7-8)', valeurs: [7, 8], couleur: '#c0392b' },
  { code: 'bleu', label: 'Bleu (5-6)', valeurs: [5, 6], couleur: '#2f6fb5' },
  { code: 'noir', label: 'Noir (3-4)', valeurs: [3, 4], couleur: '#3b4148' },
  { code: 'blanc', label: 'Blanc (1-2)', valeurs: [1, 2], couleur: '#9aa3a8' },
  { code: 'manque', label: 'Manquées', valeurs: [0], couleur: '#b3261e' },
];

function zonesVides_() {
  const z = {};
  ZONES.forEach(function (v) { z[v] = 0; });
  return z;
}

function cumulerZones_(total, zones) {
  ZONES.forEach(function (v) { total[v] += Number(zones[v]) || 0; });
  return total;
}

function totalZones_(zones) {
  return ZONES.reduce(function (t, v) { return t + (Number(zones[v]) || 0); }, 0);
}

/** Transforme un comptage de zones en séries prêtes à dessiner. */
function synthetiserZones_(zones) {
  const total = totalZones_(zones);
  const parZone = ZONES.slice().reverse().map(function (v) {
    const n = Number(zones[v]) || 0;
    return {
      zone: v === 0 ? 'M' : String(v),
      valeur: v,
      nombre: n,
      pourcentage: total ? Math.round((n / total) * 1000) / 10 : 0,
    };
  });

  const parCouronne = COURONNES.map(function (c) {
    const n = c.valeurs.reduce(function (t, v) { return t + (Number(zones[v]) || 0); }, 0);
    return {
      code: c.code,
      label: c.label,
      couleur: c.couleur,
      nombre: n,
      pourcentage: total ? Math.round((n / total) * 1000) / 10 : 0,
    };
  });

  const points = ZONES.reduce(function (t, v) { return t + v * (Number(zones[v]) || 0); }, 0);
  return {
    total: total,
    points: points,
    moyenne: total ? Math.round((points / total) * 100) / 100 : 0,
    parZone: parZone,
    parCouronne: parCouronne,
  };
}

/**
 * Statistiques complètes d'un archer, éventuellement filtrées.
 * `options` : { scoreId, discipline, distance, lieu, depuis, jusqua, limiteParties }
 *
 * `scoreId` isole une séance ; `depuis` / `jusqua` (dates ISO) délimitent une
 * période. Sans option, les statistiques portent sur toutes les parties.
 */
function statistiquesArcher_(adherentId, options) {
  const opt = options || {};
  const toutes = readTable_(SHEETS.SCORES)
    .filter(function (r) { return String(r['AdhérentID']) === String(adherentId); })
    .map(serialiserScore_);

  let scores = toutes;
  if (opt.scoreId) {
    scores = scores.filter(function (s) { return s.id === String(opt.scoreId); });
  }
  if (opt.discipline) {
    scores = scores.filter(function (s) { return s.discipline === opt.discipline; });
  }
  if (opt.distance) {
    scores = scores.filter(function (s) { return s.distance === Number(opt.distance); });
  }
  if (opt.lieu) {
    scores = scores.filter(function (s) { return s.lieu === opt.lieu; });
  }
  if (opt.depuis) {
    scores = scores.filter(function (s) { return s.date >= opt.depuis; });
  }
  if (opt.jusqua) {
    scores = scores.filter(function (s) { return s.date <= opt.jusqua; });
  }
  scores.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

  const cumul = zonesVides_();
  let flechesDetaillees = 0;
  scores.forEach(function (s) {
    if (s.avecZones) {
      cumulerZones_(cumul, s.zones);
      flechesDetaillees += totalZones_(s.zones);
    }
  });

  // Carte d'impacts cumulée : les parties tirées sur des blasons différents
  // sont ramenées au blason le plus fréquent de la sélection.
  const comptesBlason = {};
  scores.forEach(function (s) {
    if (s.impacts && s.impacts.length) {
      comptesBlason[s.blason] = (comptesBlason[s.blason] || 0) + 1;
    }
  });
  const blasonReference = Object.keys(comptesBlason).sort(function (a, b) {
    return comptesBlason[b] - comptesBlason[a];
  })[0] || '40 cm';
  const rayonReference = rayonBlason_(blasonReference);

  const impacts = [];
  scores.forEach(function (s) {
    if (!s.impacts || !s.impacts.length) return;
    const facteur = rayonReference / (s.rayonBlason || rayonReference);
    s.impacts.forEach(function (i) {
      if (!i) return;
      const x = Math.round(i.x * facteur * 10) / 10;
      const y = Math.round(i.y * facteur * 10) / 10;
      impacts.push({
        x: x, y: y, date: s.date, p: s.id,
        valeur: valeurPourPoint_(x, y, blasonReference),
      });
    });
  });
  const impactsRecents = impacts.slice(-(opt.limiteImpacts || 600));

  const parties = scores.slice().reverse().slice(0, opt.limiteParties || 40).map(function (s) {
    return {
      id: s.id,
      date: s.date,
      seance: s.seance,
      discipline: s.discipline,
      distance: s.distance,
      blason: s.blason,
      volees: s.volees,
      parVolee: s.parVolee,
      score: s.score,
      max: s.max,
      moyenne: s.moyenne,
      pourcentage: s.pourcentage,
      avecZones: s.avecZones,
      zones: s.zones,
      impacts: s.impacts,
      rayonBlason: s.rayonBlason,
      synthese: s.avecZones ? synthetiserZones_(s.zones) : null,
      groupement: groupement_(s.impacts, s.blason),
    };
  });

  // Courbe de la moyenne par flèche, une entrée par partie.
  const evolution = scores.map(function (s) {
    return {
      date: s.date, moyenne: s.moyenne, score: s.score, max: s.max,
      pct: s.pourcentage, discipline: s.discipline, distance: s.distance,
    };
  });

  // Filtres proposés : calculés sur TOUTES les parties, pour qu'un filtre actif
  // n'efface pas les autres choix possibles.
  const disciplines = [];
  const distances = [];
  const lieux = [];
  toutes.forEach(function (s) {
    if (s.discipline && disciplines.indexOf(s.discipline) === -1) disciplines.push(s.discipline);
    if (s.distance && distances.indexOf(s.distance) === -1) distances.push(s.distance);
    if (s.lieu && lieux.indexOf(s.lieu) === -1) lieux.push(s.lieu);
  });
  distances.sort(function (a, b) { return a - b; });
  lieux.sort(function (a, b) { return a.localeCompare(b, 'fr'); });

  // Séances sélectionnables, de la plus récente à la plus ancienne.
  const seances = toutes.slice().sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  }).map(function (s) {
    return {
      id: s.id, date: s.date, seance: s.seance, lieu: s.lieu,
      discipline: s.discipline, distance: s.distance, score: s.score, max: s.max,
    };
  });

  const totalPoints = scores.reduce(function (t, s) { return t + s.score; }, 0);
  const totalFleches = scores.reduce(function (t, s) { return t + s.nbFleches; }, 0);
  const analyse = analyseParties_(scores);

  return {
    adherentId: String(adherentId),
    nbParties: scores.length,
    nbFleches: totalFleches,
    flechesDetaillees: flechesDetaillees,
    points: totalPoints,
    moyenneFleche: totalFleches ? Math.round((totalPoints / totalFleches) * 100) / 100 : 0,
    meilleurePartie: scores.reduce(function (best, s) {
      return !best || s.pourcentage > best.pourcentage ? s : best;
    }, null),
    zones: cumul,
    synthese: synthetiserZones_(cumul),
    impacts: impactsRecents,
    blasonReference: blasonReference,
    rayonReference: rayonReference,
    groupement: groupement_(impactsRecents, blasonReference),
    parties: parties,
    evolution: evolution,
    analyse: analyse,
    filtres: {
      disciplines: disciplines,
      distances: distances,
      lieux: lieux,
      seances: seances,
    },
  };
}

/* ---------- Analyse détaillée : partie par partie, volée par volée ---------- */

function arrondi_(v, d) {
  const f = Math.pow(10, d === undefined ? 2 : d);
  return Math.round(v * f) / f;
}

function moyenneListe_(valeurs) {
  const v = valeurs.filter(function (x) { return x !== null && x !== undefined && isFinite(x); });
  return v.length ? v.reduce(function (t, x) { return t + x; }, 0) / v.length : null;
}

function ecartType_(valeurs) {
  const m = moyenneListe_(valeurs);
  if (m === null || valeurs.length < 2) return null;
  return Math.sqrt(valeurs.reduce(function (t, x) { return t + (x - m) * (x - m); }, 0) / valeurs.length);
}

/**
 * Mesures d'une partie pour les graphiques : score, taux de 10 et de jaunes,
 * centrage et décalage du groupe (cm), périmètre et surface moyens des volées,
 * régularité (écart-type des volées), meilleure volée.
 */
function analysePartie_(s, volees) {
  const valeurs = [];
  volees.forEach(function (v) {
    v.fleches.forEach(function (f) { valeurs.push(f === 'M' ? 0 : Number(f)); });
  });
  const n = valeurs.length || s.nbFleches || 0;
  const compte = function (test) { return valeurs.filter(test).length; };
  const g = groupement_(s.impacts, s.blason);
  const pointees = volees.filter(function (v) { return v.groupement && v.groupement.nombre >= 2; });
  const totaux = volees.map(function (v) { return v.total; });
  const meilleure = volees.reduce(function (b, v) {
    return !b || v.total / (v.max || 1) > b.total / (b.max || 1) ? v : b;
  }, null);
  return {
    id: s.id, date: s.date, seance: s.seance, discipline: s.discipline, distance: s.distance,
    blason: s.blason, score: s.score, max: s.max, moyenne: s.moyenne, pct: s.pourcentage,
    nbFleches: n,
    dix: valeurs.length ? arrondi_(100 * compte(function (x) { return x === 10; }) / valeurs.length, 1) : null,
    jaunes: valeurs.length ? arrondi_(100 * compte(function (x) { return x >= 9; }) / valeurs.length, 1) : null,
    manquees: valeurs.length ? compte(function (x) { return x === 0; }) : null,
    ecartCentre: g ? g.ecartCentre : null,
    centreX: g ? g.centreX : null,
    centreY: g ? g.centreY : null,
    dispersion: g ? g.rayonMoyen : null,
    perimetre: pointees.length ? arrondi_(moyenneListe_(pointees.map(function (v) { return v.perimetre; })), 1) : null,
    aire: pointees.length ? arrondi_(moyenneListe_(pointees.map(function (v) { return v.aire; })), 1) : null,
    regularite: totaux.length >= 2 ? arrondi_(ecartType_(totaux), 2) : null,
    meilleureVolee: meilleure ? { numero: meilleure.numero, total: meilleure.total, max: meilleure.max } : null,
  };
}

/**
 * Analyse d'une sélection de parties : une ligne par partie (chronologique),
 * la moyenne par flèche selon le numéro de volée (mise en route, fatigue), et
 * les records.
 */
function analyseParties_(scores) {
  const numeros = [];
  const cumuler = function (table, i, valeur) {
    table[i] = table[i] || { points: 0, n: 0 };
    table[i].points += valeur;
    table[i].n++;
  };
  let meilleureVolee = null;
  const lignes = scores.map(function (s) {
    const volees = detailVolees_(s);
    volees.forEach(function (v, iv) {
      v.fleches.forEach(function (f) {
        cumuler(numeros, iv, f === 'M' ? 0 : Number(f));
      });
      if (!meilleureVolee || v.total / (v.max || 1) > meilleureVolee.total / (meilleureVolee.max || 1)) {
        meilleureVolee = { numero: v.numero, total: v.total, max: v.max, date: s.date, id: s.id };
      }
    });
    return analysePartie_(s, volees);
  });
  const serie = function (table) {
    const out = [];
    for (let i = 0; i < table.length; i++) {
      if (table[i]) out.push({ numero: i + 1, moyenne: arrondi_(table[i].points / table[i].n), n: table[i].n });
    }
    return out;
  };
  const moyennes = lignes.map(function (l) { return l.moyenne; });
  return {
    parties: lignes,
    parVolee: serie(numeros),
    meilleureVolee: meilleureVolee,
    regularite: moyennes.length >= 2 ? arrondi_(ecartType_(moyennes), 2) : null,
    ecartCentre: arrondi_(moyenneListe_(lignes.map(function (l) { return l.ecartCentre; })) || 0, 1),
    perimetre: arrondi_(moyenneListe_(lignes.map(function (l) { return l.perimetre; })) || 0, 1),
    aire: arrondi_(moyenneListe_(lignes.map(function (l) { return l.aire; })) || 0, 1),
    dix: arrondi_(moyenneListe_(lignes.map(function (l) { return l.dix; })) || 0, 1),
    jaunes: arrondi_(moyenneListe_(lignes.map(function (l) { return l.jaunes; })) || 0, 1),
  };
}

/** Statistiques d'un archer (soi-même, ou n'importe qui pour un encadrant). */
function apiStatistiques(jeton, adherentId, options) {
  const ctx = contexte_(jeton);
  const cible = String(adherentId || ctx.id);
  if (cible !== ctx.id && !ctx.voitScores) {
    return { ok: false, message: 'Statistiques réservées à l’archer et aux encadrants.' };
  }
  const stats = statistiquesArcher_(cible, options);
  const a = trouverAdherentParId_(cible);
  stats.archer = a ? a['Prénom'] + ' ' + a['Nom'] : '';
  stats.ok = true;
  return stats;
}

/** Statistiques d'une partie précise (détail volée par volée). */
function apiStatistiquesPartie(jeton, scoreId) {
  const ctx = contexte_(jeton);
  const r = trouverScoreParId_(scoreId);
  if (!r) return { ok: false, message: 'Partie introuvable.' };
  if (String(r['AdhérentID']) !== ctx.id && !ctx.voitScores) {
    return { ok: false, message: 'Consultation non autorisée.' };
  }
  const s = serialiserScore_(r);

  const volees = detailVolees_(s);
  return {
    ok: true,
    partie: s,
    volees: volees,
    synthese: s.avecZones ? synthetiserZones_(s.zones) : null,
    groupement: groupement_(s.impacts, s.blason),
  };
}

/**
 * Reconstitue les volées d'une partie : valeurs, impacts, total, moyenne,
 * périmètre et surface du groupe.
 *
 * La colonne « Détail des flèches » note les volées séparées par « | » et les
 * flèches par « - » (ex. « 10-9-8 | 7-M-6 ») : c'est ce découpage en deux
 * temps qui donne les volées, la liste des impacts suivant le même ordre.
 */
function detailVolees_(s) {
  const parVolee = s.parVolee || 6;
  const blocs = String(s.detail || '').split('|')
    .map(function (b) { return b.trim(); })
    .filter(function (b) { return b.length; });
  if (!blocs.length) return [];

  const volees = [];
  let curseur = 0;
  blocs.forEach(function (bloc, index) {
    const valeurs = bloc.split('-').map(function (v) {
      const t = String(v).trim().toUpperCase();
      if (t === 'M' || t === '') return 0;
      const n = Math.round(Number(t));
      return isNaN(n) ? 0 : Math.max(0, Math.min(POINTS_MAX_FLECHE, n));
    });
    const impacts = (s.impacts || []).slice(curseur, curseur + valeurs.length)
      .filter(function (p) { return p; });
    curseur += valeurs.length;

    const total = valeurs.reduce(function (t, x) { return t + x; }, 0);
    const g = groupement_(impacts, s.blason);
    volees.push({
      numero: index + 1,
      fleches: valeurs.map(function (v) { return v === 0 ? 'M' : String(v); }),
      nbFleches: valeurs.length,
      total: total,
      moyenne: valeurs.length ? Math.round((total / valeurs.length) * 100) / 100 : 0,
      max: valeurs.length * POINTS_MAX_FLECHE,
      impacts: impacts,
      groupement: g,
      perimetre: g ? g.perimetre : 0,
      aire: g ? g.aire : 0,
      centrage: g ? g.centrage : null,
    });
  });
  return volees;
}

/** Volées d'une partie, allégées pour les graphiques de la comparaison. */
function voleesPartieParId_(scoreId) {
  const r = trouverScoreParId_(scoreId);
  if (!r) return null;
  return detailVolees_(serialiserScore_(r)).map(function (v) {
    return {
      numero: v.numero, total: v.total, max: v.max, moyenne: v.moyenne, nbFleches: v.nbFleches,
      perimetre: v.groupement ? v.perimetre : null, aire: v.groupement ? v.aire : null,
      ecartCentre: v.groupement ? v.groupement.ecartCentre : null,
    };
  });
}

/**
 * Comparaison de deux archers, réservée à l'encadrement.
 *
 * Les deux profils sont calculés avec les mêmes filtres (période, discipline,
 * distance), sinon la comparaison n'aurait pas de sens. Les cartes d'impacts
 * sont ramenées au même blason de référence.
 */
function apiComparaison(jeton, idA, idB, options, optionsB) {
  const ctx = contexte_(jeton);
  // Scores partagés : n'importe quels archers, ou deux séances d'un même
  // archer. Sinon, un membre ne compare que ses propres séances.
  if (!ctx.voitScores) {
    idA = ctx.id;
    idB = ctx.id;
  }
  if (!idA || !idB) return { ok: false, message: 'Choisissez deux archers.' };
  const scoreA = String((options && options.scoreId) || '');
  const scoreB = String(((optionsB || options) && (optionsB || options).scoreId) || '');
  const memeSelection = String(idA) === String(idB) && scoreA === scoreB;

  const profil = function (id, filtres) {
    const a = trouverAdherentParId_(id);
    if (!a) return null;
    const stats = statistiquesArcher_(id, Object.assign({}, filtres || {}));
    return {
      id: String(id),
      nom: a['Prénom'] + ' ' + a['Nom'],
      categorie: String(a['Catégorie'] || ''),
      arme: String(a['Arme'] || ''),
      nbParties: stats.nbParties,
      nbFleches: stats.nbFleches,
      moyenneFleche: stats.moyenneFleche,
      meilleure: stats.meilleurePartie
        ? { date: stats.meilleurePartie.date, score: stats.meilleurePartie.score,
            max: stats.meilleurePartie.max, moyenne: stats.meilleurePartie.moyenne }
        : null,
      synthese: stats.synthese,
      groupement: stats.groupement,
      impacts: stats.impacts,
      blasonReference: stats.blasonReference,
      rayonReference: stats.rayonReference,
      evolution: stats.evolution,
      seances: stats.filtres.seances,
      partie: (filtres && filtres.scoreId && stats.parties.length === 1) ? stats.parties[0] : null,
      analyse: stats.analyse,
      volees: (filtres && filtres.scoreId && stats.parties.length === 1)
        ? voleesPartieParId_(filtres.scoreId) : null,
    };
  };

  // Chaque côté peut viser une séance différente : on compare par exemple le
  // concours de janvier d'un archer à celui de mars d'un autre.
  const a = profil(idA, options);
  const b = profil(idB, optionsB || options);
  if (!a || !b) return { ok: false, message: 'Archer introuvable.' };
  return { ok: true, a: a, b: b, memeSelection: memeSelection };
}
