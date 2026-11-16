/* Tests du moteur : node test/engine.test.js */
const assert = require('assert');
const E = require('../engine.js');
const data = require('../packages.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('ok  ' + name);
}

test('les données livrées sont valides, sans erreur ni avertissement', () => {
  const issues = E.validateData(data);
  assert.deepStrictEqual(issues, [], JSON.stringify(issues, null, 2));
});

test('8 origines et 17 carrières', () => {
  assert.strictEqual(data.backgrounds.length, 8);
  assert.strictEqual(data.careers.length, 17);
});

test('modificateurs de caractéristique et UPP', () => {
  assert.deepStrictEqual([0, 1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15].map(E.dm), [-3, -2, -2, -1, -1, 0, 0, 1, 1, 2, 2, 3]);
  assert.strictEqual(E.upp({ STR: 7, DEX: 10, END: 8, INT: 11, EDU: 9, SOC: 15 }), '7A8B9F');
});

test('analyse des compétences, modificateurs et bénéfices', () => {
  assert.deepStrictEqual(E.parseSkillEntry('Gun Combat (slug) 1').options, [{ name: 'Gun Combat', specs: ['slug'], level: 1 }]);
  assert.deepStrictEqual(E.parseSkillEntry('Drive (any) 1 / Flyer (wing/grav) 2').options, [
    { name: 'Drive', specs: ['any'], level: 1 },
    { name: 'Flyer', specs: ['wing', 'grav'], level: 2 },
  ]);
  assert.strictEqual(E.parseSkillEntry('Vacc Suit').errors.length, 1);
  assert.deepStrictEqual(E.parseMods('STR -1, DEX +1, EDU -1').mods, { STR: -1, DEX: 1, EDU: -1 });
  assert.strictEqual(E.parseMods('FOO +1').errors.length, 1);
  assert.strictEqual(E.parseCredits('Cr 75000'), 75000);
  assert.strictEqual(E.parseCredits('Vacc Suit'), null);
  assert.deepStrictEqual(E.parseRank('Rank 2 (field agent)'), { level: 2, title: 'field agent' });
  assert.deepStrictEqual(E.parseRequirement('SOC 10+'), { char: 'SOC', min: 10 });
});

test('une même graine redonne le même PNJ', () => {
  const a = E.generateNpc(data, { seed: 'REGINA' });
  const b = E.generateNpc(data, { seed: 'REGINA' });
  assert.deepStrictEqual(a, b);
  assert.notDeepStrictEqual(a, E.generateNpc(data, { seed: 'REGINA-2' }));
});

test('cumul exact sans finalisation : Belter + Scout, jets dans l’ordre', () => {
  const npc = E.generateNpc(data, { seed: 'T1', backgroundId: 'belter', careerId: 'scout', method: 'ordre', finalise: false });
  const clamp = (n) => Math.max(1, Math.min(15, n));
  const [s, d, e, i, ed, so] = npc.rolls;
  assert.deepStrictEqual(npc.chars, { STR: clamp(s - 1), DEX: clamp(d + 1), END: e, INT: clamp(i + 1), EDU: clamp(ed - 1), SOC: so });
  const level = (name, spec) => {
    const f = npc.skills.find((k) => k.name === name && (spec === undefined || k.spec === spec));
    return f ? f.level : null;
  };
  assert.strictEqual(level('Vacc Suit'), 2); // 1 (Belter) + 1 (Scout)
  assert.strictEqual(level('Jack-of-All-Trades'), 2); // 1 + 1
  assert.strictEqual(level('Profession', 'belter'), 2);
  assert.strictEqual(level('Astrogation'), 1); // 0 + 1
  assert.strictEqual(level('Pilot', 'spacecraft'), 1);
  assert.strictEqual(level('Carouse'), 0);
  assert.strictEqual(level('Gun Combat'), 0); // niveau 0 : pas de spécialité
  assert.strictEqual(npc.credits, 27500); // Cr2500 + Cr25000
  assert.ok(npc.items.includes('Vacc Suit'));
  assert.ok(npc.age >= 25 && npc.age <= 40);
  assert.deepStrictEqual(npc.finalisation, []);
});

test('Scholar reçoit deux sciences différentes (3 et 1)', () => {
  for (let n = 0; n < 200; n++) {
    const npc = E.generateNpc(data, { seed: 'SCH' + n, backgroundId: 'belter', careerId: 'scholar', finalise: false });
    const sci = npc.skills.filter((k) => k.name === 'Science').map((k) => k.level).sort();
    assert.deepStrictEqual(sci, [1, 3], npc.seed + ' ' + JSON.stringify(sci));
  }
});

