/**
 * Installation et maintenance du classeur : création des onglets, entêtes,
 * listes déroulantes, mises en forme, comptes utilisateurs et données de départ.
 *
 * `installer()` est idempotent : on peut le relancer après une mise à jour
 * sans perdre les données saisies.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🏹 Tir à l’arc')
    .addItem('Installer / réparer le classeur', 'installer')
    .addItem('Créer le compte administrateur…', 'menuCreerAdmin')
    .addSeparator()
    .addItem('Créer les comptes des inscrits', 'menuCreerComptes')
    .addItem('Réinitialiser un mot de passe…', 'menuReinitialiserMotDePasse')
    .addItem('Recalculer les catégories d’âge', 'menuRecalculerCategories')
    .addSeparator()
    .addItem('Envoyer les rappels maintenant', 'envoyerRappels')
    .addItem('Activer le rappel hebdomadaire', 'installerDeclencheur')
    .addItem('Afficher l’URL de l’application', 'menuAfficherUrl')
    .addItem('Vérifier l’installation', 'menuVerifier')
    .addToUi();
}

function installer() {
  const ss = ss_();
  creerOnglet_(SHEETS.ADHERENTS, COL_ADHERENTS);
  creerOnglet_(SHEETS.SCORES, COL_SCORES);
  creerOnglet_(SHEETS.UTILISATEURS, COL_UTILISATEURS);
  creerOnglet_(SHEETS.DISPONIBILITES, COL_DISPONIBILITES);
  creerOnglet_(SHEETS.MESSAGES, COL_MESSAGES);
  creerOnglet_(SHEETS.COMPETITIONS, COL_COMPETITIONS);
  creerOnglet_(SHEETS.PARAMETRES, ['Paramètre', 'Valeur', 'Description']);
  creerOnglet_(SHEETS.JOURNAL, ['Horodatage', 'Acteur', 'Action', 'Détails']);

  remplirParametresDefaut_();
  appliquerValidations_();
  appliquerMiseEnForme_();

  const sheet1 = ss.getSheetByName('Feuille 1') || ss.getSheetByName('Sheet1');
  if (sheet1 && sheet1.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(sheet1);
  }

  ss.setSpreadsheetTimeZone(ss.getSpreadsheetTimeZone() || 'Europe/Paris');
  SpreadsheetApp.getUi().alert(
    'Classeur prêt',
    'Les onglets sont en place.\n\n' +
      'Prochaine étape : créez le compte administrateur via le menu 🏹, ' +
      'puis ajoutez vos archers depuis l’application. Chaque compte reçoit ' +
      'l’identifiant NOMPrénom et le mot de passe « ' + MOT_DE_PASSE_DEFAUT + ' ».',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function creerOnglet_(nom, entetes) {
  let sh = findSheet_(nom);
  if (!sh) sh = ss_().insertSheet(nom);
  if (sh.getName() !== nom) sh.setName(nom);   // « inscrits » → « Inscrits »

  const existantes = sh.getLastColumn() > 0
    ? sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String)
    : [];

  // Ajoute les colonnes manquantes à droite sans toucher aux existantes.
  const finales = existantes.slice();
  entetes.forEach(function (h) {
    if (finales.indexOf(h) === -1) finales.push(h);
  });
  sh.getRange(1, 1, 1, finales.length).setValues([finales]);
  oublierTables_();
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, finales.length)
    .setFontWeight('bold')
    .setBackground('#1f4e5f')
    .setFontColor('#ffffff');
  return sh;
}

function remplirParametresDefaut_() {
  const sh = sheet_(SHEETS.PARAMETRES);
  const existants = readTable_(SHEETS.PARAMETRES).map(function (r) {
    return String(r['Paramètre']);
  });
  PARAMETRES_DEFAUT.forEach(function (p) {
    if (existants.indexOf(p[0]) === -1) sh.appendRow(p);
  });
}

function appliquerValidations_() {
  const sh = sheet_(SHEETS.ADHERENTS);
  const n = Math.max(sh.getMaxRows() - 1, 1);
  const head = headers_(SHEETS.ADHERENTS);
  const liste = function (col, valeurs) {
    const idx = head.indexOf(col) + 1;
    if (!idx) return;
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(valeurs, true)
      .setAllowInvalid(true)
      .build();
    sh.getRange(2, idx, n, 1).setDataValidation(rule);
  };
  liste('Sexe', SEXES);
  liste('Arme', ARMES);
  liste('Type de licence', TYPES_LICENCE);
  liste('Statut', STATUTS);
  liste('Rôle', ROLES);
  liste('Cotisation', COTISATIONS);
  liste('Catégorie', CATEGORIES.map(function (c) { return c.code; }));

  const shU = sheet_(SHEETS.UTILISATEURS);
  const ruleStatut = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Actif', 'Inactif'], true).setAllowInvalid(true).build();
  shU.getRange(2, headers_(SHEETS.UTILISATEURS).indexOf('Statut') + 1,
    Math.max(shU.getMaxRows() - 1, 1), 1).setDataValidation(ruleStatut);

  const shD = sheet_(SHEETS.DISPONIBILITES);
  const ruleReponse = SpreadsheetApp.newDataValidation()
    .requireValueInList(REPONSES, true).setAllowInvalid(true).build();
  shD.getRange(2, headers_(SHEETS.DISPONIBILITES).indexOf('Réponse') + 1,
    Math.max(shD.getMaxRows() - 1, 1), 1).setDataValidation(ruleReponse);

  const shS = sheet_(SHEETS.SCORES);
  const nS = Math.max(shS.getMaxRows() - 1, 1);
  const headS = headers_(SHEETS.SCORES);
  const listeScore = function (col, valeurs) {
    const idx = headS.indexOf(col) + 1;
    if (!idx) return;
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(valeurs, true).setAllowInvalid(true).build();
    shS.getRange(2, idx, nS, 1).setDataValidation(rule);
  };
  listeScore('Discipline', DISCIPLINES.map(function (d) { return d.label; }));
  listeScore('Contexte', CONTEXTES);
  listeScore('Blason', BLASONS);
  listeScore('Distance', DISTANCES.map(String));
  listeScore('Nb volées', VOLEES.map(String));
  listeScore('Flèches par volée', FLECHES_PAR_VOLEE.map(String));
}

function appliquerMiseEnForme_() {
  const sh = sheet_(SHEETS.ADHERENTS);
  const head = headers_(SHEETS.ADHERENTS);
  const colDate = head.indexOf('Date de naissance') + 1;
  const colCert = head.indexOf('Certificat médical') + 1;
  const n = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, colDate, n, 1).setNumberFormat('dd/MM/yyyy');
  sh.getRange(2, colCert, n, 1).setNumberFormat('dd/MM/yyyy');

  // Certificat expiré ou à renouveler sous peu → fond orangé.
  const plage = sh.getRange(2, colCert, n, 1);
  const regle = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(
      '=AND(' + plage.getCell(1, 1).getA1Notation() + '<>"",' +
      plage.getCell(1, 1).getA1Notation() + '<TODAY()-335)'
    )
    .setBackground('#fde2cf')
    .setRanges([plage])
    .build();
  const regles = sh.getConditionalFormatRules();
  regles.push(regle);
  sh.setConditionalFormatRules(regles);

  const shS = sheet_(SHEETS.SCORES);
  shS.getRange(2, headers_(SHEETS.SCORES).indexOf('Date') + 1,
    Math.max(shS.getMaxRows() - 1, 1), 1).setNumberFormat('dd/MM/yyyy');

  [SHEETS.ADHERENTS, SHEETS.SCORES, SHEETS.UTILISATEURS, SHEETS.DISPONIBILITES,
   SHEETS.MESSAGES, SHEETS.PARAMETRES, SHEETS.COMPETITIONS].forEach(function (nom) {
    const s = sheet_(nom);
    s.autoResizeColumns(1, s.getLastColumn());
  });

  // La photo tient en une cellule : on évite qu'elle n'étire la colonne.
  const colPhoto = headers_(SHEETS.ADHERENTS).indexOf('Photo') + 1;
  if (colPhoto) sheet_(SHEETS.ADHERENTS).setColumnWidth(colPhoto, 90);

  const shD2 = sheet_(SHEETS.DISPONIBILITES);
  shD2.getRange(2, headers_(SHEETS.DISPONIBILITES).indexOf('Date séance') + 1,
    Math.max(shD2.getMaxRows() - 1, 1), 1).setNumberFormat('dd/MM/yyyy');
}

/* ------------------------------------------------------------------ */
/* Actions de menu                                                      */
/* ------------------------------------------------------------------ */

