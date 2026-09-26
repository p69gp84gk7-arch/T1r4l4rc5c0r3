/**
 * Photo de profil et licence au format PDF.
 *
 * Deux stockages différents, pour deux tailles différentes :
 *  - la photo est réduite par la page à une vignette carrée et rangée dans le
 *    classeur, en clair dans la colonne « Photo » — quelques kilo-octets ;
 *  - la licence, trop lourde pour une cellule, part dans un dossier Drive créé
 *    par l'application, dont l'identifiant est noté dans l'onglet Paramètres.
 */

/** Dossier Drive des licences, créé au premier dépôt. */
function dossierLicences_() {
  const params = params_();
  const id = String(params['Dossier des licences'] || '').trim();
  if (id) {
    try {
      return DriveApp.getFolderById(id);
    } catch (e) {
      console.warn('Dossier des licences introuvable, recréation : ' + e.message);
    }
  }

  const nom = String(param_('Nom du club', 'Club de tir à l’arc')) + ' — Licences';
  const dossier = DriveApp.createFolder(nom);
  const sh = sheet_(SHEETS.PARAMETRES);
  const lignes = readTable_(SHEETS.PARAMETRES);
  const ligne = lignes.filter(function (r) {
    return String(r['Paramètre']) === 'Dossier des licences';
  })[0];
  if (ligne) {
    updateObject_(SHEETS.PARAMETRES, ligne._row, { 'Valeur': dossier.getId() });
  } else {
    sh.appendRow(['Dossier des licences', dossier.getId(),
      'Rempli automatiquement : identifiant du dossier Drive']);
  }
  _paramsCache = null;
  return dossier;
}

/** Vérifie que l'appelant a le droit d'agir sur la fiche visée. */
function autoriserFiche_(ctx, adherentId) {
  const cible = String(adherentId || ctx.id);
  if (cible !== ctx.id && !ctx.estEncadrant) return null;
  const a = trouverAdherentParId_(cible);
  return a || null;
}

/**
 * Enregistre la photo de profil.
 * `donnees` est une image déjà réduite par la page, sous forme de data URI.
 */
function apiEnregistrerPhoto(jeton, adherentId, donnees) {
  const ctx = contexte_(jeton);
  const a = autoriserFiche_(ctx, adherentId);
  if (!a) return { ok: false, message: 'Fiche inaccessible.' };

  const image = String(donnees || '');
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
    return { ok: false, message: 'Format d’image non reconnu.' };
  }
  if (image.length > PHOTO_MAX_CARACTERES) {
    return { ok: false, message: 'Photo trop lourde : choisissez une image plus petite.' };
  }

  updateObject_(SHEETS.ADHERENTS, a._row, { 'Photo': image, 'Modifié le': now_() });
  log_('photo_enregistree', { id: a['ID'] }, ctx.id);
  return { ok: true, photo: image, message: 'Photo enregistrée.' };
}

function apiSupprimerPhoto(jeton, adherentId) {
  const ctx = contexte_(jeton);
  const a = autoriserFiche_(ctx, adherentId);
  if (!a) return { ok: false, message: 'Fiche inaccessible.' };
  updateObject_(SHEETS.ADHERENTS, a._row, { 'Photo': '', 'Modifié le': now_() });
  return { ok: true, message: 'Photo retirée.' };
}

/**
 * Dépose la licence en PDF dans le dossier Drive du club.
 * Le fichier reste privé : seuls les responsables, qui ont accès au Drive du
 * club, peuvent l'ouvrir. L'archer voit la date de dépôt et peut la remplacer.
 */
function apiDeposerLicence(jeton, adherentId, fichier) {
  const ctx = contexte_(jeton);
  const a = autoriserFiche_(ctx, adherentId);
  if (!a) return { ok: false, message: 'Fiche inaccessible.' };

  const f = fichier || {};
  const base64 = String(f.donnees || '').replace(/^data:[^,]*,/, '');
  if (!base64) return { ok: false, message: 'Aucun fichier reçu.' };
  if (String(f.type || '') !== 'application/pdf') {
    return { ok: false, message: 'La licence doit être un fichier PDF.' };
  }

  let octets;
  try {
    octets = Utilities.base64Decode(base64);
  } catch (e) {
    return { ok: false, message: 'Fichier illisible.' };
  }
  if (octets.length > LICENCE_MAX_OCTETS) {
    return { ok: false, message: 'PDF trop lourd (4 Mo maximum).' };
  }

  const nom = 'Licence — ' + a['Nom'] + ' ' + a['Prénom'] + ' — ' + saisonCourante_() + '.pdf';
  const blob = Utilities.newBlob(octets, 'application/pdf', nom);

  // Un nouveau dépôt remplace le précédent.
  const ancienne = String(a['Licence PDF'] || '');
  const fichierDrive = dossierLicences_().createFile(blob);
  if (ancienne) {
    const id = (ancienne.match(/[-\w]{25,}/) || [])[0];
    if (id) {
      try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* déjà supprimée */ }
    }
  }

  updateObject_(SHEETS.ADHERENTS, a._row, {
    'Licence PDF': fichierDrive.getUrl(),
    'Licence déposée le': now_(),
    'Modifié le': now_(),
  });
  log_('licence_deposee', { id: a['ID'] }, ctx.id);
  return {
    ok: true,
    url: fichierDrive.getUrl(),
    depot: isoDate_(now_()),
    message: 'Licence enregistrée.',
  };
}

function apiSupprimerLicence(jeton, adherentId) {
  const ctx = contexte_(jeton);
  const a = autoriserFiche_(ctx, adherentId);
  if (!a) return { ok: false, message: 'Fiche inaccessible.' };

  const url = String(a['Licence PDF'] || '');
  const id = (url.match(/[-\w]{25,}/) || [])[0];
  if (id) {
    try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* déjà supprimée */ }
  }
  updateObject_(SHEETS.ADHERENTS, a._row, {
    'Licence PDF': '', 'Licence déposée le': '', 'Modifié le': now_(),
  });
  return { ok: true, message: 'Licence supprimée.' };
}
