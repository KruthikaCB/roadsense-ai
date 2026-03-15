import React, { useEffect, useState } from "react";
import { getPotholes } from "../services/api";

// Monthly vehicle damage per severity (₹/month)
const monthlyDamage = { CRITICAL: 50000, HIGH: 20000, MEDIUM: 8000, LOW: 2000 };
// One-time repair cost per pothole (₹)
const repairCost = { CRITICAL: 200000, HIGH: 75000, MEDIUM: 30000, LOW: 10000 };
const sevColor = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e" };

const fmt = (n) => "₹" + Math.abs(Math.round(n)).toLocaleString("en-IN");
const normSev = (s) => (s || "").toUpperCase();

export default function ROICalculator() {
  const [incidents, setIncidents] = useState([]);
  const [months, setMonths] = useState(3);

  useEffect(() => {
    getPotholes().then((res) => {
      setIncidents(res.status === "success" ? res.data : []);
    });
  }, []);

  const totalRepairCost = incidents.reduce((sum, p) => sum + (repairCost[normSev(p.severity)] || 10000), 0);
  const totalMonthlyDamage = incidents.reduce((sum, p) => sum + (monthlyDamage[normSev(p.severity)] || 2000), 0);
  const totalDamageSaved = totalMonthlyDamage * months;
  const netSavings = totalDamageSaved - totalRepairCost;
  const roi = totalRepairCost > 0 ? Math.round((totalDamageSaved / totalRepairCost) * 100) : 0;
  const rupeesPerRupee = totalRepairCost > 0 ? (totalDamageSaved / totalRepairCost).toFixed(1) : 0;

  const summaryCards = [
    { label: "Cost to Fix All Now", value: fmt(totalRepairCost), color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)" },
    { label: `Damage Saved (${months}mo)`, value: fmt(totalDamageSaved), color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
    { label: "Net Savings", value: fmt(netSavings), color: netSavings >= 0 ? "#10b981" : "#ef4444", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
    { label: "ROI", value: `${roi}%`, color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.2)" },
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
          Projection period: <span style={{ color: "var(--accent-blue-light)", fontSize: "15px", fontWeight: "700" }}>{months} month{months !== 1 ? "s" : ""}</span>
        </label>
        <input type="range" min="1" max="24" value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          style={{ width: "100%", marginTop: "10px", accentColor: "var(--accent-blue)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
          <span>1 month</span><span>1 year</span><span>2 years</span>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {summaryCards.map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: "12px", padding: "18px", border: `1px solid ${card.border}` }}>
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
          Every ₹1 spent on repairs saves <span style={{ color: "var(--accent-cyan)" }}>₹{rupeesPerRupee}</span> in vehicle damage over {months} month{months !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Per severity breakdown */}
      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "12px" }}>Per Severity Breakdown</div>
      <table className="dark-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Repair Cost</th>
            <th>Monthly Damage</th>
            <th>Damage ({months}mo)</th>
            <th>ROI %</th>
          </tr>
        </thead>
        <tbody>
          {["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => {
            const rc = repairCost[sev];
            const md = monthlyDamage[sev];
            const dmg = md * months;
            const r = Math.round((dmg / rc) * 100);
            return (
              <tr key={sev}>
                <td><span style={{ color: sevColor[sev], fontWeight: "700" }}>{sev}</span></td>
                <td>{fmt(rc)}</td>
                <td>{fmt(md)}/mo</td>
                <td style={{ color: "#f87171" }}>{fmt(dmg)}</td>
                <td style={{ color: "#34d399", fontWeight: "700" }}>{r}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
