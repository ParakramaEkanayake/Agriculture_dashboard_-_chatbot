import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, Leaf, Bot, Wifi, WifiOff, Menu, X,
} from "lucide-react";
import KPICard from "./components/KPICard";
import OverviewTab      from "./components/OverviewTab";
import NutrientsTab     from "./components/NutrientsTab";
import CorrelationTab   from "./components/CorrelationTab";
import DataTableTab     from "./components/DataTableTab";
import StatsTab         from "./components/StatsTab";
import ChatBot          from "./components/ChatBot";
import { fetchKPIs, fetchFilters }    from "./services/api";
import { mockKPIs }     from "./services/mockData";

// ─────────────────────────────────────────────
type TabId = "overview" | "nutrients" | "correlation" | "stats" | "data";

const TABS: { id: TabId; label: string; icon: React.ReactNode; desc: string }[] = [
  { id:"overview",     label:"Overview",      icon:<LayoutDashboard className="w-4 h-4" />, desc:"Distributions & trends" },
  { id:"nutrients",    label:"Advanced",     icon:<Leaf            className="w-4 h-4" />, desc:"NPK & carbon analysis" },
  // { id:"correlation",  label:"Correlations",  icon:<GitBranch       className="w-4 h-4" />, desc:"Scatter & heatmap" },
  // { id:"stats",        label:"Statistics",    icon:<BarChart2       className="w-4 h-4" />, desc:"Descriptive stats" },
  // { id:"data",         label:"Data Table",    icon:<Table2          className="w-4 h-4" />, desc:"Raw data explorer" },
];

