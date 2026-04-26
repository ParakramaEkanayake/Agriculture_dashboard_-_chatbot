export interface MetricColorStyle {
  lineColor: string;
  borderClass: string;
  badgeClass: string;
  gradientClass: string;
  textClass: string;
}

export const METRIC_COLOR_MAP: Record<string, MetricColorStyle> = {
  Temperature: {
    lineColor: "#2563eb",
    borderClass: "border-sky-500/70",
    badgeClass: "bg-white/10 text-sky-100",
    gradientClass: "bg-gradient-to-br from-sky-900 via-sky-900 to-sky-900",
    textClass: "text-sky-100",
  },
  Moisture: {
    lineColor: "#0ea5e9",
    borderClass: "border-cyan-500/70",
    badgeClass: "bg-white/10 text-cyan-100",
    gradientClass: "bg-gradient-to-br from-violet-900 via-violet-900 to-violet-900",
    textClass: "text-cyan-100",
  },
  Rainfall: {
    lineColor: "#0f766e",
    borderClass: "border-teal-500/70",
    badgeClass: "bg-white/10 text-teal-100",
    gradientClass: "bg-gradient-to-br from-teal-900 via-teal-900 to-teal-900",
    textClass: "text-teal-100",
  },
  PH: {
    lineColor: "#0891b2",
    borderClass: "border-cyan-500/70",
    badgeClass: "bg-white/10 text-cyan-100",
    gradientClass: "bg-gradient-to-br from-cyan-900 via-cyan-900 to-cyan-900",
    textClass: "text-cyan-100",
  },
  Carbon: {
    lineColor: "#16a34a",
    borderClass: "border-emerald-500/70",
    badgeClass: "bg-white/10 text-emerald-100",
    gradientClass: "bg-gradient-to-br from-emerald-900 via-emerald-900 to-emerald-900",
    textClass: "text-emerald-100",
  },
  Nitrogen: {
    lineColor: "#16a34a",
    borderClass: "border-emerald-500/70",
    badgeClass: "bg-white/10 text-emerald-100",
    gradientClass: "bg-gradient-to-br from-emerald-900 via-emerald-900 to-emerald-900",
    textClass: "text-emerald-100",
  },
  Phosphorus: {
    lineColor: "#d97706",
    borderClass: "border-amber-500/70",
    badgeClass: "bg-white/10 text-amber-100",
    gradientClass: "bg-gradient-to-br from-purple-900 via-purple-900 to-purple-900",
    textClass: "text-amber-100",
  },
  Potassium: {
    lineColor: "#9333ea",
    borderClass: "border-violet-500/70",
    badgeClass: "bg-white/10 text-violet-100",
    gradientClass: "bg-gradient-to-br from-blue-900 via-blue-900 to-blue-900",
    textClass: "text-violet-100",
  },
};

export const getMetricColorStyle = (metric?: string): MetricColorStyle => {
  return METRIC_COLOR_MAP[metric ?? ""] ?? {
    lineColor: "#374151",
    borderClass: "border-slate-300/70",
    badgeClass: "bg-white/10 text-slate-100",
    gradientClass: "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800",
    textClass: "text-slate-100",
  };
};
