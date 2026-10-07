import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "../Logo";
import "./Sidebar.css";

const NAV_ITEMS = [
  {
    section: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: "grid" }],
  },
  {
    section: "5S",
    items: [
      { to: "/5s/import", label: "Import 5S Data", icon: "upload" },
      { to: "/5s/results", label: "5S Résultats", icon: "chart" },
      { to: "/5s/table", label: "5S Tableau", icon: "table" },
    ],
  },
  {
    section: "Gemba OJT",
    items: [
      { to: "/gemba/import", label: "Import Gemba OJT", icon: "upload" },
      { to: "/gemba/results", label: "Gemba Résultats", icon: "chart" },
      { to: "/gemba/table", label: "Gemba Tableau", icon: "table" },
    ],
  },
];

const ICONS = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
      <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 3v12" strokeLinecap="round" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v18h18" strokeLinecap="round" />
      <path d="M7 15l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18" />
    </svg>
  ),
};

export default function Sidebar({ collapsed, onToggle }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
      navigate("/login");
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  }

  const initials = (currentUser?.email || "U").charAt(0).toUpperCase();

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand-mark">
          <Logo size={40} />
        </div>
        {!collapsed && (
          <div className="brand-text">
            <div className="brand-title">KPI Gemba</div>
            <div className="brand-sub">& 5S Suite</div>
          </div>
        )}
      </div>

      <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((group) => (
          <div key={group.section} className="nav-group">
            {!collapsed && <div className="nav-section">{group.section}</div>}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                title={collapsed ? item.label : ""}
              >
                <span className="nav-icon">{ICONS[item.icon]}</span>
                {!collapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        {!collapsed && (
          <div className="user-info">
            <div className="user-email" title={currentUser?.email}>
              {currentUser?.email}
            </div>
            <button className="logout-link" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
