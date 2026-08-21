import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Compass,
  CheckCircle2,
  ShieldCheck,
  PhoneCall,
  Activity,
  Layers,
  Wind,
  Eye,
  Feather,
  Volume2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DoodleCanvas } from './components/DoodleCanvas';
import { GroundingExercise } from './components/GroundingExercise';
import { BreathingCalmer } from './components/BreathingCalmer';
import { WorryDissolver } from './components/WorryDissolver';
import { AmbientSoundPlayer } from './components/AmbientSoundPlayer';
import {
  analyzeFeelingWithLLM,
  type LLMSuggestionResponse,
} from '@/services/self-help-llm-service';

type TabType = 'doodle' | 'grounding' | 'breathing' | 'dissolve' | 'sounds';

const QUICK_FEELINGS = [
  { label: 'Panic & Fast Heartbeat', query: 'I am having a panic attack, my heart is beating fast and I feel breathless.' },
  { label: 'Severe Anxiety & Dread', query: 'I feel intense anxiety and dread about my work and deadlines.' },
  { label: 'Depressed & Low Energy', query: 'I feel sad, empty, unmotivated, and exhausted.' },
  { label: 'Burnt Out & Overwhelmed', query: 'I am overwhelmed by constant work pressure and mental fatigue.' },
  { label: 'Racing Thoughts & Insomnia', query: 'My brain won’t stop spinning with 100 thoughts and I cannot concentrate.' },
  { label: 'Anger & Frustration', query: 'I feel irritated, tense, and angry with everything around me.' },
];

