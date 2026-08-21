import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Pause, Waves, CloudRain, Wind, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type SoundType = 'rain' | 'ocean' | 'binaural' | 'forest';

interface SoundOption {
  id: SoundType;
  title: string;
  subtitle: string;
  icon: any;
}

const SOUNDS: SoundOption[] = [
  { id: 'rain', title: 'Gentle Rain', subtitle: 'Steady acoustic pink noise for focus', icon: CloudRain },
  { id: 'ocean', title: 'Ocean Tides', subtitle: 'Rhythmic oceanic surge for deep relaxation', icon: Waves },
  { id: 'binaural', title: '432 Hz Alpha Tone', subtitle: 'Harmonic frequency for nervous system calm', icon: Sparkles },
  { id: 'forest', title: 'Forest Breeze', subtitle: 'Low rustling wind for grounding', icon: Wind },
];

export function AmbientSoundPlayer() {
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const soundNodesRef = useRef<any[]>([]);

  // Stop all active Web Audio nodes
  const stopAudio = () => {
    soundNodesRef.current.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // ignore
      }
    });
    soundNodesRef.current = [];
    setIsPlaying(false);
  };

  // Play generative soundscape based on type
  const startSound = (type: SoundType) => {
    stopAudio();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    if (type === 'rain' || type === 'ocean' || type === 'forest') {
      // Create noise buffer (2 seconds loop)
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filtering
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter
      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, ctx.currentTime);
      } else if (type === 'forest') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);
      } else {
        // ocean waves modulation
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // Wave period ~8s
        lfoGain.gain.setValueAtTime(350, ctx.currentTime);
        lfo.connect(filter.frequency);
        lfo.start();
        soundNodesRef.current.push(lfo);
      }

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      soundNodesRef.current.push(noise);
    } else if (type === 'binaural') {
      // 432 Hz + 440 Hz alpha difference
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.15, ctx.currentTime);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, ctx.currentTime);

      osc1.connect(toneGain);
      osc2.connect(toneGain);
      toneGain.connect(masterGain);

      osc1.start();
      osc2.start();
      soundNodesRef.current.push(osc1, osc2);
    }

    setActiveSound(type);
    setIsPlaying(true);
  };

  // Update volume live
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume * 0.3, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const handleSelectSound = (sound: SoundOption) => {
    if (activeSound === sound.id && isPlaying) {
      stopAudio();
    } else {
      startSound(sound.id);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="rounded-2xl bg-white border border-[#EAE4D9] p-5 shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F0EA] text-[#4F6B57]">
              <Volume2 className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#233226]">Ambient Calming Soundscapes</h3>
          </div>
          {isPlaying && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3 py-0.5 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
              Playing Live
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
          Procedurally generated soothing sound waves that play directly in your browser. Use these with headphones while doodling or practicing paced breathing to mute background office chatter.
        </p>
      </div>

      {/* Sound Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SOUNDS.map((s) => {
          const isSelected = activeSound === s.id && isPlaying;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectSound(s)}
              className={cn(
                'flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer text-left',
                isSelected
                  ? 'border-[#4F6B57] bg-[#FAF7F2] ring-2 ring-[#4F6B57]/30 shadow-xs'
                  : 'border-[#EAE4D9] bg-white hover:bg-[#FAF7F2]/70'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    isSelected ? 'bg-[#4F6B57] text-white' : 'bg-[#FAF7F2] text-[#4F6B57] border border-[#EAE4D9]'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#243327]">{s.title}</h4>
                  <p className="text-[11px] text-[#78897B] mt-0.5">{s.subtitle}</p>
                </div>
              </div>

              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                  isSelected ? 'bg-[#4F6B57] text-white' : 'bg-[#F3EFE8] text-[#78897B]'
                )}
              >
                {isSelected ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Volume slider */}
      {isPlaying && (
        <div className="rounded-2xl bg-white border border-[#EAE4D9] p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#56685A]">
            <Volume2 className="h-4 w-4 text-[#4F6B57]" />
            <span>Volume</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-48 accent-[#4F6B57] cursor-pointer"
          />
          <button
            type="button"
            onClick={stopAudio}
            className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
          >
            Stop Audio
          </button>
        </div>
      )}
    </div>
  );
}

export default AmbientSoundPlayer;