/**
 * Amorçage : crée la première fiche « Admin » et son compte.
 * Indispensable sur un classeur vierge, puisque l'application web ne
 * permet pas de créer un compte par soi-même.
 */
function menuCreerAdmin() {
  const ui = SpreadsheetApp.getUi();
  const demander = function (question) {
    const r = ui.prompt('Compte administrateur', question, ui.ButtonSet.OK_CANCEL);
    return r.getSelectedButton() === ui.Button.OK ? r.getResponseText().trim() : null;
  };

  const prenom = demander('Prénom :');
  if (!prenom) return;
  const nom = demander('Nom :');
  if (!nom) return;
  const licence = demander('N° de licence (facultatif) :');
  if (licence === null) return;
  const email = demander('Email (facultatif) :');
  if (email === null) return;

  if (trouverAdherentParIdentifiant_(identifiantPour_(nom, prenom))) {
    ui.alert('Un inscrit porte déjà ce nom. Utilisez « Réinitialiser un mot de passe… ».');
    return;
  }

  const id = uid_('ADH');
  appendObject_(SHEETS.ADHERENTS, {
    'ID': id,
    'Nom': nom,
    'Prénom': prenom,
    'N° licence': licence,
    'Email': email,
    'Saison': saisonCourante_(),
    'Rôle': 'Admin',
    'Statut': 'Actif',
    'Cotisation': 'Exonérée',
    'Créé le': now_(),
  });

  const compte = creerCompte_(trouverAdherentParId_(id));
  ui.alert(
    'Compte administrateur créé',
    prenom + ' ' + nom + '\n\n' +
      'Identifiant : ' + compte.identifiant + '\n' +
      'Mot de passe : ' + compte.motDePasse + '\n\n' +
      'Changez-le dès votre première connexion, depuis l’onglet Profil. ' +
      'Vous pourrez ensuite ajouter les autres inscrits directement depuis l’application.',
    ui.ButtonSet.OK
  );
}

