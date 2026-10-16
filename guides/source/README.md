# Guides d’utilisation — sources

Les deux PDF du dossier `guides/` (Guide de l’archer, Guide des dirigeants) sont
fabriqués ici, à partir de **vraies captures de l’application**.

Pour les captures, le code serveur de `src/` tourne dans le navigateur sur un
**classeur fictif en mémoire** (`faux-google.js` remplace SpreadsheetApp, le cache,
les verrous… ; `donnees-demo.js` crée des archers, parties, messages et réponses au
calendrier inventés). Aucune donnée réelle du club n’est utilisée.

## Régénérer les guides après une évolution de l’application

```bash
cd guides/source
npm install                          # une seule fois (puppeteer-core)
python3 construire_sim.py            # assemble l’app et le simulateur depuis src/
python3 -m http.server 8790 &        # sert le simulateur
node capturer.js                     # prend les captures (dossier captures/)
node imprimer.js                     # écrit guides/guide-archer.pdf et guide-dirigeants.pdf
```

`node capturer.js u1` ne reprend que les scènes dont le nom contient « u1 ».
Chrome doit être installé (`/Applications/Google Chrome.app`).

| Fichier | Rôle |
| --- | --- |
| `scenes.js` | Chaque capture : quel archer, quels gestes, où faire défiler |
| `contenu-archer.js`, `contenu-dirigeants.js` | Le texte des guides |
| `gabarit.js` | La mise en page A4 (couverture, sommaire, cadres de téléphone) |
| `planche.py` | Planche contact des captures, pour les relire d’un coup d’œil |
