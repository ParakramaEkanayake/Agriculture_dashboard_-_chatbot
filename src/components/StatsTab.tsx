import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import SectionCard from "./SectionCard";
import { fetchStats, fetchDistribution } from "../services/api";
import { mockDistribution } from "../services/mockData";

const COLS = ["Temperature","Moisture","Rainfall","PH","Nitrogen","Phosphorus","Potassium","Carbon"];
const COL_COLORS: Record<string,string> = {
  Temperature:"#ef4444", Moisture:"#3b82f6", Rainfall:"#06b6d4",
  PH:"#8b5cf6", Nitrogen:"#22c55e", Phosphorus:"#f59e0b",
  Potassium:"#f97316", Carbon:"#6366f1",
};
const COL_UNITS: Record<string,string> = {
  Temperature:"°C", Moisture:"", Rainfall:"mm",
  PH:"", Nitrogen:"kg/ha", Phosphorus:"kg/ha",
  Potassium:"kg/ha", Carbon:"%",
};

const mockStats: Record<string,any> = {
  Temperature:  {mean:36.52, median:36.48, std:10.81, min:18.03, max:54.97},
  Moisture:     {mean:0.5502,median:0.5503,std:0.2023,min:0.2002,max:0.8999},
  Rainfall:     {mean:250.1, median:250.4, std:40.37, min:180.1, max:319.9},
  PH:           {mean:6.83,  median:6.83,  std:1.156, min:4.800, max:8.799},
  Nitrogen:     {mean:65.21, median:65.3,  std:20.41, min:30.02, max:99.97},
  Phosphorus:   {mean:104.9, median:104.8, std:37.72, min:40.05, max:169.9},
  Potassium:    {mean:107.4, median:107.5, std:30.41, min:55.03, max:159.9},
  Carbon:       {mean:1.152, median:1.149, std:0.9513,min:-0.498,max:2.799},
};

const StatsTab: React.FC<{ backendOnline: boolean }> = ({ backendOnline }) => {
  const [stats,    setStats]    = useState<any>(mockStats);
  const [selCol,   setSelCol]   = useState("Temperature");
  const [histData, setHistData] = useState<any[]>([]);

  useEffect(() => {
    if (backendOnline) {
      fetchStats().then(setStats).catch(() => setStats(mockStats));
    }
    loadHist(selCol);
  }, [backendOnline]);

  const loadHist = (col: string) => {
    if (backendOnline) {
      fetchDistribution(col, 25).then(setHistData).catch(() => setHistData(mockDistribution(col)));
    } else {
      setHistData(mockDistribution(col));
    }
  };

  useEffect(() => { loadHist(selCol); }, [selCol]);

  const statRows = COLS.map(c => ({
    col: c,
    ...stats[c],
    unit: COL_UNITS[c],
    color: COL_COLORS[c],
  })).filter(r => r.mean !== undefined);

  const colStat = stats[selCol] ?? {};

  return (
    <div className="space-y-6">
      {/* Stats Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Descriptive Statistics</h3>
          <p className="text-xs text-gray-500 mt-0.5">Summary statistics for all numeric variables (n = 500)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Variable","Unit","Mean","Median","Std Dev","Min","Max"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statRows.map((r) => (
                <tr key={r.col} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${selCol === r.col ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}
                  onClick={() => setSelCol(r.col)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                      <span className="font-semibold text-gray-800">{r.col}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{r.unit || "—"}</td>
                  <td className="px-5 py-3 font-mono text-gray-700">{(+r.mean).toFixed(4)}</td>
                  <td className="px-5 py-3 font-mono text-gray-700">{(+r.median).toFixed(4)}</td>
                  <td className="px-5 py-3 font-mono text-gray-700">{(+r.std).toFixed(4)}</td>
                  <td className="px-5 py-3 font-mono text-red-600">{(+r.min).toFixed(4)}</td>
                  <td className="px-5 py-3 font-mono text-green-700">{(+r.max).toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 px-6 py-2 bg-gray-50">Click a row to view distribution histogram</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histogram */}
        <SectionCard
          title={`${selCol} Distribution`}
          subtitle={`Frequency histogram — click table rows to change variable`}
        >
          <div className="flex gap-4 mb-3">
            {[
              { label:"Mean",   val: colStat.mean?.toFixed(3),   color:"text-blue-600" },
              { label:"Median", val: colStat.median?.toFixed(3), color:"text-green-600" },
              { label:"Std",    val: colStat.std?.toFixed(3),    color:"text-purple-600" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={histData} margin={{ top: 5, right: 10, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-40} textAnchor="end" interval={1} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" name="Frequency" fill={COL_COLORS[selCol] ?? "#22c55e"} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Mean comparison bar chart */}
        <SectionCard title="Mean Values Comparison" subtitle="Normalized comparison across all numeric variables">
          <ResponsiveContainer width="100%" height={310}>
            <BarChart data={statRows} layout="vertical" margin={{ top: 5, right: 40, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="col" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v: any) => [v.toFixed(4), "Mean"]} />
              <Bar dataKey="mean" name="Mean" radius={[0,6,6,0]}>
                {statRows.map(r => <Cell key={r.col} fill={r.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Box-plot style summary */}
        <SectionCard title="Min–Max Range Overview" subtitle="Value ranges for each numeric variable" className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statRows.map(r => (
              <div key={r.col} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                  <span className="text-xs font-bold text-gray-700">{r.col}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Min</span>
                    <span className="font-mono font-semibold text-red-500">{(+r.min).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mean</span>
                    <span className="font-mono font-semibold text-gray-700">{(+r.mean).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max</span>
                    <span className="font-mono font-semibold text-green-600">{(+r.max).toFixed(2)}</span>
                  </div>
                  {/* Mini range bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full" style={{
                      background: r.color,
                      width: `${Math.min(100, Math.max(5, ((r.mean - r.min)/(r.max - r.min))*100))}%`
                    }} />
                  </div>
                  <p className="text-gray-400" style={{ fontSize: 9 }}>Mean position in range</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default StatsTab;
