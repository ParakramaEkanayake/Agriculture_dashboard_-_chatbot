import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip,
  LineChart, Line,
} from "recharts";
import SectionCard from "./SectionCard";
import { fetchData } from "../services/api";
import { mockTableData } from "../services/mockData";

const METRICS = [
  { key: "Temperature", label: "Temperature vs Date", subtitle: "Daily temperature readings", color: "#ef4444" },
  { key: "Moisture", label: "Moisture vs Date", subtitle: "Soil moisture over time", color: "#3b82f6" },
  { key: "Rainfall", label: "Rainfall vs Date", subtitle: "Rainfall measurements by day", color: "#0ea5e9" },
  { key: "PH", label: "PH vs Date", subtitle: "Soil acidity over time", color: "#f59e0b" },
  { key: "Nitrogen", label: "Nitrogen vs Date", subtitle: "Nitrogen levels over time", color: "#22c55e" },
  { key: "Phosphorus", label: "Phosphorus vs Date", subtitle: "Phosphorus levels over time", color: "#8b5cf6" },
  { key: "Potassium", label: "Potassium vs Date", subtitle: "Potassium levels over time", color: "#e11d48" },
  { key: "Carbon", label: "Carbon vs Date", subtitle: "Organic carbon over time", color: "#0f766e" },
];

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const buildTimeSeries = (rows: any[]) => {
  return rows.map((row) => {
    const [month, day, year] = row.Date.split('/').map(Number);
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

const OverviewTab: React.FC<{ backendOnline: boolean; selectedCrop: string }> = ({ backendOnline, selectedCrop }) => {
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const loadSeries = async () => {
      try {
        if (backendOnline) {
          const result = await fetchData(1, 500, "all", selectedCrop, "all");
          setTimeSeries(buildTimeSeries(result.data));
        } else {
          setTimeSeries(buildTimeSeries(mockTableData(1, 500).data));
        }
      } catch {
        setTimeSeries(buildTimeSeries(mockTableData(1, 500).data));
      }
    };
    loadSeries();
  }, [backendOnline, selectedCrop]);

  const cropFiltered = timeSeries;

  const sortedSeries = [...cropFiltered].sort((a, b) => a.date.localeCompare(b.date));
  const defaultTo = sortedSeries.length ? sortedSeries[sortedSeries.length - 1].date : "";
  const defaultFrom = sortedSeries.length
    ? sortedSeries[Math.max(sortedSeries.length - 30, 0)].date
    : "";
  const effectiveFrom = fromDate || defaultFrom;
  const effectiveTo = toDate || defaultTo;

  const displaySeries = sortedSeries.filter(row => {
    if (!row.date) return false;
    if (effectiveFrom && row.date < effectiveFrom) return false;
    if (effectiveTo && row.date > effectiveTo) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.24em]">From</label>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.24em]">To</label>
              <input
                type="date"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Showing latest 30 dates by default. Select a date range to refine charts.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {METRICS.map(metric => (
          <SectionCard key={metric.key} title={metric.label} subtitle={metric.subtitle}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={displaySeries} margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={Math.max(0, Math.floor(displaySeries.length / 8))}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [value, metric.key]} />
                <Line type="monotone" dataKey={metric.key} stroke={metric.color} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        ))}
      </div>
    </div>
  );
};

export default OverviewTab;
