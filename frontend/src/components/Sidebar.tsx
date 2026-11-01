import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Pill,
  Box,
  Building2,
  MapPin,
  Truck,
  ShieldCheck,
  FileText,
  Users,
  Settings,
  Database,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useNotification();
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-pill">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="brand-svg-pill"
          >
            <rect
              x="3"
              y="7"
              width="18"
              height="10"
              rx="5"
              transform="rotate(-45 12 12)"
              fill="url(#pill-gradient)"
            />
            <path
              d="M7.757 7.757L16.243 16.243"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="pill-gradient" x1="3" y1="7" x2="21" y2="17" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#0ea5e9" />
                <stop offset="1" stopColor="#0284c7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span className="brand-name">PharmaChain</span>
      </div>

      {/* Main Navigation Menu */}
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Home size={19} className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/drugs"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Pill size={19} className="nav-icon" />
          <span>Medicines</span>
        </NavLink>

        <NavLink
          to="/batches"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Box size={19} className="nav-icon" />
          <span>Batches</span>
        </NavLink>

        <NavLink
          to="/organizations"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Building2 size={19} className="nav-icon" />
          <span>Organizations</span>
        </NavLink>

        <NavLink
          to="/storage-locations"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <MapPin size={19} className="nav-icon" />
          <span>Storage Locations</span>
        </NavLink>

        <NavLink
          to="/custody-transfers"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Truck size={19} className="nav-icon" />
          <span>Transfers</span>
        </NavLink>

        <NavLink
          to="/compliance-checks"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <ShieldCheck size={19} className="nav-icon" />
          <span>Compliance Checks</span>
        </NavLink>

        <NavLink
          to="/verification-logs"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={19} className="nav-icon" />
          <span>Verification Logs</span>
        </NavLink>

        <NavLink
          to="/consumers"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={19} className="nav-icon" />
          <span>Consumers</span>
        </NavLink>
      </nav>

      {/* Bottom Settings Navigation */}
      <div className="sidebar-footer">
        <NavLink
          to="/schema"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Database size={19} className="nav-icon" />
          <span>Schema Inspector</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={19} className="nav-icon" />
          <span>Settings</span>
        </NavLink>

        <button
          onClick={() => {
            logout();
            showToast('Signed out of Admin session', 'success');
            navigate('/login');
          }}
          className="sidebar-link sidebar-logout-btn"
          title="Sign out of Admin session"
        >
          <LogOut size={19} className="nav-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
