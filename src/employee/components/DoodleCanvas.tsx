import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Undo2,
  Trash2,
  Download,
  Sparkles,
  Sun,
  Moon,
  Brush,
  BookOpen,
  Eye,
  EyeOff,
  Maximize2,
  X,
  Layers,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DOODLE_REFERENCES_23, type DoodleReference } from '../data/doodle-library';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  brushType: 'pen' | 'marker' | 'glow' | 'watercolor' | 'eraser';
}

const PALETTE = [
  { name: 'Sage Leaf', color: '#4F6B57' },
  { name: 'Deep Forest', color: '#243327' },
  { name: 'Warm Terracotta', color: '#C86D51' },
  { name: 'Lavender Mist', color: '#8E7DBE' },
  { name: 'Calm Teal', color: '#3B8B88' },
  { name: 'Sunset Glow', color: '#E07A5F' },
  { name: 'Golden Honey', color: '#D4A373' },
  { name: 'Soft Charcoal', color: '#3A3F3B' },
  { name: 'Pure Chalk', color: '#FFFFFF' },
];

// A small curated set, not the full library — this is a quick calming break, not a doodle app.
const FEATURED_DOODLE_IDS = [1, 2, 3, 4, 12];
const FEATURED_DOODLES = DOODLE_REFERENCES_23.filter((d) => FEATURED_DOODLE_IDS.includes(d.id));

interface DoodleCanvasProps {
  initialDoodleId?: number;
}

