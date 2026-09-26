# Logo et icône

| Fichier | Usage |
| --- | --- |
| `logo-club.png` | Source fournie par le club (1563 × 1563) |
| `icone-512.png`, `icone-192.png`, `icone-180.png` | Icône du raccourci mobile : logo entier, centré sur fond blanc |
| `logo-complet.png` | Logo avec le texte, affiché à la connexion |
| `logo-embleme.png` | Logo sans le texte, affiché dans l’en-tête |

`logo-complet.png` et `logo-embleme.png` sont intégrés en base64 dans
`src/Logo.html` : l’application n’a donc aucune image à héberger.

## Régénérer après un changement de logo

Remplacer `logo-club.png`, ajuster si besoin les cadrages `COMPLET` / `EMBLEME`
(coordonnées en pixels dans la source), puis :

```bash
python3 icone/generer.py
```

Le script réécrit les trois icônes, les deux logos web et `src/Logo.html`.
