"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AnalysisData = {
  globalDscr: number | null;
  propertyDscr: number | null;
  frontEndDti: number | null;
  backEndDti: number | null;
  monthsOfReserves: number | null;
  riskScore: number;
  totalGrossIncome: string | null;
  totalNetIncome: string | null;
  incomeTrend: string | null;
  incomeSources: unknown;
  avgDailyBalance: string | null;
  avgMonthlyDeposits: string | null;
  depositVsIncome: number | null;
  nsfCount: number | null;
  largeDeposits: unknown;
  revenueByYear: unknown;
  expenseRatio: number | null;
  ownerComp: string | null;
  addBacks: unknown;
  riskFlags: unknown;
  ltv: number | null;
  fullResults: unknown;
};

type AnalysisResultsProps = {
  analysis: AnalysisData;
};

type RatingConfig = {
  label: string;
  className: string;
};

function getDscrRating(value: number | null): RatingConfig {
  if (value === null) return { label: "N/A", className: "bg-muted text-muted-foreground" };
  if (value >= 1.4) return { label: "Strong", className: "bg-primary/10 text-primary" };
  if (value >= 1.2) return { label: "Adequate", className: "bg-chart-4/20 text-chart-4" };
  return { label: "Weak", className: "bg-destructive/10 text-destructive" };
}

function getDtiRating(value: number | null): RatingConfig {
  if (value === null) return { label: "N/A", className: "bg-muted text-muted-foreground" };
  if (value <= 28) return { label: "Excellent", className: "bg-primary/10 text-primary" };
  if (value <= 36) return { label: "Acceptable", className: "bg-chart-4/20 text-chart-4" };
  return { label: "High", className: "bg-destructive/10 text-destructive" };
}

function getBackDtiRating(value: number | null): RatingConfig {
  if (value === null) return { label: "N/A", className: "bg-muted text-muted-foreground" };
  if (value <= 36) return { label: "Excellent", className: "bg-primary/10 text-primary" };
  if (value <= 43) return { label: "Acceptable", className: "bg-chart-4/20 text-chart-4" };
  return { label: "High", className: "bg-destructive/10 text-destructive" };
}

function getReservesRating(value: number | null): RatingConfig {
  if (value === null) return { label: "N/A", className: "bg-muted text-muted-foreground" };
  if (value >= 6) return { label: "Strong", className: "bg-primary/10 text-primary" };
  if (value >= 3) return { label: "Adequate", className: "bg-chart-4/20 text-chart-4" };
  return { label: "Low", className: "bg-destructive/10 text-destructive" };
}

function formatPercent(value: number | null): string {
  if (value === null) return "--";
  return `${value.toFixed(1)}%`;
}

function formatDecimal(value: number | null): string {
  if (value === null) return "--";
  return value.toFixed(2);
}

function formatMonths(value: number | null): string {
  if (value === null) return "--";
  return `${value.toFixed(1)} mo`;
}

function formatCurrency(value: string | null): string {
  if (!value) return "--";
  const num = parseFloat(value);
  if (isNaN(num)) return "--";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const dscrRating = getDscrRating(analysis.globalDscr);
  const frontDtiRating = getDtiRating(analysis.frontEndDti);
  const backDtiRating = getBackDtiRating(analysis.backEndDti);
  const reservesRating = getReservesRating(analysis.monthsOfReserves);

  const ratioCards = [
    { label: "DSCR (Global)", value: formatDecimal(analysis.globalDscr), rating: dscrRating },
    { label: "Front-End DTI", value: formatPercent(analysis.frontEndDti), rating: frontDtiRating },
    { label: "Back-End DTI", value: formatPercent(analysis.backEndDti), rating: backDtiRating },
    { label: "Reserves", value: formatMonths(analysis.monthsOfReserves), rating: reservesRating },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ratioCards.map((card) => (
          <Card key={card.label} className="card-hover">
            <CardContent className="pt-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {card.label}
              </p>
              <p className="text-2xl font-semibold tracking-tight mt-1 tabular-nums">
                {card.value}
              </p>
              <span
                className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${card.rating.className}`}
              >
                {card.rating.label}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Overall Risk Score</p>
            <span className="text-2xl font-semibold tracking-tight">
              {analysis.riskScore.toFixed(0)}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                analysis.riskScore <= 30
                  ? "bg-chart-2"
                  : analysis.riskScore <= 60
                    ? "bg-chart-4"
                    : "bg-destructive"
              }`}
              style={{ width: `${Math.min(analysis.riskScore, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground font-medium">
            <span>Low Risk</span>
            <span>Moderate</span>
            <span>High Risk</span>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Gross Income", value: formatCurrency(analysis.totalGrossIncome) },
          { label: "Total Net Income", value: formatCurrency(analysis.totalNetIncome) },
          { label: "Income Trend", value: analysis.incomeTrend ?? "--", capitalize: true },
          { label: "LTV", value: formatPercent(analysis.ltv) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4 card-hover">
            <p className="text-xs text-muted-foreground font-medium">
              {stat.label}
            </p>
            <p className={`text-lg font-semibold tracking-tight mt-1 tabular-nums ${stat.capitalize ? "capitalize" : ""}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
