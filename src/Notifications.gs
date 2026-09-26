/**
 * Rappels par email : certificats médicaux et cotisations.
 * Déclenché manuellement depuis le menu ou par le déclencheur hebdomadaire.
 */

function envoyerRappels() {
  const actif = String(param_('Emails rappels actifs', 'NON')).trim().toUpperCase();
  const manuel = typeof SpreadsheetApp.getUi === 'function';
  if (actif !== 'OUI') {
    console.log('Rappels désactivés (Paramètres ▸ « Emails rappels actifs »).');
    if (manuel) {
      try {
        SpreadsheetApp.getUi().alert(
          'Les rappels sont désactivés. Passez « Emails rappels actifs » à OUI dans l’onglet Paramètres.'
        );
      } catch (e) { /* pas d'interface disponible */ }
    }
    return;
  }

  const club = String(param_('Nom du club', 'Votre club de tir à l’arc'));
  const contact = String(param_('Email de contact', ''));
  const alerteJours = toNumber_(param_('Alerte certificat (jours)', 45)) || 45;
  const validiteMois = toNumber_(param_('Validité certificat (mois)', 12)) || 12;
  const url = urlApplication_();

  const rows = readTable_(SHEETS.ADHERENTS).filter(function (r) {
    return String(r['Statut'] || 'Actif') !== 'Inactif';
  });

  let envoyes = 0;
  const recap = [];

  rows.forEach(function (r) {
    const email = String(r['Email'] || '').trim();
    const nom = r['Prénom'] + ' ' + r['Nom'];
    const points = [];

    const cert = parseDate_(r['Certificat médical']);
    if (!cert) {
      points.push('votre certificat médical n’est pas enregistré');
    } else {
      const reste = joursEntre_(now_(), addMonths_(cert, validiteMois));
      if (reste < 0) points.push('votre certificat médical a expiré il y a ' + Math.abs(reste) + ' jours');
      else if (reste <= alerteJours) points.push('votre certificat médical expire dans ' + reste + ' jours');
    }
    if (String(r['Cotisation']) === 'Impayée') points.push('votre cotisation de la saison n’est pas réglée');
    else if (String(r['Cotisation']) === 'Partielle') points.push('votre cotisation reste partiellement due');

    if (!points.length) return;
    recap.push(nom + ' : ' + points.join(' ; '));
    if (!email) return;

    const corps =
      'Bonjour ' + r['Prénom'] + ',\n\n' +
      'Un point administratif demande votre attention :\n' +
      points.map(function (p) { return '  • ' + p; }).join('\n') + '\n\n' +
      (url ? 'Votre espace archer : ' + url + '\n\n' : '') +
      'Sportivement,\n' + club + (contact ? '\n' + contact : '');

    try {
      MailApp.sendEmail({
        to: email,
        subject: '[' + club + '] Rappel administratif',
        body: corps,
        replyTo: contact || undefined,
        name: club,
      });
      envoyes++;
    } catch (e) {
      console.warn('Envoi impossible à ' + email + ' : ' + e.message);
    }
  });

  log_('rappels_envoyes', { envoyes: envoyes, concernes: recap.length }, 'système');

  if (contact && recap.length) {
    MailApp.sendEmail({
      to: contact,
      subject: '[' + club + '] Récapitulatif des rappels (' + recap.length + ')',
      body: 'Situations signalées :\n\n' + recap.map(function (l) { return '  • ' + l; }).join('\n'),
      name: club,
    });
  }
  if (manuel) {
    try {
      SpreadsheetApp.getUi().alert(envoyes + ' email(s) envoyé(s), ' + recap.length + ' situation(s) à suivre.');
    } catch (e) { /* exécution par déclencheur */ }
  }
}
