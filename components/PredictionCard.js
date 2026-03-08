"use client";

import { useState } from "react";
import { Badge, ProgressBar } from "@/components/ui";

export default function PredictionCard({ prediction, defaultExpanded = false, showUser = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const p = prediction;

  return (
    <div className={`bg-dark-card rounded-[14px] border ${p.type === "ai" ? "border-brand-green/20" : "border-brand-gold/20"} mb-3.5 overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <div className="px-5 py-4 cursor-pointer flex justify-between items-center" onClick={() => setExpanded(!expanded)}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge color={p.type === "ai" ? "green" : "gold"}>
              {p.type === "ai" ? "🤖 AI Prediction" : "👨‍💼 Admin Pick"}
            </Badge>
            {showUser && p.userId?.name && (
              <span className="text-steel text-[11px]">→ {p.userId.name}</span>
            )}
            <span className="text-steel text-[11px]">
              {new Date(p.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="font-bold text-base text-smoke font-display">{p.match}</div>
        </div>
        <div className="text-right">
          <div className="text-[22px] font-black text-brand-green font-display">{p.totalOdd}x</div>
          <div className="text-[11px] text-steel">{p.confidence}% conf.</div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-dark-slate/20 animate-fade-in">
          {/* Analysis */}
          <div className="bg-dark-bg rounded-xl p-3.5 my-3.5">
            <div className="text-[10px] text-steel font-bold tracking-widest mb-1.5 font-display">📊 ANALYSIS</div>
            <p className="text-smoke/80 text-[13px] leading-relaxed">{p.analysis}</p>
          </div>

          {/* Picks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {p.predictions?.map((pick, i) => (
              <div key={i} className="bg-dark-bg rounded-xl p-3.5 border border-dark-slate/30">
                <div className="text-[10px] text-steel font-bold tracking-widest mb-1.5 font-display">{pick.market}</div>
                <div className="text-lg font-extrabold text-smoke mb-1 font-display">{pick.pick}</div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-green font-bold text-sm">{pick.odd}x</span>
                  <div className="flex items-center gap-2">
                    <div className="w-10">
                      <ProgressBar value={pick.confidence} max={100} color={pick.confidence > 70 ? "bg-brand-green" : "bg-brand-gold"} />
                    </div>
                    <span className="text-[10px] text-steel">{pick.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Note */}
          {p.adminNote && (
            <div className="bg-brand-gold/10 rounded-lg p-3 mt-3 text-xs text-brand-gold border border-brand-gold/20">
              💡 <strong>Admin Note:</strong> {p.adminNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