/**
 * Crée un compte pour chaque inscrit qui n'en a pas encore :
 * identifiant NOMPrénom, mot de passe par défaut.
 */
function menuCreerComptes() {
  const ui = SpreadsheetApp.getUi();
  const inscrits = readTable_(SHEETS.ADHERENTS).filter(function (r) {
    return r['ID'] && String(r['Statut'] || 'Actif') !== 'Inactif';
  });
  const crees = [];
  inscrits.forEach(function (r) {
    const res = creerCompte_(r);
    if (res.cree) crees.push(res.identifiant);
  });
  ui.alert(
    'Comptes utilisateurs',
    crees.length
      ? crees.length + ' compte(s) créé(s), mot de passe « ' + MOT_DE_PASSE_DEFAUT + ' » :\n\n' +
        crees.join('\n')
      : 'Tous les inscrits actifs ont déjà un compte.',
    ui.ButtonSet.OK
  );
}

function menuReinitialiserMotDePasse() {
  const ui = SpreadsheetApp.getUi();
  const rep = ui.prompt(
    'Réinitialiser un mot de passe',
    'Identifiant (NOMPrénom), n° de licence ou email :',
    ui.ButtonSet.OK_CANCEL
  );
  if (rep.getSelectedButton() !== ui.Button.OK) return;
  const ident = rep.getResponseText().trim();
  if (!ident) return;

  const adherent = trouverAdherentParIdentifiant_(ident);
  if (!adherent) {
    ui.alert('Aucun inscrit trouvé pour « ' + ident + ' ».');
    return;
  }
  let compte = trouverCompteParAdherent_(adherent['ID']);
  let mdp;
  if (compte) {
    mdp = reinitialiserMotDePasse_(compte);
  } else {
    mdp = creerCompte_(adherent).motDePasse;
    compte = trouverCompteParAdherent_(adherent['ID']);
  }
  ui.alert(
    'Mot de passe réinitialisé',
    adherent['Prénom'] + ' ' + adherent['Nom'] + '\n\n' +
      'Identifiant : ' + compte['Identifiant'] + '\n' +
      'Mot de passe : ' + mdp + '\n\n' +
      'Invitez l’archer à le personnaliser depuis l’onglet Profil de l’application.',
    ui.ButtonSet.OK
  );
}

