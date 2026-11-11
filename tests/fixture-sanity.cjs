const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const dir = path.join(__dirname, 'fixtures/saves');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
assert.equal(manifest.storageKey, 'farwake_founders_alpha03_v1');
assert.equal(manifest.version, 3);
assert.deepEqual(Object.keys(manifest.fixtures).sort(), ['fresh', 'late', 'mid']);

for (const [name, info] of Object.entries(manifest.fixtures)) {
  const save = JSON.parse(fs.readFileSync(path.join(dir, info.file), 'utf8'));
  assert.equal(save.v, 3, name);
  assert.equal(typeof save.seed, 'string', name);
  assert.equal(save.seed, info.seed, name);
  assert.equal(save.day, info.day, name);
  assert.ok(save.day >= 1, name);
  assert.equal(save.fog.length, 56 * 56, name);
  assert.ok(Array.isArray(save.colonists) && save.colonists.length >= 1, name);
  assert.ok(Array.isArray(save.buildings) && save.buildings.length >= 3, name);
  assert.equal(save.colonists.length, info.colonists, name);
  if (info.carry) {
    const person = save.colonists.find(colonist => colonist.id === info.carry.id);
    assert.ok(person, `${name} carrier`);
    assert.equal(person.carry.kind, info.carry.kind);
    assert.equal(person.carry.amount, info.carry.amount);
  }
}
assert.equal(manifest.fixtures.fresh.day, 1);
assert.ok(manifest.fixtures.fresh.finished.includes('camp'));
assert.ok(manifest.fixtures.mid.finished.includes('shelter'), 'mid fixture has a finished home');
assert.equal(manifest.fixtures.mid.carry.kind, 'wood');
assert.ok(manifest.fixtures.late.finished.includes('shelter'));
assert.ok(manifest.fixtures.late.finished.includes('workshop'));
assert.equal(manifest.fixtures.late.carry.kind, 'alloy');
assert.ok(manifest.fixtures.late.research.includes('growth'));
assert.ok(manifest.fixtures.late.research.includes('energy'));
assert.equal(manifest.fixtures.late.materialTotal, 340);
assert.ok(manifest.fixtures.late.materialTotal > manifest.fixtures.fresh.materialTotal, 'late stores are fuller than a fresh landing');
console.log('fixture sanity passed for fresh, mid and late.');
