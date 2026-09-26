/**
 * Authentification de l'application web.
 *
 * Les comptes vivent dans l'onglet « Utilisateurs » : une ligne par archer,
 * avec pour identifiant le NOM en majuscules suivi du Prénom
 * (ex. FONTAINECamille) et un mot de passe modifiable — « 1234 » à la création.
 *
 * Le mot de passe est stocké tel quel afin que le club puisse le lire et le
 * corriger directement dans le Sheet : réservez donc l'accès au classeur aux
 * responsables, et invitez les archers à personnaliser le leur.
 *
 * La session est un jeton signé (HMAC), sans stockage serveur.
 */

function secret_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('APP_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('APP_SECRET', s);
  }
  return s;
}

/** Retire accents, espaces et ponctuation pour comparer deux identifiants. */
function normaliserIdentifiant_(v) {
  return String(v || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toLowerCase();
}

/** Construit l'identifiant NOMPrénom à partir d'une fiche d'inscrit. */
function identifiantPour_(nom, prenom) {
  const propre = function (v) {
    return String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '');
  };
  const n = propre(nom).toUpperCase();
  const p = propre(prenom);
  return n + (p ? p.charAt(0).toUpperCase() + p.substring(1).toLowerCase() : '');
}

/* ------------------------------------------------------------------ */
/* Comptes utilisateurs                                                 */
/* ------------------------------------------------------------------ */

function trouverCompteParIdentifiant_(identifiant) {
  const cible = normaliserIdentifiant_(identifiant);
  if (!cible) return null;
  const rows = readTable_(SHEETS.UTILISATEURS);
  for (let i = 0; i < rows.length; i++) {
    if (normaliserIdentifiant_(rows[i]['Identifiant']) === cible) return rows[i];
  }
  return null;
}

function trouverCompteParAdherent_(adherentId) {
  const rows = readTable_(SHEETS.UTILISATEURS);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i]['AdhérentID']) === String(adherentId)) return rows[i];
  }
  return null;
}

/** Identifiant libre : ajoute un suffixe numérique en cas d'homonyme. */
function identifiantDisponible_(base) {
  let candidat = base;
  let n = 2;
  while (trouverCompteParIdentifiant_(candidat)) {
    candidat = base + n;
    n++;
  }
  return candidat;
}

/**
 * Crée le compte d'un inscrit s'il n'en a pas encore.
 * Renvoie { identifiant, motDePasse, cree }.
 */
function creerCompte_(adherent, motDePasse) {
  const existant = trouverCompteParAdherent_(adherent['ID']);
  if (existant) {
    return {
      identifiant: String(existant['Identifiant']),
      motDePasse: String(existant['Mot de passe']),
      cree: false,
    };
  }
  const identifiant = identifiantDisponible_(identifiantPour_(adherent['Nom'], adherent['Prénom']));
  const mdp = String(motDePasse || MOT_DE_PASSE_DEFAUT);
  appendObject_(SHEETS.UTILISATEURS, {
    'Identifiant': identifiant,
    'AdhérentID': String(adherent['ID']),
    'Nom': adherent['Nom'],
    'Prénom': adherent['Prénom'],
    'Mot de passe': mdp,
    'Statut': 'Actif',
    'Modifié le': now_(),
  });
  log_('compte_cree', { identifiant: identifiant, adherent: adherent['ID'] }, 'système');
  return { identifiant: identifiant, motDePasse: mdp, cree: true };
}

/** Remet le mot de passe d'un compte à sa valeur par défaut (ou à une valeur donnée). */
function reinitialiserMotDePasse_(compte, valeur) {
  const mdp = String(valeur || MOT_DE_PASSE_DEFAUT);
  updateObject_(SHEETS.UTILISATEURS, compte._row, {
    'Mot de passe': mdp,
    'Modifié le': now_(),
  });
  log_('mot_de_passe_reinitialise', { identifiant: compte['Identifiant'] }, 'système');
  return mdp;
}

