import React from "react";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const SectionCard: React.FC<Props> = ({ title, subtitle, children, className = "", action }) => (
  <div className={`bg-white rounded-2xl shadow-md border border-gray-100 ${className}`}>
    <div className="flex items-start justify-between px-6 pt-5 pb-2">
      <div>
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-2">{action}</div>}
    </div>
    <div className="px-4 pb-5 pt-1">{children}</div>
  </div>
);

export default SectionCard;
