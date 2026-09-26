# Espace archers — Google Sheets + Apps Script

Application web mobile pour le club, adossée au classeur **« tir à l’arc 2026 »**.
Deux usages : la **gestion des inscrits** (licence, certificat médical, cotisation)
et le **suivi des scores** (saisie des flèches directement sur la cible,
statistiques par zone et par surface, flèches de progression).

Tout est stocké dans le Google Sheet : aucune base de données externe.

---

## 1. Installation (15 minutes)

1. Ouvrir le classeur **tir à l’arc 2026** (celui dont le premier onglet s’appelle `inscrits`).
2. Menu **Extensions ▸ Apps Script**.
3. Dans l’éditeur, créer un fichier par fichier du dossier `src/` et y coller le contenu :
   - fichiers `.gs` : **+ ▸ Script**, en reprenant le même nom (`Config`, `Data`, `Auth`, …) ;
   - fichiers `.html` : **+ ▸ HTML** (`Index`, `Styles`, `JavaScript`) ;
   - `appsscript.json` : le **manifeste**, déjà présent mais masqué. Pour le voir :
     **⚙ Paramètres du projet ▸ « Afficher le fichier manifeste appsscript.json dans
     l’éditeur »**. Vérifiez seulement qu’il porte `"runtimeVersion": "V8"` et le
     fuseau `Europe/Paris` — rien d’autre n’est nécessaire.
4. Enregistrer, revenir au Sheet et **recharger la page** : un menu 🏹 **Tir à l’arc** apparaît.
5. **🏹 ▸ Installer / réparer le classeur** : les colonnes de l’onglet `Inscrits`
   et les onglets `Scores`, `Utilisateurs`, `Disponibilités`, `Messages`,
   `Paramètres` et `Journal` sont créés.
6. **🏹 ▸ Créer le compte administrateur…** : saisir prénom, nom, et éventuellement
   n° de licence et email. L’identifiant `NOMPrénom` et le mot de passe `1234` s’affichent.
7. Vérifier l’onglet **Paramètres** : saison `2026-2027`, cotisations 100 € / 60 €,
   nom du club et email de contact à compléter.

### Déploiement de l’application

**Déployer ▸ Nouveau déploiement ▸ Application Web**

| Réglage | Valeur | Pourquoi |
| --- | --- | --- |
| Exécuter en tant que | **Moi** | le script lit et écrit *votre* classeur ; les archers n’ont aucun droit sur le Sheet |
| Qui a accès | **Tout le monde** | ⚠️ pas « Tout le monde disposant d’un compte Google » : c’est ce réglage qui évite aux archers de se connecter à un compte Google |

Autoriser les accès demandés, copier l’URL et la diffuser aux archers.
L’URL est retrouvable à tout moment via **🏹 ▸ Afficher l’URL de l’application**.

> **Si vous créez plusieurs déploiements**, reportez l’adresse diffusée dans la ligne
> « URL de l’application » de l’onglet **Paramètres**. Sans cela, l’application
> utilise celle du dernier déploiement enregistré — qui peut être privé — et les
> liens d’accès direct comme les emails renverraient vers une page inaccessible.
> Pensez aussi à archiver les déploiements inutilisés : *Déployer ▸ Gérer les
> déploiements ▸ ⋮ ▸ Archiver*.

« Tout le monde » ne veut pas dire « sans contrôle » : la page ne montre rien tant
que l’archer n’a pas saisi son identifiant et son mot de passe (onglet `Utilisateurs`).
Le compte Google n’a plus aucun rôle ici — c’est le vôtre qui exécute le script,
et le vôtre seul qui ouvre le classeur.

> Si un archer tombe sur un écran Google lui demandant de se connecter, c’est que
> le déploiement est resté sur « Tout le monde disposant d’un compte Google » :
> **Déployer ▸ Gérer les déploiements ▸ ✏️ ▸ Qui a accès : Tout le monde**,
> puis *Nouvelle version*.

---

## 2. Comment on s’en sert

### Rôles

| Rôle | Droits |
| --- | --- |
| **Membre** | Sa fiche ; **consultation des scores, statistiques, progression et comparatifs de tous les archers** (paramètre *Scores visibles par tous*) ; **saisie de parties pour les autres archers et mini-compétitions**, cartes de tous comprises (paramètre *Saisie ouverte à tous*). Ni annuaire ni coordonnées — l’onglet *Inscrits* ne lui est pas affiché — et il ne supprime que ses propres parties |
| **Encadrant** | + fiches complètes, suppression de n’importe quelle partie |
| **Admin** | + création/archivage d’inscrits, attribution des rôles, réinitialisation des mots de passe |

Le cloisonnement est appliqué **côté serveur**, pas seulement dans l’affichage :
un membre qui tenterait d’appeler l’API avec l’identifiant d’un autre archer
reçoit un refus. Le rôle se règle dans la colonne `Rôle` de l’onglet `Inscrits`.

