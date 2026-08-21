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
  ChevronLeft,
  ChevronRight,
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

const CATEGORIES = ['All', 'Nature', 'Zen', 'Cozy', 'Celestial', 'Creatures'] as const;

export function DoodleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].color);
  const [brushSize, setBrushSize] = useState<number>(4);
  const [brushType, setBrushType] = useState<'pen' | 'marker' | 'glow' | 'watercolor' | 'eraser'>('pen');
  const [darkCanvas, setDarkCanvas] = useState(false);
  const [history, setHistory] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  // 23 Doodle Image Library State
  const [selectedDoodleId, setSelectedDoodleId] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [traceGuide, setTraceGuide] = useState(false);
  const [traceOpacity, setTraceOpacity] = useState(0.35);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 700, height: 480 });

  // Current selected reference
  const currentDoodle =
    DOODLE_REFERENCES_23.find((d) => d.id === selectedDoodleId) || DOODLE_REFERENCES_23[0];

  // Filtered doodle list
  const filteredDoodles = DOODLE_REFERENCES_23.filter((d) => {
    return selectedCategory === 'All' || d.category === selectedCategory;
  });

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

  const handleSelectPrevious = () => {
    const idx = DOODLE_REFERENCES_23.findIndex((d) => d.id === selectedDoodleId);
    const prevIdx = (idx - 1 + DOODLE_REFERENCES_23.length) % DOODLE_REFERENCES_23.length;
    setSelectedDoodleId(DOODLE_REFERENCES_23[prevIdx].id);
  };

  const handleSelectNext = () => {
    const idx = DOODLE_REFERENCES_23.findIndex((d) => d.id === selectedDoodleId);
    const nextIdx = (idx + 1) % DOODLE_REFERENCES_23.length;
    setSelectedDoodleId(DOODLE_REFERENCES_23[nextIdx].id);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Banner Guide */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-[#F4F8F5] border border-[#D5E5D8] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4F6B57] text-white">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F6B57]">
                23 Doodle Reference Pictures
              </span>
              <span className="text-xs text-[#78897B]">• Picture #{currentDoodle.id}: {currentDoodle.title}</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#243327] mt-0.5">
              Look at any of the 23 doodle pictures on the right and draw along, or enable the trace overlay.
            </p>
          </div>
        </div>

        {/* Trace toggle */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setTraceGuide((t) => !t)}
            className={cn(
              'inline-flex items-center justify-center gap-2 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all cursor-pointer border',
              traceGuide
                ? 'bg-[#4F6B57] text-white border-[#3E5545]'
                : 'bg-white text-[#243327] border-[#D9D2C5] hover:bg-[#F3EFE8]'
            )}
          >
            {traceGuide ? <Eye className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            <span>{traceGuide ? 'Trace Overlay Active' : 'Overlay Picture on Canvas'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid (Canvas on Left/Center, 23 Doodle Image Cards on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Area: Canvas & Drawing Controls (Col 1-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            ref={containerRef}
            className={cn(
              'relative w-full rounded-[28px] border overflow-hidden shadow-sm flex flex-col transition-colors',
              darkCanvas ? 'bg-[#1A211D] border-[#2E3C32]' : 'bg-[#FAF7F2] border-[#EAE4D9]'
            )}
          >
            {/* Canvas Toolbar Header */}
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b text-xs transition-colors',
                darkCanvas ? 'bg-[#151B17] border-[#2E3C32] text-white/90' : 'bg-white/80 border-[#EAE4D9] text-[#243327]'
              )}
            >
              {/* Brushes */}
              <div className="flex items-center gap-1.5">
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
                        ? 'bg-[#4F6B57] text-white shadow-2xs'
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
                    className="w-16 sm:w-20 accent-[#4F6B57] cursor-pointer"
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

            {/* The HTML5 Canvas Container */}
            <div className="relative w-full touch-none select-none flex items-center justify-center">
              {/* Optional Trace Guide Overlay with Real Image */}
              {traceGuide && (
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center z-0 transition-opacity p-6"
                  style={{ opacity: traceOpacity }}
                >
                  <img
                    src={currentDoodle.imageUrl}
                    alt={currentDoodle.title}
                    className="h-full w-full object-contain max-h-[380px] drop-shadow-sm"
                  />
                </div>
              )}

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

              {history.length === 0 && !isDrawing && !traceGuide && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-2 z-10">
                  <div
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-full shadow-xs',
                      darkCanvas ? 'bg-white/10 text-white/80' : 'bg-white/80 text-[#4F6B57]'
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
                    Look at the picture on the right and draw <strong>"{currentDoodle.title}"</strong>…
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
                    className="w-28 accent-[#4F6B57] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono">{Math.round(traceOpacity * 100)}%</span>
                </div>
              </div>
            )}

            {/* Canvas Bottom Color Palette & Action Buttons */}
            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t text-xs transition-colors',
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
                        'h-7 w-7 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-2xs',
                        isSelected ? 'ring-2 ring-offset-2 ring-[#4F6B57] scale-110' : 'hover:scale-105'
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#4F6B57] hover:bg-[#3E5545] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Area: Active Reference Image Viewer & 23 Doodle Image Cards (Col 8-12) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Active Doodle Card with Real Illustrated Picture */}
          <div className="rounded-[28px] bg-white border border-[#EAE4D9] p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#E8F0EA] px-2.5 py-0.5 text-[10px] font-bold text-[#4F6B57]">
                  {currentDoodle.category}
                </span>
                <span className="text-xs text-[#78897B]">• Picture #{currentDoodle.id} of 23</span>
              </div>

              {/* Prev / Next Nav */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectPrevious}
                  title="Previous Picture"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] text-[#243327] hover:bg-[#EAE4D9] cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleSelectNext}
                  title="Next Picture"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] text-[#243327] hover:bg-[#EAE4D9] cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Main Picture Frame */}
            <div className="relative group rounded-2xl overflow-hidden border border-[#EAE4D9] bg-[#FAF7F2] p-4 flex items-center justify-center">
              <img
                src={currentDoodle.imageUrl}
                alt={currentDoodle.title}
                className="h-48 w-48 object-contain transition-transform duration-300 group-hover:scale-105"
              />

              {/* Enlarge zoom button overlay */}
              <button
                type="button"
                onClick={() => setZoomModalOpen(true)}
                title="Enlarge Picture"
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 hover:bg-white text-[#243327] border border-[#D9D2C5] shadow-xs cursor-pointer opacity-90 group-hover:opacity-100 transition-opacity"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h3 className="font-serif text-xl font-normal text-[#233226]">
                {currentDoodle.title}
              </h3>
              <p className="text-xs text-[#56685A] mt-0.5 italic">
                "{currentDoodle.tagline}"
              </p>
            </div>

            {/* Quick Drawing Steps */}
            <div className="rounded-2xl bg-[#FAF7F2] border border-[#EAE4D9] p-3.5 flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F6B57]">
                Step-by-Step Drawing Guide:
              </span>
              <ul className="flex flex-col gap-1.5 text-xs text-[#243327]">
                {currentDoodle.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4F6B57] text-[10px] font-bold text-white mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 23 Doodle Picture Cards Gallery */}
          <div className="rounded-[28px] bg-white border border-[#EAE4D9] p-5 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#4F6B57]" />
                  <h4 className="font-serif text-base font-normal text-[#233226]">
                    All 23 Doodle Pictures
                  </h4>
                </div>
                <span className="text-xs text-[#78897B] font-medium">
                  {filteredDoodles.length} pictures
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                      selectedCategory === cat
                        ? 'bg-[#4F6B57] text-white shadow-2xs'
                        : 'bg-[#FAF7F2] text-[#56685A] hover:bg-[#EAE4D9]'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Image Cards Grid (2 cols) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {filteredDoodles.map((doodle) => {
                const isSelected = selectedDoodleId === doodle.id;
                return (
                  <button
                    key={doodle.id}
                    type="button"
                    onClick={() => setSelectedDoodleId(doodle.id)}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-2xl border text-center transition-all cursor-pointer group relative',
                      isSelected
                        ? 'border-[#4F6B57] bg-[#F4F8F5] ring-2 ring-[#4F6B57]/30 shadow-xs scale-102'
                        : 'border-[#EAE4D9] bg-white hover:bg-[#FAF7F2] hover:border-[#4F6B57]/30'
                    )}
                  >
                    {/* Picture Thumbnail */}
                    <div className="relative h-20 w-20 flex items-center justify-center p-1 rounded-xl bg-white border border-[#EAE4D9] shadow-2xs">
                      <img
                        src={doodle.imageUrl}
                        alt={doodle.title}
                        className="h-full w-full object-contain"
                      />
                      <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#243327] text-[9px] font-bold text-white">
                        {doodle.id}
                      </span>
                    </div>

                    <div className="flex flex-col w-full mt-2">
                      <span className="text-xs font-semibold text-[#243327] truncate">
                        {doodle.title}
                      </span>
                      <span className="text-[10px] text-[#78897B] truncate">
                        {doodle.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
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
            className="relative max-w-lg w-full rounded-[32px] bg-white p-6 sm:p-8 border border-[#EAE4D9] shadow-2xl flex flex-col items-center text-center gap-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomModalOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF7F2] border border-[#D9D2C5] text-[#243327] hover:bg-[#EAE4D9] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <span className="rounded-full bg-[#E8F0EA] px-3 py-1 text-xs font-bold text-[#4F6B57]">
              Picture #{currentDoodle.id} • {currentDoodle.category}
            </span>

            <div className="h-64 w-64 rounded-2xl bg-[#FAF7F2] border border-[#EAE4D9] p-4 flex items-center justify-center shadow-inner">
              <img
                src={currentDoodle.imageUrl}
                alt={currentDoodle.title}
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-normal text-[#233226]">
                {currentDoodle.title}
              </h3>
              <p className="text-xs text-[#56685A] mt-1 italic">
                "{currentDoodle.tagline}"
              </p>
            </div>

            <div className="w-full text-left rounded-2xl bg-[#FAF7F2] border border-[#EAE4D9] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4F6B57]">
                Instructions:
              </span>
              <ul className="flex flex-col gap-1 text-xs text-[#243327] mt-1.5">
                {currentDoodle.instructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#4F6B57] text-[10px] font-bold text-white mt-0.5">
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F6B57] hover:bg-[#3E5545] text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
