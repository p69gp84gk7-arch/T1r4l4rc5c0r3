/**
 * Gestion des inscrits : fiches, cotisations, certificats médicaux, alertes.
 */

/** Convertit une ligne du Sheet en objet transmissible à la page web. */
function serialiserAdherent_(r, ctx, options) {
  const cert = parseDate_(r['Certificat médical']);
  const validiteMois = toNumber_(param_('Validité certificat (mois)', 12)) || 12;
  const expire = cert ? addMonths_(cert, validiteMois) : null;
  const alerteJours = toNumber_(param_('Alerte certificat (jours)', 45)) || 45;
  const joursRestants = expire ? joursEntre_(now_(), expire) : null;

  const o = {
    id: String(r['ID'] || ''),
    nom: String(r['Nom'] || ''),
    prenom: String(r['Prénom'] || ''),
    sexe: String(r['Sexe'] || ''),
    naissance: isoDate_(r['Date de naissance']),
    categorie: String(r['Catégorie'] || ''),
    arme: String(r['Arme'] || ''),
    licence: String(r['N° licence'] || ''),
    typeLicence: String(r['Type de licence'] || ''),
    saison: String(r['Saison'] || ''),
    email: String(r['Email'] || ''),
    telephone: String(r['Téléphone'] || ''),
    certificat: isoDate_(r['Certificat médical']),
    certificatExpire: expire ? isoDate_(expire) : '',
    certificatJours: joursRestants,
    certificatEtat: !cert ? 'manquant'
      : joursRestants < 0 ? 'expire'
      : joursRestants <= alerteJours ? 'bientot' : 'ok',
    cotisation: String(r['Cotisation'] || ''),
    montant: toNumber_(r['Montant cotisation']),
    role: String(r['Rôle'] || 'Membre'),
    statut: String(r['Statut'] || 'Actif'),
    notes: String(r['Notes'] || ''),
    identifiant: '',   // complété plus bas si un compte existe
    aPhoto: !!r['Photo'],
    aLicence: !!r['Licence PDF'],
    licenceDepot: isoDate_(r['Licence déposée le']),
  };

  // La photo pèse quelques kilo-octets : on ne l'envoie que sur demande,
  // jamais dans une liste de plusieurs dizaines d'archers.
  if (options && options.avecPhoto) {
    o.photo = String(r['Photo'] || '');
    if (ctx && (ctx.estEncadrant || String(r['ID']) === ctx.id)) {
      o.licenceUrl = String(r['Licence PDF'] || '');
    }
  }

  const compte = trouverCompteParAdherent_(o.id);
  if (compte) {
    o.identifiant = String(compte['Identifiant']);
    o.compteActif = String(compte['Statut'] || 'Actif') !== 'Inactif';
  }

  // Un membre simple ne voit pas les coordonnées des autres.
  if (ctx && !ctx.estEncadrant && o.id !== ctx.id) {
    o.email = ''; o.telephone = ''; o.notes = ''; o.montant = 0;
  }
  return o;
}

/**
 * Liste des inscrits.
 * Réservée aux encadrants et aux administrateurs : un archer ne reçoit que
 * sa propre fiche, jamais l'annuaire du club.
 */
function apiListeAdherents(jeton, options) {
  return listeAdherents_(contexte_(jeton), options);
}