export function DoodleCanvas({ initialDoodleId }: DoodleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].color);
  const [brushSize, setBrushSize] = useState<number>(4);
  const [brushType, setBrushType] = useState<'pen' | 'marker' | 'glow' | 'watercolor' | 'eraser'>('pen');
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [history, setHistory] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // Doodle Reference State
  const [selectedDoodleId, setSelectedDoodleId] = useState<number>(
    initialDoodleId && FEATURED_DOODLE_IDS.includes(initialDoodleId) ? initialDoodleId : FEATURED_DOODLE_IDS[0]
  );
  const [traceGuide, setTraceGuide] = useState(false);
  const [traceOpacity, setTraceOpacity] = useState(0.35);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 700, height: 480 });

  // Current selected reference
  const currentDoodle =
    FEATURED_DOODLES.find((d) => d.id === selectedDoodleId) || FEATURED_DOODLES[0];

  // Jump to a newly recommended reference picture when it changes (only if it's one of the featured 5)
  useEffect(() => {
    if (initialDoodleId && FEATURED_DOODLE_IDS.includes(initialDoodleId)) {
      setSelectedDoodleId(initialDoodleId);
    }
  }, [initialDoodleId]);

  // Responsive canvas size
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = Math.max(380, Math.min(520, Math.round(width * 0.65)));
        setDimensions({ width, height });
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redraw all strokes on canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background fill
    ctx.fillStyle = darkCanvas ? '#1A211D' : '#FAF7F2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid texture
    ctx.strokeStyle = darkCanvas ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)';
    ctx.lineWidth = 1;
    const step = 28;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Helper to draw a single stroke
    const drawStroke = (stroke: Stroke) => {
      if (stroke.points.length === 0) return;
      ctx.save();

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.brushType === 'eraser') {
        ctx.strokeStyle = darkCanvas ? '#1A211D' : '#FAF7F2';
        ctx.lineWidth = stroke.size * 2.5;
        ctx.shadowBlur = 0;
      } else if (stroke.brushType === 'glow') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.size * 3;
      } else if (stroke.brushType === 'marker') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 2;
        ctx.globalAlpha = 0.45;
        ctx.shadowBlur = 0;
      } else if (stroke.brushType === 'watercolor') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * 2.8;
        ctx.globalAlpha = 0.25;
        ctx.shadowBlur = stroke.size;
        ctx.shadowColor = stroke.color;
      } else {
        // 'pen'
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
      } else {
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
      ctx.restore();
    };

    // Draw completed strokes
    history.forEach(drawStroke);

    // Draw active stroke
    if (currentStroke.length > 0) {
      drawStroke({
        points: currentStroke,
        color: selectedColor,
        size: brushSize,
        brushType,
      });
    }
  }, [darkCanvas, history, currentStroke, selectedColor, brushSize, brushType]);

  useEffect(() => {
    redraw();
  }, [redraw, dimensions]);

  // Pointer position helpers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const point = getCanvasCoords(e);
    setCurrentStroke([point]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = getCanvasCoords(e);
    setCurrentStroke((prev) => [...prev, point]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 0) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: selectedColor,
        size: brushSize,
        brushType,
      };
      setHistory((prev) => [...prev, newStroke]);
      setCurrentStroke([]);
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleUndo = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (history.length === 0) return;
    if (window.confirm('Clear your canvas to start fresh?')) {
      setHistory([]);
      setCurrentStroke([]);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `mindspace-doodle-${currentDoodle.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Banner Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#F4F8F5] border border-[#D5E5D8] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2D6A4F] text-white">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                Doodle Reference Pictures
              </span>
              <span className="text-xs text-[#78897B]">• Now drawing: {currentDoodle.title}</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#243327] mt-0.5">
              Pick one of the {FEATURED_DOODLES.length} pictures below and draw along, or enable the trace overlay.
            </p>
          </div>
        </div>

        {/* Trace toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setTraceGuide((t) => !t)}
            className={cn(
              'inline-flex items-center justify-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer border',
              traceGuide
                ? 'bg-[#2D6A4F] text-white border-[#234F3B]'
                : 'bg-white text-[#243327] border-[#D9D2C5] hover:bg-[#F3EFE8]'
            )}
          >
            {traceGuide ? <Eye className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            <span>{traceGuide ? 'Trace Overlay Active' : 'Overlay Picture on Canvas'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Card: toolbar + colors + actions all pinned above the canvas, so nothing ever requires scrolling to reach */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full rounded-2xl border overflow-hidden flex flex-col transition-colors',
          darkCanvas ? 'bg-[#1A211D] border-[#2E3C32]' : 'bg-[#FAF7F2] border-[#EAE4D9]'
        )}
      >
        {/* Toolbar Row 1: Brushes, Size, Dark Mode */}
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b text-xs transition-colors',
            darkCanvas ? 'bg-[#151B17] border-[#2E3C32] text-white/90' : 'bg-white/80 border-[#EAE4D9] text-[#243327]'
          )}
        >
          {/* Brushes */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#78897B] mr-1 hidden sm:inline">Brush:</span>
            {[
              { id: 'pen', label: 'Pen' },
              { id: 'marker', label: 'Marker' },
              { id: 'glow', label: 'Neon' },
              { id: 'watercolor', label: 'Watercolor' },
              { id: 'eraser', label: 'Eraser' },
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrushType(b.id as any)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                  brushType === b.id
                    ? 'bg-[#2D6A4F] text-white'
                    : darkCanvas
                    ? 'text-white/70 hover:bg-white/10'
                    : 'text-[#56685A] hover:bg-[#F3EFE8]'
                )}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Size Slider & Dark Mode */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#78897B]">Size:</span>
              <input
                type="range"
                min="2"
                max="24"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-16 sm:w-20 accent-[#2D6A4F] cursor-pointer"
              />
              <span className="text-[11px] font-mono text-[#78897B] w-4">{brushSize}</span>
            </div>

            <button
              type="button"
              onClick={() => setDarkCanvas((d) => !d)}
              title={darkCanvas ? 'Switch to Light canvas' : 'Switch to Dark canvas'}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer',
                darkCanvas ? 'border-white/20 bg-white/10 text-white' : 'border-[#D9D2C5] bg-white text-[#243327] hover:bg-[#F3EFE8]'
              )}
            >
              {darkCanvas ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Toolbar Row 2: Colors & Actions (Undo, Clear, Save) — pinned above the canvas, not below it */}
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b text-xs transition-colors',
            darkCanvas ? 'bg-[#151B17] border-[#2E3C32]' : 'bg-white/90 border-[#EAE4D9]'
          )}
        >
          {/* Colors */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[#78897B] mr-1 hidden sm:inline">Color:</span>
            {PALETTE.map((item) => {
              const isSelected = selectedColor === item.color && brushType !== 'eraser';
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    setSelectedColor(item.color);
                    if (brushType === 'eraser') setBrushType('pen');
                  }}
                  title={item.name}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform cursor-pointer flex items-center justify-center',
                    isSelected ? 'ring-2 ring-offset-2 ring-[#2D6A4F] scale-110' : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: item.color, border: item.color === '#FFFFFF' ? '1px solid #D9D2C5' : 'none' }}
                />
              );
            })}
          </div>

          {/* Action buttons (Undo, Clear, Save) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed',
                darkCanvas ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-[#FAF7F2] text-[#243327] hover:bg-[#EAE4D9] border border-[#D9D2C5]'
              )}
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span>Undo</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={history.length === 0}
              className={cn(
                'inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed',
                darkCanvas ? 'bg-white/10 text-white hover:bg-rose-900/40' : 'bg-[#FAF7F2] text-[#243327] hover:bg-rose-50 hover:text-rose-700 border border-[#D9D2C5]'
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#234F3B] text-white px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* The HTML5 Canvas Container */}
        <div className="relative w-full touch-none select-none flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="w-full h-auto cursor-crosshair block relative z-10"
                style={{ maxHeight: '520px' }}
              />

              {/* Optional Trace Guide Overlay with Real Image — must sit ABOVE the canvas (which always paints an
                  opaque background on redraw) so it's actually visible; pointer-events-none lets clicks/drags
                  pass through to the canvas underneath. */}
              {traceGuide && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center z-20 transition-opacity p-6"
                  style={{ opacity: traceOpacity }}
                >
                  <img
                    src={currentDoodle.imageUrl}
                    alt={currentDoodle.title}
                    className="h-full w-full object-contain max-h-[380px] drop-shadow-sm"
                  />
                </div>
              )}

              {history.length === 0 && !isDrawing && !traceGuide && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-2 z-10">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full',
                      darkCanvas ? 'bg-white/10 text-white/80' : 'bg-white/80 text-[#2D6A4F]'
                    )}
                  >
                    <Brush className="h-5 w-5" />
                  </div>
                  <p
                    className={cn(
                      'text-xs sm:text-sm font-medium tracking-tight',
                      darkCanvas ? 'text-white/75' : 'text-[#56685A]'
                    )}
                  >
                    Look at the reference below and draw <strong>"{currentDoodle.title}"</strong>…
                  </p>
                  <p
                    className={cn(
                      'text-[11px] max-w-xs',
                      darkCanvas ? 'text-white/40' : 'text-[#9AA79C]'
                    )}
                  >
                    Zero pressure. Enjoy each line as a mindful breathing moment.
                  </p>
                </div>
              )}
            </div>

            {/* Trace Opacity Slider (visible when trace is active) */}
            {traceGuide && (
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-2 border-t text-xs',
                  darkCanvas ? 'bg-[#151B17] border-[#2E3C32] text-white/80' : 'bg-[#F4F8F5] border-[#D5E5D8] text-[#243327]'
                )}
              >
                <span className="text-[11px] font-semibold">Picture Overlay Opacity:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.15"
                    max="0.8"
                    step="0.05"
                    value={traceOpacity}
                    onChange={(e) => setTraceOpacity(Number(e.target.value))}
                    className="w-28 accent-[#2D6A4F] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono">{Math.round(traceOpacity * 100)}%</span>
                </div>
              </div>
            )}
      </div>

      {/* Doodle Picker — the only reference UI; pick a picture, or tap the corner icon to see drawing steps */}
      <div className="rounded-2xl bg-white border border-[#EAE4D9] p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#2D6A4F]" />
          <h4 className="text-base font-semibold text-[#233226]">Pick a Picture</h4>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {FEATURED_DOODLES.map((doodle) => {
            const isSelected = selectedDoodleId === doodle.id;
            return (
              <button
                key={doodle.id}
                type="button"
                onClick={() => setSelectedDoodleId(doodle.id)}
                className={cn(
                  'flex flex-col items-center p-2.5 rounded-2xl border text-center transition-colors cursor-pointer group relative',
                  isSelected
                    ? 'border-[#2D6A4F] bg-[#F4F8F5] ring-2 ring-[#2D6A4F]/30'
                    : 'border-[#EAE4D9] bg-white hover:bg-[#FAF7F2] hover:border-[#2D6A4F]/30'
                )}
              >
                {/* Picture Thumbnail */}
                <div className="relative h-16 w-16 flex items-center justify-center p-1.5 rounded-xl bg-white border border-[#EAE4D9]">
                  <img src={doodle.imageUrl} alt={doodle.title} className="h-full w-full object-contain" />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoodleId(doodle.id);
                      setZoomModalOpen(true);
                    }}
                    title="View drawing steps"
                    className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#D9D2C5] text-[#243327] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </span>
                </div>

                <span className="mt-1.5 text-[11px] font-semibold text-[#243327] truncate w-full">
                  {doodle.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* High-Resolution Zoom Lightbox Modal */}
      {zoomModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setZoomModalOpen(false)}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-5 sm:p-8 border border-[#EAE4D9] shadow-2xl flex flex-col items-center text-center gap-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomModalOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#D9D2C5] text-[#243327] hover:bg-[#EAE4D9] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="rounded-full bg-[#E8F0EA] px-3 py-1 text-xs font-bold text-[#2D6A4F]">
              {currentDoodle.category}
            </span>

            <div className="h-48 w-48 sm:h-64 sm:w-64 rounded-2xl bg-[#FAF7F2] border border-[#EAE4D9] p-4 flex items-center justify-center shadow-inner">
              <img
                src={currentDoodle.imageUrl}
                alt={currentDoodle.title}
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-[#233226]">
                {currentDoodle.title}
              </h3>
              <p className="text-xs text-[#56685A] mt-1 italic">
                "{currentDoodle.tagline}"
              </p>
            </div>

            <div className="w-full text-left rounded-2xl bg-[#FAF7F2] border border-[#EAE4D9] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                Instructions:
              </span>
              <ul className="flex flex-col gap-1 text-xs text-[#243327] mt-1.5">
                {currentDoodle.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2D6A4F] text-[10px] font-bold text-white mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setTraceGuide(true);
                setZoomModalOpen(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#234F3B] text-white px-5 py-2.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              <span>Overlay Picture on Canvas</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoodleCanvas;
