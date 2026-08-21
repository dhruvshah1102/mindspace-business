import { useState } from 'react';
import {
  Eye,
  Hand,
  Volume2,
  Flower2,
  Heart,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  number: number;
  sense: string;
  title: string;
  instruction: string;
  icon: any;
  accent: string;
  prompt: string;
  examples: string[];
}

const GROUNDING_STEPS: Step[] = [
  {
    number: 5,
    sense: 'Sight',
    title: '5 Things You Can SEE',
    instruction: 'Look around you right now. Spot 5 specific items in your environment.',
    icon: Eye,
    accent: 'bg-[#E6F3F1] text-[#2C8C82]',
    prompt: 'Name 5 things you can visually see (e.g., a shadow, a pen, light reflection, a plant, a coffee mug).',
    examples: ['Desk lamp', 'Plant on shelf', 'Sunlight on floor', 'A blue book', 'Window frame'],
  },
  {
    number: 4,
    sense: 'Touch',
    title: '4 Things You Can FEEL / TOUCH',
    instruction: 'Pay attention to physical contact and textures against your body.',
    icon: Hand,
    accent: 'bg-[#E8F0EA] text-[#2D6A4F]',
    prompt: 'Feel 4 physical sensations (e.g., feet on the floor, texture of your sleeve, back against the chair, cool air on hands).',
    examples: ['Feet firm on floor', 'Fabric of shirt', 'Smooth desk surface', 'Cool air on skin'],
  },
  {
    number: 3,
    sense: 'Hearing',
    title: '3 Things You Can HEAR',
    instruction: 'Listen carefully beyond immediate room sounds.',
    icon: Volume2,
    accent: 'bg-[#E7EFFA] text-[#3B6FA6]',
    prompt: 'Identify 3 sounds in your space (e.g., air conditioning hum, distant traffic, your own steady breath, clock tick).',
    examples: ['Hum of laptop fan', 'Distant birds or street', 'Sound of breathing'],
  },
  {
    number: 2,
    sense: 'Smell',
    title: '2 Things You Can SMELL',
    instruction: 'Take a gentle breath in through your nose.',
    icon: Flower2,
    accent: 'bg-[#F1EAFB] text-[#7C5FA6]',
    prompt: 'Notice 2 scents around you (e.g., fresh air, coffee, hand lotion, linen). If you smell nothing, imagine your favorite calming scent.',
    examples: ['A cup of tea or coffee', 'Fresh air / gentle lotion'],
  },
  {
    number: 1,
    sense: 'Taste / Gratitude',
    title: '1 Thing You Can TASTE or FEEL GRATEFUL FOR',
    instruction: 'Notice the lingering taste in your mouth, or anchor yourself in one genuine positive truth.',
    icon: Heart,
    accent: 'bg-[#FBEAF0] text-[#B5507B]',
    prompt: 'Acknowledge 1 comforting taste (water, mint) or tell yourself: "I am safe in this present moment."',
    examples: ['Sip of cool water', '"I am safe and this feeling will pass"'],
  },
];

