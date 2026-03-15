import React, { useState, useEffect, useRef } from "react";
import { getPotholes, updateStatus, sendBatchComplaints } from "../services/api";

const ADMIN_USERNAME = "bbmp_admin";
const ADMIN_PASSWORD = "BBMP@2024";
const STATUS_OPTIONS = ["reported", "under_review", "in_progress", "fixed"];
const STATUS_LABELS = {
  reported: "Reported",
  under_review: "Under Review",
  in_progress: "In Progress",
  fixed: "Fixed",
};
const STATUS_COLORS = {
  reported: "#ef4444",
  under_review: "#f97316",
  in_progress: "#3b82f6",
  fixed: "#22c55e",
};
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const SEV_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const DAILY_LOSS = { critical: 1667, high: 667, medium: 267, low: 67 };

// Returns the best stored location string from a pothole object, or "" if none useful
function storedLocation(p) {
  const candidates = [p.ward, p.place_name, p.area, p.address, p.location];
  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim().length > 0 && !c.toLowerCase().includes("bengaluru") && !c.toLowerCase().includes("karnataka")) {
      return c.trim();
    }
  }
  // Accept "Bengaluru"-containing strings only as last resort if nothing else
  for (const c of candidates) {
    if (c && typeof c === "string" && c.trim().length > 0) return c.trim();
  }
  return "";
}

function sortPotholes(list) {
  return [...list].sort((a, b) => {
    const sa = SEV_ORDER[a.severity?.toLowerCase()] ?? 99;
    const sb = SEV_ORDER[b.severity?.toLowerCase()] ?? 99;
    if (sa !== sb) return sa - sb;
    const ua = parseInt(a.upvotes) || 0;
    const ub = parseInt(b.upvotes) || 0;
    if (ub !== ua) return ub - ua;
    const ta = new Date(a.reported_at || a.created_at || a.timestamp || 0).getTime();
    const tb = new Date(b.reported_at || b.created_at || b.timestamp || 0).getTime();
    return ta - tb; // oldest first (waiting longest)
  });
}

