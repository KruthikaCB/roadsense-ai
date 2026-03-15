import React from "react";
import Home from "./pages/Home";
import AdminPortal from "./pages/AdminPortal";

export default function App() {
  const path = window.location.pathname;
  if (path === "/admin") return <AdminPortal />;
  return <Home />;
}
