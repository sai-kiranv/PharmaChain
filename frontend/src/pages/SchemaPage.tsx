import React, { useEffect, useState } from 'react';
import { Table, Database, Key, Link as LinkIcon, CheckSquare, Search, RefreshCw, FileCode } from 'lucide-react';
import { api } from '../api/client';
import { TableSummary, ColumnDefinition, ConstraintDefinition } from '../types';
import { useNotification } from '../context/NotificationContext';

export const SchemaPage: React.FC = () => {
  const { showToast } = useNotification();
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('DRUGS');
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [constraints, setConstraints] = useState<ConstraintDefinition[]>([]);
  const [loadingTables, setLoadingTables] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      const res = await api.getSchemaTables();
      setTables(res.tables);
      if (res.tables.length > 0 && !res.tables.some((t) => t.table_name === selectedTable)) {
        setSelectedTable(res.tables[0].table_name);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to inspect Oracle data dictionary tables', 'error');
    } finally {
      setLoadingTables(false);
    }
  };

  const loadTableDetails = async (tableName: string) => {
    try {
      setLoadingDetails(true);
      const res = await api.getTableSchema(tableName);
      setColumns(res.columns);
      setConstraints(res.constraints);
    } catch (err: any) {
      showToast(err.message || `Failed to inspect columns for ${tableName}`, 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableDetails(selectedTable);
    }
  }, [selectedTable]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Database size={26} color="#0ea5e9" />
            Oracle Data Dictionary Inspector
          </h1>
          <p className="page-description">
            Live metadata introspection querying Oracle SYSTEM catalog views (user_tables, user_tab_columns, user_constraints)
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadTables} disabled={loadingTables}>
          <RefreshCw size={14} className={loadingTables ? 'spinner' : ''} />
          Refresh Schema
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Table List Sidebar */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Oracle Relations ({tables.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tables.map((t) => {
              const isSelected = t.table_name === selectedTable;
              return (
                <button
                  key={t.table_name}
                  onClick={() => setSelectedTable(t.table_name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    border: `1px solid ${isSelected ? 'rgba(14, 165, 233, 0.4)' : 'transparent'}`,
                    color: isSelected ? '#38bdf8' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Table size={16} color={isSelected ? '#38bdf8' : 'var(--text-muted)'} />
                    <span className="font-mono" style={{ fontSize: '0.85rem' }}>{t.table_name}</span>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.7rem',
                      background: isSelected ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#38bdf8' : 'var(--text-muted)'
                    }}
                  >
                    {t.row_count} rows
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Table Metadata */}
        <div>
          {/* Query Inspection Banner */}
          <div
            className="card"
            style={{
              marginBottom: 20,
              padding: 16,
              background: 'rgba(11, 17, 32, 0.6)',
              borderColor: 'rgba(14, 165, 233, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#38bdf8' }}>
              <FileCode size={16} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Executed Data Dictionary SQL Queries
              </span>
            </div>
            <pre className="font-mono" style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, overflowX: 'auto' }}>
              {`SELECT column_name, data_type, data_length, data_precision, data_scale, nullable
FROM user_tab_columns 
WHERE table_name = '${selectedTable}';`}
            </pre>
          </div>

          {/* Columns Table */}
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Table size={18} color="#0ea5e9" />
              Columns in <span className="font-mono" style={{ color: 'var(--primary)' }}>SYSTEM.{selectedTable}</span>
            </h3>

            {loadingDetails ? (
              <div className="loading-container">
                <div className="spinner" />
                <p>Reading column catalog...</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column Name</th>
                      <th>Data Type</th>
                      <th>Max Length</th>
                      <th>Precision / Scale</th>
                      <th>Nullable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col) => (
                      <tr key={col.COLUMN_NAME}>
                        <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {col.COLUMN_NAME}
                        </td>
                        <td>
                          <span className="badge badge-indigo font-mono">
                            {col.DATA_TYPE}
                          </span>
                        </td>
                        <td className="font-mono">{col.DATA_LENGTH} bytes</td>
                        <td className="font-mono">
                          {col.DATA_PRECISION !== null ? `${col.DATA_PRECISION}, ${col.DATA_SCALE || 0}` : '—'}
                        </td>
                        <td>
                          <span className={`badge ${col.NULLABLE === 'N' ? 'badge-amber' : 'badge-emerald'}`}>
                            {col.NULLABLE === 'N' ? 'NOT NULL' : 'NULLABLE'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Constraints Table */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="#f59e0b" />
              Integrity Constraints & Keys
            </h3>

            {constraints.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No explicit constraints registered for this relation.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Constraint Name</th>
                      <th>Type</th>
                      <th>Target Column</th>
                      <th>Condition / Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constraints.map((c, idx) => {
                      let typeLabel = 'Check';
                      let typeBadge = 'badge-cyan';

                      if (c.CONSTRAINT_TYPE === 'P') {
                        typeLabel = 'PRIMARY KEY';
                        typeBadge = 'badge-emerald';
                      } else if (c.CONSTRAINT_TYPE === 'R') {
                        typeLabel = 'FOREIGN KEY';
                        typeBadge = 'badge-indigo';
                      } else if (c.CONSTRAINT_TYPE === 'U') {
                        typeLabel = 'UNIQUE';
                        typeBadge = 'badge-amber';
                      }

                      return (
                        <tr key={`${c.CONSTRAINT_NAME}-${idx}`}>
                          <td className="font-mono" style={{ fontSize: '0.82rem' }}>{c.CONSTRAINT_NAME}</td>
                          <td>
                            <span className={`badge ${typeBadge}`}>
                              {typeLabel}
                            </span>
                          </td>
                          <td className="font-mono" style={{ fontWeight: 600 }}>{c.COLUMN_NAME}</td>
                          <td style={{ fontSize: '0.82rem' }}>
                            {c.CONSTRAINT_TYPE === 'R' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#818cf8' }}>
                                <LinkIcon size={13} />
                                <span>References: <strong>{c.REFERENCED_TABLE}</strong></span>
                              </div>
                            ) : c.SEARCH_CONDITION ? (
                              <code style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{c.SEARCH_CONDITION}</code>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
