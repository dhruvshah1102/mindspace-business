import { Users, BarChart3, Building2, Flame, Moon, Clock, Trophy, MessageSquareText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CompanyExecutiveReport } from '@/domain/report-generator';
import type { Theme } from '@/domain/themes';

interface Props {
  report: CompanyExecutiveReport;
}

const THEME_ICONS: Partial<Record<Theme, React.ElementType>> = {
  workload: Flame,
  sleep: Moon,
  long_hours: Clock,
  recognition: Trophy,
  manager_relationship: MessageSquareText,
};

export function ResponseBreakdownCard({ report }: Props) {
  const { responseBreakdown } = report;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Overall Workforce Sentiment Distribution */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ds-tint text-ds-deep">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Workforce Wellbeing & Sentiment Distribution</CardTitle>
                <CardDescription className="text-xs">
                  Aggregated response breakdown across {responseBreakdown.participants} surveyed employees
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Visual Stacked Progress Bar */}
          <div className="flex h-4 w-full overflow-hidden rounded-full bg-ds-tint/80 p-0.5">
            {responseBreakdown.sentimentDistribution.map((tier) => (
              <div
                key={tier.tier}
                className={`${tier.colorClass} h-full transition-all`}
                style={{ width: `${tier.percentage}%` }}
                title={`${tier.label}: ${tier.employeeCount} employees (${tier.percentage}%)`}
              />
            ))}
          </div>

          {/* Detailed Tier Grid with Exact Headcounts */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {responseBreakdown.sentimentDistribution.map((tier) => (
              <div
                key={tier.tier}
                className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-3.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-ds-base">{tier.label}</span>
                    <span className="rounded-full bg-ds-tint px-2 py-0.5 text-[11px] font-bold tabular-nums text-ds-deep">
                      {tier.percentage}%
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-ds-base">
                    {tier.employeeCount}{' '}
                    <span className="text-xs font-normal text-muted-foreground">employees</span>
                  </p>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground leading-tight">{tier.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 2. Top Workplace Challenges & Department Spotlights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Specific Issues Cited by Employees */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-ds-deep" />
              <span>Top Challenges Cited by Employees</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Direct response frequencies from anonymous assessments & TARA conversations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {responseBreakdown.topIssuesReported.map((issue) => {
              const Icon = THEME_ICONS[issue.theme] ?? Flame;
              return (
                <div
                  key={issue.theme}
                  className="flex flex-col gap-1.5 rounded-xl border border-border/60 p-3.5 transition-colors hover:bg-ds-tint/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ds-tint text-ds-deep">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ds-base">{issue.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Affecting <strong className="text-ds-base font-semibold">{issue.affectedEmployeesCount} employees</strong> ({issue.percentage}% of workforce) · {issue.conversationMentions} mentions
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        issue.severity === 'high'
                          ? 'high'
                          : issue.severity === 'moderate'
                          ? 'moderate'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {issue.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{issue.impactDescription}</p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-ds-deep font-medium">
                    <span>Concentrated in:</span>
                    {issue.primaryDepartments.map((dept) => (
                      <span key={dept} className="rounded-md bg-ds-tint/80 px-1.5 py-0.5 text-[10px]">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Department-by-Department Sentiment Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-ds-deep" />
              <span>How Each Department is Feeling</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Departmental sentiment health & primary driver summaries
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {responseBreakdown.departmentSpotlights.map((dept) => (
              <div
                key={dept.department}
                className="flex flex-col gap-1.5 rounded-xl border border-border/60 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-ds-base">{dept.department}</span>
                    <span className="text-xs text-muted-foreground">({dept.headcount} employees)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {dept.strainPercent}% strain
                    </span>
                    <Badge
                      variant={
                        dept.status === 'critical'
                          ? 'high'
                          : dept.status === 'warning'
                          ? 'moderate'
                          : 'low'
                      }
                      className="text-[10px]"
                    >
                      {dept.status === 'critical'
                        ? 'Needs Attention'
                        : dept.status === 'warning'
                        ? 'Moderate Risk'
                        : 'Healthy'}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs font-medium text-ds-deep">{dept.primaryIssue}</p>
                <p className="text-xs text-muted-foreground">{dept.sentimentSummary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
