/**
 * Messagerie du club : un fil commun, plus les messages adressés à un archer.
 *
 * Les notifications reposent sur une date de dernière lecture conservée dans
 * l'onglet Utilisateurs : l'application interroge régulièrement le serveur et
 * signale ce qui est arrivé depuis.
 */

function serialiserMessage_(r) {
  return {
    id: String(r['ID'] || ''),
    horodatage: r['Horodatage'] instanceof Date ? r['Horodatage'].getTime() : 0,
    date: isoDate_(r['Horodatage']),
    heure: r['Horodatage'] instanceof Date
      ? Utilities.formatDate(r['Horodatage'], tz_(), 'HH:mm') : '',
    auteurId: String(r['AuteurID'] || ''),
    auteur: String(r['Auteur'] || ''),
    portee: String(r['Portée'] || 'Club'),
    destinataire: String(r['Destinataire'] || ''),
    texte: String(r['Texte'] || ''),
    epingle: String(r['Épinglé'] || '').toUpperCase() === 'OUI',
  };
}

/** Messages visibles par l'archer : le fil du club et ceux qui lui sont adressés. */
function messagesPour_(ctx) {
  return readTable_(SHEETS.MESSAGES).map(serialiserMessage_).filter(function (m) {
    if (m.portee === 'Club') return true;
    return m.destinataire === ctx.id || m.auteurId === ctx.id;
  }).sort(function (a, b) { return b.horodatage - a.horodatage; });
}

function derniereLecture_(ctx) {
  if (!ctx.compte) return 0;
  const v = ctx.compte['Messages lus le'];
  return v instanceof Date ? v.getTime() : 0;
}

/** Message d'erreur commun quand le classeur n'a pas encore été mis à jour. */
function ongletMessagesAbsent_() {
  return {
    ok: false,
    absent: true,
    message: 'La messagerie n’est pas encore installée : ouvrez le classeur et ' +
      'lancez « 🏹 Tir à l’arc ▸ Installer / réparer ».',
  };
}

function apiMessages(jeton, limite) {
  const ctx = contexte_(jeton);
  if (!ongletPresent_(SHEETS.MESSAGES)) return ongletMessagesAbsent_();
  const lus = derniereLecture_(ctx);
  const messages = messagesPour_(ctx).slice(0, limite || 60).map(function (m) {
    m.nouveau = m.horodatage > lus && m.auteurId !== ctx.id;
    return m;
  });

  // La consultation vaut lecture : on repart de maintenant.
  if (ctx.compte) {
    updateObject_(SHEETS.UTILISATEURS, ctx.compte._row, { 'Messages lus le': now_() });
  }
  return {
    ok: true,
    messages: messages,
    moi: ctx.id,
    estEncadrant: ctx.estEncadrant,
    // Chaque archer peut écrire à un autre archer en particulier.
    destinataires: readTable_(SHEETS.ADHERENTS)
      .filter(function (r) {
        return String(r['Statut'] || 'Actif') !== 'Inactif' && String(r['ID']) !== ctx.id;
      })
      .map(function (r) {
        return { id: String(r['ID']), nom: r['Prénom'] + ' ' + r['Nom'] };
      }),
  };
}

/**
 * Compteur léger, appelé régulièrement par la page : combien de messages sont
 * arrivés depuis la dernière consultation, sans marquer quoi que ce soit comme lu.
 */
function apiMessagesNonLus(jeton) {
  return messagesNonLus_(contexte_(jeton));
}

function messagesNonLus_(ctx) {
  if (!ongletPresent_(SHEETS.MESSAGES)) return ongletMessagesAbsent_();
  const lus = derniereLecture_(ctx);
  const nouveaux = messagesPour_(ctx).filter(function (m) {
    return m.horodatage > lus && m.auteurId !== ctx.id;
  });
  return {
    ok: true,
    nombre: nouveaux.length,
    dernier: nouveaux.length ? nouveaux[0] : null,
  };
}

