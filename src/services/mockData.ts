// ─────────────────────────────────────────────────────────────────────────────
// Mock data – used when Flask backend is not running
// Mirrors the real API responses exactly so components are backend-agnostic
// ─────────────────────────────────────────────────────────────────────────────

export const mockKPIs = {
  total_records: 500,
  avg_temperature: 36.52,
  avg_moisture: 0.5502,
  avg_ph: 6.83,
  avg_nitrogen: 65.21,
  dominant_soil: "Loamy Soil",
  dominant_crop: "rice",
  dominant_fertilizer: "Organic Fe",
  soil_types: 5,
  crop_types: 5,
  fertilizer_types: 9,
};

export const mockSoilDist = [
  { soil: "Loamy Soil",  count: 112 },
  { soil: "Peaty Soil",  count: 108 },
  { soil: "Acidic Soil", count: 97  },
  { soil: "Sandy Soil",  count: 93  },
  { soil: "Clay Soil",   count: 90  },
];

export const mockCropDist = [
  { crop: "rice",    count: 112 },
  { crop: "wheat",   count: 104 },
  { crop: "maize",   count: 98  },
  { crop: "soybean", count: 95  },
  { crop: "cotton",  count: 91  },
];

export const mockFertDist = [
  { fertilizer: "Organic Fe",       count: 72 },
  { fertilizer: "Compost",          count: 68 },
  { fertilizer: "Balanced NPK",     count: 65 },
  { fertilizer: "DAP",              count: 60 },
  { fertilizer: "Urea",             count: 58 },
  { fertilizer: "Water Retention",  count: 55 },
  { fertilizer: "Lime",             count: 48 },
  { fertilizer: "Gypsum",           count: 42 },
  { fertilizer: "Muriate of Potash",count: 32 },
];

export const mockNutrientsBySoil = [
  { Soil: "Loamy Soil",  Nitrogen: 67.4, Phosphorus: 104.2, Potassium: 108.3, Carbon: 1.24 },
  { Soil: "Peaty Soil",  Nitrogen: 64.8, Phosphorus: 101.7, Potassium: 105.9, Carbon: 1.58 },
  { Soil: "Acidic Soil", Nitrogen: 63.1, Phosphorus: 98.4,  Potassium: 103.2, Carbon: 0.94 },
  { Soil: "Sandy Soil",  Nitrogen: 65.9, Phosphorus: 103.1, Potassium: 107.0, Carbon: 1.02 },
  { Soil: "Clay Soil",   Nitrogen: 66.2, Phosphorus: 105.8, Potassium: 109.1, Carbon: 1.31 },
];

export const mockNutrientsByCrop = [
  { Crop: "rice",    Nitrogen: 67.2, Phosphorus: 103.4, Potassium: 107.2, Carbon: 1.28 },
  { Crop: "wheat",   Nitrogen: 64.5, Phosphorus: 100.8, Potassium: 105.4, Carbon: 1.19 },
  { Crop: "maize",   Nitrogen: 66.1, Phosphorus: 104.6, Potassium: 108.7, Carbon: 1.22 },
  { Crop: "soybean", Nitrogen: 63.8, Phosphorus: 102.1, Potassium: 106.3, Carbon: 1.35 },
  { Crop: "cotton",  Nitrogen: 65.4, Phosphorus: 103.8, Potassium: 107.8, Carbon: 1.15 },
];

export const mockPhAnalysis = [
  { category: "Moderately Acidic",  count: 164 },
  { category: "Neutral",            count: 148 },
  { category: "Alkaline",           count: 101 },
  { category: "Strongly Acidic",    count: 55  },
  { category: "Strongly Alkaline",  count: 32  },
];

export const mockCorrelation = (() => {
  const cols = ["Temperature","Moisture","Rainfall","PH","Nitrogen","Phosphorus","Potassium","Carbon"];
  const base: Record<string,Record<string,number>> = {
    Temperature:  { Temperature:1,   Moisture:-0.42, Rainfall:0.08,  PH:-0.05, Nitrogen:0.03,  Phosphorus:0.02,  Potassium:0.04,  Carbon:-0.11 },
    Moisture:     { Temperature:-0.42,Moisture:1,    Rainfall:0.38,  PH:0.07,  Nitrogen:0.05,  Phosphorus:0.06,  Potassium:0.03,  Carbon:0.18  },
    Rainfall:     { Temperature:0.08, Moisture:0.38, Rainfall:1,     PH:0.04,  Nitrogen:0.09,  Phosphorus:0.07,  Potassium:0.08,  Carbon:0.12  },
    PH:           { Temperature:-0.05,Moisture:0.07, Rainfall:0.04,  PH:1,     Nitrogen:0.14,  Phosphorus:0.11,  Potassium:0.09,  Carbon:0.22  },
    Nitrogen:     { Temperature:0.03, Moisture:0.05, Rainfall:0.09,  PH:0.14,  Nitrogen:1,     Phosphorus:0.43,  Potassium:0.38,  Carbon:0.17  },
    Phosphorus:   { Temperature:0.02, Moisture:0.06, Rainfall:0.07,  PH:0.11,  Nitrogen:0.43,  Phosphorus:1,     Potassium:0.41,  Carbon:0.15  },
    Potassium:    { Temperature:0.04, Moisture:0.03, Rainfall:0.08,  PH:0.09,  Nitrogen:0.38,  Phosphorus:0.41,  Potassium:1,     Carbon:0.13  },
    Carbon:       { Temperature:-0.11,Moisture:0.18, Rainfall:0.12,  PH:0.22,  Nitrogen:0.17,  Phosphorus:0.15,  Potassium:0.13,  Carbon:1     },
  };
  const result: {x:string;y:string;value:number}[] = [];
  for (const c1 of cols) for (const c2 of cols) result.push({ x:c1, y:c2, value:base[c1][c2] });
  return result;
})();