export function GroundingExercise() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userObservations, setUserObservations] = useState<Record<number, string>>({});

  const currentStep = GROUNDING_STEPS[currentStepIndex];
  const isCompleted = completedSteps.length === GROUNDING_STEPS.length;

  const handleCompleteCurrentStep = () => {
    if (!completedSteps.includes(currentStep.number)) {
      setCompletedSteps((prev) => [...prev, currentStep.number]);
    }
    if (currentStepIndex < GROUNDING_STEPS.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setUserObservations({});
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Intro explanation */}
      <div className="rounded-2xl bg-white border border-[#EAE4D9] p-5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F0EA] text-xs font-bold text-[#2D6A4F]">
              5-4-3-2-1
            </span>
            <h3 className="text-lg font-semibold text-[#233226]">Sensory Grounding Protocol</h3>
          </div>
          <span className="text-xs text-[#78897B] font-medium">
            {completedSteps.length} of 5 Anchors
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
          When panic or acute anxiety strikes, your brain's alarm center takes over. This clinically proven technique shifts blood flow from the alarm center back into your sensory cortex, bringing immediate stabilization.
        </p>
      </div>

      {/* Progress Dots / Steps */}
      <div className="grid grid-cols-5 gap-2">
        {GROUNDING_STEPS.map((step, idx) => {
          const isDone = completedSteps.includes(step.number);
          const isCurrent = currentStepIndex === idx;
          const Icon = step.icon;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => setCurrentStepIndex(idx)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-2xl p-2.5 sm:p-3 border transition-all cursor-pointer text-center',
                isCurrent
                  ? 'border-[#2D6A4F] bg-[#FAF7F2] ring-2 ring-[#2D6A4F]/30'
                  : isDone
                  ? 'border-[#C5DBC8] bg-[#F4F8F5] text-[#243327]'
                  : 'border-[#EAE4D9] bg-white opacity-70 hover:opacity-100'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-transform',
                  isDone
                    ? 'bg-[#2D6A4F] text-white'
                    : isCurrent
                    ? 'bg-[#243327] text-white scale-105'
                    : 'bg-[#F3EFE8] text-[#78897B]'
                )}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.number}
              </div>
              <span className="text-[11px] font-semibold truncate w-full hidden sm:inline">
                {step.sense}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Step Card */}
      {!isCompleted ? (
        <div className="rounded-2xl bg-white border border-[#EAE4D9] p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl',
                  currentStep.accent
                )}
              >
                {(() => {
                  const Icon = currentStep.icon;
                  return <Icon className="h-6 w-6" />;
                })()}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F]">
                  Step {5 - currentStepIndex} of 5
                </span>
                <h4 className="text-xl sm:text-2xl font-semibold text-[#233226]">
                  {currentStep.title}
                </h4>
              </div>
            </div>

            <span className="rounded-full bg-[#FAF7F2] px-3 py-1 text-xs font-medium text-[#78897B] border border-[#EAE4D9]">
              Anchor #{currentStep.number}
            </span>
          </div>

          <p className="text-sm sm:text-base text-[#243327] font-medium leading-relaxed">
            {currentStep.instruction}
          </p>

          {/* Prompt + Example Pills */}
          <div className="flex flex-col gap-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE4D9] p-4">
            <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
              {currentStep.prompt}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-semibold text-[#78897B] self-center">Ideas:</span>
              {currentStep.examples.map((ex) => (
                <span
                  key={ex}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-[#2D6A4F] border border-[#D9D2C5]"
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Optional notes box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#78897B]">
              Type your anchors here (optional, helps deepen focus):
            </label>
            <textarea
              rows={2}
              value={userObservations[currentStep.number] || ''}
              onChange={(e) =>
                setUserObservations((prev) => ({
                  ...prev,
                  [currentStep.number]: e.target.value,
                }))
              }
              placeholder="e.g., I see the sunlight through the glass, the green plant, my wooden coaster..."
              className="w-full rounded-xl border border-[#D9D2C5] bg-white p-3 text-xs sm:text-sm text-[#243327] placeholder:text-[#9AA79C] focus:border-[#2D6A4F] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-[#EAE4D9]">
            <button
              type="button"
              onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
              disabled={currentStepIndex === 0}
              className="text-xs font-semibold text-[#78897B] hover:text-[#233226] disabled:opacity-30 disabled:hover:text-[#78897B] cursor-pointer"
            >
              Previous Anchor
            </button>

            <button
              type="button"
              onClick={handleCompleteCurrentStep}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#234F3B] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Done & Next Anchor</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Complete Success Screen */
        <div className="rounded-2xl bg-[#F4F8F5] border border-[#C5DBC8] p-8 sm:p-10 flex flex-col items-center text-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2D6A4F] text-white">
            <Sparkles className="h-8 w-8" />
          </div>

          <div className="flex flex-col gap-2 max-w-lg">
            <h4 className="text-2xl sm:text-3xl font-semibold text-[#233226]">
              You are here. You are safe.
            </h4>
            <p className="text-xs sm:text-sm text-[#56685A] leading-relaxed">
              Take one slow, deep breath in and let your shoulders drop. You've grounded your five senses in this exact physical reality. The surge is settling down.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-[#F3EFE8] text-[#243327] border border-[#D9D2C5] px-4 py-2 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Repeat Grounding</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroundingExercise;
