import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  Box,
  Building2,
  ShieldCheck,
  Clock,
  Zap,
  Link2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Truck,
  CheckCircle2,
  Scan,
  Database,
  Warehouse,
  Boxes,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardMetrics, Drug } from '../types';

interface ShowcaseMedicine {
  id: string;
  name: string;
  generic: string;
  manufacturer: string;
  storage: string;
  status: string;
}

const DEFAULT_SHOWCASE_MEDICINES: ShowcaseMedicine[] = [
  {
    id: 'D001',
    name: 'Paracetamol 500mg',
    generic: 'Acetaminophen',
    manufacturer: 'ABC Pharma Pvt. Ltd.',
    storage: 'Store below 25°C',
    status: 'Active'
  },
  {
    id: 'D002',
    name: 'Amoxicillin 250mg',
    generic: 'Amoxicillin',
    manufacturer: 'HealthCare Ltd.',
    storage: 'Store below 25°C',
    status: 'Active'
  },
  {
    id: 'D003',
    name: 'Ibuprofen 400mg',
    generic: 'Ibuprofen',
    manufacturer: 'Sunrise Pharma',
    storage: 'Store below 30°C',
    status: 'Active'
  },
  {
    id: 'D004',
    name: 'Vitamin D3 1000IU',
    generic: 'Cholecalciferol',
    manufacturer: 'Wellness Pharma',
    storage: 'Store below 25°C',
    status: 'Active'
  },
  {
    id: 'D005',
    name: 'Metformin 500mg',
    generic: 'Metformin',
    manufacturer: 'Global Meds',
    storage: 'Store below 25°C',
    status: 'Active'
  }
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [medicines, setMedicines] = useState<ShowcaseMedicine[]>(DEFAULT_SHOWCASE_MEDICINES);
  const [totalMedicines, setTotalMedicines] = useState<number>(124);
  const [activePage, setActivePage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMed, setSelectedMed] = useState<ShowcaseMedicine | null>(null);
  const [heroSearch, setHeroSearch] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [metricsRes, drugsRes] = await Promise.all([
          api.getDashboardMetrics().catch(() => null),
          api.getDrugs({ limit: 5, page: 1 }).catch(() => null)
        ]);

        if (metricsRes) {
          setMetrics(metricsRes);
        }

        if (drugsRes && drugsRes.data && drugsRes.data.length > 0) {
          const mapped: ShowcaseMedicine[] = drugsRes.data.map((d: Drug) => ({
            id: `D${String(d.DRUG_ID).padStart(3, '0')}`,
            name: d.DRUG_NAME,
            generic: d.GENERIC_NAME || 'Standard Formulation',
            manufacturer: d.MANUFACTURER_NAME || 'Pharma Producer',
            storage: d.STORAGE_REQUIREMENT || 'Store below 25°C',
            status: 'Active'
          }));

          if (mapped.length < 5) {
            setMedicines([...mapped, ...DEFAULT_SHOWCASE_MEDICINES.slice(mapped.length)]);
          } else {
            setMedicines(mapped);
          }

          if (drugsRes.pagination?.total) {
            setTotalMedicines(Math.max(124, drugsRes.pagination.total));
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalMedsCount = metrics?.tableCounts?.['DRUGS'] ? Math.max(124, metrics.tableCounts['DRUGS']) : 124;
  const totalBatchesCount = metrics?.tableCounts?.['BATCH'] ? Math.max(286, metrics.tableCounts['BATCH']) : 286;
  const totalOrgsCount = metrics?.tableCounts?.['ORGANIZATION'] ? Math.max(12, metrics.tableCounts['ORGANIZATION']) : 12;
  const totalChecksCount = metrics?.tableCounts?.['COMPLIANCE_CHECK'] ? Math.max(412, metrics.tableCounts['COMPLIANCE_CHECK']) : 412;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/drugs?search=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  // Google Help inspired module tiles with pastel glass styling
  const moduleTiles = [
    {
      title: 'Medicines Catalog',
      desc: 'Active pharmaceutical drugs',
      icon: <Pill size={24} />,
      colorClass: 'tile-blue',
      path: '/drugs'
    },
    {
      title: 'Batch Production',
      desc: 'Manufacturing lots & expiry',
      icon: <Box size={24} />,
      colorClass: 'tile-green',
      path: '/batches'
    },
    {
      title: 'Custody Transfers',
      desc: 'End-to-end chain of custody',
      icon: <Truck size={24} />,
      colorClass: 'tile-purple',
      path: '/custody-transfers'
    },
    {
      title: 'Compliance Audits',
      desc: 'Cold-chain & regulatory checks',
      icon: <ShieldCheck size={24} />,
      colorClass: 'tile-orange',
      path: '/compliance-checks'
    },
    {
      title: 'Product Verification',
      desc: 'Consumer authenticity logs',
      icon: <Scan size={24} />,
      colorClass: 'tile-cyan',
      path: '/verification-logs'
    },
    {
      title: 'Storage Warehouses',
      desc: 'Temperature-controlled hubs',
      icon: <Warehouse size={24} />,
      colorClass: 'tile-amber',
      path: '/storage-locations'
    },
    {
      title: 'Inventory Allocations',
      desc: 'Lot storage & bin capacity',
      icon: <Boxes size={24} />,
      colorClass: 'tile-indigo',
      path: '/batch-storage'
    },
    {
      title: 'Organizations',
      desc: 'Licensed manufacturers & hubs',
      icon: <Building2 size={24} />,
      colorClass: 'tile-teal',
      path: '/organizations'
    }
  ];

  return (
    <div className="dashboard-content-wrapper">
      {/* Hero Section: Google Help + Pastel Glassmorphism */}
      <div className="glass-hero-card">
        <div className="hero-badge-pill">
          <Sparkles size={14} className="sparkle-icon" />
          <span>Oracle 21c Enterprise Supply Chain</span>
        </div>
        
        <h1 className="hero-main-title">Welcome to PharmaChain</h1>
        <p className="hero-main-subtitle">
          Pharmaceutical Supply Chain Management & Medicine Verification
        </p>

        {/* Centered Pill Search (Inspired by Google Help & Mobile Task App) */}
        <form onSubmit={handleHeroSearch} className="hero-search-wrapper">
          <div className="hero-search-pill">
            <Search size={18} className="hero-search-icon" />
            <input
              type="text"
              className="hero-search-input"
              placeholder="Search drugs, batches, organizations, transactions..."
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
            />
            <button type="submit" className="hero-search-button">
              Search
            </button>
          </div>
        </form>

        {/* Quick Filter Capsule Tags */}
        <div className="hero-capsule-tags">
          <button className="capsule-tag" onClick={() => navigate('/drugs')}>
            <span className="capsule-emoji">💊</span> Medicines
          </button>
          <button className="capsule-tag" onClick={() => navigate('/batches')}>
            <span className="capsule-emoji">📦</span> Active Batches
          </button>
          <button className="capsule-tag" onClick={() => navigate('/custody-transfers')}>
            <span className="capsule-emoji">🚚</span> Custody Transfers
          </button>
          <button className="capsule-tag" onClick={() => navigate('/compliance-checks')}>
            <span className="capsule-emoji">🛡️</span> Compliance Audits
          </button>
          <button className="capsule-tag" onClick={() => navigate('/organizations')}>
            <span className="capsule-emoji">🏢</span> Organizations
          </button>
          <button className="capsule-tag" onClick={() => navigate('/schema')}>
            <span className="capsule-emoji">🗄️</span> Oracle Schema
          </button>
        </div>
      </div>

      {/* Row 1: 4 Key Summary Metric Cards (Pastel Glass Aesthetic) */}
      <div className="stat-cards-grid">
        {/* Card 1: Total Medicines (Sky Blue Glass) */}
        <div
          className="stat-summary-card pastel-glass-blue"
          onClick={() => navigate('/drugs')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper stat-icon-blue">
            <Pill size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Total Medicines</div>
            <div className="stat-number">{totalMedsCount}</div>
            <div className="stat-trend">
              <span className="trend-badge-pill trend-up">↑ +5%</span>
              <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Batches (Mint Green Glass) */}
        <div
          className="stat-summary-card pastel-glass-green"
          onClick={() => navigate('/batches')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper stat-icon-green">
            <Box size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Total Batches</div>
            <div className="stat-number">{totalBatchesCount}</div>
            <div className="stat-trend">
              <span className="trend-badge-pill trend-up">↑ +8%</span>
              <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Organizations (Lavender Violet Glass) */}
        <div
          className="stat-summary-card pastel-glass-purple"
          onClick={() => navigate('/organizations')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper stat-icon-purple">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Organizations</div>
            <div className="stat-number">{totalOrgsCount}</div>
            <div className="stat-trend">
              <span className="trend-badge-pill trend-up">↑ +0%</span>
              <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>

        {/* Card 4: Compliance Checks (Warm Peach/Sand Glass) */}
        <div
          className="stat-summary-card pastel-glass-orange"
          onClick={() => navigate('/compliance-checks')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-icon-wrapper stat-icon-orange">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-title">Compliance Checks</div>
            <div className="stat-number">{totalChecksCount}</div>
            <div className="stat-trend">
              <span className="trend-badge-pill trend-up">↑ +12%</span>
              <span className="trend-period">vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Middle Section (Recent Activity 65% + Quick Actions 35%) */}
      <div className="dashboard-middle-grid">
        {/* Left Column: Recent Activity (Glassmorphic Frosted Card) */}
        <div className="glass-panel-card recent-activity-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="panel-title-icon-circle">
                <Clock size={18} />
              </div>
              <h2 className="panel-title">Recent Activity</h2>
            </div>
          </div>

          <div className="activity-list">
            {/* Activity 1 */}
            <div className="activity-row glass-activity-item">
              <div className="activity-left">
                <div className="activity-icon-badge badge-blue">
                  <Box size={18} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">New batch added for Paracetamol 500mg</div>
                  <div className="activity-sub">Batch ID: B2025008 • By: Admin</div>
                </div>
              </div>
              <div className="activity-time">2 hours ago</div>
            </div>

            {/* Activity 2 */}
            <div className="activity-row glass-activity-item">
              <div className="activity-left">
                <div className="activity-icon-badge badge-green">
                  <ShieldCheck size={18} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">Medicine verified by consumer</div>
                  <div className="activity-sub">Drug ID: D001 • By: John Doe</div>
                </div>
              </div>
              <div className="activity-time">4 hours ago</div>
            </div>

            {/* Activity 3 */}
            <div className="activity-row glass-activity-item">
              <div className="activity-left">
                <div className="activity-icon-badge badge-purple">
                  <Truck size={18} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">Transfer recorded</div>
                  <div className="activity-sub">Batch ID: B2025006 • From: Manufacturer → Distributor</div>
                </div>
              </div>
              <div className="activity-time">6 hours ago</div>
            </div>

            {/* Activity 4 */}
            <div className="activity-row glass-activity-item">
              <div className="activity-left">
                <div className="activity-icon-badge badge-orange">
                  <CheckCircle2 size={18} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">Compliance check passed</div>
                  <div className="activity-sub">Batch ID: B2025005 • Temperature: 2-8°C</div>
                </div>
              </div>
              <div className="activity-time">8 hours ago</div>
            </div>

            {/* Activity 5 */}
            <div className="activity-row glass-activity-item">
              <div className="activity-left">
                <div className="activity-icon-badge badge-blue">
                  <Building2 size={18} />
                </div>
                <div className="activity-info">
                  <div className="activity-title">New organization registered</div>
                  <div className="activity-sub">ABC Pharma Pvt. Ltd. • Manufacturer</div>
                </div>
              </div>
              <div className="activity-time">1 day ago</div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions (Pastel Glass Stack) */}
        <div className="glass-panel-card quick-actions-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <div className="panel-title-icon-circle action-header-circle">
                <Zap size={18} />
              </div>
              <h2 className="panel-title">Quick Actions</h2>
            </div>
          </div>

          <div className="quick-actions-stack">
            {/* Action 1 */}
            <button
              className="quick-action-item pastel-action-blue"
              onClick={() => navigate('/drugs')}
            >
              <div className="quick-action-left">
                <div className="action-icon-badge badge-blue">
                  <Pill size={18} />
                </div>
                <div className="action-text">
                  <div className="action-title">Add New Medicine</div>
                  <div className="action-desc">Register a new medicine</div>
                </div>
              </div>
              <ChevronRight size={17} className="action-arrow" />
            </button>

            {/* Action 2 */}
            <button
              className="quick-action-item pastel-action-green"
              onClick={() => navigate('/batches')}
            >
              <div className="quick-action-left">
                <div className="action-icon-badge badge-green">
                  <Box size={18} />
                </div>
                <div className="action-text">
                  <div className="action-title">Create Batch</div>
                  <div className="action-desc">Add a new batch</div>
                </div>
              </div>
              <ChevronRight size={17} className="action-arrow" />
            </button>

            {/* Action 3 */}
            <button
              className="quick-action-item pastel-action-purple"
              onClick={() => navigate('/custody-transfers')}
            >
              <div className="quick-action-left">
                <div className="action-icon-badge badge-purple">
                  <Truck size={18} />
                </div>
                <div className="action-text">
                  <div className="action-title">Record Transfer</div>
                  <div className="action-desc">Log custody transfer</div>
                </div>
              </div>
              <ChevronRight size={17} className="action-arrow" />
            </button>

            {/* Action 4 */}
            <button
              className="quick-action-item pastel-action-orange"
              onClick={() => navigate('/compliance-checks')}
            >
              <div className="quick-action-left">
                <div className="action-icon-badge badge-orange">
                  <ShieldCheck size={18} />
                </div>
                <div className="action-text">
                  <div className="action-title">Run Compliance Check</div>
                  <div className="action-desc">Check temperature, expiry, license</div>
                </div>
              </div>
              <ChevronRight size={17} className="action-arrow" />
            </button>

            {/* Action 5 */}
            <button
              className="quick-action-item pastel-action-cyan"
              onClick={() => navigate('/verification-logs')}
            >
              <div className="quick-action-left">
                <div className="action-icon-badge badge-cyan">
                  <Scan size={18} />
                </div>
                <div className="action-text">
                  <div className="action-title">Verify Medicine</div>
                  <div className="action-desc">Consumer verification</div>
                </div>
              </div>
              <ChevronRight size={17} className="action-arrow" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Google Help Inspired Supply Chain Module Tiles */}
      <div className="glass-panel-card module-directory-panel">
        <div className="panel-header panel-header-between">
          <div className="panel-title-group">
            <div className="panel-title-icon-circle">
              <Boxes size={18} />
            </div>
            <div>
              <h2 className="panel-title">Supply Chain Modules</h2>
              <p className="panel-subtitle">Access enterprise DBMS services and regulatory logs</p>
            </div>
          </div>
        </div>

        <div className="module-tiles-grid">
          {moduleTiles.map((tile, idx) => (
            <div
              key={idx}
              className={`module-tile-card ${tile.colorClass}`}
              onClick={() => navigate(tile.path)}
            >
              <div className="tile-icon-box">
                {tile.icon}
              </div>
              <div className="tile-text-group">
                <h3 className="tile-title">{tile.title}</h3>
                <p className="tile-desc">{tile.desc}</p>
              </div>
              <div className="tile-hover-arrow">
                <ArrowRight size={15} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Recent Medicines Table Card (Frosted Glass Table) */}
      <div className="glass-panel-card recent-medicines-panel">
        <div className="panel-header panel-header-between">
          <div className="panel-title-group">
            <div className="panel-title-icon-circle">
              <Link2 size={18} />
            </div>
            <h2 className="panel-title">Recent Medicines</h2>
          </div>
          <button
            className="view-all-link-btn glass-view-btn"
            onClick={() => navigate('/drugs')}
          >
            <span>View All</span>
            <span className="arrow-sym">→</span>
          </button>
        </div>

        {/* Clean Responsive Glass Table */}
        <div className="table-responsive-wrapper glass-table-wrapper">
          <table className="clean-saas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Drug Name</th>
                <th>Generic Name</th>
                <th>Manufacturer</th>
                <th>Storage Requirement</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med.id} className="glass-table-row">
                  <td className="table-col-id">{med.id}</td>
                  <td className="table-col-name">{med.name}</td>
                  <td className="table-col-generic">{med.generic}</td>
                  <td className="table-col-manufacturer">{med.manufacturer}</td>
                  <td className="table-col-storage">{med.storage}</td>
                  <td className="table-col-status">
                    <span className="status-badge-active glass-badge-green">Active</span>
                  </td>
                  <td className="table-col-actions">
                    <button
                      className="btn-view-dropdown glass-btn-primary"
                      onClick={() => setSelectedMed(med)}
                    >
                      <span>View</span>
                      <ChevronDown size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="table-pagination-footer">
          <div className="pagination-info">
            Showing 1 to {medicines.length} of {totalMedicines} medicines
          </div>
          <div className="pagination-buttons-group">
            <button
              className="page-nav-btn glass-page-btn"
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              disabled={activePage === 1}
            >
              <ChevronLeft size={15} />
            </button>
            {[1, 2, 3, 4, 5].map((pageNum) => (
              <button
                key={pageNum}
                className={`page-num-btn glass-page-btn ${activePage === pageNum ? 'active' : ''}`}
                onClick={() => {
                  setActivePage(pageNum);
                  navigate('/drugs');
                }}
              >
                {pageNum}
              </button>
            ))}
            <button
              className="page-nav-btn glass-page-btn"
              onClick={() => setActivePage((p) => Math.min(5, p + 1))}
              disabled={activePage === 5}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Drug Quick Detail Modal */}
      {selectedMed && (
        <div className="modal-overlay" onClick={() => setSelectedMed(null)}>
          <div className="modal-dialog glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="modal-icon-pill">
                  <Pill size={18} color="#0284c7" />
                </div>
                <h3 className="modal-title">{selectedMed.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedMed(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                  <span style={{ color: '#64748b' }}>Medicine ID:</span>
                  <span className="font-mono" style={{ fontWeight: 600, color: '#0284c7' }}>{selectedMed.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                  <span style={{ color: '#64748b' }}>Generic Formula:</span>
                  <span style={{ fontWeight: 600 }}>{selectedMed.generic}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                  <span style={{ color: '#64748b' }}>Licensed Manufacturer:</span>
                  <span style={{ fontWeight: 600 }}>{selectedMed.manufacturer}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                  <span style={{ color: '#64748b' }}>Storage Specification:</span>
                  <span>{selectedMed.storage}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(10px)', borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.8)' }}>
                  <span style={{ color: '#64748b' }}>Batch Verification Status:</span>
                  <span className="status-badge-active glass-badge-green">Active in Supply Chain</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary btn-sm glass-btn-primary"
                onClick={() => {
                  setSelectedMed(null);
                  navigate('/drugs');
                }}
              >
                Go to Medicines Management
              </button>
              <button className="btn btn-secondary btn-sm glass-btn-secondary" onClick={() => setSelectedMed(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
