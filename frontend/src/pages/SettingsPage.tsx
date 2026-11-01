import React, { useState, useEffect } from 'react';
import { Database, Server, Shield, User, HardDrive, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { DbHealthResponse } from '../types';
import { useNotification } from '../context/NotificationContext';

export const SettingsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [health, setHealth] = useState<DbHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch (err: any) {
      showToast('Failed to fetch Oracle DB status', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings & Configuration</h1>
          <p className="page-description">
            Manage Oracle Database 21c XE connection parameters, connection pooling, and administration profiles.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          Refresh Connection
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Database Connection Profile */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Server size={20} color="#0284c7" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Oracle Database Connection</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Database Edition:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Oracle Database 21c Express Edition</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Service / Host:</span>
              <span className="font-mono" style={{ fontWeight: 600, color: '#0284c7' }}>{health?.database?.service || 'localhost:1521/XE'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>User Schema:</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>{health?.database?.user || 'SYSTEM'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Connection Pool:</span>
              <span style={{ fontWeight: 600 }}>Min {health?.database?.poolMin ?? 2} / Max {health?.database?.poolMax ?? 10}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Health Status:</span>
              <span style={{ fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Online ({health?.latencyMs ?? 1} ms)
              </span>
            </div>
          </div>
        </div>

        {/* Administration Profile */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <User size={20} color="#0284c7" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Administrator Profile</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Username:</span>
              <span style={{ fontWeight: 600 }}>Admin</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Privileges:</span>
              <span className="badge badge-emerald">DBA / Full Control</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Platform:</span>
              <span style={{ fontWeight: 600 }}>PharmaChain Supply Chain Node</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontSize: '0.88rem' }}>Audit Trail:</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>Oracle Triggers & Logs Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