export default function AdminPortal() {
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState({});
  const [resolvedLocations, setResolvedLocations] = useState({});
  const geoCache = useRef({});
  const [batchSending, setBatchSending] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && pw === ADMIN_PASSWORD) {
      setAuthed(true); setPwError("");
    } else {
      setPwError("Invalid username or password.");
    }
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    getPotholes().then((res) => {
      if (res.status === "success") {
        const data = res.data || [];
        setPotholes(data);
        if (data.length > 0) {
          console.log("Pothole data sample:", data[0]);
          console.log("All pothole keys:", Object.keys(data[0]));
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authed]);

  // Reverse-geocode rows that have no useful stored location
  useEffect(() => {
    if (!potholes.length) return;
    const needsGeo = potholes.filter((p) => {
      if (storedLocation(p)) return false; // already have a good name
      const lat = parseFloat(p.latitude);
      const lon = parseFloat(p.longitude);
      if (isNaN(lat) || isNaN(lon)) return false;
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      return !(key in geoCache.current); // not yet cached
    });

    if (!needsGeo.length) return;

    // Deduplicate by lat/lon key
    const seen = new Set();
    const unique = needsGeo.filter((p) => {
      const key = `${parseFloat(p.latitude).toFixed(5)},${parseFloat(p.longitude).toFixed(5)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.forEach(async (p) => {
      const lat = parseFloat(p.latitude);
      const lon = parseFloat(p.longitude);
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
        );
        const data = await res.json();
        const addr = data.address || {};
        const label =
          addr.suburb ||
          addr.neighbourhood ||
          addr.quarter ||
          addr.city_district ||
          addr.county ||
          addr.city ||
          addr.town ||
          "Bengaluru";
        geoCache.current[key] = label;
        setResolvedLocations((prev) => ({ ...prev, [key]: label }));
      } catch {
        geoCache.current[key] = "Bengaluru";
        setResolvedLocations((prev) => ({ ...prev, [key]: "Bengaluru" }));
      }
    });
  }, [potholes]);

  const handleStatusChange = async (id, status) => {
    setUpdating((u) => ({ ...u, [id]: true }));
    await updateStatus(id, status);
    setPotholes((prev) =>
      prev.map((p) => (p.incident_id === id ? { ...p, status } : p))
    );
    setUpdating((u) => ({ ...u, [id]: false }));
  };

  const handleSendBatch = async () => {
    setBatchSending(true);
    setBatchResult(null);
    try {
      const res = await sendBatchComplaints();
      if (res.status === "success") {
        setBatchResult({ ok: true, message: `Batch report sent for ${res.data.zones_count} zone(s) covering ${res.data.potholes_count} pothole(s).` });
      } else {
        setBatchResult({ ok: false, message: res.message || "Failed to send batch report." });
      }
    } catch {
      setBatchResult({ ok: false, message: "Network error. Please try again." });
    }
    setBatchSending(false);
  };

  if (!authed) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg-base)" }}>
        <div className="glass-card" style={{ padding: "40px", width: "360px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🏛️</div>
            <h2 style={{ color: "var(--text-primary)", marginBottom: "4px", fontSize: "18px", fontWeight: "700" }}>BBMP Admin Portal</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "12px" }}>Restricted access. Authorised personnel only.</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="dark-input"
              style={{ width: "100%", marginBottom: "10px", boxSizing: "border-box" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="dark-input"
              style={{ width: "100%", marginBottom: "12px", boxSizing: "border-box" }}
            />
            {pwError && <p style={{ color: "#f87171", fontSize: "12px", marginBottom: "10px" }}>{pwError}</p>}
            <button type="submit" className="btn-danger" style={{ width: "100%", padding: "11px" }}>Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", background: "var(--bg-base)", minHeight: "100vh" }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="section-title" style={{ fontSize: "20px" }}>🏛️ BBMP Admin Portal</h1>
          <p className="section-subtitle">Manage pothole repair statuses across Bengaluru</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={handleSendBatch}
            disabled={batchSending}
            style={{
              padding: "9px 18px", fontSize: "12px", fontWeight: "600",
              background: batchSending ? "rgba(99,102,241,0.1)" : "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(34,211,238,0.15))",
              color: batchSending ? "#818cf8" : "#c7d2fe",
              border: "1px solid rgba(99,102,241,0.4)", borderRadius: "8px",
              cursor: batchSending ? "not-allowed" : "pointer", whiteSpace: "nowrap"
            }}
          >
            {batchSending ? "⏳ Sending..." : "📬 Send Batch Report to BBMP"}
          </button>
          <button
            onClick={() => { setAuthed(false); setUsername(""); setPw(""); }}
            style={{
              padding: "8px 18px", fontSize: "12px", fontWeight: "600",
              background: "rgba(239,68,68,0.1)", color: "#f87171",
              border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", cursor: "pointer"
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {batchResult && (
        <div style={{
          marginBottom: "16px", padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "600",
          background: batchResult.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${batchResult.ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: batchResult.ok ? "#34d399" : "#f87171",
        }}>
          {batchResult.ok ? "✅" : "⚠️"} {batchResult.message}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading incidents...</p>
      ) : (
        <div className="glass-card" style={{ padding: "0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid var(--border)" }}>
                {["Location", "Severity", "Reported Date", "Status", "Daily Loss", "Action"].map((h) => (
                  <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "var(--text-muted)", fontWeight: "600", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortPotholes(potholes).map((p) => {
                const reported = p.reported_at || p.created_at || p.timestamp;
                const dateStr = reported ? new Date(reported).toLocaleDateString("en-IN") : "—";
                const stored = storedLocation(p);
                const lat = parseFloat(p.latitude || 0);
                const lon = parseFloat(p.longitude || 0);
                const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                const geoKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
                const displayName = stored || resolvedLocations[geoKey] || (geoCache.current[geoKey]) || "Resolving…";
                const sev = p.severity?.toLowerCase();                const sevColor = SEV_COLORS[sev] || "#9ca3af";
                const sevLabel = p.severity ? p.severity.charAt(0).toUpperCase() + p.severity.slice(1).toLowerCase() : "Unknown";
                const dailyLoss = DAILY_LOSS[sev];
                return (
                  <tr key={p.incident_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    {/* Location */}
                    <td style={{ padding: "12px 16px", maxWidth: "220px" }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: "500", fontSize: "12px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={displayName}>
                        {displayName}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>{coords}</div>
                    </td>
                    {/* Severity */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: sevColor, fontWeight: "700", fontSize: "12px" }}>{sevLabel}</span>
                    </td>
                    {/* Date */}
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px" }}>{dateStr}</td>
                    {/* Status badge */}
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600",
                        background: `${STATUS_COLORS[p.status] || "#6b7280"}22`,
                        color: STATUS_COLORS[p.status] || "#9ca3af",
                        border: `1px solid ${STATUS_COLORS[p.status] || "#6b7280"}44`
                      }}>
                        {STATUS_LABELS[p.status] || p.status || "Reported"}
                      </span>
                    </td>
                    {/* Daily loss */}
                    <td style={{ padding: "12px 16px" }}>
                      {dailyLoss != null ? (
                        <span style={{ color: "#ef4444", fontWeight: "700", fontSize: "12px" }}>
                          ₹{dailyLoss.toLocaleString()}/day
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                      )}
                    </td>
                    {/* Action dropdown */}
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={p.status || "reported"}
                        disabled={updating[p.incident_id]}
                        onChange={(e) => handleStatusChange(p.incident_id, e.target.value)}
                        style={{
                          background: "var(--bg-surface)", color: "var(--text-primary)",
                          border: "1px solid var(--border)", borderRadius: "8px",
                          padding: "6px 10px", fontSize: "12px", cursor: "pointer"
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {potholes.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>No incidents found.</td></tr>
              )}
              {/* Total daily loss footer */}
              {potholes.length > 0 && (() => {
                const total = potholes.reduce((sum, p) => {
                  const loss = DAILY_LOSS[p.severity?.toLowerCase()];
                  return sum + (loss || 0);
                }, 0);
                return (
                  <tr style={{ background: "rgba(239,68,68,0.06)", borderTop: "2px solid rgba(239,68,68,0.2)" }}>
                    <td colSpan={4} style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textAlign: "right" }}>
                      Total daily economic loss across all unfixed potholes:
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: "#ef4444", fontWeight: "800", fontSize: "14px" }}>
                        ₹{total.toLocaleString()}/day
                      </span>
                    </td>
                    <td />
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
