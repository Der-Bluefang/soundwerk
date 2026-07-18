import { filterSounds, manifestPathFor, normalizeManifest, queueFromIds, storedNumber } from './core.js';

const STORAGE_KEYS = {
  favourites: 'soundwerk:favourites',
  volume: 'soundwerk:volume',
};

const elements = {
  categoryFilter: document.querySelector('#category-filter'),
  clearComposer: document.querySelector('#clear-composer'),
  composerList: document.querySelector('#composer-list'),
  favouritesToggle: document.querySelector('#favourites-toggle'),
  liveRegion: document.querySelector('#live-region'),
  nowPlaying: document.querySelector('#now-playing-value'),
  playbackStatus: document.querySelector('#playback-status'),
  playComposer: document.querySelector('#play-composer'),
  soundCount: document.querySelector('#sound-count'),
  soundGrid: document.querySelector('#sound-grid'),
  soundSearch: document.querySelector('#sound-search'),
  stopAll: document.querySelector('#stop-all'),
  volume: document.querySelector('#volume'),
  volumeValue: document.querySelector('#volume-value'),
};

const state = {
  audio: new Audio(),
  category: 'Alle',
  currentSoundId: null,
  favourites: readSet(STORAGE_KEYS.favourites),
  favouritesOnly: false,
  manifest: null,
  queue: [],
  query: '',
  sequence: null,
  sounds: [],
  volume: readNumber(STORAGE_KEYS.volume, 80),
};

