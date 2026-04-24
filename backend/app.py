from llm_chat import llm_chat, reset_conversation
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import json
import os
import random

app = Flask(__name__)
CORS(app)

@app.route("/api/llm-chat", methods=["POST"])
def llm_chat_endpoint():
    """
    New LLM-powered chatbot endpoint.
    Returns both text response and optional dashboard filter instructions.
    Does NOT interfere with existing /api/chat.
    """
    data  = request.get_json(force=True)
    query = data.get("message", "").strip()
    session_id = data.get("session_id", "default")

    if not query:
        return jsonify({"error": "Empty message"}), 400

    result = llm_chat(query, session_id)

    return jsonify({
        "response":   result["response"],
        "filters":    result["filters"],
        "has_filter": result["has_filter"],
        "status":     result["status"]
    })


@app.route("/api/llm-chat/reset", methods=["POST"])
def llm_chat_reset():
    """
    Resets conversation history for LLM chatbot.
    """
    result = reset_conversation()
    return jsonify(result)
# ─────────────────────────────────────────────
#  Synthetic dataset generation (mirrors the
#  real CSV columns shown in the assignment)
# ─────────────────────────────────────────────
random.seed(42)
np.random.seed(42)

SOIL_TYPES  = ["Loamy Soil", "Peaty Soil", "Acidic Soil", "Sandy Soil", "Clay Soil"]
CROP_TYPES  = ["rice", "wheat", "maize", "soybean", "cotton"]
FERTILIZERS = [
    "Compost", "Balanced NPK", "Water Retention", "Organic Fe",
    "Gypsum", "Lime", "DAP", "Urea", "Muriate of Potash"
]

# def generate_dataset(n=500):
#     rows = []
#     for _ in range(n):
#         soil   = random.choice(SOIL_TYPES)
#         crop   = random.choice(CROP_TYPES)
#         fert   = random.choice(FERTILIZERS)

#         # realistic agronomic ranges
#         temp      = round(np.random.uniform(18, 55),  6)
#         moisture  = round(np.random.uniform(0.20, 0.90), 6)
#         rainfall  = round(np.random.uniform(180, 320),  4)
#         ph        = round(np.random.uniform(4.8, 8.8),  6)
#         nitrogen  = round(np.random.uniform(30, 100),   5)
#         phosphorus= round(np.random.uniform(40, 170),   4)
#         potassium = round(np.random.uniform(55, 160),   5)
#         carbon    = round(np.random.uniform(-0.5, 2.8), 6)
#         rows.append(dict(
#             Temperature=temp, Moisture=moisture, Rainfall=rainfall,
#             PH=ph, Nitrogen=nitrogen, Phosphorus=phosphorus,
#             Potassium=potassium, Carbon=carbon,
#             Soil=soil, Crop=crop, Fertilizer=fert
#         ))
#     return pd.DataFrame(rows)

# df = generate_dataset(500)

df = pd.read_csv(r"E:\Y4S2\VAU\Project\Agriculture_dashboard_-_chatbot\backend\Agriculture_dataset.csv")
# ─────────────────────────────────────────────
#  Helper: safe JSON serialisation
# ─────────────────────────────────────────────
def to_json(obj):
    if isinstance(obj, (np.integer,)):  return int(obj)
    if isinstance(obj, (np.floating,)): return float(obj)
    if isinstance(obj, np.ndarray):     return obj.tolist()
    raise TypeError(f"Not serialisable: {type(obj)}")

# ═══════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "rows": len(df)})

# ── Raw data (paginated) ──────────────────────
@app.route("/api/data")
def get_data():
    page  = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 50))
    soil  = request.args.get("soil", "all")
    crop  = request.args.get("crop", "all")
    fert  = request.args.get("fertilizer", "all")

    filtered = df.copy()
    if soil != "all":  filtered = filtered[filtered["Soil"]  == soil]
    if crop != "all":  filtered = filtered[filtered["Crop"]  == crop]
    if fert != "all":  filtered = filtered[filtered["Fertilizer"] == fert]

    total  = len(filtered)
    start  = (page - 1) * limit
    subset = filtered.iloc[start: start + limit]
    return jsonify({
        "total": total,
        "page":  page,
        "limit": limit,
        "data":  subset.to_dict(orient="records")
    })

