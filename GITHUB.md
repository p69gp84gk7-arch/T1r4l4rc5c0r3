# Mettre l'application sur GitHub, sans rien changer pour les archers

L'application continue de tourner **exactement comme aujourd'hui** : le code vit dans
Apps Script, les données dans le classeur Google Sheets, les archers ouvrent le même
lien. GitHub ne sert qu'à **garder l'historique du code** : chaque version est
conservée, on voit ce qui a changé, et on peut revenir en arrière.

Trois étapes. La première est déjà faite.

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

## Étape 3 — Relier le dossier à Apps Script (fini le copier-coller)

L'outil s'appelle **clasp**, il est fourni par Google. Il envoie les fichiers de `src/`
vers votre projet Apps Script, et sait aussi les récupérer.

### 3.1 Autoriser l'API Apps Script (une fois)

Ouvrez <https://script.google.com/home/usersettings> et mettez
**API Google Apps Script** sur **Activé**.

### 3.2 Se connecter (une fois)

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/Tir\ à\ l\'arc
npx --yes @google/clasp@3 login
```

Une page Google s'ouvre : autorisez avec le compte **propriétaire du projet Apps
Script**. Cela crée un fichier `.clasprc.json` dans votre dossier personnel — il est
déjà exclu du dépôt, ne le publiez jamais.

### 3.3 Indiquer le projet

Il faut l'**ID du script** : dans l'éditeur Apps Script, *Paramètres du projet ▸ ID du
script* (ou dans l'adresse `.../projects/`**ID**`/edit`).

Créez le fichier `.clasp.json` à la racine du dossier :

```json
{ "scriptId": "COLLEZ_ICI_L_ID_DU_SCRIPT", "rootDir": "src" }
```

### 3.4 Comparer avant d'envoyer (important une seule fois)

`clasp push` **remplace** le code en ligne par celui de `src/`. Avant le premier envoi,
on vérifie qu'ils sont bien identiques :

```bash
cd ~/Desktop && mkdir verif && cd verif
npx --yes @google/clasp@3 clone COLLEZ_ICI_L_ID_DU_SCRIPT
diff -r . ~/Library/Mobile\ Documents/com~apple~CloudDocs/Tir\ à\ l\'arc/src
```

- Aucune différence affichée : tout est bon, passez à la suite.
- Des différences : dites-le-moi, on regarde ensemble laquelle des deux versions garder.

Faites aussi une **version de sécurité** dans l'éditeur Apps Script
(*Déployer ▸ Gérer les déploiements*), pour pouvoir revenir en arrière côté Google.

### 3.5 La routine, ensuite

```bash
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/Tir\ à\ l\'arc
npx --yes @google/clasp@3 push      # envoie src/ vers Apps Script
```

Puis, dans l'éditeur Apps Script : **Déployer ▸ Gérer les déploiements ▸ Modifier ▸
Nouvelle version**, comme aujourd'hui. Et côté historique : *Commit* + *Push* dans
GitHub Desktop.

`npx clasp status` liste ce qui serait envoyé, `npx clasp pull` récupère ce qui a été
modifié directement dans l'éditeur en ligne.

---

## Ce qu'il ne faut pas faire

- **Ne publiez pas `.clasprc.json`** (vos identifiants Google). Il est déjà exclu.
- **Ne modifiez pas le même fichier des deux côtés en même temps** (éditeur en ligne et
  dossier local) : gardez une habitude — on modifie ici, on envoie là-bas.
- Le dossier est dans iCloud : c'est pratique pour la sauvegarde, mais **n'ouvrez pas le
  même dépôt depuis deux Mac en même temps**, iCloud pourrait mélanger les fichiers de
  suivi.
