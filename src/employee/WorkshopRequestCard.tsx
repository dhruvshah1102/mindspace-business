import { useState, type FormEvent } from 'react';
import { Check, Loader2, PartyPopper } from 'lucide-react';
import { useEmployeeAuth } from '@/app/EmployeeAuthContext';
import { useTenant } from '@/app/TenantContext';
import { cn } from '@/lib/utils';
import { submitWorkshopRequest, WORKSHOP_TOPICS, type WorkshopTopic } from '@/services/workshop-service';

/**
 * A suggestion box, not a ticket queue — HR only ever sees "N requests for
 * Sleep & recovery" on the Actions page, never who asked. That's why there's
 * no "your requests" list here the way BookSessionPage has one: showing an
 * employee their own history would be fine privacy-wise, but it would imply
 * this is tracked/followed-up per-request, when really it's just a signal
 * that rolls into an aggregate count.
 */
export function WorkshopRequestCard() {
  const { user } = useEmployeeAuth();
  const { organization } = useTenant();
  const [topic, setTopic] = useState<WorkshopTopic | ''>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !topic) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitWorkshopRequest(user.id, organization.orgId, { topic, details });
      setSent(true);
      setTopic('');
      setDetails('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[28px] bg-white p-6 sm:p-7 border border-[#EAE4D9] shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#233226]">Request a workshop</h2>
          <p className="text-xs text-[#78897B] mt-0.5">
            HR sees a count per topic, never who asked.
          </p>
        </div>
        <span className="text-xs font-medium text-[#2D6A4F] bg-[#E8F0EA] px-3 py-1 rounded-full shrink-0">
          Anonymous
        </span>
      </div>

      {sent ? (
        <div className="rounded-2xl border border-[#B7D3BC] bg-[#EAF3EB] px-4 py-3.5 flex items-start gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#2F7F4C]" />
          <div className="flex-1">
            <p className="text-xs sm:text-sm leading-relaxed text-[#233226]">
              Request sent. Added to the count for this topic.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-2 text-xs font-semibold text-[#2D6A4F] hover:underline cursor-pointer"
            >
              Request another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="workshop-topic" className="text-xs font-medium text-[#233226]">
              Workshop topic
            </label>
            <select
              id="workshop-topic"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value as WorkshopTopic)}
              className="rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-4 py-2.5 text-xs sm:text-sm text-[#233226] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/40 focus:border-[#2D6A4F]"
            >
              <option value="" disabled>
                Choose a topic…
              </option>
              {WORKSHOP_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="workshop-details" className="text-xs font-medium text-[#233226]">
              Details <span className="font-normal text-[#78897B]">(optional, private)</span>
            </label>
            <textarea
              id="workshop-details"
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={280}
              placeholder="e.g. something for new managers on setting boundaries"
              className="resize-none rounded-xl border border-[#D9D2C5] bg-[#FAF7F2] px-4 py-2.5 text-xs sm:text-sm text-[#233226] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/40 focus:border-[#2D6A4F]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!topic || submitting}
            className={cn(
              'inline-flex items-center justify-center gap-2 self-start rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all',
              topic && !submitting
                ? 'bg-[#2D6A4F] hover:bg-[#234F3B] text-white shadow-xs hover:scale-105 cursor-pointer'
                : 'bg-[#EAE4D9] text-[#8C9B8F] cursor-not-allowed',
            )}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PartyPopper className="h-4 w-4" />}
            <span>{submitting ? 'Sending…' : 'Submit request'}</span>
          </button>
        </form>
      )}
    </section>
  );
}