# ── Summary statistics ────────────────────────
@app.route("/api/stats")
def get_stats():
    numeric_cols = ["Temperature","Moisture","Rainfall","PH",
                    "Nitrogen","Phosphorus","Potassium","Carbon"]
    stats = {}
    for col in numeric_cols:
        stats[col] = {
            "mean":   round(float(df[col].mean()), 4),
            "median": round(float(df[col].median()), 4),
            "std":    round(float(df[col].std()), 4),
            "min":    round(float(df[col].min()), 4),
            "max":    round(float(df[col].max()), 4),
        }
    return jsonify(stats)

# ── Distribution for a numeric column ─────────
@app.route("/api/distribution/<column>")
def distribution(column):
    if column not in df.columns:
        return jsonify({"error": "column not found"}), 404
    bins = int(request.args.get("bins", 20))
    counts, edges = np.histogram(df[column].dropna(), bins=bins)
    result = [
        {"range": f"{edges[i]:.2f}-{edges[i+1]:.2f}", "count": int(counts[i])}
        for i in range(len(counts))
    ]
    return jsonify(result)

# ── Soil type breakdown ───────────────────────
@app.route("/api/soil-distribution")
def soil_distribution():
    counts = df["Soil"].value_counts().reset_index()
    counts.columns = ["soil", "count"]
    return jsonify(counts.to_dict(orient="records"))

# ── Crop type breakdown ───────────────────────
@app.route("/api/crop-distribution")
def crop_distribution():
    counts = df["Crop"].value_counts().reset_index()
    counts.columns = ["crop", "count"]
    return jsonify(counts.to_dict(orient="records"))

# ── Fertilizer usage breakdown ────────────────
@app.route("/api/fertilizer-distribution")
def fertilizer_distribution():
    counts = df["Fertilizer"].value_counts().reset_index()
    counts.columns = ["fertilizer", "count"]
    return jsonify(counts.to_dict(orient="records"))

# ── Avg nutrient levels by soil type ─────────
@app.route("/api/nutrients-by-soil")
def nutrients_by_soil():
    grp = df.groupby("Soil")[["Nitrogen","Phosphorus","Potassium","Carbon"]].mean().round(2)
    result = grp.reset_index().to_dict(orient="records")
    return jsonify(result)

# ── Avg nutrient levels by crop ───────────────
@app.route("/api/nutrients-by-crop")
def nutrients_by_crop():
    grp = df.groupby("Crop")[["Nitrogen","Phosphorus","Potassium","Carbon"]].mean().round(2)
    result = grp.reset_index().to_dict(orient="records")
    return jsonify(result)

# ── Scatter data (any two numeric cols) ───────
@app.route("/api/scatter")
def scatter():
    x   = request.args.get("x", "Temperature")
    y   = request.args.get("y", "Moisture")
    soil= request.args.get("soil", "all")
    crop= request.args.get("crop", "all")

    filtered = df.copy()
    if soil != "all": filtered = filtered[filtered["Soil"] == soil]
    if crop != "all": filtered = filtered[filtered["Crop"] == crop]

    valid_cols = ["Temperature","Moisture","Rainfall","PH",
                  "Nitrogen","Phosphorus","Potassium","Carbon"]
    if x not in valid_cols or y not in valid_cols:
        return jsonify({"error": "invalid column"}), 400

    subset = filtered[[x, y, "Soil", "Crop"]].dropna().head(300)
    return jsonify(subset.to_dict(orient="records"))

# ── Correlation matrix ────────────────────────
@app.route("/api/correlation")
def correlation():
    numeric_cols = ["Temperature","Moisture","Rainfall","PH",
                    "Nitrogen","Phosphorus","Potassium","Carbon"]
    corr = df[numeric_cols].corr().round(3)
    result = []
    for c1 in numeric_cols:
        for c2 in numeric_cols:
            result.append({"x": c1, "y": c2, "value": float(corr.loc[c1, c2])})
    return jsonify(result)

