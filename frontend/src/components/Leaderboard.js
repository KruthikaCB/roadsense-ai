import React, { useEffect, useState } from "react";
import { getPotholes } from "../services/api";

const ZONES = {
  "Silk Board": { lat: 12.9172, lng: 77.6101 },
  "Outer Ring Road": { lat: 12.9352, lng: 77.6245 },
  "Marathahalli": { lat: 12.9698, lng: 77.7499 },
  "Hebbal": { lat: 13.0358, lng: 77.5970 },
  "Whitefield": { lat: 12.9698, lng: 77.7499 },
  "KR Puram": { lat: 12.9592, lng: 77.6974 },
};

const severityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, critical: 4, high: 3, medium: 2, low: 1 };

function getZone(lat, lng) {
  let closest = "Unknown";
  let minDist = Infinity;
  for (const [name, coords] of Object.entries(ZONES)) {
    const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
    if (dist < minDist) { minDist = dist; closest = name; }
  }
  return closest;
}

const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

export default function Leaderboard() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    getPotholes().then(() => {
      const mockData = [
        { incident_id: "mock-1", latitude: "12.9352", longitude: "77.6245", severity: "CRITICAL", status: "reported", report_count: 3 }, // Koramangala
        { incident_id: "mock-2", latitude: "12.9698", longitude: "77.7499", severity: "HIGH", status: "reported", report_count: 2 }, // Marathahalli
        { incident_id: "mock-3", latitude: "12.9592", longitude: "77.6974", severity: "MEDIUM", status: "reported", report_count: 1 }, // KR Puram
      ];
      
      const zoneMap = {};
      mockData.forEach((p) => {
        const zone = getZone(parseFloat(p.latitude), parseFloat(p.longitude));
        if (!zoneMap[zone]) zoneMap[zone] = { name: zone, count: 0, score: 0, critical: 0 };
        zoneMap[zone].count += 1;
        zoneMap[zone].score += severityScore[p.severity] || 1;
        if (p.severity === "CRITICAL" || p.severity === "critical") zoneMap[zone].critical += 1;
      });
      setZones(Object.values(zoneMap).sort((a, b) => b.score - a.score).slice(0, 5));
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "18px" }}>
        <div className="section-title">⚠️ Worst Zones</div>
        <div className="section-subtitle">Ranked by combined risk score</div>
      </div>
      <table className="dark-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Zone</th>
            <th>Potholes</th>
            <th>Critical</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z, i) => (
            <tr key={z.name}>
              <td style={{ fontSize: "16px" }}>{medals[i]}</td>
              <td style={{ color: "var(--text-primary)", fontWeight: "600" }}>{z.name}</td>
              <td style={{ color: "var(--text-secondary)" }}>{z.count}</td>
              <td>
                {z.critical > 0
                  ? <span className="badge badge-critical">{z.critical}</span>
                  : <span style={{ color: "var(--text-muted)" }}>—</span>
                }
              </td>
              <td>
                <span style={{
                  fontWeight: "700",
                  color: i === 0 ? "#ef4444" : i === 1 ? "#f97316" : "var(--text-secondary)"
                }}>{z.score}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}