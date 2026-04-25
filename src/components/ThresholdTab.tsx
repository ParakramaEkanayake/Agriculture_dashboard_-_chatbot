import React, { useState, useEffect } from "react";
import { RotateCcw, Check } from "lucide-react";

interface ThresholdRange {
  low: number;
  high: number;
}

interface ThresholdData {
  mean: number;
  std: number;
  min: number;
  max: number;
  normal:   ThresholdRange;
  warning:  ThresholdRange;
  critical: ThresholdRange;
}

interface Props {
  thresholds:          Record<string, ThresholdData> | null;
  customThresholds:    Record<string, ThresholdData> | null;
  setCustomThresholds: (t: any) => void;
}

const METRICS = [
  { key: "Temperature", label: "Temperature",  unit: "°C",    emoji: "🌡️" },
  { key: "Moisture",    label: "Moisture",      unit: "0-1",   emoji: "💧" },
  { key: "PH",          label: "pH Level",      unit: "pH",    emoji: "🧪" },
  { key: "Nitrogen",    label: "Nitrogen",      unit: "kg/ha", emoji: "🌿" },
  { key: "Phosphorus",  label: "Phosphorus",    unit: "kg/ha", emoji: "🌿" },
  { key: "Potassium",   label: "Potassium",     unit: "kg/ha", emoji: "🌿" },
  { key: "Carbon",      label: "Org. Carbon",   unit: "%",     emoji: "♻️" },
  { key: "Rainfall",    label: "Rainfall",      unit: "mm",    emoji: "🌧️" },
];

const ThresholdTab: React.FC<Props> = ({
  thresholds,
  customThresholds,
  setCustomThresholds,
}) => {
  // ── Local draft state (not applied until user clicks Apply) ──
  const [draft, setDraft] = useState<Record<string, ThresholdData> | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [applied, setApplied] = useState(false);

  // ── Sync draft with customThresholds on load ──
  useEffect(() => {
    if (customThresholds && !draft) {
      setDraft(JSON.parse(JSON.stringify(customThresholds)));
    }
  }, [customThresholds]);

  if (!draft) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <span className="text-4xl mb-4 block">⏳</span>
        <p className="text-sm text-gray-500">Loading threshold data...</p>
        <p className="text-xs text-gray-400 mt-1">Make sure the backend is online.</p>
      </div>
    );
  }

  // ── Handle input change (draft only) ──
  const handleChange = (
    metric: string,
    level: "normal" | "warning" | "critical",
    bound: "low" | "high",
    value: string
  ) => {
    setDraft((prev: any) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [level]: {
          ...prev[metric][level],
          [bound]: parseFloat(value) || 0,
        },
      },
    }));
    setHasChanges(true);
    setApplied(false);
  };

  // ── Apply changes ──
  const applyChanges = () => {
    if (draft) {
      setCustomThresholds(JSON.parse(JSON.stringify(draft)));
      setHasChanges(false);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  // ── Reset all to default ──
  const resetToDefault = () => {
    if (thresholds) {
      const fresh = JSON.parse(JSON.stringify(thresholds));
      setDraft(fresh);
      setCustomThresholds(fresh);
      setHasChanges(false);
    }
  };

  // ── Reset single metric ──
  const resetSingle = (metricKey: string) => {
    if (thresholds && thresholds[metricKey]) {
      setDraft((prev: any) => ({
        ...prev,
        [metricKey]: JSON.parse(JSON.stringify(thresholds[metricKey])),
      }));
      setHasChanges(true);
      setApplied(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Info + Actions ────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Thresholds are calculated from the dataset using
              <b> Mean ± Standard Deviation </b> intervals.
              <b> Normal</b> = within 1 SD,
              <b> Warning</b> = within 1.5 SD,
              <b> Critical</b> = beyond 2 SD.
              Adjust these values and click <b>Apply</b> to update KPI indicators.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Apply button */}
            <button
              onClick={applyChanges}
              disabled={!hasChanges}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                applied
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : hasChanges
                    ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              }`}
            >
              {applied ? (
                <><Check className="w-3.5 h-3.5" /> Applied!</>
              ) : (
                <><Check className="w-3.5 h-3.5" /> Apply Changes</>
              )}
            </button>

            {/* Reset button */}
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset All
            </button>
          </div>
        </div>

        {/* Unsaved changes indicator */}
        {hasChanges && !applied && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            You have unsaved changes. Click <b>Apply Changes</b> to update KPI indicators.
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-50" />
            <span>Normal — Healthy range</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-amber-400 bg-amber-50" />
            <span>Warning — Needs attention</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-red-400 bg-red-50" />
            <span>Critical — Immediate action</span>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {METRICS.map(m => {
          const t = draft[m.key];
          if (!t) return null;

          return (
            <div
              key={m.key}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              {/* Metric header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{m.label}</p>
                    <p className="text-[10px] text-gray-400">
                      Unit: {m.unit} · Mean: {t.mean?.toFixed(2)} · Std: {t.std?.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => resetSingle(m.key)}
                  className="text-[10px] text-gray-400 hover:text-gray-600 transition"
                >
                  Reset
                </button>
              </div>

              {/* Range inputs */}
              <div className="space-y-3">

                {/* Normal */}
                <div className="flex items-center gap-3">
                  <div className="w-20 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Normal</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={t.normal.low}
                      onChange={e => handleChange(m.key, "normal", "low", e.target.value)}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50/30"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="number"
                      step="0.1"
                      value={t.normal.high}
                      onChange={e => handleChange(m.key, "normal", "high", e.target.value)}
                      className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50/30"
                    />
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-center gap-3">
                  <div className="w-20 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Warning</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={t.warning.low}
                      onChange={e => handleChange(m.key, "warning", "low", e.target.value)}
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50/30"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="number"
                      step="0.1"
                      value={t.warning.high}
                      onChange={e => handleChange(m.key, "warning", "high", e.target.value)}
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50/30"
                    />
                  </div>
                </div>

                {/* Critical */}
                <div className="flex items-center gap-3">
                  <div className="w-20 flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-red-600 uppercase">Critical</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      step="0.1"
                      value={t.critical.low}
                      onChange={e => handleChange(m.key, "critical", "low", e.target.value)}
                      className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50/30"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="number"
                      step="0.1"
                      value={t.critical.high}
                      onChange={e => handleChange(m.key, "critical", "high", e.target.value)}
                      className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-300 bg-red-50/30"
                    />
                  </div>
                </div>

              </div>

              {/* Visual range bar */}
              <div className="mt-4 h-2 rounded-full bg-gray-100 relative overflow-hidden">
                <div
                  className="absolute h-2 bg-red-300 rounded-full"
                  style={{ left: "0%", width: "100%" }}
                />
                <div
                  className="absolute h-2 bg-amber-300 rounded-full"
                  style={{
                    left: `${((t.warning.low - t.min) / (t.max - t.min)) * 100}%`,
                    width: `${((t.warning.high - t.warning.low) / (t.max - t.min)) * 100}%`,
                  }}
                />
                <div
                  className="absolute h-2 bg-blue-400 rounded-full"
                  style={{
                    left: `${((t.normal.low - t.min) / (t.max - t.min)) * 100}%`,
                    width: `${((t.normal.high - t.normal.low) / (t.max - t.min)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                <span>{t.min?.toFixed(1)}</span>
                <span>Dataset Range</span>
                <span>{t.max?.toFixed(1)}</span>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default ThresholdTab;