# ── PH range analysis ─────────────────────────
@app.route("/api/ph-analysis")
def ph_analysis():
    def ph_category(ph):
        if ph < 5.5: return "Strongly Acidic"
        if ph < 6.5: return "Moderately Acidic"
        if ph < 7.5: return "Neutral"
        if ph < 8.5: return "Alkaline"
        return "Strongly Alkaline"

    temp_df = df.copy()
    temp_df["PH_Category"] = temp_df["PH"].apply(ph_category)
    counts = temp_df["PH_Category"].value_counts().reset_index()
    counts.columns = ["category", "count"]
    return jsonify(counts.to_dict(orient="records"))

# ── Temperature vs Moisture trend (binned) ────
@app.route("/api/temp-moisture-trend")
def temp_moisture_trend():
    temp_df = df.copy()
    temp_df["TempBin"] = pd.cut(temp_df["Temperature"], bins=10)
    grp = temp_df.groupby("TempBin", observed=True)["Moisture"].mean().round(4)
    result = [
        {"tempRange": str(idx), "avgMoisture": float(val)}
        for idx, val in grp.items()
    ]
    return jsonify(result)

# ── Rainfall vs Nitrogen by crop ──────────────
@app.route("/api/rainfall-nitrogen")
def rainfall_nitrogen():
    grp = df.groupby("Crop")[["Rainfall","Nitrogen"]].mean().round(2)
    result = grp.reset_index().to_dict(orient="records")
    return jsonify(result)

# ── Top-level KPIs ────────────────────────────
@app.route("/api/kpis")
def kpis():
    crop = request.args.get("crop", "all")
    filtered_df = df[df["Crop"] == crop] if crop != "all" else df

    def get_metric_stats(col):
        if len(filtered_df) == 0:
            return {"latest": None, "change_pct": 0, "change_dir": "neutral"}
        latest = round(float(filtered_df[col].iloc[-1]), 2 if col != "Moisture" else 4)
        if len(filtered_df) > 1:
            previous = round(float(filtered_df[col].iloc[-2]), 2 if col != "Moisture" else 4)
            if previous != 0:
                pct = round(((latest - previous) / previous) * 100, 2)
                direction = "up" if pct > 0 else "down" if pct < 0 else "neutral"
            else:
                pct = 0
                direction = "neutral"
        else:
            pct = 0
            direction = "neutral"
        return {"latest": latest, "change_pct": pct, "change_dir": direction}

    return jsonify({
        "total_records":      len(filtered_df),
        "temperature":        get_metric_stats("Temperature"),
        "moisture":           get_metric_stats("Moisture"),
        "nitrogen":           get_metric_stats("Nitrogen"),
        "phosphorus":         get_metric_stats("Phosphorus"),
        "potassium":          get_metric_stats("Potassium"),
        "avg_temperature":    round(float(filtered_df["Temperature"].mean()), 2),
        "avg_moisture":       round(float(filtered_df["Moisture"].mean()), 4),
        "avg_ph":             round(float(filtered_df["PH"].mean()), 2),
        "avg_nitrogen":       round(float(filtered_df["Nitrogen"].mean()), 2),
        "dominant_soil":      filtered_df["Soil"].value_counts().idxmax() if len(filtered_df) > 0 else None,
        "dominant_crop":      filtered_df["Crop"].value_counts().idxmax() if len(filtered_df) > 0 else None,
        "dominant_fertilizer":filtered_df["Fertilizer"].value_counts().idxmax() if len(filtered_df) > 0 else None,
        "soil_types":         int(filtered_df["Soil"].nunique()),
        "crop_types":         int(filtered_df["Crop"].nunique()),
        "fertilizer_types":   int(filtered_df["Fertilizer"].nunique()),
    })

# ── Filter options ────────────────────────────
@app.route("/api/filters")
def filters():
    return jsonify({
        "soils":       sorted(df["Soil"].unique().tolist()),
        "crops":       sorted(df["Crop"].unique().tolist()),
        "fertilizers": sorted(df["Fertilizer"].unique().tolist()),
    })

# ══════════════════════════════════════════════
#  AI CHATBOT ENDPOINT
# ══════════════════════════════════════════════

