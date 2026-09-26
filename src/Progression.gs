/**
 * Progression d'un archer : records par discipline, moyennes, tendance,
 * courbe d'évolution et liste des cartons.
 */

/**
 * Synthèse complète pour la page « Progression ».
 * Renvoie les records par discipline, les séries chronologiques et les cartons.
 */
function calculerProgression_(adherentId) {
  if (!trouverAdherentParId_(adherentId)) return null;

  const scores = readTable_(SHEETS.SCORES)
    .filter(function (r) { return String(r['AdhérentID']) === String(adherentId); })
    .map(serialiserScore_)
    .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

  const parDiscipline = {};
  scores.forEach(function (s) {
    const d = s.discipline || '—';
    if (!parDiscipline[d]) {
      parDiscipline[d] = {
        discipline: d, nb: 0, meilleur: 0, meilleurMax: 0, meilleurDate: '',
        meilleureMoyenne: 0, sommePoints: 0, sommeFleches: 0, serie: [],
      };
    }
    const e = parDiscipline[d];
    e.nb++;
    e.sommePoints += s.score;
    e.sommeFleches += s.nbFleches;
    e.serie.push({
      date: s.date, score: s.score, max: s.max, moyenne: s.moyenne,
      pct: s.pourcentage, distance: s.distance,
    });
    if (s.moyenne > e.meilleureMoyenne) {
      e.meilleur = s.score;
      e.meilleurMax = s.max;
      e.meilleurDate = s.date;
      e.meilleureMoyenne = s.moyenne;
    }
  });

  const disciplines = Object.keys(parDiscipline).map(function (k) {
    const e = parDiscipline[k];
    e.moyenne = e.sommeFleches ? Math.round((e.sommePoints / e.sommeFleches) * 100) / 100 : 0;
    delete e.sommePoints;
    delete e.sommeFleches;

    // Tendance, en points par flèche : 5 dernières sorties contre les 5 d'avant.
    const serie = e.serie;
    const n = serie.length;
    if (n >= 4) {
      const recent = serie.slice(Math.max(0, n - 5));
      const avant = serie.slice(Math.max(0, n - 10), Math.max(0, n - 5));
      if (avant.length) {
        const moy = function (arr) {
          return arr.reduce(function (t, x) { return t + x.moyenne; }, 0) / arr.length;
        };
        e.tendance = Math.round((moy(recent) - moy(avant)) * 100) / 100;
      }
    }
    return e;
  }).sort(function (a, b) { return b.nb - a.nb; });

  const total = scores.length;
  const trenteJours = new Date(now_().getTime() - 30 * 86400000);
  const recents = scores.filter(function (s) {
    const d = parseDate_(s.date);
    return d && d >= trenteJours;
  });

  // Meilleure séance de chaque discipline : elle porte l'étoile dans la liste.
  const meilleures = {};
  scores.forEach(function (s) {
    const d = s.discipline || '—';
    if (!meilleures[d] || s.moyenne > meilleures[d].moyenne) {
      meilleures[d] = { id: s.id, moyenne: s.moyenne };
    }
  });

  // Séances proposées dans le menu déroulant de la page Progression.
  const seances = scores.slice().reverse().slice(0, 80).map(function (s) {
    const g = (s.impacts || []).length ? groupement_(s.impacts, s.blason) : null;
    return {
      id: s.id, date: s.date, seance: s.seance, lieu: s.lieu,
      discipline: s.discipline, distance: s.distance, blason: s.blason,
      contexte: s.contexte, score: s.score, max: s.max,
      moyenne: s.moyenne,
      centrage: g ? g.centrage : null,
      perimetre: g ? g.perimetre : 0,
      avecImpacts: (s.impacts || []).length > 0,
      meilleure: !!(meilleures[s.discipline || '—'] &&
        meilleures[s.discipline || '—'].id === s.id),
    };
  });

  const points = scores.reduce(function (t, s) { return t + s.score; }, 0);
  const fleches = scores.reduce(function (t, s) { return t + s.nbFleches; }, 0);

  return {
    adherentId: String(adherentId),
    nbScores: total,
    nbScores30j: recents.length,
    volumeFleches: fleches,
    moyenneFleche: fleches ? Math.round((points / fleches) * 100) / 100 : 0,
    derniereSortie: total ? scores[total - 1].date : '',
    evolution: scores.filter(function (s) { return s.nbFleches; }).map(function (s) {
      return {
        date: s.date, moyenne: s.moyenne, score: s.score, max: s.max,
        seance: s.seance || s.discipline, lieu: s.lieu,
      };
    }),
    disciplines: disciplines,
    seances: seances,
  };
}

/**
 * Classement du club sur une discipline (meilleur pourcentage par archer).
 * Il expose les résultats de tous les archers : encadrement uniquement.
 */
