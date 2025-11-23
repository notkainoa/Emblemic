
import React, { useCallback, useState } from 'react';
import { PixelGrid } from '../types';
import { Eraser, Pencil, Trash2 } from 'lucide-react';

interface PixelEditorProps {
  grid: PixelGrid;
  color: string;
  showGrid: boolean;
  onChange: (newGrid: PixelGrid) => void;
  onColorChange: (color: string) => void;
}

const PixelEditor: React.FC<PixelEditorProps> = ({
  grid,
  color,
  showGrid,
  onChange,
  onColorChange,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');

  const handlePixelClick = useCallback(
    (index: number) => {
      const newData = [...grid.data];
      newData[index] = tool === 'pencil' ? color : '';
      onChange({ ...grid, data: newData });
    },
    [grid, color, tool, onChange]
  );

  const handleMouseDown = (index: number) => {
    setIsDrawing(true);
    handlePixelClick(index);
  };

  const handleMouseEnter = (index: number) => {
    if (isDrawing) {
      handlePixelClick(index);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearGrid = () => {
    onChange({ ...grid, data: new Array(grid.rows * grid.cols).fill('') });
  };

  return (
    <div className="flex flex-col gap-3 w-full" onMouseLeave={handleMouseUp}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setTool('pencil')}
            className={`p-1.5 rounded-md transition-all ${
              tool === 'pencil' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-white/5 text-zinc-400'
            }`}
            title="Pencil"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-md transition-all ${
              tool === 'eraser' ? 'bg-red-600 text-white shadow-sm' : 'hover:bg-white/5 text-zinc-400'
            }`}
            title="Eraser"
          >
            <Eraser size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden relative group cursor-pointer">
                 <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0"
                    title="Brush Color"
                />
                <div className="w-full h-full" style={{ backgroundColor: color }} />
            </div>
            
            <div className="flex gap-1 bg-zinc-800/50 p-1 rounded-lg border border-white/5">
                <button
                onClick={clearGrid}
                className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 transition-all"
                title="Clear All"
                >
                <Trash2 size={14} />
                </button>
            </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex items-center justify-center bg-zinc-900/50 rounded-lg border border-white/5 p-4 overflow-hidden shadow-inner">
        <div
          className="grid gap-px bg-zinc-800 border border-zinc-800 select-none touch-none shadow-xl"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            width: '100%',
            aspectRatio: '1/1',
          }}
          onMouseUp={handleMouseUp}
        >
          {grid.data.map((cellColor, i) => (
            <div
              key={i}
              onMouseDown={() => handleMouseDown(i)}
              onMouseEnter={() => handleMouseEnter(i)}
              className={`relative cursor-crosshair transition-colors duration-75 ${
                cellColor ? '' : 'bg-zinc-950/50'
              }`}
              style={{ backgroundColor: cellColor || undefined }}
            >
                 {showGrid && !cellColor && (
                    <div className="absolute inset-0 border border-white/5 pointer-events-none" />
                 )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PixelEditor;
