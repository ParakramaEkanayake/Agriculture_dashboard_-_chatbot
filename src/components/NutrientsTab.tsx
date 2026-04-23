import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line,
} from "recharts";
import SectionCard from "./SectionCard";
import { fetchNutrientsBySoil, fetchNutrientsByCrop, fetchRainfallNitrogen, fetchDistribution } from "../services/api";
import { mockNutrientsBySoil, mockNutrientsByCrop, mockRainfallNitrogen, mockDistribution } from "../services/mockData";

const NUTRIENT_COLORS = { Nitrogen: "#22c55e", Phosphorus: "#3b82f6", Potassium: "#f59e0b", Carbon: "#8b5cf6" };

const NutrientsTab: React.FC<{ backendOnline: boolean }> = ({ backendOnline }) => {
  const [bySoil,    setBySoil]    = useState<any[]>([]);
  const [byCrop,    setByCrop]    = useState<any[]>([]);
  const [rfNit,     setRfNit]     = useState<any[]>([]);
  const [histCol,   setHistCol]   = useState("Nitrogen");
  const [histData,  setHistData]  = useState<any[]>([]);

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
    } else {
      setBySoil(mockNutrientsBySoil);
      setByCrop(mockNutrientsByCrop);
      setRfNit(mockRainfallNitrogen);
    }
    loadHist(histCol);
  }, [backendOnline]);

  useEffect(() => { loadHist(histCol); }, [histCol]);

  // Build radar data (by soil)
  const radarData = bySoil.map(d => ({
    subject: d.Soil?.replace(" Soil","") ?? d.Soil,
    N: +(d.Nitrogen ?? 0).toFixed(1),
    P: +(d.Phosphorus ?? 0).toFixed(1),
    K: +(d.Potassium ?? 0).toFixed(1),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* NPK by Crop – Grouped Bar */}
      <SectionCard title="NPK Levels by Crop" subtitle="Average Nitrogen, Phosphorus & Potassium per crop" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={byCrop} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="Crop" tick={{ fontSize: 12 }} tickFormatter={v => v.charAt(0).toUpperCase()+v.slice(1)} />
            <YAxis tick={{ fontSize: 11 }} label={{ value:"kg/ha", angle:-90, position:"insideLeft", fontSize:11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Nitrogen"   fill={NUTRIENT_COLORS.Nitrogen}   radius={[4,4,0,0]} />
            <Bar dataKey="Phosphorus" fill={NUTRIENT_COLORS.Phosphorus} radius={[4,4,0,0]} />
            <Bar dataKey="Potassium"  fill={NUTRIENT_COLORS.Potassium}  radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* NPK by Soil – Grouped Bar */}
      <SectionCard title="NPK Levels by Soil Type" subtitle="Average nutrient concentrations across soil categories">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={bySoil} margin={{ top: 10, right: 10, left: 0, bottom: 55 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="Soil" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Nitrogen"   fill={NUTRIENT_COLORS.Nitrogen}   radius={[4,4,0,0]} />
            <Bar dataKey="Phosphorus" fill={NUTRIENT_COLORS.Phosphorus} radius={[4,4,0,0]} />
            <Bar dataKey="Potassium"  fill={NUTRIENT_COLORS.Potassium}  radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Radar – NPK by Soil */}
      <SectionCard title="Soil Nutrient Radar" subtitle="Comparative N-P-K across soil types">
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[50, 120]} tick={{ fontSize: 9 }} />
            <Radar name="Nitrogen"   dataKey="N" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
            <Radar name="Phosphorus" dataKey="P" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
            <Radar name="Potassium"  dataKey="K" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Carbon by Soil */}
      <SectionCard title="Organic Carbon by Soil Type" subtitle="Average carbon content — indicator of soil health">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bySoil} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 2]} />
            <YAxis dataKey="Soil" type="category" tick={{ fontSize: 10 }} width={80} />
            <Tooltip />
            <Bar dataKey="Carbon" name="Carbon (%)" fill={NUTRIENT_COLORS.Carbon} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Rainfall vs Nitrogen */}
      <SectionCard title="Rainfall vs Nitrogen by Crop" subtitle="Relationship between rainfall and nitrogen uptake">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={rfNit} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="Crop" tick={{ fontSize: 12 }} tickFormatter={v => v.charAt(0).toUpperCase()+v.slice(1)} />
            <YAxis yAxisId="rain" orientation="left"  tick={{ fontSize: 11 }} label={{ value:"Rainfall(mm)", angle:-90, position:"insideLeft", fontSize:10 }} />
            <YAxis yAxisId="nit"  orientation="right" tick={{ fontSize: 11 }} label={{ value:"Nitrogen",     angle:90,  position:"insideRight",fontSize:10 }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="rain" type="monotone" dataKey="Rainfall"  stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5 }} />
            <Line yAxisId="nit"  type="monotone" dataKey="Nitrogen"  stroke="#22c55e" strokeWidth={2.5} dot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* Histogram – selectable column */}
      <SectionCard
        title="Nutrient Distribution Histogram"
        subtitle="Frequency distribution of selected variable"
        action={
          <select
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-300"
            value={histCol}
            onChange={e => setHistCol(e.target.value)}
          >
            {["Nitrogen","Phosphorus","Potassium","Carbon","Temperature","Moisture","Rainfall","PH"].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        }
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={histData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-35} textAnchor="end" interval={1} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" name="Frequency" fill="#22c55e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
};

export default NutrientsTab;
