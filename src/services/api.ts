import axios from "axios";

const BASE = "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE, timeout: 10000 });

export const fetchKPIs = (crop = "all", soil = "all") => api.get(`/kpis?crop=${crop}&soil=${soil}`).then(r => r.data);
export const fetchFilters = (crop = "all", soil = "all") => api.get(`/filters?crop=${crop}&soil=${soil}`).then(r => r.data);
export const fetchStats       = () => api.get("/stats").then(r => r.data);
export const fetchSoilDist    = () => api.get("/soil-distribution").then(r => r.data);
export const fetchCropDist    = () => api.get("/crop-distribution").then(r => r.data);
export const fetchFertDist    = () => api.get("/fertilizer-distribution").then(r => r.data);
export const fetchNutrientsBySoil = () => api.get("/nutrients-by-soil").then(r => r.data);
export const fetchNutrientsByCrop = () => api.get("/nutrients-by-crop").then(r => r.data);
export const fetchCorrelation = () => api.get("/correlation").then(r => r.data);
export const fetchPhAnalysis  = () => api.get("/ph-analysis").then(r => r.data);
export const fetchTempMoistureTrend = () => api.get("/temp-moisture-trend").then(r => r.data);
export const fetchRainfallNitrogen  = () => api.get("/rainfall-nitrogen").then(r => r.data);

export const fetchScatter = (x: string, y: string, soil = "all", crop = "all") =>
  api.get(`/scatter?x=${x}&y=${y}&soil=${soil}&crop=${crop}`).then(r => r.data);

export const fetchDistribution = (column: string, bins = 20) =>
  api.get(`/distribution/${column}?bins=${bins}`).then(r => r.data);

export const fetchData = (page = 1, limit = 50, soil = "all", crop = "all", fertilizer = "all") =>
  api.get(`/data?page=${page}&limit=${limit}&soil=${soil}&crop=${crop}&fertilizer=${fertilizer}`)
     .then(r => r.data);

export const sendChat = (message: string) =>
  api.post("/chat", { message }).then(r => r.data);

// New LLM Chat service
export const sendLLMChat = (message: string) =>
  api.post("/llm-chat", { message }).then(r => r.data);

// Optional: Reset LLM history
export const resetLLMChat = () =>
  api.post("/llm-reset").then(r => r.data);

// ── Crop Prediction ───────────────────────
export const predictCrop = (data: {
  temperature: number;
  moisture:    number;
  rainfall:    number;
  ph:          number;
  nitrogen:    number;
  phosphorus:  number;
  potassium:   number;
  carbon:      number;
  soil:        string;
}) => api.post("/predict-crop", data).then(r => r.data);

// ── Feature Importance ────────────────────
export const fetchFeatureImportance = () =>
  api.get("/feature-importance").then(r => r.data);

export const fetchThresholds = () =>
  api.get("/thresholds").then(r => r.data);

export const fetchCropSoilMapping = () =>
  api.get("/crop-soil-mapping").then(r => r.data);