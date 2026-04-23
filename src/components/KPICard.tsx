import React from "react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;       // Tailwind bg gradient classes
  textColor?: string;
}

const KPICard: React.FC<Props> = ({ title, value, subtitle, icon, color, textColor = "text-white" }) => (
  <div className={`${color} rounded-2xl p-5 shadow-lg flex items-center gap-4 min-w-0`}>
    <div className="shrink-0 bg-white/20 rounded-xl p-3 text-2xl">{icon}</div>
    <div className="min-w-0">
      <p className={`text-xs font-semibold uppercase tracking-widest ${textColor} opacity-75 truncate`}>{title}</p>
      <p className={`text-2xl font-bold ${textColor} truncate`}>{value}</p>
      {subtitle && <p className={`text-xs ${textColor} opacity-60 mt-0.5 truncate`}>{subtitle}</p>}
    </div>
  </div>
);

export default KPICard;