function readSet(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

function readNumber(key, fallback) {
  try {
    return storedNumber(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function saveFavourites() {
  try {
    localStorage.setItem(STORAGE_KEYS.favourites, JSON.stringify([...state.favourites]));
  } catch {
    setStatus('Favoriten konnten auf diesem Gerät nicht gespeichert werden.', 'error');
  }
}

function saveVolume() {
  try {
    localStorage.setItem(STORAGE_KEYS.volume, String(state.volume));
  } catch {
    // Playback still works when storage is disabled.
  }
}

function makeButton({ action, id = '', label, className, title = '', pressed }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.dataset.action = action;
  if (id) button.dataset.id = id;
  if (title) button.title = title;
  button.textContent = label;
  if (typeof pressed === 'boolean') button.setAttribute('aria-pressed', String(pressed));
  return button;
}

function setStatus(message = '', kind = '') {
  elements.playbackStatus.textContent = message;
  elements.playbackStatus.dataset.kind = kind;
  elements.liveRegion.textContent = message;
}

function setNowPlaying(value = 'Bereit') {
  elements.nowPlaying.textContent = value;
}

function displayedSounds() {
  return filterSounds(state.sounds, {
    category: state.category,
    query: state.query,
    favouritesOnly: state.favouritesOnly,
    favouriteIds: state.favourites,
  });
}

function renderCategories() {
  const categories = ['Alle', ...new Set(state.sounds.map(({ category }) => category))];
  if (!categories.includes(state.category)) state.category = 'Alle';

  elements.categoryFilter.replaceChildren(...categories.map((category) => {
    const count = category === 'Alle' ? state.sounds.length : state.sounds.filter((sound) => sound.category === category).length;
    const button = makeButton({
      action: 'category',
      label: category,
      className: 'filter-button',
      pressed: state.category === category,
    });
    button.dataset.category = category;

    const countLabel = document.createElement('span');
    countLabel.className = 'filter-button__count';
    countLabel.textContent = String(count);
    button.append(countLabel);
    return button;
  }));
}

function renderSounds() {
  const sounds = displayedSounds();
  const plural = sounds.length === 1 ? 'Sound' : 'Sounds';
  elements.soundCount.textContent = `${sounds.length} ${plural}`;
  elements.soundGrid.setAttribute('aria-busy', 'false');

  if (sounds.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Keine passenden Sounds gefunden.';
    elements.soundGrid.replaceChildren(empty);
    return;
  }

  const cards = sounds.map((sound) => {
    const card = document.createElement('article');
    card.className = 'sound-card';

    const top = document.createElement('div');
    top.className = 'sound-card__top';
    const category = document.createElement('span');
    category.className = 'sound-card__category';
    category.textContent = sound.category;
    top.append(category);
    top.append(makeButton({
      action: 'favourite',
      id: sound.id,
      label: '★',
      className: 'favourite-button',
      title: `${state.favourites.has(sound.id) ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}: ${sound.title}`,
      pressed: state.favourites.has(sound.id),
    }));

    const content = document.createElement('div');
    const title = document.createElement('h3');
    title.className = 'sound-card__title';
    title.textContent = sound.title;
    const description = document.createElement('p');
    description.className = 'sound-card__description';
    description.textContent = sound.description;
    content.append(title, description);

    const actions = document.createElement('div');
    actions.className = 'sound-card__actions';
    const play = makeButton({ action: 'play', id: sound.id, label: '▶ Abspielen', className: 'play-button' });
    if (sound.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'shortcut';
      shortcut.textContent = sound.shortcut;
      play.append(shortcut);
    }
    actions.append(play, makeButton({ action: 'add', id: sound.id, label: '+', className: 'add-button', title: `${sound.title} zum Composer hinzufügen` }));

    card.append(top, content, actions);
    return card;
  });

  elements.soundGrid.replaceChildren(...cards);
}

function renderComposer() {
  const queue = queueFromIds(state.queue, state.sounds);
  if (queue.length !== state.queue.length) state.queue = queue.map(({ id }) => id);

  elements.clearComposer.disabled = state.queue.length === 0;
  elements.playComposer.disabled = state.queue.length === 0;

  if (queue.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'composer-empty';
    empty.textContent = 'Noch keine Bausteine. Nutze + bei einem Sound.';
    elements.composerList.replaceChildren(empty);
    return;
  }

  elements.composerList.replaceChildren(...queue.map((sound, index) => {
    const item = document.createElement('li');
    item.className = 'queue-item';

    const number = document.createElement('span');
    number.className = 'queue-item__number';
    number.textContent = String(index + 1);
    const title = document.createElement('span');
    title.className = 'queue-item__title';
    title.textContent = sound.title;
    const controls = document.createElement('div');
    controls.className = 'queue-item__controls';
    controls.append(
      makeButton({ action: 'up', id: String(index), label: '↑', className: 'queue-control', title: `${sound.title} nach oben` }),
      makeButton({ action: 'down', id: String(index), label: '↓', className: 'queue-control', title: `${sound.title} nach unten` }),
      makeButton({ action: 'remove', id: String(index), label: '×', className: 'queue-control', title: `${sound.title} entfernen` }),
    );
    controls.querySelector('[data-action="up"]').disabled = index === 0;
    controls.querySelector('[data-action="down"]').disabled = index === queue.length - 1;
    item.append(number, title, controls);
    return item;
  }));
}

function renderAll() {
  renderCategories();
  renderSounds();
  renderComposer();
}

function soundById(id) {
  return state.sounds.find((sound) => sound.id === id);
}

function audioUrl(sound) {
  return new URL(sound.file, document.baseURI).href;
}

async function playSource(sound, contextLabel) {
  state.audio.pause();
  state.audio.currentTime = 0;
  state.audio.src = audioUrl(sound);
  state.audio.volume = state.volume / 100;
  state.currentSoundId = sound.id;
  setNowPlaying(sound.title);
  setStatus(contextLabel, 'success');

  try {
    await state.audio.play();
  } catch (error) {
    state.sequence = null;
    state.currentSoundId = null;
    setNowPlaying('Bereit');
    setStatus(`„${sound.title}“ konnte nicht abgespielt werden. Prüfe die Audiodatei.`, 'error');
  }
}

function playSingle(id) {
  const sound = soundById(id);
  if (!sound) return;
  state.sequence = null;
  void playSource(sound, `Spielt: ${sound.title}`);
}

function playComposer() {
  if (state.queue.length === 0) return;
  state.sequence = { index: 0 };
  playNextInSequence();
}

function playNextInSequence() {
  if (!state.sequence) return;
  const queue = queueFromIds(state.queue, state.sounds);
  const sound = queue[state.sequence.index];

  if (!sound) {
    state.sequence = null;
    state.currentSoundId = null;
    setNowPlaying('Bereit');
    setStatus('Ablauf abgeschlossen.', 'success');
    return;
  }

  void playSource(sound, `Ablauf · ${state.sequence.index + 1} von ${queue.length}`);
}

function stopAll({ announce = true } = {}) {
  state.sequence = null;
  state.currentSoundId = null;
  state.audio.pause();
  state.audio.currentTime = 0;
  setNowPlaying('Bereit');
  if (announce) setStatus('Wiedergabe gestoppt.');
}

function toggleFavourite(id) {
  if (state.favourites.has(id)) state.favourites.delete(id);
  else state.favourites.add(id);
  saveFavourites();
  renderSounds();
}

function moveQueueItem(index, delta) {
  const targetIndex = index + delta;
  if (targetIndex < 0 || targetIndex >= state.queue.length) return;
  [state.queue[index], state.queue[targetIndex]] = [state.queue[targetIndex], state.queue[index]];
  renderComposer();
}

function wireEvents() {
  elements.soundSearch.addEventListener('input', () => {
    state.query = elements.soundSearch.value;
    renderSounds();
  });

  elements.categoryFilter.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="category"]');
    if (!button) return;
    state.category = button.dataset.category || 'Alle';
    renderCategories();
    renderSounds();
  });

  elements.favouritesToggle.addEventListener('click', () => {
    state.favouritesOnly = !state.favouritesOnly;
    elements.favouritesToggle.setAttribute('aria-pressed', String(state.favouritesOnly));
    renderSounds();
  });

  elements.soundGrid.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === 'play') playSingle(id);
    if (action === 'add') {
      state.queue.push(id);
      renderComposer();
      const sound = soundById(id);
      setStatus(`${sound?.title || 'Sound'} zum Ablauf hinzugefügt.`, 'success');
    }
    if (action === 'favourite') toggleFavourite(id);
  });

  elements.composerList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const index = Number(button.dataset.id);
    if (!Number.isInteger(index)) return;
    if (button.dataset.action === 'up') moveQueueItem(index, -1);
    if (button.dataset.action === 'down') moveQueueItem(index, 1);
    if (button.dataset.action === 'remove') {
      state.queue.splice(index, 1);
      renderComposer();
    }
  });

  elements.clearComposer.addEventListener('click', () => {
    state.queue = [];
    renderComposer();
    setStatus('Composer geleert.');
  });
  elements.playComposer.addEventListener('click', playComposer);
  elements.stopAll.addEventListener('click', () => stopAll());

  elements.volume.value = String(state.volume);
  elements.volumeValue.value = `${state.volume} %`;
  elements.volume.addEventListener('input', () => {
    state.volume = Number(elements.volume.value);
    state.audio.volume = state.volume / 100;
    elements.volumeValue.value = `${state.volume} %`;
    saveVolume();
  });

  state.audio.addEventListener('ended', () => {
    if (!state.sequence) {
      state.currentSoundId = null;
      setNowPlaying('Bereit');
      setStatus('Wiedergabe beendet.');
      return;
    }
    state.sequence.index += 1;
    playNextInSequence();
  });

  state.audio.addEventListener('error', () => {
    if (state.audio.error) {
      stopAll({ announce: false });
      setStatus('Die Audiodatei konnte nicht geladen werden.', 'error');
    }
  });

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    if (event.key === 'Escape') {
      stopAll();
      return;
    }
    const sound = state.sounds.find(({ shortcut }) => shortcut === event.key);
    if (sound) {
      event.preventDefault();
      playSingle(sound.id);
    }
  });
}

async function initialize() {
  wireEvents();
  try {
    const soundset = new URLSearchParams(window.location.search).get('soundset');
    const response = await fetch(new URL(manifestPathFor(soundset), document.baseURI));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.manifest = normalizeManifest(await response.json());
    state.sounds = state.manifest.sounds;
    document.title = state.manifest.title;
    renderAll();
    setStatus('Soundboard bereit.', 'success');
  } catch (error) {
    elements.soundGrid.setAttribute('aria-busy', 'false');
    const failure = document.createElement('p');
    failure.className = 'empty-state';
    failure.textContent = 'Die Soundliste konnte nicht geladen werden. Prüfe data/sounds.json.';
    elements.soundGrid.replaceChildren(failure);
    setStatus('Konfiguration konnte nicht geladen werden.', 'error');
  }

  if ('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register(new URL('../../sw.js', import.meta.url), { scope: new URL('../../', import.meta.url).pathname }).catch(() => {
      // Offline mode is a progressive enhancement; normal playback remains available.
    });
  }
}

void initialize();
