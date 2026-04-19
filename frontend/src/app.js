import React from "react";
import Home from "./pages/Home";
import AdminPortal from "./pages/AdminPortal";

function HackathonBanner() {
  return (
    <div style={{
      background: "linear-gradient(90deg, #1e1b4b, #312e81)",
      borderBottom: "1px solid rgba(99,102,241,0.4)",
      padding: "10px 20px",
      textAlign: "center",
      fontSize: "13px",
      color: "#c7d2fe",
      fontFamily: "Inter, sans-serif"
    }}>
      🏆 <strong style={{color: "#a5b4fc"}}>NIMBUS1000 Hackathon Project</strong> — Live AI features are currently unavailable (AWS backend expired).{" "}
      <a href="https://github.com/akashsgowda/roadsense" target="_blank" rel="noreferrer"
        style={{ color: "#818cf8", textDecoration: "underline" }}>
        View source on GitHub
      </a>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  return (
    <div>
      <HackathonBanner />
      {path === "/admin" ? <AdminPortal /> : <Home />}
    </div>
  );
}
