import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line, ReferenceLine, Cell,
} from "recharts";
import SectionCard from "./SectionCard";
import {
  fetchNutrientsBySoil, fetchNutrientsByCrop,
  fetchRainfallNitrogen, fetchDistribution,
  fetchCropSoilMapping,
} from "../services/api";
import {
  mockNutrientsBySoil, mockNutrientsByCrop,
  mockRainfallNitrogen, mockDistribution,
} from "../services/mockData";

// ── Interfaces ───────────────────────────────
interface ThresholdRange { low: number; high: number; }
interface ThresholdData {
  mean: number; std: number; min: number; max: number;
  normal: ThresholdRange; warning: ThresholdRange; critical: ThresholdRange;
}
interface BrushState {
  type: "crop" | "soil" | null;
  value: string | null;
}
interface CropSoilMap {
  crops_per_soil: Record<string, string[]>;
  soils_per_crop: Record<string, string[]>;
}

// ── Colors ───────────────────────────────────
const NUTRIENT_COLORS = {
  Nitrogen:   "#b45309",
  Phosphorus: "#92400e",
  Potassium:  "#78350f",
  Carbon:     "#78716c",
  Rainfall:   "#0ea5e9",
};

const THRESHOLD_COLORS = {
  normal:   "#3b82f6",
  warning:  "#f59e0b",
  critical: "#ef4444",
};

// ── Sub tabs ─────────────────────────────────
const SUB_TABS = [
  {
    id: "npk",
    label: "NPK Analysis",
    desc: "Nitrogen, Phosphorus, and Potassium comparison across crops and soils",
  },
  {
    id: "soil",
    label: "Soil Profiles",
    desc: "Soil-specific nutrient profiles, carbon levels, and radar comparison",
  },
  {
    id: "distribution",
    label: "Distributions",
    desc: "Frequency distributions and rainfall-nutrient relationships",
  },
  { id: "npk",          label: "🌿 NPK Analysis",   desc: "Nitrogen, Phosphorus, and Potassium comparison across crops and soils" },
  { id: "soil",         label: "🏔️ Soil Profiles",  desc: "Soil-specific nutrient profiles, carbon levels, and radar comparison" },
  { id: "distribution", label: "📊 Distributions",   desc: "Frequency distributions and rainfall-nutrient relationships" },
];

