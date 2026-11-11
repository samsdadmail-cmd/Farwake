// FARWAKE performance recorder.
// Loaded only by perf/harness.html, and only when ?perf=1, injected ahead of the
// built game's scripts. It never ships inside the game and never edits game files.
// Frame time here is JavaScript inside the requestAnimationFrame callback.
// It does not include GPU raster, compositing, or CSS effects such as backdrop-filter.
(function () {
  'use strict';

  const opts = window.FARWAKE_PERF_OPTS || {};
  const LONG_16 = 1000 / 60;
  const LONG_33 = 2000 / 60;
  const nativeRAF = window.requestAnimationFrame.bind(window);
  const ops = {
    enabled: false,
    fillRect: 0,
    drawImage: 0,
    fillStyle: 0,
    save: 0,
    restore: 0,
    fillText: 0,
    measureText: 0,
    stroke: 0,
    strokeRect: 0,
    createLinearGradient: 0,
    createRadialGradient: 0
  };
  let recording = false;
  const samples = [];
  const intervals = [];
  let lastStart = null;
  let errors = 0;

  function bump(name) {
    ops[name] += 1;
  }

  function installOps() {
    const proto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
    if (!proto) {
      ops.error = 'CanvasRenderingContext2D is missing';
      return;
    }
    const methods = [
      'fillRect', 'drawImage', 'save', 'restore', 'fillText', 'measureText',
      'stroke', 'strokeRect', 'createLinearGradient', 'createRadialGradient'
    ];
    for (const name of methods) {
      const original = proto[name];
      if (typeof original !== 'function') continue;
      proto[name] = function () {
        if (recording) bump(name);
        return original.apply(this, arguments);
      };
    }
    const desc = Object.getOwnPropertyDescriptor(proto, 'fillStyle');
    if (desc && typeof desc.set === 'function') {
      Object.defineProperty(proto, 'fillStyle', {
        configurable: true,
        enumerable: desc.enumerable,
        get: desc.get ? function () { return desc.get.call(this); } : undefined,
        set: function (value) {
          if (recording) bump('fillStyle');
          return desc.set.call(this, value);
        }
      });
    }
    ops.enabled = true;
  }

  if (opts.ops) {
    try { installOps(); }
    catch (error) { ops.error = String(error && error.message || error); }
  }

  window.requestAnimationFrame = function (callback) {
    return nativeRAF(function (timestamp) {
      const start = performance.now();
      let thrown = null;
      try {
        callback(timestamp);
      } catch (error) {
        thrown = error;
        errors += 1;
      }
      const duration = performance.now() - start;
      if (recording) {
        samples.push(duration);
        if (lastStart != null) intervals.push(start - lastStart);
        lastStart = start;
      }
      if (thrown) throw thrown;
    });
  };

  function quantile(sorted, p) {
    if (!sorted.length) return null;
    if (sorted.length === 1) return sorted[0];
    const index = (sorted.length - 1) * p;
    const lo = Math.floor(index);
    const hi = Math.ceil(index);
    if (lo === hi) return sorted[lo];
    return sorted[lo] * (hi - index) + sorted[hi] * (index - lo);
  }

  function summarise(values) {
    if (!values.length) {
      return { count: 0, min: null, mean: null, median: null, p95: null, p99: null, max: null };
    }
    const sorted = values.slice().sort(function (a, b) { return a - b; });
    let sum = 0;
    for (let i = 0; i < sorted.length; i++) sum += sorted[i];
    return {
      count: sorted.length,
      min: sorted[0],
      mean: sum / sorted.length,
      median: quantile(sorted, 0.5),
      p95: quantile(sorted, 0.95),
      p99: quantile(sorted, 0.99),
      max: sorted[sorted.length - 1]
    };
  }

  function longCount(threshold) {
    let n = 0;
    for (let i = 0; i < samples.length; i++) if (samples[i] > threshold) n += 1;
    return n;
  }

  function heap() {
    const memory = performance.memory;
    if (!memory) return { supported: false };
    return {
      supported: true,
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }

  function snapshot() {
    const frame = summarise(samples);
    const interval = summarise(intervals);
    const per = frame.count || 1;
    const opSnapshot = ops.enabled ? {
      enabled: true,
      fillRect: ops.fillRect,
      drawImage: ops.drawImage,
      fillStyle: ops.fillStyle,
      save: ops.save,
      restore: ops.restore,
      fillText: ops.fillText,
      measureText: ops.measureText,
      stroke: ops.stroke,
      strokeRect: ops.strokeRect,
      createLinearGradient: ops.createLinearGradient,
      createRadialGradient: ops.createRadialGradient,
      perFrame: {
        fillRect: ops.fillRect / per,
        drawImage: ops.drawImage / per,
        fillStyle: ops.fillStyle / per,
        save: ops.save / per,
        restore: ops.restore / per,
        createRadialGradient: ops.createRadialGradient / per
      }
    } : { enabled: false, error: ops.error || null };
    return {
      frame: frame,
      interval: interval,
      longFrames: { over16ms: longCount(LONG_16), over33ms: longCount(LONG_33) },
      thresholdsMs: { over16: LONG_16, over33: LONG_33 },
      callbackErrors: errors,
      heap: heap(),
      ops: opSnapshot,
      definition: 'frame is the JS duration of the requestAnimationFrame callback; interval is the time between callback starts'
    };
  }

  window.FARWAKE_PERF = {
    start: function () {
      samples.length = 0;
      intervals.length = 0;
      lastStart = null;
      errors = 0;
      ops.fillRect = ops.drawImage = ops.fillStyle = ops.save = ops.restore = 0;
      ops.fillText = ops.measureText = ops.stroke = ops.strokeRect = 0;
      ops.createLinearGradient = ops.createRadialGradient = 0;
      recording = true;
    },
    stop: function () {
      recording = false;
      return snapshot();
    },
    snapshot: snapshot,
    get recording() { return recording; }
  };
})();
