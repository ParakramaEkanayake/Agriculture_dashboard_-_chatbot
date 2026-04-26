import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Leaf, Bot, Wifi, WifiOff, Menu, X, Sparkles,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

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

        {/* Top row: Logo + Filter + Tabs + Status */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Logo + Filter button */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-0.1">
              {/* <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                <Leaf className="w-4 h-4 text-white" />
              </div> */}
                            <img src="src/images/logo-removebg-preview.png" alt="Logo" className="w-15 h-15" />
                            <img src="src/images/wording.png" alt="Logo" className="w-35 h-35" />
            </div>

            {/* Filter hamburger */}
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setFilterSidebarOpen(v => !v)}
              aria-label="Toggle filters"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                  ? "bg-green-600 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {tab.label}
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



        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
            {/* Mobile tabs */}
            <div className="grid grid-cols-3 gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === tab.id
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              ))}
            </div>

          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          FILTER SIDEBAR
      ══════════════════════════════════════ */}
      {/* Backdrop */}
      {filterSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setFilterSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        filterSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setFilterSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="space-y-6">
            {/* Crop */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
              <select
                className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedCrop}
                onChange={e => setSelectedCrop(e.target.value)}
              >
                {filters.crops?.map((crop: string) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            {/* Soil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Soil Type</label>
              <select
                className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedSoil}
                onChange={e => setSelectedSoil(e.target.value)}
              >
                <option value="all">All Soils</option>
                {filters.soils?.map((soil: string) => (
                  <option key={soil} value={soil}>{soil}</option>
                ))}
              </select>
            </div>

            {/* From date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={globalFromDate}
                min="2025-10-23"
                max={globalToDate || "2026-01-30"}
                onChange={e => setGlobalFromDate(e.target.value)}
              />
            </div>

            {/* To date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={globalToDate}
                min={globalFromDate || "2025-10-23"}
                max="2026-01-30"
                onChange={e => setGlobalToDate(e.target.value)}
              />
            </div>

            {/* Reset */}
            <button
              onClick={() => { setGlobalFromDate(""); setGlobalToDate(""); }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition font-semibold"
            >
              Reset Dates
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FILTERS SECTION (centered) - REMOVED, now in sidebar
      ══════════════════════════════════════ */}

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
            <ChatBot backendOnline={backendOnline} onFilterChange={handleAIFilterChange} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500">
          <div className="flex items-center gap-2">
            {/* <img src="src/images/logo-removebg-preview.png" alt="Logo" className="w-15 h-15" /> */}
            <img src="src/images/wording.png" alt="Logo" className="w-30 h-20 object-contain" />
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span>33 Crops · 5 Soils · 13 Variables</span>
            <span className="text-gray-300">|</span>
            <span>LLaMA 3.3 · Random Forest ML</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;