// ─────────────────────────────────────────────
const NutrientsTab: React.FC<{
  backendOnline: boolean;
  selectedCrop?: string;
  selectedSoil?: string;
  thresholds?: Record<string, ThresholdData> | null;
}> = ({ backendOnline, selectedCrop, selectedSoil, thresholds }) => {
  const [bySoil,       setBySoil]       = useState<any[]>([]);
  const [byCrop,       setByCrop]       = useState<any[]>([]);
  const [rfNit,        setRfNit]        = useState<any[]>([]);
  const [histCol,      setHistCol]      = useState("Nitrogen");
  const [histData,     setHistData]     = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState("npk");
  const [brush,        setBrush]        = useState<BrushState>({ type: null, value: null });
  const [mapping,      setMapping]      = useState<CropSoilMap | null>(null);

  // ── Load data ──────────────────────────────
  const loadHist = (col: string) => {
    if (backendOnline) {
      fetchDistribution(col).then(setHistData).catch(() => setHistData(mockDistribution(col)));
    } else {
      setHistData(mockDistribution(col));
    }
  };

  useEffect(() => {
    if (backendOnline) {
      fetchNutrientsBySoil().then(setBySoil).catch(() => setBySoil(mockNutrientsBySoil));
      fetchNutrientsByCrop().then(setByCrop).catch(() => setByCrop(mockNutrientsByCrop));
      fetchRainfallNitrogen().then(setRfNit).catch(() => setRfNit(mockRainfallNitrogen));
      fetchCropSoilMapping().then(setMapping).catch(() => {});
    } else {
      setBySoil(mockNutrientsBySoil);
      setByCrop(mockNutrientsByCrop);
      setRfNit(mockRainfallNitrogen);
    }
    loadHist(histCol);
  }, [backendOnline]);

  useEffect(() => { loadHist(histCol); }, [histCol]);

  // ── Brush handlers ─────────────────────────
  const handleBrushClick = (type: "crop" | "soil", value: string) => {
    if (brush.type === type && brush.value === value) {
      setBrush({ type: null, value: null });
    } else {
      setBrush({ type, value });
    }
  };

  // ── Get linked items ───────────────────────
  const getLinkedSoils = (): string[] => {
    if (brush.type === "crop" && brush.value && mapping) {
      return mapping.soils_per_crop[brush.value] ?? [];
    }
    return [];
  };

  const getLinkedCrops = (): string[] => {
    if (brush.type === "soil" && brush.value && mapping) {
      return mapping.crops_per_soil[brush.value] ?? [];
    }
    return [];
  };

  // ── Get opacity for any item ───────────────
  const getOpacity = (type: "crop" | "soil", value: string): number => {
    if (!brush.type) return 1;

    // Same type — direct match
    if (brush.type === type) {
      return brush.value === value ? 1 : 0.15;
    }

    // Cross-type — check mapping
    if (brush.type === "crop" && type === "soil") {
      const linkedSoils = getLinkedSoils();
      return linkedSoils.includes(value) ? 1 : 0.15;
    }

    if (brush.type === "soil" && type === "crop") {
      const linkedCrops = getLinkedCrops();
      return linkedCrops.includes(value) ? 1 : 0.15;
    }

    return 1;
  };

  // ── Radar data ─────────────────────────────
  const radarData = bySoil.map(d => ({
    subject: d.Soil?.replace(" Soil", "") ?? d.Soil,
    fullName: d.Soil,
    N: +(d.Nitrogen   ?? 0).toFixed(1),
    P: +(d.Phosphorus ?? 0).toFixed(1),
    K: +(d.Potassium  ?? 0).toFixed(1),
  }));

  // ── Threshold helpers ──────────────────────
  const renderThresholdLines = (metricKey: string) => {
    if (!thresholds || !thresholds[metricKey]) return null;
    const t = thresholds[metricKey];
    return (
      <>
        <ReferenceLine y={t.normal.low}    stroke={THRESHOLD_COLORS.normal}   strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={t.normal.high}   stroke={THRESHOLD_COLORS.normal}   strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={t.warning.low}   stroke={THRESHOLD_COLORS.warning}  strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={t.warning.high}  stroke={THRESHOLD_COLORS.warning}  strokeDasharray="4 4" strokeWidth={1} />
        <ReferenceLine y={t.critical.low}  stroke={THRESHOLD_COLORS.critical} strokeDasharray="3 3" strokeWidth={1} />
        <ReferenceLine y={t.critical.high} stroke={THRESHOLD_COLORS.critical} strokeDasharray="3 3" strokeWidth={1} />
      </>
    );
  };

  const getThresholdLabel = (metricKey: string) => {
    if (!thresholds || !thresholds[metricKey]) return null;
    const t = thresholds[metricKey];
    return (
      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
        <span><span className="inline-block w-3 h-0.5 mr-1" style={{ borderTop: "2px dashed #3b82f6" }} />Normal: {t.normal.low.toFixed(1)} – {t.normal.high.toFixed(1)}</span>
        <span><span className="inline-block w-3 h-0.5 mr-1" style={{ borderTop: "2px dashed #f59e0b" }} />Warning: {t.warning.low.toFixed(1)} – {t.warning.high.toFixed(1)}</span>
        <span><span className="inline-block w-3 h-0.5 mr-1" style={{ borderTop: "2px dashed #ef4444" }} />Critical: {t.critical.low.toFixed(1)} – {t.critical.high.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-5">

      {/* ── Header + Sub-nav ──────────────────── */}
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

      {/* ── Brush indicator (persistent across tabs) ── */}
      {brush.type && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <span className="text-xs font-bold text-green-700">
            🔗 Brushed: {brush.value}
          </span>
          {brush.type === "crop" && mapping && (
            <span className="text-[10px] text-green-500">
              → Linked soils: {getLinkedSoils().join(", ") || "none found"}
            </span>
          )}
          {brush.type === "soil" && mapping && (
            <span className="text-[10px] text-green-500">
              → Linked crops: {getLinkedCrops().length} crops in this soil
            </span>
          )}
          <button
            onClick={() => setBrush({ type: null, value: null })}
            className="ml-auto text-xs font-bold text-green-600 hover:text-green-800 transition"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 1: NPK ANALYSIS
      ══════════════════════════════════════ */}
      {activeSubTab === "npk" && (
        <div className="space-y-6">

          {/* NPK by Crop */}
          <SectionCard
            title="NPK Levels by Crop"
            subtitle="Click a bar to brush — linked across all charts and tabs"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={byCrop}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                onClick={(data: any) => {
                  if (data?.activeLabel) handleBrushClick("crop", data.activeLabel);
                }}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Crop" tick={{ fontSize: 11 }} tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: "kg/ha", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend />
                {renderThresholdLines("Nitrogen")}
                <Bar dataKey="Nitrogen" name="Nitrogen (N)" radius={[4, 4, 0, 0]}>
                  {byCrop.map((e: any) => <Cell key={e.Crop} fill={NUTRIENT_COLORS.Nitrogen} opacity={getOpacity("crop", e.Crop)} />)}
                </Bar>
                <Bar dataKey="Phosphorus" name="Phosphorus (P)" radius={[4, 4, 0, 0]}>
                  {byCrop.map((e: any) => <Cell key={e.Crop} fill={NUTRIENT_COLORS.Phosphorus} opacity={getOpacity("crop", e.Crop)} />)}
                </Bar>
                <Bar dataKey="Potassium" name="Potassium (K)" radius={[4, 4, 0, 0]}>
                  {byCrop.map((e: any) => <Cell key={e.Crop} fill={NUTRIENT_COLORS.Potassium} opacity={getOpacity("crop", e.Crop)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {getThresholdLabel("Nitrogen")}
          </SectionCard>

          {/* NPK by Soil */}
          <SectionCard
            title="NPK Levels by Soil Type"
            subtitle="Bars fade based on brush selection — cross-linked with crop selection"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={bySoil}
                margin={{ top: 10, right: 10, left: 0, bottom: 55 }}
                onClick={(data: any) => {
                  if (data?.activeLabel) handleBrushClick("soil", data.activeLabel);
                }}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Soil" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend />
                {renderThresholdLines("Nitrogen")}
                <Bar dataKey="Nitrogen" name="Nitrogen (N)" radius={[4, 4, 0, 0]}>
                  {bySoil.map((e: any) => <Cell key={e.Soil} fill={NUTRIENT_COLORS.Nitrogen} opacity={getOpacity("soil", e.Soil)} />)}
                </Bar>
                <Bar dataKey="Phosphorus" name="Phosphorus (P)" radius={[4, 4, 0, 0]}>
                  {bySoil.map((e: any) => <Cell key={e.Soil} fill={NUTRIENT_COLORS.Phosphorus} opacity={getOpacity("soil", e.Soil)} />)}
                </Bar>
                <Bar dataKey="Potassium" name="Potassium (K)" radius={[4, 4, 0, 0]}>
                  {bySoil.map((e: any) => <Cell key={e.Soil} fill={NUTRIENT_COLORS.Potassium} opacity={getOpacity("soil", e.Soil)} />)}
                </Bar>
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

          {/* Radar */}
          <SectionCard title="Soil Nutrient Radar" subtitle="Brush persists from other tabs">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, "auto"]} tick={{ fontSize: 9 }} />
                <Radar name="Nitrogen"   dataKey="N" stroke={NUTRIENT_COLORS.Nitrogen}   fill={NUTRIENT_COLORS.Nitrogen}   fillOpacity={0.2} />
                <Radar name="Phosphorus" dataKey="P" stroke={NUTRIENT_COLORS.Phosphorus} fill={NUTRIENT_COLORS.Phosphorus} fillOpacity={0.2} />
                <Radar name="Potassium"  dataKey="K" stroke={NUTRIENT_COLORS.Potassium}  fill={NUTRIENT_COLORS.Potassium}  fillOpacity={0.2} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Carbon */}
          <SectionCard title="Organic Carbon by Soil Type" subtitle="Linked to brush selection">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={bySoil}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                onClick={(data: any) => {
                  if (data?.activeLabel) handleBrushClick("soil", data.activeLabel);
                }}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                <YAxis dataKey="Soil" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                {thresholds?.Carbon && (
                  <>
                    <ReferenceLine x={thresholds.Carbon.normal.low}  stroke={THRESHOLD_COLORS.normal}  strokeDasharray="4 4" />
                    <ReferenceLine x={thresholds.Carbon.normal.high} stroke={THRESHOLD_COLORS.normal}  strokeDasharray="4 4" />
                    <ReferenceLine x={thresholds.Carbon.warning.low} stroke={THRESHOLD_COLORS.warning} strokeDasharray="4 4" />
                  </>
                )}
                <Bar dataKey="Carbon" name="Carbon (%)" radius={[0, 6, 6, 0]}>
                  {bySoil.map((e: any) => <Cell key={e.Soil} fill={NUTRIENT_COLORS.Carbon} opacity={getOpacity("soil", e.Soil)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {getThresholdLabel("Carbon")}
          </SectionCard>

          {/* Soil cards */}
          <SectionCard title="Soil Type Summary" subtitle="Click a card to brush" className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {bySoil.map((soil: any) => (
                <div
                  key={soil.Soil}
                  onClick={() => handleBrushClick("soil", soil.Soil)}
                  className={`rounded-xl p-4 border cursor-pointer transition-all ${
                    brush.type === "soil" && brush.value === soil.Soil
                      ? "bg-green-50 border-green-300 shadow-md ring-2 ring-green-200"
                      : brush.type && getOpacity("soil", soil.Soil) < 1
                        ? "bg-gray-50 border-gray-100 opacity-30"
                        : "bg-gray-50 border-gray-100 hover:border-green-200 hover:shadow-sm"
                  }`}
                >
                  <p className="text-xs font-bold text-gray-700 mb-2">🏔️ {soil.Soil}</p>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nitrogen</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Nitrogen }}>{soil.Nitrogen?.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phosphorus</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Phosphorus }}>{soil.Phosphorus?.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Potassium</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Potassium }}>{soil.Potassium?.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Carbon</span>
                      <span className="font-mono font-semibold" style={{ color: NUTRIENT_COLORS.Carbon }}>{soil.Carbon?.toFixed(2)}</span>
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
          <SectionCard title="Rainfall vs Nitrogen by Crop" subtitle="Linked to brush selection">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={rfNit}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                onClick={(data: any) => {
                  if (data?.activeLabel) handleBrushClick("crop", data.activeLabel);
                }}
                style={{ cursor: "pointer" }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Crop" tick={{ fontSize: 12 }} tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)} />
                <YAxis yAxisId="rain" orientation="left"  tick={{ fontSize: 11 }} label={{ value: "Rainfall(mm)", angle: -90, position: "insideLeft", fontSize: 10 }} />
                <YAxis yAxisId="nit"  orientation="right" tick={{ fontSize: 11 }} label={{ value: "Nitrogen",     angle: 90,  position: "insideRight", fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Legend />
                <Line yAxisId="rain" type="monotone" dataKey="Rainfall" stroke={NUTRIENT_COLORS.Rainfall} strokeWidth={2.5} dot={{ r: 5 }} />
                <Line yAxisId="nit"  type="monotone" dataKey="Nitrogen" stroke={NUTRIENT_COLORS.Nitrogen} strokeWidth={2.5} dot={{ r: 5 }} />
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
                <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={1} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                {renderThresholdLines(histCol)}
                <Bar dataKey="count" name="Frequency" fill={NUTRIENT_COLORS[histCol as keyof typeof NUTRIENT_COLORS] ?? "#b45309"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {getThresholdLabel(histCol)}
          </SectionCard>

        </div>
      )}

      {/* ── Navigation hints ──────────────────── */}
      {activeSubTab === "npk" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-5 py-3">
          <span className="text-lg">🏔️</span>
          <p className="text-xs text-green-700"><b>Next:</b> Check <b>Soil Profiles</b> to see radar comparisons and carbon levels.</p>
          <button onClick={() => setActiveSubTab("soil")} className="ml-auto text-xs font-bold text-green-700 hover:text-green-900 whitespace-nowrap">View →</button>
        </div>
      )}
      {activeSubTab === "soil" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-5 py-3">
          <span className="text-lg">📊</span>
          <p className="text-xs text-green-700"><b>Next:</b> Explore <b>Distributions</b> for frequency patterns and relationships.</p>
          <button onClick={() => setActiveSubTab("distribution")} className="ml-auto text-xs font-bold text-green-700 hover:text-green-900 whitespace-nowrap">View →</button>
        </div>
      )}
      {activeSubTab === "distribution" && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-5 py-3">
          <span className="text-lg">🌾</span>
          <p className="text-xs text-purple-700"><b>Next:</b> Head to <b>Crop Recommendation</b> to predict the best crop using ML.</p>
        </div>
      )}

    </div>
  );
};

export default NutrientsTab;