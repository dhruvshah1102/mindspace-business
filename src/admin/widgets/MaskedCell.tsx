import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Never renders zero or an approximation for a cell below k-anonymity —
 * implementation.md §6: "Not enough responses" is the only allowed content. */
export function MaskedCell({ k }: { k: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Not enough responses
        </div>
      </TooltipTrigger>
      <TooltipContent>Fewer than {k} respondents, hidden to protect individual privacy.</TooltipContent>
    </Tooltip>
  );
}
