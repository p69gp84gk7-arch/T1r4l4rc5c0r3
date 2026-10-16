/* Guide de l'archer : contenu. */
const ADRESSE = 'https://p69gp84gk7-arch.github.io/T1r4l4rc5c0r3/';

module.exports = {
  titre: 'Guide de l’archer',
  sur: 'Espace archers',
  accroche: 'Noter vos parties flèche par flèche, suivre vos progrès, répondre au calendrier ' +
    'et échanger avec le club : tout se fait depuis votre téléphone, en quelques gestes.',
  apercus: ['u04-accueil', 'u08-volee', 'u14-stats-superposer'],
  version: 'Octobre 2026',
  lecture: '<h3>Comment lire ce guide</h3>' +
    '<p>Chaque chapitre montre un écran de l’application et explique, pas à pas, ce qu’on y fait. ' +
    'Les noms des boutons sont écrits <span class="bouton">comme ceci</span>.</p>' +
    '<p style="margin:0">Les captures montrent des <strong>archers fictifs</strong> (Camille FONTAINE, Marc DELAGE…) : ' +
    'sur votre téléphone, vous verrez vos propres parties et les membres du club.</p>',
  sections: [
    {
      titre: 'En bref', resume: 'Ce que l’application vous permet de faire et comment s’y déplacer',
      blocs: [{ html: `
        <p>L’espace archers réunit au même endroit tout ce qui concerne votre pratique au club :</p>
        <table>
          <tr><th style="width:34mm">Onglet</th><th>Pour quoi faire</th></tr>
          <tr><td><strong>Accueil</strong></td><td>Vos chiffres du moment, l’analyse de votre tir, les messages arrivés et les derniers scores du club.</td></tr>
          <tr><td><strong>Score</strong></td><td>Noter une partie en posant vos flèches sur le blason, ou lancer une mini-compétition à plusieurs.</td></tr>
          <tr><td><strong>Progression</strong></td><td>Votre courbe de progression, des statistiques détaillées, la comparaison avec un autre archer et le classement du club.</td></tr>
          <tr><td><strong>Calendrier</strong></td><td>Les prochaines séances : vous indiquez si vous venez.</td></tr>
          <tr><td><strong>Messages</strong></td><td>Le fil du club et les messages privés entre archers.</td></tr>
          <tr><td><strong>Profil</strong> (rond en haut à droite)</td><td>Votre fiche, votre mot de passe, l’apparence, les guides d’utilisation et la déconnexion.</td></tr>
        </table>
        <h3 style="color:#15594a;font-size:12.5pt;margin:5mm 0 2.5mm">Se déplacer dans l’application</h3>
        <ul>
          <li>La <strong>barre du bas</strong> donne accès aux cinq onglets : Accueil, Score, Progression, Calendrier, Messages.</li>
          <li>Votre <strong>Profil</strong> est le rond en haut à droite de l’écran.</li>
          <li>Une <strong>pastille rouge</strong> sur Messages indique le nombre de messages non lus.</li>
          <li>Sur ordinateur, tous les onglets sont regroupés dans le bandeau du haut.</li>
        </ul>
        <div class="astuce"><strong>Vos données restent au club</strong>Tout est enregistré dans le classeur du club.
          Un message privé n’est lu que par son auteur et son destinataire.</div>` }],
    },
    {
      titre: 'Installer l’application sur votre téléphone', resume: 'Un raccourci sur l’écran d’accueil, comme une vraie application',
      intro: 'L’application s’ouvre dans le navigateur, mais elle est bien plus agréable installée sur l’écran ' +
        'd’accueil : plein écran, icône du club, connexion mémorisée et notifications des messages.',
      blocs: [{ html: `
        <p>L’adresse du club est&nbsp;: <code>${ADRESSE}</code></p>
        <table>
          <tr><th style="width:50%">Sur iPhone (Safari)</th><th>Sur Android (Chrome)</th></tr>
          <tr><td><ol style="margin:0">
            <li>Ouvrez l’adresse du club dans <strong>Safari</strong>.</li>
            <li>Touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut).</li>
            <li>Choisissez <strong>Sur l’écran d’accueil</strong>. Si l’option <em>Ouvrir comme app web</em> apparaît, laissez-la activée.</li>
            <li>Touchez <strong>Ajouter</strong> : l’icône du club apparaît.</li></ol></td>
          <td><ol style="margin:0">
            <li>Ouvrez l’adresse du club dans <strong>Chrome</strong>.</li>
            <li>Touchez le menu <strong>⋮</strong> en haut à droite.</li>
            <li>Choisissez <strong>Ajouter à l’écran d’accueil</strong> (ou <em>Installer l’application</em>).</li>
            <li>Confirmez : l’icône du club apparaît.</li></ol></td></tr>
        </table>
        <div class="astuce"><strong>Ouvrez toujours l’application par son icône</strong>C’est elle qui garde votre
          connexion (« Rester connecté »), règle l’affichage autour de l’encoche du téléphone et peut vous prévenir
          des nouveaux messages. À la première ouverture, un bandeau propose d’<strong>activer les notifications</strong> :
          touchez <span class="bouton">Activer</span>.</div>
        <div class="attention"><strong>Après une mise à jour annoncée par le club</strong>Si l’affichage paraît décalé,
          supprimez l’icône et recréez-la : le téléphone relit alors les réglages d’affichage.</div>` }],
    },
    {
      titre: 'Se connecter', resume: 'Identifiant, mot de passe, rester connecté',
      blocs: [
        { images: [['u01-connexion', 'L’écran de connexion']], titre: 'Votre identifiant', html: `
          <p>Votre identifiant est votre <strong>NOM en majuscules suivi de votre Prénom</strong>, collés :
            <code>FONTAINECamille</code>, <code>DUPONTMarie</code>…</p>
          <p>Pas d’inquiétude pour la saisie : majuscules, accents et espaces sont ignorés —
            <em>fontaine camille</em> fonctionne aussi.</p>
          <p>Le <strong>mot de passe de départ</strong> vous est donné par le club (c’est <code>1234</code> à la création du compte).</p>
          <ol>
            <li>Tapez votre identifiant et votre mot de passe.</li>
            <li>Cochez <strong>Rester connecté sur cet appareil</strong> si le téléphone est le vôtre.</li>
            <li>Touchez <span class="bouton">Se connecter</span>.</li>
          </ol>
          <div class="astuce"><strong>Mot de passe oublié ?</strong>Demandez à un administrateur du club :
            il peut vous en donner un nouveau en quelques secondes.</div>` },
        { images: [['u02-premier-mdp', 'À la première connexion']], titre: 'Choisir votre mot de passe', html: `
          <p>Tant que vous utilisez le mot de passe de départ, l’application vous demande d’en choisir un autre :
            l’adresse de l’application est connue, et <code>1234</code> l’est de tous.</p>
          <ol>
            <li>Le mot de passe actuel est déjà rempli.</li>
            <li>Tapez votre nouveau mot de passe : <strong>4 caractères minimum</strong>.</li>
            <li>Touchez <span class="bouton">Enregistrer</span>.</li>
          </ol>
          <p><span class="bouton clair">Plus tard</span> reste possible, mais la demande revient à chaque ouverture.
            Vous pourrez aussi le changer plus tard depuis votre <strong>Profil</strong>.</p>` },
      ],
    },
    {
      titre: 'L’accueil', resume: 'Vos chiffres, l’analyse de votre tir, les messages',
      blocs: [
        { images: [['u03-accueil-messages', 'Des messages vous attendent'], ['u04-accueil', 'Votre tableau de bord']], html: `
          <p><strong>À l’ouverture</strong>, si de nouveaux messages sont arrivés, une fenêtre vous montre le dernier :
            <span class="bouton">Lire</span> ouvre la messagerie, <span class="bouton clair">Plus tard</span> la referme.</p>
          <p><strong>En haut</strong>, trois compteurs : vos parties, celles des 30 derniers jours et votre moyenne par flèche.</p>
          <p><strong>Mon tir</strong> résume votre tir en six chiffres :</p>
          <table>
            <tr><td style="width:38mm"><strong>% jaunes (9-10)</strong></td><td>Part de vos flèches à 9 ou 10.</td></tr>
            <tr><td><strong>% de 10</strong></td><td>Part de vos flèches dans le 10.</td></tr>
            <tr><td><strong>Écart-type moy.</strong></td><td>Votre régularité d’une volée à l’autre : <em>plus c’est bas, plus vous êtes régulier</em>.</td></tr>
            <tr><td><strong>Centrage moyen</strong></td><td>La distance entre le centre de votre groupe de flèches et le centre du blason. Idéal : 0.</td></tr>
            <tr><td><strong>Périmètre / volée</strong></td><td>La longueur de ficelle qu’il faudrait pour entourer les flèches d’une volée : plus elle est courte, plus le groupe est serré.</td></tr>
            <tr><td><strong>Surface / volée</strong></td><td>La surface couverte par les flèches d’une volée.</td></tr>
          </table>
          <p>Viennent ensuite votre meilleure partie, le bouton <span class="bouton clair">Toutes mes statistiques</span>,
            vos éventuelles alertes (certificat médical ou cotisation à régulariser) et les derniers scores du club.</p>` },
      ],
    },
    {
      titre: 'Noter une partie', resume: 'Régler, poser ses flèches sur le blason, enregistrer',
      intro: 'C’est le cœur de l’application : vous notez chaque flèche à l’endroit exact où elle a touché le blason. ' +
        'Le score se calcule tout seul, et la position des flèches nourrit ensuite vos statistiques.',
      blocs: [
        { images: [['u05-score', 'L’onglet Score']], titre: '1. Démarrer', html: `
          <p>Ouvrez l’onglet <strong>Score</strong> et touchez <span class="bouton">🎯 Régler une partie</span>.</p>
          <p>En dessous, la liste de vos <strong>dernières parties</strong> (ou celles de tout le club). Touchez-en une pour
            la revoir en détail, la <strong>modifier</strong> ou la supprimer.</p>
          <div class="astuce"><strong>Une partie en cours n’est jamais perdue</strong>Elle est mise de côté
            automatiquement. Si l’application se ferme ou si le téléphone s’éteint, vous la retrouvez à la réouverture.</div>` },
        { images: [['u06-reglages', 'La fenêtre de réglages']], titre: '2. Régler la partie', html: `
          <p>Une fenêtre réunit tous les réglages, à vérifier avant de tirer :</p>
          <ul>
            <li><strong>Date</strong> et <strong>Moment</strong> (entraînement, concours club, concours officiel…) ;</li>
            <li><strong>Nom de la séance</strong> et <strong>Lieu</strong>, pour vous y retrouver plus tard ;</li>
            <li><strong>Discipline</strong>, <strong>Distance</strong> et <strong>Blason</strong> — le blason habituel de la distance est proposé ;</li>
            <li><strong>Nombre de volées</strong> et <strong>flèches par volée</strong> ;</li>
            <li>la façon de noter : <strong>Sur la cible</strong> (recommandé), <strong>Au clavier</strong> (on tape les valeurs)
              ou <strong>Score global</strong> (on ne note que le total).</li>
          </ul>
          <p>Touchez <span class="bouton">Valider et ouvrir le carton</span>. <span class="bouton clair">Plus tard</span> referme la fenêtre.</p>
          <div class="attention"><strong>Choisissez le bon blason</strong>La valeur de chaque flèche dépend de la taille du blason.
            Vous vous êtes trompé ? Voir « Changer de blason » page suivante.</div>` },
        { images: [['u08-volee', 'La saisie d’une volée']], titre: '3. Poser les flèches d’une volée', html: `
          <ol>
            <li>Touchez le blason : la volée s’ouvre en grand.</li>
            <li><strong>Posez le doigt</strong> sur le blason et faites-le glisser : une <strong>loupe</strong> montre
              exactement où la flèche va se poser et combien elle vaut.</li>
            <li><strong>Levez le doigt</strong> : la flèche est posée, sa valeur s’inscrit dans les cases du haut.</li>
            <li>Recommencez pour chaque flèche, puis touchez <span class="bouton">Valider la volée</span>.</li>
          </ol>
          <p>Une flèche mal placée ? <span class="bouton clair">← Effacer</span> retire la dernière.
            Une flèche hors du blason compte <strong>M</strong> (manquée).</p>
          <p>Le <strong>périmètre</strong> du groupe s’affiche sous les cases : un bon indicateur de la qualité de la volée.</p>
          <div class="astuce"><strong>Règle du cordon</strong>Une flèche qui touche le trait entre deux zones compte la zone
            supérieure, comme en concours : l’application en tient compte.</div>` },
        { images: [['u07-carton', 'Le carton en cours de partie']], titre: '4. Suivre le carton et enregistrer', html: `
          <p>Le <strong>carton</strong> rappelle les réglages en haut, puis affiche le score, le pourcentage, le nombre de flèches
            et la moyenne. Le blason montre <strong>toutes</strong> les flèches de la partie.</p>
          <ul>
            <li>Touchez le blason pour saisir la <strong>volée suivante</strong>.</li>
            <li>Touchez une volée de la liste pour la <strong>corriger</strong>.</li>
            <li><span class="bouton clair">↶ Revenir</span> annule la dernière action.</li>
            <li><span class="bouton clair">Réglages</span> rouvre la fenêtre de réglages.</li>
            <li><strong>Annuler la partie</strong> l’efface, après confirmation.</li>
          </ul>
          <p>Toutes les volées tirées ? Touchez <span class="bouton">Enregistrer la partie</span> en bas du carton :
            elle rejoint vos scores et vos statistiques.</p>` },
        { titre: 'Changer de blason ou modifier une partie déjà enregistrée', html: `
          <p><strong>Changer de blason en cours de partie</strong> (par exemple 80 cm choisi au lieu de 40 cm) : ouvrez
            <span class="bouton clair">Réglages</span> et choisissez le bon blason. L’application vous pose une question :</p>
          <ul>
            <li><strong>Garder les points</strong> : les flèches gardent leur valeur, leur position est ajustée au nouveau blason.
              C’est le bon choix quand vous avez <em>noté sur le mauvais blason</em> ce que vous avez tiré.</li>
            <li><strong>Garder les distances</strong> : les flèches restent au même endroit en centimètres et leur valeur est recalculée.</li>
          </ul>
          <p><strong>Modifier une partie enregistrée</strong> : onglet Score, touchez la partie dans la liste, puis
            <span class="bouton clair">Modifier</span>. Elle se rouvre dans le carton ; corrigez, puis enregistrez de nouveau.</p>` },
      ],
    },
    {
      titre: 'La mini-compétition', resume: 'Tirer à plusieurs, en direct sur chaque téléphone',
      blocs: [
        { images: [['u09-competition', 'Choisir les participants']], html: `
          <p>Pour tirer à plusieurs, avec un classement qui se met à jour au fil des volées :</p>
          <ol>
            <li>Onglet Score : touchez <span class="bouton clair">👥 Mini-compétition</span>
              (ou l’onglet <em>Mini-compétition</em> en haut de la fenêtre de réglages).</li>
            <li><strong>Cochez les participants</strong>. Chacun aura son carton.</li>
            <li>Réglez la partie comme d’habitude, puis touchez <span class="bouton">Valider et lancer en direct</span>.</li>
          </ol>
          <p>La partie apparaît alors <strong>sur le téléphone de chaque participant</strong>. Chacun peut noter ses volées,
            ou une seule personne peut noter pour tout le monde : les volées validées s’échangent entre les téléphones.</p>
          <p>À la fin, <strong>seule la personne qui a lancé la mini-compétition l’enregistre</strong> — cela évite les doublons.
            Chaque archer reçoit sa partie dans ses scores. Sur les autres téléphones, un message indique
            « La partie a été enregistrée par … » avec un bouton <span class="bouton clair">Quitter</span>.</p>
          <div class="astuce"><strong>Selon les réglages du club</strong>La saisie pour d’autres archers et les mini-compétitions
            peuvent être réservées à l’encadrement.</div>` },
      ],
    },
    {
      titre: 'Votre progression', resume: 'La courbe de votre moyenne, partie après partie',
      blocs: [
        { images: [['u10-progression', 'Onglet Progression']], html: `
          <p>L’onglet <strong>Progression</strong> s’ouvre sur votre courbe : la <strong>moyenne par flèche</strong> de chaque partie,
            et en pointillés la <strong>tendance</strong> sur les cinq dernières parties.</p>
          <p>Le badge en haut du graphique résume votre évolution depuis le début, en points par flèche.</p>
          <p>Le menu <strong>Séance</strong> permet d’ouvrir une partie précise. Si le club partage les scores,
            le menu <strong>Archer</strong> permet de consulter la progression d’un autre membre.</p>
          <p>Quatre sous-onglets en haut : <strong>Progression</strong>, <strong>Statistiques</strong>,
            <strong>Comparer</strong> et <strong>Classement</strong> — détaillés dans les pages suivantes.</p>` },
      ],
    },
    {
      titre: 'Les statistiques', resume: 'Carte des impacts, graphiques, analyse d’une séance',
      intro: 'Progression ▸ Statistiques. C’est ici que la position de vos flèches prend tout son sens : ' +
        'où tombe votre groupe, se resserre-t-il, êtes-vous plus régulier qu’il y a un mois ?',
      blocs: [
        { images: [['u11-stats-filtres', 'Les filtres']], titre: 'Choisir ce qu’on regarde', html: `
          <ul>
            <li><strong>Séance</strong> : un curseur avec un point par partie. Tout à gauche, <em>Toutes les parties</em> ;
              glissez vers la droite pour parcourir vos parties, de la plus ancienne à la plus récente.</li>
            <li><strong>Période</strong> : depuis toujours, 12 mois, 3 mois, 30 jours ou des dates précises.</li>
            <li><strong>Discipline</strong>, <strong>Distance</strong> et <strong>Lieu</strong> affinent la sélection.</li>
          </ul>
          <p>Le libellé change pendant que vous glissez ; les statistiques se recalculent quand vous relâchez.</p>` },
        { images: [['u12-stats-impacts', 'La carte des impacts']], titre: 'La carte des impacts', html: `
          <p>Toutes les flèches de la sélection, sur un même blason. Les parties tirées sur un autre blason sont ramenées
            à la même échelle pour rester comparables.</p>
          <p>Sous la carte : le <strong>centrage</strong> (le centre de votre groupe est-il au centre du blason ?),
            le <strong>périmètre</strong> par volée et la <strong>dispersion</strong> (l’écart moyen des flèches autour du centre du groupe).</p>
          <div class="astuce"><strong>Lien avec les graphiques</strong>Glissez le doigt sur un graphique : seules les flèches
            du point lu restent sur la carte, avec ses propres mesures. Relâchez : toutes reviennent.</div>` },
        { images: [['u13-stats-graphe', 'Le graphique « Partie par partie »']], titre: 'Le graphique « Partie par partie »', html: `
          <p>Chaque pastille affiche une mesure au fil de vos parties : moyenne, score, centrage, décalage, périmètre, surface,
            jaunes, 10, régularité, manquées…</p>
          <p>Les pastilles marquées d’un <strong>chevron ▾</strong> cachent un <strong>petit menu</strong> : touchez le chevron pour
            changer de variante. Par exemple :</p>
          <ul>
            <li><em>Score %</em> ▸ <strong>En points</strong> ;</li>
            <li><em>% jaunes</em> ▸ <strong>Nombre de 9 et 10</strong>, <strong>Nombre de 10</strong>, <strong>Nombre de 9</strong> ;</li>
            <li><em>% de 10</em>, <em>% rouges</em>, <em>Manquées</em> ▸ en part ou en nombre de flèches.</li>
          </ul>
          <p>Touchez un point du graphique pour ouvrir la partie correspondante. Plus bas, la <strong>répartition des touches</strong>
            compte vos flèches zone par zone.</p>` },
        { images: [['u14-stats-superposer', 'Deux mesures, deux axes']], titre: 'Superposer deux mesures', html: `
          <p>L’interrupteur <strong>Superposer</strong> réunit plusieurs mesures sur le même graphique. Une fois activé,
            touchez les pastilles à réunir.</p>
          <ul>
            <li><strong>Avec deux mesures</strong>, chacune a <strong>son propre axe</strong> : la première se lit à gauche,
              la seconde à droite, chacune dans sa couleur et dans son unité. La légende rappelle le côté de chaque courbe.</li>
            <li><strong>Au-delà de deux</strong>, chaque courbe est ramenée à sa propre échelle : on compare les formes,
              et la lecture du point affiche toujours les vraies valeurs.</li>
          </ul>
          <p>Exemple ci-contre : la moyenne par flèche et le score suivent la même pente — la progression est nette.</p>` },
        { images: [['u15-stats-seance', 'Une séance choisie'], ['u16-stats-volees', 'Volée par volée']], titre: 'Analyser une séance', html: `
          <p>Choisissez une partie avec le curseur <strong>Séance</strong> (ou touchez-la dans la liste des parties) : son détail s’ouvre.</p>
          <ul>
            <li>le score, la moyenne et le centrage de la séance, et sa <strong>cible</strong> avec toutes les flèches ;</li>
            <li>le graphique <strong>Volée par volée</strong> : score, moyenne, <em>moyenne cumulée</em> (la séance monte-t-elle ou s’essouffle-t-elle ?),
              périmètre, surface, centrage, jaunes… Glissez le doigt dessus : seules les flèches de la volée lue restent sur la cible ;</li>
            <li>la <strong>liste des volées</strong>, avec pour chacune la moyenne, le périmètre et la surface du groupe.</li>
          </ul>
          <p><span class="bouton clair">← Toutes les parties</span> revient à l’ensemble.</p>` },
      ],
    },
    {
      titre: 'Comparer et se classer', resume: 'Deux archers, deux parties, le classement du club',
      blocs: [
        { images: [['u17-comparer', 'Le tableau comparatif'], ['u18-comparer-graphe', 'Les graphiques comparés']], titre: 'Comparer', html: `
          <p>Progression ▸ <strong>Comparer</strong> propose deux façons de faire :</p>
          <ul>
            <li><strong>Deux archers</strong>, chacun sur l’ensemble de ses parties ;</li>
            <li><strong>Deux parties d’un archer</strong> — par exemple votre meilleure séance face à la dernière.</li>
          </ul>
          <p>Le tableau met en <strong>vert</strong> le meilleur des deux sur chaque ligne. Les graphiques superposent les deux
            archers ; l’interrupteur <strong>Superposer</strong> et les petits menus des pastilles fonctionnent comme dans les statistiques.</p>` },
        { images: [['u19-classement', 'Le classement du club']], titre: 'Le classement', html: `
          <p>Progression ▸ <strong>Classement</strong> range les archers du club selon le critère choisi :
            <strong>Général</strong>, <strong>Moyenne</strong>, <strong>Flèches tirées</strong>, <strong>Parties</strong>…</p>
          <p>Le bouton <strong>Filtres</strong> limite le classement par discipline, distance, catégorie, arme, période ou nombre minimum de parties.</p>
          <p>Votre ligne est surlignée et marquée <em>vous</em>. Touchez un archer pour voir le détail de ses parties.</p>` },
      ],
    },
    {
      titre: 'Le calendrier', resume: 'Dire si vous venez aux prochaines séances',
      blocs: [
        { images: [['u20-calendrier', 'Les séances à venir']], html: `
          <p>L’onglet <strong>Calendrier</strong> liste les prochaines séances du club (les jours d’entraînement habituels).</p>
          <p>Pour chacune, touchez <span class="bouton clair">Présent</span>, <span class="bouton clair">Absent</span> ou
            <span class="bouton clair">Peut-être</span>. Votre réponse est enregistrée aussitôt et peut être changée à tout moment.</p>
          <p>Sous la date, le nombre de présents, de « peut-être » et d’absents vous dit combien vous serez.</p>
          <div class="astuce"><strong>Pourquoi répondre ?</strong>L’encadrement prépare la séance (cibles, matériel,
            atelier) en fonction du nombre d’archers attendus.</div>` },
      ],
    },
    {
      titre: 'Les messages', resume: 'Le fil du club et les messages privés',
      blocs: [
        { images: [['u21-messages', 'L’onglet Messages']], html: `
          <ol>
            <li>Choisissez le <strong>Destinataire</strong> : <em>Tout le club</em>, ou un archer en particulier pour un message privé.</li>
            <li>Écrivez votre message.</li>
            <li>Touchez <span class="bouton">Publier</span>.</li>
          </ol>
          <p>Chaque message porte une étiquette : <em>tout le club</em>, <em>privé · pour vous</em> quand vous le recevez,
            <em>privé · pour Marc DELAGE</em> quand vous l’avez écrit. Un message privé n’est visible que de son auteur et de son destinataire.</p>
          <p>Vous pouvez <strong>supprimer</strong> vos propres messages.</p>
          <h3 style="margin-top:4mm">Quand arrive un message ?</h3>
          <ul>
            <li><strong>Application ouverte</strong> : en 30 secondes au plus, avec une pastille rouge sur l’onglet.</li>
            <li><strong>Notification du téléphone</strong> et pastille sur l’icône : si vous les avez activées depuis le raccourci du club.</li>
            <li><strong>Par email</strong> : immédiatement, même application fermée, si le club a activé cette option.</li>
          </ul>` },
      ],
    },
    {
      titre: 'Votre profil', resume: 'Fiche, guides, apparence, mot de passe, lien direct',
      blocs: [
        { images: [['u22-profil', 'Votre fiche'], ['u24-guides', 'Les guides et l’apparence']], html: `
          <p>Touchez le <strong>rond en haut à droite</strong>. Vous y trouvez :</p>
          <ul>
            <li><strong>votre fiche</strong> : identifiant, licence, état du certificat médical et de la cotisation, coordonnées.
              <span class="bouton clair">Ajouter la photo</span> met votre photo ; <span class="bouton">Modifier mes informations</span> corrige vos coordonnées ;</li>
            <li><strong>Guides d’utilisation</strong> : ce guide, à relire quand vous voulez ;</li>
            <li><strong>Apparence</strong> : <em>Auto</em> (suit le réglage clair/sombre du téléphone), <em>Clair</em> ou <em>Sombre</em>,
              et six couleurs au choix. Le réglage vous suit sur tous vos appareils ;</li>
            <li><strong>Licence</strong> : <span class="bouton clair">Déposer le PDF</span> de votre licence pour l’avoir toujours sous la main.</li>
          </ul>` },
        { images: [['u25-profil-fin', 'Mot de passe et lien direct'], ['u26-lien-direct', 'Votre lien d’accès direct']], html: `
          <ul>
            <li><span class="bouton clair">Changer mon mot de passe</span> : à faire dès la première connexion si ce n’est pas déjà fait.</li>
            <li><span class="bouton clair">Mon lien d’accès direct</span> : une adresse personnelle qui ouvre l’application
              <strong>déjà connectée</strong>, pratique sur un appareil où la connexion ne tient pas. Elle <strong>vaut mot de passe</strong> :
              ne la partagez pas. Elle reste valable un an et cesse de fonctionner dès que vous changez votre mot de passe —
              c’est aussi la solution en cas de téléphone perdu.</li>
            <li><span class="bouton" style="background:#a8342a">Déconnexion</span> : sur un téléphone ou une tablette partagés.</li>
          </ul>` },
        { images: [['u23-profil-bas', 'Bords de l’écran']], titre: 'Bords de l’écran', html: `
          <p>Cette rubrique n’apparaît que dans l’application ouverte <strong>depuis son icône</strong>. Elle indique la place réservée
            sous l’heure du téléphone et au-dessus de la barre d’accueil, mesurée automatiquement.</p>
          <p>Si un titre passe sous l’heure ou s’il reste une bande vide en bas de l’écran, glissez les curseurs.
            <span class="bouton clair">Revenir au réglage automatique</span> annule vos réglages.</p>` },
      ],
    },
    {
      titre: 'Questions fréquentes', resume: 'Les réponses aux petits soucis du quotidien',
      blocs: [{ html: `<div class="faq">
        <h3>J’ai oublié mon mot de passe.</h3>
        <p>Demandez à un administrateur du club : il vous en fixe un nouveau, que vous pourrez ensuite personnaliser dans votre Profil.</p>
        <h3>L’application me redemande de me connecter à chaque fois.</h3>
        <p>Ouvrez-la par l’<strong>icône du club</strong> sur l’écran d’accueil et cochez <strong>Rester connecté</strong>.
          À défaut, utilisez votre <strong>lien d’accès direct</strong> (Profil).</p>
        <h3>Je ne vois pas les scores des autres archers.</h3>
        <p>C’est un choix du club : la consultation des scores de tous peut être réservée à l’encadrement.</p>
        <h3>J’ai validé une volée par erreur.</h3>
        <p>Dans le carton, touchez la volée dans la liste : elle se rouvre et vous pouvez la corriger.</p>
        <h3>J’ai noté ma partie sur le mauvais blason.</h3>
        <p>Ouvrez <strong>Réglages</strong>, choisissez le bon blason et répondez <strong>Garder les points</strong> :
          les valeurs de vos flèches sont conservées, leur position s’adapte au bon blason. Si la partie est déjà enregistrée,
          touchez-la dans la liste puis <strong>Modifier</strong>.</p>
        <h3>J’ai perdu ma connexion en pleine partie.</h3>
        <p>Continuez à noter : la partie est gardée sur le téléphone et mise de côté dès que le réseau revient. Rien n’est perdu.</p>
        <h3>Le haut de l’application passe sous l’heure, ou il reste une bande vide en bas.</h3>
        <p>Supprimez l’icône de l’écran d’accueil et recréez-la. Si le défaut persiste, réglez-le dans
          <strong>Profil ▸ Bords de l’écran</strong>.</p>
        <h3>Je ne reçois pas de notification.</h3>
        <p>Les notifications passent par l’icône du club : ouvrez l’application par elle et touchez <strong>Activer</strong>
          dans le bandeau proposé. Sur iPhone, elles ne fonctionnent que depuis l’icône installée sur l’écran d’accueil.</p>
        </div>` }],
    },
  ],
};
