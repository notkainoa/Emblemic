import { LucideIcon } from 'lucide-react';

export type ContentMode = 'icon' | 'text' | 'pixel' | 'image';
export type BackgroundType = 'solid' | 'linear' | 'radial';

export interface GradientPoint {
  offset: number;
  color: string;
}

export interface PixelGrid {
  rows: number;
  cols: number;
  data: string[]; // Array of hex colors, empty string means transparent
}

export interface IconConfig {
  mode: ContentMode;
  // Background
  backgroundType: BackgroundType;
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number; // for linear
  noiseOpacity: number;
  radialGlareOpacity: number;
  
  // Icon Mode
  selectedIconName: string;
  iconColor: string;
  iconSize: number;
  iconOffsetY: number;
  
  // Text Mode
  textContent: string;
  fontFamily: string;
  textColor: string;
  textSize: number;
  fontWeight: string;
  textOffsetY: number;
  
  // Pixel Mode
  pixelGrid: PixelGrid;
  pixelColor: string;
  pixelSize: number;

  // Image Mode
  imageSrc: string | null;
  imageSize: number;
  imageOffsetY: number;

  // Export
  exportSize: number;
  withBackground: boolean; // Squircle or transparent
}

export interface Preset {
  name: string;
  backgroundType: BackgroundType;
  solidColor: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
}

export interface FontOption {
  name: string;
  value: string;
  family: string;
}