Le partage des scores se règle dans l’onglet **Paramètres**, ligne **Scores visibles
par tous** : `OUI` (par défaut) ouvre la consultation à chaque membre, `NON` revient
au cloisonnement — chacun ne voit que ses propres résultats. De même, **Saisie ouverte
à tous** (`OUI` par défaut) laisse chaque membre saisir pour les autres, lancer une
mini-compétition et remplir toutes les cartes ; `NON` réserve cela à l’encadrement. Pour choisir un archer,
un membre ne reçoit que les noms, catégories et armes du club : ni date de
naissance, ni licence, ni certificat, ni cotisation, ni coordonnées.

### Connexion

L’onglet **`Utilisateurs`** tient un compte par archer :

| Identifiant | Mot de passe |
| --- | --- |
| `NOMPrénom` — nom en majuscules collé au prénom (ex. `DUPONTMarie`) | `1234` à la création, modifiable |

- **🏹 ▸ Créer les comptes des inscrits** génère les comptes manquants d’un coup ;
  un archer ajouté depuis l’application reçoit le sien automatiquement.
- Chacun personnalise son mot de passe dans l’application, onglet **Profil**
  (l’app refuse de conserver `1234` comme mot de passe choisi).
- Depuis l’application, un **administrateur** ouvre la fiche d’un archer puis
  *Accès et mot de passe* : il y lit l’identifiant, le mot de passe en cours et la
  date de dernière connexion, **fixe un nouveau mot de passe** ou le remet à `1234`.
- Le menu **🏹 ▸ Réinitialiser un mot de passe…** fait la même chose depuis le Sheet.
- La saisie ignore la casse, les accents et les espaces : `dupont marie` ouvre le
  compte `DUPONTMarie`. Les homonymes reçoivent un suffixe (`DUPONTMarie2`).
- **Session** : la connexion vaut pour la visite en cours. La case « Rester connecté »
  tente de la mémoriser, mais **Google affiche l’application dans un cadre dont
  l’adresse change à chaque visite** : la mémoire du navigateur y est perdue d’une
  fois sur l’autre. C’est une limite du support, pas un réglage.
- **Lien d’accès direct** : la vraie solution pour un raccourci sur téléphone.
  Onglet **Profil ▸ Mon lien d’accès direct** : l’archer obtient une adresse
  personnelle qui ouvre l’application **déjà connectée**, à mettre en signet ou sur
  l’écran d’accueil. Elle vaut mot de passe, reste valable un an, et **cesse de
  fonctionner dès que l’archer change son mot de passe** — ce qui sert aussi de
  bouton d’urgence en cas de téléphone perdu.

> Le mot de passe est inscrit **en clair** dans l’onglet `Utilisateurs`, pour que le
> club puisse le lire et le corriger : réservez l’accès au **classeur** aux
> responsables — les archers n’ont besoin que de l’URL de l’application.

### Saisie d’une partie

Onglet **Score**, en trois temps :

1. **Régler une partie** ou **Mini-compétition** : une **fenêtre** s'ouvre sur les
   réglages — date, *moment* (entraînement, concours club, concours officiel,
   championnat), nom de la séance, archer ou participants, discipline,
   **distance (10, 15, 18, 30 ou 50 m)**, **blason**, **nombre de volées (6 ou 10)**,
   **flèches par volée (3 ou 6)**, lieu et mode de saisie ;
2. **Valider et ouvrir le carton** : le carton n'apparaît qu'ici, et la fenêtre se
   ferme. Une mini-compétition demande au moins un participant coché ;
3. le **récapitulatif** reste au-dessus du carton — date, discipline, distance, blason,
   format des volées, séance, lieu, archers — pour ne pas se tromper en cours de
   séance. *Modifier les réglages* rouvre la fenêtre à tout moment.

Le carton affiche les **points en grand**, et juste en dessous la ligne
d'avancement : flèches saisies sur le total, pourcentage, moyenne par flèche, volée en
cours et heure de la dernière sauvegarde.

**Blasons proposés** : 40, 60, 80 et 122 cm, les blasons réduits 6-10 (40 et 80 cm) et
les **tri-spots** de compétition — 40 cm vertical, 40 cm triangle, 60 cm vertical,
80 cm vertical. Sur un tri-spot, c'est la mouche la plus proche qui compte, et une
flèche hors des mouches est manquée. L'ancien libellé *120 cm* reste lu pour les
parties déjà enregistrées.

**Règle du cordon** : une flèche qui touche le trait de séparation compte la zone
supérieure. Le rayon du tube est retiré de la distance au centre ; il se règle par le
paramètre *Diamètre de flèche (mm)* (5,5 mm par défaut).

Le blason suit la distance automatiquement — **10 m et 15 m (débutants) ▸ 80 cm**,
**18 m ▸ 40 cm**, **30 m et 50 m ▸ 80 cm** — et reste modifiable (le 60 cm de salle,
par exemple).

**Changer le blason alors que des flèches sont notées** pose une question, car les deux
cas existent :

- **Garder les points** — chaque flèche garde sa valeur et sa place sur le blason ; les
  distances en centimètres (périmètre, surface, écart au centre) sont converties à la
  nouvelle taille. C'est le choix quand on **s'est trompé de blason au réglage** : on a
  bien tiré sur le 40 cm, mais le 80 cm était sélectionné ;
