import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
  LineChart, Line, ReferenceArea,
} from "recharts";
import SectionCard from "./SectionCard";
import { getMetricColorStyle } from "../utils/metricColors";
import { fetchData } from "../services/api";
import { mockTableData } from "../services/mockData";

// ── Threshold range interface ────────────────
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

// ── Chart groups ─────────────────────────────
const CHART_GROUPS = [
  {
    id: "environmental",
    label: "Environmental",
    fullLabel: "Environmental Conditions",
    desc: "Temperature, moisture, and rainfall patterns",
    color: "border-green-600 bg-green-50 text-green-700",
    inactive: "border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50/50",
    metrics: [
      { key: "Temperature", label: "Temperature (°C)" },
      { key: "Moisture",    label: "Moisture (0-1)" },
      { key: "Rainfall",    label: "Rainfall (mm)" },
    ],
  },
  {
    id: "soilhealth",
    label: "Soil Health",
    fullLabel: "Soil Health Indicators",
    desc: "pH levels and organic carbon content",
    color: "border-green-600 bg-green-50 text-green-700",
    inactive: "border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50/50",
    metrics: [
      { key: "PH",     label: "Soil pH" },
      { key: "Carbon", label: "Organic Carbon" },
    ],
  },
  {
    id: "nutrients",
    label: "Nutrients (NPK)",
    fullLabel: "Nutrient Levels (NPK)",
    desc: "Nitrogen, phosphorus, and potassium over time",
    color: "border-green-600 bg-green-50 text-green-700",
    inactive: "border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50/50",
    metrics: [
      { key: "Nitrogen",   label: "Nitrogen (kg/ha)" },
      { key: "Phosphorus", label: "Phosphorus (kg/ha)" },
      { key: "Potassium",  label: "Potassium (kg/ha)" },
    ],
  },
];
// ── Helpers ──────────────────────────────────
const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const buildTimeSeries = (rows: any[]) => {
  return rows.map((row) => {
    const [month, day, year] = row.Date.split("/").map(Number);
    const dateObj = new Date(year, month - 1, day);
    return {
      date: formatDate(dateObj),
      Temperature: row.Temperature,
      Moisture: row.Moisture,
      Rainfall: row.Rainfall,
      PH: row.PH,
      Nitrogen: row.Nitrogen,
      Phosphorus: row.Phosphorus,
      Potassium: row.Potassium,
      Carbon: row.Carbon,
      Crop: row.Crop,
    };
  });
};

// ── Threshold zone colors ────────────────────
const ZONE_COLORS = {
  critical: "rgba(239, 68, 68, 0.08)",   // red-500 at 8%
  warning:  "rgba(245, 158, 11, 0.08)",  // amber-500 at 8%
  normal:   "rgba(59, 130, 246, 0.08)",  // blue-500 at 8%
};

