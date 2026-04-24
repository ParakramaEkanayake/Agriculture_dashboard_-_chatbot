#  llm_chat.py  –  LLM-powered AgriBot Uses Groq (LLaMA3) as the AI engine 
# Separate from rule-based /api/chat

import os
import json
from groq import Groq
from dotenv import load_dotenv
import pandas as pd
import numpy as np

# Load API key from .env
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Load dataset
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
df = pd.read_csv(os.path.join(BASE_DIR, "Agriculture_dataset.csv"))

# Valid filter values (exact match) 
VALID_CROPS = [
    "Adzuki Beans", "Apple", "Banana", "Black Gram", "Chickpea",
    "Coconut", "Coffee", "Cotton", "Grapes", "Ground Nut", "Jute",
    "Kidney Beans", "Lentil", "Maize", "Mango", "Millet",
    "Moth Beans", "Mung Bean", "Muskmelon", "Orange", "Papaya",
    "Peas", "Pigeon Peas", "Pomegranate", "Rice", "Rubber",
    "Sugarcane", "Tea", "Tobacco", "Watermelon", "Wheat"
]

VALID_SOILS = [
    "Acidic Soil",
    "Alkaline Soil",
    "Loamy Soil",
    "Neutral Soil",
    "Peaty Soil"
]

VALID_FERTILIZERS = [
    "Compost",
    "Balanced NPK Fertilizer",
    "Water Retaining Fertilizer",
    "Organic Fertilizer",
    "Gypsum",
    "Lime",
    "DAP",
    "Urea",
    "Muriate of Potash",
    "General Purpose Fertilizer"
]

# ─────────────────────────────────────────────
#live dataset context,This runs every message to give LLM up-to-date facts about the dataset


def build_dataset_context():
    """
    Collects live stats from the dataset
    and returns a structured text summary
    for the LLM to use as knowledge base.
    """

    #Basic stats 
    total_records = len(df)

    #Averages 
    avg_temp      = round(float(df["Temperature"].mean()), 2)
    avg_moisture  = round(float(df["Moisture"].mean()), 4)
    avg_rainfall  = round(float(df["Rainfall"].mean()), 2)
    avg_ph        = round(float(df["PH"].mean()), 2)
    avg_nitrogen  = round(float(df["Nitrogen"].mean()), 2)
    avg_phosphorus= round(float(df["Phosphorus"].mean()), 2)
    avg_potassium = round(float(df["Potassium"].mean()), 2)
    avg_carbon    = round(float(df["Carbon"].mean()), 4)

    #Ranges
    temp_range  = f"{df['Temperature'].min():.2f} - {df['Temperature'].max():.2f}"
    ph_range    = f"{df['PH'].min():.2f} - {df['PH'].max():.2f}"
    rain_range  = f"{df['Rainfall'].min():.2f} - {df['Rainfall'].max():.2f}"

    #Dominant values
    dominant_soil = df["Soil"].value_counts().idxmax()
    dominant_crop = df["Crop"].value_counts().idxmax()
    dominant_fert = df["Fertilizer"].value_counts().idxmax()

    #Nutrients by crop
    crop_nutrients = df.groupby("Crop")[
        ["Nitrogen", "Phosphorus", "Potassium"]
    ].mean().round(2)

    crop_nutrient_summary = "\n".join([
        f"  {crop}: N={row['Nitrogen']}, P={row['Phosphorus']}, K={row['Potassium']}"
        for crop, row in crop_nutrients.iterrows()
    ])

    #Nutrients by soil
    soil_nutrients = df.groupby("Soil")[
        ["Nitrogen", "Phosphorus", "Potassium", "Carbon"]
    ].mean().round(2)

    soil_nutrient_summary = "\n".join([
        f"  {soil}: N={row['Nitrogen']}, P={row['Phosphorus']}, K={row['Potassium']}, C={row['Carbon']}"
        for soil, row in soil_nutrients.iterrows()
    ])

    #PH by soil
    soil_ph = df.groupby("Soil")["PH"].mean().round(2)
    soil_ph_summary = "\n".join([
        f"  {soil}: pH {val}"
        for soil, val in soil_ph.items()
    ])

    #Temperature by crop
    crop_temp = df.groupby("Crop")["Temperature"].mean().round(2)
    crop_temp_summary = "\n".join([
        f"  {crop}: {val}°C"
        for crop, val in crop_temp.items()
    ])

    # Moisture by soil
    soil_moisture = df.groupby("Soil")["Moisture"].mean().round(4)
    soil_moisture_summary = "\n".join([
        f"  {soil}: {val}"
        for soil, val in soil_moisture.items()
    ])

    #Fertilizer usage counts 
    fert_counts = df["Fertilizer"].value_counts()
    fert_summary = "\n".join([
        f"  {fert}: {count} records"
        for fert, count in fert_counts.items()
    ])

    # Correlation highlights 
    numeric_cols = [
        "Temperature", "Moisture", "Rainfall",
        "PH", "Nitrogen", "Phosphorus", "Potassium", "Carbon"
    ]
    corr = df[numeric_cols].corr().round(3)

    # Get top 5 strongest correlations (excluding self)
    corr_pairs = []
    for i in range(len(numeric_cols)):
        for j in range(i+1, len(numeric_cols)):
            col1 = numeric_cols[i]
            col2 = numeric_cols[j]
            val  = corr.loc[col1, col2]
            corr_pairs.append((col1, col2, val))

    # Sort by absolute value
    corr_pairs.sort(key=lambda x: abs(x[2]), reverse=True)

    corr_summary = "\n".join([
        f"  {c1} ↔ {c2}: {val}"
        for c1, c2, val in corr_pairs[:6]
    ])

    # ── Date range ─────────────────────────
    if "Date" in df.columns:
        date_range = f"{df['Date'].min()} to {df['Date'].max()}"
    else:
        date_range = "Not available"

    #Build final context string 
    context = f"""
    === AGRICULTURE DATASET CONTEXT ===
GENERAL:
  Total Records : {total_records}
  Date Range    : {date_range}
  Crops         : {', '.join(VALID_CROPS)}
  Soil Types    : {', '.join(VALID_SOILS)}
  Fertilizers   : {', '.join(VALID_FERTILIZERS)}
  Dominant Soil : {dominant_soil}
  Dominant Crop : {dominant_crop}
  Most Used Fertilizer: {dominant_fert}

AVERAGE VALUES (entire dataset):
  Temperature : {avg_temp}°C
  Moisture    : {avg_moisture}
  Rainfall    : {avg_rainfall} mm
  pH          : {avg_ph}
  Nitrogen    : {avg_nitrogen} kg/ha
  Phosphorus  : {avg_phosphorus} kg/ha
  Potassium   : {avg_potassium} kg/ha
  Carbon      : {avg_carbon}

RANGES:
  Temperature : {temp_range}°C
  pH          : {ph_range}
  Rainfall    : {rain_range} mm

AVERAGE TEMPERATURE BY CROP:
{crop_temp_summary}

AVERAGE NPK BY CROP:
{crop_nutrient_summary}

AVERAGE MOISTURE BY SOIL:
{soil_moisture_summary}

AVERAGE PH BY SOIL:
{soil_ph_summary}

AVERAGE NPK + CARBON BY SOIL:
{soil_nutrient_summary}

FERTILIZER USAGE:
{fert_summary}

TOP CORRELATIONS BETWEEN VARIABLES:
{corr_summary}
=== END OF CONTEXT ===
"""
    return context

