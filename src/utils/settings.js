const VALID_MODES = new Set(['width_col', 'height_row'])
const VALID_FIT_MODES = new Set(['average', 'portrait', 'landscape', 'max_dimensions', 'original'])
const VALID_ANCHORS = new Set([
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
])

export const DEFAULT_SETTINGS = {
  mode: 'width_col',
  width: 1200,
  rows: 2,
  height: 1600,
  cols: 3,
  gap: 0,
  backgroundColor: '#ffffff',
  backgroundAlpha: 100,
  fitMode: 'average',
  anchor: 'center'
}

function getStoredNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function boundedInteger(value, fallback, min, max) {
  return Math.min(max, Math.max(min, Math.trunc(getStoredNumber(value, fallback))))
}

function getStoredPercent(value, fallback) {
  return Math.min(100, Math.max(0, getStoredNumber(value, fallback)))
}

export function normalizeStoredSettings(candidate) {
  const nextSettings = candidate && typeof candidate === 'object' ? candidate : {}

  return {
    mode: VALID_MODES.has(nextSettings.mode) ? nextSettings.mode : DEFAULT_SETTINGS.mode,
    width: boundedInteger(nextSettings.width, DEFAULT_SETTINGS.width, 1, 10000),
    rows: boundedInteger(nextSettings.rows, DEFAULT_SETTINGS.rows, 1, 100),
    height: boundedInteger(nextSettings.height, DEFAULT_SETTINGS.height, 1, 10000),
    cols: boundedInteger(nextSettings.cols, DEFAULT_SETTINGS.cols, 1, 100),
    gap: boundedInteger(nextSettings.gap, DEFAULT_SETTINGS.gap, -100, 100),
    backgroundColor: typeof nextSettings.backgroundColor === 'string'
      ? nextSettings.backgroundColor
      : DEFAULT_SETTINGS.backgroundColor,
    backgroundAlpha: getStoredPercent(nextSettings.backgroundAlpha, DEFAULT_SETTINGS.backgroundAlpha),
    fitMode: VALID_FIT_MODES.has(nextSettings.fitMode) ? nextSettings.fitMode : DEFAULT_SETTINGS.fitMode,
    anchor: VALID_ANCHORS.has(nextSettings.anchor) ? nextSettings.anchor : DEFAULT_SETTINGS.anchor
  }
}

