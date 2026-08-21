import { useState } from 'react';
import { Sparkles, Wind, RefreshCw, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WorryDissolver() {
  const [worryText, setWorryText] = useState('');
  const [isDissolving, setIsDissolving] = useState(false);
  const [dissolvedCount, setDissolvedCount] = useState(0);
  const [lastReleased, setLastReleased] = useState<string | null>(null);

  const handleDissolve = () => {
    if (!worryText.trim() || isDissolving) return;
    setIsDissolving(true);
    setLastReleased(worryText.trim());

    setTimeout(() => {
      setWorryText('');
      setIsDissolving(false);
      setDissolvedCount((c) => c + 1);
    }, 2400);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Overview header */}
      <div className="rounded-2xl bg-white border border-[#EAE4D9] p-5 shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE6F2] text-[#735A88]">
              <Feather className="h-4 w-4" />
            </div>
            <h3 className="font-serif text-lg font-normal text-[#233226]">Mindful Thought Release</h3>
          </div>
          {dissolvedCount > 0 && (
            <span className="text-xs font-semibold text-[#4F6B57] bg-[#E8F0EA] px-3 py-1 rounded-full">
              {dissolvedCount} {dissolvedCount === 1 ? 'thought' : 'thoughts'} released
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
          In cognitive behavioral psychology, externalizing a ruminating thought by writing it down and metaphorically letting it go unhooks your mind from the anxiety loop. You are not your thoughts; they are passing mental events.
        </p>
      </div>

      {/* Main Release Box */}
      <div className="rounded-[28px] bg-gradient-to-br from-[#FAF7F2] to-[#F2EDE4] border border-[#EAE4D9] p-6 sm:p-8 shadow-xs flex flex-col gap-5 relative overflow-hidden">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#78897B]">
          What distressing thought or worry is looping in your head?
        </label>

        <div className="relative">
          <textarea
            rows={4}
            value={worryText}
            disabled={isDissolving}
            onChange={(e) => setWorryText(e.target.value)}
            placeholder="e.g., 'I will mess up this deliverable and lose everyone's respect', 'I feel so inadequate and exhausted'..."
            className={cn(
              'w-full rounded-2xl border border-[#D9D2C5] bg-white p-4 text-sm sm:text-base text-[#243327] placeholder:text-[#9AA79C] focus:border-[#4F6B57] focus:outline-none transition-all',
              isDissolving && 'opacity-0 scale-95 blur-md duration-2000'
            )}
          />

          {isDissolving && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3 animate-fade-in pointer-events-none">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4F6B57] text-white shadow-lg animate-bounce">
                <Wind className="h-6 w-6" />
              </div>
              <p className="font-serif text-lg font-normal text-[#233226]">
                Dissolving into the breeze…
              </p>
              <p className="text-xs text-[#56685A]">
                You have acknowledged it. Now let it drift away without judgment.
              </p>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-xs text-[#78897B] italic">
            Confidential · This thought is never stored or sent anywhere.
          </p>

          <button
            type="button"
            onClick={handleDissolve}
            disabled={!worryText.trim() || isDissolving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F6B57] hover:bg-[#3E5545] disabled:opacity-30 disabled:cursor-not-allowed text-white px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>Release & Dissolve Thought</span>
          </button>
        </div>
      </div>

      {/* Reassurance Banner after release */}
      {lastReleased && !isDissolving && (
        <div className="rounded-2xl bg-[#F4F8F5] border border-[#D5E5D8] p-4 flex items-center gap-3 animate-fade-in">
          <Sparkles className="h-5 w-5 text-[#4F6B57] shrink-0" />
          <p className="text-xs sm:text-sm text-[#233226]">
            <strong>Thought released.</strong> Notice that the thought exists independently of you. You are the sky, and that thought was just a passing storm cloud.
          </p>
        </div>
      )}
    </div>
  );
}

export default WorryDissolver;
