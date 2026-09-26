# Mettre l'application sur GitHub, sans rien changer pour les archers

L'application continue de tourner **exactement comme aujourd'hui** : le code vit dans
Apps Script, les données dans le classeur Google Sheets, les archers ouvrent le même
lien. GitHub ne sert qu'à **garder l'historique du code** : chaque version est
conservée, on voit ce qui a changé, et on peut revenir en arrière.

Trois étapes, toutes faites. Ce guide sert de mémo.

---

## Étape 1 — Le dépôt local ✅ (fait)

Le dossier *Tir à l'arc* est devenu un dépôt Git : les fichiers y sont suivis, avec un
premier enregistrement (« commit ») qui contient l'application telle qu'elle est
aujourd'hui.

Deux fichiers ont été ajoutés :

- `.gitignore` — ce qui ne doit **jamais** partir sur GitHub, en particulier
  `.clasprc.json`, le fichier qui contiendra votre connexion Google ;
- `.claspignore` — ce qui ne doit pas partir vers Apps Script.

Aucune donnée d'archer n'est dans le dépôt : noms, scores et licences restent dans le
classeur Google Sheets.

---

## Étape 2 — Publier sur GitHub

Le dépôt distant est déjà relié au dossier :
<https://github.com/p69gp84gk7-arch/T1r4l4rc5c0r3> (privé, vide pour l'instant).
La branche locale s'appelle `main`, comme sur GitHub.

### Avec GitHub Desktop

1. Téléchargez **GitHub Desktop** : <https://desktop.github.com>, installez-le, puis
   connectez-vous avec le compte **p69gp84gk7-arch**.
2. Menu **File ▸ Add Local Repository…** ▸ **Choose…** et sélectionnez, dans la barre
   latérale, **iCloud Drive ▸ Tir à l'arc**. Cliquez sur **Add Repository**.
   - N'utilisez pas *Publish repository* : le dépôt existe déjà, GitHub Desktop le
     reconnaît tout seul.
3. En haut, le bouton **Publish branch** (ou **Push origin**) envoie tout : un clic.

### La routine, ensuite

À chaque modification, GitHub Desktop les affiche dans la colonne de gauche :

1. écrivez une phrase en bas à gauche (« Correction du blason ») ;
2. **Commit to main** ;
3. **Push origin**.

Deux clics, et l'historique est en ligne. Si les modifications ont été faites par
Claude, le commit est déjà écrit : il ne reste que **Push origin**.

## Étape 3 — Le lien avec Apps Script ✅ (fait)

L'outil **clasp**, fourni par Google, envoie les fichiers de `src/` vers le projet Apps
Script. Tout est en place :

- l'API Apps Script est activée, la connexion est faite (compte `cassous31@gmail.com`) ;
- `.clasp.json` désigne le projet et le dossier `src/` ;
- le manifeste `src/appsscript.json` reprend les réglages de l'application web
  (`executeAs: USER_DEPLOYING`, `access: ANYONE_ANONYMOUS`). **Ne les retirez jamais** :
  ce sont eux qui laissent les archers ouvrir le lien.

### La routine

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/Tir\ à\ l\'arc
npx --yes @google/clasp@3 status    # ce qui serait envoyé
npx --yes @google/clasp@3 push      # envoie src/ vers Apps Script
npx --yes @google/clasp@3 pull      # récupère ce qui a été modifié en ligne
```

Un envoi met à jour le **code en cours d'édition**, pas la version déployée : les
archers continuent d'utiliser la version déployée. Pour qu'ils reçoivent les
modifications, il faut toujours, dans l'éditeur Apps Script :
**Déployer ▸ Gérer les déploiements ▸ ✏️ ▸ Version : Nouvelle version ▸ Déployer**.

Puis, côté historique : *Commit* et *Push origin* dans GitHub Desktop.

### Vérifier avant d'envoyer, en cas de doute

Si vous avez modifié quelque chose directement dans l'éditeur en ligne, récupérez-le
d'abord (`pull`) — sinon l'envoi l'écrase. `clasp pull` écrit les fichiers serveur avec
l'extension `.js` alors que le dossier utilise `.gs` : comparez `Auth.js` avec
`src/Auth.gs`, et ainsi de suite.

---

## Ce qu'il ne faut pas faire

- **Ne publiez pas `.clasprc.json`** (vos identifiants Google). Il est déjà exclu.
- **Ne modifiez pas le même fichier des deux côtés en même temps** (éditeur en ligne et
  dossier local) : gardez une habitude — on modifie ici, on envoie là-bas.
- Le dossier est dans iCloud : c'est pratique pour la sauvegarde, mais **n'ouvrez pas le
  même dépôt depuis deux Mac en même temps**, iCloud pourrait mélanger les fichiers de
  suivi.