def build_context():
    """Build a rich context string about the dataset for the rule-based AI."""
    kpi = {
        "total":   len(df),
        "avg_temp": round(float(df["Temperature"].mean()), 2),
        "avg_moist":round(float(df["Moisture"].mean()), 4),
        "avg_ph":   round(float(df["PH"].mean()), 2),
        "avg_n":    round(float(df["Nitrogen"].mean()), 2),
        "avg_p":    round(float(df["Phosphorus"].mean()), 2),
        "avg_k":    round(float(df["Potassium"].mean()), 2),
        "avg_c":    round(float(df["Carbon"].mean()), 4),
        "avg_rain": round(float(df["Rainfall"].mean()), 2),
        "dom_soil": df["Soil"].value_counts().idxmax(),
        "dom_crop": df["Crop"].value_counts().idxmax(),
        "dom_fert": df["Fertilizer"].value_counts().idxmax(),
        "soils":    df["Soil"].unique().tolist(),
        "crops":    df["Crop"].unique().tolist(),
        "ferts":    df["Fertilizer"].unique().tolist(),
    }

    # Nutrient by crop
    crop_n = df.groupby("Crop")["Nitrogen"].mean().round(2).to_dict()
    crop_p = df.groupby("Crop")["Phosphorus"].mean().round(2).to_dict()
    crop_k = df.groupby("Crop")["Potassium"].mean().round(2).to_dict()
    soil_ph= df.groupby("Soil")["PH"].mean().round(2).to_dict()

    return kpi, crop_n, crop_p, crop_k, soil_ph

