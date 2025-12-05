
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, Undo2, Redo2, Layers, Search, 
  ChevronDown, Type, Image as ImageIcon, Grid3X3, 
  Plus, Minus, Check, Trash2, File, X, Upload
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Preview from './components/Preview';
import PixelEditor from './components/PixelEditor';
import { IconConfig, Preset, ContentMode, PixelGrid } from './types';
import { FONTS, PRESETS, INITIAL_PIXEL_GRID_SIZE, INITIAL_CONFIG, ICON_SIZE, SQUIRCLE_PATH } from './constants';
import { getSmartRoundedCorners } from './utils';

// --- Types ---
interface HistoryState {
  past: IconConfig[];
  present: IconConfig;
  future: IconConfig[];
}

interface SavedFile {
  id: string;
  name: string;
  config: IconConfig;
  lastModified: number;
}

type ExportFormat = 'png' | 'jpg' | 'webp' | 'svg';
type ExportScope = 'full' | 'content';

interface PendingCrop {
    originalSrc: string;
    croppedSrc: string;
    whitespaceRatio: number;
    fileName: string;
}

// Constants for export cropping
const ALPHA_THRESHOLD = 5; // Minimum alpha value to consider a pixel visible
const TEXT_WIDTH_RATIO = 0.6; // Approximate character width as fraction of font size
const TEXT_HEIGHT_RATIO = 1.2; // Approximate text height as fraction of font size

// --- UI Helper Components ---

const Section = ({ title, children, className = "" }: { title: string; children?: React.ReactNode; className?: string }) => (
  <div className={`mb-6 ${className}`}>
    <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 px-1">{title}</h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const ControlLabel = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[11px] font-medium text-zinc-400 block mb-1.5">{children}</label>
);

const NumberInput = ({ 
  value, 
  onChange, 
  label, 
  step = 1, 
  min, 
  max, 
  suffix,
  changeOnBlur = false
}: { 
  value: number; 
  onChange: (val: number) => void; 
  label?: string; 
  step?: number; 
  min?: number; 
  max?: number; 
  suffix?: string;
  changeOnBlur?: boolean;
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (parseFloat(inputValue) !== value) {
        setInputValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!changeOnBlur) {
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    }
  };

  const handleBlur = () => {
    let parsed = parseFloat(inputValue);
    if (isNaN(parsed)) {
        parsed = value;
    } else {
        if (min !== undefined && parsed < min) parsed = min;
        if (max !== undefined && parsed > max) parsed = max;
    }
    parsed = Math.round(parsed * 1000) / 1000;
    setInputValue(parsed.toString());
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const current = parseFloat(inputValue) || 0;
          const delta = e.key === 'ArrowUp' ? step : -step;
          let next = Math.round((current + delta) * 1000) / 1000;
          if (min !== undefined && next < min) next = min;
          if (max !== undefined && next > max) next = max;
          setInputValue(next.toString());
          onChange(next);
      }
      if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
      }
  };

  return (
    <div className="flex items-center justify-between py-1 group">
        {label && <label className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors select-none cursor-default">{label}</label>}
        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-md focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all hover:border-white/20">
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-14 bg-transparent px-2 py-1.5 text-right text-xs font-mono text-zinc-200 focus:outline-none placeholder-zinc-700"
            />
            {suffix && <span className="pr-2 text-[10px] text-zinc-500 select-none bg-transparent cursor-default">{suffix}</span>}
        </div>
    </div>
  );
};

