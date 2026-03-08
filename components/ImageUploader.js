"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui";

export default function ImageUploader({ onUpload, disabled, canPredict, predLimit }) {
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview({
        data: ev.target.result,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setAnalyzing(true);
    try {
      await onUpload(preview);
    } finally {
      setAnalyzing(false);
      setPreview(null);
    }
  };

  const cancel = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Analyzing state
  if (analyzing) {
    return (
      <div className="bg-dark-card rounded-2xl border border-brand-green/30 p-8">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-spin-slow">🤖</div>
          <div className="text-lg font-bold text-brand-green mb-1 font-display">AI Analyzing Match...</div>
          <p className="text-steel text-sm mb-5">Processing match data, form analysis, and odds calculation</p>
          <div className="flex gap-4 justify-center flex-wrap">
            {["Reading match data", "Analyzing teams", "Calculating odds", "Generating picks"].map((step, i) => (
              <div key={step} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 400}ms` }}>
                <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                <span className="text-xs text-steel">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Preview state
  if (preview) {
    return (
      <div className="bg-dark-card rounded-2xl border border-brand-green/30 p-6">
        <div className="text-center">
          <div className="mb-4 rounded-xl overflow-hidden border border-dark-slate/30 max-h-[300px]">
            <img src={preview.data} alt="Screenshot" className="w-full max-h-[300px] object-contain bg-dark-bg" />
          </div>
          <div className="text-base font-bold mb-1 font-display">Screenshot Ready</div>
          <p className="text-steel text-sm mb-4">Click below to run AI analysis on this match</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={cancel}>Cancel</Button>
            <Button variant="green" onClick={handleSubmit}>🤖 Analyze & Predict</Button>
          </div>
        </div>
      </div>
    );
  }

  // Upload zone
  return (
    <div
      onClick={() => canPredict && fileRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
        canPredict
          ? "border-brand-red/30 hover:border-brand-red/60 cursor-pointer bg-brand-red/[0.02] hover:bg-brand-red/[0.05]"
          : "border-steel/20 cursor-not-allowed"
      }`}
    >
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <div className="text-5xl mb-3">{canPredict ? "📸" : "🔒"}</div>
      <div className={`text-lg font-bold font-display mb-1.5 ${canPredict ? "text-smoke" : "text-steel"}`}>
        {canPredict ? "Upload SportyBet Screenshot" : "Prediction Limit Reached"}
      </div>
      <p className="text-steel text-sm">
        {canPredict
          ? "Take a screenshot from SportyBet Instant Football and upload it here"
          : `Upgrade your package for more predictions. Limit: ${predLimit}`}
      </p>
    </div>
  );
}