def chatbot_response(query: str) -> str:
    """Rule-based intelligent agricultural assistant."""
    q = query.lower().strip()
    kpi, crop_n, crop_p, crop_k, soil_ph = build_context()

    # ── Greetings ──────────────────────────────
    if any(w in q for w in ["hello","hi","hey","greet"]):
        return ("Hello! I'm **AgriBot**, your intelligent agricultural analytics assistant. "
                "I can answer questions about soil health, crop nutrients, fertilizer recommendations, "
                "pH levels, temperature, moisture, rainfall, and more. What would you like to know?")

    if any(w in q for w in ["help","what can you","capabilities","features"]):
        return (
            "🌾 **I can help you with:**\n\n"
            "• 📊 Dataset statistics (temperature, moisture, pH, nutrients)\n"
            "• 🌱 Crop-specific nutrient analysis (N, P, K)\n"
            "• 🏔️ Soil type comparisons and pH profiles\n"
            "• 💧 Rainfall and moisture trends\n"
            "• 🧪 Fertilizer recommendations by soil/crop\n"
            "• 📈 Correlation insights between variables\n"
            "• 🎯 Decision support for agricultural management\n\n"
            "Try asking: *'Which crop needs the most nitrogen?'* or *'What is the average pH?'*"
        )

    # ── Dataset overview ───────────────────────
    if any(w in q for w in ["overview","summary","about","dataset","describe"]):
        return (
            f"📋 **Dataset Overview**\n\n"
            f"• **Total Records:** {kpi['total']:,}\n"
            f"• **Soil Types:** {', '.join(kpi['soils'])}\n"
            f"• **Crops:** {', '.join(kpi['crops'])}\n"
            f"• **Fertilizers:** {len(kpi['ferts'])} types\n"
            f"• **Dominant Soil:** {kpi['dom_soil']}\n"
            f"• **Dominant Crop:** {kpi['dom_crop']}\n"
            f"• **Most Used Fertilizer:** {kpi['dom_fert']}\n\n"
            f"The dataset contains **11 variables** covering temperature, moisture, rainfall, "
            f"pH, nitrogen, phosphorus, potassium, carbon, soil type, crop type, and fertilizer."
        )

    # ── Temperature ────────────────────────────
    if "temperature" in q or "temp" in q:
        if "high" in q or "max" in q:
            return f"🌡️ The **maximum temperature** recorded in the dataset is **{df['Temperature'].max():.2f}°C**."
        if "low" in q or "min" in q:
            return f"🌡️ The **minimum temperature** recorded is **{df['Temperature'].min():.2f}°C**."
        by_crop = df.groupby("Crop")["Temperature"].mean().round(2).to_dict()
        crop_list = "\n".join([f"  • {c}: {v}°C" for c, v in by_crop.items()])
        return (
            f"🌡️ **Temperature Analysis**\n\n"
            f"• Average: **{kpi['avg_temp']}°C**\n"
            f"• Range: {df['Temperature'].min():.2f}°C – {df['Temperature'].max():.2f}°C\n"
            f"• Std Dev: {df['Temperature'].std():.2f}°C\n\n"
            f"**Average by Crop:**\n{crop_list}"
        )

    # ── Moisture ───────────────────────────────
    if "moisture" in q:
        by_soil = df.groupby("Soil")["Moisture"].mean().round(4).to_dict()
        soil_list = "\n".join([f"  • {s}: {v}" for s, v in by_soil.items()])
        return (
            f"💧 **Moisture Analysis**\n\n"
            f"• Average Moisture: **{kpi['avg_moist']}**\n"
            f"• Range: {df['Moisture'].min():.4f} – {df['Moisture'].max():.4f}\n\n"
            f"**Average by Soil Type:**\n{soil_list}\n\n"
            f"Higher moisture levels are typically observed in Peaty and Loamy soils."
        )

    # ── Rainfall ───────────────────────────────
    if "rainfall" in q or "rain" in q:
        by_crop = df.groupby("Crop")["Rainfall"].mean().round(2).to_dict()
        crop_list = "\n".join([f"  • {c}: {v} mm" for c, v in by_crop.items()])
        return (
            f"🌧️ **Rainfall Analysis**\n\n"
            f"• Average Rainfall: **{kpi['avg_rain']} mm**\n"
            f"• Range: {df['Rainfall'].min():.2f} – {df['Rainfall'].max():.2f} mm\n\n"
            f"**Average by Crop:**\n{crop_list}"
        )

    # ── pH ─────────────────────────────────────
    if "ph" in q or "acid" in q or "alkalin" in q:
        ph_list = "\n".join([f"  • {s}: pH {v}" for s, v in soil_ph.items()])
        return (
            f"🧪 **pH Analysis**\n\n"
            f"• Average pH: **{kpi['avg_ph']}**\n"
            f"• Range: {df['PH'].min():.2f} – {df['PH'].max():.2f}\n\n"
            f"**Average pH by Soil Type:**\n{ph_list}\n\n"
            f"💡 Optimal crop growth typically occurs between pH 6.0–7.5. "
            f"Acidic soils (<6) may benefit from lime application."
        )

    # ── Nitrogen ───────────────────────────────
    if "nitrogen" in q or " n " in q:
        highest = max(crop_n, key=crop_n.get)
        n_list  = "\n".join([f"  • {c}: {v} kg/ha" for c, v in crop_n.items()])
        return (
            f"🌿 **Nitrogen (N) Analysis**\n\n"
            f"• Dataset Average: **{kpi['avg_n']} kg/ha**\n"
            f"• **Highest need:** {highest} ({crop_n[highest]} kg/ha)\n\n"
            f"**By Crop:**\n{n_list}\n\n"
            f"💡 Nitrogen deficiency causes yellowing (chlorosis). "
            f"Consider **Urea** or **DAP** for nitrogen-deficient soils."
        )

    # ── Phosphorus ─────────────────────────────
    if "phosphorus" in q or "phospho" in q or " p " in q:
        highest = max(crop_p, key=crop_p.get)
        p_list  = "\n".join([f"  • {c}: {v} kg/ha" for c, v in crop_p.items()])
        return (
            f"🌿 **Phosphorus (P) Analysis**\n\n"
            f"• Dataset Average: **{kpi['avg_p']} kg/ha**\n"
            f"• **Highest need:** {highest} ({crop_p[highest]} kg/ha)\n\n"
            f"**By Crop:**\n{p_list}\n\n"
            f"💡 Phosphorus supports root development and energy transfer. "
            f"**DAP** (Di-Ammonium Phosphate) is a common phosphorus source."
        )

    # ── Potassium ──────────────────────────────
    if "potassium" in q or " k " in q:
        highest = max(crop_k, key=crop_k.get)
        k_list  = "\n".join([f"  • {c}: {v} kg/ha" for c, v in crop_k.items()])
        return (
            f"🌿 **Potassium (K) Analysis**\n\n"
            f"• Dataset Average: **{kpi['avg_k']} kg/ha**\n"
            f"• **Highest need:** {highest} ({crop_k[highest]} kg/ha)\n\n"
            f"**By Crop:**\n{k_list}\n\n"
            f"💡 Potassium strengthens plant immunity and improves drought resistance. "
            f"**Muriate of Potash** is the primary potassium fertilizer."
        )

    # ── Carbon ─────────────────────────────────
    if "carbon" in q or "organic" in q:
        by_soil = df.groupby("Soil")["Carbon"].mean().round(4).to_dict()
        s_list  = "\n".join([f"  • {s}: {v}" for s, v in by_soil.items()])
        return (
            f"♻️ **Carbon / Organic Matter Analysis**\n\n"
            f"• Average Carbon: **{kpi['avg_c']}**\n"
            f"• Range: {df['Carbon'].min():.4f} – {df['Carbon'].max():.4f}\n\n"
            f"**By Soil Type:**\n{s_list}\n\n"
            f"💡 Higher organic carbon improves soil water retention, structure, "
            f"and microbial activity. Compost additions can boost carbon levels."
        )

    # ── Soil comparison ────────────────────────
    if "soil" in q and ("compare" in q or "best" in q or "which" in q or "type" in q):
        n_by_soil = df.groupby("Soil")["Nitrogen"].mean().round(2).to_dict()
        best_n    = max(n_by_soil, key=n_by_soil.get)
        ph_by_soil= df.groupby("Soil")["PH"].mean().round(2).to_dict()
        return (
            f"🏔️ **Soil Type Comparison**\n\n"
            f"**Average pH by Soil:**\n"
            + "\n".join([f"  • {s}: {v}" for s, v in ph_by_soil.items()]) +
            f"\n\n**Average Nitrogen by Soil:**\n"
            + "\n".join([f"  • {s}: {v} kg/ha" for s, v in n_by_soil.items()]) +
            f"\n\n💡 **{best_n}** has the highest average nitrogen content. "
            f"Loamy soils generally offer the best balance of drainage and nutrients."
        )

    # ── Fertilizer ─────────────────────────────
    if "fertilizer" in q or "fertilis" in q or "recommend" in q:
        fert_counts = df["Fertilizer"].value_counts().to_dict()
        f_list = "\n".join([f"  • {f}: {c} applications" for f, c in list(fert_counts.items())[:5]])
        return (
            f"🧴 **Fertilizer Analysis**\n\n"
            f"• Most used: **{kpi['dom_fert']}**\n"
            f"• Total types: {len(kpi['ferts'])}\n\n"
            f"**Top Fertilizers:**\n{f_list}\n\n"
            f"**Recommendations:**\n"
            f"  • Low N → Urea or DAP\n"
            f"  • Low P → DAP or Organic Fe\n"
            f"  • Low K → Muriate of Potash\n"
            f"  • Acidic soil → Lime\n"
            f"  • Poor structure → Compost"
        )

    # ── Crop recommendation ────────────────────
    if "crop" in q and ("best" in q or "which" in q or "suitable" in q or "recommend" in q):
        return (
            "🌾 **Crop Suitability Guide**\n\n"
            "Based on dataset analysis:\n\n"
            "• **Rice** – High moisture (>0.6), temperature 20-35°C, slightly acidic pH (5.5-7.0)\n"
            "• **Wheat** – Moderate moisture, cool-warm (15-25°C), neutral pH (6.0-7.5)\n"
            "• **Maize** – Warm temp (20-35°C), well-drained loamy soil, pH 5.8-7.0\n"
            "• **Soybean** – Moderate rainfall, pH 6.0-7.0, nitrogen-fixing (less N needed)\n"
            "• **Cotton** – High temp (25-40°C), low moisture tolerance, pH 5.8-8.0\n\n"
            f"💡 The most common crop in this dataset is **{kpi['dom_crop']}**."
        )

    # ── Correlation / relationship ─────────────
    if "correlat" in q or "relation" in q or "factor" in q or "influence" in q:
        return (
            "📈 **Key Variable Correlations**\n\n"
            "From the correlation analysis:\n\n"
            "• **Temperature ↔ Moisture**: Negative (higher temp → lower moisture)\n"
            "• **Nitrogen ↔ Phosphorus**: Moderate positive correlation\n"
            "• **pH ↔ Carbon**: Soil pH influences organic carbon availability\n"
            "• **Rainfall ↔ Moisture**: Positive (more rain → higher soil moisture)\n"
            "• **Potassium ↔ Nitrogen**: Moderate positive (balanced NPK)\n\n"
            "💡 Use the **Scatter Plot** and **Correlation Heatmap** in the dashboard for "
            "interactive exploration of these relationships."
        )

    # ── Decision support ───────────────────────
    if "decision" in q or "action" in q or "improve" in q or "optimize" in q:
        return (
            "🎯 **Decision Support Recommendations**\n\n"
            "Based on the agricultural dataset analytics:\n\n"
            "**1. Soil Health**\n"
            "   • Test pH and adjust with Lime (acidic) or Gypsum (alkaline)\n"
            "   • Add Compost to improve organic carbon and structure\n\n"
            "**2. Nutrient Management**\n"
            "   • Monitor NPK ratios per crop requirements\n"
            "   • Use Balanced NPK fertilizer for general deficiency\n\n"
            "**3. Water Management**\n"
            "   • Maintain soil moisture >0.5 for most crops\n"
            "   • Use Water Retention additives in sandy/dry conditions\n\n"
            "**4. Crop Selection**\n"
            "   • Match crop to soil type and available nutrients\n"
            "   • Rotate crops to maintain soil fertility"
        )

    # ── KPI quick stats ────────────────────────
    if any(w in q for w in ["average","mean","statistic","kpi","metric"]):
        return (
            f"📊 **Key Performance Indicators**\n\n"
            f"• 🌡️ Avg Temperature: **{kpi['avg_temp']}°C**\n"
            f"• 💧 Avg Moisture: **{kpi['avg_moist']}**\n"
            f"• 🌧️ Avg Rainfall: **{kpi['avg_rain']} mm**\n"
            f"• 🧪 Avg pH: **{kpi['avg_ph']}**\n"
            f"• 🌿 Avg Nitrogen: **{kpi['avg_n']} kg/ha**\n"
            f"• 🌿 Avg Phosphorus: **{kpi['avg_p']} kg/ha**\n"
            f"• 🌿 Avg Potassium: **{kpi['avg_k']} kg/ha**\n"
            f"• ♻️ Avg Carbon: **{kpi['avg_c']}**\n"
            f"• 📦 Total Records: **{kpi['total']:,}**"
        )

    # ── Navigation guide ───────────────────────
    if "navigate" in q or "dashboard" in q or "tab" in q or "section" in q:
        return (
            "🗺️ **Dashboard Navigation Guide**\n\n"
            "The AgriAnalytics dashboard has **5 main sections**:\n\n"
            "1. **📊 Overview** – KPI cards, soil/crop distribution charts\n"
            "2. **🌿 Nutrients** – NPK analysis by crop and soil, bar charts\n"
            "3. **🔬 Correlations** – Scatter plots & heatmap explorer\n"
            "4. **📋 Data Table** – Filterable raw data viewer\n"
            "5. **🤖 AI Assistant** – This conversational interface\n\n"
            "Use the **filter panel** (top-right) to filter by Soil, Crop, or Fertilizer."
        )

    # ── Fallback ───────────────────────────────
    return (
        f"🤔 I'm not sure I fully understood that. Here are some things I can help with:\n\n"
        f"• Ask about **temperature, moisture, rainfall, pH**\n"
        f"• Ask about **nitrogen, phosphorus, potassium, carbon**\n"
        f"• Ask about **soil types, crops, or fertilizers**\n"
        f"• Ask for **correlations, recommendations, or KPIs**\n"
        f"• Type **'help'** to see all capabilities\n\n"
        f"Example: *'Which soil has the highest pH?'* or *'Recommend fertilizer for rice'*"
    )


@app.route("/api/chat", methods=["POST"])
def chat():
    data  = request.get_json(force=True)
    query = data.get("message", "").strip()
    if not query:
        return jsonify({"error": "Empty message"}), 400
    response = chatbot_response(query)
    return jsonify({"response": response, "query": query})


if __name__ == "__main__":
    app.run(debug=True, port=5000)


