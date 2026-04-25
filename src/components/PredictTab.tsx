import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import SectionCard from "./SectionCard";
import { predictCrop, fetchFeatureImportance } from "../services/api";

// ── Valid soil types ───────────────────────
const SOIL_TYPES = [
  "Acidic Soil",
  "Alkaline Soil",
  "Loamy Soil",
  "Neutral Soil",
  "Peaty Soil"
];

// ── Default form values ────────────────────
const DEFAULT_FORM = {
  temperature: 25.0,
  moisture:    0.6,
  rainfall:    150.0,
  ph:          6.5,
  nitrogen:    40.0,
  phosphorus:  60.0,
  potassium:   40.0,
  carbon:      1.2,
  soil:        "Loamy Soil"
};

// ── Confidence bar colors ──────────────────
const CROP_COLORS = ["#16a34a", "#22c55e", "#86efac"];

// ── Feature importance colors ──────────────
const FEAT_COLORS: Record<string, string> = {
  Temperature:  "#ef4444",
  Rainfall:     "#3b82f6",
  Nitrogen:     "#22c55e",
  PH:           "#8b5cf6",
  Phosphorus:   "#f59e0b",
  Potassium:    "#f97316",
  Moisture:     "#06b6d4",
  Carbon:       "#6366f1",
};

// ── Crop emojis ────────────────────────────
function getCropEmoji(crop: string): string {
  const map: Record<string, string> = {
    rice: "🌾", wheat: "🌾", maize: "🌽",
    coffee: "☕", tea: "🍵", cotton: "🌿",
    banana: "🍌", mango: "🥭", apple: "🍎",
    orange: "🍊", grapes: "🍇", watermelon: "🍉",
    papaya: "🍈", coconut: "🥥", rubber: "🌳",
    sugarcane: "🎋", tobacco: "🌿", jute: "🌿",
  };
  return map[crop.toLowerCase()] ?? "🌱";
}

// ─────────────────────────────────────────────
//  PredictTab Component
// ─────────────────────────────────────────────

