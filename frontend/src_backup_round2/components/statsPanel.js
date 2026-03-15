import React, { useEffect, useState } from "react";
import { getStats, getPotholes } from "../services/api";

const ZONES = {
  "Electronic City": { lat: 12.8458, lng: 77.6692 },
  "Bommanahalli": { lat: 12.8961, lng: 77.6259 },
  "HSR Layout": { lat: 12.9116, lng: 77.6389 },
  "PESU RR Campus": { lat: 12.9121, lng: 77.6446 },
  "Koramangala": { lat: 12.9352, lng: 77.6245 },
  "Silk Board": { lat: 12.9172, lng: 77.6101 },
  "Outer Ring Road": { lat: 12.9352, lng: 77.6245 },
  "Marathahalli": { lat: 12.9698, lng: 77.7499 },
  "Hebbal": { lat: 13.0358, lng: 77.5970 },
  "Whitefield": { lat: 12.9698, lng: 77.7408 },
  "Bannerghatta": { lat: 12.8636, lng: 77.5988 },
  "JP Nagar": { lat: 12.9063, lng: 77.5857 },
  "Jayanagar": { lat: 12.9299, lng: 77.5826 },
  "Indiranagar": { lat: 12.9784, lng: 77.6408 },
  "Kengeri": { lat: 12.9063, lng: 77.5488 },
  "Uttarahalli": { lat: 12.9031, lng: 77.5091 },
};

export default function StatsPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getPotholes()]).then(([statsRes, potholesRes]) => {
      const s = statsRes.status === "success" ? statsRes.data : null;
      const incidents = potholesRes.status === "success" ? potholesRes.data : [];

      const zones = {};
      incidents.forEach(p => {
        let closest = "Unknown"; let minDist = Infinity;
        for (const [name, coords] of Object.entries(ZONES)) {
          const dist = Math.sqrt(Math.pow(parseFloat(p.latitude) - coords.lat, 2) + Math.pow(parseFloat(p.longitude) - coords.lng, 2));
          if (dist < minDist) { minDist = dist; closest = name; }
        }
        zones[closest] = (zones[closest] || 0) + 1;
      });

      const worstZone = Object.entries(zones).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const finalStats = { ...s, worstZone, complaints_sent: incidents.filter(p => p.complaint_sent).length };
      setStats(finalStats);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="shimmer" style={{ height: "92px", borderRadius: "12px" }} />
      ))}
    </div>
  );
  if (!stats) return <p style={{ color: "var(--text-muted)" }}>No stats available</p>;

  const cards = [
    { label: "Total Incidents", value: stats.total_incidents || 0, color: "#6366f1", glow: "rgba(99,102,241,0.25)", icon: "🕳️" },
    { label: "Critical", value: stats.by_severity?.critical || 0, color: "#ef4444", glow: "rgba(239,68,68,0.25)", icon: "🚨" },
    { label: "High Severity", value: stats.by_severity?.high || 0, color: "#f97316", glow: "rgba(249,115,22,0.25)", icon: "⚠️" },
    { label: "Resolved", value: stats.by_status?.resolved || 0, color: "#10b981", glow: "rgba(16,185,129,0.25)", icon: "✅" },
    { label: "Complaints Sent", value: stats.complaints_sent || 0, color: "#a855f7", glow: "rgba(168,85,247,0.25)", icon: "📋" },
    { label: "Worst Zone", value: stats.worstZone || "N/A", color: "#eab308", glow: "rgba(234,179,8,0.25)", icon: "📍" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
      {cards.map((card) => (
        <div key={card.label} className="stat-card" style={{ "--card-color": card.color }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = `0 0 24px ${card.glow}, var(--shadow-elevated)`;
            e.currentTarget.style.borderColor = card.color + "55";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = "var(--shadow-card)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: "3px", height: "100%",
            background: `linear-gradient(180deg, ${card.color}, transparent)`,
            borderRadius: "2px 0 0 2px",
          }} />
          <div style={{ paddingLeft: "8px" }}>
            <div style={{ fontSize: "20px", marginBottom: "8px" }}>{card.icon}</div>
            <div style={{ fontSize: "26px", fontWeight: "800", color: card.color, letterSpacing: "-0.5px", lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontWeight: "500", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {card.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
