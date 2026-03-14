import React, { useEffect, useState } from "react";
import { getPotholes } from "../services/api";

const repairCost = { CRITICAL: 50000, HIGH: 25000, MEDIUM: 10000, LOW: 5000, critical: 50000, high: 25000, medium: 10000, low: 5000 };
const dailyDamage = { CRITICAL: 15000, HIGH: 8000, MEDIUM: 3000, LOW: 1000, critical: 15000, high: 8000, medium: 3000, low: 1000 };
const sevColor = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e", critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };

const fmt = (n) => "₹" + Math.abs(n).toLocaleString("en-IN");

export default function ROICalculator() {
  const [incidents, setIncidents] = useState([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    getPotholes().then((res) => {
      const real = res.status === "success" ? res.data : [];
      const mock = [
        { incident_id: "m1", severity: "CRITICAL", status: "reported", description: "Silk Board" },
        { incident_id: "m2", severity: "HIGH", status: "reported", description: "ORR" },
        { incident_id: "m3", severity: "MEDIUM", status: "reported", description: "Marathahalli" },
      ];
      setIncidents([...real, ...mock]);
    });
  }, []);

  const totalRepairCost = incidents.reduce((sum, p) => sum + (repairCost[p.severity] || 5000), 0);
  const totalDailyDamage = incidents.reduce((sum, p) => sum + (dailyDamage[p.severity] || 1000), 0);
  const totalLossIfIgnored = totalDailyDamage * days;
  const savings = totalLossIfIgnored - totalRepairCost;
  const roi = totalRepairCost > 0 ? Math.round((savings / totalRepairCost) * 100) : 0;
  const rupeesPerRupee = totalRepairCost > 0 ? Math.round(savings / totalRepairCost) : 0;

  const summaryCards = [
    { label: "Cost to Fix All Now", value: fmt(totalRepairCost), color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" },
    { label: `Loss if Ignored (${days}d)`, value: fmt(totalLossIfIgnored), color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
    { label: "Net Savings if Fixed", value: fmt(savings), color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
    { label: "ROI of Fixing", value: `${roi}% 🔥`, color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <div className="section-title">💰 Repair ROI Calculator</div>
        <div className="section-subtitle">How much does BBMP save by fixing potholes now vs ignoring them?</div>
      </div>

      {/* Slider */}
      <div style={{ marginBottom: "24px", background: "var(--bg-surface)", padding: "18px", borderRadius: "12px", border: "1px solid var(--border)" }}>
        <label style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
          If ignored for: <span style={{ color: "var(--accent-blue-light)", fontSize: "15px", fontWeight: "700" }}>{days} days</span>
        </label>
        <input type="range" min="1" max="365" value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ width: "100%", marginTop: "10px", accentColor: "var(--accent-blue)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
          <span>1 day</span><span>6 months</span><span>1 year</span>
        </div>
      </div>

      {/* Summary cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{
            background: card.bg, borderRadius: "12px", padding: "18px",
            border: `1px solid ${card.border}`,
          }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{card.label}</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: card.color, letterSpacing: "-0.5px" }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.08))",
        border: "1px solid var(--border-accent)",
        borderRadius: "12px", padding: "18px", marginBottom: "24px",
      }}>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "6px" }}>💡 KEY INSIGHT FOR BBMP</div>
        <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)" }}>
          Every ₹1 spent on repairs saves <span style={{ color: "var(--accent-cyan)" }}>₹{rupeesPerRupee}</span> in vehicle damage over {days} days
        </div>
      </div>

      {/* Per pothole table */}
      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px" }}>Per Pothole Breakdown</div>
      <table className="dark-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Repair Cost</th>
            <th>Daily Damage</th>
            <th>Loss in {days}d</th>
            <th>ROI</th>
          </tr>
        </thead>
        <tbody>
          {incidents.slice(0, 8).map((p, i) => {
            const rc = repairCost[p.severity] || 5000;
            const dd = dailyDamage[p.severity] || 1000;
            const loss = dd * days;
            const r = Math.round(((loss - rc) / rc) * 100);
            return (
              <tr key={p.incident_id}>
                <td><span style={{ color: sevColor[p.severity], fontWeight: "700" }}>{p.severity}</span></td>
                <td>{fmt(rc)}</td>
                <td>{fmt(dd)}/day</td>
                <td style={{ color: "#f87171" }}>{fmt(loss)}</td>
                <td style={{ color: "#34d399", fontWeight: "700" }}>{r}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}