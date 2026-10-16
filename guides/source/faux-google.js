/* Services Apps Script simulés : classeur en mémoire, cache, verrous. */
(function () {
  function Plage(f, r, c, nr, nc) {
    this.f = f; this.r = r; this.c = c; this.nr = nr || 1; this.nc = nc || 1;
  }
  Plage.prototype.getValues = function () {
    const out = [];
    for (let i = 0; i < this.nr; i++) {
      const ligne = this.f.lignes[this.r - 1 + i] || [];
      const v = [];
      for (let j = 0; j < this.nc; j++) {
        const x = ligne[this.c - 1 + j];
        v.push(x === undefined || x === null ? '' : x);
      }
      out.push(v);
    }
    return out;
  };
  Plage.prototype.getValue = function () { return this.getValues()[0][0]; };
  Plage.prototype.setValues = function (vals) {
    for (let i = 0; i < vals.length; i++) {
      const k = this.r - 1 + i;
      while (this.f.lignes.length <= k) this.f.lignes.push([]);
      for (let j = 0; j < vals[i].length; j++) this.f.lignes[k][this.c - 1 + j] = vals[i][j];
    }
    return this;
  };
  Plage.prototype.setValue = function (v) { return this.setValues([[v]]); };
  ['setFontWeight', 'setBackground', 'setFontColor', 'setNumberFormat', 'setDataValidation',
    'clearDataValidations', 'setWrap', 'setHorizontalAlignment', 'clearContent'].forEach(function (m) {
    Plage.prototype[m] = function () { return this; };
  });

  function Feuille(nom) { this.nom = nom; this.lignes = []; }
  Feuille.prototype.getName = function () { return this.nom; };
  Feuille.prototype.setName = function (n) { this.nom = n; return this; };
  Feuille.prototype.getLastRow = function () { return this.lignes.length; };
  Feuille.prototype.getLastColumn = function () {
    return this.lignes.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
  };
  Feuille.prototype.getRange = function (r, c, nr, nc) { return new Plage(this, r, c, nr, nc); };
  Feuille.prototype.appendRow = function (row) { this.lignes.push(row.slice()); return this; };
  Feuille.prototype.deleteRow = function (i) { this.lignes.splice(i - 1, 1); };
  Feuille.prototype.setFrozenRows = function () {};
  Feuille.prototype.getMaxRows = function () { return Math.max(1000, this.lignes.length); };

  const classeur = {
    feuilles: [],
    getSheetByName: function (n) { return this.feuilles.filter(function (f) { return f.nom === n; })[0] || null; },
    getSheets: function () { return this.feuilles.slice(); },
    insertSheet: function (n) { const f = new Feuille(n); this.feuilles.push(f); return f; },
    deleteSheet: function (f) { this.feuilles.splice(this.feuilles.indexOf(f), 1); },
    getSpreadsheetTimeZone: function () { return 'Europe/Paris'; },
    setSpreadsheetTimeZone: function () {},
    getUrl: function () { return ''; },
    getId: function () { return 'classeur-demo'; },
  };

  window.SpreadsheetApp = {
    getActiveSpreadsheet: function () { return classeur; },
    getUi: function () { return { alert: function () {}, ButtonSet: {} }; },
  };

  const proprietes = {};
  window.PropertiesService = {
    getScriptProperties: function () {
      return {
        getProperty: function (k) { return proprietes[k] === undefined ? null : proprietes[k]; },
        setProperty: function (k, v) { proprietes[k] = String(v); return this; },
        getProperties: function () { return Object.assign({}, proprietes); },
        deleteProperty: function (k) { delete proprietes[k]; },
      };
    },
  };

  const memo = {};
  window.CacheService = {
    getScriptCache: function () {
      return {
        get: function (k) { return memo[k] === undefined ? null : memo[k]; },
        getAll: function (ks) { const o = {}; ks.forEach(function (k) { if (memo[k] !== undefined) o[k] = memo[k]; }); return o; },
        put: function (k, v) { memo[k] = v; },
        putAll: function (o) { Object.assign(memo, o); },
        remove: function (k) { delete memo[k]; },
        removeAll: function (ks) { ks.forEach(function (k) { delete memo[k]; }); },
      };
    },
  };

  window.LockService = {
    getScriptLock: function () {
      return { tryLock: function () { return true; }, waitLock: function () {}, releaseLock: function () {}, hasLock: function () { return true; } };
    },
  };

  let compteur = 0;
  const p2 = function (n) { return (n < 10 ? '0' : '') + n; };
  window.Utilities = {
    getUuid: function () {
      compteur++;
      return ('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').replace(/[xy]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      }) + compteur;
    },
    formatDate: function (d, tz, motif) {
      const v = {
        yyyy: d.getFullYear(), MM: p2(d.getMonth() + 1), dd: p2(d.getDate()),
        HH: p2(d.getHours()), mm: p2(d.getMinutes()), ss: p2(d.getSeconds()),
      };
      return String(motif).replace(/yyyy|MM|dd|HH|mm|ss/g, function (k) { return v[k]; });
    },
    computeHmacSha256Signature: function (texte, cle) {
      // Empreinte déterministe : suffit à simuler la signature des sessions.
      const s = String(cle) + '|' + String(texte);
      const out = [];
      let h = 2166136261;
      for (let k = 0; k < 32; k++) {
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i) + k; h = Math.imul(h, 16777619); }
        out.push(((h >>> 0) & 255) - 128);
      }
      return out;
    },
    base64EncodeWebSafe: function (octets) {
      const b = octets.map(function (x) { return String.fromCharCode((x + 256) % 256); }).join('');
      return btoa(b).replace(/\+/g, '-').replace(/\//g, '_');
    },
    base64Encode: function (octets) {
      return btoa(octets.map(function (x) { return String.fromCharCode((x + 256) % 256); }).join(''));
    },
    base64Decode: function () { return []; },
    newBlob: function () { return { setName: function () { return this; } }; },
    sleep: function () {},
  };

  window.MailApp = { sendEmail: function () {}, getRemainingDailyQuota: function () { return 100; } };
  window.ScriptApp = {
    getService: function () { return { getUrl: function () { return ''; } }; },
    getProjectTriggers: function () { return []; },
  };
  window.DriveApp = {};
  window.Session = { getActiveUser: function () { return { getEmail: function () { return ''; } }; } };
})();
