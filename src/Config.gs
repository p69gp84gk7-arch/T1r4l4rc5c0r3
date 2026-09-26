/**
 * Club de tir à l'arc — configuration globale et constantes métier.
 *
 * Toute la donnée vit dans le Google Sheet conteneur ; ce fichier ne décrit
 * que la structure attendue des onglets et les référentiels FFTA.
 */

const SHEETS = {
  ADHERENTS: 'Inscrits',   // onglet existant du classeur « tir à l’arc 2026 »
  SCORES: 'Scores',
  UTILISATEURS: 'Utilisateurs',
  DISPONIBILITES: 'Disponibilités',
  MESSAGES: 'Messages',
  PARAMETRES: 'Paramètres',
  COMPETITIONS: 'Compétitions',
  JOURNAL: 'Journal',
};

/** Colonnes de l'onglet Inscrits, dans l'ordre. */
const COL_ADHERENTS = [
  'ID', 'Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Catégorie',
  'Arme', 'N° licence', 'Type de licence', 'Saison', 'Email', 'Téléphone',
  'Certificat médical', 'Cotisation', 'Montant cotisation', 'Rôle',
  'Statut', 'Photo', 'Licence PDF', 'Licence déposée le', 'Notes',
  'Créé le', 'Modifié le',
];

/**
 * Colonnes de l'onglet Utilisateurs : un compte par archer.
 * L'identifiant est le NOM en majuscules suivi du Prénom (ex. FONTAINECamille)
 * et le mot de passe est modifiable, par le club ici ou par l'archer depuis
 * son profil dans l'application.
 */
const COL_UTILISATEURS = [
  'Identifiant', 'AdhérentID', 'Nom', 'Prénom', 'Mot de passe',
  'Statut', 'Dernière connexion', 'Messages lus le', 'Modifié le',
  'Brouillon', 'Brouillon le', 'Thème',
];

/** Apparence choisie par chaque membre dans son profil. */
const THEME_MODES = ['auto', 'clair', 'sombre'];
const THEME_COULEURS = [
  { code: 'sapin', label: 'Sapin', apercu: '#15594a' },
  { code: 'ocean', label: 'Océan', apercu: '#1d5f8a' },
  { code: 'bordeaux', label: 'Bordeaux', apercu: '#8a2b3d' },
  { code: 'lavande', label: 'Lavande', apercu: '#5b4a9a' },
  { code: 'terre', label: 'Terre', apercu: '#9a5520' },
  { code: 'ardoise', label: 'Ardoise', apercu: '#3f5566' },
];

/** Paramètres à choix fermé, proposés en liste dans l'application. */
const PARAMETRES_CHOIX = {
  'Scores visibles par tous': ['OUI', 'NON'],
  'Saisie ouverte à tous': ['OUI', 'NON'],
  'Notifications messages': ['NON', 'ENCADREMENT', 'TOUS'],
};

/** Taille maximale d'un brouillon de séance (une cellule en accepte 50 000). */
const BROUILLON_MAX_CARACTERES = 45000;

/** Colonnes de l'onglet Disponibilités : une réponse par archer et par séance. */
const COL_DISPONIBILITES = [
  'ID', 'Date séance', 'AdhérentID', 'Archer', 'Réponse', 'Commentaire', 'Modifié le',
];

/** Colonnes de l'onglet Messages. */
const COL_MESSAGES = [
  'ID', 'Horodatage', 'AuteurID', 'Auteur', 'Portée', 'Destinataire', 'Texte', 'Épinglé',
];

/** Réponses possibles à une séance du calendrier. */
const REPONSES = ['Présent', 'Absent', 'Peut-être'];

/**
 * Jours de séance du club, au sens de Date.getDay() :
 * 1 = lundi, 6 = samedi. Modifiable dans l'onglet Paramètres.
 */
const JOURS_SEANCE_DEFAUT = [1, 6];

const JOURS_NOMS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Taille maximale d'une photo de profil, en caractères une fois encodée. */
const PHOTO_MAX_CARACTERES = 40000;

/** Taille maximale d'une licence PDF déposée, en octets. */
const LICENCE_MAX_OCTETS = 4 * 1024 * 1024;

/** Mot de passe attribué à la création d'un compte. */
const MOT_DE_PASSE_DEFAUT = '1234';

/**
 * Colonnes de l'onglet Scores, dans l'ordre.
 * Les colonnes « Zone … » comptent les flèches par valeur de touche : elles
 * alimentent les statistiques de l'application et restent directement
 * exploitables dans un graphique Google Sheets.
 */
const COL_SCORES = [
  'ID', 'Date', 'AdhérentID', 'Archer', 'Séance', 'Discipline', 'Distance',
  'Blason', 'Nb volées', 'Flèches par volée', 'Nb flèches', 'Score', 'Max',
  'Moyenne par flèche', 'Détail des flèches', 'Impacts (cm)',
  'Zone M', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5',
  'Zone 6', 'Zone 7', 'Zone 8', 'Zone 9', 'Zone 10',
  'Contexte', 'Lieu', 'Notes', 'Saisi par', 'Créé le',
];

