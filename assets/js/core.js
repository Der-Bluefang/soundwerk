const AUDIO_PATH_PREFIX = 'assets/audio/';

export function manifestPathFor() {
  return 'data/sounds.json';
}

export function storedNumber(rawValue, fallback) {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') return fallback;
  const value = Number(rawValue);
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : fallback;
}

function ensureString(value, field, soundId) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Sound ${soundId}: ${field} must be a non-empty string.`);
  }

  return value.trim();
}

function normalizeSound(rawSound) {
  if (!rawSound || typeof rawSound !== 'object' || Array.isArray(rawSound)) {
    throw new Error('Each sound must be an object.');
  }

  const id = ensureString(rawSound.id, 'id', '(unknown)');
  const title = ensureString(rawSound.title, 'title', id);
  const category = ensureString(rawSound.category, 'category', id);
  const file = ensureString(rawSound.file, 'file', id);

  if (!file.startsWith(AUDIO_PATH_PREFIX) || file.includes('..')) {
    throw new Error(`Sound ${id}: file must stay inside ${AUDIO_PATH_PREFIX}.`);
  }

  return {
    id,
    title,
    category,
    file,
    description: typeof rawSound.description === 'string' ? rawSound.description.trim() : '',
    shortcut: typeof rawSound.shortcut === 'string' ? rawSound.shortcut.trim() : '',
  };
}

export function normalizeManifest(rawManifest) {
  if (!rawManifest || typeof rawManifest !== 'object' || Array.isArray(rawManifest)) {
    throw new Error('Manifest must be an object.');
  }

  const title = ensureString(rawManifest.title, 'title', 'manifest');
  if (!Array.isArray(rawManifest.sounds) || rawManifest.sounds.length === 0) {
    throw new Error('Manifest must contain at least one sound.');
  }

  const ids = new Set();
  const files = new Set();
  const sounds = rawManifest.sounds.map((sound) => {
    const normalized = normalizeSound(sound);

    if (ids.has(normalized.id)) {
      throw new Error(`Sound IDs must be unique: ${normalized.id}.`);
    }
    if (files.has(normalized.file)) {
      throw new Error(`Sound files must be unique: ${normalized.file}.`);
    }

    ids.add(normalized.id);
    files.add(normalized.file);
    return normalized;
  });

  return {
    version: Number.isInteger(rawManifest.version) ? rawManifest.version : 1,
    title,
    sounds,
  };
}

export function filterSounds(sounds, { category = 'Alle', query = '', favouritesOnly = false, favouriteIds = new Set() } = {}) {
  const normalizedQuery = query.trim().toLocaleLowerCase('de-DE');

  return sounds.filter((sound) => {
    const matchesCategory = category === 'Alle' || sound.category === category;
    const searchTarget = `${sound.title} ${sound.category} ${sound.description}`.toLocaleLowerCase('de-DE');
    const matchesQuery = normalizedQuery === '' || searchTarget.includes(normalizedQuery);
    const matchesFavourite = !favouritesOnly || favouriteIds.has(sound.id);

    return matchesCategory && matchesQuery && matchesFavourite;
  });
}

export function queueFromIds(ids, sounds) {
  const soundById = new Map(sounds.map((sound) => [sound.id, sound]));
  return ids.map((id) => soundById.get(id)).filter(Boolean);
}
