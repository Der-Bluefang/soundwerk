import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterSounds,
  manifestPathFor,
  normalizeManifest,
  queueFromIds,
  storedNumber,
} from '../assets/js/core.js';

const manifest = {
  version: 1,
  title: 'Test board',
  sounds: [
    {
      id: 'gong',
      title: 'Startgong',
      category: 'Signale',
      file: 'assets/audio/start-gong.mp3',
      description: 'Kurzer Gong',
      shortcut: '1',
    },
    {
      id: 'next-stop',
      title: 'Nächster Halt',
      category: 'Ansagen',
      file: 'assets/audio/next-stop.mp3',
      description: 'Ansagebaustein',
      shortcut: '2',
    },
  ],
};

test('normalizeManifest accepts a valid manifest and preserves sound metadata', () => {
  const result = normalizeManifest(manifest);

  assert.equal(result.title, 'Test board');
  assert.equal(result.sounds.length, 2);
  assert.deepEqual(result.sounds[0], manifest.sounds[0]);
});

test('normalizeManifest rejects duplicate IDs and files outside the audio directory', () => {
  assert.throws(
    () => normalizeManifest({ ...manifest, sounds: [manifest.sounds[0], { ...manifest.sounds[0], file: 'assets/audio/other.mp3' }] }),
    /unique/i,
  );

  assert.throws(
    () => normalizeManifest({ ...manifest, sounds: [{ ...manifest.sounds[0], file: '../private.mp3' }] }),
    /assets\/audio/i,
  );
});

test('filterSounds combines category, free-text search, and favourites-only selection', () => {
  const sounds = normalizeManifest(manifest).sounds;

  assert.deepEqual(
    filterSounds(sounds, { category: 'Ansagen', query: 'halt', favouritesOnly: false, favouriteIds: new Set() }).map(({ id }) => id),
    ['next-stop'],
  );

  assert.deepEqual(
    filterSounds(sounds, { category: 'Alle', query: '', favouritesOnly: true, favouriteIds: new Set(['gong']) }).map(({ id }) => id),
    ['gong'],
  );
});

test('manifestPathFor only permits the defined private RE3 sound set', () => {
  assert.equal(manifestPathFor('re3'), 'data/sounds.re3.private.json');
  assert.equal(manifestPathFor('unknown'), 'data/sounds.json');
  assert.equal(manifestPathFor(null), 'data/sounds.json');
});

test('storedNumber falls back for an absent or invalid saved value and preserves zero', () => {
  assert.equal(storedNumber(null, 80), 80);
  assert.equal(storedNumber('unusable', 80), 80);
  assert.equal(storedNumber('0', 80), 0);
  assert.equal(storedNumber('67', 80), 67);
});

test('queueFromIds keeps the requested order and ignores stale IDs', () => {
  const sounds = normalizeManifest(manifest).sounds;

  assert.deepEqual(
    queueFromIds(['next-stop', 'deleted', 'gong'], sounds).map(({ id }) => id),
    ['next-stop', 'gong'],
  );
});
