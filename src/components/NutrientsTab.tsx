import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line, ReferenceLine,
} from "recharts";
import SectionCard from "./SectionCard";
import {
  fetchNutrientsBySoil, fetchNutrientsByCrop,
  fetchRainfallNitrogen, fetchDistribution,
} from "../services/api";
import {
  mockNutrientsBySoil, mockNutrientsByCrop,
  mockRainfallNitrogen, mockDistribution,
} from "../services/mockData";

// ── Threshold interface ──────────────────────
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

// ── Identity colors (consistent per metric) ──
const NUTRIENT_COLORS = {
  // Nitrogen:   "#475569",  // slate-600
  // Phosphorus: "#64748b",  // slate-500
  // Potassium:  "#94a3b8",  // slate-400
  // Carbon:     "#78716c",  // stone-500
  // Rainfall:   "#0ea5e9",  // cyan-500

  // Option 2: Warm neutrals
  Nitrogen:   "#57534e",  // stone-600
  Phosphorus: "#78716c",  // stone-500
  Potassium:  "#582e14",  // stone-400
  Carbon:     "#78716c",  // stone-500
  Rainfall:   "#0ea5e9",  // cyan-500


};

// ── Threshold line colors ────────────────────
const THRESHOLD_COLORS = {
  normal:   "#3b82f6",  // blue
  warning:  "#f59e0b",  // amber
  critical: "#ef4444",  // red
};

// ── Sub-navigation categories ────────────────
const SUB_TABS = [
  {
    id: "npk",
    label: "🌿 NPK Analysis",
    desc: "Nitrogen, Phosphorus, and Potassium comparison across crops and soils",
  },
  {
    id: "soil",
    label: "🏔️ Soil Profiles",
    desc: "Soil-specific nutrient profiles, carbon levels, and radar comparison",
  },
  {
    id: "distribution",
    label: "📊 Distributions",
    desc: "Frequency distributions and rainfall-nutrient relationships",
  },
];

