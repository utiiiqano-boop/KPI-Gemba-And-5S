import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CustomCursor from "../CustomCursor";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dash-layout">
      <CustomCursor />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="dash-main">
        <Topbar />
        <main className="dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