const PredictTab: React.FC<{ backendOnline: boolean }> = ({ backendOnline }) => {
  const [form,           setForm]           = useState(DEFAULT_FORM);
  const [result,         setResult]         = useState<any>(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [featImportance, setFeatImportance] = useState<any[]>([]);

  // ── Load feature importance on mount ──────
  useEffect(() => {
    if (backendOnline) {
      fetchFeatureImportance()
        .then(data => {
          const arr = Object.entries(data).map(([name, value]) => ({
            name,
            value: value as number,
          }));
          setFeatImportance(arr);
        })
        .catch(() => {});
    }
  }, [backendOnline]);

  // ── Handle form input change ───────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "soil" ? value : parseFloat(value) || 0
    }));
  };

  // ── Handle prediction ──────────────────────
  const handlePredict = async () => {
    if (!backendOnline) {
      setError("Backend must be online to use predictions.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await predictCrop(form);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
        // Update feature importance from result
        if (res.feature_importance) {
          const arr = Object.entries(res.feature_importance).map(
            ([name, value]) => ({ name, value: value as number })
          );
          setFeatImportance(arr);
        }
      }
    } catch {
      setError("Prediction failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  // ── Input field config ─────────────────────
  const inputFields = [
    { name: "temperature", label: "Temperature",  unit: "°C",    min: 0,   max: 60,  step: 0.1 },
    { name: "moisture",    label: "Moisture",     unit: "0-1",   min: 0,   max: 1,   step: 0.01 },
    { name: "rainfall",    label: "Rainfall",     unit: "mm",    min: 0,   max: 500, step: 1 },
    { name: "ph",          label: "Soil pH",      unit: "pH",    min: 0,   max: 14,  step: 0.1 },
    { name: "nitrogen",    label: "Nitrogen",     unit: "kg/ha", min: 0,   max: 200, step: 1 },
    { name: "phosphorus",  label: "Phosphorus",   unit: "kg/ha", min: 0,   max: 300, step: 1 },
    { name: "potassium",   label: "Potassium",    unit: "kg/ha", min: 0,   max: 300, step: 1 },
    { name: "carbon",      label: "Org. Carbon",  unit: "",      min: -2,  max: 5,   step: 0.1 },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────── */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-black">🌾 Crop Recommendation Engine</h2>
        <p className="text-green-100 mt-1 text-sm">
          Enter your farm's environmental and soil conditions to get
          AI-powered crop recommendations.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-xs text-green-200">
            Powered by Random Forest Model • Trained on {" "}
            <strong>Agriculture Dataset</strong>
          </span>
        </div>
      </div>

      {/* ── Input Form ────────────────────────── */}
      <SectionCard
        title="Farm Conditions Input"
        subtitle="Enter your current soil and environmental measurements"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {inputFields.map(field => (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {field.label}
                {field.unit && (
                  <span className="ml-1 text-gray-400 normal-case">
                    ({field.unit})
                  </span>
                )}
              </label>
              <input
                type="number"
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                min={field.min}
                max={field.max}
                step={field.step}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 font-mono"
              />
            </div>
          ))}

          {/* Soil Type Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Soil Type
            </label>
            <select
              name="soil"
              value={form.soil}
              onChange={handleChange}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {SOIL_TYPES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Predict Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handlePredict}
            disabled={loading || !backendOnline}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Predicting...
              </>
            ) : (
              <>🌾 Predict Best Crop</>
            )}
          </button>

          <button
            onClick={() => { setForm(DEFAULT_FORM); setResult(null); setError(""); }}
            className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Reset
          </button>

          {!backendOnline && (
            <p className="text-xs text-amber-600 font-semibold">
              ⚠️ Backend must be online for predictions
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            ⚠️ {error}
          </div>
        )}
      </SectionCard>

      {/* ── Results ───────────────────────────── */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top 3 Crops */}
          <SectionCard
            title="🏆 Top 3 Recommended Crops"
            subtitle="Based on your farm conditions"
          >
            <div className="space-y-4 mt-2">
              {result.top_3_crops.map((item: any, idx: number) => (
                <div key={idx} className={`rounded-xl p-4 border ${
                  idx === 0
                    ? "bg-green-50 border-green-200"
                    : idx === 1
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-gray-50 border-gray-100"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getCropEmoji(item.crop)}
                      </span>
                      <div>
                        <p className={`font-bold text-sm capitalize ${
                          idx === 0 ? "text-green-800" : "text-gray-700"
                        }`}>
                          {idx === 0 && "⭐ "}
                          {item.crop}
                        </p>
                        <p className="text-xs text-gray-500">
                          Rank #{idx + 1} recommendation
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-black ${
                      idx === 0 ? "text-green-700" : "text-gray-600"
                    }`}>
                      {item.confidence}%
                    </span>
                  </div>
                  {/* Confidence bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(item.confidence * 4, 100)}%`,
                        background: CROP_COLORS[idx]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 mt-4">
              * Confidence scores are relative probabilities from the
              Random Forest model trained on {" "}
              <strong>Agriculture_dataset.csv</strong>
            </p>
          </SectionCard>

          {/* Feature Importance from result */}
          <SectionCard
            title="📊 Feature Importance"
            subtitle="What influenced this prediction the most?"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={featImportance}
                layout="vertical"
                margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip formatter={(v: any) => [`${v}%`, "Importance"]} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {featImportance.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={FEAT_COLORS[entry.name] ?? "#22c55e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>
      )}

      {/* ── Feature Importance (always visible) ── */}
      {featImportance.length > 0 && !result && (
        <SectionCard
          title="📊 Global Feature Importance"
          subtitle="Which factors influence crop selection the most? (from trained model)"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={featImportance}
              layout="vertical"
              margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={v => `${v}%`}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11 }}
                width={80}
              />
              <Tooltip formatter={(v: any) => [`${v}%`, "Importance"]} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {featImportance.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={FEAT_COLORS[entry.name] ?? "#22c55e"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
};

export default PredictTab;