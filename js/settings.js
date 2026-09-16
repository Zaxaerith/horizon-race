'use strict';

const Settings = (() => {
  const storageKey = 'hr_settings';
  const resolutionOptions = [1, 0.75, 0.5];
  const frameRateOptions = [30, 60, 120, 0];
  const defaultBindings = Object.freeze({
    left: 'a', right: 'd', accel: 'w', brake: 's', drift: 'shift',
    item: 'e', lookBack: 'q', pause: 'p', restart: 'r'
  });
  const actionOrder = Object.keys(defaultBindings);
  let data = { renderScale: 1, frameCap: 60, bindings: { ...defaultBindings } };

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && resolutionOptions.includes(saved.renderScale)) data.renderScale = saved.renderScale;
    if (saved && frameRateOptions.includes(saved.frameCap)) data.frameCap = saved.frameCap;
    if (saved && saved.bindings) {
      for (const action of actionOrder) {
        if (typeof saved.bindings[action] === 'string' && saved.bindings[action])
          data.bindings[action] = saved.bindings[action].toLowerCase();
      }
    }
  } catch (e) {}

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (e) {}
  }
  function cycleValue(list, current, step) {
    const index = Math.max(0, list.indexOf(current));
    return list[(index + step + list.length) % list.length];
  }
  function setBinding(action, key) {
    if (!actionOrder.includes(action) || !key) return;
    const normalized = key.toLowerCase();
    const duplicate = actionOrder.find(name => name !== action && data.bindings[name] === normalized);
    if (duplicate) data.bindings[duplicate] = data.bindings[action];
    data.bindings[action] = normalized;
    save();
  }
  function resetBindings() {
    data.bindings = { ...defaultBindings };
    save();
  }
  function keyLabel(key) {
    const labels = {
      ' ': 'SPACE', space: 'SPACE', arrowleft: '←', arrowright: '→',
      arrowup: '↑', arrowdown: '↓', shift: 'SHIFT', control: 'CTRL',
      alt: 'ALT', enter: 'ENTER', escape: 'ESC', tab: 'TAB'
    };
    return labels[key] || key.toUpperCase();
  }

  return {
    resolutionOptions, frameRateOptions, actionOrder,
    get renderScale() { return data.renderScale; },
    get frameCap() { return data.frameCap; },
    get bindings() { return data.bindings; },
    cycleResolution(step) { data.renderScale = cycleValue(resolutionOptions, data.renderScale, step); save(); },
    cycleFrameRate(step) { data.frameCap = cycleValue(frameRateOptions, data.frameCap, step); save(); },
    setBinding, resetBindings, keyLabel
  };
})();
