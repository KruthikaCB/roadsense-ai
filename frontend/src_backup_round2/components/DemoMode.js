import React, { useState } from "react";

const demoSteps = [
  { id: 1, title: "📸 Image Uploaded", description: "Pothole image captured at Silk Board Junction", duration: 2000 },
  { id: 2, title: "🤖 AI Analyzing", description: "Bedrock Vision scanning road surface for damage", duration: 2500 },
  { id: 3, title: "⚠️ Severity Detected", description: "CRITICAL severity — Large pothole, 90% confidence", duration: 2000 },
  { id: 4, title: "💰 Economic Impact", description: "Vehicle damage: ₹15,000/day | Repair cost: ₹8,000", duration: 2000 },
  { id: 5, title: "📍 Location Tagged", description: "GPS: 12.9172°N, 77.6101°E — Silk Board, Ward 177", duration: 2000 },
  { id: 6, title: "☁️ Saved to AWS", description: "Image stored in S3 | Incident logged in DynamoDB", duration: 2000 },
  { id: 7, title: "📋 RTI Complaint", description: "Formal BBMP complaint letter created via Bedrock AI", duration: 2500 },
  { id: 8, title: "✅ Complete!", description: "Incident reported | Complaint sent | Map updated", duration: 0 },
];

const mockResult = {
  severity: "CRITICAL",
  confidence: 92,
  size_estimate: "very large",
  description: "Large pothole with severe road surface damage posing critical risk to vehicles.",
  vehicle_damage_cost_per_day: 15000,
  repair_cost: 8000,
  monthly_savings_if_fixed: 45000,
};

export default function DemoMode() {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const runDemo = async () => {
    setRunning(true); setCompleted(false); setShowResult(false); setCurrentStep(0);
    for (let i = 0; i < demoSteps.length; i++) {
      setCurrentStep(i + 1);
      if (demoSteps[i].duration > 0) await new Promise(r => setTimeout(r, demoSteps[i].duration));
    }
    setRunning(false); setCompleted(true); setShowResult(true);
  };

  const reset = () => { setRunning(false); setCompleted(false); setShowResult(false); setCurrentStep(0); };

  return (
    <div>
      {/* Header controls */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <div className="section-title" style={{ fontSize: "20px" }}>🎬 Live Demo Mode</div>
          <div className="section-subtitle">Auto-plays the full RoadSense AI pipeline for presentations</div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
          {completed && (
            <button onClick={reset} className="btn-secondary">🔄 Reset</button>
          )}
          <button onClick={runDemo} disabled={running} className="btn-primary">
            {running ? "▶ Running..." : "▶ Start Demo"}
          </button>
        </div>
      </div>

      {/* Steps grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
        {demoSteps.map((step) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;
          return (
            <div key={step.id} style={{
              padding: "16px",
              borderRadius: "12px",
              border: `1px solid ${isActive ? "var(--accent-blue)" : isDone ? "rgba(16,185,129,0.4)" : "var(--border)"}`,
              background: isActive
                ? "rgba(99,102,241,0.08)"
                : isDone
                ? "rgba(16,185,129,0.06)"
                : "var(--bg-surface)",
              transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
              position: "relative",
              overflow: "hidden",
            }}>
              {isActive && (
                <div style={{
                  position: "absolute", top: 0, left: 0, height: "2px",
                  background: "linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))",
                  width: "100%", animation: "progress 2s linear",
                }} />
              )}
              <div style={{ fontSize: "14px", marginBottom: "6px", fontWeight: "600" }}>
                {isDone ? "✅" : isActive ? "⏳" : "⭕"}{" "}
                <span style={{ color: isActive ? "var(--text-primary)" : isDone ? "#34d399" : "var(--text-muted)" }}>
                  {step.title.split(" ").slice(1).join(" ")}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.5" }}>
                {step.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo result */}
      {showResult && (
        <div style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,42,95,0.6))",
          border: "1px solid var(--border-accent)",
          borderRadius: "16px", padding: "28px",
        }}>
          <div style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)" }}>
            🎯 Demo Result — Silk Board Junction
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
            {[
              { label: "AI SEVERITY", value: mockResult.severity, sub: `${mockResult.confidence}% confidence`, color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
              { label: "DAILY DAMAGE", value: `₹${mockResult.vehicle_damage_cost_per_day.toLocaleString()}`, sub: "per day if ignored", color: "#eab308", bg: "rgba(234,179,8,0.12)", border: "rgba(234,179,8,0.25)" },
              { label: "MONTHLY SAVINGS", value: `₹${mockResult.monthly_savings_if_fixed.toLocaleString()}`, sub: "if fixed now", color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)" },
            ].map(item => (
              <div key={item.label} style={{ background: item.bg, borderRadius: "12px", padding: "18px", border: `1px solid ${item.border}` }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.08em", marginBottom: "8px" }}>{item.label}</div>
                <div style={{ fontSize: "22px", fontWeight: "800", color: item.color, letterSpacing: "-0.5px" }}>{item.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
            borderRadius: "10px", padding: "16px", fontSize: "12px",
            lineHeight: "1.9", color: "var(--text-secondary)"
          }}>
            <strong style={{ color: "var(--text-primary)" }}>📋 Auto-Generated RTI Complaint:</strong><br />
            To: Public Information Officer, BBMP | Date: {new Date().toLocaleDateString('en-IN')}<br />
            Subject: Urgent Road Repair — CRITICAL Severity Pothole at Silk Board<br />
            A critical pothole has been detected at Silk Board Junction (12.9172°N, 77.6101°E).
            Vehicle damage estimated at ₹15,000/day. Repair cost: ₹8,000.
            Immediate repair requested within 48 hours per BBMP SLA.<br />
            — <em>RoadSense AI Automated Monitoring System</em>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}