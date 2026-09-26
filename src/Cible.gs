/**
 * Géométrie du blason : conversion d'un impact en points, surface des zones
 * et mesure du groupement.
 *
 * Un blason FFTA est normalisé : dix couronnes concentriques de même largeur.
 * Sur un blason de diamètre D, la largeur d'une couronne vaut donc D / 20,
 * et la zone 10 est un disque de ce rayon. Toute la trigonométrie de
 * l'application (page web comprise) repose sur ces deux règles.
 */

/** Description complète d'un blason (rayon, zone la plus basse, mouches). */
function blasonDetail_(blason) {
  const label = String(blason);
  const trouve = BLASONS_DETAIL.filter(function (b) { return b.label === label; })[0];
  return trouve || { label: label, rayon: BLASON_RAYONS[label] || 20, zoneMin: 1 };
}

/** Rayon du blason en centimètres, 20 cm par défaut (blason de 40 cm). */
function rayonBlason_(blason) {
  return blasonDetail_(blason).rayon;
}

/**
 * Règle du cordon : une flèche qui touche le trait de séparation compte la
 * zone supérieure. On retire donc le rayon du tube de la distance au centre.
 */
function toleranceFleche_() {
  const mm = toNumber_(param_('Diamètre de flèche (mm)', 5.5));
  return (mm > 0 ? mm : 5.5) / 20;          // millimètres ▸ rayon en centimètres
}

/** Largeur d'une couronne, en centimètres. */
function pasBlason_(blason) {
  return rayonBlason_(blason) / 10;
}

/**
 * Valeur d'un impact situé à `rayon` centimètres du centre :
 * 10 au centre, 1 sur la couronne extérieure, 0 hors blason.
 */
function valeurPourRayon_(rayon, blason) {
  const d = blasonDetail_(blason);
  const pas = d.rayon / 10;
  const r = Math.max(0, (Number(rayon) || 0) - toleranceFleche_());
  const zoneMin = d.zoneMin || 1;
  const couronne = Math.ceil(r / pas);           // 1 au centre, 10 au bord
  const valeur = Math.min(10, 11 - Math.max(1, couronne));
  return valeur < zoneMin ? 0 : valeur;
}

/**
 * Valeur d'un impact repéré en centimètres depuis le centre de la feuille.
 * Sur un tri-spot, c'est la mouche la plus proche qui compte.
 */
function valeurPourPoint_(x, y, blason) {
  return valeurPourRayon_(distanceBlason_(x, y, blason), blason);
}

/** Distance à la mouche la plus proche (au centre, pour un blason ordinaire). */
function distanceBlason_(x, y, blason) {
  const spots = blasonDetail_(blason).spots;
  const dist = function (cx, cy) {
    return Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
  };
  if (!spots || !spots.length) return dist(0, 0);
  return spots.reduce(function (min, s) { return Math.min(min, dist(s.x, s.y)); }, Infinity);
}

/**
 * Centrage, en pourcentage : 100 % quand le centre du groupe tombe pile au
 * milieu du blason, 0 % quand il en atteint le bord. Un groupe serré mais
 * décalé se lit donc ici, là où le score seul ne le montre pas.
 */
function centrage_(ecartCentre, blason) {
  const R = rayonBlason_(blason);
  if (!R) return 0;
  const pct = 100 * (1 - (Number(ecartCentre) || 0) / R);
  return Math.max(0, Math.round(Math.min(100, pct) * 10) / 10);
}

/**
 * Lit la colonne « Impacts (cm) ».
 * Format : une paire « x:y » par flèche, séparées par des virgules, dans le
 * même ordre que les flèches ; une entrée vide signale une flèche saisie
 * au clavier, sans position pointée.
 */
function lireImpacts_(brut) {
  const s = String(brut || '').trim();
  if (!s) return [];
  return s.split(',').map(function (paire) {
    const p = String(paire).trim().split(':');
    if (p.length !== 2) return null;
    const x = Number(p[0]);
    const y = Number(p[1]);
    return isNaN(x) || isNaN(y) ? null : { x: x, y: y };
  });
}

/** Sérialise une liste d'impacts pour le Sheet. */
function ecrireImpacts_(impacts) {
  if (!impacts || !impacts.length) return '';
  const arrondi = function (v) { return Math.round(Number(v) * 10) / 10; };
  return impacts.map(function (i) {
    return i && isFinite(i.x) && isFinite(i.y) ? arrondi(i.x) + ':' + arrondi(i.y) : '';
  }).join(',');
}