// ─────────────────────────────────────────────
const NutrientsTab: React.FC<{
  backendOnline: boolean;
  selectedCrop?: string;
  selectedSoil?: string;
  thresholds?: Record<string, ThresholdData> | null;
}> = ({ backendOnline, selectedCrop, selectedSoil, thresholds }) => {
  const [bySoil,    setBySoil]    = useState<any[]>([]);
  const [byCrop,    setByCrop]    = useState<any[]>([]);
  const [rfNit,     setRfNit]     = useState<any[]>([]);
  const [histCol,   setHistCol]   = useState("Nitrogen");
  const [histData,  setHistData]  = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState("npk");

  // ── Load histogram ─────────────────────────
  const loadHist = (col: string) => {
    if (backendOnline) {
      fetchDistribution(col).then(setHistData).catch(() => setHistData(mockDistribution(col)));
    } else {
      setHistData(mockDistribution(col));
    }
  };

  // ── Load data ──────────────────────────────
  useEffect(() => {
    if (backendOnline) {
      fetchNutrientsBySoil().then(setBySoil).catch(() => setBySoil(mockNutrientsBySoil));
      fetchNutrientsByCrop().then(setByCrop).catch(() => setByCrop(mockNutrientsByCrop));
      fetchRainfallNitrogen().then(setRfNit).catch(() => setRfNit(mockRainfallNitrogen));
    } else {
      setBySoil(mockNutrientsBySoil);
      setByCrop(mockNutrientsByCrop);
      setRfNit(mockRainfallNitrogen);
    }
    loadHist(histCol);
  }, [backendOnline]);

  useEffect(() => { loadHist(histCol); }, [histCol]);

  // ── Build radar data ───────────────────────
  const radarData = bySoil.map(d => ({
    subject: d.Soil?.replace(" Soil", "") ?? d.Soil,
    N: +(d.Nitrogen   ?? 0).toFixed(1),
    P: +(d.Phosphorus ?? 0).toFixed(1),
    K: +(d.Potassium  ?? 0).toFixed(1),
  }));

  // ── Get threshold lines for a metric ───────
  const getThresholdLines = (metricKey: string) => {
    if (!thresholds || !thresholds[metricKey]) return null;
    return thresholds[metricKey];
  };

  // ── Render threshold lines on chart ────────
  const renderThresholdLines = (metricKey: string) => {
    const t = getThresholdLines(metricKey);
    if (!t) return null;

    return (
      <>
        <ReferenceLine
          y={t.normal.low}
          stroke={THRESHOLD_COLORS.normal}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <ReferenceLine
          y={t.normal.high}
          stroke={THRESHOLD_COLORS.normal}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <ReferenceLine
          y={t.warning.low}
          stroke={THRESHOLD_COLORS.warning}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <ReferenceLine
          y={t.warning.high}
          stroke={THRESHOLD_COLORS.warning}
          strokeDasharray="4 4"
          strokeWidth={1}
        />
        <ReferenceLine
          y={t.critical.low}
          stroke={THRESHOLD_COLORS.critical}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
        <ReferenceLine
          y={t.critical.high}
          stroke={THRESHOLD_COLORS.critical}
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      </>
    );
  };

  // ── Threshold context label ────────────────
  const getThresholdLabel = (metricKey: string) => {
    const t = getThresholdLines(metricKey);
    if (!t) return null;
    return (
      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
        <span>
          <span className="inline-block w-3 h-0.5 bg-blue-500 mr-1" style={{ borderTop: "2px dashed #3b82f6" }} />
          Normal: {t.normal.low.toFixed(1)} – {t.normal.high.toFixed(1)}
        </span>
        <span>
          <span className="inline-block w-3 h-0.5 bg-amber-500 mr-1" style={{ borderTop: "2px dashed #f59e0b" }} />
          Warning: {t.warning.low.toFixed(1)} – {t.warning.high.toFixed(1)}
        </span>
        <span>
          <span className="inline-block w-3 h-0.5 bg-red-500 mr-1" style={{ borderTop: "2px dashed #ef4444" }} />
          Critical: {t.critical.low.toFixed(1)} – {t.critical.high.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════
          HEADER + SUB-NAVIGATION
      ══════════════════════════════════════ */}
      <div className="flex items-center gap-3">
        <h3 className="text-base font-bold text-gray-800">
          {SUB_TABS.find(t => t.id === activeSubTab)?.desc}
        </h3>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2">
          {SUB_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all text-xs font-semibold whitespace-nowrap ${
                activeSubTab === tab.id
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-500 hover:border-green-300 hover:bg-green-50/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB 1: NPK ANALYSIS
      ══════════════════════════════════════ */}
      {activeSubTab === "npk" && (
        <div className="space-y-6">

          {/* NPK by Crop – Grouped Bar */}
          <SectionCard
            title="NPK Levels by Crop"
            subtitle="Average Nitrogen, Phosphorus & Potassium per crop type"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCrop} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="Crop"
                  tick={{ fontSize: 11 }}
                  tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  label={{ value: "kg/ha", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                <Legend />
                {renderThresholdLines("Nitrogen")}
                <Bar dataKey="Nitrogen"   fill={NUTRIENT_COLORS.Nitrogen}   radius={[4, 4, 0, 0]} />
                <Bar dataKey="Phosphorus" fill={NUTRIENT_COLORS.Phosphorus} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Potassium"  fill={NUTRIENT_COLORS.Potassium}  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {getThresholdLabel("Nitrogen")}

            {/* Color legend */}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: NUTRIENT_COLORS.Nitrogen }} />
                <span>Nitrogen (N)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: NUTRIENT_COLORS.Phosphorus }} />
                <span>Phosphorus (P)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: NUTRIENT_COLORS.Potassium }} />
                <span>Potassium (K)</span>
              </div>
            </div>
          </SectionCard>

          {/* NPK by Soil */}
          <SectionCard
            title="NPK Levels by Soil Type"
            subtitle="Average nutrient concentrations across soil categories"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bySoil} margin={{ top: 10, right: 10, left: 0, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="Soil"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                <Legend />
                {renderThresholdLines("Nitrogen")}
                <Bar dataKey="Nitrogen"   fill={NUTRIENT_COLORS.Nitrogen}   radius={[4, 4, 0, 0]} />
                <Bar dataKey="Phosphorus" fill={NUTRIENT_COLORS.Phosphorus} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Potassium"  fill={NUTRIENT_COLORS.Potassium}  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {getThresholdLabel("Nitrogen")}
          </SectionCard>

        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2: SOIL PROFILES
      ══════════════════════════════════════ */}
      {activeSubTab === "soil" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Radar – NPK by Soil */}
          <SectionCard
            title="Soil Nutrient Radar"
            subtitle="Comparative N-P-K profile across soil types"
          >
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, "auto"]} tick={{ fontSize: 9 }} />
                <Radar
                  name="Nitrogen"
                  dataKey="N"
                  stroke={NUTRIENT_COLORS.Nitrogen}
                  fill={NUTRIENT_COLORS.Nitrogen}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Phosphorus"
                  dataKey="P"
                  stroke={NUTRIENT_COLORS.Phosphorus}
                  fill={NUTRIENT_COLORS.Phosphorus}
                  fillOpacity={0.2}
                />
                <Radar
                  name="Potassium"
                  dataKey="K"
                  stroke={NUTRIENT_COLORS.Potassium}
                  fill={NUTRIENT_COLORS.Potassium}
                  fillOpacity={0.2}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Carbon by Soil */}
          <SectionCard
            title="Organic Carbon by Soil Type"
            subtitle="Average carbon content — key indicator of soil health"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={bySoil}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                <YAxis dataKey="Soil" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                {/* Carbon threshold lines (horizontal in vertical layout) */}
                {thresholds?.Carbon && (
                  <>
                    <ReferenceLine
                      x={thresholds.Carbon.normal.low}
                      stroke={THRESHOLD_COLORS.normal}
                      strokeDasharray="4 4"
                    />
                    <ReferenceLine
                      x={thresholds.Carbon.normal.high}
                      stroke={THRESHOLD_COLORS.normal}
                      strokeDasharray="4 4"
                    />
                    <ReferenceLine
                      x={thresholds.Carbon.warning.low}
                      stroke={THRESHOLD_COLORS.warning}
                      strokeDasharray="4 4"
                    />
                  </>
                )}
                <Bar
                  dataKey="Carbon"
                  name="Carbon (%)"
                  fill={NUTRIENT_COLORS.Carbon}
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {getThresholdLabel("Carbon")}
          </SectionCard>

          {/* Soil summary cards */}
          <SectionCard
            title="Soil Type Summary"
            subtitle="Quick comparison of average values per soil type"
            className="lg:col-span-2"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {bySoil.map((soil: any) => (
                <div
                  key={soil.Soil}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                >
                  <p className="text-xs font-bold text-gray-700 mb-2">
                    🏔️ {soil.Soil}
                  </p>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nitrogen</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Nitrogen }}>
                        {soil.Nitrogen?.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phosphorus</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Phosphorus }}>
                        {soil.Phosphorus?.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Potassium</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Potassium }}>
                        {soil.Potassium?.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carbon</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Carbon }}>
                        {soil.Carbon?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 3: DISTRIBUTIONS
      ══════════════════════════════════════ */}
      {activeSubTab === "distribution" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Rainfall vs Nitrogen */}
          <SectionCard
            title="Rainfall vs Nitrogen by Crop"
            subtitle="Relationship between rainfall and nitrogen uptake"
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={rfNit} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="Crop"
                  tick={{ fontSize: 12 }}
                  tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <YAxis
                  yAxisId="rain"
                  orientation="left"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Rainfall(mm)", angle: -90, position: "insideLeft", fontSize: 10 }}
                />
                <YAxis
                  yAxisId="nit"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Nitrogen", angle: 90, position: "insideRight", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Line
                  yAxisId="rain"
                  type="monotone"
                  dataKey="Rainfall"
                  stroke={NUTRIENT_COLORS.Rainfall}
                  strokeWidth={2.5}
                  dot={{ r: 5 }}
                />
                <Line
                  yAxisId="nit"
                  type="monotone"
                  dataKey="Nitrogen"
                  stroke={NUTRIENT_COLORS.Nitrogen}
                  strokeWidth={2.5}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Histogram */}
          <SectionCard
            title="Nutrient Distribution"
            subtitle="Frequency distribution of selected variable"
            action={
              <select
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={histCol}
                onChange={e => setHistCol(e.target.value)}
              >
                {["Nitrogen", "Phosphorus", "Potassium", "Carbon", "Temperature", "Moisture", "Rainfall", "PH"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            }
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={histData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="range"
                  tick={{ fontSize: 9 }}
                  angle={-35}
                  textAnchor="end"
                  interval={1}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }}
                />
                {renderThresholdLines(histCol)}
                <Bar
                  dataKey="count"
                  name="Frequency"
                  fill={
                    NUTRIENT_COLORS[histCol as keyof typeof NUTRIENT_COLORS] ?? "#059669"
                  }
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {getThresholdLabel(histCol)}
          </SectionCard>

        </div>
      )}

      {/* ══════════════════════════════════════
          NAVIGATION HINTS
      ══════════════════════════════════════ */}
      {activeSubTab === "npk" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-5 py-3">
          <span className="text-lg">🏔️</span>
          <p className="text-xs text-green-700">
            <b>Next:</b> Check <b>Soil Profiles</b> to see radar comparisons and carbon levels across soil types.
          </p>
          <button
            onClick={() => setActiveSubTab("soil")}
            className="ml-auto text-xs font-bold text-green-700 hover:text-green-900 whitespace-nowrap"
          >
            View →
          </button>
        </div>
      )}

      {activeSubTab === "soil" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-5 py-3">
          <span className="text-lg">📊</span>
          <p className="text-xs text-green-700">
            <b>Next:</b> Explore <b>Distributions</b> to understand frequency patterns and rainfall-nutrient relationships.
          </p>
          <button
            onClick={() => setActiveSubTab("distribution")}
            className="ml-auto text-xs font-bold text-green-700 hover:text-green-900 whitespace-nowrap"
          >
            View →
          </button>
        </div>
      )}

      {activeSubTab === "distribution" && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-5 py-3">
          <span className="text-lg">🌾</span>
          <p className="text-xs text-purple-700">
            <b>Next:</b> Head to <b>Crop Recommendation</b> tab to predict the best crop for your conditions using ML.
          </p>
        </div>
      )}

    </div>
  );
};

export default NutrientsTab;