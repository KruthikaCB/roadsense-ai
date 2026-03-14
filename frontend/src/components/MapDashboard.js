import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { getPotholes, getComplaint, updateStatus } from "../services/api";
import "leaflet/dist/leaflet.css";

const severityColor = {
  CRITICAL: "#ef4444", critical: "#ef4444",
  HIGH: "#f97316", high: "#f97316",
  MEDIUM: "#eab308", medium: "#eab308",
  LOW: "#22c55e", low: "#22c55e",
};

const mockData = [
  { incident_id: "mock-1", latitude: "12.9172", longitude: "77.6101", severity: "CRITICAL", status: "reported", description: "Large pothole at Silk Board", timestamp: new Date().toISOString() },
  { incident_id: "mock-2", latitude: "12.9352", longitude: "77.6245", severity: "HIGH", status: "reported", description: "Multiple potholes on ORR", timestamp: new Date().toISOString() },
  { incident_id: "mock-3", latitude: "12.9592", longitude: "77.6974", severity: "MEDIUM", status: "reported", description: "Road surface damage", timestamp: new Date().toISOString() },
  { incident_id: "mock-4", latitude: "12.9698", longitude: "77.7499", severity: "HIGH", status: "reported", description: "Pothole near Marathahalli", timestamp: new Date().toISOString() },
  { incident_id: "mock-5", latitude: "12.9082", longitude: "77.5994", severity: "LOW", status: "resolved", description: "Minor surface crack", timestamp: new Date().toISOString() },
];

const fetchTrafficIncidents = async () => {
  const key = process.env.REACT_APP_TOMTOM_KEY;
  const bbox = "77.4,12.8,77.8,13.2";
  try {
    const res = await fetch(
      `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bbox}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11&timeValidityFilter=present`
    );
    const data = await res.json();
    return data.incidents || [];
  } catch { return []; }
};

// Popup inner button style
const popupBtn = {
  background: "linear-gradient(135deg, #dc2626, #ef4444)",
  color: "white", border: "none",
  padding: "7px 12px", borderRadius: "6px",
  cursor: "pointer", width: "100%",
  fontSize: "12px", fontWeight: "600",
  fontFamily: "Inter, sans-serif",
  marginTop: "6px",
};

const popupSelect = {
  width: "100%", padding: "6px 8px",
  borderRadius: "6px", background: "#1e293b",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f1f5f9", fontSize: "12px",
  fontFamily: "Inter, sans-serif",
  cursor: "pointer", marginTop: "4px",
};