function apiClassement(jeton, discipline) {
  contexte_(jeton);           // classement visible par tous les membres
  const scores = readTable_(SHEETS.SCORES).map(serialiserScore_)
    .filter(function (s) { return !discipline || s.discipline === discipline; });

  const parArcher = {};
  scores.forEach(function (s) {
    const cle = s.adherentId;
    if (!parArcher[cle] || s.pourcentage > parArcher[cle].pourcentage) {
      parArcher[cle] = {
        adherentId: cle, archer: s.archer, score: s.score, max: s.max,
        pourcentage: s.pourcentage, date: s.date, discipline: s.discipline,
      };
    }
  });
  const liste = Object.keys(parArcher).map(function (k) { return parArcher[k]; });
  liste.sort(function (a, b) { return b.pourcentage - a.pourcentage; });
  return { ok: true, classement: liste.slice(0, 30) };
}

/**
 * Progression d'un archer : la sienne pour un membre, celle de n'importe quel
 * archer pour l'encadrement.
 */
function apiProgression(jeton, adherentId) {
  const ctx = contexte_(jeton);
  const cible = String(adherentId || ctx.id);
  if (cible !== ctx.id && !ctx.voitScores) {
    return { ok: false, message: 'Vous n’avez accès qu’à votre propre progression.' };
  }
  const a = trouverAdherentParId_(cible);
  if (!a) return { ok: false, message: 'Archer introuvable.' };
  return {
    ok: true,
    archer: a['Prénom'] + ' ' + a['Nom'],
    adherentId: cible,
    progression: calculerProgression_(cible),
  };
}

/**
 * Progression du club entier : toutes les parties, tous archers confondus.
 * Réservée à l'encadrement — c'est la vue « Tous les archers » de la page
 * Progression. Les séances issues d'une mini-compétition y figurent une fois
 * par participant, comme dans la progression individuelle.
 */
function apiProgressionClub(jeton) {
  const ctx = contexte_(jeton);
  if (!ctx.voitScores) {
    return { ok: false, message: 'Vue réservée à l’encadrement du club.' };
  }

  const scores = readTable_(SHEETS.SCORES).map(serialiserScore_)
    .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });

  const parDiscipline = {};
  scores.forEach(function (s) {
    const d = s.discipline || '—';
    if (!parDiscipline[d]) {
      parDiscipline[d] = {
        discipline: d, nb: 0, sommePoints: 0, sommeFleches: 0,
        meilleur: 0, meilleurMax: 0, meilleurDate: '', meilleurArcher: '', meilleureMoyenne: 0,
      };
    }
    const e = parDiscipline[d];
    e.nb++;
    e.sommePoints += s.score;
    e.sommeFleches += s.nbFleches;
    if (s.moyenne > e.meilleureMoyenne) {
      e.meilleureMoyenne = s.moyenne;
      e.meilleur = s.score;
      e.meilleurMax = s.max;
      e.meilleurDate = s.date;
      e.meilleurArcher = s.archer;
    }
  });

  const disciplines = Object.keys(parDiscipline).map(function (k) {
    const e = parDiscipline[k];
    e.moyenne = e.sommeFleches ? Math.round((e.sommePoints / e.sommeFleches) * 100) / 100 : 0;
    delete e.sommePoints;
    delete e.sommeFleches;
    return e;
  }).sort(function (a, b) { return b.nb - a.nb; });

  // Meilleure séance de chaque archer : elle porte l'étoile dans la liste.
  const meilleures = {};
  scores.forEach(function (s) {
    const cle = s.adherentId;
    if (!meilleures[cle] || s.moyenne > meilleures[cle].moyenne) {
      meilleures[cle] = { id: s.id, moyenne: s.moyenne };
    }
  });

  const seances = scores.slice().reverse().slice(0, 120).map(function (s) {
    const g = (s.impacts || []).length ? groupement_(s.impacts, s.blason) : null;
    return {
      id: s.id, date: s.date, seance: s.seance, lieu: s.lieu, archer: s.archer,
      adherentId: s.adherentId, discipline: s.discipline, distance: s.distance,
      blason: s.blason, contexte: s.contexte, score: s.score, max: s.max,
      moyenne: s.moyenne, centrage: g ? g.centrage : null,
      avecImpacts: (s.impacts || []).length > 0,
      meilleure: !!(meilleures[s.adherentId] && meilleures[s.adherentId].id === s.id),
    };
  });

  const points = scores.reduce(function (t, s) { return t + s.score; }, 0);
  const fleches = scores.reduce(function (t, s) { return t + s.nbFleches; }, 0);
  const archers = [];
  scores.forEach(function (s) {
    if (s.adherentId && archers.indexOf(s.adherentId) === -1) archers.push(s.adherentId);
  });

  return {
    ok: true,
    club: true,
    archer: 'Tous les archers',
    progression: {
      club: true,
      nbScores: scores.length,
      nbArchers: archers.length,
      volumeFleches: fleches,
      moyenneFleche: fleches ? Math.round((points / fleches) * 100) / 100 : 0,
      derniereSortie: scores.length ? scores[scores.length - 1].date : '',
      evolution: evolutionParDate_(scores),
      disciplines: disciplines,
      seances: seances,
    },
  };
}