/** Normalise les impacts reçus de la page : {x, y} en cm, ou null. */
function normaliserImpacts_(brut, blason) {
  if (!brut) return [];
  const liste = Array.isArray(brut) ? brut : lireImpacts_(brut);
  const limite = rayonBlason_(blason) * 2;      // au-delà, la donnée est absurde
  return liste.map(function (i) {
    if (!i) return null;
    const x = Number(i.x);
    const y = Number(i.y);
    if (isNaN(x) || isNaN(y)) return null;
    if (Math.abs(x) > limite || Math.abs(y) > limite) return null;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
}

/**
 * Mesure du groupement d'une série d'impacts (en cm) :
 * centre moyen, rayon moyen, dispersion et diamètre du groupe.
 */
function groupement_(impacts, blason) {
  const pts = (impacts || []).filter(function (i) { return i && isFinite(i.x) && isFinite(i.y); });
  if (!pts.length) return null;

  const n = pts.length;
  const cx = pts.reduce(function (t, p) { return t + p.x; }, 0) / n;
  const cy = pts.reduce(function (t, p) { return t + p.y; }, 0) / n;

  const distances = pts.map(function (p) {
    return Math.sqrt((p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy));
  });
  const rayonMoyen = distances.reduce(function (t, d) { return t + d; }, 0) / n;
  const variance = distances.reduce(function (t, d) {
    return t + (d - rayonMoyen) * (d - rayonMoyen);
  }, 0) / n;

  // Diamètre du groupe : plus grande distance entre deux impacts.
  let diametre = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = Math.sqrt(
        (pts[i].x - pts[j].x) * (pts[i].x - pts[j].x) +
        (pts[i].y - pts[j].y) * (pts[i].y - pts[j].y)
      );
      if (d > diametre) diametre = d;
    }
  }
  const arrondi = function (v) { return Math.round(v * 10) / 10; };
  return {
    nombre: n,
    centreX: arrondi(cx),
    centreY: arrondi(cy),
    ecartCentre: arrondi(Math.sqrt(cx * cx + cy * cy)),
    rayonMoyen: arrondi(rayonMoyen),
    dispersion: arrondi(Math.sqrt(variance)),
    diametre: arrondi(diametre),
    perimetre: perimetreGroupe_(pts),
    aire: aireGroupe_(pts),
    centrage: blason ? centrage_(Math.sqrt(cx * cx + cy * cy), blason) : null,
  };
}

/**
 * Aire réellement couverte par une volée, en cm² : surface du polygone
 * convexe qui englobe les impacts (enveloppe convexe, calculée par la chaîne
 * monotone puis la formule du lacet). C'est la mesure de groupement la plus
 * parlante : deux flèches groupées et une écartée donnent un grand triangle.
 *
 * Moins de trois impacts ne délimitent aucune surface : l'aire vaut alors 0,
 * et c'est `aireDisque_` qui renseigne sur l'écartement.
 */
function enveloppeConvexe_(impacts) {
  const pts = (impacts || []).filter(function (i) {
    return i && isFinite(i.x) && isFinite(i.y);
  }).sort(function (a, b) {
    return a.x === b.x ? a.y - b.y : a.x - b.x;
  });
  if (pts.length < 3) return [];

  const croix = function (o, a, b) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  };
  const bas = [];
  pts.forEach(function (p) {
    while (bas.length >= 2 && croix(bas[bas.length - 2], bas[bas.length - 1], p) <= 0) bas.pop();
    bas.push(p);
  });
  const haut = [];
  pts.slice().reverse().forEach(function (p) {
    while (haut.length >= 2 && croix(haut[haut.length - 2], haut[haut.length - 1], p) <= 0) haut.pop();
    haut.push(p);
  });
  const enveloppe = bas.slice(0, -1).concat(haut.slice(0, -1));
  return enveloppe.length >= 3 ? enveloppe : [];
}

function aireGroupe_(impacts) {
  const enveloppe = enveloppeConvexe_(impacts);
  if (!enveloppe.length) return 0;

  let aire = 0;
  for (let i = 0; i < enveloppe.length; i++) {
    const a = enveloppe[i];
    const b = enveloppe[(i + 1) % enveloppe.length];
    aire += a.x * b.y - b.x * a.y;
  }
  return Math.round(Math.abs(aire / 2) * 10) / 10;
}

/**
 * Périmètre du groupe, en centimètres : la longueur de ficelle qu'il faudrait
 * pour faire le tour des flèches, en les entourant au plus juste.
 * Avec deux flèches, c'est l'aller-retour entre les deux.
 */
function perimetreGroupe_(impacts) {
  const pts = (impacts || []).filter(function (i) {
    return i && isFinite(i.x) && isFinite(i.y);
  });
  if (pts.length < 2) return 0;

  const distance = function (a, b) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
  };
  const enveloppe = enveloppeConvexe_(pts);
  if (!enveloppe.length) {
    // Flèches alignées ou simple paire : la ficelle fait l'aller et le retour.
    let maxi = 0;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) maxi = Math.max(maxi, distance(pts[i], pts[j]));
    }
    return Math.round(maxi * 2 * 10) / 10;
  }

  let total = 0;
  for (let i = 0; i < enveloppe.length; i++) {
    total += distance(enveloppe[i], enveloppe[(i + 1) % enveloppe.length]);
  }
  return Math.round(total * 10) / 10;
}

/** Aire du disque de groupement, à partir du plus grand écart entre deux flèches. */
function aireDisque_(diametre) {
  const d = Number(diametre) || 0;
  return Math.round(Math.PI * (d / 2) * (d / 2) * 10) / 10;
}
