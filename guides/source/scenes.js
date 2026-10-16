/* Scènes du guide : chaque scène ouvre l'application, agit, puis capture. */

// Remplit quelques volées du carton comme un archer le ferait au doigt.
const VOLEES = `
  const tirs = [[[1.2,-0.8],[3.1,1.9],[-0.6,2.4]],[[0.4,0.3],[-2.2,-1.1],[1.8,-2.9]],
                [[4.6,1.2],[0.9,0.6],[-1.4,0.2]],[[2.5,3.8],[-0.3,-1.6],[0.7,1.1]]];
  for (let v = 0; v < NB; v++) {
    ouvrirVolee(v); await pause(150);
    tirs[v].forEach(function (p) {
      poserFlecheVolee(valeurPourPoint(p[0], p[1], blasonChoisi()), { x: p[0], y: p[1] });
    });
    await pause(80);
    if (v < NB - 1 || !GARDER) { validerVueVolee(false); await pause(250); }
  }`;

// Réglages d'une partie de salle : 10 volées de 3 flèches à 18 m.
const REGLER = `
  ouvrirReglages('partie'); await pause(300);
  const fixe = function (id, v) { const e = document.getElementById(id); if (!e) return;
    e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); };
  fixe('scoreDiscipline', 'Salle'); await pause(80);
  fixe('scoreDistance', '18'); fixe('scoreBlason', '40 cm');
  fixe('scoreVolees', '10'); fixe('scoreParVolee', '3');
  document.getElementById('scoreSeance').value = 'Entraînement du samedi';
  document.getElementById('scoreLieu').value = 'Gymnase de Luchon';`;

const STATS = `allerA('Progression'); await pause(200);
  document.querySelector('#sousOnglets button[data-sous="Stats"]').click(); await pause(1200);`;

