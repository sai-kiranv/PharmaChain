import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ChevronDown,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
  RefreshCw,
  Settings,
  Search,
  SlidersHorizontal,
  ExternalLink,
  LogOut
} from 'lucide-react';
import { api } from '../api/client';
import { DbHealthResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useNotification();
  const [health, setHealth] = useState<DbHealthResponse | null>(null);
  const [loadingHealth, setLoadingHealth] = useState<boolean>(true);
  const [showHealthModal, setShowHealthModal] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: any) {
      setHealth({
        status: 'DOWN',
        db_connected: 0,
        message: 'Backend server unreachable',
        timestamp: new Date().toISOString(),
        error: err.message
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 25000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/drugs?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isConnected = health?.status === 'UP' && health?.db_connected === 1;

  return (
    <header className="app-header glass-header">
      {/* Search Bar - Inspired by Google Help & Pastel Mobile UI */}
      <div className="header-search-container">
        <form onSubmit={handleSearchSubmit} className="glass-search-pill">
          <Search size={16} className="search-pill-icon" />
          <input
            type="text"
            className="search-pill-input"
            placeholder="Search medicines, batch serials, organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="search-pill-shortcut" title="Press Enter to search">
            <span>⌘K</span>
          </button>
        </form>
      </div>

      {/* Right side: Glass pills for Database Status and User Profile */}
      <div className="header-right">
        {/* Floating Glass Status Pill */}
        <div
          className="glass-pill-badge db-status-indicator"
          onClick={() => setShowHealthModal(true)}
          title="Click to view Oracle Database Connection Details"
        >
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="status-label">
            {isConnected ? 'Database Connected' : 'Database Offline'}
          </span>
        </div>

        {/* Floating Glass Profile Pill */}
        <div className="user-profile-menu" ref={dropdownRef}>
          <button
            className="glass-pill-badge user-profile-trigger"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-expanded={showUserDropdown}
          >
            <div className="user-avatar-circle">
              <User size={16} strokeWidth={2.4} />
            </div>
            <span className="user-name">{user?.name || 'Admin'}</span>
            <ChevronDown size={14} className={`chevron-icon ${showUserDropdown ? 'rotate' : ''}`} />
          </button>

          {showUserDropdown && (
            <div className="glass-card user-dropdown-card">
              <div className="user-dropdown-header">
                <p className="user-display-name">{user?.name ? `${user.name} Administrator` : 'Admin Administrator'}</p>
                <p className="user-role-badge">{user?.privilege || 'Oracle DBA • SYSTEM'}</p>
              </div>
              <div className="user-dropdown-divider" />
              <button
                className="user-dropdown-item"
                onClick={() => {
                  setShowUserDropdown(false);
                  setShowHealthModal(true);
                }}
              >
                <Server size={15} />
                <span>Oracle DB Status</span>
              </button>
              <button
                className="user-dropdown-item"
                onClick={() => {
                  setShowUserDropdown(false);
                  navigate('/schema');
                }}
              >
                <Database size={15} />
                <span>Schema Inspector</span>
              </button>
              <button
                className="user-dropdown-item"
                onClick={() => {
                  setShowUserDropdown(false);
                  navigate('/settings');
                }}
              >
                <Settings size={15} />
                <span>System Settings</span>
              </button>
              <div className="user-dropdown-divider" />
              <button
                className="user-dropdown-item user-dropdown-logout"
                onClick={() => {
                  setShowUserDropdown(false);
                  logout();
                  showToast('Signed out of Admin session', 'success');
                  navigate('/login');
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
              <div className="user-dropdown-divider" />
              <div className="user-dropdown-footer">
                <span>PharmaChain v1.0 • Oracle 21c</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Oracle DB Health Modal */}
      {showHealthModal && (
        <div className="modal-overlay" onClick={() => setShowHealthModal(false)}>
          <div className="modal-dialog glass-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Server size={20} color={isConnected ? '#10b981' : '#f43f5e'} />
                <h3 className="modal-title">Oracle Database Status</h3>
              </div>
              <button className="modal-close" onClick={() => setShowHealthModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                  <span style={{ fontWeight: 700, color: isConnected ? '#16a34a' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isConnected ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {isConnected ? 'Connected & Healthy' : 'Disconnected'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Service / TNS:</span>
                  <span className="font-mono" style={{ color: '#0284c7', fontWeight: 600 }}>
                    {health?.database?.service || 'localhost:1521/XE'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Database User:</span>
                  <span className="font-mono">{health?.database?.user || 'SYSTEM'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Connection Pool:</span>
                  <span>Min: {health?.database?.poolMin ?? 2} | Max: {health?.database?.poolMax ?? 10}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Query Latency:</span>
                  <span style={{ fontWeight: 600 }}>{health?.latencyMs !== undefined ? `${health.latencyMs} ms` : '1 ms'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Checked:</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>

                {health?.error && (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', fontSize: '0.85rem' }}>
                    <strong>Error:</strong> {health.error}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary btn-sm"
                onClick={fetchHealth}
                disabled={loadingHealth}
              >
                <RefreshCw size={14} className={loadingHealth ? 'spinner' : ''} />
                Refresh Check
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowHealthModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
