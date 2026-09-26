"""
Régénère, à partir de `icone/logo-club.png` :
  - les icônes du raccourci mobile (logo entier, fond blanc) ;
  - les deux logos affichés dans l'application ;
  - `src/Logo.html`, qui embarque ces logos en base64.

Usage, depuis la racine du projet :  python3 icone/generer.py
"""
import base64
import io
import os

from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'icone', 'logo-club.png')

# Cadrages dans la source, en pixels : (gauche, haut, droite, bas)
COMPLET = (48, 430, 1512, 1066)    # logo entier, texte compris
EMBLEME = (48, 430, 1512, 966)     # cible, montagnes et flèche, sans le texte


def icone(src, taille, chemin, part=0.94):
    """Logo entier, jamais rogné, centré sur un carré blanc."""
    im = src.crop(COMPLET)
    largeur = int(taille * part)
    hauteur = max(1, int(im.height * largeur / im.width))
    if hauteur > taille * part:
        hauteur = int(taille * part)
        largeur = max(1, int(im.width * hauteur / im.height))
    im = im.resize((largeur, hauteur), Image.LANCZOS)
    fond = Image.new('RGBA', (taille, taille), (255, 255, 255, 255))
    fond.paste(im, ((taille - largeur) // 2, (taille - hauteur) // 2), im)
    fond.convert('RGB').save(chemin, optimize=True)


def logo_web(src, boite, largeur, chemin):
    """Version légère pour la page : palette réduite, fond transparent."""
    im = src.crop(boite)
    hauteur = max(1, int(im.height * largeur / im.width))
    im = im.resize((largeur, hauteur), Image.LANCZOS)
    im.quantize(colors=48, method=Image.FASTOCTREE).save(chemin, optimize=True)


def datauri(chemin):
    return 'data:image/png;base64,' + base64.b64encode(
        io.open(chemin, 'rb').read()).decode()


def main():
    src = Image.open(SOURCE).convert('RGBA')
    dossier = os.path.join(RACINE, 'icone')

    for taille in (512, 192, 180):
        icone(src, taille, os.path.join(dossier, 'icone-%d.png' % taille))

    complet = os.path.join(dossier, 'logo-complet.png')
    embleme = os.path.join(dossier, 'logo-embleme.png')
    logo_web(src, COMPLET, 640, complet)
    logo_web(src, EMBLEME, 280, embleme)

    html = ('<!-- Logo du club, intégré en base64 : aucune ressource externe à héberger. -->\n'
            '<script>\n'
            "  const LOGO_COMPLET = '" + datauri(complet) + "';\n"
            "  const LOGO_EMBLEME = '" + datauri(embleme) + "';\n"
            '</script>\n')
    io.open(os.path.join(RACINE, 'src', 'Logo.html'), 'w', encoding='utf-8').write(html)

    for f in sorted(os.listdir(dossier)):
        if f.endswith('.png'):
            print('%-22s %7d octets' % (f, os.path.getsize(os.path.join(dossier, f))))
    print('src/Logo.html régénéré')


if __name__ == '__main__':
    main()
