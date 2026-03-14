// src/styles/TextSizes.ts
import { Platform } from 'react-native';

// Android renders Inter font slightly smaller than iOS at the same dp value.
// Adding +1 on Android brings them visually in line.
const p = Platform.OS === 'android' ? 1 : 0;

export const TextSizes = {
    // ── Base scale (compact UI) ────────────────────────────────────────────
    tiny:   8  + p,   // overdue badges, very fine print
    small:  10 + p,   // timestamps, secondary meta
    normal: 11 + p,   // default body text, input text
    medium: 11 + p,   // UI labels, meta info (alias of normal)
    large:  12 + p,   // card descriptions, sub-content
    xlarge: 12 + p,   // same tier as large (unify)
    header: 13 + p,   // card titles, row headers

    // ── Semantic roles ─────────────────────────────────────────────────────
    sectionTitle:   13 + p,   // screen section headers
    bannerTitle:    12 + p,   // banner/card headlines
    bannerSubtitle: 10 + p,   // banner supporting text

    statValue:  16 + p,   // large numbers (%, counts) — needs visual weight
    statLabel:  10 + p,   // small labels under stat values

    modalTitle: 15 + p,   // modal sheet header (was 11 — too small!)
    modalText:  11 + p,   // modal body text

    filterLabel: 11 + p,  // form field labels, filter chips
    buttonText:  12 + p,  // button labels
};