module.exports = [
  // ---------- Guide de l'archer (Camille FONTAINE) ----------
  { nom: 'u01-connexion', actions: `
      document.getElementById('identifiant').value = 'FONTAINECamille';
      document.getElementById('motdepasse').value = 'motdepasse';` },
  { nom: 'u02-premier-mdp', u: 'A10', garderModale: true, attente: 900 },
  { nom: 'u03-accueil-messages', u: 'A03', garderModale: true },
  { nom: 'u04-accueil', u: 'A03' },
  { nom: 'u05-score', u: 'A03', actions: `allerA('Score'); await pause(500);` },
  { nom: 'u06-reglages', u: 'A03', actions: `allerA('Score'); await pause(300);` + REGLER },
  { nom: 'u07-carton', u: 'A03', actions: `allerA('Score'); await pause(300);` + REGLER +
      `validerReglages(); await pause(400); const NB = 4, GARDER = false;` + VOLEES +
      `window.scrollTo(0, 0);` },
  { nom: 'u08-volee', u: 'A03', actions: `allerA('Score'); await pause(300);` + REGLER +
      `validerReglages(); await pause(400); const NB = 3, GARDER = true;` + VOLEES.replace(
        'tirs[v].forEach', '(v === NB - 1 ? tirs[v].slice(0, 2) : tirs[v]).forEach') },
  { nom: 'u05b-partie', u: 'A03', actions: `allerA('Score'); await pause(600); ouvrirPartie('SC13'); await pause(1500);` },
  { nom: 'u09-competition', u: 'A03', actions: `allerA('Score'); await pause(300);
      ouvrirReglages('competition'); await pause(400);
      for (const id of ['A05', 'A12']) { const c = document.querySelector('#participants input[value="' + id + '"]');
        if (c && !c.checked) { c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); await pause(120); } }`,
      defiler: '#blocParticipants', decalage: 140 },
  { nom: 'u10-progression', u: 'A03', actions: `allerA('Progression'); await pause(1200);` },
  { nom: 'u11-stats-filtres', u: 'A03', actions: STATS },
  { nom: 'u12-stats-impacts', u: 'A03', actions: STATS, defiler: '#cibleStats', decalage: 130 },
  { nom: 'u13-stats-graphe', u: 'A03', actions: STATS + `choisirVariante('gStats', 'jaunes', 'nb10'); await pause(200);`,
      defiler: '#gStats', decalage: 150 },
  { nom: 'u14-stats-superposer', u: 'A03', actions: STATS +
      `choisirVariante('gStats', 'score', 'points'); basculerCombine('gStats'); await pause(300);`,
      defiler: '#gStats', decalage: 150 },
  { nom: 'u15-stats-seance', u: 'A03', actions: STATS + `filtrerStats('scoreId', 'SC13'); await pause(1800);`,
      defiler: '#detailSeanceStats', decalage: 100 },
  { nom: 'u16-stats-volees', u: 'A03', actions: STATS + `filtrerStats('scoreId', 'SC13'); await pause(1800);`,
      defiler: '#detailSeanceStats .graphe-mesures', decalage: 120 },
  { nom: 'u17-comparer', u: 'A03', actions: `allerA('Progression'); await pause(200);
      document.querySelector('#sousOnglets button[data-sous="Comparer"]').click(); await pause(600);
      changerComparaison('b', 'A12'); await pause(1500);` },
  { nom: 'u18-comparer-graphe', u: 'A03', actions: `allerA('Progression'); await pause(200);
      document.querySelector('#sousOnglets button[data-sous="Comparer"]').click(); await pause(600);
      changerComparaison('b', 'A12'); await pause(1500);`, defiler: '#gComp', decalage: 150 },
  { nom: 'u19-classement', u: 'A03', actions: `allerA('Progression'); await pause(200);
      document.querySelector('#sousOnglets button[data-sous="Classement"]').click(); await pause(1500);` },
  { nom: 'u20-calendrier', u: 'A03', actions: `allerA('Calendrier'); await pause(1200);` },
  { nom: 'u21-messages', u: 'A03', actions: `allerA('Messages'); await pause(1200);
      const d = document.getElementById('messageDestinataire'); if (d) d.value = 'A02';
      document.getElementById('messageTexte').value = 'Merci Marc, je serai là samedi.';` },
  { nom: 'u22-profil', u: 'A03', actions: `allerA('Profil'); await pause(1200);` },
  { nom: 'u24-guides', u: 'A03', actions: `allerA('Profil'); await pause(1200);`,
      defiler: 'a[href$="guide-archer.pdf"]', decalage: 160 },
  { nom: 'u25-profil-fin', u: 'A03', actions: `allerA('Profil'); await pause(1200);`,
      defiler: 'button[onclick="creerLienDirect()"]', decalage: 430 },
  { nom: 'u26-lien-direct', u: 'A03', actions: `allerA('Profil'); await pause(1000); creerLienDirect(); await pause(1200);` },
  { nom: 'u23-profil-bas', u: 'A03', actions: `appliquerMarges({ haut: 0, bas: 34, mesureHaut: 0, mesureBas: 34, regleHaut: null, regleBas: null });
      allerA('Profil'); await pause(1200);`, defiler: '#reglageMarges', decalage: 330 },

  // ---------- Guide des dirigeants (Hélène ROUSSEL, administratrice) ----------
  { nom: 'd01-accueil', u: 'A01' },
  { nom: 'd02-accueil-club', u: 'A01', defiler: '#accueilContenu .actions', decalage: 140 },
  { nom: 'd03-inscrits', u: 'A01', actions: `allerA('Inscrits'); await pause(1200);` },
  { nom: 'd04-fiche', u: 'A01', actions: `allerA('Inscrits'); await pause(1000); ouvrirFiche('A09'); await pause(1200);` },
  { nom: 'd04b-fiche-bas', u: 'A01', actions: `allerA('Inscrits'); await pause(1000); ouvrirFiche('A09'); await pause(1200);
      const m = document.querySelector('#modale .contenu'); if (m) m.scrollTop = m.scrollHeight;` },
  { nom: 'd05-nouvel-archer', u: 'A01', actions: `allerA('Inscrits'); await pause(1000); ouvrirFormulaireInscrit(); await pause(800);` },
  { nom: 'd06-acces', u: 'A01', actions: `allerA('Inscrits'); await pause(1000); gererAcces('A04'); await pause(1200);` },
  { nom: 'd07-saisie-autre', u: 'A01', actions: `allerA('Score'); await pause(300);` + REGLER +
      `const s = document.getElementById('scoreArcher'); s.value = 'A04'; s.dispatchEvent(new Event('change', { bubbles: true }));` },
  { nom: 'd08-calendrier', u: 'A01', actions: `allerA('Calendrier'); await pause(1200);` },
  { nom: 'd09-parametres', u: 'A01', actions: `allerA('Profil'); await pause(800); ouvrirParametresApp(); await pause(1500);` },
  { nom: 'd10-parametres-bas', u: 'A01', actions: `allerA('Profil'); await pause(800); ouvrirParametresApp(); await pause(1500);
      window.scrollTo(0, document.body.scrollHeight); await pause(300);` },
  { nom: 'd14-guides', u: 'A01', actions: `allerA('Profil'); await pause(1200);`,
      defiler: 'a[href$="guide-archer.pdf"]', decalage: 160 },
  { nom: 'd11-messages', u: 'A01', actions: `allerA('Messages'); await pause(1200);` },
  { nom: 'd12-classement-club', u: 'A01', actions: `allerA('Progression'); await pause(200);
      document.querySelector('#sousOnglets button[data-sous="Classement"]').click(); await pause(1500);` },
  { nom: 'd13-profil-admin', u: 'A01', actions: `allerA('Profil'); await pause(1200);` },
];