/**
 * Onglet Compétitions : une mini-compétition suivie en direct par plusieurs
 * téléphones. `Cartes` porte les flèches de chaque archer, `Version` change à
 * chaque modification pour que les autres appareils sachent quoi recharger.
 */
const COL_COMPETITIONS = [
  'ID', 'Date', 'Séance', 'Créée par', 'Réglages', 'Participants', 'Cartes',
  'Version', 'Statut', 'Créé le', 'Modifié le',
];

/** Valeurs possibles d'une flèche : 0 = manquée, puis 1 à 10. */
const ZONES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function colonneZone_(valeur) {
  return 'Zone ' + (Number(valeur) === 0 ? 'M' : String(Number(valeur)));
}

/** Distances de tir pratiquées au club. */
const DISTANCES = [10, 15, 18, 30, 50];

/**
 * Blasons proposés à la saisie, y compris les blasons de compétition.
 *
 * `rayon`   : rayon du blason complet, en centimètres (le 122 cm officiel fait
 *             61 cm de rayon) ; la largeur d'une couronne vaut rayon / 10.
 * `zoneMin` : plus petite zone imprimée. Un blason « réduit » ou un tri-spot
 *             ne porte que les zones 6 à 10 ; en dehors, la flèche est manquée.
 * `spots`   : centres des mouches d'un tri-spot, en centimètres depuis le
 *             centre de la feuille. Absent pour un blason ordinaire.
 * `ancien`  : conservé pour lire les anciennes parties, retiré du menu.
 */
const BLASONS_DETAIL = [
  { label: '40 cm', rayon: 20, zoneMin: 1 },
  { label: '60 cm', rayon: 30, zoneMin: 1 },
  { label: '80 cm', rayon: 40, zoneMin: 1 },
  { label: '122 cm', rayon: 61, zoneMin: 1 },
  { label: '40 cm réduit (6-10)', rayon: 20, zoneMin: 6 },
  { label: '80 cm réduit (6-10)', rayon: 40, zoneMin: 6 },
  { label: 'Trispot 40 cm vertical', rayon: 20, zoneMin: 6,
    spots: [{ x: 0, y: -20 }, { x: 0, y: 0 }, { x: 0, y: 20 }] },
  { label: 'Trispot 40 cm triangle', rayon: 20, zoneMin: 6,
    spots: [{ x: 0, y: -11.6 }, { x: -10, y: 5.8 }, { x: 10, y: 5.8 }] },
  { label: 'Trispot 60 cm vertical', rayon: 30, zoneMin: 6,
    spots: [{ x: 0, y: -30 }, { x: 0, y: 0 }, { x: 0, y: 30 }] },
  { label: 'Trispot 80 cm vertical', rayon: 40, zoneMin: 6,
    spots: [{ x: 0, y: -40 }, { x: 0, y: 0 }, { x: 0, y: 40 }] },
  { label: '120 cm', rayon: 60, zoneMin: 1, ancien: true },
];

/** Tailles de blason proposées à la saisie. */
const BLASONS = BLASONS_DETAIL.filter(function (b) { return !b.ancien; })
  .map(function (b) { return b.label; });

/**
 * Rayon d'un blason, en centimètres. Un blason FFTA est normalisé :
 * 10 zones concentriques de largeur égale, la zone 10 ayant pour rayon
 * le dixième du rayon total (soit 2 cm sur un blason de 40 cm).
 */
const BLASON_RAYONS = (function () {
  const table = {};
  BLASONS_DETAIL.forEach(function (b) { table[b.label] = b.rayon; });
  return table;
})();

/** Blason utilisé par défaut à chaque distance. */
const BLASON_PAR_DISTANCE = { 10: '80 cm', 15: '80 cm', 18: '40 cm', 30: '80 cm', 50: '80 cm' };

/** Nombre de volées d'une partie. */
const VOLEES = [6, 10];

/** Nombre de flèches par volée. */
const FLECHES_PAR_VOLEE = [3, 6];

const SEXES = ['F', 'H'];

const ARMES = [
  'Arc classique',
  'Arc à poulies',
  'Arc nu',
  'Arc droit',
  'Arc chasse',
];

/**
 * Catégories d'âge FFTA. L'âge de référence est l'année civile de fin de
 * saison moins l'année de naissance (saison du 1er septembre au 31 août).
 */
