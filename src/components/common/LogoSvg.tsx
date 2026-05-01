import React from 'react';
import { SvgXml } from 'react-native-svg';

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#263f4d"/>
      <stop offset="100%" stop-color="#1F3F4A"/>
    </linearGradient>
    <linearGradient id="flame" x1="50%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#A4C400"/>
      <stop offset="55%" stop-color="#d8f020"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="pgL" x1="100%" y1="0%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#f9fcf9"/>
      <stop offset="100%" stop-color="#e4ede6"/>
    </linearGradient>
    <linearGradient id="pgR" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f9fcf9"/>
      <stop offset="100%" stop-color="#e4ede6"/>
    </linearGradient>
  </defs>
  <circle cx="250" cy="254" r="226" fill="#142e38" opacity="0.18"/>
  <circle cx="250" cy="250" r="226" fill="#A4C400"/>
  <circle cx="250" cy="250" r="216" fill="white"/>
  <circle cx="250" cy="250" r="207" fill="url(#bg)"/>
  <circle cx="250" cy="250" r="207" fill="none" stroke="rgba(255,255,255,0.13)" stroke-width="1.5"/>
  <circle cx="250" cy="250" r="184" fill="none" stroke="#A4C400" stroke-width="2.5" opacity="0.6"/>
  <circle cx="66" cy="250" r="4" fill="#A4C400"/>
  <circle cx="434" cy="250" r="4" fill="#A4C400"/>
  <circle cx="66" cy="250" r="2" fill="white" opacity="0.6"/>
  <circle cx="434" cy="250" r="2" fill="white" opacity="0.6"/>
  <g transform="translate(250,190) scale(0.75)">
    <path d="M 0,-76 C -13,-86 -15,-104 -5,-118 C -2,-124 0,-127 0,-76 Z" fill="url(#flame)"/>
    <path d="M 0,-76 C 13,-86 15,-104 5,-118 C 2,-124 0,-127 0,-76 Z" fill="url(#flame)"/>
    <path d="M 0,-79 C -6,-90 -6,-107 0,-120 C 6,-107 6,-90 0,-79 Z" fill="white" opacity="0.7"/>
    <rect x="-5" y="-76" width="10" height="36" rx="4" fill="#A4C400"/>
    <rect x="-5" y="-66" width="10" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
    <rect x="-5" y="-58" width="10" height="2.5" rx="1" fill="rgba(255,255,255,0.4)"/>
    <path d="M -10,-76 L -12,-62 L 12,-62 L 10,-76 Z" fill="#7a9200"/>
    <ellipse cx="0" cy="-62" rx="12" ry="4" fill="#A4C400"/>
    <ellipse cx="0" cy="67" rx="82" ry="7" fill="rgba(0,0,0,0.18)"/>
    <path d="M 0,-44 C -28,-50 -70,-46 -80,-42 L -80,56 C -70,60 -28,62 0,58 Z" fill="url(#pgL)"/>
    <rect x="-7" y="-44" width="7" height="102" fill="rgba(0,0,0,0.06)"/>
    <path d="M 0,-44 C 28,-50 70,-46 80,-42 L 80,56 C 70,60 28,62 0,58 Z" fill="url(#pgR)"/>
    <rect x="0" y="-44" width="7" height="102" fill="rgba(0,0,0,0.06)"/>
    <path d="M -5,-46 Q 0,-50 5,-46 L 5,60 Q 0,64 -5,60 Z" fill="#A4C400"/>
    <rect x="-88" y="-46" width="11" height="108" rx="3" fill="#A4C400"/>
    <rect x="77" y="-46" width="11" height="108" rx="3" fill="#A4C400"/>
    <rect x="-70" y="-41" width="56" height="5" rx="2.5" fill="#A4C400" opacity="0.8"/>
    <rect x="14" y="-41" width="56" height="5" rx="2.5" fill="#A4C400" opacity="0.8"/>
  </g>
  <rect x="148" y="286" width="204" height="2.5" rx="1.25" fill="#A4C400" opacity="0.8"/>
  <text x="250" y="318" font-family="Arial,sans-serif" font-size="26" font-weight="800" fill="white" text-anchor="middle" letter-spacing="5">ALI SCIENCE</text>
  <rect x="185" y="327" width="130" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)"/>
  <text x="250" y="346" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#A4C400" text-anchor="middle" letter-spacing="9">ACADEMY</text>
  <rect x="148" y="361" width="204" height="2.5" rx="1.25" fill="#A4C400" opacity="0.8"/>
  <circle cx="250" cy="44" r="7" fill="#A4C400"/>
  <circle cx="250" cy="44" r="3.5" fill="white"/>
</svg>`;

interface Props {
  width?: number;
  height?: number;
}

export const LogoSvg = ({ width = 120, height = 120 }: Props) => (
  <SvgXml xml={LOGO_SVG} width={width} height={height} />
);
