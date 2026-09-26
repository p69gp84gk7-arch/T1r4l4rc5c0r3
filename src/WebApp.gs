/**
 * Point d'entrée de l'application web et données de démarrage.
 */

/**
 * Le gabarit Index.html appelle ces trois fonctions directement, plutôt que de
 * lire des variables posées sur le template : la page reste affichable même si
 * `doGet` évolue.
 */
function nomClub() {
  return String(param_('Nom du club', 'Club de tir à l’arc'));
}

function saisonAffichee() {
  return saisonCourante_();
}

/** URL de l'icône du raccourci mobile, déposée sur Drive et partagée par lien. */
function urlIcone() {
  return String(param_('URL de l’icône', '')).trim();
}

/**
 * Apps Script refuse une icône dont l'adresse ne se termine pas par une
 * extension d'image reconnue : un lien Drive « ?export=view&id=… » est rejeté
 * et fait échouer toute la page. On ne la transmet donc que si elle a la forme
 * attendue, et jamais sans filet.
 */
function iconeUtilisable_(url) {
  return /\.(png|jpe?g|gif|ico)(\?|#|$)/i.test(String(url || ''));
}

function lienIcone() {
  const icone = urlIcone();
  return icone
    ? '<link rel="apple-touch-icon" href="' + icone + '">' +
      '<link rel="icon" href="' + icone + '">'
    : '';
}

/**
 * Apps Script n'accepte que quelques balises meta : viewport,
 * apple-mobile-web-app-capable, mobile-web-app-capable et
 * google-site-verification. Toute autre balise lève une exception, et le nom
 * du raccourci se règle de toute façon au moment de l'ajout à l'écran d'accueil.
 */
function doGet(e) {
  const gabarit = HtmlService.createTemplateFromFile('Index');

  // Jeton transporté par un lien d'accès direct (voir apiLienDirect).
  const cle = e && e.parameter ? String(e.parameter.cle || '') : '';
  gabarit.jetonInitial = '<script>window.JETON_INITIAL = ' + JSON.stringify(cle) + ';</script>';

  const page = gabarit.evaluate()
    // Autorise l'affichage dans un cadre : c'est ce qui permet à la page
    // d'accueil du club (icône du raccourci, plein écran, sans le bandeau
    // « application créée par un utilisateur ») d'ouvrir l'application.
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle(nomClub() + ' — Espace archers')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .addMetaTag('apple-mobile-web-app-capable', 'yes')
    .addMetaTag('mobile-web-app-capable', 'yes');

  // L'icône du raccourci reste posée dans la page par lienIcone() ; ici, il
  // s'agit seulement du favicon de l'onglet, facultatif.
  const icone = urlIcone();
  if (icone && iconeUtilisable_(icone)) {
    try {
      page.setFaviconUrl(icone);
    } catch (e) {
      console.warn('Favicon refusé par Apps Script : ' + e.message);
    }
  }
  return page;
}

/** Permet d'éclater le HTML en plusieurs fichiers. */
function include(nom) {
  return HtmlService.createHtmlOutputFromFile(nom).getContent();
}

/**
 * Données chargées à la connexion : référentiels de saisie, profil,
 * tableau de bord. Un seul aller-retour au démarrage.
 */
function apiDemarrage(jeton) {
  const ctx = contexte_(jeton);
  const moi = serialiserAdherent_(ctx.adherent, ctx, { avecPhoto: true });

  const donnees = {
    ok: true,
    moi: moi,
    identifiant: ctx.identifiant,
    motDePasseParDefaut: !!(ctx.compte && String(ctx.compte['Mot de passe']) === MOT_DE_PASSE_DEFAUT),
    // Sert à pré-remplir le champ « mot de passe actuel » de la demande de
    // changement : c'est celui que tout le club connaît, il n'y a rien à cacher.
    motDePasseDefaut: (ctx.compte && String(ctx.compte['Mot de passe']) === MOT_DE_PASSE_DEFAUT)
      ? MOT_DE_PASSE_DEFAUT : '',
    role: ctx.role,
    estAdmin: ctx.estAdmin,
    estEncadrant: ctx.estEncadrant,
    voitScores: ctx.voitScores,
    saisitPourAutres: ctx.saisitPourAutres,
    saison: saisonCourante_(),
    nomClub: String(param_('Nom du club', 'Club de tir à l’arc')),
    referentiels: {
      armes: ARMES,
      sexes: SEXES,
      categories: CATEGORIES,
      typesLicence: TYPES_LICENCE,
      statuts: STATUTS,
      roles: ROLES,
      cotisations: COTISATIONS,
      disciplines: DISCIPLINES,
      distances: DISTANCES,
      blasons: BLASONS,
      blasonsDetail: BLASONS_DETAIL,
      toleranceFleche: toleranceFleche_(),
      blasonParDistance: BLASON_PAR_DISTANCE,
      rayonsBlason: BLASON_RAYONS,
      volees: VOLEES,
      flechesParVolee: FLECHES_PAR_VOLEE,
      pointsMaxFleche: POINTS_MAX_FLECHE,
      contextes: CONTEXTES,
      reponses: REPONSES,
      themes: { modes: THEME_MODES, couleurs: THEME_COULEURS },
    },
    alertes: calculerAlertes_(ctx),
    progression: calculerProgression_(ctx.id),
    theme: lireTheme_(ctx.compte),
  };

  if (ctx.estEncadrant) donnees.stats = calculerStatsClub_();
  if (ctx.voitScores) donnees.derniersScores = derniersScoresClub_(8);

  // Tout ce que l'écran d'accueil demandait en trois appels supplémentaires
  // arrive ici d'un coup : un aller-retour Apps Script coûte une à deux secondes.
  donnees.inscrits = listeAdherents_(ctx, {}).adherents;
  donnees.scores = listeScores_(ctx, { limite: 25 });
  try { donnees.messages = messagesNonLus_(ctx); } catch (e) { donnees.messages = null; }
  try { donnees.brouillon = brouillonAReprendre_(ctx); } catch (e) { donnees.brouillon = null; }
  try {
    const enDirect = apiCompetitionEnCours(jeton);
    donnees.competition = enDirect && enDirect.competition ? enDirect.competition : null;
  } catch (e) { donnees.competition = null; }
  return donnees;
}

/** Vérifie qu'un jeton mémorisé dans le navigateur est encore valable. */
function apiSessionValide(jeton) {
  try {
    contexte_(jeton);
    return { ok: true };
  } catch (e) {
    return { ok: false };
  }
}

/* ------------------------------------------------------------------ */
/* Apparence de chaque membre                                           */
/* ------------------------------------------------------------------ */

/** Thème enregistré sur le compte, sous la forme « mode|couleur ». */
function lireTheme_(compte) {
  const morceaux = String((compte && compte['Thème']) || '').split('|');
  const couleurs = THEME_COULEURS.map(function (c) { return c.code; });
  return {
    mode: THEME_MODES.indexOf(morceaux[0]) !== -1 ? morceaux[0] : 'auto',
    couleur: couleurs.indexOf(morceaux[1]) !== -1 ? morceaux[1] : 'sapin',
  };
}

function apiEnregistrerTheme(jeton, theme) {
  const ctx = contexte_(jeton);
  if (!ctx.compte) return { ok: false, message: 'Compte introuvable.' };
  if (headers_(SHEETS.UTILISATEURS).indexOf('Thème') === -1) {
    return { ok: false, message: 'Thème appliqué sur cet appareil seulement : lancez « Installer / réparer » pour l’enregistrer.' };
  }
  const t = lireTheme_({ 'Thème': (theme && theme.mode) + '|' + (theme && theme.couleur) });
  updateObject_(SHEETS.UTILISATEURS, ctx.compte._row, { 'Thème': t.mode + '|' + t.couleur });
  return { ok: true, theme: t };
}

/* ------------------------------------------------------------------ */
/* Paramètres de l'application (administrateurs)                        */
/* ------------------------------------------------------------------ */

/**
 * L'onglet Paramètres du classeur, consultable et modifiable depuis
 * l'application, avec l'adresse à diffuser aux archers.
 */
function apiParametres(jeton) {
  const ctx = contexte_(jeton);
  exigerAdmin_(ctx);
  const parametres = readTable_(SHEETS.PARAMETRES).filter(function (r) {
    return r['Paramètre'];
  }).map(function (r) {
    const cle = String(r['Paramètre']);
    const v = r['Valeur'];
    return {
      cle: cle,
      valeur: v instanceof Date ? isoDate_(v) : String(v === null || v === undefined ? '' : v),
      description: String(r['Description'] || ''),
      choix: PARAMETRES_CHOIX[cle] || null,
    };
  });

  let deploiement = '';
  try { deploiement = ScriptApp.getService().getUrl() || ''; } catch (e) { deploiement = ''; }

  return {
    ok: true,
    parametres: parametres,
    url: urlApplication_(),
    urlDeclaree: String(param_('URL de l’application', '')).trim(),
    deploiement: deploiement,
    nomClub: String(param_('Nom du club', 'Club de tir à l’arc')),
    motDePasseParDefaut: MOT_DE_PASSE_DEFAUT,
    inscrits: readTable_(SHEETS.ADHERENTS).filter(function (r) {
      return String(r['Statut'] || 'Actif') !== 'Inactif';
    }).length,
    comptes: readTable_(SHEETS.UTILISATEURS).length,
    comptesParDefaut: readTable_(SHEETS.UTILISATEURS).filter(function (r) {
      return String(r['Mot de passe']) === MOT_DE_PASSE_DEFAUT;
    }).map(function (r) { return String(r['Identifiant'] || ''); }),
  };
}

/**
 * Vide le cache de lecture du classeur. Utile après une retouche faite
 * directement dans le Sheet : les écrans repartent des données du classeur
 * sans attendre les quelques minutes d'expiration.
 */
function apiViderCache(jeton) {
  const ctx = contexte_(jeton);
  if (!ctx.estAdmin) return { ok: false, message: 'Réservé à l’administrateur.' };
  oublierTables_();
  _paramsCache = null;
  return { ok: true, message: 'Cache vidé : les prochains écrans relisent le classeur.' };
}

function apiEnregistrerParametres(jeton, valeurs) {
  const ctx = contexte_(jeton);
  exigerAdmin_(ctx);
  const lignes = readTable_(SHEETS.PARAMETRES);
  const modifies = [];
  Object.keys(valeurs || {}).forEach(function (cle) {
    const ligne = lignes.filter(function (r) { return String(r['Paramètre']) === cle; })[0];
    if (!ligne) return;
    let v = String(valeurs[cle] === null || valeurs[cle] === undefined ? '' : valeurs[cle]).trim();
    const choix = PARAMETRES_CHOIX[cle];
    if (choix) {
      v = v.toUpperCase();
      if (choix.indexOf(v) === -1) {
        throw new Error('Valeur invalide pour « ' + cle + ' » : ' + choix.join(', ') + '.');
      }
    }
    updateObject_(SHEETS.PARAMETRES, ligne._row, { 'Valeur': v });
    modifies.push(cle);
  });
  _paramsCache = null;
  log_('parametres_modifies', { cles: modifies }, ctx.id);
  return {
    ok: true,
    modifies: modifies,
    message: modifies.length
      ? modifies.length + ' paramètre' + (modifies.length > 1 ? 's enregistrés.' : ' enregistré.')
      : 'Aucune modification.',
  };
}