const ColorInput = ({ value, onChange, label }: { value: string; onChange: (val: string) => void; label?: string }) => (
  <div className="flex items-center justify-between group py-1">
     {label && <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">{label}</span>}
     <div className="flex items-center gap-2 bg-zinc-900 rounded p-1 border border-white/10 hover:border-white/20 transition-colors focus-within:border-blue-500/50">
        <div className="w-5 h-5 rounded-sm overflow-hidden relative shadow-sm ring-1 ring-inset ring-white/5">
            <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0"
            />
            <div className="w-full h-full" style={{ backgroundColor: value }} />
        </div>
        <input
            type="text"
            value={value.toUpperCase()}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent text-[10px] font-mono text-zinc-400 w-14 focus:outline-none focus:text-white uppercase text-center"
            maxLength={7}
        />
     </div>
  </div>
);

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    title={label}
    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md transition-all ${
      active 
        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
    }`}
  >
    <Icon size={20} />
  </button>
);

const EffectControl = ({ 
    label, 
    enabled, 
    onToggle, 
    value, 
    onChangeValue, 
    min = 0, 
    max = 100,
    mode = 'slider',
    formatValue = (v: number) => `${Math.round(v)}%` 
}: {
    label: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    value: number;
    onChangeValue: (v: number) => void;
    min?: number;
    max?: number;
    mode?: 'slider' | 'input';
    formatValue?: (v: number) => string;
}) => {
    return (
        <div className="space-y-3 py-1">
            <div className="flex items-center justify-between">
                 <span className="text-[11px] font-medium text-zinc-400">{label}</span>
                 <button 
                    onClick={() => onToggle(!enabled)}
                    className={`w-9 h-5 rounded-full relative transition-colors ${enabled ? 'bg-blue-600' : 'bg-zinc-700'}`}
                 >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                 </button>
            </div>
            {enabled && (
                <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                    {mode === 'slider' ? (
                        <div className="flex items-center gap-3 pl-1">
                            <input 
                                type="range"
                                min={min}
                                max={max}
                                step={(max - min) / 100}
                                value={value}
                                onChange={(e) => onChangeValue(parseFloat(e.target.value))}
                                className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
                            />
                            <div className="w-10 text-right">
                                <span className="text-[10px] font-mono text-zinc-400">{formatValue(value)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="pl-1">
                            <NumberInput 
                                label="Opacity"
                                value={value * 100}
                                onChange={(v) => onChangeValue(v / 100)}
                                min={0}
                                max={max * 100}
                                suffix="%"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Export Modal ---

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: ExportFormat, scope: ExportScope) => void;
    filename: string;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, filename }) => {
    const [format, setFormat] = useState<ExportFormat>('png');
    const [includeBackground, setIncludeBackground] = useState(true);

    if (!isOpen) return null;

    const handleExport = () => {
        onExport(format, includeBackground ? 'full' : 'content');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                         <h2 className="text-base font-semibold text-white">Export Icon</h2>
                         <button 
                             onClick={onClose} 
                             className="p-1 -mr-1 text-zinc-500 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Format Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-400">Format</label>
                            <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950/50 rounded-lg border border-white/5">
                                {(['png', 'jpg', 'webp', 'svg'] as ExportFormat[]).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFormat(f)}
                                        className={`py-1.5 px-2 rounded-md text-[11px] font-bold uppercase transition-all ${
                                            format === f 
                                            ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' 
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                        }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Background Toggle */}
                        <div 
                            onClick={() => setIncludeBackground(!includeBackground)}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-zinc-800/20 hover:bg-zinc-800/40 hover:border-white/10 transition-all cursor-pointer group"
                        >
                            <div className="flex flex-col gap-0.5">
                                 <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">Background</span>
                                 <span className="text-[11px] text-zinc-500">
                                    {includeBackground ? 'Export squircle container' : 'Export transparent content'}
                                 </span>
                            </div>
                            <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 border border-transparent ${includeBackground ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${includeBackground ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleExport}
                        className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 py-3 rounded-xl text-sm font-bold transition-all transform active:scale-[0.98]"
                    >
                        <Download size={18} />
                        <span>Export {filename}.{format}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Crop Suggestion Modal ---

interface CropSuggestionModalProps {
    pending: PendingCrop | null;
    onAcceptCrop: () => void;
    onSkip: () => void;
}

const CropSuggestionModal: React.FC<CropSuggestionModalProps> = ({ pending, onAcceptCrop, onSkip }) => {
    if (!pending) return null;

    const whitespacePercent = Math.round(pending.whitespaceRatio * 100);

    return (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-white">Trim transparent padding?</h2>
                            <p className="text-sm text-zinc-400 max-w-xl">
                                We noticed about {whitespacePercent}% of this image is transparent padding. Crop it so your upload fills the frame?
                            </p>
                        </div>
                        <button
                            onClick={onSkip}
                            className="p-2 -mr-2 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                            title="Keep image as-is"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950 border border-white/5 rounded-xl p-3 flex flex-col gap-3">
                            <div className="text-xs font-semibold text-zinc-300">Original</div>
                            <div className="aspect-square rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden">
                                <img src={pending.originalSrc} alt="Original upload" className="object-contain max-h-full" />
                            </div>
                        </div>
                        <div className="bg-zinc-950 border border-white/5 rounded-xl p-3 flex flex-col gap-3">
                            <div className="text-xs font-semibold text-zinc-300">Cropped preview</div>
                            <div className="aspect-square rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden">
                                <img src={pending.croppedSrc} alt="Cropped preview" className="object-contain max-h-full" />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onAcceptCrop}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black hover:bg-zinc-200 font-semibold text-sm transition-all"
                        >
                            <Check size={16} />
                            Crop away the whitespace
                        </button>
                        <button
                            onClick={onSkip}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-zinc-200 hover:border-white/30 hover:bg-white/5 font-semibold text-sm transition-all"
                        >
                            <X size={16} />
                            Keep original
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// --- Main App ---

export default function App() {
  // File Management State
  const [files, setFiles] = useState<SavedFile[]>(() => {
    try {
        const saved = localStorage.getItem('emblemic_files');
        if (saved) {
            const parsed = JSON.parse(saved);
            const sorted = parsed.sort((a: SavedFile, b: SavedFile) => b.lastModified - a.lastModified);
            
            // Migration
            const migrated = sorted.map((f: any) => ({
                ...f,
                config: {
                    ...INITIAL_CONFIG,
                    ...f.config,
                    imageSize: f.config.imageSize || (f.config.imageScale ? 256 : INITIAL_CONFIG.imageSize),
                    imageColor: f.config.imageColor || INITIAL_CONFIG.imageColor,
                    radialGlareOpacity: f.config.radialGlareOpacity ?? 0,
                    pixelRounding: f.config.pixelRounding ?? false,
                    pixelRoundingStyle: f.config.pixelRoundingStyle || '25%',
                    backgroundTransitioning: false,
                }
            }));
            
            if (migrated.length > 0) return migrated;
        }
    } catch (e) {
        console.error("Failed to load saved files", e);
    }
    return [{
        id: generateId(),
        name: 'Untitled Icon',
        config: INITIAL_CONFIG,
        lastModified: Date.now()
    }];
  });

  const [activeFileId, setActiveFileId] = useState<string>(files[0].id);
  const [isFilesMenuOpen, setIsFilesMenuOpen] = useState(false);

  // Derived state for the current active file
  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  // Editor State
  const [filename, setFilename] = useState(activeFile.name);
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const filenameInputRef = useRef<HTMLInputElement>(null);
  
  // Undo/Redo State
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: activeFile.config,
    future: []
  });

  const config = history.present;

  // View Zoom State
  const [viewZoom, setViewZoom] = useState(1);
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  
  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);

  const applyImageSource = useCallback((src: string) => {
    setHistory((curr) => ({
        past: [...curr.past, curr.present],
        present: { 
            ...curr.present, 
            mode: 'image', 
            imageSrc: src,
            imageColor: curr.present.imageColor || INITIAL_CONFIG.imageColor
        },
        future: []
    }));
  }, []);

  const detectTransparentWhitespace = (img: HTMLImageElement) => {
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return null;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const { data } = ctx.getImageData(0, 0, width, height);
    let minX = width, minY = height, maxX = -1, maxY = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4 + 3; // alpha channel
            const alpha = data[idx];
            if (alpha > ALPHA_THRESHOLD) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    // No visible pixels
    if (maxX === -1 || maxY === -1) return null;

    const contentWidth = maxX - minX + 1;
    const contentHeight = maxY - minY + 1;
    const whitespaceArea = width * height - contentWidth * contentHeight;
    const whitespaceRatio = whitespaceArea / (width * height);

    // Only suggest trimming if there is notable transparent padding (>8%)
    const hasMeaningfulWhitespace = whitespaceRatio > 0.08 && (width - contentWidth > 6 || height - contentHeight > 6);
    if (!hasMeaningfulWhitespace) return null;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = contentWidth;
    cropCanvas.height = contentHeight;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) return null;
    cropCtx.drawImage(img, -minX, -minY);
    const croppedSrc = cropCanvas.toDataURL('image/png');

    return { croppedSrc, whitespaceRatio };
  };

  // Helper function to crop transparent whitespace from a canvas
  const cropCanvasWhitespace = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const width = canvas.width;
    const height = canvas.height;
    const { data } = ctx.getImageData(0, 0, width, height);
    
    let minX = width, minY = height, maxX = -1, maxY = -1;

    // Find the bounds of non-transparent pixels (alpha > ALPHA_THRESHOLD)
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4 + 3; // alpha channel
            const alpha = data[idx];
            if (alpha > ALPHA_THRESHOLD) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }
        }
    }

    // No visible pixels, return original canvas
    if (maxX === -1 || maxY === -1) return canvas;

    const contentWidth = maxX - minX + 1;
    const contentHeight = maxY - minY + 1;

    // If there's no whitespace to crop, return original canvas
    if (contentWidth === width && contentHeight === height) return canvas;

    // Create a new canvas with cropped dimensions
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = contentWidth;
    croppedCanvas.height = contentHeight;
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return canvas;

    // Draw the cropped portion
    croppedCtx.drawImage(canvas, minX, minY, contentWidth, contentHeight, 0, 0, contentWidth, contentHeight);

    return croppedCanvas;
  };

  // Helper function to compute content bounding box for SVG cropping
  const computeContentBounds = (): { minX: number; minY: number; maxX: number; maxY: number } | null => {
    if (config.mode === 'icon') {
      const iconDrawSize = config.iconSize;
      const x = (ICON_SIZE - iconDrawSize) / 2;
      const y = (ICON_SIZE - iconDrawSize) / 2 + config.iconOffsetY;
      return {
        minX: x,
        minY: y,
        maxX: x + iconDrawSize,
        maxY: y + iconDrawSize
      };
    } else if (config.mode === 'text') {
      // For text, estimate bounds based on font size
      // Uses approximate ratios: character width ≈ 60% of font size, line height ≈ 120% of font size
      // These are conservative estimates that work reasonably well across different fonts
      const estimatedWidth = config.textSize * config.textContent.length * TEXT_WIDTH_RATIO;
      const estimatedHeight = config.textSize * TEXT_HEIGHT_RATIO;
      const x = (ICON_SIZE - estimatedWidth) / 2;
      const y = (ICON_SIZE - estimatedHeight) / 2 + config.textOffsetY;
      return {
        minX: Math.max(0, x),
        minY: Math.max(0, y),
        maxX: Math.min(ICON_SIZE, x + estimatedWidth),
        maxY: Math.min(ICON_SIZE, y + estimatedHeight)
      };
    } else if (config.mode === 'pixel') {
      const drawSize = config.pixelSize;
      const x = (ICON_SIZE - drawSize) / 2;
      const y = (ICON_SIZE - drawSize) / 2;
      return {
        minX: x,
        minY: y,
        maxX: x + drawSize,
        maxY: y + drawSize
      };
    } else if (config.mode === 'image') {
      const drawSize = config.imageSize;
      const x = (ICON_SIZE - drawSize) / 2;
      const y = (ICON_SIZE - drawSize) / 2 + config.imageOffsetY;
      return {
        minX: x,
        minY: y,
        maxX: x + drawSize,
        maxY: y + drawSize
      };
    }
    return null;
  };

  const handleImageFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            const src = event.target.result as string;
            const isSvg = src.startsWith('data:image/svg');
            
            // Skip cropping analysis for SVGs to preserve them as SVGs
            if (isSvg) {
                applyImageSource(src);
            } else {
                const img = new Image();
                img.onload = () => {
                    const analysis = detectTransparentWhitespace(img);
                    if (analysis) {
                        setPendingCrop({
                            originalSrc: src,
                            croppedSrc: analysis.croppedSrc,
                            whitespaceRatio: analysis.whitespaceRatio,
                            fileName: file.name
                        });
                    } else {
                        applyImageSource(src);
                    }
                };
                img.src = src;
            }
        }
    };
    reader.readAsDataURL(file);
  }, [applyImageSource]);

  // --- Persistence Effects ---

  // Save changes to the active file in the files list and localStorage
  // This handles continuous saving while editing
  useEffect(() => {
    if (!activeFileId) return;

    setFiles(prevFiles => {
        const fileIndex = prevFiles.findIndex(f => f.id === activeFileId);
        if (fileIndex === -1) return prevFiles;

        const currentFile = prevFiles[fileIndex];
        
        // Only update if changes actually occurred to avoid unnecessary writes
        if (currentFile.name === filename && JSON.stringify(currentFile.config) === JSON.stringify(history.present)) {
            return prevFiles;
        }

        const updatedFile = {
            ...currentFile,
            name: filename,
            config: history.present,
            lastModified: Date.now()
        };

        const newFiles = [...prevFiles];
        newFiles[fileIndex] = updatedFile;
        
        localStorage.setItem('emblemic_files', JSON.stringify(newFiles));
        return newFiles;
    });
  }, [history.present, filename, activeFileId]);


  // --- Actions ---

  // Helper to save current work synchronously before switching
  const saveCurrentWork = (currentFiles: SavedFile[]) => {
      const idx = currentFiles.findIndex(f => f.id === activeFileId);
      if (idx === -1) return currentFiles;

      const updated = [...currentFiles];
      updated[idx] = {
          ...updated[idx],
          name: filename,
          config: history.present,
          lastModified: Date.now()
      };
      return updated;
  };

  const handleCreateNewFile = () => {
      // 1. Save current work
      const filesWithSavedWork = saveCurrentWork(files);

      // 2. Create new file
      const newFile: SavedFile = {
          id: generateId(),
          name: 'Untitled Icon',
          config: INITIAL_CONFIG,
          lastModified: Date.now()
      };
      
      const newFiles = [newFile, ...filesWithSavedWork];
      setFiles(newFiles);
      localStorage.setItem('emblemic_files', JSON.stringify(newFiles));
      
      // 3. Switch to new file
      setActiveFileId(newFile.id);
      setFilename(newFile.name);
      setHistory({ past: [], present: newFile.config, future: [] });
      setIsFilesMenuOpen(false);
  };

  const handleSwitchFile = (file: SavedFile) => {
      if (file.id === activeFileId) {
          setIsFilesMenuOpen(false);
          return;
      }

      // 1. Save current work before switching
      const filesWithSavedWork = saveCurrentWork(files);
      setFiles(filesWithSavedWork);
      localStorage.setItem('emblemic_files', JSON.stringify(filesWithSavedWork));

      // 2. Switch
      setActiveFileId(file.id);
      setFilename(file.name);
      setHistory({ past: [], present: file.config, future: [] });
      setIsFilesMenuOpen(false);
  };

  const handleDeleteFile = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newFiles = files.filter(f => f.id !== id);
      
      if (newFiles.length === 0) {
          // If deleting the last file, create a fresh one immediately
           const newFile: SavedFile = {
              id: generateId(),
              name: 'Untitled Icon',
              config: INITIAL_CONFIG,
              lastModified: Date.now()
          };
          setFiles([newFile]);
          setActiveFileId(newFile.id);
          setFilename(newFile.name);
          setHistory({ past: [], present: newFile.config, future: [] });
      } else {
          setFiles(newFiles);
          if (id === activeFileId) {
              // Switch to the first available file
              const nextFile = newFiles[0];
              setActiveFileId(nextFile.id);
              setFilename(nextFile.name);
              setHistory({ past: [], present: nextFile.config, future: [] });
          }
      }
      localStorage.setItem('emblemic_files', JSON.stringify(newFiles));
  };


  const pushToHistory = (newConfig: IconConfig) => {
    setHistory(curr => ({
      past: [...curr.past, curr.present],
      present: newConfig,
      future: []
    }));
  };

  const updateConfig = (updates: Partial<IconConfig>) => {
    pushToHistory({ ...config, ...updates });
  };

  const handleGridResize = (newSize: number) => {
      // Enforce limits to prevent UI breakage or performance issues
      const size = Math.max(4, Math.min(64, Math.round(newSize)));
      const currentGrid = config.pixelGrid;
      
      if (size === currentGrid.cols) return;

      const newData = new Array(size * size).fill('');
      
      // Attempt to preserve existing drawing (Top-Left Alignment)
      // This prevents total data loss when resizing
      const rowsToCopy = Math.min(currentGrid.rows, size);
      const colsToCopy = Math.min(currentGrid.cols, size);
      
      for (let r = 0; r < rowsToCopy; r++) {
          for (let c = 0; c < colsToCopy; c++) {
              const oldIdx = r * currentGrid.cols + c;
              const newIdx = r * size + c;
              newData[newIdx] = currentGrid.data[oldIdx];
          }
      }
      
      updateConfig({ 
          pixelGrid: {
              rows: size,
              cols: size,
              data: newData
          }
      });
  };

  const handleUndo = () => {
    setHistory(curr => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [curr.present, ...curr.future]
      };
    });
  };

  const handleRedo = () => {
    setHistory(curr => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      return {
        past: [...curr.past, curr.present],
        present: next,
        future: newFuture
      };
    });
  };

  // --- Keyboard Shortcuts (Undo/Redo & Zoom) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Check if user is typing in an input field
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Global Shortcuts (Undo/Redo)
      // Allow undo/redo even in inputs as they drive global state in this app
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      // View Shortcuts (Zoom)
      // Disable when typing in inputs to prevent accidental zooms while typing symbols
      if (!isInput) {
        if (e.key === '=' || e.key === '+') {
            e.preventDefault();
            setViewZoom(prev => {
                const next = Math.min(prev + 0.25, 5);
                return Math.round(next * 100) / 100;
            });
        }
        
        if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            setViewZoom(prev => {
                const next = Math.max(prev - 0.25, 0.1);
                return Math.round(next * 100) / 100;
            });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dropdown click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#zoom-control')) {
        setIsZoomMenuOpen(false);
      }
      if (!target.closest('#files-menu')) {
        setIsFilesMenuOpen(false);
      }
    };

    if (isZoomMenuOpen || isFilesMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isZoomMenuOpen, isFilesMenuOpen]);

  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');

    const handleDragEnter = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragCounterRef.current += 1;
        setIsDraggingFile(true);
    };

    const handleDragOver = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
        }
        setIsDraggingFile(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
        if (dragCounterRef.current === 0) {
            setIsDraggingFile(false);
        }
    };

    const handleDrop = (e: DragEvent) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragCounterRef.current = 0;
        setIsDraggingFile(false);

        const imageFile = Array.from(e.dataTransfer?.files || []).find((file) => file.type.startsWith('image/'));
        if (imageFile) {
            handleImageFile(imageFile);
        }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
        window.removeEventListener('dragenter', handleDragEnter);
        window.removeEventListener('dragover', handleDragOver);
        window.removeEventListener('dragleave', handleDragLeave);
        window.removeEventListener('drop', handleDrop);
    };
  }, [handleImageFile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        handleImageFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleAcceptCrop = useCallback(() => {
    if (!pendingCrop) return;
    applyImageSource(pendingCrop.croppedSrc);
    setPendingCrop(null);
  }, [applyImageSource, pendingCrop]);

  const handleSkipCrop = useCallback(() => {
    if (!pendingCrop) return;
    applyImageSource(pendingCrop.originalSrc);
    setPendingCrop(null);
  }, [applyImageSource, pendingCrop]);


  // --- Export Logic ---
  const processExport = async (format: ExportFormat, scope: ExportScope) => {
    const size = config.exportSize;
    const filenameWithExt = `${filename}.${format}`;
    // Export background if the scope is full, regardless of preview setting
    const withBg = scope === 'full';

    // SVG GENERATION
    if (format === 'svg') {
        const svgNs = "http://www.w3.org/2000/svg";
        // When using viewBox 0 0 512 512, scale is effectively 1 relative to the coordinate system
        const scale = 1; 
        
        // 1. Generate Content SVG String
        let contentSvg = '';
        
        if (config.mode === 'icon') {
            const svgEl = document.getElementById('preview-export-target')?.querySelector('svg');
            if (svgEl) {
                const clone = svgEl.cloneNode(true) as SVGElement;
                // Center in 512x512 space
                const iconDrawSize = config.iconSize;
                const x = (ICON_SIZE - iconDrawSize) / 2;
                const y = (ICON_SIZE - iconDrawSize) / 2 + config.iconOffsetY;
                
                clone.setAttribute('width', iconDrawSize.toString());
                clone.setAttribute('height', iconDrawSize.toString());
                clone.setAttribute('x', x.toString());
                clone.setAttribute('y', y.toString());
                clone.setAttribute('color', config.iconColor);
                clone.removeAttribute('class');
                contentSvg = new XMLSerializer().serializeToString(clone);
            }
        } else if (config.mode === 'text') {
            // Text centering in SVG
            const fontFamily = config.fontFamily.split(',')[0].replace(/['"]/g, '');
            contentSvg = `<text 
                x="256" 
                y="${256 + config.textOffsetY}" 
                font-family="${fontFamily}" 
                font-size="${config.textSize}" 
                font-weight="${config.fontWeight}" 
                fill="${config.textColor}" 
                text-anchor="middle" 
                dominant-baseline="central"
            >${config.textContent}</text>`;
        } else if (config.mode === 'pixel') {
            const gridSize = config.pixelGrid.cols;
            const drawSize = config.pixelSize;
            const cellSize = drawSize / gridSize;
            const startX = (ICON_SIZE - drawSize) / 2;
            const startY = (ICON_SIZE - drawSize) / 2;
            
            let rects = '';
            config.pixelGrid.data.forEach((color, i) => {
                if (color) {
                    const r = Math.floor(i / gridSize);
                    const c = i % gridSize;
                    const x = startX + c * cellSize;
                    const y = startY + r * cellSize;
                    
                    if (config.pixelRounding) {
                        // Use rounded corners with smart detection
                        const corners = getSmartRoundedCorners(config.pixelGrid, i);
                        // Convert percentage to actual pixel value
                        const radiusPercent = parseFloat(config.pixelRoundingStyle) / 100;
                        const radius = cellSize * radiusPercent;
                        
                        // Generate path with selective rounded corners
                        const tl = corners.topLeft ? radius : 0;
                        const tr = corners.topRight ? radius : 0;
                        const br = corners.bottomRight ? radius : 0;
                        const bl = corners.bottomLeft ? radius : 0;
                        
                        // Create a path with individual corner radii
                        const path = `M ${x + tl},${y} 
                                     L ${x + cellSize - tr},${y} 
                                     Q ${x + cellSize},${y} ${x + cellSize},${y + tr} 
                                     L ${x + cellSize},${y + cellSize - br} 
                                     Q ${x + cellSize},${y + cellSize} ${x + cellSize - br},${y + cellSize} 
                                     L ${x + bl},${y + cellSize} 
                                     Q ${x},${y + cellSize} ${x},${y + cellSize - bl} 
                                     L ${x},${y + tl} 
                                     Q ${x},${y} ${x + tl},${y} Z`;
                        rects += `<path d="${path}" fill="${color}" />`;
                    } else {
                        // Regular rectangular pixels
                        rects += `<rect x="${x}" y="${y}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" fill="${color}" />`;
                    }
                }
            });
            contentSvg = `<g shape-rendering="crispEdges">${rects}</g>`;
        } else if (config.mode === 'image' && config.imageSrc) {
            const drawSize = config.imageSize;
            const isSvg = config.imageSrc.startsWith('data:image/svg');
            
            if (isSvg) {
                // For SVG images, we can apply a color filter
                contentSvg = `<g style="color: ${config.imageColor};">
                    <image 
                        href="${config.imageSrc}" 
                        x="${(ICON_SIZE - drawSize)/2}" 
                        y="${(ICON_SIZE - drawSize)/2 + config.imageOffsetY}" 
                        width="${drawSize}" 
                        height="${drawSize}" 
                        preserveAspectRatio="xMidYMid meet"
                        style="fill: currentColor; color: ${config.imageColor};"
                    />
                </g>`;
            } else {
                contentSvg = `<image 
                    href="${config.imageSrc}" 
                    x="${(ICON_SIZE - drawSize)/2}" 
                    y="${(ICON_SIZE - drawSize)/2 + config.imageOffsetY}" 
                    width="${drawSize}" 
                    height="${drawSize}" 
                    preserveAspectRatio="xMidYMid meet"
                />`;
            }
        }

        // 2. Assemble Final SVG
        let fullSvg = '';
        
        if (withBg) {
             let bgFill = '';
             let defs = '';
             
             if (config.backgroundType === 'solid') {
                 bgFill = `fill="${config.solidColor}"`;
             } else if (config.backgroundType === 'linear') {
                 const gradId = 'gradLinear';
                 defs += `<linearGradient id="${gradId}" gradientTransform="rotate(${config.gradientAngle} 0.5 0.5)">
                    <stop offset="0%" stop-color="${config.gradientStart}"/>
                    <stop offset="100%" stop-color="${config.gradientEnd}"/>
                 </linearGradient>`;
                 bgFill = `fill="url(#${gradId})"`;
             } else {
                 const gradId = 'gradRadial';
                 defs += `<radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="${config.gradientStart}"/>
                    <stop offset="100%" stop-color="${config.gradientEnd}"/>
                 </radialGradient>`;
                 bgFill = `fill="url(#${gradId})"`;
             }

             if (config.noiseOpacity > 0) {
                 defs += `<filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
                 </filter>`;
             }

             if (config.radialGlareOpacity > 0) {
                 defs += `<radialGradient id="glareGradient" cx="50%" cy="0%" r="80%" fx="50%" fy="0%">
                    <stop offset="0%" stop-color="white" stop-opacity="${config.radialGlareOpacity}" />
                    <stop offset="100%" stop-color="white" stop-opacity="0" />
                 </radialGradient>`;
             }
             
             fullSvg = `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="${svgNs}">
                <defs>
                    ${defs}
                    <clipPath id="squircleClip">
                        <path d="${SQUIRCLE_PATH}" />
                    </clipPath>
                </defs>
                <g clip-path="url(#squircleClip)">
                    <rect width="512" height="512" ${bgFill} />
                    ${config.noiseOpacity > 0 ? `<rect width="512" height="512" filter="url(#noiseFilter)" opacity="${config.noiseOpacity}" style="mix-blend-mode: overlay" />` : ''}
                    ${config.radialGlareOpacity > 0 ? `<rect width="512" height="512" fill="url(#glareGradient)" />` : ''}
                </g>
                <g>
                    ${contentSvg}
                </g>
             </svg>`;
        } else {
             // Transparent / No background - crop to content bounds
             const bounds = computeContentBounds();
             if (bounds) {
                 const contentWidth = bounds.maxX - bounds.minX;
                 const contentHeight = bounds.maxY - bounds.minY;
                 const aspectRatio = contentWidth / contentHeight;
                 
                 // Determine final dimensions maintaining aspect ratio
                 let finalWidth = size;
                 let finalHeight = size;
                 if (aspectRatio > 1) {
                     finalHeight = size / aspectRatio;
                 } else if (aspectRatio < 1) {
                     finalWidth = size * aspectRatio;
                 }
                 
                 fullSvg = `<svg width="${Math.round(finalWidth)}" height="${Math.round(finalHeight)}" viewBox="${bounds.minX} ${bounds.minY} ${contentWidth} ${contentHeight}" xmlns="${svgNs}">
                   ${contentSvg}
                 </svg>`;
             } else {
                 // Fallback if bounds can't be computed
                 fullSvg = `<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="${svgNs}">
                   ${contentSvg}
                 </svg>`;
             }
        }

        const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filenameWithExt;
        link.click();
        URL.revokeObjectURL(url);
        
        setIsExportModalOpen(false);
        return;
    }

    // RASTER GENERATION (PNG/JPG/WEBP)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;
    
    // Scale factor based on Internal Render Size (512px)
    const scaleFactor = size / ICON_SIZE;

    // 1. Draw Background
    if (withBg) {
        const radius = size * 0.22; // Apple-ish
        ctx.beginPath();
        ctx.roundRect(0, 0, size, size, radius);
        ctx.clip();

        // Fill
        if (config.backgroundType === 'solid') {
            ctx.fillStyle = config.solidColor;
            ctx.fillRect(0, 0, size, size);
        } else {
            const grad = config.backgroundType === 'linear'
                ? ctx.createLinearGradient(0, 0, size, size) 
                : ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            
            grad.addColorStop(0, config.gradientStart);
            grad.addColorStop(1, config.gradientEnd);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
        }

        // Noise
        if (config.noiseOpacity > 0) {
            const imageData = ctx.getImageData(0, 0, size, size);
            const data = imageData.data;
            const factor = config.noiseOpacity * 255;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * factor;
                data[i] = Math.max(0, Math.min(255, data[i] + noise));
                data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise));
                data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise));
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // Glare
        if (config.radialGlareOpacity > 0) {
            const glareGrad = ctx.createRadialGradient(size/2, 0, 0, size/2, 0, size * 0.8);
            glareGrad.addColorStop(0, `rgba(255, 255, 255, ${config.radialGlareOpacity})`);
            glareGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = glareGrad;
            ctx.fillRect(0, 0, size, size);
        }

    } else {
        if (format === 'jpg') {
             // Optional: fill white for JPG if no background? 
        }
    }

    // 2. Draw Content
    const center = size / 2;
    // We need to save/restore context for the translation
    ctx.save();
    ctx.translate(center, center);
    
    if (config.mode === 'text') {
        const fontSize = config.textSize * scaleFactor;
        const offsetY = config.textOffsetY * scaleFactor;
        ctx.font = `${config.fontWeight} ${fontSize}px ${config.fontFamily.split(',')[0].replace(/['"]/g, '')}`;
        ctx.fillStyle = config.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Adjust for baseline visual alignment
        ctx.fillText(config.textContent, 0, offsetY);
    } else if (config.mode === 'pixel') {
        const gridSize = config.pixelGrid.cols;
        const drawSize = config.pixelSize * scaleFactor;
        const cellSize = drawSize / gridSize;
        const startX = -drawSize / 2;
        const startY = -drawSize / 2;

        config.pixelGrid.data.forEach((color, i) => {
            if (color) {
                const r = Math.floor(i / gridSize);
                const c = i % gridSize;
                const x = startX + c * cellSize;
                const y = startY + r * cellSize;
                
                ctx.fillStyle = color;
                
                if (config.pixelRounding) {
                    // Draw with smart rounded corners
                    const corners = getSmartRoundedCorners(config.pixelGrid, i);
                    // Convert percentage to actual pixel value
                    const radiusPercent = parseFloat(config.pixelRoundingStyle) / 100;
                    const radius = cellSize * radiusPercent;
                    
                    ctx.beginPath();
                    ctx.moveTo(x + (corners.topLeft ? radius : 0), y);
                    ctx.lineTo(x + cellSize - (corners.topRight ? radius : 0), y);
                    if (corners.topRight) {
                        ctx.quadraticCurveTo(x + cellSize, y, x + cellSize, y + radius);
                    }
                    ctx.lineTo(x + cellSize, y + cellSize - (corners.bottomRight ? radius : 0));
                    if (corners.bottomRight) {
                        ctx.quadraticCurveTo(x + cellSize, y + cellSize, x + cellSize - radius, y + cellSize);
                    }
                    ctx.lineTo(x + (corners.bottomLeft ? radius : 0), y + cellSize);
                    if (corners.bottomLeft) {
                        ctx.quadraticCurveTo(x, y + cellSize, x, y + cellSize - radius);
                    }
                    ctx.lineTo(x, y + (corners.topLeft ? radius : 0));
                    if (corners.topLeft) {
                        ctx.quadraticCurveTo(x, y, x + radius, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Regular rectangular pixels
                    ctx.fillRect(x, y, cellSize + 1, cellSize + 1);
                }
            }
        });
    } else if (config.mode === 'icon') {
        const svgEl = document.getElementById('preview-export-target')?.querySelector('svg');
        if (svgEl) {
            // Clone the SVG and set the color attribute to ensure proper color in raster export
            const clone = svgEl.cloneNode(true) as SVGElement;
            clone.setAttribute('color', config.iconColor);
            const svgData = new XMLSerializer().serializeToString(clone);
            const img = new Image();
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            await new Promise((resolve) => {
                img.onload = () => {
                    const drawSize = config.iconSize * scaleFactor;
                    const offsetY = config.iconOffsetY * scaleFactor;
                    ctx.drawImage(img, -drawSize/2, -drawSize/2 + offsetY, drawSize, drawSize);
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.src = url;
            });
        }
    } else if (config.mode === 'image' && config.imageSrc) {
        const img = new Image();
        const isSvg = config.imageSrc.startsWith('data:image/svg');
        
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = config.imageSrc!;
        });
        
        // Size logic: imageSize fits within box, aspect ratio preserved
        const drawSize = config.imageSize * scaleFactor;
        const aspect = img.width / img.height;
        let w, h;
        if (aspect > 1) {
             w = drawSize;
             h = drawSize / aspect;
        } else {
             h = drawSize;
             w = drawSize * aspect;
        }

        const offsetY = config.imageOffsetY * scaleFactor;
        
        if (isSvg) {
            // For SVG images, apply color tinting using an offscreen canvas
            // This prevents the composite operation from affecting the background
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = Math.ceil(w);
            offscreenCanvas.height = Math.ceil(h);
            const offscreenCtx = offscreenCanvas.getContext('2d');
            
            if (offscreenCtx) {
                // Draw the SVG on the offscreen canvas
                offscreenCtx.drawImage(img, 0, 0, w, h);
                
                // Apply color tinting using composite operation on the offscreen canvas
                offscreenCtx.globalCompositeOperation = 'source-in';
                offscreenCtx.fillStyle = config.imageColor;
                offscreenCtx.fillRect(0, 0, w, h);
                
                // Draw the tinted result onto the main canvas
                ctx.drawImage(
                    offscreenCanvas,
                    -w / 2,
                    -h / 2 + offsetY,
                    w,
                    h
                );
            } else {
                // Fallback: draw SVG without color tinting if offscreen canvas fails
                ctx.drawImage(img, -w / 2, -h / 2 + offsetY, w, h);
            }
        } else {
            ctx.drawImage(
                img, 
                -w / 2, 
                -h / 2 + offsetY, 
                w, 
                h
            );
        }
    }

    ctx.restore();

    // 3. Crop whitespace if exporting without background
    let finalCanvas = canvas;
    if (!withBg) {
        finalCanvas = cropCanvasWhitespace(canvas);
    }

    // 4. Trigger Download
    const link = document.createElement('a');
    link.download = filenameWithExt;
    const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
    link.href = finalCanvas.toDataURL(mimeType, 0.9);
    link.click();
    
    setIsExportModalOpen(false);
  };

  const iconList = Object.keys(LucideIcons).filter(name => 
    name.toLowerCase().includes(iconSearch.toLowerCase()) && 
    !['createLucideIcon', 'icons'].includes(name)
  ).slice(0, 100);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey || true) {
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      setViewZoom(prev => {
        const newZoom = Math.min(Math.max(prev + delta, 0.1), 5);
        return newZoom;
      });
    }
  };

  const handleZoomIn = () => {
    setViewZoom(prev => {
        const next = Math.min(prev + 0.25, 5);
        return Math.round(next * 100) / 100;
    });
  };

  const handleZoomOut = () => {
    setViewZoom(prev => {
        const next = Math.max(prev - 0.25, 0.1);
        return Math.round(next * 100) / 100;
    });
  };

  const ZOOM_OPTIONS = [0.25, 0.5, 0.75, 1, 2];

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-300 font-sans overflow-hidden">

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={processExport}
        filename={filename}
      />

      <CropSuggestionModal
        pending={pendingCrop}
        onAcceptCrop={handleAcceptCrop}
        onSkip={handleSkipCrop}
      />

      {isDraggingFile && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
            <div className="pointer-events-none flex flex-col items-center gap-3 px-6 py-5 bg-zinc-900/80 border border-white/10 rounded-2xl shadow-2xl text-center">
                <Upload className="w-8 h-8 text-zinc-200" />
                <div className="text-sm font-semibold text-white">Drop image to upload</div>
                <p className="text-xs text-zinc-400 max-w-xs">We will switch to the Upload tab and use your dropped image.</p>
            </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <header className="h-14 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50 shrink-0">
        
        {/* Left: Branding & Files */}
        <div className="flex items-center gap-4 w-1/3" id="files-menu">
            <div className="relative">
                <button 
                    onClick={() => setIsFilesMenuOpen(!isFilesMenuOpen)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${isFilesMenuOpen ? 'bg-zinc-800 text-white' : 'text-zinc-200 hover:bg-zinc-800/50'}`}
                >
                    <Layers className="text-blue-500" size={18} />
                    <span className="font-semibold tracking-tight">Emblemic</span>
                    <ChevronDown size={12} className={`text-zinc-500 ml-1 transition-transform ${isFilesMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isFilesMenuOpen && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        <div className="p-2 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2">Icons</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                            {files.sort((a,b) => b.lastModified - a.lastModified).map(file => (
                                <div 
                                    key={file.id} 
                                    onClick={() => handleSwitchFile(file)}
                                    className={`group flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all ${
                                        file.id === activeFileId 
                                        ? 'bg-blue-600/10 text-blue-100' 
                                        : 'hover:bg-zinc-800/50 text-zinc-300'
                                    }`}
                                >
                                    <div className={`p-1.5 rounded-md ${file.id === activeFileId ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300'}`}>
                                        <File size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium truncate">{file.name}</div>
                                        <div className="text-[10px] text-zinc-500 truncate">{new Date(file.lastModified).toLocaleDateString()}</div>
                                    </div>
                                    {file.id === activeFileId && <Check size={14} className="text-blue-500 shrink-0" />}
                                    <button 
                                        onClick={(e) => handleDeleteFile(e, file.id)}
                                        className={`p-1.5 rounded-md text-zinc-500 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ${file.id === activeFileId ? 'opacity-100' : ''}`}
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-white/5 bg-zinc-900/50">
                             <button 
                                onClick={handleCreateNewFile}
                                className="w-full flex items-center justify-center gap-2 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors border border-white/5"
                             >
                                <Plus size={12} />
                                New Icon
                             </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-5 w-px bg-white/10 mx-1" />
            
            <div className="flex items-center gap-1">
                <button 
                    onClick={handleUndo} 
                    disabled={history.past.length === 0}
                    className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo2 size={16} />
                </button>
                <button 
                    onClick={handleRedo} 
                    disabled={history.future.length === 0}
                    className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <Redo2 size={16} />
                </button>
            </div>
        </div>

        {/* Center: Filename */}
        <div className="flex-1 flex justify-center">
             <div 
                className="group relative flex items-center justify-center"
                onClick={() => {
                    setIsEditingFilename(true);
                    setTimeout(() => filenameInputRef.current?.focus(), 0);
                }}
             >
                {isEditingFilename ? (
                    <input 
                        ref={filenameInputRef}
                        type="text" 
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        onBlur={() => setIsEditingFilename(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingFilename(false)}
                        className="bg-transparent text-center text-sm font-medium text-white focus:outline-none min-w-[100px]"
                    />
                ) : (
                    <div className="flex flex-col items-center">
                         <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors cursor-text">
                            {filename}
                        </span>
                        {/* Status indicator */}
                         <span className="text-[9px] text-zinc-600 group-hover:text-zinc-500">
                             {history.past.length > 0 ? 'Edited' : 'Saved'}
                         </span>
                    </div>
                )}
             </div>
        </div>

        {/* Right: Export */}
        <div className="flex items-center justify-end gap-3 w-1/3">
             <button 
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 border border-transparent px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm"
             >
                <Download size={14} />
                <span>Export</span>
             </button>
        </div>
      </header>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* === LEFT SIDEBAR: CONTENT CREATION === */}
        <aside className="w-80 bg-zinc-950 border-r border-white/5 flex flex-col shrink-0">
             
             {/* Mode Toggles */}
             <div className="p-4 border-b border-white/5">
                <div className="flex p-1 bg-zinc-900 rounded-lg border border-white/5">
                    <TabButton active={config.mode === 'icon'} onClick={() => updateConfig({ mode: 'icon' })} icon={ImageIcon} label="Icon" />
                    <TabButton active={config.mode === 'text'} onClick={() => updateConfig({ mode: 'text' })} icon={Type} label="Text" />
                    <TabButton active={config.mode === 'pixel'} onClick={() => updateConfig({ mode: 'pixel' })} icon={Grid3X3} label="Pixel" />
                    <TabButton active={config.mode === 'image'} onClick={() => updateConfig({ mode: 'image' })} icon={Upload} label="Upload" />
                </div>
             </div>

             {/* Content Settings Scroll Area */}
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                {/* ICON MODE: Search */}
                {config.mode === 'icon' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <Section title="Select Icon">
                             <div className="relative group mb-3">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input 
                                    type="text"
                                    placeholder="Search icons..."
                                    className="w-full bg-zinc-900 border border-white/10 rounded-md pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 transition-all text-zinc-300 placeholder:text-zinc-600"
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-5 gap-1.5 max-h-[600px] overflow-y-auto p-1 bg-zinc-900/30 rounded-lg border border-white/5">
                                {iconList.map((name) => {
                                    const Icon = (LucideIcons as any)[name];
                                    return (
                                        <button
                                            key={name}
                                            onClick={() => updateConfig({ selectedIconName: name })}
                                            className={`aspect-square flex items-center justify-center rounded transition-all ${config.selectedIconName === name ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200'}`}
                                            title={name}
                                        >
                                            <Icon size={18} />
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>
                    </div>
                )}

                {/* TEXT MODE: Input & Fonts */}
                {config.mode === 'text' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                         <Section title="Content">
                            <input 
                                type="text"
                                value={config.textContent}
                                onChange={(e) => updateConfig({ textContent: e.target.value })}
                                className="w-full bg-zinc-900 border border-white/10 rounded-md px-3 py-3 text-lg font-bold text-center focus:outline-none focus:border-white/20 transition-all text-white mb-3"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                {FONTS.map(font => (
                                    <button
                                        key={font.name}
                                        onClick={() => updateConfig({ fontFamily: font.family })}
                                        className={`px-3 py-2 text-[10px] rounded border transition-all text-center truncate ${
                                            config.fontFamily === font.family 
                                            ? 'border-white bg-white text-black' 
                                            : 'border-white/5 bg-zinc-900 text-zinc-500 hover:border-white/10 hover:text-zinc-300'
                                        }`}
                                        style={{ fontFamily: font.family }}
                                    >
                                        {font.name}
                                    </button>
                                ))}
                            </div>
                         </Section>
                    </div>
                )}

                {/* PIXEL MODE: Editor */}
                {config.mode === 'pixel' && (
                    <div className="animate-in fade-in duration-300">
                        <Section title="Editor">
                            <PixelEditor 
                                grid={config.pixelGrid}
                                color={config.pixelColor}
                                onChange={(grid) => updateConfig({ pixelGrid: grid })}
                                onColorChange={(color) => updateConfig({ pixelColor: color })}
                            />
                            <div className="mt-3 pt-3 border-t border-white/5">
                                <NumberInput 
                                    label="Grid Resolution" 
                                    value={config.pixelGrid.cols} 
                                    min={4} 
                                    max={64} 
                                    step={1} 
                                    suffix="px" 
                                    onChange={handleGridResize}
                                    changeOnBlur={true}
                                />
                            </div>
                        </Section>
                        <div className="bg-zinc-900/30 p-3 rounded-md border border-white/5 text-[10px] text-zinc-500">
                            Tip: Left click to draw, right click or use eraser to remove pixels.
                        </div>
                    </div>
                )}

                 {/* IMAGE MODE: Upload */}
                 {config.mode === 'image' && (
                    <div className="animate-in fade-in duration-300">
                        <Section title="Upload Image">
                            <div className="relative">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-800 rounded-lg hover:border-zinc-700 hover:bg-zinc-900/50 transition-all cursor-pointer group">
                                    {config.imageSrc ? (
                                        <div className="relative w-full h-full p-2">
                                            <img src={config.imageSrc} className="w-full h-full object-contain" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-xs text-white font-medium">Change Image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 text-zinc-500 mb-2 group-hover:text-zinc-400 transition-colors" />
                                            <p className="text-xs text-zinc-500 group-hover:text-zinc-400">
                                                <span className="font-semibold">Click to upload</span>
                                            </p>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleImageUpload} 
                                    />
                                </label>
                                {config.imageSrc && (
                                     <button 
                                        onClick={() => updateConfig({ imageSrc: null })}
                                        className="absolute -top-2 -right-2 p-1 bg-zinc-800 rounded-full border border-white/10 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-all shadow-lg"
                                        title="Remove image"
                                     >
                                         <X size={12} />
                                     </button>
                                )}
                            </div>
                        </Section>
                    </div>
                 )}
             </div>
        </aside>

        {/* === CENTER CANVAS === */}
        <main 
            className="flex-1 bg-[#09090b] relative flex items-center justify-center p-8 overflow-hidden"
            onWheel={handleWheel}
        >
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 opacity-[0.05]" 
                 style={{ 
                     backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', 
                     backgroundSize: '24px 24px' 
                 }} 
            />
            
            <div 
                className="flex flex-col items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] origin-center will-change-transform"
                style={{ transform: `scale(${viewZoom})` }}
            >
                 <div className="relative z-10 drop-shadow-2xl" id="preview-export-target">
                     <Preview config={config} />
                 </div>
                 
                 {/* Dimensions Label */}
                 <div className="mt-6 px-3 py-1 bg-zinc-900/90 backdrop-blur rounded-full border border-white/5 text-[10px] font-mono text-zinc-500 shadow-lg select-none">
                    512 × 512
                 </div>
            </div>

            {/* Bottom Right Zoom Control */}
            <div className="absolute bottom-6 right-6 z-50 flex items-center bg-zinc-900 border border-white/10 rounded-lg shadow-xl" id="zoom-control">
                <button
                    onClick={handleZoomOut}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-l-lg transition-colors border-r border-white/5"
                    title="Zoom Out"
                >
                    <Minus size={14} />
                </button>
                
                <div className="relative border-r border-white/5">
                    {isZoomMenuOpen && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-24 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                            {ZOOM_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => {
                                        setViewZoom(option);
                                        setIsZoomMenuOpen(false);
                                    }}
                                    className="flex items-center justify-center w-full px-2 py-1.5 text-xs hover:bg-zinc-800 transition-colors"
                                >
                                    <span className={viewZoom === option ? 'text-white font-medium' : 'text-zinc-400'}>
                                        {Math.round(option * 100)}%
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                        className="flex items-center justify-center w-16 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        {Math.round(viewZoom * 100)}%
                    </button>
                </div>

                <button
                    onClick={handleZoomIn}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-r-lg transition-colors"
                    title="Zoom In"
                >
                    <Plus size={14} />
                </button>
            </div>
        </main>

        {/* === RIGHT SIDEBAR: APPEARANCE & ADJUSTMENTS === */}
        <aside className="w-80 bg-zinc-950 border-l border-white/5 flex flex-col shrink-0">
            
            {/* Presets */}
            <div className="p-4 border-b border-white/5">
                <Section title="Presets" className="mb-0">
                    <div className="grid grid-cols-6 gap-2">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => updateConfig({
                                    backgroundType: preset.backgroundType,
                                    solidColor: preset.solidColor,
                                    gradientStart: preset.gradientStart,
                                    gradientEnd: preset.gradientEnd,
                                    gradientAngle: preset.gradientAngle,
                                })}
                                className="group relative aspect-square rounded-full overflow-hidden ring-1 ring-white/10 hover:ring-white/40 transition-all hover:scale-110"
                                title={preset.name}
                            >
                                <div 
                                    className="absolute inset-0"
                                    style={{
                                        background: preset.backgroundType === 'solid' 
                                            ? preset.solidColor
                                            : preset.backgroundType === 'linear'
                                                ? `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientStart}, ${preset.gradientEnd})`
                                                : `radial-gradient(circle, ${preset.gradientStart}, ${preset.gradientEnd})`
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </Section>
            </div>

            {/* Detailed Controls */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">

                 {/* --- BACKGROUND SETTINGS --- */}

                 <Section title="Fill Styles">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-xs text-zinc-400">Fill Type</label>
                        <div className="flex bg-zinc-900 rounded-md p-0.5 border border-white/5">
                            {(['solid', 'linear', 'radial'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => updateConfig({ backgroundType: type })}
                                    className={`px-3 py-1 text-[10px] capitalize rounded-sm transition-all ${
                                        config.backgroundType === type 
                                        ? 'bg-zinc-700 text-white shadow-sm' 
                                        : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {config.backgroundType === 'solid' ? (
                            <ColorInput label="Color" value={config.solidColor} onChange={(v) => updateConfig({ solidColor: v })} />
                        ) : (
                            <>
                                <ColorInput label="Primary Color" value={config.gradientStart} onChange={(v) => updateConfig({ gradientStart: v })} />
                                <ColorInput label="Secondary Color" value={config.gradientEnd} onChange={(v) => updateConfig({ gradientEnd: v })} />
                                {config.backgroundType === 'linear' && (
                                    <div className="pt-1">
                                        <NumberInput label="Angle" value={config.gradientAngle} min={0} max={360} step={1} suffix="°" onChange={(v) => updateConfig({ gradientAngle: v })} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                 </Section>

                 <Section title="Effects">
                    <div className="space-y-4">
                        <EffectControl 
                            label="Noise Texture"
                            enabled={config.noiseOpacity > 0}
                            onToggle={(enabled) => updateConfig({ noiseOpacity: enabled ? 0.25 : 0 })}
                            value={config.noiseOpacity}
                            onChangeValue={(v) => updateConfig({ noiseOpacity: v })}
                            min={0}
                            max={0.5}
                            mode="input"
                        />
                        <EffectControl 
                            label="Radial Glare"
                            enabled={config.radialGlareOpacity > 0}
                            onToggle={(enabled) => updateConfig({ radialGlareOpacity: enabled ? 0.25 : 0 })}
                            value={config.radialGlareOpacity}
                            onChangeValue={(v) => updateConfig({ radialGlareOpacity: v })}
                            min={0}
                            max={1}
                            formatValue={(v) => `${Math.round(v * 100)}%`}
                        />
                    </div>
                 </Section>

                 <div className="h-px bg-white/5 w-full my-6" />
                 
                 {/* --- DYNAMIC CONTENT ADJUSTMENTS --- */}
                 {config.mode === 'icon' && (
                     <Section title="Icon Settings">
                        <NumberInput label="Size" value={config.iconSize} min={16} max={1024} step={8} suffix="px" onChange={(v) => updateConfig({ iconSize: v })} />
                        <NumberInput label="Vertical Offset" value={config.iconOffsetY} min={-512} max={512} step={4} suffix="px" onChange={(v) => updateConfig({ iconOffsetY: v })} />
                        <div className="pt-2">
                            <ColorInput label="Icon Color" value={config.iconColor} onChange={(v) => updateConfig({ iconColor: v })} />
                        </div>
                     </Section>
                 )}

                 {config.mode === 'text' && (
                     <Section title="Text Settings">
                        <NumberInput label="Size" value={config.textSize} min={16} max={1024} step={8} suffix="px" onChange={(v) => updateConfig({ textSize: v })} />
                        <NumberInput label="Vertical Offset" value={config.textOffsetY} min={-512} max={512} step={4} suffix="px" onChange={(v) => updateConfig({ textOffsetY: v })} />
                        
                        <ControlLabel>Font Weight</ControlLabel>
                        <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-md border border-white/5 mb-3">
                            {['400', '600', '700', '900'].map(w => (
                                <button 
                                    key={w}
                                    onClick={() => updateConfig({ fontWeight: w })}
                                    className={`flex-1 text-[10px] py-1 rounded ${config.fontWeight === w ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {w}
                                </button>
                            ))}
                        </div>
                        <ColorInput label="Text Color" value={config.textColor} onChange={(v) => updateConfig({ textColor: v })} />
                     </Section>
                 )}

                 {config.mode === 'pixel' && (
                     <Section title="Pixel Settings">
                        <NumberInput label="Render Size" value={config.pixelSize} min={32} max={1024} step={8} suffix="px" onChange={(v) => updateConfig({ pixelSize: v })} />
                        <div className="pt-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-zinc-400">Smart Rounding</span>
                                <button 
                                    onClick={() => updateConfig({ pixelRounding: !config.pixelRounding })}
                                    className={`w-9 h-5 rounded-full relative transition-colors ${config.pixelRounding ? 'bg-blue-600' : 'bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${config.pixelRounding ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {config.pixelRounding && (
                                <div className="space-y-3 animate-in slide-in-from-top-1 fade-in duration-200">
                                    <div className="text-[10px] text-zinc-500 pl-1">
                                        Rounds corners that aren't connected to other pixels
                                    </div>
                                    <div className="flex items-center justify-between pl-1">
                                        <span className="text-[11px] font-medium text-zinc-400">Corner Style</span>
                                        <div className="flex gap-1 bg-zinc-900 p-0.5 rounded-md border border-white/5">
                                            <button
                                                onClick={() => updateConfig({ pixelRoundingStyle: '25%' })}
                                                className={`px-3 py-1 text-[10px] font-medium rounded transition-all ${
                                                    config.pixelRoundingStyle === '25%' 
                                                    ? 'bg-zinc-700 text-white shadow-sm' 
                                                    : 'text-zinc-500 hover:text-zinc-300'
                                                }`}
                                            >
                                                Soft
                                            </button>
                                            <button
                                                onClick={() => updateConfig({ pixelRoundingStyle: '50%' })}
                                                className={`px-3 py-1 text-[10px] font-medium rounded transition-all ${
                                                    config.pixelRoundingStyle === '50%' 
                                                    ? 'bg-zinc-700 text-white shadow-sm' 
                                                    : 'text-zinc-500 hover:text-zinc-300'
                                                }`}
                                            >
                                                Round
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     </Section>
                 )}

                 {config.mode === 'image' && (
                     <Section title="Image Settings">
                        <NumberInput label="Size" value={config.imageSize} min={32} max={1024} step={8} suffix="px" onChange={(v) => updateConfig({ imageSize: v })} />
                        <NumberInput label="Vertical Offset" value={config.imageOffsetY} min={-512} max={512} step={4} suffix="px" onChange={(v) => updateConfig({ imageOffsetY: v })} />
                        {config.imageSrc && config.imageSrc.startsWith('data:image/svg') && (
                            <ColorInput label="Image Color" value={config.imageColor} onChange={(v) => updateConfig({ imageColor: v })} />
                        )}
                     </Section>
                 )}
            </div>
        </aside>

      </div>
    </div>
  );
}