/* ------------------------------------------------------------------ */
/* Inscrits                                                             */
/* ------------------------------------------------------------------ */

function trouverAdherentParId_(id) {
  const rows = readTable_(SHEETS.ADHERENTS);
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i]['ID']) === String(id)) return rows[i];
  }
  return null;
}

/** Recherche un inscrit par n° de licence, email, ou identifiant NOMPrénom. */
function trouverAdherentParIdentifiant_(ident) {
  const cible = normaliserIdentifiant_(ident);
  if (!cible) return null;

  const compte = trouverCompteParIdentifiant_(ident);
  if (compte) {
    const a = trouverAdherentParId_(compte['AdhérentID']);
    if (a) return a;
  }
  const rows = readTable_(SHEETS.ADHERENTS);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normaliserIdentifiant_(r['N° licence']) === cible) return r;
    if (normaliserIdentifiant_(r['Email']) === cible) return r;
    if (normaliserIdentifiant_(identifiantPour_(r['Nom'], r['Prénom'])) === cible) return r;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Jetons de session                                                    */
/* ------------------------------------------------------------------ */

function signer_(payload) {
  const sig = Utilities.computeHmacSha256Signature(payload, secret_());
  return Utilities.base64EncodeWebSafe(sig);
}

/**
 * Empreinte du mot de passe en cours, glissée dans le jeton : changer de mot
 * de passe invalide aussitôt les liens d'accès direct déjà distribués.
 */
function empreinteCompte_(compte) {
  if (!compte) return '0';
  return signer_('mdp|' + String(compte['Mot de passe'])).replace(/[^A-Za-z0-9]/g, '')
    .substring(0, 8);
}

function creerJeton_(adherentId, jours) {
  const duree = Number(jours) || SESSION_JOURS;
  const exp = now_().getTime() + duree * 86400000;
  const empreinte = empreinteCompte_(trouverCompteParAdherent_(adherentId));
  const payload = adherentId + '.' + exp + '.' + empreinte;
  return payload + '.' + signer_(payload);
}

/** Renvoie l'adhérent (ligne Sheet) associé à un jeton valide, sinon null. */
function lireJeton_(jeton) {
  const parts = String(jeton || '').split('.');
  // Trois parties : ancien format, sans empreinte de mot de passe.
  if (parts.length !== 3 && parts.length !== 4) return null;

  const signature = parts[parts.length - 1];
  const payload = parts.slice(0, parts.length - 1).join('.');
  if (signer_(payload) !== signature) return null;
  if (Number(parts[1]) < now_().getTime()) return null;

  const adherent = trouverAdherentParId_(parts[0]);
  if (!adherent) return null;

  if (parts.length === 4) {
    const compte = trouverCompteParAdherent_(parts[0]);
    if (empreinteCompte_(compte) !== parts[2]) return null;
  }
  return adherent;
}

/**
 * Contexte d'appel : adhérent courant, compte et droits.
 * Lève une erreur si le jeton est absent ou expiré.
 */
function saisieOuverte_() {
  return String(param_('Saisie ouverte à tous', 'OUI')).trim().toUpperCase() !== 'NON';
}

function scoresPartages_() {
  return String(param_('Scores visibles par tous', 'OUI')).trim().toUpperCase() !== 'NON';
}

function contexte_(jeton) {
  const a = lireJeton_(jeton);
  if (!a) throw new Error('SESSION_EXPIREE');
  const compte = trouverCompteParAdherent_(a['ID']);
  const role = String(a['Rôle'] || 'Membre');
  return {
    adherent: a,
    compte: compte,
    id: String(a['ID']),
    identifiant: compte ? String(compte['Identifiant']) : '',
    nom: a['Prénom'] + ' ' + a['Nom'],
    role: role,
    estAdmin: role === 'Admin',
    estEncadrant: role === 'Admin' || role === 'Encadrant',
    // Consultation des scores de tout le club : l'encadrement toujours, les
    // membres si le paramètre l'autorise. Saisie et suppression restent
    // réservées à l'archer concerné et à l'encadrement.
    voitScores: role === 'Admin' || role === 'Encadrant' || scoresPartages_(),
    // Saisie pour un autre archer, mini-compétitions et cartes du direct.
    saisitPourAutres: role === 'Admin' || role === 'Encadrant' || saisieOuverte_(),
  };
}