function apiEnvoyerMessage(jeton, texte, destinataire) {
  const ctx = contexte_(jeton);
  if (!ongletPresent_(SHEETS.MESSAGES)) return ongletMessagesAbsent_();
  const contenu = String(texte || '').trim();
  if (!contenu) return { ok: false, message: 'Le message est vide.' };
  if (contenu.length > 2000) {
    return { ok: false, message: 'Message trop long (2000 caractères maximum).' };
  }

  const cible = String(destinataire || '').trim();
  if (cible) {
    if (cible === ctx.id) return { ok: false, message: 'Vous ne pouvez pas vous écrire à vous-même.' };
    if (!trouverAdherentParId_(cible)) return { ok: false, message: 'Archer introuvable.' };
  }

  const ligne = {
    'ID': uid_('MSG'),
    'Horodatage': now_(),
    'AuteurID': ctx.id,
    'Auteur': ctx.nom,
    'Portée': cible ? 'Privé' : 'Club',
    'Destinataire': cible,
    'Texte': contenu,
    'Épinglé': 'NON',
  };
  appendObject_(SHEETS.MESSAGES, ligne);
  log_('message_envoye', { id: ligne['ID'], portee: ligne['Portée'] }, ctx.id);

  const envoyes = notifierMessage_(ligne, ctx);
  return {
    ok: true,
    message: 'Message publié' + (envoyes ? ', ' + envoyes + ' archer(s) prévenu(s) par email.' : '.'),
  };
}

/**
 * Prévient les archers par email : c'est le seul moyen d'atteindre un
 * téléphone dont l'application est fermée, une application Apps Script ne
 * pouvant pas envoyer de notification système.
 *
 * Le réglage « Notifications messages » de l'onglet Paramètres vaut
 * NON, ENCADREMENT ou TOUS.
 */
function notifierMessage_(ligne, ctx) {
  const reglage = String(param_('Notifications messages', 'NON')).trim().toUpperCase();
  if (reglage === 'NON' || reglage === '') return 0;

  const inscrits = readTable_(SHEETS.ADHERENTS).filter(function (r) {
    return String(r['Statut'] || 'Actif') !== 'Inactif' && String(r['Email'] || '').trim();
  });

  let cibles;
  if (String(ligne['Portée']) === 'Privé') {
    cibles = inscrits.filter(function (r) { return String(r['ID']) === String(ligne['Destinataire']); });
  } else if (reglage === 'ENCADREMENT') {
    cibles = inscrits.filter(function (r) {
      return ['Admin', 'Encadrant'].indexOf(String(r['Rôle'])) !== -1;
    });
  } else {
    cibles = inscrits;
  }

  // On n'écrit pas à l'auteur, et on garde une marge sur le quota Gmail.
  cibles = cibles.filter(function (r) { return String(r['ID']) !== ctx.id; }).slice(0, 80);
  if (!cibles.length) return 0;

  const club = String(param_('Nom du club', 'Le club'));
  const contact = String(param_('Email de contact', ''));
  const url = urlApplication_();
  let envoyes = 0;

  cibles.forEach(function (r) {
    const corps = 'Bonjour ' + r['Prénom'] + ',\n\n' +
      ctx.nom + ' a publié un message :\n\n' + ligne['Texte'] + '\n\n' +
      (url ? 'Répondre depuis l’application : ' + url + '\n\n' : '') +
      'Sportivement,\n' + club;
    try {
      MailApp.sendEmail({
        to: String(r['Email']).trim(),
        subject: '[' + club + '] Message de ' + ctx.nom,
        body: corps,
        replyTo: contact || undefined,
        name: club,
      });
      envoyes++;
    } catch (e) {
      console.warn('Notification impossible pour ' + r['Email'] + ' : ' + e.message);
    }
  });
  log_('messages_notifies', { envoyes: envoyes }, ctx.id);
  return envoyes;
}

/** Suppression d'un message : son auteur, ou un administrateur. */
function apiSupprimerMessage(jeton, id) {
  const ctx = contexte_(jeton);
  const ligne = readTable_(SHEETS.MESSAGES).filter(function (r) {
    return String(r['ID']) === String(id);
  })[0];
  if (!ligne) return { ok: false, message: 'Message introuvable.' };
  if (String(ligne['AuteurID']) !== ctx.id && !ctx.estAdmin) {
    return { ok: false, message: 'Suppression non autorisée.' };
  }
  deleteRow_(SHEETS.MESSAGES, ligne._row);
  log_('message_supprime', { id: id }, ctx.id);
  return { ok: true, message: 'Message supprimé.' };
}