/** Moyenne du club jour par jour, toutes parties confondues. */
function evolutionParDate_(scores) {
  const parDate = {};
  const ordre = [];
  scores.forEach(function (s) {
    if (!s.nbFleches || !s.date) return;
    if (!parDate[s.date]) {
      parDate[s.date] = { date: s.date, points: 0, fleches: 0, parties: 0 };
      ordre.push(s.date);
    }
    const j = parDate[s.date];
    j.points += s.score;
    j.fleches += s.nbFleches;
    j.parties++;
  });
  return ordre.sort().map(function (d) {
    const j = parDate[d];
    return {
      date: d,
      moyenne: Math.round((j.points / j.fleches) * 100) / 100,
      score: j.points,
      max: j.fleches * POINTS_MAX_FLECHE,
      seance: j.parties + ' partie' + (j.parties > 1 ? 's' : ''),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Classement du club                                                   */
/* ------------------------------------------------------------------ */

/** Poids des critères dans l'indice général (sur 100). */
const POIDS_CLASSEMENT = {
  moyenne: 40, meilleurScore: 20, centrage: 15, perimetre: 10, fleches: 10, parties: 5,
};

/**
 * Tous les indicateurs de chaque archer actif, sur les parties retenues par
 * les filtres. Le navigateur trie ensuite selon le critère choisi, sans
 * nouvel appel au serveur. Centrage et périmètre sont en centimètres : écart
 * entre le centre du groupe et le centre de la cible, longueur de la
 * « ficelle » autour des flèches d'une volée.
 * `filtres` : { discipline, distance, periode (jours), arme, categorie, minParties }
 */
function apiClassementClub(jeton, filtres) {
  const ctx = contexte_(jeton);
  const f = filtres || {};
  const depuis = Number(f.periode)
    ? isoDate_(new Date(now_().getTime() - Number(f.periode) * 86400000)) : '';
  const arrondi = function (v, n) { const p = Math.pow(10, n || 0); return Math.round(v * p) / p; };
  const moyenneDe = function (t) { return t.reduce(function (x, y) { return x + y; }, 0) / t.length; };

  const archers = {};
  readTable_(SHEETS.ADHERENTS).forEach(function (r) {
    if (String(r['Statut'] || 'Actif') === 'Inactif') return;
    if (f.arme && String(r['Arme']) !== f.arme) return;
    if (f.categorie && String(r['Catégorie']) !== f.categorie) return;
    archers[String(r['ID'])] = {
      id: String(r['ID']), nom: r['Prénom'] + ' ' + r['Nom'],
      categorie: String(r['Catégorie'] || ''), arme: String(r['Arme'] || ''),
      fleches: 0, points: 0, dix: 0, moyennes: [], ecarts: [], perimetres: [], liste: [],
      meilleurScore: null, meilleureVolee: null, meilleurCentrage: null, meilleurPerimetre: null,
    };
  });

  readTable_(SHEETS.SCORES).map(serialiserScore_).forEach(function (s) {
    const a = archers[s.adherentId];
    if (!a || !s.nbFleches) return;
    if (f.discipline && s.discipline !== f.discipline) return;
    if (f.distance && s.distance !== Number(f.distance)) return;
    if (depuis && s.date < depuis) return;

    const partie = { id: s.id, date: s.date, seance: s.seance || s.discipline, blason: s.blason };
    a.fleches += s.nbFleches;
    a.points += s.score;
    a.dix += s.dix;
    a.moyennes.push(s.moyenne);
    if (!a.meilleurScore || s.pourcentage > a.meilleurScore.pct) {
      a.meilleurScore = Object.assign({ score: s.score, max: s.max, pct: s.pourcentage }, partie);
    }

    const perimetresPartie = [];
    detailVolees_(s).forEach(function (v) {
      if (v.nbFleches) {
        const pct = arrondi((v.total / v.max) * 100, 1);
        if (!a.meilleureVolee || pct > a.meilleureVolee.pct ||
            (pct === a.meilleureVolee.pct && v.total > a.meilleureVolee.total)) {
          a.meilleureVolee = Object.assign({ total: v.total, max: v.max, pct: pct, volee: v.numero }, partie);
        }
      }
      if (v.impacts.length >= 3 && v.perimetre) {
        perimetresPartie.push(v.perimetre);
        a.perimetres.push(v.perimetre);
        if (!a.meilleurPerimetre || v.perimetre < a.meilleurPerimetre.cm) {
          a.meilleurPerimetre = Object.assign({ cm: v.perimetre, volee: v.numero }, partie);
        }
      }
    });

    let ecart = null;
    if ((s.impacts || []).length) {
      const g = groupement_(s.impacts, s.blason);
      if (g) {
        ecart = g.ecartCentre;
        a.ecarts.push(ecart);
        if (!a.meilleurCentrage || ecart < a.meilleurCentrage.cm) {
          a.meilleurCentrage = Object.assign({ cm: ecart }, partie);
        }
      }
    }

    a.liste.push(Object.assign({
      score: s.score, max: s.max, moyenne: s.moyenne, fleches: s.nbFleches, dix: s.dix,
      ecart: ecart,
      perimetre: perimetresPartie.length ? arrondi(moyenneDe(perimetresPartie), 1) : null,
    }, partie));
  });

  const minParties = Math.max(1, Number(f.minParties) || 1);
  const lignes = Object.keys(archers).map(function (k) { return archers[k]; })
    .filter(function (a) { return a.liste.length >= minParties; })
    .map(function (a) {
      let regularite = null;
      if (a.moyennes.length >= 3) {
        const m = moyenneDe(a.moyennes);
        regularite = arrondi(Math.sqrt(moyenneDe(a.moyennes.map(function (x) { return (x - m) * (x - m); }))), 2);
      }
      a.liste.sort(function (x, y) { return x.date < y.date ? 1 : x.date > y.date ? -1 : 0; });
      return {
        id: a.id, nom: a.nom, categorie: a.categorie, arme: a.arme, moi: a.id === ctx.id,
        parties: a.liste.length, fleches: a.fleches, points: a.points,
        moyenne: arrondi(a.points / a.fleches, 2),
        tauxDix: arrondi((a.dix / a.fleches) * 100, 1),
        meilleurScore: a.meilleurScore,
        meilleureVolee: a.meilleureVolee,
        meilleurCentrage: a.meilleurCentrage,
        centrageMoyen: a.ecarts.length ? arrondi(moyenneDe(a.ecarts), 1) : null,
        meilleurPerimetre: a.meilleurPerimetre,
        perimetreMoyen: a.perimetres.length ? arrondi(moyenneDe(a.perimetres), 1) : null,
        regularite: regularite,
        liste: a.liste,
      };
    });

  // Indice général : chaque critère est rapporté au meilleur du club, puis
  // pondéré. Pour le centrage et le périmètre, le plus petit écart gagne.
  // Un archer qui ne pointe pas ses flèches n'est pas pénalisé : ces deux
  // critères sont alors retirés de son calcul.
  const criteres = [
    { poids: POIDS_CLASSEMENT.moyenne, lire: function (l) { return l.moyenne; } },
    { poids: POIDS_CLASSEMENT.meilleurScore, lire: function (l) { return l.meilleurScore && l.meilleurScore.pct; } },
    { poids: POIDS_CLASSEMENT.centrage, lire: function (l) { return l.centrageMoyen; }, petitMieux: true, facultatif: true },
    { poids: POIDS_CLASSEMENT.perimetre, lire: function (l) { return l.perimetreMoyen; }, petitMieux: true, facultatif: true },
    { poids: POIDS_CLASSEMENT.fleches, lire: function (l) { return l.fleches; } },
    { poids: POIDS_CLASSEMENT.parties, lire: function (l) { return l.parties; } },
  ];
  criteres.forEach(function (c) {
    const v = lignes.map(c.lire).filter(function (x) { return x !== null && x !== undefined; });
    if (!v.length) { c.reference = null; return; }
    // Un écart de 0 cm donnerait une division par zéro : plancher à 0,5 cm.
    c.reference = c.petitMieux ? Math.max(0.5, Math.min.apply(null, v)) : Math.max.apply(null, v);
  });
  lignes.forEach(function (l) {
    let somme = 0;
    let poids = 0;
    criteres.forEach(function (c) {
      const v = c.lire(l);
      if (v === null || v === undefined) {
        if (c.facultatif) return;
        poids += c.poids;
        return;
      }
      if (!c.reference) { poids += c.poids; return; }
      somme += c.poids * (c.petitMieux ? c.reference / Math.max(0.5, v) : v / c.reference);
      poids += c.poids;
    });
    l.indice = poids ? arrondi((somme / poids) * 100, 1) : 0;
  });

  return { ok: true, archers: lignes, poids: POIDS_CLASSEMENT, depuis: depuis };
}