function menuRecalculerCategories() {
  const saison = saisonCourante_();
  const rows = readTable_(SHEETS.ADHERENTS);
  let n = 0;
  rows.forEach(function (r) {
    const cat = categoriePour_(r['Date de naissance'], saison);
    if (cat && cat !== r['Catégorie']) {
      updateObject_(SHEETS.ADHERENTS, r._row, { 'Catégorie': cat });
      n++;
    }
  });
  SpreadsheetApp.getUi().alert(n + ' catégorie(s) mise(s) à jour pour la saison ' + saison + '.');
}

function menuAfficherUrl() {
  const declaree = String(param_('URL de l’application', '')).trim();
  const derniere = ScriptApp.getService().getUrl() || '';
  const ui = SpreadsheetApp.getUi();

  if (!declaree && !derniere) {
    ui.alert('Application',
      'L’application n’est pas encore déployée.\n\nDans l’éditeur Apps Script : ' +
      'Déployer ▸ Nouveau déploiement ▸ Application Web.', ui.ButtonSet.OK);
    return;
  }

  // Plusieurs déploiements peuvent coexister : on distingue l'adresse diffusée
  // de celle du dernier déploiement enregistré, qui n'est pas toujours publique.
  ui.alert('Application',
    'Adresse diffusée aux archers :\n' + (declaree || derniere) + '\n\n' +
    (declaree && derniere && declaree !== derniere
      ? 'Dernier déploiement enregistré (différent) :\n' + derniere + '\n\n' +
        'C’est la première qui est utilisée partout : liens d’accès direct, emails.'
      : 'Pour figer cette adresse, renseignez la ligne « URL de l’application » ' +
        'de l’onglet Paramètres.'),
    ui.ButtonSet.OK);
}

function installerDeclencheur() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'envoyerRappels') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('envoyerRappels')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  SpreadsheetApp.getUi().alert(
    'Rappel hebdomadaire activé (lundi matin). ' +
    'Pensez à passer « Emails rappels actifs » à OUI dans l’onglet Paramètres.'
  );
}

/**
 * Diagnostic : vérifie que tous les fichiers du projet ont bien été copiés et
 * que le classeur possède les onglets et colonnes attendus. C'est le premier
 * réflexe quand une partie de l'application « ne fonctionne pas » : un fichier
 * oublié dans l'éditeur Apps Script se voit immédiatement ici.
 */
