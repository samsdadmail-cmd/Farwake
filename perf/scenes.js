// Deterministic benchmark scenes for the FARWAKE performance harness.
// Drives the loaded game only through window.FARWAKE_TEST, FieldPreferences,
// and the #pause button. It does not patch game source.
(function () {
  'use strict';

  const SAVE_KEY = 'farwake_founders_alpha03_v1';
  const MAP = 56;
  const STRUCTURES = [
    { type: 'shelter', w: 3, h: 2 },
    { type: 'garden', w: 3, h: 2 },
    { type: 'solar', w: 2, h: 2 },
    { type: 'workshop', w: 3, h: 2 },
    { type: 'shed', w: 3, h: 2 },
    { type: 'clinic', w: 3, h: 2 },
    { type: 'cabin', w: 3, h: 2 },
    { type: 'dormitory', w: 4, h: 3 },
    { type: 'greenhouse', w: 3, h: 2 },
    { type: 'kitchen', w: 3, h: 2 },
    { type: 'smelter', w: 3, h: 2 },
    { type: 'warehouse', w: 4, h: 3 },
    { type: 'lamppost', w: 1, h: 1 },
    { type: 'wind', w: 2, h: 2 }
  ];
  const TARGET_PATHS = 72;
  const TARGET_CLONES = 20;
  // Fixed quota, large footprints first, so 1×1 lampposts cannot fill the map
  // before a dormitory or warehouse is placed. 49 structures + 72 paths + the
  // 3 starter buildings = 124, with 20 cloned colonists (25 total).
  const LATE_PLAN = [
    'dormitory', 'dormitory', 'warehouse', 'warehouse',
    'shelter', 'shelter', 'shelter', 'shelter', 'shelter',
    'cabin', 'cabin', 'cabin',
    'garden', 'garden', 'garden', 'garden', 'garden', 'garden', 'garden',
    'greenhouse', 'greenhouse',
    'workshop', 'workshop',
    'smelter', 'smelter',
    'kitchen', 'kitchen',
    'shed', 'shed',
    'clinic', 'clinic',
    'solar', 'solar', 'solar', 'solar', 'solar', 'solar',
    'wind', 'wind', 'wind', 'wind',
    'lamppost', 'lamppost', 'lamppost', 'lamppost',
    'lamppost', 'lamppost', 'lamppost', 'lamppost'
  ];

  const SCENES = {
    day2: scene({
      id: 'day2',
      label: 'Day 2 early game',
      suite: 'default',
      layout: 'day2',
      paused: false,
      zoom: 1,
      preset: 'balanced',
      description: 'Fresh seed FW-10402 with the expedition clock set to Day 2 07:20. Three starter buildings, five colonists, simulation running, zoom 1, balanced preset. The clock is set directly; day 1 is not simulated, because tick() consults performance.now() and would not be reproducible.'
    }),
    late: scene({
      id: 'late',
      label: 'Late colony (synthetic)',
      suite: 'default',
      layout: 'late',
      paused: false,
      zoom: 0.6,
      preset: 'balanced',
      day: 80,
      minute: 10 * 60,
      weather: 'clear',
      seconds: 15,
      description: 'Synthetic late colony on seed FW-10402: finished buildings of 14 types (including dormitory, warehouse, lamppost and garden), path and road tiles, history counters, and cloned colonists. Day 80 10:00, clear weather, simulation running, zoom 0.6, balanced preset. Default window is 15 s. This is a stress layout, not a played save.'
    }),
    idle: scene({
      id: 'idle',
      label: 'Idle paused',
      suite: 'default',
      layout: 'day2',
      paused: true,
      zoom: 1,
      preset: 'balanced',
      description: 'The Day 2 early-game layout with the simulation paused via #pause. advanceWorld and draw still run; tick() returns immediately. Zoom 1, balanced preset.'
    }),
    'fresh-z06': scene({
      id: 'fresh-z06',
      label: 'Fresh z=0.6 render-only',
      suite: 'audit',
      layout: 'fresh',
      paused: true,
      zoom: 0.6,
      preset: 'balanced',
      description: 'Audit scene B. Fresh seed, day 1, zoom 0.6, simulation paused.'
    }),
    'fresh-z1': scene({
      id: 'fresh-z1',
      label: 'Fresh z=1 render-only',
      suite: 'audit',
      layout: 'fresh',
      paused: true,
      zoom: 1,
      preset: 'balanced',
      description: 'Audit scene A, render-only. Fresh seed, day 1, zoom 1, simulation paused.'
    }),
    'fresh-z235': scene({
      id: 'fresh-z235',
      label: 'Fresh z=2.35 render-only',
      suite: 'audit',
      layout: 'fresh',
      paused: true,
      zoom: 2.35,
      preset: 'balanced',
      description: 'Audit scene C. Fresh seed, day 1, zoom 2.35, simulation paused.'
    }),
    'fresh-z1-sim': scene({
      id: 'fresh-z1-sim',
      label: 'Fresh z=1 simulation',
      suite: 'audit',
      layout: 'fresh',
      paused: false,
      zoom: 1,
      preset: 'balanced',
      description: 'Audit scene A with the simulation running. Fresh seed, day 1, zoom 1.'
    }),
    'grown-day': scene({
      id: 'grown-day',
      label: 'Grown synthetic z=0.6 day, render-only',
      suite: 'audit',
      layout: 'late',
      paused: true,
      zoom: 0.6,
      preset: 'balanced',
      day: 80,
      minute: 10 * 60,
      weather: 'clear',
      description: 'Audit scene E. Synthetic grown colony, zoom 0.6, day, simulation paused.'
    }),
    'grown-night': scene({
      id: 'grown-night',
      label: 'Grown synthetic z=0.6 night and rain, render-only',
      suite: 'audit',
      layout: 'late',
      paused: true,
      zoom: 0.6,
      preset: 'balanced',
      day: 80,
      minute: 22 * 60,
      weather: 'rain',
      description: 'Audit scene F. Synthetic grown colony, zoom 0.6, night and rain, simulation paused.'
    }),
    'grown-performance': scene({
      id: 'grown-performance',
      label: 'Grown synthetic night and rain, Performance preset',
      suite: 'audit',
      layout: 'late',
      paused: true,
      zoom: 0.6,
      preset: 'performance',
      day: 80,
      minute: 22 * 60,
      weather: 'rain',
      description: 'Audit scene G. Synthetic grown colony at night in rain, zoom 0.6, Performance preset, simulation paused.'
    }),
    'grown-sim': scene({
      id: 'grown-sim',
      label: 'Grown synthetic z=0.6 day, simulation',
      suite: 'audit',
      layout: 'late',
      paused: false,
      zoom: 0.6,
      preset: 'balanced',
      day: 80,
      minute: 10 * 60,
      weather: 'clear',
      seconds: 15,
      description: 'Audit scene E with the simulation running. Same synthetic colony as the late-colony benchmark. Default window is 15 s.'
    }),
    'grown-sim-z1': scene({
      id: 'grown-sim-z1',
      label: 'Grown synthetic z=1, simulation',
      suite: 'audit',
      layout: 'late',
      paused: false,
      zoom: 1,
      preset: 'balanced',
      day: 80,
      minute: 10 * 60,
      weather: 'clear',
      seconds: 15,
      description: 'Audit scene D. Synthetic grown colony, zoom 1, simulation running. Default window is 15 s.'
    }),
    fixture: scene({
      id: 'fixture',
      label: 'Saved expedition fixture',
      suite: 'manual',
      layout: 'fixture',
      paused: false,
      zoom: 1,
      preset: 'balanced',
      description: 'Loads a real save JSON from perf/fixtures/ through the game load() path (the same validator import uses). Pass fixture=<file>. Paused and zoom can be overridden on the URL.'
    })
  };

  function scene(spec) {
    if (!Number.isFinite(spec.seconds)) spec.seconds = 5;
    spec.warmupMs = 1500;
    return spec;
  }

  function clamp(value, lo, hi) {
    return Math.max(lo, Math.min(hi, value));
  }

  function requireApi(win) {
    const game = win.FARWAKE_TEST;
    if (!game) throw new Error('FARWAKE_TEST is missing. The built game did not expose the test API.');
    const need = ['state', 'camera', 'terrain', 'features', 'clearFootprint', 'setZoom', 'centerCamera', 'save', 'load', 'renderUI', 'draw'];
    const missing = need.filter(function (name) {
      if (name === 'state' || name === 'camera' || name === 'terrain' || name === 'features') return game[name] == null;
      return typeof game[name] !== 'function';
    });
    if (missing.length) throw new Error('FARWAKE_TEST is missing: ' + missing.join(', '));
    if (!win.document.getElementById('pause')) throw new Error('#pause is missing');
    if (!win.document.getElementById('world')) throw new Error('#world is missing');
    if (!win.FieldPreferences || typeof win.FieldPreferences.change !== 'function') {
      throw new Error('FieldPreferences.change is missing');
    }
    if (win.document.getElementById('recover-save')) {
      throw new Error('The game rejected the save and is showing recovery. The fixture was not loaded.');
    }
    if (!game.state) throw new Error('The game has no expedition state.');
    return game;
  }

  function pinColonist(person, x, y) {
    person.x = x;
    person.y = y;
    person.energy = 88;
    person.hunger = 16;
    person.mood = 82;
    person.social = 75;
    person.task = null;
    person.path = [];
    person.action = 0;
    person.carry = null;
  }

  function standingFree(game, x, y) {
    if (x < 1 || y < 1 || x >= MAP - 1 || y >= MAP - 1) return false;
    const tile = game.terrain[y * MAP + x];
    if (!tile || tile.kind === 'water' || tile.kind === 'stone') return false;
    return !game.state.buildings.some(function (building) {
      return x >= building.x && x < building.x + building.w && y >= building.y && y < building.y + building.h;
    });
  }

  function freeTiles(game) {
    const tiles = [];
    for (let y = 8; y <= 48; y++) {
      for (let x = 8; x <= 48; x++) {
        if (standingFree(game, x, y)) tiles.push([x + 0.5, y + 0.5]);
      }
    }
    tiles.sort(function (a, b) {
      const da = (a[0] - 28.5) * (a[0] - 28.5) + (a[1] - 28.5) * (a[1] - 28.5);
      const db = (b[0] - 28.5) * (b[0] - 28.5) + (b[1] - 28.5) * (b[1] - 28.5);
      return da - db || a[1] - b[1] || a[0] - b[0];
    });
    return tiles;
  }

  function setupFresh(game, spec) {
    const state = game.state;
    if (state.seed !== 'FW-10402') {
      throw new Error('Expected a fresh FW-10402 expedition, found seed ' + state.seed);
    }
    if (spec.layout === 'day2') {
      state.day = 2;
      state.minute = 7 * 60 + 20;
    }
    state.weather = 'clear';
    const tiles = freeTiles(game);
    if (tiles.length < state.colonists.length) throw new Error('Not enough open tiles to place the starting crew.');
    state.colonists.forEach(function (person, index) {
      pinColonist(person, tiles[index][0], tiles[index][1]);
    });
  }

  function makeBuilding(id, type, x, y, w, h) {
    return {
      id: id,
      type: type,
      x: x,
      y: y,
      w: w,
      h: h,
      progress: 100,
      finished: true,
      level: 2,
      powered: true,
      history: { residentHours: 36, work: 180, harvests: 4, traffic: 48, ageDays: 28 }
    };
  }

  function buildingSize(type) {
    for (let i = 0; i < STRUCTURES.length; i++) if (STRUCTURES[i].type === type) return STRUCTURES[i];
    return null;
  }

  function blockedTiles(game) {
    const blocked = new Set();
    for (let i = 0; i < MAP * MAP; i++) {
      const tile = game.terrain[i];
      if (!tile || tile.kind === 'water' || tile.kind === 'stone') blocked.add(i);
    }
    const features = game.features;
    for (let i = 0; i < features.length; i++) blocked.add(features[i].y * MAP + features[i].x);
    game.state.buildings.forEach(function (building) {
      for (let y = building.y; y < building.y + building.h; y++) {
        for (let x = building.x; x < building.x + building.w; x++) blocked.add(y * MAP + x);
      }
    });
    return blocked;
  }

  function footprintFree(blocked, x, y, w, h) {
    if (x < 0 || y < 0 || x + w > MAP || y + h > MAP) return false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) if (blocked.has((y + dy) * MAP + (x + dx))) return false;
    }
    return true;
  }

  function cellsByDistance() {
    const cells = [];
    for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) cells.push([x, y]);
    cells.sort(function (a, b) {
      const da = (a[0] - 28) * (a[0] - 28) + (a[1] - 28) * (a[1] - 28);
      const db = (b[0] - 28) * (b[0] - 28) + (b[1] - 28) * (b[1] - 28);
      return da - db || a[1] - b[1] || a[0] - b[0];
    });
    return cells;
  }

  function setupLate(win, game, spec) {
    const state = game.state;
    if (state.seed !== 'FW-10402') {
      throw new Error('Expected a fresh FW-10402 expedition to decorate, found seed ' + state.seed);
    }
    const blocked = blockedTiles(game);
    const cells = cellsByDistance();
    let added = 0;
    LATE_PLAN.forEach(function (type) {
      const size = buildingSize(type);
      let placed = false;
      for (let i = 0; i < cells.length; i++) {
        const x = cells[i][0];
        const y = cells[i][1];
        if (!footprintFree(blocked, x, y, size.w, size.h)) continue;
        if (!game.clearFootprint(x, y, size.w, size.h)) continue;
        state.buildings.push(makeBuilding(100 + added, type, x, y, size.w, size.h));
        for (let dy = 0; dy < size.h; dy++) {
          for (let dx = 0; dx < size.w; dx++) blocked.add((y + dy) * MAP + (x + dx));
        }
        added += 1;
        placed = true;
        break;
      }
      if (!placed) throw new Error('No clear footprint for synthetic ' + type + ' (' + added + ' placed).');
    });
    let paths = 0;
    let useRoad = false;
    for (let i = 0; i < cells.length && paths < TARGET_PATHS; i++) {
      const x = cells[i][0];
      const y = cells[i][1];
      if (!footprintFree(blocked, x, y, 1, 1)) continue;
      if (!game.clearFootprint(x, y, 1, 1)) continue;
      const pathType = useRoad ? 'road' : 'path';
      useRoad = !useRoad;
      state.buildings.push(makeBuilding(500 + paths, pathType, x, y, 1, 1));
      blocked.add(y * MAP + x);
      paths += 1;
    }
    state.buildings.forEach(function (building) {
      if (!building.history) {
        building.history = { residentHours: 48, work: 120, harvests: 0, traffic: 30, ageDays: 40 };
      }
      if (building.type === 'lamppost') building.powered = true;
    });
    const tiles = freeTiles(game);
    const needed = state.colonists.length + TARGET_CLONES;
    if (tiles.length < needed) {
      throw new Error('Not enough open tiles for ' + needed + ' colonists (found ' + tiles.length + ').');
    }
    state.colonists.forEach(function (person, index) {
      pinColonist(person, tiles[index][0], tiles[index][1]);
    });
    const template = state.colonists[0];
    for (let i = 0; i < TARGET_CLONES; i++) {
      const spot = tiles[state.colonists.length];
      const source = state.colonists[i % state.colonists.length] || template;
      state.colonists.push({
        id: 200 + i,
        name: source.name.split(' ')[0] + ' ' + (200 + i),
        role: source.role,
        trait: source.trait,
        ambition: source.ambition,
        coat: source.coat,
        hue: source.hue,
        hair: source.hair,
        x: spot[0],
        y: spot[1],
        energy: 84,
        hunger: 18,
        mood: 80,
        social: 72,
        skill: 2,
        work: 'auto',
        task: null,
        path: [],
        next: 0,
        action: 0,
        level: 0,
        home: null,
        carry: null
      });
    }
    state.day = spec.day;
    state.minute = spec.minute;
    state.weather = spec.weather;
    if (added !== LATE_PLAN.length || paths < TARGET_PATHS) {
      throw new Error('Synthetic colony is short: ' + added + ' structures and ' + paths + ' paths.');
    }
    revealLanding(win, game);
  }

  function revealLanding(win, game) {
    game.save();
    const raw = win.localStorage.getItem(SAVE_KEY);
    if (!raw) throw new Error('FARWAKE_TEST.save did not write a harness save.');
    const data = JSON.parse(raw);
    if (!Array.isArray(data.fog) || data.fog.length !== MAP * MAP) {
      throw new Error('Saved fog is not a 56×56 map.');
    }
    const cx = 28;
    const cy = 28;
    const radius = 18;
    for (let y = 0; y < MAP; y++) {
      for (let x = 0; x < MAP; x++) {
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= radius * radius) data.fog[y * MAP + x] = 1;
      }
    }
    win.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    if (!game.load()) throw new Error('FARWAKE_TEST.load rejected the synthetic colony.');
  }

  function nextFrame(win) {
    return new Promise(function (resolve) { win.requestAnimationFrame(function () { resolve(); }); });
  }

  async function ensureCanvas(win) {
    const canvas = win.document.getElementById('world');
    for (let i = 0; i < 40; i++) {
      win.dispatchEvent(new win.Event('resize'));
      await nextFrame(win);
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10 && canvas.width > 0 && canvas.height > 0) return;
    }
    throw new Error('The world canvas did not lay out.');
  }

  function setPaused(win, want) {
    const button = win.document.getElementById('pause');
    const paused = function () {
      return button.classList.contains('on') || button.getAttribute('aria-label') === 'Resume simulation';
    };
    if (paused() !== want) button.click();
    if (paused() !== want) throw new Error('Could not set simulation paused=' + want + ' via #pause.');
  }

  function resolve(id, params) {
    const base = SCENES[id];
    if (!base) return null;
    const spec = Object.assign({}, base);
    const zoom = params.get('zoom');
    if (zoom != null && zoom !== '' && Number.isFinite(+zoom)) spec.zoom = clamp(+zoom, 0.6, 2.35);
    const preset = params.get('preset');
    if (preset === 'performance' || preset === 'balanced' || preset === 'cinematic') spec.preset = preset;
    if (params.get('paused') === '1') spec.paused = true;
    if (params.get('paused') === '0') spec.paused = false;
    const seconds = params.get('seconds');
    if (seconds != null && seconds !== '' && Number.isFinite(+seconds)) spec.seconds = clamp(+seconds, 1, 60);
    const warmup = params.get('warmup');
    if (warmup != null && warmup !== '' && Number.isFinite(+warmup)) spec.warmupMs = clamp(+warmup, 0, 15000);
    spec.fixture = params.get('fixture') || '';
    return spec;
  }

  async function apply(win, spec) {
    const game = requireApi(win);
    if (spec.layout === 'fresh' || spec.layout === 'day2') setupFresh(game, spec);
    else if (spec.layout === 'late') setupLate(win, game, spec);
    else if (spec.layout === 'fixture') {
      if (game.state.seed == null) throw new Error('Fixture did not load an expedition.');
    } else {
      throw new Error('Unknown layout ' + spec.layout);
    }
    await ensureCanvas(win);
    win.FieldPreferences.change('preset', spec.preset);
    win.dispatchEvent(new win.Event('resize'));
    await ensureCanvas(win);
    const canvas = win.document.getElementById('world');
    const rect = canvas.getBoundingClientRect();
    game.centerCamera();
    game.setZoom(spec.zoom, rect.width / 2, rect.height / 2);
    setPaused(win, spec.paused);
    game.renderUI(true);
    await nextFrame(win);
    await nextFrame(win);
  }

  function meta(win, spec) {
    const game = win.FARWAKE_TEST;
    const state = game.state;
    const canvas = win.document.getElementById('world');
    const rect = canvas.getBoundingClientRect();
    const button = win.document.getElementById('pause');
    const counts = {};
    state.buildings.forEach(function (building) {
      counts[building.type] = (counts[building.type] || 0) + 1;
    });
    return {
      id: spec.id,
      label: spec.label,
      description: spec.description,
      synthetic: spec.layout === 'late',
      seed: state.seed,
      day: state.day,
      minute: Math.round(state.minute),
      weather: state.weather,
      buildings: state.buildings.length,
      buildingTypes: counts,
      colonists: state.colonists.length,
      paused: button.classList.contains('on'),
      zoom: game.camera.z,
      preset: win.FieldPreferences.values.preset,
      devicePixelRatio: win.devicePixelRatio,
      canvas: {
        cssWidth: rect.width,
        cssHeight: rect.height,
        backingWidth: canvas.width,
        backingHeight: canvas.height
      },
      userAgent: win.navigator.userAgent
    };
  }

  function suiteIds(name) {
    if (name === 'all') {
      return Object.keys(SCENES).filter(function (id) { return SCENES[id].suite !== 'manual'; });
    }
    return Object.keys(SCENES).filter(function (id) { return SCENES[id].suite === name; });
  }

  window.FarwakePerfScenes = {
    SAVE_KEY: SAVE_KEY,
    scenes: SCENES,
    resolve: resolve,
    apply: apply,
    meta: meta,
    suiteIds: suiteIds
  };
})();
