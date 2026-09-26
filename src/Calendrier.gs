/**
 * Calendrier des séances et disponibilités des archers.
 *
 * Les séances ne sont pas saisies une à une : elles se déduisent des jours
 * d'entraînement du club (lundi et samedi par défaut, réglables dans l'onglet
 * Paramètres). Chaque archer répond Présent, Absent ou Peut-être ; l'onglet
 * Disponibilités conserve une ligne par archer et par date.
 */

/** Jours d'entraînement, au sens de Date.getDay(). */
function joursSeance_() {
  const brut = String(param_('Jours de séance', 'lundi, samedi')).toLowerCase();
  const jours = [];
  brut.split(/[,;]+/).forEach(function (nom) {
    const i = JOURS_NOMS.indexOf(nom.trim());
    if (i !== -1 && jours.indexOf(i) === -1) jours.push(i);
  });
  return jours.length ? jours.sort() : JOURS_SEANCE_DEFAUT;
}

/** Prochaines dates de séance, à partir d'aujourd'hui. */
function prochainesSeances_(semaines) {
  const jours = joursSeance_();
  const nb = Number(semaines) || toNumber_(param_('Semaines au calendrier', 8)) || 8;
  const debut = now_();
  debut.setHours(0, 0, 0, 0);

  const dates = [];
  for (let i = 0; i < nb * 7; i++) {
    const d = new Date(debut.getTime() + i * 86400000);
    if (jours.indexOf(d.getDay()) !== -1) dates.push(isoDate_(d));
  }
  return dates;
}

function reponsesParSeance_() {
  const index = {};
  readTable_(SHEETS.DISPONIBILITES).forEach(function (r) {
    const date = isoDate_(r['Date séance']);
    if (!date) return;
    if (!index[date]) index[date] = [];
    index[date].push({
      _row: r._row,
      adherentId: String(r['AdhérentID'] || ''),
      archer: String(r['Archer'] || ''),
      reponse: String(r['Réponse'] || ''),
      commentaire: String(r['Commentaire'] || ''),
    });
  });
  return index;
}

/**
 * Calendrier vu par l'archer connecté : chaque séance porte sa propre réponse
 * et, pour l'encadrement, le détail des participants.
 */
function apiCalendrier(jeton, semaines) {
  const ctx = contexte_(jeton);
  if (!ongletPresent_(SHEETS.DISPONIBILITES)) {
    return {
      ok: false,
      message: 'Le calendrier n’est pas encore installé : ouvrez le classeur et ' +
        'lancez « 🏹 Tir à l’arc ▸ Installer / réparer ».',
    };
  }
  const dates = prochainesSeances_(semaines);
  const index = reponsesParSeance_();

  // Effectif de référence : les archers actifs, pour savoir qui n'a pas répondu.
  const actifs = readTable_(SHEETS.ADHERENTS).filter(function (r) {
    return String(r['Statut'] || 'Actif') !== 'Inactif';
  }).map(function (r) {
    return {
      id: String(r['ID']), nom: r['Prénom'] + ' ' + r['Nom'],
      categorie: String(r['Catégorie'] || ''), arme: String(r['Arme'] || ''),
    };
  }).sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); });

  const seances = dates.map(function (date) {
    const reponses = index[date] || [];
    const mienne = reponses.filter(function (r) { return r.adherentId === ctx.id; })[0];
    const compter = function (valeur) {
      return reponses.filter(function (r) { return r.reponse === valeur; }).length;
    };
    const jour = parseDate_(date);

    return {
      date: date,
      jour: JOURS_NOMS[jour ? jour.getDay() : 0],
      maReponse: mienne ? mienne.reponse : '',
      monCommentaire: mienne ? mienne.commentaire : '',
      presents: compter('Présent'),
      absents: compter('Absent'),
      peutEtre: compter('Peut-être'),
      sansReponse: Math.max(0, actifs.length - reponses.filter(function (r) {
        return actifs.some(function (a) { return a.id === r.adherentId; });
      }).length),
      // Le détail nominatif reste réservé à l'encadrement.
      participants: ctx.estEncadrant
        ? reponses.map(function (r) {
            return { archer: r.archer, reponse: r.reponse, commentaire: r.commentaire };
          }).sort(function (a, b) { return a.archer.localeCompare(b.archer, 'fr'); })
        : null,
    };
  });

  // Récapitulatif de l'encadrement : un tableau archers × séances, pour voir
  // d'un coup d'œil qui sera là et qui n'a pas répondu.
  let recap = null;
  if (ctx.estEncadrant) {
    recap = {
      dates: seances.map(function (s) {
        return {
          date: s.date, jour: s.jour, presents: s.presents, absents: s.absents,
          peutEtre: s.peutEtre, sansReponse: s.sansReponse,
        };
      }),
      archers: actifs.map(function (a) {
        return {
          id: a.id, nom: a.nom, categorie: a.categorie, arme: a.arme,
          reponses: dates.map(function (d) {
            const r = (index[d] || []).filter(function (x) { return x.adherentId === a.id; })[0];
            return r ? { reponse: r.reponse, commentaire: r.commentaire } : null;
          }),
        };
      }),
    };
  }

  return {
    ok: true, seances: seances, reponses: REPONSES,
    estEncadrant: ctx.estEncadrant, effectif: actifs.length, recap: recap,
  };
}

/** Enregistre ou met à jour sa réponse pour une séance. */
function apiRepondreCalendrier(jeton, date, reponse, commentaire) {
  const ctx = contexte_(jeton);
  const jour = parseDate_(date);
  if (!jour) return { ok: false, message: 'Date de séance invalide.' };
  if (reponse && REPONSES.indexOf(reponse) === -1) {
    return { ok: false, message: 'Réponse inconnue.' };
  }

  const iso = isoDate_(jour);
  const existante = readTable_(SHEETS.DISPONIBILITES).filter(function (r) {
    return isoDate_(r['Date séance']) === iso && String(r['AdhérentID']) === ctx.id;
  })[0];

  // Une réponse vide efface la ligne : l'archer n'a simplement pas répondu.
  if (!reponse) {
    if (existante) deleteRow_(SHEETS.DISPONIBILITES, existante._row);
    return { ok: true, message: 'Réponse retirée.' };
  }

  const donnees = {
    'Date séance': jour,
    'AdhérentID': ctx.id,
    'Archer': ctx.nom,
    'Réponse': reponse,
    'Commentaire': String(commentaire || ''),
    'Modifié le': now_(),
  };

  if (existante) {
    updateObject_(SHEETS.DISPONIBILITES, existante._row, donnees);
  } else {
    donnees['ID'] = uid_('DIS');
    appendObject_(SHEETS.DISPONIBILITES, donnees);
  }
  log_('disponibilite', { date: iso, reponse: reponse }, ctx.id);
  return { ok: true, message: 'Réponse enregistrée pour le ' + iso + '.' };
}
