/* Classeur de démonstration : archers fictifs, parties, messages, calendrier. */
(function () {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const onglet = function (nom, entetes) { const f = ss.insertSheet(nom); f.appendRow(entetes); return f; };
  const ajouter = function (nom, entetes, obj) {
    ss.getSheetByName(nom).appendRow(entetes.map(function (h) { return obj[h] === undefined ? '' : obj[h]; }));
  };

  onglet(SHEETS.ADHERENTS, COL_ADHERENTS);
  onglet(SHEETS.SCORES, COL_SCORES);
  onglet(SHEETS.UTILISATEURS, COL_UTILISATEURS);
  onglet(SHEETS.DISPONIBILITES, COL_DISPONIBILITES);
  onglet(SHEETS.MESSAGES, COL_MESSAGES);
  onglet(SHEETS.COMPETITIONS, COL_COMPETITIONS);
  const params = onglet(SHEETS.PARAMETRES, ['Paramètre', 'Valeur', 'Description']);
  onglet(SHEETS.JOURNAL, ['Horodatage', 'Acteur', 'Action', 'Détails']);
  PARAMETRES_DEFAUT.forEach(function (p) {
    const v = p[0] === 'Nom du club' ? 'Arc Club Luchonnais'
      : p[0] === 'Email de contact' ? 'contact@club-exemple.fr'
      : p[0] === 'URL de l’application' ? 'https://p69gp84gk7-arch.github.io/T1r4l4rc5c0r3/' : p[1];
    params.appendRow([p[0], v, p[2]]);
  });

  // Générateur pseudo-aléatoire reproductible : les captures restent identiques.
  let graine = 20261016;
  const alea = function () { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
  const gauss = function () { let u = 0; for (let i = 0; i < 6; i++) u += alea(); return u - 3; };

  const AUJ = new Date(2026, 9, 16, 18, 30);
  const jour = function (n) { const d = new Date(AUJ.getTime() - n * 86400000); d.setHours(18, 0, 0, 0); return d; };
  const futur = function (n) { const d = new Date(AUJ.getTime() + n * 86400000); d.setHours(0, 0, 0, 0); return d; };

  const ARCHERS = [
    ['A01', 'ROUSSEL', 'Hélène', 'F', '1971-03-12', 'S3', 'Arc classique', 'Admin', 'Payée', 'Actif', 300],
    ['A02', 'DELAGE', 'Marc', 'H', '1982-07-02', 'S2', 'Arc à poulies', 'Encadrant', 'Payée', 'Actif', 200],
    ['A03', 'FONTAINE', 'Camille', 'F', '1996-05-21', 'S1', 'Arc classique', 'Membre', 'Payée', 'Actif', 200],
    ['A04', 'MOREAU', 'Lucas', 'H', '2012-09-14', 'U15', 'Arc classique', 'Membre', 'Payée', 'Actif', 20],
    ['A05', 'BARTHE', 'Inès', 'F', '2009-01-30', 'U18', 'Arc classique', 'Membre', 'Payée', 'Actif', 150],
    ['A06', 'PEYRE', 'Julien', 'H', '1988-11-08', 'S2', 'Arc nu', 'Membre', 'Partielle', 'Actif', 90],
    ['A07', 'LACOSTE', 'Sophie', 'F', '1968-04-17', 'S3', 'Arc classique', 'Membre', 'Payée', 'Actif', 250],
    ['A08', 'GARCIA', 'Thomas', 'H', '2014-06-03', 'U13', 'Arc classique', 'Membre', 'Payée', 'Actif', 60],
    ['A09', 'SOULÉ', 'Nathalie', 'F', '1985-02-11', 'S2', 'Arc à poulies', 'Membre', 'Impayée', 'Actif', 8],
    ['A10', 'DUCLOS', 'Paul', 'H', '1999-08-25', 'S1', 'Arc classique', 'Membre', 'Impayée', 'En attente', 330],
    ['A11', 'MARTY', 'Léo', 'H', '2016-12-01', 'U11', 'Arc droit', 'Membre', 'Payée', 'Actif', 120],
    ['A12', 'CARRÈRE', 'Émilie', 'F', '1993-10-05', 'S1', 'Arc classique', 'Membre', 'Exonérée', 'Actif', 280],
  ];
  ARCHERS.forEach(function (a, i) {
    const jeune = /^U/.test(a[5]);
    ajouter(SHEETS.ADHERENTS, COL_ADHERENTS, {
      'ID': a[0], 'Nom': a[1], 'Prénom': a[2], 'Sexe': a[3], 'Date de naissance': new Date(a[4]),
      'Catégorie': a[5], 'Arme': a[6], 'N° licence': String(812340 + i * 7) + 'K',
      'Type de licence': jeune ? 'Jeune compétition' : 'Adulte compétition', 'Saison': '2026-2027',
      'Email': a[2].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '@exemple.fr',
      'Téléphone': '06 12 34 ' + (10 + i) + ' ' + (40 + i),
      // Certificat daté : son âge (jours) dit s'il approche de l'expiration.
      'Certificat médical': jour(a[10]), 'Cotisation': a[8],
      'Montant cotisation': jeune ? 60 : 100, 'Rôle': a[7], 'Statut': a[9],
      'Créé le': jour(400), 'Modifié le': jour(30),
    });
    ajouter(SHEETS.UTILISATEURS, COL_UTILISATEURS, {
      'Identifiant': identifiantPour_(a[1], a[2]), 'AdhérentID': a[0], 'Nom': a[1], 'Prénom': a[2],
      // Mots de passe déjà personnalisés, sauf pour l'archer en attente.
      'Mot de passe': a[0] === 'A10' ? MOT_DE_PASSE_DEFAUT : 'Fleche2026!',
      'Statut': 'Actif', 'Dernière connexion': jour(i), 'Messages lus le': jour(3),
    });
  });

  // --- Parties ---
  const LIEUX = ['Gymnase de Luchon', 'Terrain des Thermes'];
  function partie(id, adh, ilYa, o) {
    const nv = o.nv || 10, pv = o.pv || 3, blason = o.blason || '40 cm';
    const fl = [], imp = [];
    for (let v = 0; v < nv; v++) {
      for (let f = 0; f < pv; f++) {
        const x = Math.round((o.dx + gauss() * o.sig) * 10) / 10;
        const y = Math.round((o.dy + gauss() * o.sig) * 10) / 10;
        fl.push(valeurPourPoint_(x, y, blason));
        imp.push(x + ':' + y);
      }
    }
    const z = compterZones_(fl);
    const score = fl.reduce(function (t, x) { return t + x; }, 0);
    const a = ARCHERS.filter(function (r) { return r[0] === adh; })[0];
    const ligne = {
      'ID': id, 'Date': jour(ilYa), 'AdhérentID': adh, 'Archer': a[2] + ' ' + a[1],
      'Séance': o.seance || (o.discipline === 'Tir en extérieur (TAE)' ? 'Entraînement extérieur' : 'Entraînement salle'),
      'Discipline': o.discipline || 'Salle', 'Distance': o.distance || 18, 'Blason': blason,
      'Nb volées': nv, 'Flèches par volée': pv, 'Nb flèches': fl.length, 'Score': score, 'Max': fl.length * 10,
      'Moyenne par flèche': Math.round((score / fl.length) * 100) / 100,
      'Détail des flèches': detailFleches_(fl, pv), 'Impacts (cm)': imp.join(','),
      'Contexte': o.contexte || 'Entraînement', 'Lieu': o.lieu || LIEUX[0],
      'Saisi par': a[2] + ' ' + a[1], 'Créé le': jour(ilYa),
    };
    ZONES.forEach(function (v) { ligne[colonneZone_(v)] = z[v]; });
    ajouter(SHEETS.SCORES, COL_SCORES, ligne);
  }

  // Camille : une progression nette, le groupe se resserre et se recentre.
  const datesCamille = [96, 89, 82, 75, 68, 61, 54, 47, 40, 33, 26, 19, 12, 5, 2];
  datesCamille.forEach(function (j, k) {
    const ext = k === 3 || k === 7;
    partie('SC' + k, 'A03', j, {
      dx: 3.2 - k * 0.19, dy: -2.0 + k * 0.12, sig: ext ? 8.5 - k * 0.25 : 5.4 - k * 0.14,
      discipline: ext ? 'Tir en extérieur (TAE)' : 'Salle', distance: ext ? 30 : 18,
      blason: ext ? '80 cm' : '40 cm', nv: ext ? 6 : 10, pv: ext ? 6 : 3,
      lieu: ext ? LIEUX[1] : LIEUX[0],
      contexte: k === 11 ? 'Concours club' : 'Entraînement',
      seance: k === 11 ? 'Concours interne d’automne' : undefined,
    });
  });
  // Les autres archers, pour le classement et les comparaisons.
  const profils = {
    A01: [1.0, 0.5, 2.6, 8], A02: [-0.5, 0.4, 2.1, 9], A04: [3.5, 2.5, 5.0, 6], A05: [1.4, -1.0, 3.0, 8],
    A06: [-2.5, 1.5, 4.2, 5], A07: [0.8, 1.6, 3.4, 7], A08: [4.0, -3.0, 5.6, 5], A09: [1.0, 1.0, 2.8, 3],
    A11: [5.0, 3.0, 6.5, 4], A12: [-1.2, -0.6, 2.9, 7],
  };
  Object.keys(profils).forEach(function (id) {
    const p = profils[id];
    for (let k = 0; k < p[3]; k++) {
      partie('S' + id + k, id, 90 - k * 11 + (id.charCodeAt(2) % 4), {
        dx: p[0] - k * 0.1, dy: p[1], sig: p[2] * 1.7 - k * 0.1, distance: /A0[48]|A11/.test(id) ? 15 : 18,
        blason: /A0[48]|A11/.test(id) ? '60 cm' : '40 cm',
      });
    }
  });

  // --- Calendrier : réponses aux prochaines séances ---
  const prochaines = [];
  for (let i = 0; i < 21; i++) {
    const d = futur(i);
    if ([1, 6].indexOf(d.getDay()) !== -1) prochaines.push(d);
  }
  const reponses = [
    ['A01', 'Présent'], ['A02', 'Présent'], ['A04', 'Présent'], ['A05', 'Peut-être'],
    ['A06', 'Absent'], ['A07', 'Présent'], ['A12', 'Présent'], ['A08', 'Présent'],
  ];
  prochaines.slice(0, 3).forEach(function (d, k) {
    reponses.forEach(function (r, i) {
      if ((i + k) % 4 === 3) return;
      const a = ARCHERS.filter(function (x) { return x[0] === r[0]; })[0];
      ajouter(SHEETS.DISPONIBILITES, COL_DISPONIBILITES, {
        'ID': 'D' + k + i, 'Date séance': d, 'AdhérentID': r[0], 'Archer': a[2] + ' ' + a[1],
        'Réponse': r[1], 'Modifié le': jour(1),
      });
    });
  });

  // --- Messages ---
  const msg = function (id, ilYaH, auteur, nom, texte, dest) {
    ajouter(SHEETS.MESSAGES, COL_MESSAGES, {
      'ID': id, 'Horodatage': new Date(AUJ.getTime() - ilYaH * 3600000), 'AuteurID': auteur, 'Auteur': nom,
      'Portée': dest ? 'Privé' : 'Club', 'Destinataire': dest || '', 'Texte': texte, 'Épinglé': 'NON',
    });
  };
  msg('M1', 150, 'A01', 'Hélène ROUSSEL', 'Bienvenue sur l’espace archers ! Vos scores, le calendrier et les messages du club sont maintenant au même endroit.');
  msg('M2', 52, 'A02', 'Marc DELAGE', 'Samedi : travail sur la régularité, volées de 3 flèches à 18 m. Pensez à noter vos parties dans l’onglet Score.');
  msg('M3', 26, 'A01', 'Hélène ROUSSEL', 'Concours salle le 8 novembre. Inscriptions auprès de Marc avant le 25 octobre.');
  msg('M4', 5, 'A02', 'Marc DELAGE', 'Camille, ton groupement s’est bien resserré ce mois-ci. On regarde ton décalage à droite samedi ?', 'A03');
  msg('M5', 3, 'A03', 'Camille FONTAINE', 'Avec plaisir, à samedi !', 'A02');
})();
