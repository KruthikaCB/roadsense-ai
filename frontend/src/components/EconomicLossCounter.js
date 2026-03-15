import React, { useEffect, useState } from "react";
import { getPotholes } from "../services/api";

// Monthly vehicle damage per severity (spec-defined values)
const DAILY_LOSS = { CRITICAL: 50000, HIGH: 20000, MEDIUM: 8000, LOW: 2000, critical: 50000, high: 20000, medium: 8000, low: 2000 };

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

export default function EconomicLossCounter() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    getPotholes().then((res) => {
      if (res.status === "success") setIncidents(res.data);
    });
  }, []);

  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  incidents.forEach((p) => {
    const key = (p.severity || "").toUpperCase();
    if (bySeverity[key] !== undefined) bySeverity[key]++;
  });

  const total = Object.entries(bySeverity).reduce(
    (sum, [sev, count]) => sum + (DAILY_LOSS[sev] || 0) * count, 0
  );

  const rows = [
    { label: "Critical", count: bySeverity.CRITICAL, color: "#ef4444", loss: DAILY_LOSS.CRITICAL },
    { label: "High",     count: bySeverity.HIGH,     color: "#f97316", loss: DAILY_LOSS.HIGH },
    { label: "Medium",   count: bySeverity.MEDIUM,   color: "#eab308", loss: DAILY_LOSS.MEDIUM },
    { label: "Low",      count: bySeverity.LOW,       color: "#22c55e", loss: DAILY_LOSS.LOW },
  ];

  return (
    <div>
      <div style={{ marginBottom: "18px" }}>
        <div className="section-title">💸 Monthly Economic Loss</div>
        <div className="section-subtitle">Estimated vehicle damage cost per month across all active incidents</div>
      </div>

      {/* Total banner */}
      <div style={{
        background: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.08))",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: "12px", padding: "20px", marginBottom: "16px", textAlign: "center"
      }}>
        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "6px" }}>
          Total Monthly Loss
        </div>
        <div style={{ fontSize: "32px", fontWeight: "800", color: "#ef4444", letterSpacing: "-1px" }}>
          {fmt(total)}
        </div>
        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
          across {incidents.length} active incident{incidents.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Per-severity breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {rows.map(({ label, count, color, loss }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "8px", padding: "10px 14px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, display: "inline-block" }} />
              <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>{label}</span>
              <span style={{ fontSize: "11px", color: "#475569" }}>×{count}</span>
            </div>
            <span style={{ fontSize: "13px", fontWeight: "700", color }}>
              {fmt(loss * count)}/mo
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