// ─────────────────────────────────────────────
const OverviewTab: React.FC<{
  backendOnline: boolean;
  selectedCrop: string;
  selectedSoil: string;
  globalFromDate?: string;
  globalToDate?: string;
  thresholds?: Record<string, ThresholdData> | null;
}> = ({ backendOnline, selectedCrop, selectedSoil, globalFromDate, globalToDate, thresholds }) => {
  const [timeSeries,  setTimeSeries]  = useState<any[]>([]);
  const [fromDate,    setFromDate]    = useState("");
  const [toDate,      setToDate]      = useState("");
  const [activeGroup, setActiveGroup] = useState("environmental");

  // ── Load data ──────────────────────────────
  useEffect(() => {
    const loadSeries = async () => {
      try {
        if (backendOnline) {
          const result = await fetchData(1, 500, selectedSoil, selectedCrop, "all");
          setTimeSeries(buildTimeSeries(result.data));
        } else {
          setTimeSeries(buildTimeSeries(mockTableData(1, 500).data));
        }
      } catch {
        setTimeSeries(buildTimeSeries(mockTableData(1, 500).data));
      }
    };
    loadSeries();
  }, [backendOnline, selectedCrop, selectedSoil]);

  // ── Prepare display data ───────────────────
  const sortedSeries    = [...timeSeries].sort((a, b) => a.date.localeCompare(b.date));
  const availableMinDate = sortedSeries.length ? sortedSeries[0].date : "";
  const availableMaxDate = sortedSeries.length ? sortedSeries[sortedSeries.length - 1].date : "";
  const defaultTo   = availableMaxDate;
  const defaultFrom = sortedSeries.length
    ? sortedSeries[Math.max(sortedSeries.length - 30, 0)].date
    : "";
  const effectiveFrom = globalFromDate || fromDate || defaultFrom;
  const effectiveTo   = globalToDate   || toDate   || defaultTo;

  const displaySeries = sortedSeries.filter(row => {
    if (!row.date) return false;
    if (effectiveFrom && row.date < effectiveFrom) return false;
    if (effectiveTo   && row.date > effectiveTo)   return false;
    return true;
  });

  // ── Get active group ───────────────────────
  const currentGroup = CHART_GROUPS.find(g => g.id === activeGroup) ?? CHART_GROUPS[0];

  // ── Build threshold zones for a metric ─────
  const getThresholdZones = (metricKey: string) => {
    if (!thresholds || !thresholds[metricKey]) return null;
    const t = thresholds[metricKey];
    return {
      // Critical low zone
      criticalLow:  { y1: t.min - 10,      y2: t.critical.low },
      // Warning low zone
      warningLow:   { y1: t.critical.low,   y2: t.warning.low },
      // Normal zone
      normal:       { y1: t.normal.low,      y2: t.normal.high },
      // Warning high zone
      warningHigh:  { y1: t.warning.high,    y2: t.critical.high },
      // Critical high zone
      criticalHigh: { y1: t.critical.high,   y2: t.max + 10 },
    };
  };

  return (
    <div className="space-y-5">



      {/* ══════════════════════════════════════
          GROUP HEADER + CATEGORY NAVIGATION
      ══════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        <h3 className="text-base font-bold text-gray-800">
          {currentGroup.fullLabel}
        </h3>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2">
          {CHART_GROUPS.map(group => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold whitespace-nowrap ${
                activeGroup === group.id
                  ? group.color
                  : group.inactive
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      </div>
      {/* ══════════════════════════════════════
          THRESHOLD LEGEND
      ══════════════════════════════════════ */}
      {thresholds && (
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="font-semibold text-gray-400">Chart zones:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: ZONE_COLORS.normal }} />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: ZONE_COLORS.warning }} />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: ZONE_COLORS.critical }} />
            <span>Critical</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CHARTS (with threshold zones)
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {currentGroup.metrics.map(metric => {
          const zones = getThresholdZones(metric.key);
          const metricStyle = getMetricColorStyle(metric.key);

          return (
            <SectionCard
              key={metric.key}
              title={metric.label}
              subtitle={`${metric.label} over time`}
            >
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={displaySeries}
                  margin={{ top: 10, right: 12, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

                  {/* ── Threshold zones ──────── */}
                  {zones && (
                    <>
                      {/* Critical low */}
                      <ReferenceArea
                        y1={zones.criticalLow.y1}
                        y2={zones.criticalLow.y2}
                        fill={ZONE_COLORS.critical}
                        fillOpacity={1}
                      />
                      {/* Warning low */}
                      <ReferenceArea
                        y1={zones.warningLow.y1}
                        y2={zones.warningLow.y2}
                        fill={ZONE_COLORS.warning}
                        fillOpacity={1}
                      />
                      {/* Normal */}
                      <ReferenceArea
                        y1={zones.normal.y1}
                        y2={zones.normal.y2}
                        fill={ZONE_COLORS.normal}
                        fillOpacity={1}
                      />
                      {/* Warning high */}
                      <ReferenceArea
                        y1={zones.warningHigh.y1}
                        y2={zones.warningHigh.y2}
                        fill={ZONE_COLORS.warning}
                        fillOpacity={1}
                      />
                      {/* Critical high */}
                      <ReferenceArea
                        y1={zones.criticalHigh.y1}
                        y2={zones.criticalHigh.y2}
                        fill={ZONE_COLORS.critical}
                        fillOpacity={1}
                      />
                    </>
                  )}

                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    interval={Math.max(0, Math.floor(displaySeries.length / 8))}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: any) => {
                      const numVal = typeof value === "number" ? value : parseFloat(value);
                      let status = "";
                      if (zones) {
                        if (numVal < zones.criticalLow.y2 || numVal > zones.criticalHigh.y1) {
                          status = " 🔴 Critical";
                        } else if (numVal < zones.warningLow.y2 || numVal > zones.warningHigh.y1) {
                          status = " 🟡 Warning";
                        } else {
                          status = " 🔵 Normal";
                        }
                      }
                      return [
                        `${typeof value === "number" ? value.toFixed(4) : value}${status}`,
                        metric.label,
                      ];
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metricStyle.lineColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>
          );
        })}
      </div>

      {/* ══════════════════════════════════════
          NAVIGATION HINTS
      ══════════════════════════════════════ */}
      {activeGroup === "environmental" && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-5 py-3">
          <span className="text-lg">🧪</span>
          <p className="text-xs text-amber-700">
            <b>Next:</b> Check <b>Soil Health</b> to monitor pH and organic carbon levels
            that directly affect nutrient availability.
          </p>
          <button
            onClick={() => setActiveGroup("soilhealth")}
            className="ml-auto text-xs font-bold text-amber-700 hover:text-amber-900 whitespace-nowrap"
          >
            View →
          </button>
        </div>
      )}

      {activeGroup === "soilhealth" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-5 py-3">
          <span className="text-lg">🌿</span>
          <p className="text-xs text-green-700">
            <b>Next:</b> Explore <b>Nutrient Levels (NPK)</b> to understand nitrogen,
            phosphorus, and potassium trends for this crop.
          </p>
          <button
            onClick={() => setActiveGroup("nutrients")}
            className="ml-auto text-xs font-bold text-green-700 hover:text-green-900 whitespace-nowrap"
          >
            View →
          </button>
        </div>
      )}

      {activeGroup === "nutrients" && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-5 py-3">
          <span className="text-lg">🔬</span>
          <p className="text-xs text-purple-700">
            <b>Next:</b> Switch to the <b>Soil & Nutrient Analysis</b> tab to compare
            NPK levels across different crops and soil types.
          </p>
        </div>
      )}

    </div>
  );
};

export default OverviewTab;