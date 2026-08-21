import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Wind, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type BreathingPattern = 'box' | '478' | 'calm';

interface PatternConfig {
  name: string;
  tag: string;
  description: string;
  phases: { name: string; duration: number }[];
}

const PATTERNS: Record<BreathingPattern, PatternConfig> = {
  box: {
    name: '4-4-4-4 Box Breathing',
    tag: 'Navy SEAL Stress Reset',
    description: 'Equal inhalation, hold, exhalation, and empty hold to rapidly stabilize the autonomic nervous system.',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Hold', duration: 4 },
      { name: 'Exhale', duration: 4 },
      { name: 'Hold Empty', duration: 4 },
    ],
  },
  '478': {
    name: '4-7-8 Deep Sleep & Anxiety Calmer',
    tag: 'Parasympathetic Activator',
    description: 'Dr. Andrew Weil technique that acts as a natural tranquilizer for the nervous system.',
    phases: [
      { name: 'Inhale gently', duration: 4 },
      { name: 'Hold breath', duration: 7 },
      { name: 'Exhale completely', duration: 8 },
    ],
  },
  calm: {
    name: '4-6 Extended Exhale',
    tag: 'Quick Heart Rate Reducer',
    description: 'Longer exhalations signal safety to the vagus nerve, quickly slowing a racing pulse.',
    phases: [
      { name: 'Inhale', duration: 4 },
      { name: 'Exhale slowly', duration: 6 },
    ],
  },
};

export function BreathingCalmer() {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>('box');
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  const pattern = PATTERNS[selectedPattern];
  const currentPhase = pattern.phases[phaseIndex];

  // Timer logic
  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t > 1) {
          return t - 1;
        } else {
          // Advance phase
          setPhaseIndex((curr) => {
            const next = (curr + 1) % pattern.phases.length;
            if (next === 0) {
              setCompletedCycles((c) => c + 1);
            }
            return next;
          });
          return pattern.phases[(phaseIndex + 1) % pattern.phases.length].duration;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phaseIndex, pattern.phases]);

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      setPhaseIndex(0);
      setTimeLeft(pattern.phases[0].duration);
    }
  };

  const handleSelectPattern = (key: BreathingPattern) => {
    setSelectedPattern(key);
    setIsActive(false);
    setPhaseIndex(0);
    setTimeLeft(PATTERNS[key].phases[0].duration);
  };

  // Determine circle scale for animation
  const isExpanding = currentPhase.name.toLowerCase().includes('inhale');
  const isHolding = currentPhase.name.toLowerCase().includes('hold');

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Pattern Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {(Object.keys(PATTERNS) as BreathingPattern[]).map((key) => {
          const p = PATTERNS[key];
          const isSelected = selectedPattern === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPattern(key)}
              className={cn(
                'flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer',
                isSelected
                  ? 'border-[#2D6A4F] bg-[#FAF7F2] ring-2 ring-[#2D6A4F]/30'
                  : 'border-[#EAE4D9] bg-white hover:bg-[#FAF7F2]/60'
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                {p.tag}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#243327] mt-0.5">
                {p.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Breathing Circle Stage */}
      <div className="rounded-2xl bg-[#F3EFE8] border border-[#EAE4D9] p-6 sm:p-12 flex flex-col items-center justify-center text-center gap-8 relative overflow-hidden">
        {/* Animated breathing orb */}
        <div className="relative flex h-48 w-48 sm:h-64 sm:w-64 items-center justify-center">
          {/* Outer glow waves */}
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-[#2D6A4F]/10 transition-all duration-1000 ease-in-out',
              isActive && isExpanding && 'scale-125 opacity-100 bg-[#2D6A4F]/20',
              isActive && isHolding && 'scale-115 opacity-80 bg-[#735A88]/20',
              isActive && !isExpanding && !isHolding && 'scale-90 opacity-40'
            )}
          />

          {/* Main circle */}
          <div
            className={cn(
              'relative flex h-36 w-36 sm:h-48 sm:w-48 flex-col items-center justify-center rounded-full shadow-lg border transition-all duration-1000 ease-in-out',
              isActive && isExpanding
                ? 'scale-110 bg-[#2D6A4F] border-[#234F3B] text-white'
                : isActive && isHolding
                ? 'scale-105 bg-[#59446B] border-[#443353] text-white'
                : isActive
                ? 'scale-90 bg-[#344B3B] border-[#25372B] text-white'
                : 'bg-white border-[#D9D2C5] text-[#243327]'
            )}
          >
            <span className="text-[11px] uppercase tracking-widest font-medium opacity-80">
              {isActive ? currentPhase.name : 'Paced Breath'}
            </span>
            <span className="text-4xl sm:text-5xl font-semibold mt-1">
              {isActive ? timeLeft : 'Ready'}
            </span>
            {isActive && (
              <span className="text-[10px] opacity-75 mt-1">
                seconds remaining
              </span>
            )}
          </div>
        </div>

        {/* Instructions & Phase Details */}
        <div className="flex flex-col items-center gap-2 max-w-md">
          <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
            {pattern.description}
          </p>
          {completedCycles > 0 && (
            <span className="text-xs font-semibold text-[#2D6A4F] bg-[#E8F0EA] px-3 py-0.5 rounded-full">
              {completedCycles} full {completedCycles === 1 ? 'cycle' : 'cycles'} completed
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors cursor-pointer',
              isActive
                ? 'bg-[#243327] hover:bg-[#1A261D] text-white'
                : 'bg-[#2D6A4F] hover:bg-[#234F3B] text-white'
            )}
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isActive ? 'Pause Breathing' : 'Start Paced Breathing'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BreathingCalmer;
