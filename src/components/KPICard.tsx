import React from "react";
import { getMetricColorStyle } from "../utils/metricColors";

interface ThresholdRange {
  low: number;
  high: number;
}

interface ThresholdData {
  normal:   ThresholdRange;
  warning:  ThresholdRange;
  critical: ThresholdRange;
}

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  changePct?: number;
  changeDir?: "up" | "down" | "neutral";
  actualValue?: number;
  thresholds?: ThresholdData;
}

function getStatusFromThreshold(
  actualValue?: number,
  thresholds?: ThresholdData,
  changePct?: number,
  changeDir?: string
) {
  // If we have thresholds AND actual value, use threshold-based logic
  if (actualValue !== undefined && actualValue !== null && thresholds) {
    const val = actualValue;

    if (val < thresholds.critical.low || val > thresholds.critical.high) {
      return {
        border: "border-red-400",
        badge:  "bg-red-50 text-red-600",
        label:  "Critical",
      };
    }
    if (val < thresholds.warning.low || val > thresholds.warning.high) {
      return {
        border: "border-amber-400",
        badge:  "bg-amber-50 text-amber-600",
        label:  "Warning",
      };
    }
    if (val >= thresholds.normal.low && val <= thresholds.normal.high) {
      return {
        border: "border-blue-300",
        badge:  "bg-blue-50 text-blue-600",
        label:  "Normal",
      };
    }
    // Between normal and warning
    return {
      border: "border-amber-300",
      badge:  "bg-amber-50 text-amber-600",
      label:  "Attention",
    };
  }

  // Fallback: use % change logic
  if (changePct === undefined || changeDir === undefined || changeDir === "neutral") {
    return {
      border: "border-blue-300",
      badge:  "bg-blue-50 text-blue-600",
      label:  "Stable",
    };
  }

  const abs = Math.abs(changePct);
  if (abs > 15) {
    return {
      border: "border-red-400",
      badge:  "bg-red-50 text-red-600",
      label:  "Critical",
    };
  }
  if (abs > 5) {
    return {
      border: "border-amber-400",
      badge:  "bg-amber-50 text-amber-600",
      label:  "Attention",
    };
  }
  return {
    border: "border-blue-300",
    badge:  "bg-blue-50 text-blue-600",
    label:  "Normal",
  };
}

const KPICard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  changePct,
  changeDir,
  actualValue,
  thresholds,
}) => {
  const status = getStatusFromThreshold(actualValue, thresholds, changePct, changeDir);
  const accent = getMetricColorStyle(title);

  const arrow =
    changeDir === "up" ? "↑" :
    changeDir === "down" ? "↓" : "→";

  const changeColorClass =
    changeDir === "up" ? "text-emerald-500"
    : changeDir === "down" ? "text-red-500"
    : "text-slate-100";

  return (
    <div
      className={`relative ${accent.gradientClass} border-2 ${status.border} rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 min-w-0 transition-all hover:shadow-md`}
    >
      <div className={`absolute -top-1 left-5 h-1.5 w-16 rounded-full ${accent.borderClass}`} />

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2.5 h-2.5 rounded-full ${accent.borderClass}`} />
          <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${accent.textClass}`}>
            {title}
          </p>
        </div>
        <p className={`text-2xl font-black mt-0.5 whitespace-normal break-words ${accent.textClass}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-[10px] text-slate-200/80 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        {/* Status badge */}
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${status.badge}`}>
          {status.label}
        </div>

        {/* Change indicator */}
        {changePct !== undefined && changeDir && (
          <div className={`flex items-center gap-0.5 text-[14px] font-bold ${changeColorClass}`}>            <span>{arrow}</span>
            <span>{Math.abs(changePct)}%</span>
          </div>
        )}
        <p className="text-[9px] text-gray-300">vs overall</p>
      </div>
    </div>
  );
};

export default KPICard;