import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Leaf, Bot, Wifi, WifiOff, Menu, X, Sparkles,
  Brain, TrendingUp, Database,
} from "lucide-react";
import KPICard from "./components/KPICard";
import OverviewTab from "./components/OverviewTab";
import NutrientsTab from "./components/NutrientsTab";
import CorrelationTab from "./components/CorrelationTab";
import DataTableTab from "./components/DataTableTab";
import StatsTab from "./components/StatsTab";
import ChatBot from "./components/ChatBot";
import PredictTab from "./components/PredictTab";
import { fetchKPIs, fetchFilters, fetchThresholds } from "./services/api";
import { mockKPIs } from "./services/mockData";
import ThresholdTab from "./components/ThresholdTab";
// ─────────────────────────────────────────────
type TabId = "overview" | "nutrients" | "thresholds" | "correlation" | "stats" | "data" | "predict";

const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "overview", label: "Overview & Trends", icon: <LayoutDashboard className="w-4 h-4" />, desc: "Monitor seasonal environmental and crop trends" },
  { id: "nutrients", label: "Soil & Nutrient Analysis", icon: <Leaf className="w-4 h-4" />, desc: "Compare soil health, nutrients, and crop conditions" },
  { id: "thresholds", label: "Threshold Settings", icon: <Sparkles className="w-4 h-4" />, desc: "Configure alert thresholds for all metrics" },
  { id: "predict", label: "Crop Recommendation", icon: <Sparkles className="w-4 h-4" />, desc: "ML-powered crop suitability prediction" },
];
// ── Dynamic banner content per tab ──────────
const BANNER_CONTENT: Record<TabId, {
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  badges: { icon: React.ReactNode; label: string }[];
}> = {
  overview: {
    emoji: "📊",
    title: "Overview & Trends",
    subtitle: "Environmental · Soil Health · Nutrient Monitoring",
    description: "Explore seasonal patterns across temperature, moisture, rainfall, pH, and NPK levels. Use category filters to focus on specific aspects of your agricultural data.",
    badges: [
      { icon: <TrendingUp className="w-3 h-3" />, label: "Time Series Analysis" },
      { icon: <Leaf className="w-3 h-3" />, label: "8 Metrics Tracked" },
      { icon: <Database className="w-3 h-3" />, label: "Historical Data" },
    ],
  },
  nutrients: {
    emoji: "🔬",
    title: "Soil & Nutrient Analysis",
    subtitle: "NPK Comparison · Soil Profiles · Crop Requirements",
    description: "Compare nitrogen, phosphorus, and potassium levels across different crops and soil types. Use radar charts and bar graphs to identify nutrient imbalances and optimize fertilizer application.",
    badges: [
      { icon: <Leaf className="w-3 h-3" />, label: "NPK Analysis" },
      { icon: <TrendingUp className="w-3 h-3" />, label: "Soil Comparison" },
      { icon: <Brain className="w-3 h-3" />, label: "Nutrient Insights" },
    ],
  },
  predict: {
    emoji: "🌾",
    title: "Crop Recommendation",
    subtitle: "AI-Powered · Random Forest Model · Decision Support",
    description: "Enter your farm's environmental and soil conditions to receive machine learning-powered crop recommendations. The model analyzes 8 input variables to predict the most suitable crops with confidence scores.",
    badges: [
      { icon: <Brain className="w-3 h-3" />, label: "ML Prediction" },
      { icon: <Sparkles className="w-3 h-3" />, label: "Top 3 Crops" },
      { icon: <TrendingUp className="w-3 h-3" />, label: "Feature Importance" },
    ],
  },
  correlation: {
    emoji: "📈",
    title: "Correlations",
    subtitle: "Scatter Plots · Heatmap · Variable Relationships",
    description: "Explore relationships between environmental and soil variables using interactive scatter plots and correlation heatmaps.",
    badges: [
      { icon: <TrendingUp className="w-3 h-3" />, label: "Correlation Analysis" },
    ],
  },
  stats: {
    emoji: "📋",
    title: "Statistics",
    subtitle: "Descriptive Statistics · Distributions",
    description: "View detailed descriptive statistics and frequency distributions for all numeric variables in the dataset.",
    badges: [
      { icon: <Database className="w-3 h-3" />, label: "Statistical Summary" },
    ],
  },
  thresholds: {
    emoji: "⚙️",
    title: "Threshold Settings",
    subtitle: "Normal · Warning · Critical Range Configuration",
    description: "Configure and customize alert thresholds for all agricultural metrics. Default values are derived from dataset statistics (Mean ± Standard Deviation). Adjust these to match your farm's specific conditions.",
    badges: [
      { icon: <TrendingUp className="w-3 h-3" />, label: "Data-Derived Defaults" },
      { icon: <Sparkles className="w-3 h-3" />, label: "User Customizable" },
      { icon: <Brain className="w-3 h-3" />, label: "Statistical Thresholds" },
    ],
  },
  data: {
    emoji: "📦",
    title: "Data Table",
    subtitle: "Raw Data · Export · Search",
    description: "Browse, filter, search, and export raw agricultural data records.",
    badges: [
      { icon: <Database className="w-3 h-3" />, label: "Data Explorer" },
    ],
  },
};
// ─────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [kpis, setKpis] = useState<any>(mockKPIs);
  const [backendOnline, setBackendOnline] = useState(false);
  const [filters, setFilters] = useState<any>({ crops: [], soils: [] });
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedSoil, setSelectedSoil] = useState("all");
  const [globalFromDate, setGlobalFromDate] = useState("2026-01-01");
  const [globalToDate, setGlobalToDate] = useState("2026-01-30");
  const [thresholds, setThresholds] = useState<any>(null);
  const [customThresholds, setCustomThresholds] = useState<any>(null);
  // const [showThresholds, setShowThresholds] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  // ── Fetch KPIs ─────────────────────────────
  useEffect(() => {
    fetchKPIs(selectedCrop || "all", selectedSoil || "all")
      .then(data => { setKpis(data); setBackendOnline(true); })
      .catch(() => { setKpis(mockKPIs); setBackendOnline(false); })
      .finally(() => setChecking(false));
  }, [selectedCrop, selectedSoil]);

  // ── Fetch thresholds ───────────────────────
  useEffect(() => {
    if (backendOnline) {
      fetchThresholds()
        .then(data => {
          setThresholds(data);
          if (!customThresholds) {
            setCustomThresholds(data);
          }
        })
        .catch(() => { });
    }
  }, [backendOnline]);
  // ── Fetch filters ──────────────────────────
  useEffect(() => {
    if (backendOnline) {
      fetchFilters(selectedCrop || "all", selectedSoil || "all")
        .then(data => {
          setFilters(data);
          if (!selectedCrop || !data.crops.includes(selectedCrop)) {
            setSelectedCrop(data.crops[0] || "");
          }
          if (selectedSoil !== "all" && !data.soils.includes(selectedSoil)) {
            setSelectedSoil("all");
          }
        })
        .catch(() => {
          const mockCrops = ["rice", "wheat", "maize", "soybean", "cotton"];
          setFilters({ crops: mockCrops, soils: [] });
          if (!selectedCrop || !mockCrops.includes(selectedCrop)) {
            setSelectedCrop(mockCrops[0]);
          }
        });
    } else {
      const mockCrops = ["rice", "wheat", "maize", "soybean", "cotton"];
      setFilters({ crops: mockCrops, soils: [] });
      if (!selectedCrop || !mockCrops.includes(selectedCrop)) {
        setSelectedCrop(mockCrops[0]);
      }
    }
  }, [backendOnline, selectedCrop, selectedSoil]);

  // ── AI filter handler ──────────────────────
  const handleAIFilterChange = (aiFilters: any) => {
    if (aiFilters?.crop) {
      if (aiFilters.crop.toLowerCase() === "all") {
        setSelectedCrop(filters.crops?.[0] || "");
      } else {
        const exactCrop = filters.crops?.find(
          (c: string) => c.toLowerCase() === aiFilters.crop.toLowerCase()
        );
        if (exactCrop) setSelectedCrop(exactCrop);
      }
    }
    if (aiFilters?.soil) {
      if (aiFilters.soil.toLowerCase() === "all") {
        setSelectedSoil("all");
      } else {
        const exactSoil = filters.soils?.find(
          (s: string) => s.toLowerCase() === aiFilters.soil.toLowerCase()
        );
        if (exactSoil) setSelectedSoil(exactSoil);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20 font-sans">

      {/* ══════════════════════════════════════
          STICKY HEADER
          Logo + Tabs + Filters + Status
      ══════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">

        {/* Top row: Logo + Tabs + Status */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900 text-base tracking-tight hidden sm:block">
              PolyAnalytics
            </span>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${checking
              ? "bg-gray-50 text-gray-500 border-gray-200"
              : backendOnline
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
              {checking ? (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse" />
              ) : backendOnline ? (
                <><Wifi className="w-3 h-3" /> Live</>
              ) : (
                <><WifiOff className="w-3 h-3" /> Demo</>
              )}
            </div>
            <button
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Bottom row: Filters (Crop + Soil + Date) */}
        <div className="hidden lg:block border-t border-gray-100">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Filters:
            </p>

            {/* Crop */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Crop
              </label>
              <select
                className="border border-gray-200 rounded-lg bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedCrop}
                onChange={e => setSelectedCrop(e.target.value)}
              >
                {filters.crops?.map((crop: string) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            {/* Soil */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                Soil
              </label>
              <select
                className="border border-gray-200 rounded-lg bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedSoil}
                onChange={e => setSelectedSoil(e.target.value)}
              >
                <option value="all">All Soils</option>
                {filters.soils?.map((soil: string) => (
                  <option key={soil} value={soil}>{soil}</option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200" />

            {/* From date */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                From
              </label>
              <input
                type="date"
                className="border border-gray-200 rounded-lg bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={globalFromDate}
                min="2025-10-23"
                max={globalToDate || "2026-01-30"}
                onChange={e => setGlobalFromDate(e.target.value)}
              />
            </div>

            {/* To date */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                To
              </label>
              <input
                type="date"
                className="border border-gray-200 rounded-lg bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={globalToDate}
                min={globalFromDate || "2025-10-23"}
                max="2026-01-30"
                onChange={e => setGlobalToDate(e.target.value)}
              />
            </div>

            {/* Reset */}
            <button
              onClick={() => { setGlobalFromDate(""); setGlobalToDate(""); }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition font-semibold"
            >
              Reset
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Summary */}
            <p className="text-[10px] text-gray-400">
              Showing: <b className="text-gray-600">{selectedCrop ? selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1) : "All Crops"}</b>
              {" · "}
              <b className="text-gray-600">{selectedSoil === "all" ? "All Soils" : selectedSoil}</b>
            </p>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
            {/* Mobile tabs */}
            <div className="grid grid-cols-3 gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {tab.icon}
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              ))}
            </div>
            {/* Mobile filters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 block">Crop</label>
                <select
                  className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm"
                  value={selectedCrop}
                  onChange={e => setSelectedCrop(e.target.value)}
                >
                  {filters.crops?.map((crop: string) => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1 block">Soil</label>
                <select
                  className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm"
                  value={selectedSoil}
                  onChange={e => setSelectedSoil(e.target.value)}
                >
                  <option value="all">All Soils</option>
                  {filters.soils?.map((soil: string) => (
                    <option key={soil} value={soil}>{soil}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          DYNAMIC BANNER (changes per tab)
      ══════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-emerald-700 text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-48 -translate-y-48" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48" />
        </div>

        <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            {/* Left: Dynamic content */}
            <div className="flex-1">
              {/* Persona badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-green-100 mb-3">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                Farm Managers · Agronomists · Policy Makers
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                {BANNER_CONTENT[activeTab].emoji} {BANNER_CONTENT[activeTab].title}
              </h1>
              <p className="text-green-100 text-sm font-semibold mt-1">
                {BANNER_CONTENT[activeTab].subtitle}
              </p>
              <p className="text-green-200 text-xs mt-2 max-w-xl leading-relaxed">
                {BANNER_CONTENT[activeTab].description}
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {BANNER_CONTENT[activeTab].badges.map(badge => (
                  <span
                    key={badge.label}
                    className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold"
                  >
                    {badge.icon} {badge.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { icon: <Database className="w-5 h-5" />, value: backendOnline ? (kpis.total_records ?? 0).toLocaleString() : "—", label: "Records", color: "from-green-500/30 to-green-600/30" },
                { icon: <Leaf className="w-5 h-5" />, value: backendOnline ? kpis.crop_types ?? "33" : "33", label: "Crop Types", color: "from-emerald-500/30 to-emerald-600/30" },
                { icon: <span className="text-xl">🏔️</span>, value: backendOnline ? kpis.soil_types ?? "5" : "5", label: "Soil Types", color: "from-amber-500/30 to-amber-600/30" },
                { icon: <Brain className="w-5 h-5" />, value: "AI+ML", label: "Powered", color: "from-purple-500/30 to-purple-600/30" },
              ].map(stat => (
                <div key={stat.label} className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center`}>
                  <div className="flex justify-center text-white/80 mb-1">{stat.icon}</div>
                  <p className="text-xl font-black text-white">{stat.value}</p>
                  <p className="text-[10px] text-green-200 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
      {/* ══════════════════════════════════════
          KPI CARDS (hidden on Predict tab)
      ══════════════════════════════════════ */}
      {activeTab !== "predict" && activeTab !== "thresholds" && (
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Key Metrics — {selectedCrop ? selectedCrop.charAt(0).toUpperCase() + selectedCrop.slice(1) : "All Crops"} · {selectedSoil === "all" ? "All Soils" : selectedSoil}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KPICard
                title="Temperature"
                value={`${kpis.temperature?.latest ?? "—"}°C`}
                subtitle="Avg for selection"
                changePct={kpis.temperature?.change_pct}
                changeDir={kpis.temperature?.change_dir}
                actualValue={kpis.temperature?.latest}
                thresholds={customThresholds?.Temperature}
              />
              <KPICard
                title="Moisture"
                value={kpis.moisture?.latest ?? "—"}
                subtitle="Avg for selection"
                changePct={kpis.moisture?.change_pct}
                changeDir={kpis.moisture?.change_dir}
                actualValue={kpis.moisture?.latest}
                thresholds={customThresholds?.Moisture}
              />
              <KPICard
                title="Nitrogen"
                value={`${kpis.nitrogen?.latest ?? "—"} kg/ha`}
                subtitle="Avg for selection"
                changePct={kpis.nitrogen?.change_pct}
                changeDir={kpis.nitrogen?.change_dir}
                actualValue={kpis.nitrogen?.latest}
                thresholds={customThresholds?.Nitrogen}
              />
              <KPICard
                title="Phosphorus"
                value={`${kpis.phosphorus?.latest ?? "—"} kg/ha`}
                subtitle="Avg for selection"
                changePct={kpis.phosphorus?.change_pct}
                changeDir={kpis.phosphorus?.change_dir}
                actualValue={kpis.phosphorus?.latest}
                thresholds={customThresholds?.Phosphorus}
              />
              <KPICard
                title="Potassium"
                value={`${kpis.potassium?.latest ?? "—"} kg/ha`}
                subtitle="Avg for selection"
                changePct={kpis.potassium?.change_pct}
                changeDir={kpis.potassium?.change_dir}
                actualValue={kpis.potassium?.latest}
                thresholds={customThresholds?.Potassium}
              />
            </div>
          </div>
        </div>
      )}
      {/* Demo warning */}
      {!backendOnline && !checking && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-4">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            Demo mode — Start Flask backend for live data
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════ */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-10 pt-4">
        {activeTab === "overview" && (
          <OverviewTab
            backendOnline={backendOnline}
            selectedCrop={selectedCrop}
            selectedSoil={selectedSoil}
            globalFromDate={globalFromDate}
            globalToDate={globalToDate}
            thresholds={customThresholds}
          />
        )}
        {activeTab === "nutrients" && (
          <NutrientsTab
            backendOnline={backendOnline}
            selectedCrop={selectedCrop}
            selectedSoil={selectedSoil}
            thresholds={customThresholds}
          />
        )}        {activeTab === "thresholds" && (
          <ThresholdTab
            thresholds={thresholds}
            customThresholds={customThresholds}
            setCustomThresholds={setCustomThresholds}
          />
        )}
        {activeTab === "predict" && <PredictTab backendOnline={backendOnline} />}
        {activeTab === "correlation" && <CorrelationTab backendOnline={backendOnline} />}
        {activeTab === "stats" && <StatsTab backendOnline={backendOnline} />}
        {activeTab === "data" && <DataTableTab backendOnline={backendOnline} />}
      </main>

      {/* ══════════════════════════════════════
          FLOATING AI CHAT
      ══════════════════════════════════════ */}
      <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
        <button
          onClick={() => setChatOpen(v => !v)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-2xl shadow-green-500/30 hover:scale-105 transition-transform"
          aria-label="Open AI assistant"
        >
          <Bot className="w-6 h-6" />
        </button>

        {chatOpen && (
          <div className="w-full max-w-md h-[80vh] rounded-3xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-700 to-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">AgriBot AI Assistant</p>
                  <p className="text-xs text-green-100">Analytics · Prediction · Decision support</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ChatBot
              backendOnline={backendOnline}
              onFilterChange={handleAIFilterChange}
              onTabChange={(tab: string) => {
                if (tab === "predict") setActiveTab("predict");
                if (tab === "overview") setActiveTab("overview");
                if (tab === "nutrients") setActiveTab("nutrients");
                if (tab === "thresholds") setActiveTab("thresholds");
              }}
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-3 h-3 text-white" />
            </div>
            <span><b className="text-gray-600">PolyAnalytics</b> — Agricultural Intelligence Dashboard</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span>🌾 33 Crops · 5 Soils · 13 Variables</span>
            <span className="text-gray-300">|</span>
            <span>LLaMA 3.3 · Random Forest ML</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;