// ─────────────────────────────────────────────
function App() {
  const [activeTab,      setActiveTab]      = useState<TabId>("overview");
  const [kpis,           setKpis]           = useState<any>(mockKPIs);
  const [backendOnline,  setBackendOnline]  = useState(false);
  const [filters,        setFilters]        = useState<any>({ crops: [] });
  const [selectedCrop,   setSelectedCrop]   = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen,       setChatOpen]       = useState(false);
  const [checking,       setChecking]       = useState(true);

  // Check backend & load KPIs
  useEffect(() => {
    fetchKPIs(selectedCrop || "all")
      .then(data => { setKpis(data); setBackendOnline(true); })
      .catch(() => { setKpis(mockKPIs); setBackendOnline(false); })
      .finally(() => setChecking(false));
  }, [selectedCrop]);

  useEffect(() => {
    if (backendOnline) {
      fetchFilters()
        .then(data => {
          setFilters(data);
          if (!selectedCrop || !data.crops.includes(selectedCrop)) {
            setSelectedCrop(data.crops[0] || "");
          }
        })
        .catch(() => {
          const mockCrops = ["rice", "wheat", "maize", "soybean", "cotton"];
          setFilters({ crops: mockCrops });
          if (!selectedCrop || !mockCrops.includes(selectedCrop)) {
            setSelectedCrop(mockCrops[0]);
          }
        });
    } else {
      const mockCrops = ["rice", "wheat", "maize", "soybean", "cotton"];
      setFilters({ crops: mockCrops });
      if (!selectedCrop || !mockCrops.includes(selectedCrop)) {
        setSelectedCrop(mockCrops[0]);
      }
    }
  }, [backendOnline, selectedCrop]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-green-50/30 to-emerald-50/20 font-sans">
      {/* ── Top Nav ────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-lg leading-none tracking-tight">PolyAnalytics</h1>
              <p className="text-xs text-gray-400 leading-none">Smart Soil & Crop Intelligence</p>
            </div>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-green-600 text-white shadow"
                    : "text-gray-600 hover:bg-gray-100"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>

          {/* Status & mobile toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col min-w-[170px]">
              {/* <label className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-1">Crop</label> */}
              <select className="border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedCrop}
                onChange={e => setSelectedCrop(e.target.value)}>
                {filters.crops.map((crop: string) => (
                  <option key={crop} value={crop} className="capitalize">{crop}</option>
                ))}
              </select>
            </div>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              checking ? "bg-gray-50 text-gray-500 border-gray-200"
              : backendOnline ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {checking ? (
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
              ) : backendOnline ? (
                <><Wifi className="w-3 h-3" /> Backend Online</>
              ) : (
                <><WifiOff className="w-3 h-3" /> Demo Mode</>
              )}
            </div>
            <button className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 grid grid-cols-2 gap-2">
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-1 inline-block">Crop</label>
              <select className="w-full border border-gray-200 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                value={selectedCrop}
                onChange={e => setSelectedCrop(e.target.value)}>
                {filters.crops.map((crop: string) => (
                  <option key={crop} value={crop} className="capitalize">{crop}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </header>

      {/* ── KPI Banner ────────────────────────────────────────────────── */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* <KPICard title="Total Records"    value={kpis.total_records?.toLocaleString() ?? "—"} icon="📦" color="bg-gradient-to-r from-slate-700 to-slate-600" /> */}
            <KPICard title="Temperature"  value={`${kpis.temperature?.latest ?? "—"}°C`}          color="text-red-600" textColor="text-gray-900" changePct={kpis.temperature?.change_pct} changeDir={kpis.temperature?.change_dir} borderColor="border-red-500" />
            <KPICard title="Moisture"     value={kpis.moisture?.latest ?? "—"}                    color="text-blue-600" textColor="text-gray-900" changePct={kpis.moisture?.change_pct} changeDir={kpis.moisture?.change_dir} borderColor="border-blue-500" />
            <KPICard title="Nitrogen"  value={kpis.nitrogen?.latest ?? "—"}                          color="text-emerald-600" textColor="text-gray-900" changePct={kpis.nitrogen?.change_pct} changeDir={kpis.nitrogen?.change_dir} borderColor="border-emerald-500" />
            <KPICard title="Phosphorus" value={kpis.phosphorus?.latest ?? "—"}                         color="text-violet-600" textColor="text-gray-900" changePct={kpis.phosphorus?.change_pct} changeDir={kpis.phosphorus?.change_dir} borderColor="border-violet-500" />
            <KPICard title="Potassium"  value={kpis.potassium?.latest ?? "—"}                          color="text-orange-600" textColor="text-gray-900" changePct={kpis.potassium?.change_pct} changeDir={kpis.potassium?.change_dir} borderColor="border-orange-500" />
            {/* <KPICard title="Dominant Soil"    value={kpis.dominant_soil ?? "—"}                   icon="🏔️" color="bg-gradient-to-r from-green-600 to-emerald-600" subtitle={`${kpis.soil_types} types`} /> */}
            {/* <KPICard title="Top Crop"         value={kpis.dominant_crop ? kpis.dominant_crop.charAt(0).toUpperCase()+kpis.dominant_crop.slice(1) : "—"} icon="🌾" color="bg-gradient-to-r from-yellow-500 to-amber-600" subtitle={`${kpis.crop_types} crops`} /> */}
          </div>
        </div>
      </div>

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {TABS.find(t => t.id === activeTab)?.desc}
            </p>
          </div>
          {!backendOnline && !checking && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              Demo mode – Start Flask backend for live data
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-10 pt-4">
        {activeTab === "overview"    && <OverviewTab    backendOnline={backendOnline} selectedCrop={selectedCrop} />}
        {activeTab === "nutrients"   && <NutrientsTab   backendOnline={backendOnline} />}
        {activeTab === "correlation" && <CorrelationTab backendOnline={backendOnline} />}
        {activeTab === "stats"       && <StatsTab       backendOnline={backendOnline} />}
        {activeTab === "data"        && <DataTableTab   backendOnline={backendOnline} />}
      </main>

      <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
        <button
          onClick={() => setChatOpen(v => !v)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-br from-green-600 to-emerald-600 text-white shadow-2xl shadow-green-500/30 hover:scale-105 transition-transform"
          aria-label="Open chat bot"
        >
          <Bot className="w-6 h-6" />
        </button>

        {chatOpen && (
          <div className="w-full max-w-md h-[80vh] rounded-4xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">AgriBot Chat</p>
                  <p className="text-xs text-gray-500">Available on every page</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-gray-900" aria-label="Close chat bot">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ChatBot backendOnline={backendOnline} />
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-3 h-3 text-white" />
            </div>
            <span><b className="text-gray-600">AgriAnalytics</b> — Visual Analytics Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Dataset: Synthetic Agricultural Data (500 records, 11 variables)</span>
            <span>|</span>
            <span>Assignment 02 — UITC Intelligence Systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
