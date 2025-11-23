
import React, { useState, useRef, useEffect } from 'react';
import { 
  Download, Undo2, Redo2, Layers, Search, 
  ChevronDown, Type, Image as ImageIcon, Grid3X3, 
  Minus, Plus, Info, Check, Trash2, Folder, File, PlusCircle
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import Preview from './components/Preview';
import PixelEditor from './components/PixelEditor';
import { IconConfig, Preset, ContentMode } from './types';
import { FONTS, PRESETS, INITIAL_PIXEL_GRID_SIZE, INITIAL_CONFIG, ICON_SIZE } from './constants';

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
  suffix 
}: { 
  value: number; 
  onChange: (val: number) => void; 
  label?: string; 
  step?: number; 
  min?: number; 
  max?: number; 
  suffix?: string;
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    if (parseFloat(inputValue) !== value) {
        setInputValue(value.toString());
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(parsed);
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
    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${
      active 
        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/5' 
        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// --- Main App ---

export default function App() {
  // File Management State
  const [files, setFiles] = useState<SavedFile[]>(() => {
    try {
        const saved = localStorage.getItem('icon_forge_files');
        if (saved) {
            const parsed = JSON.parse(saved);
            const sorted = parsed.sort((a: SavedFile, b: SavedFile) => b.lastModified - a.lastModified);
            if (sorted.length > 0) return sorted;
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
        
        localStorage.setItem('icon_forge_files', JSON.stringify(newFiles));
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
      localStorage.setItem('icon_forge_files', JSON.stringify(newFiles));
      
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
      localStorage.setItem('icon_forge_files', JSON.stringify(filesWithSavedWork));

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
      localStorage.setItem('icon_forge_files', JSON.stringify(newFiles));
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
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


  // --- Export Logic ---
  const handleExport = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size setup
    const size = config.exportSize;
    canvas.width = size;
    canvas.height = size;
    
    // Scale factor based on Internal Render Size (512px)
    const scaleFactor = size / ICON_SIZE;

    // 1. Draw Background
    if (config.withBackground) {
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
    }

    // 2. Draw Content
    const center = size / 2;
    ctx.translate(center, center);
    
    if (config.mode === 'text') {
        const fontSize = config.textSize * scaleFactor;
        ctx.font = `${config.fontWeight} ${fontSize}px ${config.fontFamily.split(',')[0].replace(/['"]/g, '')}`;
        ctx.fillStyle = config.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Adjust for baseline visual alignment
        ctx.fillText(config.textContent, 0, 0);
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
                ctx.fillStyle = color;
                ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize + 1, cellSize + 1);
            }
        });
    } else if (config.mode === 'icon') {
        const svgEl = document.getElementById('preview-export-target')?.querySelector('svg');
        if (svgEl) {
            const svgData = new XMLSerializer().serializeToString(svgEl);
            const img = new Image();
            const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            const url = URL.createObjectURL(svgBlob);
            await new Promise((resolve) => {
                img.onload = () => {
                    const drawSize = config.iconSize * scaleFactor;
                    // The SVG is square, so we can use drawSize for both width and height
                    const offsetY = config.iconOffsetY * scaleFactor;
                    ctx.drawImage(img, -drawSize/2, -drawSize/2 + offsetY, drawSize, drawSize);
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.src = url;
            });
        }
    }

    // 3. Trigger Download
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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

  const ZOOM_OPTIONS = [0.25, 0.5, 0.75, 1, 2];

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-300 font-sans overflow-hidden">
      
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
                    <span className="font-semibold tracking-tight">Icon Maker</span>
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
                onClick={handleExport}
                className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 border border-transparent px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm"
             >
                <Download size={14} />
                <span>Export</span>
             </button>
        </div>
      </header>

      {/* --- MAIN CONTENT LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* === LEFT SIDEBAR: CONTENT === */}
        <aside className="w-80 bg-zinc-950 border-r border-white/5 flex flex-col shrink-0">
             
             {/* Mode Toggles */}
             <div className="p-4 border-b border-white/5">
                <div className="flex p-1 bg-zinc-900 rounded-lg border border-white/5">
                    <TabButton active={config.mode === 'icon'} onClick={() => updateConfig({ mode: 'icon' })} icon={ImageIcon} label="Icon" />
                    <TabButton active={config.mode === 'text'} onClick={() => updateConfig({ mode: 'text' })} icon={Type} label="Text" />
                    <TabButton active={config.mode === 'pixel'} onClick={() => updateConfig({ mode: 'pixel' })} icon={Grid3X3} label="Pixel" />
                </div>
             </div>

             {/* Content Settings Scroll Area */}
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                
                {/* ICON MODE */}
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
                            <div className="grid grid-cols-5 gap-1.5 max-h-[240px] overflow-y-auto p-1 bg-zinc-900/30 rounded-lg border border-white/5">
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

                        <Section title="Adjustments">
                            <NumberInput label="Size" value={config.iconSize} min={16} max={ICON_SIZE} step={8} suffix="px" onChange={(v) => updateConfig({ iconSize: v })} />
                            <NumberInput label="Vertical Offset" value={config.iconOffsetY} min={-256} max={256} step={4} suffix="px" onChange={(v) => updateConfig({ iconOffsetY: v })} />
                        </Section>

                        <Section title="Appearance">
                             <ColorInput label="Icon Color" value={config.iconColor} onChange={(v) => updateConfig({ iconColor: v })} />
                        </Section>
                    </div>
                )}

                {/* TEXT MODE */}
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

                         <Section title="Adjustments">
                            <NumberInput label="Size" value={config.textSize} min={16} max={ICON_SIZE} step={8} suffix="px" onChange={(v) => updateConfig({ textSize: v })} />
                            <ControlLabel>Font Weight</ControlLabel>
                            <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-md border border-white/5">
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
                         </Section>

                         <Section title="Appearance">
                            <ColorInput label="Text Color" value={config.textColor} onChange={(v) => updateConfig({ textColor: v })} />
                         </Section>
                    </div>
                )}

                {/* PIXEL MODE */}
                {config.mode === 'pixel' && (
                    <div className="animate-in fade-in duration-300">
                        <Section title="Editor">
                            <PixelEditor 
                                grid={config.pixelGrid}
                                color={config.pixelColor}
                                showGrid={config.showGridLines}
                                onChange={(grid) => updateConfig({ pixelGrid: grid })}
                                onColorChange={(color) => updateConfig({ pixelColor: color })}
                            />
                        </Section>
                        <Section title="Adjustments">
                             <NumberInput label="Size" value={config.pixelSize} min={32} max={ICON_SIZE} step={8} suffix="px" onChange={(v) => updateConfig({ pixelSize: v })} />
                        </Section>
                        <div className="bg-zinc-900/30 p-3 rounded-md border border-white/5 text-[10px] text-zinc-500">
                            Tip: Left click to draw, right click or use eraser to remove pixels.
                        </div>
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
                className="flex flex-col items-center justify-center transition-transform duration-75 ease-out origin-center will-change-transform"
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
            <div className="absolute bottom-6 right-6 z-50" id="zoom-control">
                {isZoomMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {ZOOM_OPTIONS.map((option) => (
                            <button
                                key={option}
                                onClick={() => {
                                    setViewZoom(option);
                                    setIsZoomMenuOpen(false);
                                }}
                                className="flex items-center justify-between w-full px-4 py-2 text-xs text-left hover:bg-zinc-800 transition-colors"
                            >
                                <span className={viewZoom === option ? 'text-white' : 'text-zinc-400'}>
                                    {Math.round(option * 100)}%
                                </span>
                                {viewZoom === option && <Check size={12} className="text-blue-500" />}
                            </button>
                        ))}
                    </div>
                )}
                <button
                    onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                    className="flex items-center gap-2 bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-white/20 px-3 py-2 rounded-md shadow-xl transition-all group min-w-[80px] justify-between"
                >
                    <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 tabular-nums">
                        {Math.round(viewZoom * 100)}%
                    </span>
                    <ChevronDown 
                        size={14} 
                        className={`text-zinc-600 group-hover:text-zinc-400 transition-transform duration-200 ${isZoomMenuOpen ? 'rotate-180' : ''}`} 
                    />
                </button>
            </div>
        </main>

        {/* === RIGHT SIDEBAR: APPEARANCE === */}
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
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-8">
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
                        <NumberInput 
                            label="Noise Texture" 
                            value={Math.round(config.noiseOpacity * 100)} 
                            min={0} 
                            max={40} 
                            step={1} 
                            suffix="%" 
                            onChange={(v) => updateConfig({ noiseOpacity: v / 100 })} 
                        />
                    </div>
                 </Section>

                 <Section title="Container">
                    <div className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg border border-white/5">
                        <span className="text-xs text-zinc-400">Show Background</span>
                        <button 
                            onClick={() => updateConfig({ withBackground: !config.withBackground })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${config.withBackground ? 'bg-blue-600' : 'bg-zinc-700'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform duration-200 ${config.withBackground ? 'left-6' : 'left-1'}`} />
                        </button>
                    </div>
                 </Section>
            </div>
        </aside>

      </div>
    </div>
  );
}