- **Garder les distances** — les flèches gardent leur distance au centre en centimètres
  et leurs points sont relus sur le nouveau blason. Une flèche trop loin du centre peut
  alors sortir du blason et devenir manquée.

Dans les deux cas, le bandeau *Annuler* permet de revenir en arrière. En
mini-compétition, les cartes de **tous les participants** suivent de la même façon.

**Corriger une partie enregistrée avec le mauvais blason** : ouvrir la partie,
*Modifier*, puis repasser au blason sur lequel elle a été **notée** en choisissant
*Garder les distances* (les points d'origine reviennent), et enfin choisir le **bon**
blason avec *Garder les points* (les distances se convertissent). Enregistrer.

Trois modes de saisie :

- **Sur la cible** *(par défaut)* — on pose le doigt sur le blason et on fait
  glisser : une **loupe** s’affiche en haut de l’écran, montre la zone sous le doigt
  agrandie 4,5 fois avec un viseur et la valeur en direct, et la flèche se pose au
  relâchement. La position est convertie en points par la géométrie du blason et
  conservée en centimètres : c’est elle qui alimente la carte des impacts et le
  groupement. La bande grise autour du blason sert à pointer une flèche manquée.
- **Au clavier** — un pavé `10 … 1 / M`, pour saisir vite sans pointer les impacts.
- **Score global** — pour reprendre rapidement d’anciens résultats.

Dans les deux premiers modes, chaque volée affiche **en direct** son résultat, sa
moyenne par flèche, le **périmètre** et la **surface** de son groupe ; la volée en
cours ressort sur la cible, les précédentes restent visibles en pâle.

Sous la grille, **↶ Revenir** annule la dernière action, **← Effacer la flèche**
(rouge clair) reprend la dernière flèche et **Tout vider** (rouge plein) vide la carte.
Chaque volée porte en plus un **✕** qui n'efface qu'elle. Enregistrer une partie
incomplète demande confirmation.

#### Saisie volée par volée

Le blason de la partie, en haut, montre **toutes les flèches** ; on n’y note plus
rien. Pour saisir, on touche **la volée à remplir** (ou le blason, ou *Saisir*) : une
vue s’ouvre en plein écran avec :

- en haut, les flèches de la volée et son **total** (moyenne, périmètre, surface) ;
- au milieu, le **blason** avec la loupe — ou le **pavé** en mode *Au clavier* ;
- en bas, **← Effacer** et **Valider la volée**.

Toucher une flèche en haut la retire : la suivante prendra sa place. **Valider** ferme
la vue, verrouille la volée (✓) et la **sauvegarde aussitôt** (ou l’envoie aux autres
téléphones en direct) ; « sauvegardée ✓ » confirme la réception par le serveur. Les
volées se saisissent dans l’ordre ; une volée validée se rouvre pour correction,
puis se revalide. Rien ne vient redessiner la vue pendant la saisie : ni le direct,
ni un autre téléphone.

#### Une séance en cours ne se perd pas

- **↶ Annuler** revient en arrière pas à pas : flèche posée, flèche effacée, carte
  vidée, discipline changée… (jusqu’à 60 étapes).
- Chaque effacement demande **confirmation**, puis propose encore **Annuler**
  pendant 8 secondes.
- Tant qu’une flèche est saisie, les autres onglets sont **verrouillés** : les quitter
  demande confirmation.
- La séance est **recopiée à chaque modification** dans le navigateur, et quelques
  secondes plus tard sur le compte de l’archer (colonnes *Brouillon* de l’onglet
  Utilisateurs). Après un rechargement, un téléphone éteint ou une déconnexion, elle
  est **reprise automatiquement** à la connexion suivante, y compris depuis un autre
  appareil.
- **Annuler la partie**, dans le récapitulatif au-dessus du carton, efface la séance
  entière après **confirmation** (nombre de flèches perdues annoncé) et revient au choix
  d'une nouvelle partie. La séance mise de côté est close, et un bandeau *Annuler*
  permet encore de tout récupérer pendant quelques secondes.
- Une séance enregistrée ou abandonnée est marquée close : elle ne réapparaît pas.

#### Modifier une partie déjà enregistrée

Dans la fiche d'une partie (liste des parties, statistiques, classement), le bouton
**Modifier** la rouvre dans le carton : réglages, flèches et impacts reviennent tels
quels. On corrige ce qu'on veut — une flèche, le blason, la distance, le nom de la
séance — puis **Enregistrer les modifications** remplace la partie (elle n'est jamais
dupliquée). *Abandonner la modification* laisse la partie enregistrée intacte.
Chacun modifie les siennes ; avec *Saisie ouverte à tous*, tout le monde peut corriger
celles des autres.

### Mini-compétition

Le bouton **Mini-compétition**, en haut de l’onglet Score, permet de tenir plusieurs
tableaux de scores dans une même partie :

1. cocher les **participants** ;
2. régler une fois pour toutes la date, la discipline, la distance, le blason et le
   format des volées ;
3. passer d’un archer à l’autre par les **onglets**, qui affichent le score de chacun
   en direct ; chaque participant garde sa cible et ses volées ;
4. le **classement provisoire** se met à jour à chaque flèche.

L’enregistrement crée **une partie par archer**, toutes avec le même nom de séance.
Chacune compte comme une **séance ordinaire de l’archer concerné** : elle apparaît
dans sa progression, dans ses statistiques et dans ses comparaisons, exactement comme
un entraînement. Le classement final s’affiche à l’enregistrement.

### Mini-compétition en direct

Depuis l'onglet *Score* en mode **Mini-compétition**, l'encadrant coche les archers puis
touche **📡 Passer en direct**. La séance est alors partagée :

- chaque archer voit un bandeau **« Mini-compétition en cours — Rejoindre »** (au
  démarrage, ou dans la minute qui suit) ;
- une fois rejoint, il **remplit sa propre carte** depuis son téléphone et voit celles
  des autres se compléter — rafraîchissement toutes les 5 secondes ;
- avec *Saisie ouverte à tous* (par défaut), **chacun peut remplir toutes les cartes** ;
  à `NON`, les cartes des autres restent en lecture seule ;
- **la saisie reste sur le téléphone** : les flèches posées dans la vue de volée ne
  partent qu’au moment de **Valider la volée**, et seule cette volée est envoyée ; le
  serveur la range à sa place sans toucher aux autres volées ni aux autres cartes.
  Une volée validée mais pas encore arrivée (réseau) repart toute seule ;
- le blason et le nombre de flèches sont **figés pendant la saisie d’une volée** : les
  flèches ne bougent pas et leurs points ne sont jamais recalculés par un réglage relu ;
  si le créateur change les réglages pendant ce temps, la volée est refusée et à refaire ;
- si un autre téléphone a validé **la même volée** pendant la saisie, on demande qui
  garder ; en direct, *Revenir* et *Tout effacer* sont désactivés (on corrige une volée
  en la touchant, on l’efface avec son ✕) ;
- le bouton **↻ Actualiser** du bandeau envoie les volées en attente et affiche tout de
  suite les scores des autres, sans attendre les 5 secondes ;
- **les réglages sont ceux du créateur**, sur tous les téléphones (grisés chez les
  autres) ; s’il les change, tous les reçoivent ;
- seul **le créateur** (ou l’encadrement) peut **Terminer et enregistrer pour tous**
  (une partie par archer) ou **Abandonner** ; un double enregistrement est impossible ;
- une réponse du serveur arrivée en retard n’écrase jamais une volée qu’on vient de
  valider.
- **Une seule compétition par groupe** : si l'un des archers cochés est déjà dans une
  mini-compétition en direct, *Passer en direct* la rejoint (et y ajoute les nouveaux)
  au lieu d'en ouvrir une seconde ;
- après un rechargement ou une mise en veille, le téléphone **retrouve le direct tout
  seul** ; le bandeau indique l'heure de la dernière mise à jour ;
- consulter la carte d'un autre archer ne l'envoie jamais : rien ne part sans validation.

L'état vit dans l'onglet **Compétitions** du classeur (une ligne par séance partagée,
avec les cartes et un numéro de version). Une seule mini-compétition en direct à la fois
par encadrant.

### Calendrier

Onglet **Calendrier** : les séances du club — **lundi et samedi** par défaut,
réglables par la ligne « Jours de séance » de l’onglet Paramètres — sont listées pour
les huit semaines à venir. Chaque archer répond **Présent**, **Absent** ou
**Peut-être** d’un geste ; un nouvel appui sur la même réponse l’annule.

**Récapitulatif (encadrement).** En tête de l’onglet, un tableau croise les archers
actifs et les prochaines séances : **P** présent, **A** absent, **?** peut-être,
**—** pas de réponse. La première colonne (prochaine séance) ressort, les totaux
figurent en bas de chaque colonne et une phrase résume la prochaine séance. Il
affiche 8 séances, ou toutes d’un bouton, et défile latéralement ; les noms restent
visibles à gauche. Toucher une case en montre le détail (nom, date, commentaire).

Chacun voit le décompte de la séance ; l’encadrement voit en plus **qui** a répondu
quoi, en dépliant la ligne. Les réponses vivent dans l’onglet `Disponibilités`.

### Messagerie

Onglet **Messages** : un fil commun au club. L’encadrement peut adresser un message
à **un archer en particulier** ; chacun peut supprimer ses propres messages, un
administrateur ceux de tout le monde.

#### Comment les archers sont prévenus

| Canal | Quand | Portée |
| --- | --- | --- |
| Fenêtre à l’ouverture | à chaque connexion, s’il y a du nouveau | toujours |
| Pastille rouge + bandeau | pendant la session, vérification chaque minute | toujours |
| Notification du navigateur | pendant que l’application est ouverte | ordinateur seulement — **jamais sur iPhone** |
| **Email** | à la publication du message | **même téléphone fermé** |

**Une application Apps Script ne peut pas envoyer de notification « poussée »** :
elle s’affiche dans un cadre qui interdit les *service workers*, socle technique des
notifications de téléphone. Sur **iPhone**, Safari les réserve de surcroît aux
applications installées : la demande y est toujours refusée, et l’application ne
propose donc même plus le bouton — elle explique pourquoi à la place.

L’**email** est le seul canal qui atteint un archer dont l’application est fermée —
et il arrive bien, lui, comme une notification sur le téléphone.

Réglage dans l’onglet **Paramètres**, ligne « Notifications messages » :

| Valeur | Effet |
| --- | --- |
| `TOUS` *(par défaut)* | tous les archers actifs ayant un email sont prévenus |
| `ENCADREMENT` | seuls les encadrants et administrateurs |
| `NON` | aucun email |

⚠️ Un compte Gmail gratuit est limité à **100 emails par jour** : un message au club
de 48 archers en consomme 48. Passez à `ENCADREMENT` si le fil devient bavard.
Un message privé ne prévient que son destinataire, et l’auteur n’est jamais notifié.

La date de dernière lecture est conservée par compte, dans l’onglet `Utilisateurs`.

### Apparence (onglet *Profil*)

Chaque membre choisit son **mode** — *Auto* (suit le téléphone), *Clair* ou *Sombre* —
et une **couleur de thème** : Sapin, Océan, Bordeaux, Lavande, Terre ou Ardoise.
Le choix s'applique tout de suite, est enregistré sur son compte (colonne *Thème*
de l'onglet Utilisateurs) et le suit sur tous ses appareils.

### Paramètres de l’app (admin, onglet *Profil*)

Le bouton **Paramètres de l’app ›** ouvre, dans l'application :

- le **lien de l’application**, avec *Copier* et *Partager* ;
- un **message prêt à diffuser** aux archers (lien, format de l'identifiant, mot de
  passe de départ), modifiable avant copie ;
- une alerte si le dernier déploiement n'est pas l'adresse diffusée ;
- tous les **réglages de l'onglet Paramètres**, modifiables sur place (listes pour
  les choix fermés comme *Scores visibles par tous*).