# ─────────────────────────────────────────────
#System Prompt- This is the "personality + instructions"

def build_system_prompt():
    """
    Builds the system prompt that matches the ACTUAL 
    frontend tabs and navigation structure.
    """

    context = build_dataset_context()

    system_prompt = f"""
You are AgriBot, an intelligent agricultural analytics assistant 
embedded inside the PolyAnalytics Dashboard.

You support Agricultural Policy Makers and Farm Managers.

════════════════════════════════════════
YOUR KNOWLEDGE BASE (Live Dataset Facts)
════════════════════════════════════════
{context}

════════════════════════════════════════
YOUR RESPONSIBILITIES
════════════════════════════════════════

1. ANSWER QUESTIONS
   - Answer questions about the dataset using the facts above.
   - Use specific numbers (e.g., "Average pH is 6.83").
   
2. EXPLAIN TRENDS
   - Explain how factors like Temperature affect Moisture or Rainfall.
   - Highlight which crops have the highest/lowest nutrient needs.

3. GUIDE DASHBOARD EXPLORATION
   - The dashboard currently has two main active sections:
       * Overview → Time-series charts showing Temperature, Moisture, Rainfall, pH, and NPK levels over time.
       * Advanced → Deep analysis charts: NPK by Crop/Soil, Nutrient Radar, Organic Carbon levels, and Distribution Histograms.
   - Example: "You can see the NPK breakdown for this crop in the Advanced tab."

4. SUPPORT DECISION-MAKING
   - Recommend crops based on soil type and environmental data.
   - Suggest fertilizers based on current nutrient averages.

════════════════════════════════════════
CRITICAL FILTER RULE (MANDATORY)
════════════════════════════════════════

If the user message contains ANY of these words:

  show
  filter
  focus
  display
  view
  only
  dashboard

AND it mentions a valid Crop, Soil, or Fertilizer,

YOU MUST append a FILTER_ACTION block at the END of your response.

This rule is mandatory.

DO NOT skip it.

Format EXACTLY like this:

FILTER_ACTION:
{{
  "crop": "Cotton",
  "soil": "Acidic Soil"
}}

Rules:
- Only include fields mentioned by the user
- Use exact spelling from the valid lists
- Place FILTER_ACTION at the VERY END of the message
- No extra text after FILTER_ACTION block

════════════════════════════════════════
RESPONSE STYLE
════════════════════════════════════════
- Professional, concise, and data-driven.
- Use bold text for key numbers.
- End with a helpful suggestion about which tab to check.
"""
    return system_prompt