function exigerAdmin_(ctx) {
  if (!ctx.estAdmin) throw new Error('Action réservée aux administrateurs du club.');
}

/* ------------------------------------------------------------------ */
/* API appelée depuis la page                                           */
/* ------------------------------------------------------------------ */

function apiConnexion(identifiant, motDePasse) {
  const compte = trouverCompteParIdentifiant_(identifiant);
  if (!compte) {
    Utilities.sleep(400);
    return { ok: false, message: 'Identifiant inconnu. Il s’écrit NOMPrénom, par exemple DUPONTMarie.' };
  }
  if (String(compte['Statut'] || 'Actif') === 'Inactif') {
    return { ok: false, message: 'Ce compte est désactivé. Contactez le club.' };
  }
  if (String(compte['Mot de passe']) !== String(motDePasse || '').trim()) {
    Utilities.sleep(600);
    log_('connexion_echouee', { identifiant: identifiant }, identifiant);
    return { ok: false, message: 'Mot de passe incorrect.' };
  }

  const adherent = trouverAdherentParId_(compte['AdhérentID']);
  if (!adherent) {
    return { ok: false, message: 'Ce compte n’est rattaché à aucune fiche d’inscrit. Contactez le club.' };
  }
  if (String(adherent['Statut']) === 'Inactif') {
    return { ok: false, message: 'Votre fiche est archivée. Contactez le club.' };
  }

  updateObject_(SHEETS.UTILISATEURS, compte._row, { 'Dernière connexion': now_() });
  log_('connexion', { identifiant: compte['Identifiant'] }, String(adherent['ID']));
  return {
    ok: true,
    jeton: creerJeton_(String(adherent['ID'])),
    motDePasseParDefaut: String(compte['Mot de passe']) === MOT_DE_PASSE_DEFAUT,
  };
}

/** Change son propre mot de passe. */
function apiChangerMotDePasse(jeton, ancien, nouveau) {
  const ctx = contexte_(jeton);
  if (!ctx.compte) return { ok: false, message: 'Aucun compte associé à votre fiche.' };
  if (String(ctx.compte['Mot de passe']) !== String(ancien || '').trim()) {
    return { ok: false, message: 'Mot de passe actuel incorrect.' };
  }
  const n = String(nouveau || '').trim();
  if (n.length < 4) return { ok: false, message: 'Le nouveau mot de passe doit faire au moins 4 caractères.' };
  if (n === MOT_DE_PASSE_DEFAUT) {
    return { ok: false, message: 'Choisissez autre chose que le mot de passe par défaut.' };
  }
  updateObject_(SHEETS.UTILISATEURS, ctx.compte._row, {
    'Mot de passe': n,
    'Modifié le': now_(),
  });
  log_('mot_de_passe_change', { identifiant: ctx.identifiant }, ctx.id);
  return { ok: true, message: 'Mot de passe mis à jour.' };
}

/**
 * Compte d'un inscrit, vu par un administrateur : identifiant, mot de passe et
 * dernière connexion. Le mot de passe figure en clair dans le classeur, la
 * fiche de l'archer se contente donc de l'afficher à ceux qui y ont déjà accès.
 */
