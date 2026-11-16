/* Interface du générateur de PNJ. Dépend de engine.js et packages.js. */
(function () {
  'use strict';

  const E = window.TravellerEngine;
  const SHIPPED = window.TRAVELLER_DATA;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* Le stockage local est un confort : tout doit fonctionner sans lui. */
  const store = {
    get(key) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : null;
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        /* stockage indisponible : on continue sans */
      }
    },
    del(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        /* idem */
      }
    },
  };
  const KEY_DATA = 'pnj-traveller-donnees';
  const KEY_KEPT = 'pnj-traveller-gardes';
  const KEY_OPTS = 'pnj-traveller-options';

  function h(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function validShape(d) {
    return !!(d && Array.isArray(d.backgrounds) && d.backgrounds.length && Array.isArray(d.careers) && d.careers.length && d.rules && d.skills);
  }

  /* Complète des données importées avec les sections absentes. */
  function normalise(d) {
    const out = clone(d);
    ['flavor', 'finalisation', 'openSpecialties', 'specAliases', 'meta'].forEach((k) => {
      if (out[k] == null) out[k] = clone(SHIPPED[k]);
    });
    out.rules = Object.assign({}, clone(SHIPPED.rules), out.rules);
    return out;
  }

  /* ---------- État ---------- */

  const saved = store.get(KEY_DATA);
  let data = validShape(saved) ? normalise(saved) : clone(SHIPPED);
  let customised = validShape(saved);
  let results = [];
  let kept = store.get(KEY_KEPT) || [];
  let uidCounter = 0;
  const opts = Object.assign({ backgroundId: '', careerId: '', method: 'carriere', count: 3, seed: '', finalise: true }, store.get(KEY_OPTS) || {});

  function persistData() {
    customised = true;
    store.set(KEY_DATA, data);
  }

  /* ---------- Messages ---------- */

  let toastTimer = null;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function showCopyDialog(text) {
    const dialog = $('#copy-dialog');
    $('#copy-text').value = text;
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', '');
    $('#copy-text').select();
  }

  /* À appeler depuis un clic. Si le presse-papiers est refusé, on montre le texte. */
  function copy(text, label) {
    const fallback = () => showCopyDialog(text);
    if (!navigator.clipboard || !navigator.clipboard.writeText) return fallback();
    navigator.clipboard.writeText(text).then(() => toast(label + ' : copié'), fallback);
  }

  /* ---------- Fiche de PNJ ---------- */

  function findNpc(uid) {
    return results.find((n) => n.uid === uid) || kept.find((n) => n.uid === uid) || null;
  }

  function isKept(uid) {
    return kept.some((n) => n.uid === uid);
  }

  function signed(n) {
    return n > 0 ? '+' + n : '−' + Math.abs(n);
  }

  function cardHtml(npc) {
    const trained = npc.skills.filter((s) => s.level > 0);
    const zero = npc.skills.filter((s) => s.level === 0);
    const assets = E.assets(npc);
    const p = npc.portrait || {};
    const chars = E.CHARS.map((c) => {
      const delta = npc.chars[c] - npc.base[c];
      return (
        '<div class="char' + (delta ? ' moved' : '') + '">' +
        '<dt>' + c + '</dt>' +
        '<dd class="char-v">' + npc.chars[c] + '</dd>' +
        '<dd class="char-dm">' + E.fmtDm(E.dm(npc.chars[c])) + '</dd>' +
        '</div>'
      );
    }).join('');

    const changes = npc.changes.length
      ? npc.changes.map((c) => h(c.source) + ' ' + c.char + ' ' + signed(c.delta)).join(' · ')
      : 'aucun';
    const finalLines = (npc.finalisation || [])
      .map((f) => '<li><span class="k">' + h(f.label) + '</span> ' + h(f.text) + '</li>')
      .join('');
    const portrait = [
      p.personality && ['Caractère', p.personality],
      p.quirk && ['Signe distinctif', p.quirk],
      p.goal && ['Motivation', p.goal],
    ].filter(Boolean);

    return (
      '<article class="dossier" data-uid="' + h(npc.uid) + '">' +
      '<header class="dossier-head">' +
      '<div class="who"><h3>' + h(npc.name) + '</h3>' +
      '<p class="role">' + h(npc.role) + ' · ' + npc.age + ' ans</p></div>' +
      '<div class="upp" title="Universal Personality Profile"><span class="upp-k">UPP</span>' + h(npc.upp) + '</div>' +
      '</header>' +
      '<p class="tags">' +
      '<span class="tag"><span class="k">Origine</span> ' + h(npc.background.name) + '</span>' +
      '<span class="tag"><span class="k">Carrière</span> ' + h(npc.career.name) + '</span>' +
      (npc.rank ? '<span class="tag"><span class="k">Rang</span> ' + npc.rank.level + (npc.rank.title ? ' (' + h(npc.rank.title) + ')' : '') + '</span>' : '') +
      '</p>' +
      '<dl class="chars">' + chars + '</dl>' +
      '<section><h4>Compétences</h4>' +
      '<ul class="skills">' +
      trained.map((s) => '<li>' + h(s.name) + (s.spec ? ' <span class="spec">(' + h(s.spec) + ')</span>' : '') + ' <b>' + s.level + '</b></li>').join('') +
      '</ul>' +
      (zero.length ? '<p class="zero"><span class="k">Niveau 0</span> ' + zero.map((s) => h(s.name)).join(', ') + '</p>' : '') +
      '</section>' +
      (assets.length ? '<section><h4>Biens et relations</h4><p class="assets">' + assets.map(h).join(' · ') + '</p></section>' : '') +
      (portrait.length
        ? '<section><h4>Portrait</h4><ul class="portrait">' +
          portrait.map((x) => '<li><span class="k">' + x[0] + '</span> ' + h(x[1]) + '</li>').join('') +
          '</ul></section>'
        : '') +
      '<details class="trace"><summary>Détail de la création</summary><ul>' +
      '<li><span class="k">Jets</span> ' + npc.rolls.join(' · ') + ' (' + h(E.METHODS[npc.method] || npc.method) + ')</li>' +
      '<li><span class="k">Modificateurs</span> ' + changes + '</li>' +
      finalLines +
      '<li><span class="k">Graine</span> <code>' + h(npc.seed) + '</code></li>' +
      '</ul></details>' +
      '<footer class="actions">' +
      '<button type="button" data-act="copy-text">Copier</button>' +
      '<button type="button" data-act="copy-md">Markdown</button>' +
      '<button type="button" data-act="copy-line">Une ligne</button>' +
      '<button type="button" class="keep' + (isKept(npc.uid) ? ' on' : '') + '" data-act="toggle-keep" aria-pressed="' + isKept(npc.uid) + '">' +
      (isKept(npc.uid) ? 'Gardé' : 'Garder') +
      '</button>' +
      '</footer>' +
      '</article>'
    );
  }

  /* ---------- Vue Générer ---------- */

  function optionList(packages, selected) {
    return (
      '<option value="">Au hasard</option>' +
      packages.map((p) => '<option value="' + h(p.id) + '"' + (p.id === selected ? ' selected' : '') + '>' + h(p.name) + '</option>').join('')
    );
  }

  function renderControls() {
    if (!data.backgrounds.some((p) => p.id === opts.backgroundId)) opts.backgroundId = '';
    if (!data.careers.some((p) => p.id === opts.careerId)) opts.careerId = '';
    $('#opt-background').innerHTML = optionList(data.backgrounds, opts.backgroundId);
    $('#opt-career').innerHTML = optionList(data.careers, opts.careerId);
    $('#opt-method').innerHTML = Object.keys(E.METHODS)
      .map((k) => '<option value="' + k + '"' + (k === opts.method ? ' selected' : '') + '>' + h(E.METHODS[k]) + '</option>')
      .join('');
    $('#opt-count').value = opts.count;
    $('#opt-seed').value = opts.seed;
    $('#opt-finalise').checked = !!opts.finalise;
  }

  function readControls() {
    opts.backgroundId = $('#opt-background').value;
    opts.careerId = $('#opt-career').value;
    opts.method = $('#opt-method').value;
    opts.count = Math.max(1, Math.min(20, parseInt($('#opt-count').value, 10) || 1));
    opts.seed = $('#opt-seed').value.trim();
    opts.finalise = $('#opt-finalise').checked;
    $('#opt-count').value = opts.count;
    store.set(KEY_OPTS, opts);
  }

  function renderDataAlert() {
    const errors = E.validateData(data).filter((i) => i.level === 'error');
    const el = $('#data-alert');
    el.hidden = !errors.length;
    if (errors.length)
      el.innerHTML =
        '<strong>' + errors.length + ' erreur' + (errors.length > 1 ? 's' : '') + ' dans les tables.</strong> ' +
        'Les entrées illisibles sont ignorées. <a href="#donnees">Corriger dans Données</a>';
  }

  function generate() {
    readControls();
    try {
      results = E.generateBatch(data, opts).map((npc) => Object.assign(npc, { uid: Date.now().toString(36) + '-' + uidCounter++ }));
    } catch (err) {
      results = [];
      $('#results').innerHTML = '<p class="empty">La génération a échoué : ' + h(err.message) + '. Vérifie les tables dans <a href="#donnees">Données</a>.</p>';
      return;
    }
    renderResults();
  }

  function renderResults() {
    $('#results-count').textContent = results.length + ' PNJ';
    $('#results').innerHTML = results.map(cardHtml).join('');
  }

  /* ---------- Vue Gardés ---------- */

  function renderKept() {
    $('#nav-kept-count').textContent = kept.length ? ' (' + kept.length + ')' : '';
    $('#kept-toolbar').hidden = !kept.length;
    $('#kept-count').textContent = kept.length + ' PNJ gardé' + (kept.length > 1 ? 's' : '');
    $('#kept').innerHTML = kept.length
      ? kept.map(cardHtml).join('')
      : '<p class="empty">Aucun PNJ gardé. Dans <a href="#generer">Générer</a>, le bouton « Garder » d’une fiche la range ici, sur cet appareil.</p>';
  }

  function toggleKeep(uid) {
    if (isKept(uid)) kept = kept.filter((n) => n.uid !== uid);
    else {
      const npc = findNpc(uid);
      if (npc) kept.unshift(clone(npc));
    }
    store.set(KEY_KEPT, kept);
    renderKept();
    $$('.dossier[data-uid="' + uid + '"] .keep').forEach((b) => {
      b.classList.toggle('on', isKept(uid));
      b.setAttribute('aria-pressed', String(isKept(uid)));
      b.textContent = isKept(uid) ? 'Gardé' : 'Garder';
    });
  }

  /* ---------- Vue Données ---------- */

  function field(id, label, control, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' + control + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
  }

  function issuesHtml(issues) {
    if (!issues.length) return '';
    return '<ul class="issue-list">' + issues.map((i) => '<li class="' + i.level + '">' + h(i.message) + '</li>').join('') + '</ul>';
  }

  function stateHtml(issues) {
    const errors = issues.filter((i) => i.level === 'error').length;
    const warns = issues.length - errors;
    if (errors) return '<span class="pill error">' + errors + ' erreur' + (errors > 1 ? 's' : '') + '</span>';
    if (warns) return '<span class="pill warn">' + warns + ' à vérifier</span>';
    return '';
  }

  function pkgList(kind) {
    return kind === 'career' ? data.careers : data.backgrounds;
  }

  function pkgEditorHtml(kind, p, open) {
    const id = (f) => kind + '-' + p.id + '-' + f;
    const attrs = (f) => ' id="' + id(f) + '" data-kind="' + kind + '" data-pkg="' + h(p.id) + '" data-field="' + f + '"';
    const issues = E.validatePackage(data, p, kind);
    const skills = E.splitList(p.skills);
    let body =
      field(id('name'), 'Nom', '<input type="text"' + attrs('name') + ' value="' + h(p.name) + '">') +
      field(id('mods'), 'Modificateurs de caractéristiques', '<input type="text"' + attrs('mods') + ' value="' + h(p.mods || '') + '" placeholder="STR +1, EDU -1">') +
      field(
        id('skills'),
        'Compétences',
        '<textarea rows="' + Math.max(4, Math.ceil(skills.length / 2)) + '"' + attrs('skills') + '>' + h(skills.join('\n')) + '</textarea>',
        'Une par ligne. <code>(any)</code> tire la spécialité au hasard, <code>(a/b)</code> choisit parmi une liste, <code>A 1 / B 1</code> donne l’une des deux.'
      ) +
      field(
        id('benefits'),
        'Bénéfices',
        '<textarea rows="3"' + attrs('benefits') + '>' + h(E.splitLines(p.benefits).join('\n')) + '</textarea>',
        'Un par ligne. <code>Cr 5000</code> s’additionne, <code>Rank 2 (titre)</code> donne le rang, <code>A / B</code> en tire un.'
      );
    if (kind === 'career')
      body +=
        '<div class="field-row">' +
        field(id('requires'), 'Prérequis', '<input type="text"' + attrs('requires') + ' value="' + h(p.requires || '') + '" placeholder="SOC 10+">') +
        field(id('priority'), 'Caractéristiques prioritaires', '<input type="text"' + attrs('priority') + ' value="' + h(p.priority || '') + '" placeholder="INT, DEX, EDU">', 'Reçoivent les meilleurs jets. Ajout de l’outil.') +
        '</div>' +
        field(id('roles'), 'Intitulés possibles du PNJ', '<textarea rows="3"' + attrs('roles') + '>' + h(E.splitLines(p.roles).join('\n')) + '</textarea>', 'Un par ligne. Habillage, hors règles.');
    body +=
      '<div data-issues="' + kind + ':' + h(p.id) + '">' + issuesHtml(issues) + '</div>' +
      '<p class="pkg-foot"><button type="button" class="danger" data-act="delete-pkg" data-kind="' + kind + '" data-pkg="' + h(p.id) + '">Supprimer ce package</button></p>';
    return (
      '<details class="pkg"' + (open ? ' open' : '') + ' data-pkg-box="' + kind + ':' + h(p.id) + '">' +
      '<summary><span class="pkg-name">' + h(p.name) + '</span>' +
      '<span class="pkg-mods">' + h(p.mods || 'sans modificateur') + '</span>' +
      '<span class="pkg-state">' + stateHtml(issues) + '</span></summary>' +
      '<div class="pkg-body">' + body + '</div></details>'
    );
  }

  function catalogText() {
    return Object.keys(data.skills)
      .map((name) => name + (data.skills[name].length ? ': ' + data.skills[name].join(', ') : ''))
      .join('\n');
  }

  function renderDataSummary() {
    const issues = E.validateData(data);
    const errors = issues.filter((i) => i.level === 'error').length;
    const warns = issues.length - errors;
    let status = '<span class="pill ok">Tables valides</span>';
    if (errors) status = '<span class="pill error">' + errors + ' erreur' + (errors > 1 ? 's' : '') + '</span>';
    else if (warns) status = '<span class="pill warn">' + warns + ' point' + (warns > 1 ? 's' : '') + ' à vérifier</span>';
    $('#data-summary').innerHTML =
      '<p><strong>' + data.backgrounds.length + ' origines, ' + data.careers.length + ' carrières.</strong> ' + status +
      (customised ? ' <span class="pill">Modifiées sur cet appareil</span>' : '') + '</p>' +
      '<p class="hint">Source : ' + h((data.meta && data.meta.source) || 'inconnue') + '. Les modifications restent dans ce navigateur : copie le JSON en bas de page pour les conserver ou les partager.</p>';
    ['rules', 'finalisation'].forEach((part) => {
      const list = part === 'rules' ? E.validateRules(data) : E.validateFinalisation(data);
      $('[data-issues="' + part + '"]').innerHTML = issuesHtml(list);
    });
  }

  function renderData(openKey) {
    const r = data.rules;
    const fin = data.finalisation || {};
    $('#rules-form').innerHTML =
      '<div class="field-row">' +
      field('rule-characteristicMin', 'Caractéristique minimale', '<input type="number" id="rule-characteristicMin" data-rule="characteristicMin" value="' + h(r.characteristicMin) + '">') +
      field('rule-characteristicMax', 'Caractéristique maximale', '<input type="number" id="rule-characteristicMax" data-rule="characteristicMax" value="' + h(r.characteristicMax) + '">') +
      field('rule-maxSkillLevel', 'Niveau de compétence maximal', '<input type="number" id="rule-maxSkillLevel" data-rule="maxSkillLevel" value="' + h(r.maxSkillLevel) + '">') +
      '</div><div class="field-row">' +
      field('rule-baseAge', 'Âge après l’origine', '<input type="number" id="rule-baseAge" data-rule="baseAge" value="' + h(r.baseAge) + '">') +
      field('rule-careerAging', 'Années de carrière', '<input type="text" id="rule-careerAging" data-rule="careerAging" value="' + h(r.careerAging) + '">', 'Un jet de dés : <code>3D</code>, <code>2D+4</code>, ou un nombre fixe.') +
      field(
        'rule-stacking',
        'Compétence reçue deux fois',
        '<select id="rule-stacking" data-rule="stacking"><option value="add"' + (r.stacking !== 'max' ? ' selected' : '') + '>Les niveaux s’additionnent</option><option value="max"' + (r.stacking === 'max' ? ' selected' : '') + '>On garde le plus haut</option></select>'
      ) +
      '</div>' +
      field('rule-fixedArray', 'Tableau fixe', '<input type="text" id="rule-fixedArray" data-rule="fixedArray" value="' + h((r.fixedArray || []).join(', ')) + '">', 'Six valeurs, pour la méthode « Tableau fixe ».') +
      '<div data-issues="rules"></div>';

    ['background', 'career'].forEach((kind) => {
      $('#pkg-' + kind).innerHTML = pkgList(kind).map((p) => pkgEditorHtml(kind, p, openKey === kind + ':' + p.id)).join('');
    });

    $('#final-form').innerHTML =
      field('fin-skillPairs', 'Paires de compétences de Voyageur', '<textarea id="fin-skillPairs" data-fin="skillPairs" rows="12">' + h(E.splitLines(fin.skillPairs).join('\n')) + '</textarea>', 'Une paire par ligne, compétences séparées par une virgule. Une paire est tirée par PNJ.') +
      field('fin-benefits', 'Bénéfices au choix', '<textarea id="fin-benefits" data-fin="benefits" rows="6">' + h(E.splitLines(fin.benefits).join('\n')) + '</textarea>', 'Un par ligne. Un bénéfice est tiré par PNJ. <code>SOC +1</code> modifie la caractéristique.') +
      '<p class="hint">Le choix de carrière est tiré parmi les trois options du livre : une compétence de carrière de niveau 1 ou plus portée à 4, trois compétences de carrière augmentées de 1 (maximum 2), ou départ au rang 4.</p>' +
      '<div data-issues="finalisation"></div>';

    $('#catalog-form').innerHTML =
      field('catalog-text', 'Compétences et spécialités', '<textarea id="catalog-text" rows="14" spellcheck="false">' + h(catalogText()) + '</textarea>', 'Une compétence par ligne : <code>Nom: spécialité, spécialité</code>. Sert à tirer les spécialités « any » et à repérer les fautes de frappe.') +
      field('catalog-open', 'Compétences à spécialités libres', '<input type="text" id="catalog-open" value="' + h((data.openSpecialties || []).join(', ')) + '">', 'Aucun avertissement pour une spécialité hors catalogue.');

    renderDataSummary();
  }

  function refreshPkg(kind, id) {
    const p = pkgList(kind).find((x) => x.id === id);
    const box = $('[data-pkg-box="' + kind + ':' + id + '"]');
    if (!p || !box) return;
    const issues = E.validatePackage(data, p, kind);
    $('.pkg-name', box).textContent = p.name;
    $('.pkg-mods', box).textContent = p.mods || 'sans modificateur';
    $('.pkg-state', box).innerHTML = stateHtml(issues);
    $('[data-issues]', box).innerHTML = issuesHtml(issues);
  }

  function afterDataChange() {
    persistData();
    renderDataSummary();
    renderControls();
    renderDataAlert();
  }

  function onDataChange(ev) {
    const t = ev.target;
    if (t.dataset.field) {
      const p = pkgList(t.dataset.kind).find((x) => x.id === t.dataset.pkg);
      if (!p) return;
      const f = t.dataset.field;
      if (f === 'skills') p.skills = E.splitList(t.value);
      else if (f === 'benefits' || f === 'roles') p[f] = E.splitLines(t.value);
      else p[f] = t.value.trim();
      afterDataChange();
      refreshPkg(t.dataset.kind, p.id);
    } else if (t.dataset.rule) {
      const k = t.dataset.rule;
      if (k === 'fixedArray') data.rules.fixedArray = t.value.split(/[,;\s]+/).filter(Boolean).map(Number);
      else if (k === 'careerAging' || k === 'stacking') data.rules[k] = t.value.trim();
      else data.rules[k] = t.value === '' ? NaN : Number(t.value);
      afterDataChange();
    } else if (t.dataset.fin) {
      data.finalisation = data.finalisation || {};
      data.finalisation[t.dataset.fin] = E.splitLines(t.value);
      afterDataChange();
    } else if (t.id === 'catalog-text') {
      const skills = {};
      t.value.split('\n').forEach((line) => {
        const i = line.indexOf(':');
        const name = (i === -1 ? line : line.slice(0, i)).trim();
        if (!name) return;
        skills[name] = i === -1 ? [] : line.slice(i + 1).split(',').map((s) => s.trim()).filter(Boolean);
      });
      data.skills = skills;
      persistData();
      renderData();
      renderControls();
      renderDataAlert();
    } else if (t.id === 'catalog-open') {
      data.openSpecialties = t.value.split(',').map((s) => s.trim()).filter(Boolean);
      persistData();
      renderData();
    } else if (t.id === 'import-file' && t.files && t.files[0]) {
      const reader = new FileReader();
      reader.onload = () => loadJson(String(reader.result));
      reader.readAsText(t.files[0]);
      t.value = '';
    }
  }

  function loadJson(text) {
    const msg = $('#import-msg');
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      msg.textContent = 'Ce texte n’est pas du JSON valide : ' + err.message;
      msg.className = 'msg error';
      return;
    }
    if (!validShape(parsed)) {
      msg.textContent = 'JSON lu, mais il manque des sections : il faut au moins rules, skills, backgrounds et careers.';
      msg.className = 'msg error';
      return;
    }
    data = normalise(parsed);
    persistData();
    renderData();
    renderControls();
    renderDataAlert();
    $('#json-text').value = '';
    msg.textContent = 'Tables chargées : ' + data.backgrounds.length + ' origines, ' + data.careers.length + ' carrières.';
    msg.className = 'msg ok';
  }

  let resetArmed = null;
  function resetData(button) {
    if (!resetArmed) {
      button.textContent = 'Confirmer : effacer mes modifications';
      resetArmed = setTimeout(() => {
        resetArmed = null;
        button.textContent = 'Rétablir les tables d’origine';
      }, 5000);
      return;
    }
    clearTimeout(resetArmed);
    resetArmed = null;
    button.textContent = 'Rétablir les tables d’origine';
    data = clone(SHIPPED);
    customised = false;
    store.del(KEY_DATA);
    renderData();
    renderControls();
    renderDataAlert();
    toast('Tables d’origine rétablies');
  }

  /* ---------- Actions ---------- */

  function onClick(ev) {
    const btn = ev.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const card = btn.closest('.dossier');
    const npc = card ? findNpc(card.dataset.uid) : null;

    if (act === 'copy-text' && npc) copy(E.toText(npc), npc.name);
    else if (act === 'copy-md' && npc) copy(E.toMarkdown(npc), npc.name + ' (Markdown)');
    else if (act === 'copy-line' && npc) copy(E.toCompact(npc), npc.name + ' (une ligne)');
    else if (act === 'toggle-keep' && npc) toggleKeep(npc.uid);
    else if (act === 'copy-all') copy(results.map(E.toText).join('\n\n'), results.length + ' PNJ');
    else if (act === 'copy-all-md') copy(results.map(E.toMarkdown).join('\n\n'), results.length + ' PNJ (Markdown)');
    else if (act === 'copy-kept') copy(kept.map(E.toText).join('\n\n'), kept.length + ' PNJ gardés');
    else if (act === 'copy-kept-md') copy(kept.map(E.toMarkdown).join('\n\n'), kept.length + ' PNJ gardés (Markdown)');
    else if (act === 'add-pkg') {
      const kind = btn.dataset.kind;
      const p = { id: 'perso-' + Date.now().toString(36), name: kind === 'career' ? 'Nouvelle carrière' : 'Nouvelle origine', mods: '', skills: [], benefits: [] };
      if (kind === 'career') Object.assign(p, { priority: '', requires: '', roles: [] });
      pkgList(kind).push(p);
      persistData();
      renderData(kind + ':' + p.id);
      renderControls();
      const box = $('[data-pkg-box="' + kind + ':' + p.id + '"]');
      if (box) box.scrollIntoView({ block: 'center' });
    } else if (act === 'delete-pkg') {
      const kind = btn.dataset.kind;
      const list = pkgList(kind);
      if (list.length <= 1) return toast('Il faut garder au moins un package');
      if (btn.dataset.armed !== '1') {
        btn.dataset.armed = '1';
        btn.textContent = 'Confirmer la suppression';
        return;
      }
      const i = list.findIndex((x) => x.id === btn.dataset.pkg);
      if (i !== -1) list.splice(i, 1);
      persistData();
      renderData();
      renderControls();
      renderDataAlert();
    } else if (act === 'export-json') {
      const text = JSON.stringify(data, null, 2);
      $('#json-text').value = text;
      copy(text, 'Tables (JSON)');
    } else if (act === 'import-json') loadJson($('#json-text').value);
    else if (act === 'reset-data') resetData(btn);
    else if (act === 'close-dialog') {
      const dialog = $('#copy-dialog');
      if (dialog.close) dialog.close();
      else dialog.removeAttribute('open');
    }
  }

  /* ---------- Navigation ---------- */

  const VIEWS = ['generer', 'gardes', 'donnees'];
  function route() {
    const name = VIEWS.indexOf(location.hash.slice(1)) !== -1 ? location.hash.slice(1) : 'generer';
    VIEWS.forEach((v) => {
      $('#view-' + v).hidden = v !== name;
      const link = $('.tabs a[href="#' + v + '"]');
      if (v === name) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  /* ---------- Démarrage ---------- */

  document.addEventListener('click', onClick);
  $('#view-donnees').addEventListener('change', onDataChange);
  $('#gen-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    generate();
  });
  window.addEventListener('hashchange', route);

  renderControls();
  renderDataAlert();
  renderData();
  renderKept();
  route();
  generate();
})();
