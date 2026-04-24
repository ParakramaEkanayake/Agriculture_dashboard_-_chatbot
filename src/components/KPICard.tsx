import React from "react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;       // Tailwind text color classes
  textColor?: string;
  changePct?: number;
  changeDir?: "up" | "down" | "neutral";
  borderColor?: string; // Neon border color with glow
}

const KPICard: React.FC<Props> = ({ title, value, subtitle, color = "text-white", textColor = "text-white", changePct, changeDir, borderColor = "border-white/20" }) => (
  <div className={`bg-white/10 backdrop-blur-md border-2 ${borderColor} rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4 min-w-0 transition-all hover:shadow-xl`}
    style={{
      boxShadow: borderColor === "border-red-500" ? "0 0 20px rgba(239, 68, 68, 0.4)" :
                 borderColor === "border-blue-500" ? "0 0 20px rgba(59, 130, 246, 0.4)" :
                 borderColor === "border-emerald-500" ? "0 0 20px rgba(16, 185, 129, 0.4)" :
                 borderColor === "border-violet-500" ? "0 0 20px rgba(139, 92, 246, 0.4)" :
                 borderColor === "border-orange-500" ? "0 0 20px rgba(249, 115, 22, 0.4)" :
                 "0 0 10px rgba(255, 255, 255, 0.1)"
    }}>
    <div className="min-w-0">
      <p className={`text-xs font-semibold uppercase tracking-widest ${color} opacity-75 truncate`}>{title}</p>
      <p className={`text-2xl font-bold ${textColor} truncate`}>{value}</p>
      {subtitle && <p className={`text-xs ${textColor} opacity-60 mt-0.5 truncate`}>{subtitle}</p>}
    </div>
    {changePct !== undefined && changeDir && (
      <div className={`flex items-center gap-1 ${changeDir === "up" ? "text-emerald-600" : changeDir === "down" ? "text-red-600" : "text-gray-500"}`}>
        {changeDir === "up" ? <span className="text-lg">↑</span> : changeDir === "down" ? <span className="text-lg">↓</span> : <span className="text-lg">→</span>}
        <span className="text-sm font-semibold">{Math.abs(changePct)}%</span>
      </div>
    )}
  </div>
);

export default KPICard;
