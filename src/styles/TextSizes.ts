// src/styles/TextSizes.ts
import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 375; // iPhone 6/7/8 — design baseline

/**
 * Normalizes a font size to the current screen width.
 * Only 35% of the deviation from the 375dp baseline is applied,
 * so a 412dp Android phone gets ~3% bigger text instead of ~10%.
 * This keeps cards and text visually consistent across all devices.
 */
const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const dampened = 1 + (scale - 1) * 0.15;
  return Math.round(PixelRatio.roundToNearestPixel(size * dampened));
};

export const TextSizes = {
  // ── Base scale (compact UI) ────────────────────────────────────────────
  tiny:   normalize(8),    // overdue badges, very fine print
  small:  normalize(10),   // timestamps, secondary meta
  normal: normalize(11),   // default body text, input text
  medium: normalize(11),   // UI labels, meta info (alias of normal)
  large:  normalize(11),   // card descriptions, sub-content
  xlarge: normalize(11),   // same tier as large (unify)
  header: normalize(12),   // card titles, row headers

  // ── Semantic roles ─────────────────────────────────────────────────────
  sectionTitle:   normalize(12),   // screen section headers
  bannerTitle:    normalize(11),   // banner/card headlines
  bannerSubtitle: normalize(10),   // banner supporting text

  statValue:  normalize(16),   // large numbers (%, counts) — needs visual weight
  statLabel:  normalize(10),   // small labels under stat values

  modalTitle: normalize(15),   // modal sheet header
  modalText:  normalize(11),   // modal body text

  filterLabel: normalize(11),  // form field labels, filter chips
  buttonText:  normalize(12),  // button labels
};