function apiCompteArcher(jeton, adherentId) {
  const ctx = contexte_(jeton);
  exigerAdmin_(ctx);
  const a = trouverAdherentParId_(adherentId);
  if (!a) return { ok: false, message: 'Inscrit introuvable.' };

  const compte = trouverCompteParAdherent_(adherentId);
  if (!compte) {
    return {
      ok: true, existe: false, nom: a['Prénom'] + ' ' + a['Nom'],
      message: 'Cet archer n’a pas encore de compte.',
    };
  }
  return {
    ok: true,
    existe: true,
    nom: a['Prénom'] + ' ' + a['Nom'],
    identifiant: String(compte['Identifiant']),
    motDePasse: String(compte['Mot de passe']),
    statut: String(compte['Statut'] || 'Actif'),
    derniereConnexion: isoDate_(compte['Dernière connexion']),
    parDefaut: String(compte['Mot de passe']) === MOT_DE_PASSE_DEFAUT,
  };
}

/** Fixe le mot de passe d'un inscrit (admin), en créant le compte au besoin. */
function apiDefinirMotDePasse(jeton, adherentId, motDePasse) {
  const ctx = contexte_(jeton);
  exigerAdmin_(ctx);
  const a = trouverAdherentParId_(adherentId);
  if (!a) return { ok: false, message: 'Inscrit introuvable.' };

  const mdp = String(motDePasse || '').trim();
  if (mdp.length < 4) {
    return { ok: false, message: 'Le mot de passe doit comporter au moins 4 caractères.' };
  }

  let compte = trouverCompteParAdherent_(adherentId);
  if (!compte) {
    creerCompte_(a, mdp);
    compte = trouverCompteParAdherent_(adherentId);
  } else {
    updateObject_(SHEETS.UTILISATEURS, compte._row, {
      'Mot de passe': mdp,
      'Modifié le': now_(),
    });
  }
  log_('mot_de_passe_defini', { id: adherentId }, ctx.id);
  return {
    ok: true,
    identifiant: String(compte['Identifiant']),
    motDePasse: mdp,
    nom: a['Prénom'] + ' ' + a['Nom'],
    message: 'Mot de passe mis à jour.',
  };
}

/** Réinitialise le mot de passe d'un inscrit (admin) : retour à « 1234 ». */
function apiReinitialiserMotDePasse(jeton, adherentId) {
  const ctx = contexte_(jeton);
  exigerAdmin_(ctx);
  const a = trouverAdherentParId_(adherentId);
  if (!a) return { ok: false, message: 'Inscrit introuvable.' };

  let compte = trouverCompteParAdherent_(adherentId);
  if (!compte) {
    const cree = creerCompte_(a);
    return {
      ok: true, identifiant: cree.identifiant, motDePasse: cree.motDePasse,
      nom: a['Prénom'] + ' ' + a['Nom'], message: 'Compte créé.',
    };
  }
  const mdp = reinitialiserMotDePasse_(compte);
  log_('mot_de_passe_reinitialise', { id: adherentId }, ctx.id);
  return {
    ok: true,
    identifiant: String(compte['Identifiant']),
    motDePasse: mdp,
    nom: a['Prénom'] + ' ' + a['Nom'],
    message: 'Mot de passe réinitialisé.',
  };
}

/**
 * Lien d'accès direct, à placer en signet ou sur l'écran d'accueil.
 *
 * L'application vit dans un cadre dont l'adresse change à chaque visite : la
 * mémoire du navigateur y est perdue d'une fois sur l'autre, et cocher
 * « rester connecté » ne suffit pas. Le jeton voyage donc dans l'adresse
 * elle-même, valable un an, et cesse de fonctionner dès que l'archer change
 * son mot de passe.
 */
function apiLienDirect(jeton) {
  const ctx = contexte_(jeton);
  const url = urlApplication_();
  if (!url) {
    return { ok: false, message: 'L’application n’est pas encore déployée.' };
  }
  log_('lien_direct_cree', { id: ctx.id }, ctx.id);
  return {
    ok: true,
    url: url + (url.indexOf('?') === -1 ? '?' : '&') + 'cle=' + encodeURIComponent(creerJeton_(ctx.id, 365)),
    nom: ctx.nom,
  };
}
