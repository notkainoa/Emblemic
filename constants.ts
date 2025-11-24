
import { Preset, FontOption, IconConfig } from './types';

export const ICON_SIZE = 512; // Internal render resolution

export const FONTS: FontOption[] = [
  { name: 'Inter', value: 'Inter', family: "'Inter', sans-serif" },
  { name: 'Roboto Mono', value: 'Roboto Mono', family: "'Roboto Mono', monospace" },
  { name: 'Space Grotesk', value: 'Space Grotesk', family: "'Space Grotesk', sans-serif" },
  { name: 'Righteous', value: 'Righteous', family: "'Righteous', cursive" },
  { name: 'Bangers', value: 'Bangers', family: "'Bangers', cursive" },
  { name: 'Fredoka', value: 'Fredoka', family: "'Fredoka', sans-serif" },
];

export const PRESETS: Preset[] = [
  {
    name: 'Midnight',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#0f172a',
    gradientEnd: '#334155',
    gradientAngle: 135,
  },
  {
    name: 'Sunset',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#f59e0b',
    gradientEnd: '#ec4899',
    gradientAngle: 45,
  },
  {
    name: 'Oceanic',
    backgroundType: 'radial',
    solidColor: '#000000',
    gradientStart: '#0ea5e9',
    gradientEnd: '#1e3a8a',
    gradientAngle: 0,
  },
  {
    name: 'Vercel',
    backgroundType: 'solid',
    solidColor: '#000000',
    gradientStart: '#000000',
    gradientEnd: '#000000',
    gradientAngle: 0,
  },
  {
    name: 'Forest',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#10b981',
    gradientEnd: '#064e3b',
    gradientAngle: 180,
  },
  {
    name: 'Berry',
    backgroundType: 'radial',
    solidColor: '#000000',
    gradientStart: '#a855f7',
    gradientEnd: '#4c1d95',
    gradientAngle: 0,
  },
  {
    name: 'Peach',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#ffedd5',
    gradientEnd: '#fdba74',
    gradientAngle: 135,
  },
  {
    name: 'Mint',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#ccfbf1',
    gradientEnd: '#2dd4bf',
    gradientAngle: 135,
  },
  {
    name: 'Aurora',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#818cf8',
    gradientEnd: '#22d3ee',
    gradientAngle: 90,
  },
  {
    name: 'Volcano',
    backgroundType: 'radial',
    solidColor: '#000000',
    gradientStart: '#7f1d1d',
    gradientEnd: '#000000',
    gradientAngle: 0,
  },
  {
    name: 'Gunmetal',
    backgroundType: 'linear',
    solidColor: '#52525b',
    gradientStart: '#27272a',
    gradientEnd: '#52525b',
    gradientAngle: 180,
  },
  {
    name: 'Candy',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#f472b6',
    gradientEnd: '#a78bfa',
    gradientAngle: 45,
  },
];

export const INITIAL_PIXEL_GRID_SIZE = 12;

export const INITIAL_CONFIG: IconConfig = {
    mode: 'icon',
    backgroundType: 'linear',
    solidColor: '#000000',
    gradientStart: '#8E2DE2',
    gradientEnd: '#4A00E0',
    gradientAngle: 135,
    backgroundTransitioning: false,
    noiseOpacity: 0,
    radialGlareOpacity: 0,
    selectedIconName: 'Plane',
    iconColor: '#ffffff',
    iconSize: 256,
    iconOffsetY: 0,
    textContent: 'Aa',
    fontFamily: 'Inter',
    textColor: '#ffffff',
    textSize: 256,
    fontWeight: '700',
    textOffsetY: 0,
    pixelGrid: {
      rows: INITIAL_PIXEL_GRID_SIZE,
      cols: INITIAL_PIXEL_GRID_SIZE,
      data: new Array(INITIAL_PIXEL_GRID_SIZE * INITIAL_PIXEL_GRID_SIZE).fill(''),
    },
    pixelColor: '#ffffff',
    pixelSize: 256,
    showGridLines: true,
    imageSrc: null,
    imageSize: 256,
    imageOffsetY: 0,
    exportSize: 1024,
    withBackground: true,
};

export const SQUIRCLE_PATH = "M 256,512 C 114.615,512 0,397.385 0,256 C 0,114.615 114.615,0 256,0 C 397.385,0 512,114.615 512,256 C 512,397.385 397.385,512 256,512 Z";