export default function MapDashboard() {
  const [potholes, setPotholes] = useState([]);
  const [trafficIncidents, setTrafficIncidents] = useState([]);
  const [complaints, setComplaints] = useState({});
  const [loadingComplaint, setLoadingComplaint] = useState({});
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    const load = async () => {
      const [potholesRes, trafficData] = await Promise.all([getPotholes(), fetchTrafficIncidents()]);
      const real = potholesRes.status === "success" ? potholesRes.data : [];
      setPotholes([...real, ...mockData]);
      setTrafficIncidents(trafficData);
    };
    load().catch(() => setPotholes(mockData));
  }, []);

  const handleGenerateComplaint = async (incidentId) => {
    if (incidentId.startsWith("mock")) {
      setComplaints(prev => ({ ...prev, [incidentId]: "This is a demo incident. Upload a real pothole to generate a complaint." }));
      return;
    }
    setLoadingComplaint(prev => ({ ...prev, [incidentId]: true }));
    try {
      const res = await getComplaint(incidentId);
      setComplaints(prev => ({ ...prev, [incidentId]: res.status === "success" ? res.data.complaint : "Failed to generate complaint." }));
    } catch { setComplaints(prev => ({ ...prev, [incidentId]: "Error generating complaint." })); }
    setLoadingComplaint(prev => ({ ...prev, [incidentId]: false }));
  };

  const handleStatusUpdate = async (incidentId, newStatus) => {
    if (incidentId.startsWith("mock")) return;
    try {
      await updateStatus(incidentId, newStatus);
      setStatuses(prev => ({ ...prev, [incidentId]: newStatus }));
    } catch { alert("Failed to update status"); }
  };

  const legend = [
    { label: "Critical", color: "#ef4444" },
    { label: "High", color: "#f97316" },
    { label: "Medium", color: "#eab308" },
    { label: "Low", color: "#22c55e" },
    { label: "Traffic", color: "#818cf8" },
  ];

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
        {legend.map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: l.color, display: "inline-block", boxShadow: `0 0 6px ${l.color}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ height: "520px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)" }}>
        <MapContainer center={[12.9352, 77.6245]} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {potholes.map((p) => (
            <CircleMarker
              key={p.incident_id}
              center={[parseFloat(p.latitude), parseFloat(p.longitude)]}
              radius={12}
              fillColor={severityColor[p.severity] || "#eab308"}
              color="rgba(0,0,0,0.4)"
              weight={1}
              fillOpacity={0.9}
            >
              <Popup minWidth={260}>
                <div style={{ fontFamily: "Inter, sans-serif" }}>
                  <div style={{ fontWeight: "700", fontSize: "13px", color: severityColor[p.severity], marginBottom: "6px" }}>
                    {p.severity} Pothole
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>
                    Status: <span style={{ color: "#f1f5f9" }}>{statuses[p.incident_id] || p.status}</span>
                  </div>
                  {p.description && <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "2px" }}>{p.description}</div>}
                  <div style={{ fontSize: "10px", color: "#475569", marginBottom: "10px" }}>{new Date(p.timestamp).toLocaleString()}</div>

                  {!complaints[p.incident_id] ? (
                    <button onClick={() => handleGenerateComplaint(p.incident_id)} disabled={loadingComplaint[p.incident_id]} style={popupBtn}>
                      {loadingComplaint[p.incident_id] ? "Generating..." : "📋 Generate BBMP Complaint"}
                    </button>
                  ) : (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "6px", padding: "8px", fontSize: "11px", color: "#94a3b8", maxHeight: "100px", overflowY: "auto" }}>
                        {complaints[p.incident_id]}
                      </div>
                      <p style={{ color: "#34d399", fontSize: "11px", marginTop: "4px" }}>✅ Complaint Sent</p>
                    </div>
                  )}

                  {!p.incident_id.startsWith("mock") && (
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontSize: "10px", color: "#475569", marginBottom: "4px" }}>Update Status:</div>
                      <select value={statuses[p.incident_id] || p.status} onChange={(e) => handleStatusUpdate(p.incident_id, e.target.value)} style={popupSelect}>
                        <option value="reported">📌 Reported</option>
                        <option value="under_review">🔍 Under Review</option>
                        <option value="in_progress">🔧 In Progress</option>
                        <option value="fixed">✅ Fixed</option>
                      </select>
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {trafficIncidents.slice(0, 20).map((incident, i) => {
            const coords = incident.geometry?.coordinates;
            if (!coords) return null;
            const lat = Array.isArray(coords[0]) ? coords[0][1] : coords[1];
            const lng = Array.isArray(coords[0]) ? coords[0][0] : coords[0];
            if (isNaN(lat) || isNaN(lng)) return null;
            return (
              <CircleMarker key={`traffic-${i}`} center={[lat, lng]} radius={8} fillColor="#818cf8" color="#4f46e5" weight={1} fillOpacity={0.8}>
                <Popup>
                  <div style={{ fontFamily: "Inter, sans-serif" }}>
                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#818cf8", marginBottom: "6px" }}>🚦 Traffic Incident</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>{incident.properties?.events?.[0]?.description || "Traffic disruption"}</div>
                    {incident.properties?.from && <div style={{ fontSize: "11px", color: "#94a3b8" }}>From: {incident.properties.from}</div>}
                    {incident.properties?.to && <div style={{ fontSize: "11px", color: "#94a3b8" }}>To: {incident.properties.to}</div>}
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>Delay: {incident.properties?.delay ? `${Math.round(incident.properties.delay / 60)} mins` : "Unknown"}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {trafficIncidents.length > 0 && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px" }}>
          🟣 Showing {Math.min(trafficIncidents.length, 20)} live traffic incidents from TomTom
        </p>
      )}
    </div>
  );
}