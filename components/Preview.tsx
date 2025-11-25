
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { IconConfig, PixelGrid } from '../types';
import * as Icons from 'lucide-react';
import { ICON_SIZE } from '../constants';
import { getSmartRoundedCorners, cornersToBorderRadius } from '../utils';

// Component to render pixel art as a seamless canvas (no grid lines)
const PixelCanvas: React.FC<{ grid: PixelGrid; size: number }> = ({ grid, size }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const cellSize = size / grid.cols;

    // Draw each pixel as a filled rectangle
    // Use Math.floor for position and Math.ceil for size to ensure complete coverage
    grid.data.forEach((color, i) => {
      if (color) {
        const row = Math.floor(i / grid.cols);
        const col = i % grid.cols;
        ctx.fillStyle = color;
        // Calculate pixel boundaries to ensure seamless coverage
        const x = Math.floor(col * cellSize);
        const y = Math.floor(row * cellSize);
        const nextX = Math.floor((col + 1) * cellSize);
        const nextY = Math.floor((row + 1) * cellSize);
        ctx.fillRect(x, y, nextX - x, nextY - y);
      }
    });
  }, [grid, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    />
  );
};

interface PreviewProps {
  config: IconConfig;
  id?: string; // For capture
}

// Calculate responsive preview size based on viewport
const useResponsivePreviewSize = () => {
  const [previewSize, setPreviewSize] = useState(256);

  useEffect(() => {
    const calculateSize = () => {
      // Get viewport dimensions
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      
      // Calculate available space (accounting for sidebars and padding)
      // Left sidebar: 320px, Right sidebar: 320px, padding: 64px total
      const availableWidth = vw - 640 - 64;
      const availableHeight = vh - 56 - 64; // Header height + padding
      
      // Use the smaller dimension to ensure it fits, with min/max constraints
      const calculatedSize = Math.min(
        Math.max(200, Math.min(availableWidth, availableHeight) * 0.7),
        512
      );
      
      setPreviewSize(Math.round(calculatedSize));
    };

    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, []);

  return previewSize;
};

const Preview: React.FC<PreviewProps> = ({ config, id }) => {
  const PREVIEW_SIZE = useResponsivePreviewSize();
  const {
    mode,
    backgroundType,
    solidColor,
    gradientStart,
    gradientEnd,
    gradientAngle,
    noiseOpacity,
    radialGlareOpacity,
    selectedIconName,
    iconColor,
    iconSize,
    iconOffsetY,
    textContent,
    fontFamily,
    textColor,
    textSize,
    pixelGrid,
    pixelSize,
    pixelRounding,
    pixelRoundingStyle,
  } = config;

  // Calculate scale factor from internal resolution (512) to preview display (256)
  const scale = PREVIEW_SIZE / ICON_SIZE;

  // Generate Background Style
  const backgroundStyle = useMemo(() => {
    // Background is always enabled for preview
    let bg = '';
    if (backgroundType === 'solid') {
      bg = solidColor;
    } else if (backgroundType === 'linear') {
      bg = `linear-gradient(${gradientAngle}deg, ${gradientStart}, ${gradientEnd})`;
    } else if (backgroundType === 'radial') {
      bg = `radial-gradient(circle at center, ${gradientStart}, ${gradientEnd})`;
    }
    return { background: bg };
  }, [backgroundType, solidColor, gradientStart, gradientEnd, gradientAngle]);

  // Get Lucide Icon
  const LucideIcon = (Icons as any)[selectedIconName];

  return (
    <div className="relative flex items-center justify-center group">
      {/* Shadow for depth perception (not exported) */}
      <div
        className="absolute inset-4 blur-2xl opacity-40 rounded-full transition-all duration-500 group-hover:opacity-60 group-hover:blur-3xl"
        style={backgroundStyle}
      />

      {/* Main Icon Container */}
      <div
        id={id}
        className="relative overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
        style={{
          width: `${PREVIEW_SIZE}px`,
          height: `${PREVIEW_SIZE}px`,
          ...backgroundStyle,
          // Approximate iOS Squircle with CSS for display
          borderRadius: '22%',
        }}
      >
        {/* Noise Texture Overlay */}
        {noiseOpacity > 0 && (
           <div 
             className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay"
             style={{
               opacity: noiseOpacity,
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
             }}
           />
        )}

        {/* Radial Glare Overlay */}
        {radialGlareOpacity > 0 && (
           <div 
             className="absolute inset-0 pointer-events-none z-0"
             style={{
               background: `radial-gradient(circle at 50% 0%, rgba(255,255,255,${radialGlareOpacity}) 0%, transparent 70%)`,
             }}
           />
        )}

        {/* Content Wrapper */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {mode === 'icon' && LucideIcon && (
            <div
              style={{
                transform: `translateY(${iconOffsetY * scale}px)`,
                color: iconColor,
                lineHeight: 0,
              }}
            >
              <LucideIcon size={iconSize * scale} strokeWidth={1.5} />
            </div>
          )}

          {mode === 'text' && (
            <div
              className="text-center leading-none select-none whitespace-pre"
              style={{
                fontFamily: fontFamily,
                color: textColor,
                fontSize: `${textSize * scale}px`,
                fontWeight: config.fontWeight,
                transform: `translateY(${config.textOffsetY * scale}px)`,
              }}
            >
              {textContent}
            </div>
          )}

          {mode === 'pixel' && !pixelRounding && (
            <PixelCanvas grid={pixelGrid} size={Math.round(pixelSize * scale)} />
          )}

          {mode === 'pixel' && pixelRounding && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${pixelGrid.cols}, 1fr)`,
                width: `${pixelSize * scale}px`,
                aspectRatio: '1/1',
                imageRendering: 'auto',
              }}
            >
              {pixelGrid.data.map((c, i) => (
                <div 
                  key={i} 
                  style={{ 
                    backgroundColor: c || 'transparent',
                    borderRadius: c ? cornersToBorderRadius(getSmartRoundedCorners(pixelGrid, i), pixelRoundingStyle) : '0',
                  }} 
                />
              ))}
            </div>
          )}

          {mode === 'image' && config.imageSrc && (
             <div
                style={{
                  width: `${config.imageSize * scale}px`,
                  height: `${config.imageSize * scale}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translateY(${config.imageOffsetY * scale}px)`,
                  ...(config.imageSrc.startsWith('data:image/svg') ? {
                    // For SVG, use the image as a mask and fill with the color
                    WebkitMaskImage: `url(${config.imageSrc})`,
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: `url(${config.imageSrc})`,
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    backgroundColor: config.imageColor,
                  } : {})
                }}
             >
               {!config.imageSrc.startsWith('data:image/svg') && (
                 <img 
                   src={config.imageSrc} 
                   alt="Uploaded content" 
                   style={{ 
                     maxWidth: '100%', 
                     maxHeight: '100%', 
                     objectFit: 'contain',
                     userSelect: 'none',
                     pointerEvents: 'none',
                     display: 'block',
                   }} 
                 />
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Preview;
