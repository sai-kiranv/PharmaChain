import React, { useEffect, useState } from 'react';
import { Database, Server, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { DbHealthResponse } from '../types';

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<DbHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = health?.status === 'UP' && health?.db_connected === 1;

  return (
    <>
      <div
        className={`health-badge ${isConnected ? 'up' : 'down'}`}
        onClick={() => setShowDetails(true)}
        title="Click to view Oracle Database Connection details"
      >
        <span className={`pulse-dot ${isConnected ? 'up' : 'down'}`} />
        <Database size={14} />
        <span>
          {loading && !health
            ? 'Checking DB...'
            : isConnected
            ? `Oracle Connected (${health?.latencyMs ?? 1}ms)`
            : 'Oracle Offline'}
        </span>
      </div>

      {showDetails && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Server size={20} color={isConnected ? '#10b981' : '#f43f5e'} />
                <h3 className="modal-title">Oracle Database Status</h3>
              </div>
              <button className="modal-close" onClick={() => setShowDetails(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                  <span style={{ fontWeight: 700, color: isConnected ? '#34d399' : '#fb7185', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isConnected ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {health?.status} ({isConnected ? 'SELECT 1 Successful' : 'Unavailable'})
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Connect String:</span>
                  <span className="font-mono" style={{ color: 'var(--primary)' }}>
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
                  <span>{health?.latencyMs !== undefined ? `${health.latencyMs} ms` : 'N/A'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Checked:</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>

                {health?.error && (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontSize: '0.85rem' }}>
                    <strong>Error:</strong> {health.error}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary btn-sm"
                onClick={fetchHealth}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? 'spinner' : ''} />
                Refresh Check
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
