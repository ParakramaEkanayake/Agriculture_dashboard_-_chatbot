import React from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface ThresholdData {
  mean: number;
  std: number;
  min: number;
  max: number;
  normal:   { low: number; high: number };
  warning:  { low: number; high: number };
  critical: { low: number; high: number };
}

interface Props {
  thresholds:       Record<string, ThresholdData> | null;
  customThresholds: Record<string, ThresholdData> | null;
  setCustomThresholds: (t: any) => void;
  show: boolean;
  setShow: (s: boolean) => void;
}

const METRICS = [
  { key: "Temperature", label: "Temperature",  unit: "°C" },
  { key: "Moisture",    label: "Moisture",      unit: "" },
  { key: "PH",          label: "pH",            unit: "" },
  { key: "Nitrogen",    label: "Nitrogen",      unit: "kg/ha" },
  { key: "Phosphorus",  label: "Phosphorus",    unit: "kg/ha" },
  { key: "Potassium",   label: "Potassium",     unit: "kg/ha" },
  { key: "Carbon",      label: "Carbon",        unit: "%" },
  { key: "Rainfall",    label: "Rainfall",      unit: "mm" },
];

const ThresholdPanel: React.FC<Props> = ({
  thresholds,
  customThresholds,
  setCustomThresholds,
  show,
  setShow,
}) => {
  if (!customThresholds) return null;

  const handleChange = (
    metric: string,
    level: "normal" | "warning" | "critical",
    bound: "low" | "high",
    value: string
  ) => {
    setCustomThresholds((prev: any) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [level]: {
          ...prev[metric][level],
          [bound]: parseFloat(value) || 0,
        },
      },
    }));
  };

  const resetToDefault = () => {
    if (thresholds) {
      setCustomThresholds({ ...thresholds });
    }
  };

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">

        {/* Toggle button */}
        <button
          onClick={() => setShow(!show)}
          className="w-full flex items-center justify-between py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-700 transition"
        >
          <span>⚙️ Threshold Settings</span>
          {show ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Panel content */}
        {show && (
          <div className="pb-4 space-y-4">

            {/* Description */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-gray-400 leading-relaxed max-w-lg">
                Thresholds are derived from dataset statistics (Mean ± Std Dev).
                Adjust these values to match your farm's specific conditions.
                KPI card borders will change color based on these ranges.
              </p>
              <button
                onClick={resetToDefault}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <RotateCcw className="w-3 h-3" /> Reset to Default
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-blue-400" />
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-amber-400" />
                <span>Warning</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border-2 border-red-400" />
                <span>Critical</span>
              </div>
            </div>

            {/* Threshold grid */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-[10px] text-gray-400 uppercase tracking-wider">
                    <th className="text-left py-2 pr-4 font-semibold">Metric</th>
                    <th className="text-center py-2 px-2 font-semibold" colSpan={2}>
                      <span className="text-blue-500">Normal Range</span>
                    </th>
                    <th className="text-center py-2 px-2 font-semibold" colSpan={2}>
                      <span className="text-amber-500">Warning Range</span>
                    </th>
                    <th className="text-center py-2 px-2 font-semibold" colSpan={2}>
                      <span className="text-red-500">Critical Range</span>
                    </th>
                    <th className="text-center py-2 px-2 font-semibold text-gray-400">Mean</th>
                  </tr>
                  <tr className="text-[9px] text-gray-400">
                    <th></th>
                    <th className="text-center px-2">Low</th>
                    <th className="text-center px-2">High</th>
                    <th className="text-center px-2">Low</th>
                    <th className="text-center px-2">High</th>
                    <th className="text-center px-2">Low</th>
                    <th className="text-center px-2">High</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map(m => {
                    const t = customThresholds[m.key];
                    if (!t) return null;
                    return (
                      <tr key={m.key} className="border-t border-gray-50">
                        <td className="py-2 pr-4 font-semibold text-gray-700">
                          {m.label}
                          {m.unit && (
                            <span className="text-gray-400 font-normal ml-1">
                              ({m.unit})
                            </span>
                          )}
                        </td>

                        {/* Normal */}
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={t.normal.low}
                            onChange={e => handleChange(m.key, "normal", "low", e.target.value)}
                            className="w-16 border border-blue-200 rounded px-1.5 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={t.normal.high}
                            onChange={e => handleChange(m.key, "normal", "high", e.target.value)}
                            className="w-16 border border-blue-200 rounded px-1.5 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          />
                        </td>

                        {/* Warning */}
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={t.warning.low}
                            onChange={e => handleChange(m.key, "warning", "low", e.target.value)}
                            className="w-16 border border-amber-200 rounded px-1.5 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={t.warning.high}
                            onChange={e => handleChange(m.key, "warning", "high", e.target.value)}
                            className="w-16 border border-amber-200 rounded px-1.5 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                          />
                        </td>

                        {/* Critical */}
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={t.critical.low}
                            onChange={e => handleChange(m.key, "critical", "low", e.target.value)}
                            className="w-16 border border-red-200 rounded px-1.5 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-red-300"
                          />
                        </td>
                        <td className="px-1 py-2">
                          <input
                            type="number"
                            step="0.1"
                            value={t.critical.high}
                            onChange={e => handleChange(m.key, "critical", "high", e.target.value)}
                            className="w-16 border border-red-200 rounded px-1.5 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-red-300"
                          />
                        </td>

                        {/* Mean */}
                        <td className="px-2 py-2 text-center text-gray-400 font-mono">
                          {t.mean?.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ThresholdPanel;