const CATEGORIES = [
  { code: 'U11', label: 'U11 (Poussin)', ageMax: 10 },
  { code: 'U13', label: 'U13 (Benjamin)', ageMax: 12 },
  { code: 'U15', label: 'U15 (Minime)', ageMax: 14 },
  { code: 'U18', label: 'U18 (Cadet)', ageMax: 17 },
  { code: 'U21', label: 'U21 (Junior)', ageMax: 20 },
  { code: 'S1', label: 'Senior 1', ageMax: 39 },
  { code: 'S2', label: 'Senior 2', ageMax: 49 },
  { code: 'S3', label: 'Senior 3', ageMax: 200 },
];

const TYPES_LICENCE = [
  'Adulte compétition',
  'Adulte pratique en club',
  'Jeune compétition',
  'Jeune pratique en club',
  'Découverte',
  'Sans licence (essai)',
];

const STATUTS = ['Actif', 'En attente', 'Inactif'];
const ROLES = ['Membre', 'Encadrant', 'Admin'];
const COTISATIONS = ['Payée', 'Partielle', 'Impayée', 'Exonérée'];

/**
 * Disciplines gérées. `max` est calculé à partir du nombre de flèches saisi
 * (10 points par flèche), sauf Beursault qui se compte différemment.
 */
const DISCIPLINES = [
  { code: 'SALLE', label: 'Salle', distances: [10, 15, 18], distanceDefaut: 18, blasons: ['40 cm', 'Trispot 40 cm vertical', 'Trispot 40 cm triangle', '40 cm réduit (6-10)', '60 cm'], voleesDefaut: 10, flechesVoleeDefaut: 6 },
  { code: 'TAE', label: 'Tir en extérieur (TAE)', distances: [30, 50], blasons: ['80 cm', '122 cm', '80 cm réduit (6-10)', 'Trispot 80 cm vertical'], voleesDefaut: 10, flechesVoleeDefaut: 6 },
  { code: 'CAMPAGNE', label: 'Parcours campagne', distances: [], blasons: ['40 cm', '80 cm'], voleesDefaut: 6, flechesVoleeDefaut: 3 },
  { code: 'NATURE', label: 'Parcours nature', distances: [], blasons: ['40 cm', '80 cm'], voleesDefaut: 6, flechesVoleeDefaut: 3 },
  { code: '3D', label: 'Parcours 3D', distances: [], blasons: ['40 cm', '80 cm'], voleesDefaut: 6, flechesVoleeDefaut: 3 },
  { code: 'ENTRAINEMENT', label: 'Entraînement libre', distances: [10, 15, 18, 30, 50], distanceDefaut: 18, blasons: ['40 cm', '60 cm', '80 cm', '120 cm'], voleesDefaut: 6, flechesVoleeDefaut: 6 },
];

const CONTEXTES = ['Entraînement', 'Concours club', 'Concours officiel', 'Championnat'];

/** Valeur maximale d'une flèche (blason FFTA : le 10 au centre). */
const POINTS_MAX_FLECHE = 10;

/** Paramètres par défaut écrits dans l'onglet Paramètres à l'installation. */
const PARAMETRES_DEFAUT = [
  ['Nom du club', 'Les Archers du Club', 'Affiché en tête de l’application'],
  ['Saison en cours', '2026-2027', 'Format 2026-2027. Laisser vide pour calcul automatique'],
  ['Email de contact', '', 'Destinataire des alertes et signature des emails'],
  ['Alerte certificat (jours)', 45, 'Préavis avant expiration du certificat médical'],
  ['Validité certificat (mois)', 12, 'Durée de validité retenue par le club'],
  ['Montant cotisation adulte', 100, 'En euros'],
  ['Montant cotisation jeune', 60, 'En euros'],
  ['Emails rappels actifs', 'NON', 'OUI pour activer l’envoi automatique hebdomadaire'],
  ['URL de l’application', '', 'Adresse /exec diffusée aux archers. À renseigner dès qu’il existe plusieurs déploiements'],
  ['URL de l’icône', '', 'Laisser vide : l’icône du raccourci n’est pas personnalisable'],
  ['Jours de séance', 'lundi, samedi', 'Jours proposés au calendrier, séparés par des virgules'],
  ['Saisie ouverte à tous', 'OUI', 'OUI : chaque membre saisit des parties pour les autres archers, lance les mini-compétitions et remplit toutes les cartes. NON : réservé à l’encadrement'],
  ['Scores visibles par tous', 'OUI', 'OUI : chaque membre consulte les scores, statistiques et comparatifs de tous les archers. NON : les siens seulement'],
  ['Diamètre de flèche (mm)', '5.5', 'Règle du cordon : une flèche qui touche le trait compte la zone supérieure'],
  ['Notifications messages', 'TOUS', 'NON, ENCADREMENT ou TOUS : qui reçoit un email à chaque message'],
  ['Semaines au calendrier', 8, 'Nombre de semaines affichées à l’avance'],
  ['Dossier des licences', '', 'Rempli automatiquement : identifiant du dossier Drive'],
];

/** Durée de validité d'une session web (jours). */
const SESSION_JOURS = 30;
