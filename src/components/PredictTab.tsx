import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell
} from "recharts";
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

// ── Confidence color logic ─────────────────
function getConfidenceColor(confidence: number): string {
  if (confidence >= 20) return "#16a34a";   // green — strong
  if (confidence >= 10) return "#f59e0b";   // amber — moderate
  return "#94a3b8";                          // gray — low
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 20) return "bg-green-50 border-green-200";
  if (confidence >= 10) return "bg-amber-50 border-amber-200";
  return "bg-gray-50 border-gray-200";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 20) return "Strong Match";
  if (confidence >= 10) return "Moderate Match";
  return "Low Match";
}

// ── Crop emoji helper ──────────────────────
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

// ── Feature importance bar color ───────────
const FEAT_BAR_COLOR = "#94a3b8"; // desaturated gray-blue

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

  // ── Handle form change ─────────────────────
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

  // ── Input field definitions ────────────────
  const soilNutrientFields = [
    { name: "nitrogen",   label: "Nitrogen",    unit: "kg/ha", placeholder: "e.g., 40",  min: 0,  max: 200, step: 1 },
    { name: "phosphorus", label: "Phosphorus",  unit: "kg/ha", placeholder: "e.g., 60",  min: 0,  max: 300, step: 1 },
    { name: "potassium",  label: "Potassium",   unit: "kg/ha", placeholder: "e.g., 40",  min: 0,  max: 300, step: 1 },
    { name: "ph",         label: "pH Level",    unit: "pH",    placeholder: "e.g., 6.5", min: 0,  max: 14,  step: 0.1 },
    { name: "carbon",     label: "Org. Carbon", unit: "",      placeholder: "e.g., 1.2", min: -2, max: 5,   step: 0.1 },
  ];

  const climateFields = [
    { name: "temperature", label: "Temperature", unit: "°C",  placeholder: "e.g., 25",  min: 0,  max: 60,  step: 0.1 },
    { name: "moisture",    label: "Moisture",     unit: "0-1", placeholder: "e.g., 0.6", min: 0,  max: 1,   step: 0.01 },
    { name: "rainfall",    label: "Rainfall",     unit: "mm",  placeholder: "e.g., 150", min: 0,  max: 500, step: 1 },
  ];

  // ── Render input field ─────────────────────
  const renderField = (field: typeof soilNutrientFields[0]) => (
    <div key={field.name} className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {field.label}
      </label>
      <div className="relative">
        <input
          type="number"
          name={field.name}
          value={form[field.name as keyof typeof form]}
          onChange={handleChange}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          className="w-full border border-gray-150 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent pr-12 bg-white"
        />
        {field.unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
            {field.unit}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Two Column Layout ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ═══════════════════════════════════
            LEFT: Input Form (7 cols)
        ═══════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-6">

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">

            {/* Title */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                🌾 Crop Recommendation Engine
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Enter your farm's environmental and soil conditions to receive
                AI-powered crop recommendations.
              </p>
            </div>

            {/* ── Group 1: Soil & Nutrients ──── */}
            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Soil & Nutrients
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {soilNutrientFields.map(renderField)}
                {/* Soil dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Soil Type
                  </label>
                  <select
                    name="soil"
                    value={form.soil}
                    onChange={handleChange}
                    className="w-full border border-gray-150 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent bg-white"
                  >
                    {SOIL_TYPES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Divider ────────────────────── */}
            <div className="h-px bg-gray-100 my-2" />

            {/* ── Group 2: Climate Conditions ── */}
            <div className="mb-6 mt-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                Climate Conditions
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {climateFields.map(renderField)}
              </div>
            </div>

            {/* ── Action Buttons ─────────────── */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handlePredict}
                disabled={loading || !backendOnline}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl shadow-[0_4px_12px_rgba(22,163,74,0.35)] hover:shadow-[0_6px_16px_rgba(22,163,74,0.45)] transition-all text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>🌾 Predict Optimal Crop</>
                )}
              </button>
              <button
                onClick={() => { setForm(DEFAULT_FORM); setResult(null); setError(""); }}
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition font-medium"
              >
                Reset
              </button>
              {!backendOnline && (
                <p className="text-xs text-amber-600 font-semibold ml-2">
                  ⚠️ Backend must be online
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* ── Model Info Badge ──────────────── */}
          <div className="flex items-center gap-2 px-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-[10px] text-gray-400">
              Powered by Random Forest Classifier · Trained on Agriculture Dataset · 60% accuracy across 33 crop classes
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════
            RIGHT: Results Panel (5 cols)
        ═══════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-6">

          {/* ── No results state ──────────────── */}
          {!result && !loading && (
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-8 text-center">
              <span className="text-5xl mb-4 block">🌱</span>
              <h3 className="text-base font-bold text-gray-700">
                Ready to Predict
              </h3>
              <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
                Fill in the soil and climate conditions on the left,
                then click <b>"Predict Optimal Crop"</b> to see recommendations.
              </p>
            </div>
          )}

          {/* ── Loading state ─────────────────── */}
          {loading && (
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-8 text-center">
              <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500 font-medium">
                Analyzing soil conditions...
              </p>
            </div>
          )}

          {/* ── Results ───────────────────────── */}
          {result && (
            <>
              {/* Top prediction */}
              <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                  Top Prediction
                </p>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">
                        {getCropEmoji(result.top_3_crops[0].crop)}
                      </span>
                      <div>
                        <p className="text-xl font-black text-green-800 capitalize">
                          {result.top_3_crops[0].crop}
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-0.5">
                          Best match for your conditions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-green-700">
                        {result.top_3_crops[0].confidence}%
                      </p>
                      <p className="text-[10px] text-green-500 font-semibold uppercase">
                        Confidence
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alternative options */}
              <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">
                  Alternative Options
                </p>
                <div className="space-y-3">
                  {result.top_3_crops.slice(1).map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 ${getConfidenceBg(item.confidence)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {getCropEmoji(item.crop)}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-gray-700 capitalize">
                              {item.crop}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {getConfidenceLabel(item.confidence)}
                            </p>
                          </div>
                        </div>
                        <span className="text-lg font-black" style={{ color: getConfidenceColor(item.confidence) }}>
                          {item.confidence}%
                        </span>
                      </div>
                      {/* Confidence bar */}
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(item.confidence * 4, 100)}%`,
                            backgroundColor: getConfidenceColor(item.confidence)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feature importance */}
              {featImportance.length > 0 && (
                <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Feature Influence
                  </p>
                  <p className="text-[10px] text-gray-400 mb-4">
                    What influenced this prediction the most?
                  </p>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={featImportance}
                      layout="vertical"
                      margin={{ top: 0, right: 40, left: 70, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                      />
                      <Tooltip
                        formatter={(v: any) => [`${v}%`, "Importance"]}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="value"
                        radius={[0, 6, 6, 0]}
                        barSize={16}
                      >
                        {featImportance.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={FEAT_BAR_COLOR}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* ── Feature importance (before prediction) ── */}
          {!result && !loading && featImportance.length > 0 && (
            <div className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.05)] border border-gray-100 p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                Global Feature Influence
              </p>
              <p className="text-[10px] text-gray-400 mb-4">
                Which factors influence crop selection the most?
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={featImportance}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 70, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip
                    formatter={(v: any) => [`${v}%`, "Importance"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 6, 6, 0]}
                    barSize={16}
                  >
                    {featImportance.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={FEAT_BAR_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PredictTab;