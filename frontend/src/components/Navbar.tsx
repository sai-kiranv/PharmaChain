import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Pill,
  LayoutDashboard,
  Users,
  Building2,
  Package,
  Layers,
  Warehouse,
  Boxes,
  Truck,
  ShieldCheck,
  FileCheck2,
  Table
} from 'lucide-react';
import { HealthBadge } from './HealthBadge';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => navigate('/')}>
        <div className="brand-icon">
          <Pill size={22} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="brand-title">PharmaChain</span>
            <span className="brand-subtitle">Oracle DBMS</span>
          </div>
        </div>
      </div>

      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/drugs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={16} />
          <span>Drugs</span>
        </NavLink>

        <NavLink to="/batches" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Layers size={16} />
          <span>Batches</span>
        </NavLink>

        <NavLink to="/organizations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Building2 size={16} />
          <span>Organizations</span>
        </NavLink>

        <NavLink to="/storage-locations" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Warehouse size={16} />
          <span>Warehouses</span>
        </NavLink>

        <NavLink to="/batch-storage" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Boxes size={16} />
          <span>Inventory</span>
        </NavLink>

        <NavLink to="/custody-transfers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Truck size={16} />
          <span>Transfers</span>
        </NavLink>

        <NavLink to="/compliance-checks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShieldCheck size={16} />
          <span>Compliance</span>
        </NavLink>

        <NavLink to="/verification-logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileCheck2 size={16} />
          <span>Verifications</span>
        </NavLink>

        <NavLink to="/consumers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={16} />
          <span>Consumers</span>
        </NavLink>

        <NavLink to="/schema" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Table size={16} />
          <span>Schema</span>
        </NavLink>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <HealthBadge />
      </div>
    </nav>
  );
};