# ─────────────────────────────────────────────
#LLM Call + Filter Detection
#main function that: 1. Sends message to Groq LLM 2. Receives response
#  3. Detects if filters are needed 4. Returns structured response to frontend

#Conversation history storage 

conversation_history = []

def parse_filter_action(response_text: str):
    """
    Looks for FILTER_ACTION block in LLM response
    and extracts filter values if present.
    
    Returns:
        filters dict if found
        None if no filters detected
    """
    try:
        if "FILTER_ACTION:" not in response_text:
            return None
        
        # Split at FILTER_ACTION:
        parts = response_text.split("FILTER_ACTION:")
        
        if len(parts) < 2:
            return None
        
        # Get the JSON part after FILTER_ACTION:
        json_part = parts[1].strip()
        
        # Find the JSON block { ... }
        start = json_part.find("{")
        end   = json_part.find("}") + 1
        
        if start == -1 or end == 0:
            return None
        
        json_str = json_part[start:end]
        filters  = json.loads(json_str)
        
        # Validate each filter value against valid options
        validated = {}
        
        if "crop" in filters:
            if filters["crop"] in VALID_CROPS:
                validated["crop"] = filters["crop"]
        
        if "soil" in filters:
            if filters["soil"] in VALID_SOILS:
                validated["soil"] = filters["soil"]
        
        if "fertilizer" in filters:
            if filters["fertilizer"] in VALID_FERTILIZERS:
                validated["fertilizer"] = filters["fertilizer"]
        
        return validated if validated else None

    except Exception:
        return None


def clean_response_text(response_text: str):
    """
    Removes the FILTER_ACTION block from the 
    displayed message so user only sees 
    the clean readable response.
    """
    if "FILTER_ACTION:" in response_text:
        # Only keep the part before FILTER_ACTION
        clean = response_text.split("FILTER_ACTION:")[0].strip()
        return clean
    return response_text.strip()


def llm_chat(user_message: str, session_id: str = "default"):
    """
    Main LLM chat function.
    
    Args:
        user_message : what the user typed
        session_id   : to track conversation per user
    
    Returns:
        dict with:
          - response  : clean text to show user
          - filters   : dashboard filter instructions (or null)
          - has_filter: True/False
    """
    
    try:
        # ── Build system prompt with live data ──
        system_prompt = build_system_prompt()
                # ── Automatic filter detection from user message ──
        detected_filters = {}

        # Detect crop
        for crop in VALID_CROPS:
            if crop.lower() in user_message.lower():
                detected_filters["crop"] = crop
                break

        # Detect soil
        for soil in VALID_SOILS:
            if soil.lower() in user_message.lower():
                detected_filters["soil"] = soil
                break

        # Detect fertilizer
        for fert in VALID_FERTILIZERS:
            if fert.lower() in user_message.lower():
                detected_filters["fertilizer"] = fert
                break
        # ── Add user message to history ─────────
        conversation_history.append({
            "role": "user",
            "content": user_message
        })

        # ── Keep history to last 10 messages ────
        # Prevents context window overflow
        recent_history = conversation_history[-10:]

        # ── Build full message list ──────────────
        messages = [
            {"role": "system", "content": system_prompt},
            *recent_history
        ]

        # ── Call Groq LLM ────────────────────────
        chat_completion = client.chat.completions.create(
            model = "llama-3.3-70b-versatile",
            messages = messages,
            temperature = 0.7,    # creativity level (0=strict, 1=creative)
            max_tokens  = 1024,   # max response length
        )

        # ── Get raw response ─────────────────────
        raw_response = chat_completion.choices[0].message.content

        # ── Add assistant response to history ────
        conversation_history.append({
            "role"   : "assistant",
            "content": raw_response
        })

        # ── Clean response text ──────────────────
        clean_text = clean_response_text(raw_response)

        # ── Use backend-detected filters instead of LLM format ──
        filters = detected_filters if detected_filters else None

        return {
            "response"  : clean_text,
            "filters"   : filters,
            "has_filter": filters is not None,
            "status"    : "success"
        }

    except Exception as e:
        return {
            "response"  : f"Sorry, I encountered an error: {str(e)}. Please try again.",
            "filters"   : None,
            "has_filter": False,
            "status"    : "error"
        }


def reset_conversation():
    """
    Clears conversation history.
    Called when user starts a new session.
    """
    global conversation_history
    conversation_history = []
    return {"status": "conversation reset"}