- **Relire le classeur maintenant** : voir *Vitesse* ci-dessous.

### Vitesse

Trois mécanismes, invisibles à l'usage :

1. **Ouverture immédiate.** Le téléphone garde la dernière réponse du serveur et
   affiche l'application aussitôt, puis se met à jour en fond. La séance en cours, la
   mini-compétition en direct et les messages ne sont jamais pris de cette mémoire :
   ils viennent toujours du serveur.
2. **Cache des lectures.** Les onglets lus à chaque appel — Inscrits, Utilisateurs,
   Paramètres, Scores, Disponibilités, Messages — sont gardés **cinq minutes** dans le
   cache du script, et oubliés **dès qu'une écriture les touche**. L'onglet des
   mini-compétitions en direct n'est jamais mis en cache.
3. **Calculs mémorisés.** Statistiques d'un archer, progression et classement du club
   sont conservés tant qu'aucune partie n'a été enregistrée, modifiée ou supprimée.

Une modification faite **directement dans le classeur** ne prévient pas l'application :
elle apparaît au bout de cinq minutes, ou tout de suite avec le bouton **Relire le
classeur maintenant** (*Profil ▸ Paramètres de l'app*).

### Photo de profil et licence

Depuis l’onglet **Profil** (ou la fiche d’un archer, pour l’encadrement) :

- **Photo** : l’image choisie est recadrée en carré et réduite à 192 px **par le
  téléphone** avant l’envoi ; elle pèse alors quelques kilo-octets et tient dans la
  colonne `Photo` du classeur. Aucun hébergement externe.
- **Licence PDF** (4 Mo maximum) : trop lourde pour une cellule, elle part dans un
  dossier Drive **créé par l’application** au premier dépôt (« *Nom du club* —
  Licences »), dont l’identifiant est noté dans l’onglet Paramètres. Le fichier reste
  **privé** : il s’ouvre depuis l’application par les responsables connectés au compte
  Google du club. Un nouveau dépôt remplace et met l’ancien à la corbeille.

> La première utilisation de la licence demande une autorisation Drive
> supplémentaire (`drive.file` : uniquement les fichiers créés par l’application).
> Apps Script la détecte seul dans le code : **rien à déclarer dans le manifeste**.
> Si l’éditeur refuse d’enregistrer `appsscript.json`, c’est qu’on y a ajouté un champ
> de trop — le manifeste minimal suffit, les portées étant déduites du code et les
> réglages de l’application web venant de la fenêtre *Déployer*.

### Consulter les parties du club

Sous la liste des parties, le sélecteur **Mes parties / Tout le club** affiche toutes
les parties enregistrées par les membres et l’encadrement, nom de l’archer en tête.
Chaque ligne s’ouvre en détail comme les autres.

### Progression (onglet *Progression*)

En tête de la vue d’ensemble, la courbe **Évolution de la moyenne** retrace la
moyenne par flèche de toutes les parties de l'archer choisi (ou du club jour par
jour), avec une **tendance** sur 5 parties et l'écart depuis le début ; le doigt lit
chaque point.

