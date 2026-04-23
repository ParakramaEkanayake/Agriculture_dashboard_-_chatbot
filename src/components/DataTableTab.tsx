import React, { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { fetchData, fetchFilters } from "../services/api";
import { mockTableData } from "../services/mockData";

const COLS = ["Temperature","Moisture","Rainfall","PH","Nitrogen","Phosphorus","Potassium","Carbon","Soil","Crop","Fertilizer"];

function badge(val: string) {
  const colors: Record<string,string> = {
    "Loamy Soil":"bg-green-100 text-green-800","Peaty Soil":"bg-yellow-100 text-yellow-800",
    "Acidic Soil":"bg-red-100 text-red-800","Sandy Soil":"bg-blue-100 text-blue-800",
    "Clay Soil":"bg-purple-100 text-purple-800",
    "rice":"bg-teal-100 text-teal-800","wheat":"bg-amber-100 text-amber-800",
    "maize":"bg-orange-100 text-orange-800","soybean":"bg-lime-100 text-lime-800",
    "cotton":"bg-pink-100 text-pink-800",
  };
  return colors[val] ?? "bg-gray-100 text-gray-700";
}

const DataTableTab: React.FC<{ backendOnline: boolean }> = ({ backendOnline }) => {
  const [filters,  setFilters]  = useState({ soils:[], crops:[], fertilizers:[] } as any);
  const [soil,     setSoil]     = useState("all");
  const [crop,     setCrop]     = useState("all");
  const [fert,     setFert]     = useState("all");
  const [page,     setPage]     = useState(1);
  const [data,     setData]     = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");
  const limit = 20;

  useEffect(() => {
    if (backendOnline) {
      fetchFilters().then(setFilters).catch(() => {});
    } else {
      setFilters({
        soils: ["Loamy Soil","Peaty Soil","Acidic Soil","Sandy Soil","Clay Soil"],
        crops: ["cotton","maize","rice","soybean","wheat"],
        fertilizers: ["Balanced NPK","Compost","DAP","Gypsum","Lime","Muriate of Potash","Organic Fe","Urea","Water Retention"],
      });
    }
  }, [backendOnline]);

  const loadData = useCallback(() => {
    setLoading(true);
    if (backendOnline) {
      fetchData(page, limit, soil, crop, fert)
        .then(r => { setData(r.data); setTotal(r.total); })
        .catch(() => { const m = mockTableData(page, limit); setData(m.data); setTotal(m.total); })
        .finally(() => setLoading(false));
    } else {
      const m = mockTableData(page, limit);
      setData(m.data); setTotal(m.total); setLoading(false);
    }
  }, [backendOnline, page, soil, crop, fert]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = Math.ceil(total / limit);

  const displayData = search
    ? data.filter(row =>
        Object.values(row).some(v =>
          String(v).toLowerCase().includes(search.toLowerCase())
        )
      )
    : data;

  const exportCSV = () => {
    const header = COLS.join(",");
    const rows   = data.map(r => COLS.map(c => r[c] ?? "").join(","));
    const csv    = [header, ...rows].join("\n");
    const blob   = new Blob([csv], { type:"text/csv" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = "agrianalytics_data.csv"; a.click();
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Soil Type</label>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              value={soil} onChange={e => { setSoil(e.target.value); setPage(1); }}>
              <option value="all">All Soils</option>
              {filters.soils.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[130px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Crop</label>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              value={crop} onChange={e => { setCrop(e.target.value); setPage(1); }}>
              <option value="all">All Crops</option>
              {filters.crops.map((c: string) => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[160px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fertilizer</label>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              value={fert} onChange={e => { setFert(e.target.value); setPage(1); }}>
              <option value="all">All Fertilizers</option>
              {filters.fertilizers.map((f: string) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          {/* search */}
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-300"
                placeholder="Filter rows…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Showing <b>{displayData.length}</b> of <b>{total}</b> records (page {page}/{totalPages})</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-green-700 to-green-600 text-white">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-xs tracking-wider">#</th>
                {COLS.map(c => (
                  <th key={c} className="px-3 py-3 text-left font-semibold text-xs tracking-wider whitespace-nowrap">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLS.length + 1} className="text-center py-12 text-gray-400">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length + 1} className="text-center py-12 text-gray-400">No records found</td>
                </tr>
              ) : (
                displayData.map((row, idx) => (
                  <tr key={idx} className={`border-b border-gray-50 hover:bg-green-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="px-3 py-2.5 text-gray-400 text-xs font-mono">{(page-1)*limit + idx + 1}</td>
                    {COLS.map(col => {
                      const val = row[col];
                      const isCat = ["Soil","Crop","Fertilizer"].includes(col);
                      return (
                        <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                          {isCat
                            ? <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge(val)}`}>{val}</span>
                            : <span className="text-gray-700 font-mono text-xs">{typeof val === "number" ? val.toFixed(4) : val}</span>
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1 || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${p === page ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-white"}`}>
                  {p}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages || loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTableTab;