export function SelfHelpPage() {
  const [searchParams] = useSearchParams();
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('doodle');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<LLMSuggestionResponse | null>(null);

  // Sync tab from URL if present
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['doodle', 'grounding', 'breathing', 'dissolve', 'sounds'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Handle Feeling Submission
  const handleAnalyze = async (queryToUse?: string) => {
    const query = (queryToUse ?? inputText).trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const res = await analyzeFeelingWithLLM(query);
      setSuggestion(res);
      if (res.matchedToolId) {
        setActiveTab(res.matchedToolId);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickFeeling = (item: typeof QUICK_FEELINGS[0]) => {
    setInputText(item.query);
    handleAnalyze(item.query);
  };

  return (
    <div className="flex flex-col gap-6 pb-16 font-sans">
      {/* SECTION 1: Top Direct Feeling Check-in (At the very top) */}
      <section className="rounded-[24px] bg-white p-5 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#233226]">
              How are you feeling right now?
            </h1>
            <p className="text-xs sm:text-sm text-[#78897B] mt-0.5">
              Type what you're experiencing. We'll suggest matching interactive tools or generate custom self-help activities for you.
            </p>
          </div>
          <span className="text-[11px] font-medium text-[#4F6B57] bg-[#E8F0EA] px-2.5 py-1 rounded-full self-start sm:self-center">
            Private & Confidential
          </span>
        </div>

        {/* Quick Situation Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_FEELINGS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSelectQuickFeeling(item)}
              className="rounded-xl bg-[#FAF7F2] hover:bg-[#F3EFE8] text-[#243327] border border-[#EAE4D9] hover:border-[#4F6B57]/40 px-3 py-1.5 text-xs font-medium transition-all cursor-pointer shadow-2xs"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Text Input & Submit */}
        <div className="flex flex-col gap-3 pt-1">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe what is on your mind or how your body feels (e.g. 'I feel a sudden panic attack...', 'I'm exhausted and hopeless...', 'Everything is moving too fast...')"
            className="w-full rounded-2xl border border-[#D9D2C5] bg-[#FAF7F2]/40 p-3.5 text-xs sm:text-sm text-[#243327] placeholder:text-[#9AA79C] focus:border-[#4F6B57] focus:bg-white focus:outline-none transition-all"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#78897B] hidden sm:inline">
              Powered by mental wellbeing insights
            </span>

            <button
              type="button"
              onClick={() => handleAnalyze()}
              disabled={!inputText.trim() || isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F6B57] hover:bg-[#3E5545] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing feeling...</span>
                </>
              ) : (
                <>
                  <Compass className="h-4 w-4" />
                  <span>Get Activities & Guidance</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic LLM Results: Empathy Note & Custom Tailored Activity */}
        {suggestion && !isLoading && (
          <div className="flex flex-col gap-3.5 pt-2 border-t border-[#EAE4D9] animate-fade-in">
            {/* Empathetic Insight Note */}
            <div className="rounded-2xl bg-[#F4F8F5] border border-[#D5E5D8] p-4 flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#4F6B57] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F6B57]">
                  Guidance Note
                </span>
                <p className="text-xs sm:text-sm text-[#233226] leading-relaxed">
                  {suggestion.empathyVerdict}
                </p>
              </div>
            </div>

            {/* Custom Generated Activity from LLM in Text Format */}
            {suggestion.customActivity && (
              <div className="rounded-2xl bg-white border border-[#D9D2C5] p-4 sm:p-5 shadow-2xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#243327] text-white text-xs font-bold">
                      ★
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-normal text-[#233226]">
                      Recommended Custom Activity: {suggestion.customActivity.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-[#4F6B57] bg-[#E8F0EA] px-2.5 py-0.5 rounded-full">
                    {suggestion.customActivity.duration}
                  </span>
                </div>

                <p className="text-xs text-[#56685A] leading-relaxed">
                  {suggestion.customActivity.description}
                </p>

                <div className="rounded-xl bg-[#FAF7F2] border border-[#EAE4D9] p-3 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#78897B]">
                    Action Steps:
                  </span>
                  <ul className="flex flex-col gap-1 text-xs text-[#243327]">
                    {suggestion.customActivity.steps.map((step, i) => (
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
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: Interactive Self-Help Tools & Doodling Canvas */}
      <section className="flex flex-col gap-4">
        {/* Navigation Tabs for Tools */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            {
              id: 'doodle' as TabType,
              label: 'Zen Doodling (23 Pictures)',
              icon: Layers,
            },
            {
              id: 'grounding' as TabType,
              label: '5-4-3-2-1 Grounding',
              icon: Eye,
            },
            {
              id: 'breathing' as TabType,
              label: 'Paced Breathing',
              icon: Wind,
            },
            {
              id: 'dissolve' as TabType,
              label: 'Thought Dissolver',
              icon: Feather,
            },
            {
              id: 'sounds' as TabType,
              label: 'Ambient Soundscapes',
              icon: Volume2,
            },
          ].map((tab) => {
            const isCurrent = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 shrink-0 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer border shadow-2xs',
                  isCurrent
                    ? 'bg-[#243327] text-white border-[#243327] shadow-xs'
                    : 'bg-white text-[#56685A] border-[#EAE4D9] hover:bg-[#FAF7F2] hover:text-[#233226]'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="w-full">
          {activeTab === 'doodle' && <DoodleCanvas />}
          {activeTab === 'grounding' && <GroundingExercise />}
          {activeTab === 'breathing' && <BreathingCalmer />}
          {activeTab === 'dissolve' && <WorryDissolver />}
          {activeTab === 'sounds' && <AmbientSoundPlayer />}
        </div>
      </section>

      {/* SECTION 3: Minimalist Crisis & Support Strip */}
      <section className="rounded-2xl bg-white p-4 border border-[#EAE4D9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#56685A]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#4F6B57]" />
          <span>Need live human support? 100% confidential assistance is available 24/7.</span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="tel:988"
            className="font-semibold text-[#243327] hover:underline flex items-center gap-1"
          >
            <PhoneCall className="h-3.5 w-3.5 text-rose-600" />
            <span>Crisis Line (988)</span>
          </a>
          <span className="text-[#D9D2C5]">|</span>
          <a
            href="mailto:wellbeing@accenture.com"
            className="font-semibold text-[#4F6B57] hover:underline"
          >
            Accenture EAP Desk
          </a>
        </div>
      </section>
    </div>
  );
}

export default SelfHelpPage;