L’encadrement choisit d’abord **l’archer** à consulter — ou **« Tous les archers »**,
qui rassemble les parties de tout le club, nom en tête de chaque ligne, avec le record
et la moyenne du club par discipline.

Les deux bandeaux **Archer** et **Séance** restent affichés en haut de l’écran quand
on fait défiler la page, et même lorsque l’archer choisi n’a aucune partie : on peut
donc toujours en sélectionner un autre.

Ensuite, trois chiffres — parties, flèches, **moyenne en points par flèche** — puis le
**menu déroulant des séances** :

- *Vue d’ensemble* : la **liste des parties** (date, lieu, centrage, score). Un clic
  sur une ligne ouvre la partie **dans l’onglet Statistiques**, en pleine largeur —
  une **étoile jaune** signale la meilleure séance de chaque discipline. Suivent, par
  discipline, le record, la moyenne en points par flèche, la tendance sur les cinq
  dernières sorties et la courbe d’évolution ;
- une **séance** : son détail complet se déplie — score, moyenne par flèche,
  **centrage**, la cible de la séance si les flèches ont été pointées, chaque volée
  avec son résultat, sa moyenne, son périmètre et sa surface, un graphique
  **barres + courbe** de l’évolution de la partie — sur lequel un **curseur se
  déplace au doigt** pour lire volée par volée le score, la moyenne, le périmètre et
  la surface — une mini-cible par volée, que l’on **agrandit d’un clic** pour revoir
  ses flèches une à une, et les zones touchées.

