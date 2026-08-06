"use client";

import React from "react";
import { motion } from "framer-motion";

const MetricCard = ({
  icon,
  label,
  value,
  hint,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  compactValue = false,
  index = 0,
}) => {
  const valueSizeClass = compactValue
    ? "text-xl sm:text-2xl"
    : "text-3xl sm:text-4xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -2 }}
      className="bg-white border border-outline-variant/70 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 min-h-[148px] flex flex-col"
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <span className={`material-symbols-outlined text-[22px] ${iconColor}`}>
            {icon}
          </span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.12em] leading-tight">
            {label}
          </p>
          {hint ? (
            <p className="text-[10px] font-medium text-outline mt-1 leading-snug line-clamp-2">
              {hint}
            </p>
          ) : null}
        </div>
      </div>

      <p
        className={`mt-auto font-black text-on-surface tracking-tight leading-none ${valueSizeClass} break-words`}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </p>
    </motion.div>
  );
};

export default MetricCard;