function listeAdherents_(ctx, options) {
  const opt = options || {};

  if (!ctx.estEncadrant) {
    const moi = serialiserAdherent_(ctx.adherent, ctx, { avecPhoto: true });
    if (!ctx.voitScores) return { ok: true, adherents: [moi] };
    // Pour choisir un archer dans Progression, Statistiques et Comparer, un
    // membre reçoit les noms du club — sans date de naissance, licence,
    // certificat, cotisation ni coordonnées.
    const autres = readTable_(SHEETS.ADHERENTS).filter(function (r) {
      return String(r['Statut'] || 'Actif') !== 'Inactif' && String(r['ID']) !== ctx.id;
    }).map(function (r) {
      return {
        id: String(r['ID']), nom: String(r['Nom'] || ''), prenom: String(r['Prénom'] || ''),
        categorie: String(r['Catégorie'] || ''), arme: String(r['Arme'] || ''),
        statut: String(r['Statut'] || 'Actif'), role: String(r['Rôle'] || 'Membre'),
      };
    });
    const liste = [moi].concat(autres);
    liste.sort(function (a, b) {
      return (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr');
    });
    return { ok: true, adherents: liste };
  }

  let rows = readTable_(SHEETS.ADHERENTS);

  if (!opt.inclureInactifs) {
    rows = rows.filter(function (r) { return String(r['Statut'] || 'Actif') !== 'Inactif'; });
  }
  const liste = rows.map(function (r) { return serialiserAdherent_(r, ctx); });
  liste.sort(function (a, b) {
    return (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr');
  });
  return { ok: true, adherents: liste };
}

function apiFicheAdherent(jeton, id) {
  const ctx = contexte_(jeton);
  const cible = String(id || ctx.id);
  if (cible !== ctx.id && !ctx.estEncadrant) {
    return { ok: false, message: 'Vous n’avez accès qu’à votre propre fiche.' };
  }
  const r = trouverAdherentParId_(cible);
  if (!r) return { ok: false, message: 'Inscrit introuvable.' };
  return {
    ok: true,
    adherent: serialiserAdherent_(r, ctx, { avecPhoto: true }),
    progression: calculerProgression_(String(r['ID'])),
  };
}

/**
 * Création ou mise à jour d'une fiche.
 * Un membre ne peut modifier que ses propres coordonnées ; le reste est
 * réservé aux encadrants et administrateurs.
 */
function apiEnregistrerAdherent(jeton, data) {
  const ctx = contexte_(jeton);
  const d = data || {};
  const estCreation = !d.id;

  if (estCreation && !ctx.estEncadrant) {
    return { ok: false, message: 'Seul un encadrant peut ajouter un inscrit.' };
  }
  if (!estCreation && !ctx.estEncadrant && String(d.id) !== ctx.id) {
    return { ok: false, message: 'Vous ne pouvez modifier que votre propre fiche.' };
  }
  if (!String(d.nom || '').trim() || !String(d.prenom || '').trim()) {
    return { ok: false, message: 'Le nom et le prénom sont obligatoires.' };
  }

  const saison = String(d.saison || '').trim() || saisonCourante_();
  const patch = {
    'Nom': String(d.nom).trim(),
    'Prénom': String(d.prenom).trim(),
    'Sexe': d.sexe || '',
    'Date de naissance': parseDate_(d.naissance) || '',
    'Catégorie': categoriePour_(d.naissance, saison),
    'Arme': d.arme || '',
    'N° licence': String(d.licence || '').trim(),
    'Type de licence': d.typeLicence || '',
    'Saison': saison,
    'Email': String(d.email || '').trim(),
    'Téléphone': String(d.telephone || '').trim(),
    'Certificat médical': parseDate_(d.certificat) || '',
    'Modifié le': now_(),
  };

  // Champs sensibles : encadrants et admins uniquement.
  if (ctx.estEncadrant) {
    patch['Cotisation'] = d.cotisation || 'Impayée';
    patch['Montant cotisation'] = toNumber_(d.montant);
    patch['Statut'] = d.statut || 'Actif';
    patch['Notes'] = String(d.notes || '');
  }
  if (ctx.estAdmin && d.role) patch['Rôle'] = d.role;

  if (estCreation) {
    if (String(d.licence || '').trim() &&
        trouverAdherentParIdentifiant_(d.licence)) {
      return { ok: false, message: 'Ce n° de licence est déjà enregistré.' };
    }
    patch['ID'] = uid_('ADH');
    patch['Créé le'] = now_();
    if (!patch['Rôle']) patch['Rôle'] = 'Membre';
    if (!patch['Statut']) patch['Statut'] = 'Actif';
    appendObject_(SHEETS.ADHERENTS, patch);

    // Compte d'accès immédiat : identifiant NOMPrénom, mot de passe par défaut.
    const compte = creerCompte_(trouverAdherentParId_(patch['ID']));
    log_('adherent_cree', { id: patch['ID'], nom: patch['Nom'] }, ctx.id);
    return {
      ok: true,
      id: patch['ID'],
      identifiant: compte.identifiant,
      motDePasse: compte.motDePasse,
      message: 'Inscrit ajouté. Identifiant ' + compte.identifiant +
        ', mot de passe ' + compte.motDePasse + '.',
    };
  }

  const r = trouverAdherentParId_(d.id);
  if (!r) return { ok: false, message: 'Inscrit introuvable.' };
  updateObject_(SHEETS.ADHERENTS, r._row, patch);
  log_('adherent_modifie', { id: d.id }, ctx.id);
  return { ok: true, id: String(d.id), message: 'Fiche enregistrée.' };
}

/** Archive un inscrit (statut Inactif) plutôt que de supprimer la ligne. */
function apiArchiverAdherent(jeton, id) {
  const ctx = contexte_(jeton);
  exigerAdmin_(ctx);
  const r = trouverAdherentParId_(id);
  if (!r) return { ok: false, message: 'Inscrit introuvable.' };
  updateObject_(SHEETS.ADHERENTS, r._row, { 'Statut': 'Inactif', 'Modifié le': now_() });
  const compte = trouverCompteParAdherent_(id);
  if (compte) updateObject_(SHEETS.UTILISATEURS, compte._row, { 'Statut': 'Inactif', 'Modifié le': now_() });
  log_('adherent_archive', { id: id }, ctx.id);
  return { ok: true, message: 'Inscrit archivé (ses scores sont conservés).' };
}

/**
 * Alertes du tableau de bord : certificats et cotisations.
 * Un membre simple ne reçoit que ses propres alertes.
 */
function calculerAlertes_(ctx) {
  const rows = readTable_(SHEETS.ADHERENTS).filter(function (r) {
    return String(r['Statut'] || 'Actif') !== 'Inactif';
  });
  const alertes = [];
  rows.forEach(function (r) {
    if (!ctx.estEncadrant && String(r['ID']) !== ctx.id) return;
    const a = serialiserAdherent_(r, ctx);
    const nom = a.prenom + ' ' + a.nom;
    if (a.certificatEtat === 'expire') {
      alertes.push({ niveau: 'rouge', id: a.id, titre: nom, texte: 'Certificat médical expiré le ' + a.certificatExpire });
    } else if (a.certificatEtat === 'bientot') {
      alertes.push({ niveau: 'orange', id: a.id, titre: nom, texte: 'Certificat à renouveler dans ' + a.certificatJours + ' jours' });
    } else if (a.certificatEtat === 'manquant') {
      alertes.push({ niveau: 'orange', id: a.id, titre: nom, texte: 'Certificat médical manquant' });
    }
    if (a.cotisation === 'Impayée') {
      alertes.push({ niveau: 'rouge', id: a.id, titre: nom, texte: 'Cotisation non réglée' });
    } else if (a.cotisation === 'Partielle') {
      alertes.push({ niveau: 'orange', id: a.id, titre: nom, texte: 'Cotisation partiellement réglée' });
    }
  });
  alertes.sort(function (x, y) { return x.niveau === y.niveau ? 0 : x.niveau === 'rouge' ? -1 : 1; });
  return alertes;
}

/** Statistiques club affichées sur l'accueil des encadrants. */
function calculerStatsClub_() {
  const rows = readTable_(SHEETS.ADHERENTS).filter(function (r) {
    return String(r['Statut'] || 'Actif') !== 'Inactif';
  });
  const parCategorie = {};
  const parArme = {};
  let femmes = 0, jeunes = 0, cotisationsDues = 0;
  rows.forEach(function (r) {
    const cat = String(r['Catégorie'] || '—');
    const arme = String(r['Arme'] || '—');
    parCategorie[cat] = (parCategorie[cat] || 0) + 1;
    parArme[arme] = (parArme[arme] || 0) + 1;
    if (String(r['Sexe']) === 'F') femmes++;
    if (estJeune_(cat)) jeunes++;
    if (['Impayée', 'Partielle'].indexOf(String(r['Cotisation'])) !== -1) cotisationsDues++;
  });
  return {
    total: rows.length,
    femmes: femmes,
    jeunes: jeunes,
    cotisationsDues: cotisationsDues,
    parCategorie: parCategorie,
    parArme: parArme,
  };
}