Tous les graphiques portent leurs **graduations** : grille horizontale et valeurs
sur l’axe vertical, repères de dates ou de volées sur l’axe horizontal.

On peut revenir en arrière depuis n’importe quel niveau : *← Toutes les séances*
depuis le détail d’une partie, *← Toutes les parties* depuis une séance filtrée dans
les statistiques, *← Retour à la séance* (ou *à la partie*) depuis une volée agrandie,
et les bandeaux de choix restent accessibles en permanence.

Les moyennes sont toujours exprimées **en points**, jamais en pourcentage du
maximum. Le seul pourcentage affiché est le **centrage** : 100 % quand le centre du
groupe tombe pile au milieu du blason, 0 % quand il en atteint le bord.

### Statistiques (onglet Progression ▸ *Statistiques*)

Trois portées, réglables en haut de l’écran :

| Filtre | Effet |
| --- | --- |
| **Archer** | consulter les statistiques d’un autre archer (tous, si les scores sont partagés) |
| **Séance** | déplie le détail complet de cette partie, volées comprises |
| **Période** | 30 jours, 3 mois, 12 mois, ou deux dates précises |
| **Discipline / Distance / Lieu** | affinent la sélection |

Sans filtre, les statistiques portent sur toutes les parties.

- **carte des impacts**, avec le centre du groupe, le **périmètre** — la longueur
  de ficelle qu’il faudrait pour faire le tour des flèches — et l’**écart au centre** ;
- répartition des flèches **zone par zone** (10, 9, … 1, manquées) en histogramme ;
- répartition **par couronne du blason** (jaune, rouge, bleu, noir, blanc, manquées) ;
- graphique **Partie par partie** à mesures au choix : moyenne par flèche, score %,
  **centrage** (cm du centre), **décalage** horizontal/vertical, **périmètre** et
  **surface** moyens des volées, % de jaunes, % de 10, **régularité** (écart-type des
  volées), manquées. En glissant le doigt (ou en survolant à la souris), **seules les
  flèches de la partie lue restent sur la carte des impacts** ; ailleurs, toutes y sont ;
- **Analyse** de la sélection : % jaunes, % de 10, écart-type, centrage, périmètre et
  surface moyens, meilleure volée et meilleure partie ;
- **Au fil des volées** : moyenne par flèche selon le numéro de volée (mise en route,
  fatigue en fin de partie) ;
- sous la carte des impacts, les mesures **suivent le curseur** : centrage, périmètre
  par volée et dispersion de la partie lue, avec son score et son % de jaunes. Un
  **simple toucher** sur un point ouvre la partie ;
- **détail partie par partie**, avec volées, impacts et surfaces pour chaque partie ;
- une **séance choisie** donne, sous sa cible, le graphique **Volée par volée** (score,
  moyenne, moyenne cumulée, périmètre, surface, centrage, décalage) : seules les flèches
  de la volée lue restent sur la cible, avec ses mesures (centrage, périmètre, surface,
  score) ; un **simple toucher** l'agrandit. Puis l'**analyse des volées** : meilleure,
  plus faible, écart-type, 1re moitié contre 2e moitié, % jaunes, % de 10, manquées ;
- pour chaque partie, un **groupement volée par volée** : périmètre de la ficelle
  autour des flèches, surface couverte, et une mini-cible par volée avec le contour
  tracé. Un périmètre qui diminue au fil de la séance signale un tir qui se resserre,
  indépendamment du score ;

### Comparer deux archers ou deux séances

Ouvert à **tous les membres**, en deux modes au choix, par un bouton en haut de
l'écran :

