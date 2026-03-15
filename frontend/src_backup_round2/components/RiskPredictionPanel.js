import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8000/predict/risk-zones";

function riskColor(score) {
  if (score > 70) return "#ef4444";
  if (score >= 40) return "#f97316";
  return "#22c55e";
}

function RiskCard({ ward, score, reason }) {
  const color = riskColor(score);
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "10px",
      padding: "14px 16px",
      marginBottom: "10px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#f1f5f9" }}>{ward}</span>
        <span style={{ fontSize: "13px", fontWeight: "700", color }}>{score}</span>
      </div>

      {/* Risk bar */}
      <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", height: "6px", marginBottom: "8px" }}>
        <div style={{
          width: `${Math.min(score, 100)}%`,
          height: "100%",
          borderRadius: "4px",
          background: color,
          transition: "width 0.6s ease",
          boxShadow: `0 0 8px ${color}88`,
        }} />
      </div>

      <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{reason}</p>
    </div>
  );
}

export default function RiskPredictionPanel() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => {
        if (data.status === "success") setZones(data.data);
        else setErr("Failed to load risk zones");
      })
      .catch(() => setErr("Could not reach prediction service"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#f1f5f9", margin: "0 0 4px" }}>
          🤖 AI Pothole Prediction — Next 30 Days
        </h3>
        <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Top 5 high-risk wards based on rainfall, pothole density & road age</p>
      </div>

      {loading && <p style={{ fontSize: "12px", color: "#64748b" }}>Loading predictions...</p>}
      {err && <p style={{ fontSize: "12px", color: "#ef4444" }}>{err}</p>}
      {!loading && !err && zones.map(z => (
        <RiskCard key={z.ward} ward={z.ward} score={z.score} reason={z.reason} />
      ))}
    </div>
  );
}
