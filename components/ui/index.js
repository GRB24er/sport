"use client";

import { useState } from "react";

// ═══════════════════════════════════════════════════════
// LOGO
// ═══════════════════════════════════════════════════════
export function Logo({ size = "md" }) {
  const sizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };
  const box = { sm: "w-7 h-7 text-sm", md: "w-8 h-8 text-base", lg: "w-10 h-10 text-lg" };
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${box[size]} bg-brand-red rounded-md flex items-center justify-center font-black text-white -rotate-[5deg] font-display`}>V</div>
      <span className={`${sizes[size]} font-extrabold tracking-[0.15em] font-display text-smoke`}>VIRTUAL<span className="text-brand-red">BET</span></span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BUTTON
// ═══════════════════════════════════════════════════════
export function Button({ children, onClick, variant = "primary", disabled, full, sm, className = "", type = "button", ...props }) {
  const base = "font-bold tracking-wide uppercase font-display transition-all duration-200 rounded-lg border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px]";
  const size = sm ? "px-3.5 py-1.5 text-[11px]" : "px-6 py-3 text-sm";
  const width = full ? "w-full" : "";

  const variants = {
    primary: "bg-brand-red text-white hover:bg-red-700",
    green: "bg-brand-green text-white hover:bg-green-700",
    outline: "bg-transparent text-smoke border border-steel hover:border-smoke",
    danger: "bg-brand-crimson text-white hover:bg-red-900",
    ghost: "bg-transparent text-steel hover:text-smoke px-3 py-1.5 text-xs",
    gold: "bg-brand-gold text-gray-900 hover:bg-yellow-500",
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${size} ${width} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════════
export function Input({ label, error, className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-steel text-[11px] font-bold tracking-widest uppercase mb-1.5 font-display">{label}</label>
      )}
      <input
        className="w-full px-4 py-3 bg-dark-input border border-dark-slate rounded-lg text-smoke text-sm outline-none font-display tracking-wide placeholder:text-steel/50"
        {...props}
      />
      {error && <p className="text-brand-red text-xs mt-1 font-semibold">{error}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SELECT
// ═══════════════════════════════════════════════════════
export function Select({ label, options = [], className = "", ...props }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-steel text-[11px] font-bold tracking-widest uppercase mb-1.5 font-display">{label}</label>
      )}
      <select
        className="w-full px-4 py-3 bg-dark-input border border-dark-slate rounded-lg text-smoke text-sm outline-none font-display"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TEXTAREA
// ═══════════════════════════════════════════════════════
export function TextArea({ label, ...props }) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-steel text-[11px] font-bold tracking-widest uppercase mb-1.5 font-display">{label}</label>
      )}
      <textarea
        className="w-full px-4 py-3 bg-dark-input border border-dark-slate rounded-lg text-smoke text-sm outline-none font-display min-h-[80px] resize-y placeholder:text-steel/50"
        {...props}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════
export function Badge({ children, color = "green", big }) {
  const colors = {
    green: "bg-brand-green/15 text-brand-green",
    red: "bg-brand-red/15 text-brand-red",
    gold: "bg-brand-gold/15 text-brand-gold",
    steel: "bg-steel/15 text-steel",
    platinum: "bg-brand-platinum/15 text-brand-platinum",
    diamond: "bg-brand-diamond/15 text-brand-diamond",
    orange: "bg-orange-500/15 text-orange-400",
  };

  return (
    <span className={`${colors[color] || colors.green} ${big ? "px-3.5 py-1 text-[13px]" : "px-2.5 py-0.5 text-[11px]"} rounded-full font-bold tracking-wide uppercase whitespace-nowrap`}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════
export function Card({ children, glow, className = "", hover, onClick }) {
  const glowClass = glow === "red" ? "glow-red" : glow === "green" ? "glow-green" : glow === "gold" ? "glow-gold" : "border border-dark-slate/50";
  return (
    <div onClick={onClick} className={`bg-dark-card rounded-[14px] p-6 ${glowClass} ${hover ? "card-hover cursor-pointer" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════
export function Stat({ label, value, icon, color = "text-smoke", sub }) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-2">
        <span className="text-steel text-[11px] font-bold tracking-widest uppercase font-display">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`text-[28px] font-black font-display ${color}`}>{value}</div>
      {sub && <div className="text-steel text-xs mt-0.5">{sub}</div>}
    </Card>
  );
}

// ═══════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════
export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5" onClick={onClose}>
      <div className={`bg-dark-card rounded-2xl p-7 ${wide ? "max-w-2xl" : "max-w-lg"} w-full max-h-[85vh] overflow-y-auto border border-dark-slate/50`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-extrabold font-display">{title}</h3>
          <span className="cursor-pointer text-steel text-2xl hover:text-smoke transition-colors" onClick={onClose}>×</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{icon}</div>
      <div className="text-lg font-bold font-display mb-1">{title}</div>
      {description && <div className="text-steel text-sm mb-4">{description}</div>}
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LOADING
// ═══════════════════════════════════════════════════════
export function Loading({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-[3px] border-dark-slate border-t-brand-red rounded-full animate-spin mb-4" />
      <span className="text-steel text-sm font-display">{text}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════════════════
export function ProgressBar({ value, max, color = "bg-brand-green" }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-1.5 bg-dark-slate rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}