- **Deux archers** — chacun sur l'ensemble de ses parties ;
- **Deux parties d'un archer** — on choisit l'archer, puis ses deux parties (ou
  l'ensemble de ses séances face à l'une d'elles).

Si *Scores visibles par tous* est à `NON`, un membre ne compare que ses propres
parties.

Le sous-onglet **Comparer** met deux archers face à face : moyenne par flèche, % de
jaunes et de 10, centrage et dispersion (cm), périmètre et surface moyens par volée,
écart-type, meilleure volée, meilleure partie — la valeur la plus favorable étant mise
en avant. Viennent ensuite les deux cartes d’impacts côte à côte, puis les graphiques :

- **Évolution comparée**, avec les mêmes mesures au choix que les statistiques ; une
  séance seule face à un ensemble apparaît en ligne pointillée ;
- deux séances face à face : graphique **Volée par volée** (score, moyenne, périmètre,
  surface, centrage) ;
- **Répartition des touches** zone par zone, en pourcentage, et par couronne ;
- **Au fil des volées** : moyenne selon le numéro de volée, les deux archers côte à côte.

- filtres par discipline et par distance.

Les parties tirées sur des blasons différents sont ramenées au blason le plus
fréquent de la sélection pour rester comparables.

Depuis la fiche d’un archer, le bouton *Statistiques* ouvre les mêmes écrans
(réservé à l’archer lui-même et aux encadrants).

### Classement du club (Progression ▸ *Classement*)

Visible par tous les membres. Critères : **Général**, moyenne par flèche, flèches
tirées, parties, meilleur score, meilleure volée, meilleur centrage, centrage moyen,
meilleur périmètre, périmètre moyen, taux de 10, régularité. Changer de critère est
instantané.

Les **filtres** (discipline, distance, période, arme, catégorie, parties minimum)
sont rangés dans un menu **Filtres** repliable ; fermé, il résume les filtres actifs.

- **Centrage** : distance en **cm** entre le centre du groupe de flèches et le centre
  de la cible — le plus court gagne.
- **Périmètre** : longueur en **cm** de la « ficelle » autour des flèches d'une volée —
  le plus court gagne. À comparer à distance égale (filtre Distance).

Toucher un archer **déplie son détail sous sa ligne**, sans quitter le classement :
la partie qui porte le record (meilleur score, volée, centrage, périmètre), ou la
liste des parties prises en compte pour les moyennes — chacune s'ouvre à son tour,
avec un bouton *Statistiques*.

L’**indice général** (sur 100) rapporte chaque archer au meilleur du club : moyenne
40 %, meilleur score 20 %, centrage moyen 15 %, périmètre moyen 10 %, flèches 10 %,
parties 5 %. Sans flèches pointées sur la cible, centrage et périmètre sont retirés
du calcul plutôt que comptés à zéro.

### Rappels par email

**Paramètres ▸ « Emails rappels actifs » = OUI**, puis
**🏹 ▸ Activer le rappel hebdomadaire** (lundi 8 h) : chaque archer concerné reçoit
un message pour un certificat médical expiré/à renouveler ou une cotisation en attente,
et l’email de contact du club reçoit le récapitulatif.
**🏹 ▸ Envoyer les rappels maintenant** déclenche un envoi ponctuel.

---

## 3. Structure du classeur

| Onglet | Contenu |
| --- | --- |
| `Inscrits` | Fiches : identité, catégorie FFTA, arme, licence, certificat, cotisation, rôle |
| `Utilisateurs` | Comptes d’accès : identifiant `NOMPrénom`, mot de passe, statut, dernière connexion, dernière lecture des messages, séance en cours (*Brouillon*), thème |
| `Disponibilités` | Une réponse par archer et par séance : date, réponse, commentaire |
| `Messages` | Fil du club : auteur, portée (club ou privé), destinataire, texte |
| `Scores` | Une ligne par partie : format (volées × flèches), score, moyenne, détail des flèches, **position des impacts en cm** et **colonnes `Zone M` à `Zone 10`** |
| `Compétitions` | Mini-compétitions suivies en direct : réglages, participants, cartes en cours, version, statut |
| `Paramètres` | Nom du club, saison, email de contact, seuils d’alerte, montants, diamètre de flèche, partage des scores |
| `Journal` | Historique des actions (connexions, créations, suppressions) |

Les colonnes `Zone …` sont pensées pour être **graphées directement dans Sheets**
(*Insertion ▸ Graphique*) en plus des graphiques de l’application.

> L’onglet `Barèmes` des versions précédentes n’est plus utilisé : vous pouvez
> le supprimer du classeur.

### Catégories d’âge

Recalculées automatiquement à l’enregistrement d’une fiche, sur l’année civile de
fin de saison (U11 → S3). **🏹 ▸ Recalculer les catégories d’âge** met tout le
fichier à jour en début de saison.

---

## 4. Fichiers du projet

| Fichier | Rôle |
| --- | --- |
| `Config.gs` | Constantes métier : onglets, colonnes, catégories, disciplines, blasons, zones |
| `Cible.gs` | Géométrie du blason : impact ▸ points, surface des zones, groupement |
| `Data.gs` | Accès au Sheet, dates, paramètres, saison, catégories |
| `Setup.gs` | Menu 🏹, installation, barèmes, validations, création des comptes |
| `Auth.gs` | Comptes `NOMPrénom`, mots de passe, jetons de session signés |
| `Membres.gs` | Fiches des inscrits, alertes, statistiques du club |
| `Scores.gs` | Saisie des parties, volées, zones de touche |
| `Statistiques.gs` | Répartition par zone et par couronne, évolution, partie par partie |
| `Progression.gs` | Records, tendances, cartons, classement |
| `Calendrier.gs` | Séances lundi/samedi et disponibilités |
| `Messagerie.gs` | Fil du club, messages privés, compteur de non-lus |
| `Fichiers.gs` | Photo de profil (classeur) et licence PDF (Drive) |
| `Notifications.gs` | Rappels par email |
| `WebApp.gs` | `doGet`, données de démarrage |
| `Index/Styles/JavaScript.html` | Interface mobile (sans dépendance externe) |
| `Logo.html` | Logo du club intégré en base64 — rien à héberger |
| `icone/` | Icône du raccourci (512, 192, 180 px) et sources du logo |

---

## 5. Icône et logo

Le logo du club est **intégré au projet** (`src/Logo.html`, en base64) : il s’affiche
à la connexion et dans l’en-tête, sans hébergement externe.

L’**icône du raccourci** sur l’écran d’accueil n’est pas personnalisable : iOS lit
l’`apple-touch-icon` de la page que Google place autour de l’application, sur laquelle
le club n’a pas la main. Les contournements possibles — page d’enrobage sur Google
Sites ou sur un hébergement extérieur — ont été écartés, l’ergonomie n’en valant pas
la peine.

Le raccourci porte donc une icône générique, et la ligne « URL de l’icône » de l’onglet
Paramètres doit rester **vide**. Le logo du club reste présent là où il compte :
écran de connexion et bandeau supérieur de l’application.

Pour régénérer les images après un changement de logo : remplacer
`icone/logo-club.png`, puis relancer le script noté dans le README de ce dossier.

---

## 6. Téléphone et ordinateur

L’application détecte le format de l’écran et s’y adapte :

- **téléphone** : une seule colonne, barre d’onglets en bas, cibles et graphiques
  à la largeur de l’écran ;
- **ordinateur ou tablette en paysage** (à partir de 900 px) : **les onglets passent
  dans le bandeau supérieur**, page plus large,
  cible et volées côte à côte dans le détail d’une séance, carte des impacts d’un
  côté et, de l’autre, la répartition des touches surmontant la courbe de moyenne
  par flèche, barre d’onglets flottante centrée, graphiques et cibles agrandis.

Les consignes de saisie suivent le matériel : « touchez la cible et faites glisser »
au doigt, « cliquez et faites glisser » à la souris.

La déconnexion se trouve en bas de l’onglet **Profil**.

### Le bandeau Google en haut de l’application

Il n’est **pas supprimable** : il appartient à la page que Google place autour de
toute application Apps Script publiée, et aucun réglage du script ne l’enlève.

Le seul contournement consiste à **intégrer l’application dans une page Google
Sites** (Insertion ▸ Intégrer ▸ l’URL `/exec`), puis à diffuser l’adresse du site :
le bandeau disparaît, et la page peut porter le nom et le logo du club. Le reste
fonctionne à l’identique.

---

## 7. En cas de problème

**Les notifications ne se déclenchent pas, le calendrier reste vide ?** C’est
presque toujours que le classeur n’a pas été mis à jour après l’ajout de ces
fonctions : les onglets `Messages` et `Disponibilités` n’existent pas encore.
L’application le dit maintenant explicitement à l’écran. Lancez
**🏹 ▸ Installer / réparer le classeur**, et tout repart.

**🏹 ▸ Vérifier l’installation** contrôle en une fois :

- que chaque fichier du projet a bien été copié dans l’éditeur Apps Script
  (un fichier oublié est la cause la plus fréquente d’un écran qui reste vide) ;
- que les onglets et toutes leurs colonnes existent ;
- combien d’inscrits, de comptes et d’administrateurs sont enregistrés, et si
  l’application est déployée.

Le rapport nomme précisément ce qui manque. Après avoir copié les fichiers
signalés, relancer **Installer / réparer**, puis redéployer une **nouvelle version**.

---

## 8. Points d’attention

- **Sauvegarde** : le Sheet est la seule source de données — *Fichier ▸ Créer une copie*
  en fin de saison.
- **Données personnelles** : le classeur contient des coordonnées, des dates de
  certificat médical et les mots de passe. Limitez le partage du **Sheet** aux
  responsables ; les archers n’ont besoin que de l’URL de l’application.
- **Tests** : `node tests/logique.test.js src` vérifie la logique métier
  (zones, volées, identifiants, catégories) sans passer par Google.
- **Suppression d’un archer** : l’app archive (statut *Inactif*) au lieu de supprimer,
  pour conserver l’historique des scores.
- **Quotas Apps Script** : ~100 emails/jour sur un compte Gmail gratuit, largement
  suffisant pour les rappels hebdomadaires d’un club.