function menuVerifier() {
  const manques = [];

  const fichiers = {
    'Config.gs': ['SHEETS'],
    'Data.gs': ['readTable_', 'saisonCourante_'],
    'Auth.gs': ['creerCompte_', 'identifiantPour_', 'contexte_'],
    'Cible.gs': ['rayonBlason_', 'valeurPourRayon_', 'valeurPourPoint_', 'blasonDetail_',
                 'centrage_', 'groupement_', 'aireGroupe_', 'perimetreGroupe_'],
    'Membres.gs': ['apiListeAdherents', 'serialiserAdherent_'],
    'Scores.gs': ['apiEnregistrerScore', 'serialiserScore_', 'normaliserFleches_',
                  'apiSauverBrouillon', 'apiOuvrirCompetition', 'apiMajCarteCompetition'],
    'Statistiques.gs': ['apiStatistiques', 'apiStatistiquesPartie', 'statistiquesArcher_'],
    'Progression.gs': ['calculerProgression_', 'apiProgressionClub', 'apiClassementClub'],
    'Calendrier.gs': ['apiCalendrier', 'apiRepondreCalendrier', 'joursSeance_'],
    'Messagerie.gs': ['apiMessages', 'apiEnvoyerMessage', 'apiMessagesNonLus'],
    'Fichiers.gs': ['apiEnregistrerPhoto', 'apiDeposerLicence', 'dossierLicences_'],
    'Notifications.gs': ['envoyerRappels'],
    'WebApp.gs': ['doGet', 'nomClub', 'lienIcone', 'apiDemarrage', 'apiParametres', 'lireTheme_'],
  };
  Object.keys(fichiers).forEach(function (fichier) {
    const absentes = fichiers[fichier].filter(function (nom) {
      try {
        return typeof eval(nom) === 'undefined';
      } catch (e) {
        return true;
      }
    });
    if (absentes.length) {
      manques.push('• ' + fichier + ' : à (re)copier — manque ' + absentes.join(', '));
    }
  });

  ['Index', 'Styles', 'JavaScript', 'Logo'].forEach(function (nom) {
    try {
      HtmlService.createHtmlOutputFromFile(nom);
    } catch (e) {
      manques.push('• ' + nom + '.html : fichier HTML absent du projet');
    }
  });

  const onglets = {};
  onglets[SHEETS.ADHERENTS] = COL_ADHERENTS;
  onglets[SHEETS.SCORES] = COL_SCORES;
  onglets[SHEETS.UTILISATEURS] = COL_UTILISATEURS;
  onglets[SHEETS.DISPONIBILITES] = COL_DISPONIBILITES;
  onglets[SHEETS.MESSAGES] = COL_MESSAGES;
  onglets[SHEETS.COMPETITIONS] = COL_COMPETITIONS;
  Object.keys(onglets).forEach(function (nom) {
    if (!findSheet_(nom)) {
      manques.push('• Onglet « ' + nom + ' » absent — lancez « Installer / réparer »');
      return;
    }
    const presentes = headers_(nom);
    const absentes = onglets[nom].filter(function (c) { return presentes.indexOf(c) === -1; });
    if (absentes.length) {
      manques.push('• Onglet « ' + nom + ' » : colonnes manquantes (' + absentes.join(', ') +
        ') — lancez « Installer / réparer »');
    }
  });

  // L'icône doit être une vraie image : Apps Script rejette toute autre adresse.
  const icone = String(param_('URL de l’icône', '')).trim();
  if (icone && !/\.(png|jpe?g|gif|ico)(\?|#|$)/i.test(icone)) {
    manques.push('• Paramètres ▸ « URL de l’icône » : l’adresse doit se terminer par ' +
      '.png — un lien Drive ne convient pas. Elle est ignorée en l’état.');
  }

  const comptes = findSheet_(SHEETS.UTILISATEURS) ? readTable_(SHEETS.UTILISATEURS).length : 0;
  const inscrits = findSheet_(SHEETS.ADHERENTS) ? readTable_(SHEETS.ADHERENTS).length : 0;
  const admins = findSheet_(SHEETS.ADHERENTS)
    ? readTable_(SHEETS.ADHERENTS).filter(function (r) { return String(r['Rôle']) === 'Admin'; }).length
    : 0;

  const resume = 'Saison ' + saisonCourante_() + '\n' +
    inscrits + ' inscrit(s), ' + comptes + ' compte(s), ' + admins + ' administrateur(s).\n' +
    'Adresse diffusée : ' + (urlApplication_() || 'application non déployée');

  SpreadsheetApp.getUi().alert(
    manques.length ? 'Installation incomplète' : 'Installation complète',
    manques.length
      ? manques.join('\n') + '\n\n' + resume
      : 'Tous les fichiers, onglets et colonnes attendus sont présents.\n\n' + resume,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
