import React, { useEffect, useState } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import SectionCard from "./SectionCard";
import { fetchCorrelation, fetchScatter } from "../services/api";
import { mockCorrelation, mockScatter } from "../services/mockData";

const NUMERIC_COLS = ["Temperature","Moisture","Rainfall","PH","Nitrogen","Phosphorus","Potassium","Carbon"];
const SOIL_COLORS: Record<string,string> = {
  "Loamy Soil":  "#22c55e",
  "Peaty Soil":  "#f59e0b",
  "Acidic Soil": "#ef4444",
  "Sandy Soil":  "#3b82f6",
  "Clay Soil":   "#8b5cf6",
};

// colour scale for correlation heatmap
function corrColor(v: number) {
  if (v >= 0.7)  return "#166534";
  if (v >= 0.4)  return "#16a34a";
  if (v >= 0.1)  return "#86efac";
  if (v >= -0.1) return "#f3f4f6";
  if (v >= -0.4) return "#fca5a5";
  if (v >= -0.7) return "#ef4444";
  return "#7f1d1d";
}
function textColor(v: number) {
  const abs = Math.abs(v);
  return abs >= 0.4 ? "#fff" : "#374151";
}

const CorrelationTab: React.FC<{ backendOnline: boolean }> = ({ backendOnline }) => {
  const [corrData,  setCorrData]  = useState<any[]>([]);
  const [scatterX,  setScatterX]  = useState("Temperature");
  const [scatterY,  setScatterY]  = useState("Moisture");
  const [scatterData, setScatterData] = useState<any[]>([]);
  const [groupBy,   setGroupBy]   = useState<"Soil"|"Crop">("Soil");

  const loadScatter = (x: string, y: string) => {
    if (backendOnline) {
      fetchScatter(x, y).then(setScatterData).catch(() => setScatterData(mockScatter(x, y)));
    } else {
      setScatterData(mockScatter(x, y));
    }
  };

  useEffect(() => {
    if (backendOnline) {
      fetchCorrelation().then(setCorrData).catch(() => setCorrData(mockCorrelation));
    } else {
      setCorrData(mockCorrelation);
    }
    loadScatter(scatterX, scatterY);
  }, [backendOnline]);

  useEffect(() => { loadScatter(scatterX, scatterY); }, [scatterX, scatterY]);

  const colorMap: Record<string,string> = groupBy === "Soil" ? SOIL_COLORS : {
    rice:"#3b82f6", wheat:"#22c55e", maize:"#f59e0b", soybean:"#ef4444", cotton:"#8b5cf6"
  };

  const groupKeys = Object.keys(colorMap);
  const scatterGroups: Record<string, any[]> = {};
  scatterData.forEach(d => {
    const key = d[groupBy] ?? "Other";
    if (!scatterGroups[key]) scatterGroups[key] = [];
    scatterGroups[key].push(d);
  });

  // Build heatmap matrix
  const heatMap: Record<string, Record<string, number>> = {};
  corrData.forEach(({ x, y, value }) => {
    if (!heatMap[x]) heatMap[x] = {};
    heatMap[x][y] = value;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

      {/* Scatter Plot */}
      <SectionCard
        title="Scatter Plot Explorer"
        subtitle="Explore relationships between any two variables"
        className="xl:col-span-2"
        action={
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs text-gray-500">X:</label>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
              value={scatterX} onChange={e => setScatterX(e.target.value)}>
              {NUMERIC_COLS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="text-xs text-gray-500">Y:</label>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
              value={scatterY} onChange={e => setScatterY(e.target.value)}>
              {NUMERIC_COLS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="text-xs text-gray-500">Color by:</label>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
              value={groupBy} onChange={e => setGroupBy(e.target.value as any)}>
              <option value="Soil">Soil</option>
              <option value="Crop">Crop</option>
            </select>
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={scatterX} type="number" name={scatterX} tick={{ fontSize: 11 }}
              label={{ value: scatterX, position: "insideBottom", offset: -5, fontSize: 12 }} />
            <YAxis dataKey={scatterY} type="number" name={scatterY} tick={{ fontSize: 11 }}
              label={{ value: scatterY, angle: -90, position: "insideLeft", fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
                    <p className="font-bold text-gray-700 mb-1">{d?.[groupBy]}</p>
                    <p><span className="text-gray-500">{scatterX}:</span> <b>{d?.[scatterX]?.toFixed(3)}</b></p>
                    <p><span className="text-gray-500">{scatterY}:</span> <b>{d?.[scatterY]?.toFixed(3)}</b></p>
                  </div>
                );
              }}
            />
            <Legend />
            {groupKeys.map(key => (
              <Scatter
                key={key} name={key}
                data={scatterGroups[key] ?? []}
                fill={colorMap[key] ?? "#94a3b8"}
                opacity={0.75}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Correlation Heatmap */}
      <SectionCard title="Correlation Heatmap" subtitle="Pearson correlation between all numeric variables" className="xl:col-span-2">
        <div className="overflow-x-auto">
          <table className="mx-auto border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-24 h-8" />
                {NUMERIC_COLS.map(c => (
                  <th key={c} className="h-8 px-1 font-semibold text-gray-600 text-center"
                    style={{ fontSize: 10, writingMode: "vertical-rl", transform: "rotate(180deg)", width: 52 }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NUMERIC_COLS.map(row => (
                <tr key={row}>
                  <td className="pr-2 font-semibold text-gray-600 text-right" style={{ fontSize: 10 }}>{row}</td>
                  {NUMERIC_COLS.map(col => {
                    const v = heatMap[row]?.[col] ?? 0;
                    return (
                      <td key={col} title={`${row} vs ${col}: ${v.toFixed(3)}`}
                        className="w-12 h-12 text-center rounded-sm border border-white cursor-default transition-transform hover:scale-110"
                        style={{ backgroundColor: corrColor(v), color: textColor(v), fontWeight: 600, fontSize: 10 }}>
                        {v.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex items-center justify-center mt-4 gap-1 text-xs text-gray-500">
          <div className="w-6 h-3 rounded" style={{ background:"#7f1d1d" }} />
          <span>-1.0</span>
          {["#ef4444","#fca5a5","#f3f4f6","#86efac","#16a34a","#166534"].map((c,i) => (
            <div key={i} className="w-6 h-3 rounded" style={{ background:c }} />
          ))}
          <span>+1.0</span>
          <span className="ml-4">Strong negative → Neutral → Strong positive</span>
        </div>
      </SectionCard>

      {/* Insights Panel */}
      <SectionCard title="Correlation Insights" subtitle="Key analytical observations" className="xl:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { pair:"Temperature ↔ Moisture", val:"-0.42", desc:"As temperature rises, soil moisture decreases — evapotranspiration effect.", color:"bg-red-50 border-red-200" },
            { pair:"Nitrogen ↔ Phosphorus", val:"+0.43", desc:"Moderate positive — crops with high N demand also need more P for protein synthesis.", color:"bg-green-50 border-green-200" },
            { pair:"Rainfall ↔ Moisture", val:"+0.38", desc:"More rainfall leads to higher soil moisture — important for irrigation planning.", color:"bg-blue-50 border-blue-200" },
            { pair:"pH ↔ Carbon", val:"+0.22", desc:"Higher pH soils tend to have slightly better organic carbon retention.", color:"bg-purple-50 border-purple-200" },
          ].map(ins => (
            <div key={ins.pair} className={`rounded-xl border p-4 ${ins.color}`}>
              <p className="font-bold text-gray-800 text-sm">{ins.pair}</p>
              <p className="text-2xl font-black mt-1 mb-2 text-gray-700">{ins.val}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{ins.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

export default CorrelationTab;
