/* Moteur de génération de PNJ — création par packages (Traveller).
   Logique pure, sans DOM : utilisable dans le navigateur et dans Node (tests). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TravellerEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CHARS = ['STR', 'DEX', 'END', 'INT', 'EDU', 'SOC'];
  // eHex Traveller : pas de I ni de O.
  const EHEX = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  /* ---------- Hasard reproductible ---------- */

  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }

  function makeRng(seed) {
    let a = hashSeed(String(seed));
    const next = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (n) => Math.floor(next() * n);
    return {
      next,
      int,
      pick: (arr) => arr[int(arr.length)],
      shuffle: (arr) => {
        const a2 = arr.slice();
        for (let i = a2.length - 1; i > 0; i--) {
          const j = int(i + 1);
          const tmp = a2[i];
          a2[i] = a2[j];
          a2[j] = tmp;
        }
        return a2;
      },
      dice: (n, sides) => {
        let total = 0;
        for (let i = 0; i < n; i++) total += 1 + int(sides || 6);
        return total;
      },
    };
  }

  function randomSeed() {
    let s = '';
    for (let i = 0; i < 6; i++) s += SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)];
    return s;
  }

  /* "3D", "3D6", "2D6+2", "12" → description du jet. Renvoie null si illisible. */
  function parseDice(expr) {
    const s = String(expr == null ? '' : expr).replace(/\s+/g, '').toUpperCase();
    if (/^-?\d+$/.test(s)) return { n: 0, sides: 6, plus: parseInt(s, 10) };
    const m = /^(\d*)D(\d*)([+-]\d+)?$/.exec(s);
    if (!m) return null;
    return { n: m[1] ? parseInt(m[1], 10) : 1, sides: m[2] ? parseInt(m[2], 10) : 6, plus: m[3] ? parseInt(m[3], 10) : 0 };
  }

  function rollDice(expr, rng) {
    const d = parseDice(expr);
    if (!d) return 0;
    return rng.dice(d.n, d.sides) + d.plus;
  }

  /* ---------- Caractéristiques ---------- */

  function dm(score) {
    if (score <= 0) return -3;
    if (score <= 2) return -2;
    if (score <= 5) return -1;
    if (score <= 8) return 0;
    if (score <= 11) return 1;
    if (score <= 14) return 2;
    return 3;
  }

  function fmtDm(n) {
    return n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '+0';
  }

  function ehex(score) {
    return EHEX[Math.max(0, Math.min(EHEX.length - 1, score))];
  }

  function upp(chars) {
    return CHARS.map((c) => ehex(chars[c])).join('');
  }

  /* "STR +1, EDU -3" → { mods: {STR: 1, EDU: -3}, errors: [] } */
  function parseMods(str) {
    const mods = {};
    const errors = [];
    String(str || '')
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((part) => {
        const m = /^([A-Za-z]{3})\s*([+\-−])\s*(\d+)$/.exec(part);
        const key = m ? m[1].toUpperCase() : '';
        if (!m || CHARS.indexOf(key) === -1) {
          errors.push('Modificateur illisible : « ' + part + ' » (attendu : STR +1, EDU -2…)');
          return;
        }
        mods[key] = (mods[key] || 0) + (m[2] === '+' ? 1 : -1) * parseInt(m[3], 10);
      });
    return { mods, errors };
  }

  /* "SOC 10+" → { char: 'SOC', min: 10 } ; vide → null ; illisible → { error } */
  function parseRequirement(str) {
    const s = String(str || '').trim();
    if (!s) return null;
    const m = /^([A-Za-z]{3})\s*(\d+)\s*\+?$/.exec(s);
    if (!m || CHARS.indexOf(m[1].toUpperCase()) === -1) return { error: 'Prérequis illisible : « ' + s + ' » (attendu : SOC 10+)' };
    return { char: m[1].toUpperCase(), min: parseInt(m[2], 10) };
  }

  function parsePriority(str) {
    const seen = [];
    String(str || '')
      .split(/[,;\s]+/)
      .map((s) => s.trim().toUpperCase())
      .forEach((c) => {
        if (CHARS.indexOf(c) !== -1 && seen.indexOf(c) === -1) seen.push(c);
      });
    CHARS.forEach((c) => {
      if (seen.indexOf(c) === -1) seen.push(c);
    });
    return seen;
  }

  /* ---------- Listes et compétences ---------- */

  /* Découpe sur un des caractères de `seps` en ignorant ce qui est entre parenthèses. */
  function splitTop(str, seps) {
    const out = [];
    let depth = 0;
    let cur = '';
    for (const ch of String(str)) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && seps.indexOf(ch) !== -1) {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim()).filter(Boolean);
  }

  /* Compétences : tableau, ou texte séparé par des virgules ou des retours à la ligne. */
  function splitList(text) {
    if (Array.isArray(text)) return text.map((s) => String(s).trim()).filter(Boolean);
    return splitTop(String(text || ''), ',\n');
  }

  /* Bénéfices : tableau, ou texte avec un bénéfice par ligne. */
  function splitLines(text) {
    if (Array.isArray(text)) return text.map((s) => String(s).trim()).filter(Boolean);
    return String(text || '').split('\n').map((s) => s.trim()).filter(Boolean);
  }

  /* Le Companion écrit parfois « starship » ou « computer » : on ramène au nom du catalogue. */
  function aliasSpec(data, spec) {
    const aliases = data.specAliases || {};
    return aliases[String(spec).toLowerCase()] || spec;
  }

  function findSkillName(catalog, name) {
    const low = name.toLowerCase();
    return Object.keys(catalog || {}).find((k) => k.toLowerCase() === low) || null;
  }

  /* "Gun Combat (slug/energy) 1 / Melee (any) 1"
     → { options: [{name, specs, level}], errors: [] }
     specs : null (aucune précisée), ['any'] ou liste de spécialités. */
  function parseSkillEntry(str) {
    const errors = [];
    const options = [];
    splitTop(str, '/').forEach((part) => {
      const m = /^(.+?)\s*(?:\(([^)]*)\))?\s*(\d+)$/.exec(part);
      if (!m) {
        errors.push('Compétence illisible : « ' + part + ' » (attendu : Nom (spécialité) niveau)');
        return;
      }
      let specs = null;
      if (m[2] != null && m[2].trim()) {
        specs = m[2].split('/').map((s) => s.trim()).filter(Boolean);
        if (specs.some((s) => /^(any|au choix)$/i.test(s))) specs = ['any'];
      }
      options.push({ name: m[1].trim(), specs, level: parseInt(m[3], 10) });
    });
    if (!options.length && !errors.length) errors.push('Entrée vide');
    return { options, errors };
  }

  function createSkillSet(data) {
    const catalog = data.skills || {};
    const rules = data.rules || {};
    const cap = rules.maxSkillLevel == null ? 4 : rules.maxSkillLevel;
    const additive = rules.stacking !== 'max';
    const map = new Map(); // nom → { plain: niveau|undefined, specs: Map }

    function entryFor(name) {
      if (!map.has(name)) map.set(name, { plain: undefined, specs: new Map() });
      return map.get(name);
    }

    function stack(cur, add) {
      if (cur == null) return Math.min(cap, add);
      return Math.min(cap, additive ? cur + add : Math.max(cur, add));
    }

    function canonSpecs(name, specs) {
      const catalogSpecs = catalog[name] || [];
      return specs.map((raw) => {
        const s = aliasSpec(data, raw);
        return catalogSpecs.find((c) => c.toLowerCase() === s.toLowerCase()) || s;
      });
    }

    function pickSpec(name, option, rng, avoid, below) {
      const entry = entryFor(name);
      const listed = option.specs && option.specs[0] !== 'any';
      let candidates = canonSpecs(name, listed ? option.specs : catalog[name] || []);
      if (below != null) {
        const under = candidates.filter((s) => (entry.specs.get(s) || 0) < below);
        if (under.length) candidates = under;
      }
      // Deux entrées « any » d'un même package donnent deux spécialités différentes.
      if (avoid && avoid.size) {
        const fresh = candidates.filter((s) => !avoid.has(s));
        if (fresh.length) candidates = fresh;
      }
      // Un PNJ approfondit volontiers une spécialité qu'il possède déjà.
      const owned = candidates.filter((s) => entry.specs.has(s));
      return owned.length && rng.next() < 0.5 ? rng.pick(owned) : rng.pick(candidates);
    }

    /* Ajoute une compétence en cumulant. `granted` (Map nom → Set) suit les
       spécialités déjà données par le package en cours. Renvoie ce qui a été obtenu. */
    function add(option, rng, granted) {
      const name = findSkillName(catalog, option.name) || option.name;
      const hasSpecs = (catalog[name] || []).length > 0 || !!(option.specs && option.specs[0] !== 'any');
      const entry = entryFor(name);

      if (!hasSpecs) {
        entry.plain = stack(entry.plain, option.level);
        return { name, spec: null, level: option.level };
      }
      if (entry.plain == null) entry.plain = 0;
      if (option.level === 0) return { name, spec: null, level: 0 };

      if (granted && !granted.has(name)) granted.set(name, new Set());
      const spec = pickSpec(name, option, rng, granted ? granted.get(name) : null, null);
      if (granted) granted.get(name).add(spec);
      entry.specs.set(spec, stack(entry.specs.get(spec), option.level));
      return { name, spec, level: option.level };
    }

    function get(name, spec) {
      const entry = map.get(name);
      if (!entry) return null;
      if (spec) return entry.specs.has(spec) ? entry.specs.get(spec) : entry.plain == null ? null : 0;
      return entry.plain == null ? null : entry.plain;
    }

    function set(name, spec, level) {
      const entry = entryFor(name);
      if (spec) {
        entry.specs.set(spec, level);
        if (entry.plain == null) entry.plain = 0;
      } else entry.plain = level;
    }

    /* +1 à une compétence, sans dépasser `limit`. Choisit une spécialité si besoin. */
    function bump(name, spec, limit, rng) {
      const hasSpecs = (catalog[name] || []).length > 0;
      let target = spec;
      if (!target && hasSpecs) target = pickSpec(name, { specs: null }, rng, null, limit);
      const cur = get(name, target) || 0;
      if (cur >= limit) return null;
      set(name, target, cur + 1);
      return { name, spec: target || null, level: cur + 1 };
    }

    function list() {
      const out = [];
      Array.from(map.keys())
        .sort((a, b) => a.localeCompare(b))
        .forEach((name) => {
          const entry = map.get(name);
          if (entry.specs.size) {
            Array.from(entry.specs.keys())
              .sort((a, b) => a.localeCompare(b))
              .forEach((spec) => out.push({ name, spec, level: entry.specs.get(spec) }));
          } else out.push({ name, spec: null, level: entry.plain || 0 });
        });
      return out;
    }

    return { add, get, set, bump, list, cap };
  }

  function skillLabel(s) {
    return s.name + (s.spec ? ' (' + s.spec + ')' : '') + ' ' + s.level;
  }

  /* ---------- Bénéfices ---------- */

  function fmtCredits(n) {
    return 'Cr' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /* "Cr 10000", "Cr 2D6 x 1000" → montant ; sinon null. */
  function parseCredits(str, rng) {
    const s = String(str).trim();
    let m = /^Cr\s*(\d*D\d*(?:[+-]\d+)?)\s*[x×*]\s*(\d[\d\s.,]*)$/i.exec(s);
    if (m) return (rng ? rollDice(m[1], rng) : 0) * parseInt(m[2].replace(/\D/g, ''), 10);
    m = /^Cr\s*(\d[\d\s.,]*)$/i.exec(s);
    if (m) return parseInt(m[1].replace(/\D/g, ''), 10);
    return null;
  }

  function parseRank(str) {
    const m = /^Rank\s+(\d+)\s*(?:\((.*)\))?$/i.exec(String(str).trim());
    return m ? { level: parseInt(m[1], 10), title: (m[2] || '').trim() } : null;
  }

  function rankLabel(rank) {
    return rank ? 'Rank ' + rank.level + (rank.title ? ' (' + rank.title + ')' : '') : '';
  }

  /* ---------- Validation des données ---------- */

  function validateSkillEntries(data, entries, issues) {
    const catalog = data.skills || {};
    const open = data.openSpecialties || [];
    entries.forEach((raw) => {
      const parsed = parseSkillEntry(raw);
      parsed.errors.forEach((message) => issues.push({ level: 'error', message }));
      parsed.options.forEach((o) => {
        const canon = findSkillName(catalog, o.name);
        if (!canon) {
          issues.push({ level: 'warn', message: 'Compétence absente du catalogue : « ' + o.name + ' »' });
          return;
        }
        const specs = catalog[canon];
        if (!o.specs || o.specs[0] === 'any') return;
        if (!specs.length && open.indexOf(canon) === -1)
          issues.push({ level: 'warn', message: '« ' + canon + ' » n’a pas de spécialité dans le catalogue' });
        if (open.indexOf(canon) !== -1) return;
        o.specs.forEach((raw) => {
          const s = aliasSpec(data, raw);
          if (specs.length && !specs.some((c) => c.toLowerCase() === s.toLowerCase()))
            issues.push({ level: 'warn', message: 'Spécialité absente du catalogue : ' + canon + ' (' + s + ')' });
        });
      });
    });
  }

  function validatePackage(data, pkg, kind) {
    const issues = [];
    if (!pkg.name || !String(pkg.name).trim()) issues.push({ level: 'error', message: 'Nom manquant' });
    parseMods(pkg.mods).errors.forEach((message) => issues.push({ level: 'error', message }));
    const entries = splitList(pkg.skills);
    if (!entries.length) issues.push({ level: 'warn', message: 'Aucune compétence' });
    validateSkillEntries(data, entries, issues);
    if (kind === 'career') {
      String(pkg.priority || '')
        .split(/[,;\s]+/)
        .filter(Boolean)
        .forEach((c) => {
          if (CHARS.indexOf(c.toUpperCase()) === -1)
            issues.push({ level: 'error', message: 'Caractéristique prioritaire inconnue : « ' + c + ' »' });
        });
      const req = parseRequirement(pkg.requires);
      if (req && req.error) issues.push({ level: 'error', message: req.error });
    }
    return issues;
  }

  function validateRules(data) {
    const issues = [];
    const rules = data.rules || {};
    if (!parseDice(rules.careerAging))
      issues.push({ level: 'error', message: 'Vieillissement illisible : « ' + rules.careerAging + ' » (attendu : 3D, 2D6+4, 12…)' });
    if (!Array.isArray(rules.fixedArray) || rules.fixedArray.length !== 6 || rules.fixedArray.some((n) => !Number.isFinite(n)))
      issues.push({ level: 'error', message: 'Le tableau fixe doit contenir exactement 6 nombres' });
    ['characteristicMin', 'characteristicMax', 'maxSkillLevel', 'baseAge'].forEach((k) => {
      if (!Number.isFinite(rules[k])) issues.push({ level: 'error', message: 'Valeur numérique manquante : ' + k });
    });
    return issues;
  }

  function validateFinalisation(data) {
    const issues = [];
    const fin = data.finalisation || {};
    splitLines(fin.skillPairs).forEach((line) => validateSkillEntries(data, splitList(line), issues));
    return issues;
  }

  function validateData(data) {
    const issues = [];
    const tag = (where, list) => list.forEach((i) => issues.push(Object.assign({ where }, i)));
    if (!Array.isArray(data.backgrounds) || !data.backgrounds.length)
      issues.push({ where: 'Données', level: 'error', message: 'Aucun package d’origine' });
    if (!Array.isArray(data.careers) || !data.careers.length)
      issues.push({ where: 'Données', level: 'error', message: 'Aucun package de carrière' });
    tag('Règles', validateRules(data));
    tag('Finalisation', validateFinalisation(data));
    (data.backgrounds || []).forEach((p) => tag('Origine ' + p.name, validatePackage(data, p, 'background')));
    (data.careers || []).forEach((p) => tag('Carrière ' + p.name, validatePackage(data, p, 'career')));
    return issues;
  }

  /* ---------- Génération ---------- */

  const METHODS = {
    carriere: '2D × 6, répartis selon la carrière',
    ordre: '2D × 6, dans l’ordre',
    tableau: 'Tableau fixe, réparti selon la carrière',
  };

  function assignByPriority(values, priority, rng) {
    const order = priority
      .map((c, i) => ({ c, w: i + rng.next() * 2.5 }))
      .sort((a, b) => a.w - b.w)
      .map((x) => x.c);
    const sorted = values.slice().sort((a, b) => b - a);
    const chars = {};
    order.forEach((c, i) => (chars[c] = sorted[i]));
    return chars;
  }

  function generateNpc(data, opts) {
    opts = opts || {};
    const seed = String(opts.seed || randomSeed());
    const rng = makeRng(seed);
    const rules = data.rules || {};
    const min = rules.characteristicMin == null ? 1 : rules.characteristicMin;
    const max = rules.characteristicMax == null ? 15 : rules.characteristicMax;
    const clamp = (n) => Math.max(min, Math.min(max, n));
    const method = METHODS[opts.method] ? opts.method : 'carriere';

    const background = data.backgrounds.find((p) => p.id === opts.backgroundId) || rng.pick(data.backgrounds);
    const locked = data.careers.find((p) => p.id === opts.careerId) || null;
    const rolls = CHARS.map(() => rng.dice(2, 6));
    const bgMods = parseMods(background.mods).mods;

    // 1 et 2. Caractéristiques, puis modificateurs d'origine. Une carrière tirée
    // au hasard dont le prérequis n'est pas atteint est retirée.
    let pool = data.careers.slice();
    let career, base, chars, changes;
    for (;;) {
      career = locked || rng.pick(pool);
      if (method === 'ordre') {
        base = {};
        CHARS.forEach((c, i) => (base[c] = rolls[i]));
      } else {
        const values = method === 'tableau' ? rules.fixedArray.slice(0, 6) : rolls;
        base = assignByPriority(values, parsePriority(career.priority), rng);
      }
      chars = Object.assign({}, base);
      changes = [];
      CHARS.forEach((c) => {
        if (!bgMods[c]) return;
        chars[c] = clamp(chars[c] + bgMods[c]);
        changes.push({ source: background.name, char: c, delta: bgMods[c] });
      });
      const req = parseRequirement(career.requires);
      if (!req || req.error || chars[req.char] >= req.min) break;
      pool = pool.filter((p) => p !== career);
      if (locked || !pool.length) {
        // Carrière imposée : on relève la caractéristique au minimum requis.
        changes.push({ source: 'Prérequis ' + career.name, char: req.char, delta: req.min - chars[req.char] });
        chars[req.char] = req.min;
        break;
      }
    }

    // 3. Modificateurs de carrière
    const careerMods = parseMods(career.mods).mods;
    CHARS.forEach((c) => {
      if (!careerMods[c]) return;
      chars[c] = clamp(chars[c] + careerMods[c]);
      changes.push({ source: career.name, char: c, delta: careerMods[c] });
    });

    // Compétences : origine puis carrière, cumulées
    const set = createSkillSet(data);
    const careerGrants = [];
    [background, career].forEach((pkg) => {
      const granted = new Map();
      splitList(pkg.skills).forEach((raw) => {
        const options = parseSkillEntry(raw).options;
        if (!options.length) return;
        const got = set.add(rng.pick(options), rng, granted);
        if (pkg === career) careerGrants.push(got);
      });
    });

    // Âge
    const age = (rules.baseAge == null ? 22 : rules.baseAge) + rollDice(rules.careerAging == null ? '3D' : rules.careerAging, rng);

    // Bénéfices des deux packages
    let credits = 0;
    let rank = null;
    const items = [];
    function takeBenefit(raw, source) {
      const choice = rng.pick(splitTop(raw, '/'));
      if (!choice) return '';
      const cr = parseCredits(choice, rng);
      if (cr != null) {
        credits += cr;
        return fmtCredits(cr);
      }
      const r = parseRank(choice);
      if (r) {
        if (!rank || r.level > rank.level) rank = r;
        return rankLabel(r);
      }
      const mods = parseMods(choice);
      if (!mods.errors.length && Object.keys(mods.mods).length) {
        Object.keys(mods.mods).forEach((c) => {
          chars[c] = clamp(chars[c] + mods.mods[c]);
          changes.push({ source, char: c, delta: mods.mods[c] });
        });
        return choice;
      }
      items.push(choice);
      return choice;
    }
    [background, career].forEach((pkg) => splitLines(pkg.benefits).forEach((raw) => takeBenefit(raw, pkg.name)));

    // 4. Finalisation : un choix dans chacune des trois catégories
    const finalisation = [];
    const fin = data.finalisation;
    if (opts.finalise !== false && fin) {
      const keyOf = (g) => g.name + '|' + (g.spec || '');
      const unique = [];
      careerGrants.forEach((g) => {
        if (!unique.some((u) => keyOf(u) === keyOf(g))) unique.push(g);
      });
      const current = (g) => set.get(g.name, g.spec) || 0;
      const raisable = unique.filter((g) => g.level >= 1 && current(g) < set.cap);
      const bumpable = unique.filter((g) => current(g) < 2);
      const choices = [];
      if (raisable.length) choices.push('raise');
      if (bumpable.length) choices.push('bump');
      if (!rank || rank.level < 4) choices.push('rank');
      const choice = choices.length ? rng.pick(choices) : null;
      if (choice === 'raise') {
        const g = rng.pick(raisable);
        set.set(g.name, g.spec, set.cap);
        finalisation.push({ label: 'Carrière', text: skillLabel({ name: g.name, spec: g.spec, level: set.cap }) + ' (une compétence portée au maximum)' });
      } else if (choice === 'bump') {
        const done = [];
        rng.shuffle(bumpable).slice(0, 3).forEach((g) => {
          const res = set.bump(g.name, g.spec, 2, rng);
          if (res) done.push(skillLabel(res));
        });
        finalisation.push({ label: 'Carrière', text: done.join(', ') + ' (+1 chacune)' });
      } else if (choice === 'rank') {
        rank = { level: 4, title: '' };
        finalisation.push({ label: 'Carrière', text: 'quitte le service au rang 4' });
      }

      const pairs = splitLines(fin.skillPairs);
      if (pairs.length) {
        const granted = new Map();
        const got = [];
        splitList(rng.pick(pairs)).forEach((raw) => {
          const options = parseSkillEntry(raw).options;
          if (!options.length) return;
          const res = set.add(rng.pick(options), rng, granted);
          got.push(res.name + (res.spec ? ' (' + res.spec + ')' : '') + ' +' + res.level);
        });
        finalisation.push({ label: 'Compétences de Voyageur', text: got.join(', ') });
      }

      const extras = splitLines(fin.benefits);
      if (extras.length) finalisation.push({ label: 'Bénéfice', text: takeBenefit(rng.pick(extras), 'Finalisation') });
    }

    // Habillage
    const flavor = data.flavor || {};
    const pickOr = (arr, fallback) => (Array.isArray(arr) && arr.length ? rng.pick(arr) : fallback);
    const roles = splitLines(career.roles);
    return {
      seed,
      method,
      name: (pickOr(flavor.firstNames, 'Anonyme') + ' ' + pickOr(flavor.lastNames, '')).trim(),
      age,
      role: roles.length ? rng.pick(roles) : career.name,
      background: { id: background.id, name: background.name },
      career: { id: career.id, name: career.name },
      rank,
      rolls,
      base,
      chars,
      changes,
      upp: upp(chars),
      skills: set.list(),
      credits,
      items,
      finalisation,
      portrait: {
        personality: pickOr(flavor.personalities, ''),
        quirk: pickOr(flavor.quirks, ''),
        goal: pickOr(flavor.goals, ''),
      },
    };
  }

  function generateBatch(data, opts) {
    const count = Math.max(1, Math.min(50, parseInt(opts.count, 10) || 1));
    const typed = String(opts.seed || '').trim();
    const out = [];
    for (let i = 0; i < count; i++) {
      const seed = typed ? (count === 1 ? typed : typed + '-' + (i + 1)) : randomSeed();
      out.push(generateNpc(data, Object.assign({}, opts, { seed })));
    }
    return out;
  }

  /* ---------- Exports texte ---------- */

  function charLine(npc) {
    return CHARS.map((c) => c + ' ' + npc.chars[c] + ' (' + fmtDm(dm(npc.chars[c])) + ')').join('  ');
  }

  function assets(npc) {
    const parts = [];
    if (npc.credits) parts.push(fmtCredits(npc.credits));
    return parts.concat(npc.items);
  }

  function identity(npc) {
    return npc.role + ', ' + npc.age + ' ans';
  }

  function toText(npc) {
    const lines = [
      npc.name + ' — ' + identity(npc),
      'Origine : ' + npc.background.name + ' · Carrière : ' + npc.career.name + (npc.rank ? ' · ' + rankLabel(npc.rank) : ''),
      'UPP ' + npc.upp + ' — ' + charLine(npc),
      'Compétences : ' + npc.skills.map(skillLabel).join(', '),
    ];
    if (assets(npc).length) lines.push('Biens et relations : ' + assets(npc).join(', '));
    if (npc.portrait.personality) lines.push('Caractère : ' + npc.portrait.personality);
    if (npc.portrait.quirk) lines.push('Signe distinctif : ' + npc.portrait.quirk);
    if (npc.portrait.goal) lines.push('Motivation : ' + npc.portrait.goal);
    lines.push('Graine : ' + npc.seed);
    return lines.join('\n');
  }

  function toMarkdown(npc) {
    const lines = [
      '### ' + npc.name,
      '',
      '*' + identity(npc) + ' — origine ' + npc.background.name + ', carrière ' + npc.career.name + (npc.rank ? ', ' + rankLabel(npc.rank) : '') + '*',
      '',
      '**UPP `' + npc.upp + '`**',
      '',
      '| ' + CHARS.join(' | ') + ' |',
      '|' + CHARS.map(() => ' :-: ').join('|') + '|',
      '| ' + CHARS.map((c) => npc.chars[c] + ' (' + fmtDm(dm(npc.chars[c])) + ')').join(' | ') + ' |',
      '',
      '**Compétences :** ' + npc.skills.map(skillLabel).join(', '),
    ];
    if (assets(npc).length) lines.push('', '**Biens et relations :** ' + assets(npc).join(', '));
    const p = npc.portrait;
    if (p.personality || p.quirk || p.goal) {
      lines.push('');
      if (p.personality) lines.push('- **Caractère :** ' + p.personality);
      if (p.quirk) lines.push('- **Signe distinctif :** ' + p.quirk);
      if (p.goal) lines.push('- **Motivation :** ' + p.goal);
    }
    lines.push('', '<sub>Graine ' + npc.seed + '</sub>');
    return lines.join('\n');
  }

  function toCompact(npc) {
    const skills = npc.skills.filter((s) => s.level > 0).map(skillLabel);
    const zero = npc.skills.filter((s) => s.level === 0).map((s) => s.name);
    let line = npc.name + ' (' + identity(npc) + ') ' + npc.upp + ' — ' + skills.join(', ');
    if (zero.length) line += ' ; niveau 0 : ' + zero.join(', ');
    if (assets(npc).length) line += ' — ' + assets(npc).join(', ');
    return line;
  }

  return {
    CHARS,
    METHODS,
    makeRng,
    randomSeed,
    parseDice,
    rollDice,
    dm,
    fmtDm,
    ehex,
    upp,
    parseMods,
    parseRequirement,
    parsePriority,
    splitTop,
    splitList,
    splitLines,
    parseSkillEntry,
    parseCredits,
    parseRank,
    rankLabel,
    fmtCredits,
    skillLabel,
    validatePackage,
    validateRules,
    validateFinalisation,
    validateData,
    generateNpc,
    generateBatch,
    assets,
    toText,
    toMarkdown,
    toCompact,
  };
});
