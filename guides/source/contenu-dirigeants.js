/* Guide des dirigeants : contenu. */
const O = '<span class="oui">✓</span>';
const N = '<span class="non">—</span>';

module.exports = {
  titre: 'Guide des dirigeants',
  sur: 'Encadrants et administrateurs',
  accroche: 'Suivre les inscrits, régulariser certificats et cotisations, gérer les accès, saisir pour les ' +
    'archers et régler l’application du club. Ce guide complète le Guide de l’archer.',
  apercus: ['d01-accueil', 'd04-fiche', 'd08-calendrier'],
  version: 'Octobre 2026',
  lecture: '<h3>Comment lire ce guide</h3>' +
    '<p>Il décrit uniquement ce que l’encadrement et l’administration ont <strong>en plus</strong> des archers. ' +
    'Pour noter une partie, les statistiques ou les messages, reportez-vous au <strong>Guide de l’archer</strong>, ' +
    'disponible lui aussi dans <em>Profil ▸ Guides d’utilisation</em>.</p>' +
    '<p style="margin:0">Les captures, prises sur un téléphone, montrent des archers <strong>fictifs</strong> ; ' +
    'l’administratrice de l’exemple est Hélène ROUSSEL. Tout fonctionne de la même façon sur Android, iPhone, ' +
    'tablette et ordinateur.</p>',
  sections: [
    {
      titre: 'Les rôles', resume: 'Qui peut faire quoi',
      blocs: [{ html: `
        <p>Chaque inscrit a un <strong>rôle</strong>, qui décide de ce qu’il voit et de ce qu’il peut faire :</p>
        <table>
          <tr><th>Action</th><th class="c" style="width:22mm">Membre</th><th class="c" style="width:22mm">Encadrant</th><th class="c" style="width:22mm">Admin</th></tr>
          <tr><td>Noter ses parties, statistiques, calendrier, messages</td><td class="c">${O}</td><td class="c">${O}</td><td class="c">${O}</td></tr>
          <tr><td>Saisir pour un autre archer, lancer une mini-compétition</td><td class="c">selon réglage*</td><td class="c">${O}</td><td class="c">${O}</td></tr>
          <tr><td>Consulter les scores et statistiques de tous</td><td class="c">selon réglage*</td><td class="c">${O}</td><td class="c">${O}</td></tr>
          <tr><td>Liste des inscrits, fiches, ajouter ou modifier un archer</td><td class="c">${N}</td><td class="c">${O}</td><td class="c">${O}</td></tr>
          <tr><td>Chiffres du club à l’accueil, récapitulatif du calendrier</td><td class="c">${N}</td><td class="c">${O}</td><td class="c">${O}</td></tr>
          <tr><td>Supprimer la partie d’un autre archer</td><td class="c">${N}</td><td class="c">${O}</td><td class="c">${O}</td></tr>
          <tr><td>Changer le rôle d’un archer, l’archiver</td><td class="c">${N}</td><td class="c">${N}</td><td class="c">${O}</td></tr>
          <tr><td>Voir et fixer les mots de passe (Accès et mot de passe)</td><td class="c">${N}</td><td class="c">${N}</td><td class="c">${O}</td></tr>
          <tr><td>Supprimer n’importe quel message</td><td class="c">${N}</td><td class="c">${N}</td><td class="c">${O}</td></tr>
          <tr><td>Paramètres de l’application</td><td class="c">${N}</td><td class="c">${N}</td><td class="c">${O}</td></tr>
          <tr><td>Guides d’utilisation dans le Profil</td><td class="c">archer</td><td class="c">les deux</td><td class="c">les deux</td></tr>
        </table>
        <p style="font-size:9.4pt;color:#5f6f68">* Réglages <em>Saisie ouverte à tous</em> et <em>Scores visibles par tous</em> des Paramètres de l’application.</p>
        <div class="astuce"><strong>Changer le rôle d’un archer</strong>Un administrateur ouvre sa fiche ▸
          <span class="bouton">Modifier</span> ▸ <strong>Rôle</strong>. On peut aussi modifier la colonne <em>Rôle</em> du classeur.</div>` }],
    },
    {
      titre: 'L’accueil des dirigeants', resume: 'Ce qui est à régulariser, les chiffres du club',
      blocs: [
        { images: [['d01-accueil', 'Mon tir, puis « À régulariser »'], ['d02-accueil-club', 'Le club']], html: `
          <p>En plus de votre propre analyse de tir, l’accueil affiche :</p>
          <ul>
            <li><strong>À régulariser</strong> : la liste des archers dont la <strong>cotisation</strong> n’est pas réglée
              (en rouge) ou partiellement réglée, et dont le <strong>certificat médical</strong> est expiré ou à renouveler
              dans les semaines à venir (en orange, avec le nombre de jours restants) ;</li>
            <li><strong>Le club</strong> : le bouton <span class="bouton">👥 Gérer les inscrits</span>, le nombre d’inscrits,
              de jeunes et de cotisations dues, et la répartition par catégorie d’âge.</li>
          </ul>
          <p>Le délai d’alerte du certificat se règle dans les Paramètres de l’application.</p>` },
      ],
    },
    {
      titre: 'Les inscrits', resume: 'Liste, fiche, ajout d’un archer',
      blocs: [
        { images: [['d03-inscrits', 'La liste des inscrits']], titre: 'La liste', html: `
          <p>Ouvrez-la avec <span class="bouton">👥 Gérer les inscrits</span> sur l’accueil (sur ordinateur, l’onglet <strong>Inscrits</strong>).</p>
          <ul>
            <li>La <strong>recherche</strong> trouve un archer par son nom ou son prénom.</li>
            <li>Les filtres <strong>Catégorie</strong> et <strong>Arme</strong> réduisent la liste ;
              <strong>Afficher aussi les archers archivés</strong> fait réapparaître les anciens membres.</li>
            <li>Des étiquettes signalent ce qui manque : <em>certificat</em>, <em>cotisation</em>.</li>
            <li>Touchez un archer pour ouvrir sa fiche.</li>
            <li>Le bouton <span class="bouton">+ Ajouter un inscrit</span> est en bas de la liste.</li>
          </ul>` },
        { images: [['d04-fiche', 'La fiche d’un archer'], ['d04b-fiche-bas', 'Les actions, en bas de la fiche']], titre: 'La fiche d’un archer', html: `
          <p>Elle réunit l’identifiant, la licence, la date de naissance, le <strong>certificat médical</strong> (avec sa date de fin de
            validité), la <strong>cotisation</strong> et son montant, les coordonnées, ses chiffres de tir et sa licence en PDF.</p>
          <ul>
            <li><span class="bouton">Modifier</span> : corriger la fiche, enregistrer un certificat ou un paiement ;</li>
            <li><span class="bouton clair">Statistiques</span> : ouvrir ses statistiques complètes ;</li>
            <li><span class="bouton clair">Déposer le PDF</span> : joindre sa licence ;</li>
            <li><strong>Admin</strong> : <span class="bouton clair">Accès et mot de passe</span> et
              <span class="bouton" style="background:#a8342a">Archiver</span>. Un archer archivé disparaît des listes, mais sa fiche et
              ses scores sont conservés.</li>
          </ul>` },
        { images: [['d05-nouvel-archer', 'Nouvel inscrit']], titre: 'Ajouter un archer', html: `
          <ol>
            <li>Touchez <span class="bouton">+ Ajouter un inscrit</span>.</li>
            <li>Remplissez au minimum le <strong>prénom</strong> et le <strong>nom</strong> ; complétez naissance, sexe, arme,
              licence, coordonnées, date du certificat, cotisation et montant.</li>
            <li>Choisissez le <strong>statut</strong> (Actif, En attente) et, si vous êtes administrateur, le <strong>rôle</strong>.</li>
            <li>Enregistrez.</li>
          </ol>
          <p>La <strong>catégorie d’âge</strong> se calcule toute seule à partir de la date de naissance et de la saison.</p>
          <p>Le <strong>compte de connexion</strong> est créé automatiquement : identifiant <code>NOMPrénom</code>, mot de passe
            de départ <code>1234</code>. À la première connexion, l’archer est invité à le changer.</p>` },
      ],
    },
    {
      titre: 'Accès et mots de passe', resume: 'Réservé aux administrateurs',
      blocs: [
        { images: [['d06-acces', 'Accès et mot de passe']], html: `
          <p>Fiche de l’archer ▸ <span class="bouton clair">Accès et mot de passe</span>. Vous y lisez :</p>
          <ul>
            <li>son <strong>identifiant</strong>,</li>
            <li>son <strong>mot de passe actuel</strong>,</li>
            <li>la date de sa <strong>dernière connexion</strong>.</li>
          </ul>
          <p>Pour le dépanner : tapez un <strong>nouveau mot de passe</strong> et touchez <span class="bouton">Enregistrer</span>,
            ou touchez <span class="bouton clair">Remettre 1234</span>. Communiquez-le à l’archer, qui pourra le personnaliser.</p>
          <div class="attention"><strong>Un changement de mot de passe déconnecte</strong>Il invalide aussi le
            <em>lien d’accès direct</em> de l’archer. C’est la bonne réaction en cas de téléphone perdu.</div>
          <div class="attention"><strong>Les mots de passe sont lisibles dans le classeur</strong>Ils y sont écrits en clair,
            pour que le club puisse dépanner. Réservez l’accès au classeur Google Sheets aux seuls responsables.</div>` },
      ],
    },
    {
      titre: 'Saisir pour les archers', resume: 'Noter la partie d’un autre, mini-compétitions',
      blocs: [
        { images: [['d07-saisie-autre', 'Choisir l’archer']], titre: 'Noter la partie d’un autre archer', html: `
          <p>Pratique pour les jeunes ou les débutants sans téléphone. Dans la fenêtre de réglages, un menu
            <strong>Archer</strong> apparaît en haut : choisissez l’archer, puis réglez et notez la partie comme d’habitude.
            Elle est enregistrée dans <strong>ses</strong> scores, avec votre nom comme auteur de la saisie.</p>
          <p>Vous pouvez aussi <strong>modifier ou supprimer</strong> la partie d’un autre archer : touchez-la dans la liste
            de l’onglet Score (mode <em>Tout le club</em>).</p>` },
        { images: [['u09-competition', 'Mini-compétition']], titre: 'Animer une mini-compétition', html: `
          <ol>
            <li>Score ▸ <span class="bouton clair">👥 Mini-compétition</span>, cochez les participants.</li>
            <li><span class="bouton">Valider et lancer en direct</span> : la partie arrive sur le téléphone de chaque participant.</li>
            <li>Chacun note ses volées, ou vous notez pour tous ; le classement se met à jour à chaque volée validée.</li>
            <li>À la fin, <strong>vous seul</strong> (la personne qui l’a lancée) l’enregistrez : chaque archer reçoit sa partie,
              et les autres téléphones affichent « La partie a été enregistrée par … » avec un bouton <span class="bouton clair">Quitter</span>.</li>
          </ol>
          <p>Si un téléphone perd le réseau, <span class="bouton clair">📡 Relancer le direct</span> le reconnecte à la partie.</p>` },
      ],
    },
    {
      titre: 'Le calendrier des séances', resume: 'Qui vient, séance par séance',
      blocs: [
        { images: [['d08-calendrier', 'Le récapitulatif']], html: `
          <p>L’onglet <strong>Calendrier</strong> commence, pour l’encadrement, par un <strong>récapitulatif</strong> :</p>
          <ul>
            <li>une phrase sur la <strong>prochaine séance</strong> : présents, peut-être, absents et archers sans réponse ;</li>
            <li>un tableau avec <strong>une ligne par archer</strong> et <strong>une colonne par séance</strong> :
              <strong>P</strong> présent, <strong>?</strong> peut-être, <strong>A</strong> absent, <strong>—</strong> pas de réponse ;</li>
            <li>les <strong>totaux</strong> de chaque séance en bas du tableau.</li>
          </ul>
          <p>Les séances proposées suivent les <strong>jours de séance</strong> du club (lundi et samedi par défaut) sur le nombre
            de semaines choisi : deux réglages des Paramètres de l’application.</p>` },
      ],
    },
    {
      titre: 'Messages et classement', resume: 'Modération, emails, vue d’ensemble du club',
      blocs: [
        { images: [['d11-messages', 'Messages : chaque message peut être supprimé']], titre: 'Les messages', html: `
          <ul>
            <li>Comme tous les archers, vous écrivez à <em>Tout le club</em> ou à un archer en particulier.</li>
            <li>Un <strong>administrateur</strong> peut <strong>supprimer n’importe quel message</strong> (lien <em>Supprimer</em> sous chacun).</li>
            <li>Le réglage <strong>Notifications messages</strong> des Paramètres décide qui reçoit un <strong>email</strong> à chaque
              message : <code>NON</code>, <code>ENCADREMENT</code> ou <code>TOUS</code>. Un message privé est toujours envoyé par email
              à son destinataire quand l’option est active.</li>
          </ul>` },
        { images: [['d12-classement-club', 'Classement du club']], titre: 'Le club en un coup d’œil', html: `
          <p>L’encadrement voit toujours les scores et les statistiques de tous les archers :</p>
          <ul>
            <li><strong>Progression ▸ Classement</strong>, avec ses filtres (discipline, distance, catégorie, arme, période,
              nombre minimum de parties) ;</li>
            <li><strong>Progression ▸ Statistiques</strong> et <strong>Comparer</strong> : le menu <strong>Archer</strong> permet
              de choisir n’importe quel membre ;</li>
            <li>depuis une fiche, <span class="bouton clair">Statistiques</span> ouvre directement celles de l’archer.</li>
          </ul>` },
      ],
    },
    {
      titre: 'Les paramètres de l’application', resume: 'Réservé aux administrateurs',
      blocs: [
        { images: [['d09-parametres', 'Profil ▸ Paramètres de l’app'], ['d10-parametres-bas', 'Mots de passe et données']], html: `
          <p>Profil ▸ <span class="bouton">Paramètres de l’app</span>. Les réglages sont ceux de l’onglet <em>Paramètres</em>
            du classeur, modifiables ici sans l’ouvrir. Touchez <span class="bouton">Enregistrer</span> en bas de la liste.</p>
          <p>En bas de la page :</p>
          <ul>
            <li><strong>Mots de passe</strong> : les comptes qui utilisent encore le mot de passe de départ. L’application leur
              demande d’en changer à chaque connexion ; vous pouvez les relancer.</li>
            <li><strong>Données du classeur</strong> : <span class="bouton clair">Relire le classeur maintenant</span>, après une
              modification faite <em>à la main</em> dans Google Sheets (sinon elle apparaît d’elle-même sous cinq minutes).</li>
          </ul>` },
        { titre: 'Les réglages principaux', html: `
          <table>
            <tr><th style="width:52mm">Réglage</th><th>Effet</th></tr>
            <tr><td><strong>Nom du club</strong>, <strong>Saison en cours</strong></td><td>Affichés en tête de l’application. Saison vide : calculée automatiquement (du 1er septembre au 31 août).</td></tr>
            <tr><td><strong>Email de contact</strong></td><td>Reçoit le récapitulatif des rappels et sert de réponse aux emails du club.</td></tr>
            <tr><td><strong>Alerte certificat (jours)</strong>, <strong>Validité certificat (mois)</strong></td><td>Préavis avant l’alerte « à renouveler » et durée de validité retenue.</td></tr>
            <tr><td><strong>Montant cotisation adulte / jeune</strong></td><td>Montants proposés par défaut sur les fiches.</td></tr>
            <tr><td><strong>Emails rappels actifs</strong></td><td><code>OUI</code> : rappel hebdomadaire aux archers concernés (certificat, cotisation).</td></tr>
            <tr><td><strong>URL de l’application</strong></td><td>L’adresse envoyée dans les emails et les liens d’accès direct. Mettez celle de la page d’accueil du club : elle ne change jamais.</td></tr>
            <tr><td><strong>Jours de séance</strong>, <strong>Semaines au calendrier</strong></td><td>Les séances proposées au calendrier (ex. <code>lundi, samedi</code>) et sur combien de semaines.</td></tr>
            <tr><td><strong>Saisie ouverte à tous</strong></td><td><code>OUI</code> : chaque membre peut saisir pour les autres et lancer une mini-compétition. <code>NON</code> : réservé à l’encadrement.</td></tr>
            <tr><td><strong>Scores visibles par tous</strong></td><td><code>OUI</code> : chaque membre consulte les scores, statistiques et classements de tous. <code>NON</code> : les siens seulement.</td></tr>
            <tr><td><strong>Diamètre de flèche (mm)</strong></td><td>Pour la règle du cordon : une flèche qui touche le trait compte la zone supérieure.</td></tr>
            <tr><td><strong>Notifications messages</strong></td><td><code>NON</code>, <code>ENCADREMENT</code> ou <code>TOUS</code> : qui reçoit un email à chaque message.</td></tr>
          </table>` },
      ],
    },
    {
      titre: 'Le classeur Google Sheets', resume: 'Les onglets, le menu 🏹, les bonnes pratiques',
      intro: 'Toutes les données de l’application vivent dans le classeur du club. On peut le consulter et le corriger ' +
        'directement — avec quelques précautions.',
      blocs: [
        { titre: 'Les onglets', html: `
          <table>
            <tr><th style="width:38mm">Onglet</th><th>Contenu</th></tr>
            <tr><td><strong>Inscrits</strong></td><td>Une ligne par archer : identité, licence, certificat, cotisation, rôle, statut.</td></tr>
            <tr><td><strong>Utilisateurs</strong></td><td>Les comptes : identifiant, mot de passe, dernière connexion, apparence choisie.</td></tr>
            <tr><td><strong>Scores</strong></td><td>Une ligne par partie : réglages, détail des flèches, position des impacts, nombre de flèches par zone.</td></tr>
            <tr><td><strong>Disponibilités</strong></td><td>Les réponses au calendrier.</td></tr>
            <tr><td><strong>Messages</strong></td><td>Le fil du club et les messages privés.</td></tr>
            <tr><td><strong>Compétitions</strong></td><td>Les mini-compétitions en direct.</td></tr>
            <tr><td><strong>Paramètres</strong></td><td>Les réglages décrits au chapitre précédent.</td></tr>
            <tr><td><strong>Journal</strong></td><td>L’historique des actions (connexions, enregistrements, suppressions).</td></tr>
          </table>` },
        { titre: 'Le menu 🏹 Tir à l’arc du classeur', html: `
          <table>
            <tr><th style="width:62mm">Commande</th><th>Usage</th></tr>
            <tr><td>Installer / réparer le classeur</td><td>Crée les onglets et les colonnes manquants, sans toucher aux données.</td></tr>
            <tr><td>Créer le compte administrateur…</td><td>Premier compte, à la mise en service.</td></tr>
            <tr><td>Créer les comptes des inscrits</td><td>Crée d’un coup les comptes manquants (mot de passe <code>1234</code>).</td></tr>
            <tr><td>Réinitialiser un mot de passe…</td><td>Même chose que <em>Remettre 1234</em> dans l’application.</td></tr>
            <tr><td>Recalculer les catégories d’âge</td><td>À lancer au changement de saison.</td></tr>
            <tr><td>Envoyer les rappels maintenant / Activer le rappel hebdomadaire</td><td>Rappels par email pour les certificats et cotisations (lundi 8 h).</td></tr>
            <tr><td>Afficher l’URL de l’application</td><td>L’adresse à diffuser.</td></tr>
            <tr><td>Vérifier l’installation</td><td>Contrôle que tout est en place.</td></tr>
          </table>
          <div class="attention"><strong>Bonnes pratiques</strong>Ne renommez ni les onglets ni les titres de colonnes : l’application
            les reconnaît par leur nom. Ajoutez les archers de préférence depuis l’application (le compte est alors créé tout seul).
            Une correction faite à la main apparaît dans l’application sous cinq minutes, ou tout de suite avec
            <em>Relire le classeur maintenant</em>.</div>` },
      ],
    },
    {
      titre: 'Mettre à jour l’application', resume: 'Pour l’administrateur technique',
      blocs: [{ html: `
        <p>L’application repose sur trois éléments : le <strong>code</strong> dans Google Apps Script, les <strong>données</strong>
          dans le classeur, et la <strong>page d’accueil du club</strong> (sur GitHub Pages) qui porte l’icône, le plein écran et la session.</p>
        <h3>Publier une nouvelle version du code</h3>
        <ol>
          <li>Dans l’éditeur Apps Script : <strong>Déployer ▸ Gérer les déploiements</strong>.</li>
          <li>Touchez le crayon ✏️ du déploiement existant.</li>
          <li><strong>Version : Nouvelle version</strong>, puis <strong>Déployer</strong>.</li>
        </ol>
        <div class="attention"><strong>Ne supprimez jamais le déploiement</strong>Un nouveau déploiement a une
          <em>nouvelle adresse</em> : la page d’accueil du club ouvrirait alors une page d’erreur Google. Si cela arrive, il faut
          reporter la nouvelle adresse dans la page d’accueil (fichier <code>index.html</code>) puis la republier.</div>
        <h3>Publier la page d’accueil et ces guides</h3>
        <p>Dans GitHub Desktop : <strong>Commit</strong> puis <strong>Push origin</strong>. La page est en ligne une à deux minutes plus tard.
          Les guides sont publiés au même endroit, dans le dossier <code>guides/</code>.</p>
        <h3>Après une mise à jour de la page d’accueil</h3>
        <p>Demandez aux archers de supprimer puis réinstaller l’icône si l’affichage paraît décalé (Android comme iPhone) :
          le téléphone relit alors ses réglages.</p>
        <h3>Tester sur plusieurs appareils</h3>
        <p>Après une mise à jour, vérifiez l’application sur au moins un <strong>Android</strong>, un <strong>iPhone</strong> et un
          <strong>ordinateur</strong> : les bords d’écran, les notifications et l’installation ne se comportent pas tout à fait
          de la même façon d’un système à l’autre.</p>` }],
    },
    {
      titre: 'Les guides dans l’application', resume: 'Où les archers les trouvent',
      blocs: [
        { images: [['d14-guides', 'Profil ▸ Guides d’utilisation']], html: `
          <p>Les deux guides sont accessibles dans <strong>Profil ▸ Guides d’utilisation</strong> :</p>
          <ul>
            <li>les <strong>membres</strong> voient le <strong>Guide de l’archer</strong> ;</li>
            <li>l’<strong>encadrement</strong> et les <strong>administrateurs</strong> voient les deux.</li>
          </ul>
          <p>Les fichiers sont publiés avec la page d’accueil du club. Ils ne contiennent que des exemples fictifs ;
            comme toute page publique, quelqu’un qui en connaît l’adresse peut les ouvrir.</p>
          <div class="astuce"><strong>Pour diffuser l’application</strong>Envoyez aux archers l’adresse de la page d’accueil du club
            et le Guide de l’archer : le chapitre « Installer l’application » explique comment installer l’icône sur Android,
            iPhone, tablette ou ordinateur.</div>` },
      ],
    },
  ],
};