test('Noble : jamais tiré au hasard sous SOC 10 ; imposé, SOC relevé à 10', () => {
  for (let n = 0; n < 1500; n++) {
    const npc = E.generateNpc(data, { seed: 'NOB' + n, method: 'ordre', finalise: false });
    if (npc.career.id === 'noble') assert.ok(npc.chars.SOC >= 10, npc.seed);
  }
  for (let n = 0; n < 200; n++) {
    const npc = E.generateNpc(data, { seed: 'NOBL' + n, careerId: 'noble', method: 'ordre', finalise: false });
    assert.ok(npc.chars.SOC >= 10, npc.seed);
  }
});

test('finalisation : trois choix, effets appliqués', () => {
  const seen = { raise: 0, bump: 0, rank: 0 };
  for (let n = 0; n < 600; n++) {
    const opts = { seed: 'FIN' + n, method: 'ordre' };
    const before = E.generateNpc(data, Object.assign({ finalise: false }, opts));
    const npc = E.generateNpc(data, opts);
    assert.strictEqual(npc.finalisation.length, 3, npc.seed);
    assert.deepStrictEqual(npc.finalisation.map((f) => f.label), ['Carrière', 'Compétences de Voyageur', 'Bénéfice']);
    const career = npc.finalisation[0].text;
    if (/maximum/.test(career)) seen.raise++;
    else if (/\+1 chacune/.test(career)) seen.bump++;
    else if (/rang 4/.test(career)) {
      seen.rank++;
      assert.strictEqual(npc.rank.level, 4);
    }
    const sum = (x) => x.skills.reduce((t, k) => t + k.level, 0);
    assert.ok(sum(npc) > sum(before) || /rang 4/.test(career), npc.seed);
    assert.ok(sum(npc) >= sum(before) + 1, npc.seed);
  }
  assert.ok(seen.raise > 50 && seen.bump > 50 && seen.rank > 50, JSON.stringify(seen));
});

test('5000 PNJ : bornes respectées pour toutes les méthodes', () => {
  const careers = new Set();
  const backgrounds = new Set();
  Object.keys(E.METHODS).forEach((method) => {
    for (let n = 0; n < 1700; n++) {
      const npc = E.generateNpc(data, { seed: method + n, method });
      careers.add(npc.career.id);
      backgrounds.add(npc.background.id);
      E.CHARS.forEach((c) => {
        assert.ok(Number.isInteger(npc.chars[c]) && npc.chars[c] >= 1 && npc.chars[c] <= 15, npc.seed + ' ' + c);
      });
      assert.strictEqual(npc.upp.length, 6);
      assert.ok(npc.skills.length > 5);
      npc.skills.forEach((k) => {
        assert.ok(Number.isInteger(k.level) && k.level >= 0 && k.level <= 4, npc.seed + ' ' + E.skillLabel(k));
        assert.ok(!/undefined|NaN/.test(E.skillLabel(k)), npc.seed + ' ' + E.skillLabel(k));
        const specs = data.skills[k.name] || [];
        if (specs.length && k.level > 0) assert.ok(k.spec, npc.seed + ' ' + k.name + ' sans spécialité');
      });
      assert.ok(npc.age >= 25 && npc.age <= 40);
      assert.ok(Number.isFinite(npc.credits) && npc.credits > 0);
      [E.toText(npc), E.toMarkdown(npc), E.toCompact(npc)].forEach((t) => assert.ok(t && !/undefined|NaN|\[object/.test(t), npc.seed));
    }
  });
  assert.strictEqual(careers.size, 17);
  assert.strictEqual(backgrounds.size, 8);
});

test('écritures du livre acceptées : Pilot (starship), Electronics (computer)', () => {
  const alt = JSON.parse(JSON.stringify(data));
  const scout = alt.careers.find((c) => c.id === 'scout');
  scout.skills = scout.skills.map((s) => s.replace('(spacecraft)', '(starship)').replace('(computers)', '(computer)'));
  assert.deepStrictEqual(E.validateData(alt), []);
  const npc = E.generateNpc(alt, { seed: 'AL', backgroundId: 'fringe', careerId: 'scout', finalise: false });
  assert.ok(npc.skills.some((k) => k.name === 'Pilot' && k.spec === 'spacecraft'));
  assert.ok(npc.skills.some((k) => k.name === 'Electronics' && k.spec === 'computers'));
});

test('le tableau fixe est réparti tel quel avant modificateurs', () => {
  const npc = E.generateNpc(data, { seed: 'TAB', method: 'tableau', finalise: false });
  assert.deepStrictEqual(Object.values(npc.base).sort(), data.rules.fixedArray.slice().sort());
});

test('règle « max » : les niveaux ne s’additionnent plus', () => {
  const alt = JSON.parse(JSON.stringify(data));
  alt.rules.stacking = 'max';
  const npc = E.generateNpc(alt, { seed: 'T1', backgroundId: 'belter', careerId: 'scout', method: 'ordre', finalise: false });
  assert.strictEqual(npc.skills.find((k) => k.name === 'Vacc Suit').level, 1);
});

console.log('\n' + passed + ' tests réussis');