export const mockTempMoistureTrend = [
  { tempRange:"18.03-21.60", avgMoisture:0.5621 },
  { tempRange:"21.60-25.17", avgMoisture:0.5487 },
  { tempRange:"25.17-28.74", avgMoisture:0.5342 },
  { tempRange:"28.74-32.31", avgMoisture:0.5198 },
  { tempRange:"32.31-35.88", avgMoisture:0.5043 },
  { tempRange:"35.88-39.45", avgMoisture:0.4878 },
  { tempRange:"39.45-43.02", avgMoisture:0.4712 },
  { tempRange:"43.02-46.59", avgMoisture:0.4536 },
  { tempRange:"46.59-50.16", avgMoisture:0.4391 },
  { tempRange:"50.16-53.73", avgMoisture:0.4203 },
];

export const mockRainfallNitrogen = [
  { Crop:"rice",    Rainfall:248.2, Nitrogen:67.2 },
  { Crop:"wheat",   Rainfall:251.7, Nitrogen:64.5 },
  { Crop:"maize",   Rainfall:249.8, Nitrogen:66.1 },
  { Crop:"soybean", Rainfall:252.4, Nitrogen:63.8 },
  { Crop:"cotton",  Rainfall:247.3, Nitrogen:65.4 },
];

// ── Generate scatter mock data ─────────────────────────────────────────────
const soils = ["Loamy Soil","Peaty Soil","Acidic Soil","Sandy Soil","Clay Soil"];
const crops  = ["rice","wheat","maize","soybean","cotton"];

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

export function mockScatter(xCol: string, yCol: string) {
  const rng = seededRand(42);
  const ranges: Record<string,{min:number,max:number}> = {
    Temperature:  {min:18, max:55},
    Moisture:     {min:0.2,max:0.9},
    Rainfall:     {min:180,max:320},
    PH:           {min:4.8,max:8.8},
    Nitrogen:     {min:30, max:100},
    Phosphorus:   {min:40, max:170},
    Potassium:    {min:55, max:160},
    Carbon:       {min:-0.5,max:2.8},
  };
  return Array.from({length:200}, () => ({
    [xCol]: parseFloat((ranges[xCol].min + rng()*(ranges[xCol].max-ranges[xCol].min)).toFixed(4)),
    [yCol]: parseFloat((ranges[yCol].min + rng()*(ranges[yCol].max-ranges[yCol].min)).toFixed(4)),
    Soil:  soils[Math.floor(rng()*soils.length)],
    Crop:  crops[Math.floor(rng()*crops.length)],
  }));
}

// ── Table data ─────────────────────────────────────────────────────────────
const fertilizers = ["Compost","Balanced NPK","Water Retention","Organic Fe","Gypsum","Lime","DAP","Urea","Muriate of Potash"];

export function mockTableData(page = 1, limit = 50) {
  const rng = seededRand(page * 31337);
  const data = Array.from({length:limit}, (_, i) => ({
    id: (page-1)*limit + i + 1,
    Temperature: parseFloat((18 + rng()*37).toFixed(4)),
    Moisture:    parseFloat((0.2 + rng()*0.7).toFixed(6)),
    Rainfall:    parseFloat((180 + rng()*140).toFixed(4)),
    PH:          parseFloat((4.8 + rng()*4.0).toFixed(4)),
    Nitrogen:    parseFloat((30  + rng()*70 ).toFixed(4)),
    Phosphorus:  parseFloat((40  + rng()*130).toFixed(4)),
    Potassium:   parseFloat((55  + rng()*105).toFixed(4)),
    Carbon:      parseFloat((-0.5+ rng()*3.3).toFixed(4)),
    Soil:        soils[Math.floor(rng()*soils.length)],
    Crop:        crops[Math.floor(rng()*crops.length)],
    Fertilizer:  fertilizers[Math.floor(rng()*fertilizers.length)],
  }));
  return { total:500, page, limit, data };
}

export function mockDistribution(column: string) {
  const ranges: Record<string,{min:number,max:number}> = {
    Temperature:  {min:18,max:55},
    Moisture:     {min:0.2,max:0.9},
    Rainfall:     {min:180,max:320},
    PH:           {min:4.8,max:8.8},
    Nitrogen:     {min:30,max:100},
    Phosphorus:   {min:40,max:170},
    Potassium:    {min:55,max:160},
    Carbon:       {min:-0.5,max:2.8},
  };
  const r = ranges[column] ?? {min:0,max:100};
  const step = (r.max - r.min) / 20;
  return Array.from({length:20}, (_,i) => ({
    range: `${(r.min+i*step).toFixed(2)}-${(r.min+(i+1)*step).toFixed(2)}`,
    count: Math.floor(10 + Math.random()*35),
  }));
}
