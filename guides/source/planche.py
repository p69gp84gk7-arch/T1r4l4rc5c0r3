import sys, pathlib
from PIL import Image, ImageDraw
fichiers = sys.argv[2:]; sortie = sys.argv[1]
w, h = 300, 650
img = Image.new('RGB', (w * min(4, len(fichiers)) + 10 * (min(4, len(fichiers)) + 1), (h + 30) * ((len(fichiers) + 3) // 4) + 10), 'white')
d = ImageDraw.Draw(img)
for i, f in enumerate(fichiers):
    x = 10 + (i % 4) * (w + 10); y = 10 + (i // 4) * (h + 30)
    im = Image.open(f).convert('RGB'); im.thumbnail((w, h))
    img.paste(im, (x, y + 20)); d.text((x, y + 4), pathlib.Path(f).stem, fill='black')
img.save(sortie)
