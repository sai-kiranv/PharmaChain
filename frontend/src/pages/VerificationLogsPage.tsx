import React, { useEffect, useState } from 'react';
import { FileCheck2, Plus, Search, Edit2, Trash2, Users, Package, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { VerificationLog, Batch, Consumer } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const VerificationLogsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingLog, setEditingLog] = useState<VerificationLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<VerificationLog | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    batch_id: '',
    consumer_id: '',
    result: 'GENUINE'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getVerificationLogs({
        search,
        result: resultFilter,
        page,
        limit: 10
      });
      setLogs(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load verification logs from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [batchesRes, consumersRes] = await Promise.all([
        api.getBatches({ limit: 100 }),
        api.getConsumers({ limit: 100 })
      ]);
      setBatches(batchesRes.data);
      setConsumers(consumersRes.data);
    } catch (err: any) {
      console.error('Failed to load batches or consumers:', err);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [search, resultFilter, page]);

  const handleOpenAdd = () => {
    setFormData({
      batch_id: batches[0]?.BATCH_ID?.toString() || '',
      consumer_id: consumers[0]?.CONSUMER_ID?.toString() || '',
      result: 'GENUINE'
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (log: VerificationLog) => {
    setEditingLog(log);
    setFormData({
      batch_id: log.BATCH_ID.toString(),
      consumer_id: log.CONSUMER_ID.toString(),
      result: log.RESULT
    });
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch_id || !formData.consumer_id) {
      setFormError('Batch ID and Consumer ID are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createVerificationLog({
        batch_id: parseInt(formData.batch_id, 10),
        consumer_id: parseInt(formData.consumer_id, 10),
        result: formData.result
      });
      showToast('Product scan verification logged in Oracle Database!');
      setIsAddOpen(false);
      loadLogs();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    try {
      setSubmitting(true);
      await api.updateVerificationLog(editingLog.LOG_ID, {
        batch_id: parseInt(formData.batch_id, 10),
        consumer_id: parseInt(formData.consumer_id, 10),
        result: formData.result
      });
      showToast('Verification log updated in Oracle DB!');
      setEditingLog(null);
      loadLogs();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLog) return;
    try {
      setSubmitting(true);
      await api.deleteVerificationLog(deletingLog.LOG_ID);
      showToast('Verification log removed from Oracle');
      setDeletingLog(null);
      loadLogs();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete log', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileCheck2 size={26} color="#ec4899" />
            VERIFICATION_LOG Relation Management
          </h1>
          <p className="page-description">
            Consumer authentication scans recording product batch authenticity and expiration status
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Log Consumer Verification
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by drug name, consumer name, or verification result..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="select-input"
          value={resultFilter}
          onChange={(e) => {
            setResultFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Verification Results</option>
          <option value="GENUINE">GENUINE (Authentic)</option>
          <option value="SUSPICIOUS">SUSPICIOUS (Alert)</option>
          <option value="EXPIRED">EXPIRED</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching verification logs from Oracle...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <FileCheck2 className="empty-state-icon" />
            <h3>No Verification Logs Found</h3>
            <p>No consumer scan events match your query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Batch / Drug</th>
                <th>Consumer Name</th>
                <th>Contact</th>
                <th>Batch Exp Date</th>
                <th>Scan Timestamp</th>
                <th>Authenticity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isGenuine = log.RESULT === 'GENUINE';

                return (
                  <tr key={log.LOG_ID}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>#{log.LOG_ID}</td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700 }}>{log.DRUG_NAME}</span>
                        <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Batch #{log.BATCH_ID}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={14} color="#3b82f6" />
                        <span style={{ fontWeight: 600 }}>{log.CONSUMER_NAME}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.CONSUMER_CONTACT || '—'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{log.BATCH_EXP_DATE || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{log.SCAN_TIMESTAMP}</td>
                    <td>
                      <span className={`badge ${isGenuine ? 'badge-emerald' : 'badge-rose'}`}>
                        {isGenuine ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        {log.RESULT}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(log)}
                          title="Edit Log"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingLog(log)}
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={10}
          onPageChange={setPage}
        />
      </div>

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Product Verification Scan">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Scanned Drug Batch <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                required
              >
                <option value="">-- Select Batch --</option>
                {batches.map((b) => (
                  <option key={b.BATCH_ID} value={b.BATCH_ID}>
                    Batch #{b.BATCH_ID} - {b.DRUG_NAME} (Exp: {b.EXP_DATE})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Scanning Consumer <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.consumer_id}
                onChange={(e) => setFormData({ ...formData, consumer_id: e.target.value })}
                required
              >
                <option value="">-- Select Consumer --</option>
                {consumers.map((c) => (
                  <option key={c.CONSUMER_ID} value={c.CONSUMER_ID}>
                    {c.NAME} ({c.CONTACT || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Verification Result</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              >
                <option value="GENUINE">GENUINE (Verified Authentic)</option>
                <option value="SUSPICIOUS">SUSPICIOUS (Possible Counterfeit)</option>
                <option value="EXPIRED">EXPIRED (Past Expiry Date)</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Logging...' : 'Save Verification'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingLog} onClose={() => setEditingLog(null)} title="Update Verification Log">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Log ID</label>
              <input type="text" className="form-control" value={`#${editingLog?.LOG_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Batch</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                required
              >
                {batches.map((b) => (
                  <option key={b.BATCH_ID} value={b.BATCH_ID}>
                    Batch #{b.BATCH_ID} - {b.DRUG_NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Consumer</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.consumer_id}
                onChange={(e) => setFormData({ ...formData, consumer_id: e.target.value })}
                required
              >
                {consumers.map((c) => (
                  <option key={c.CONSUMER_ID} value={c.CONSUMER_ID}>
                    {c.NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Result</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              >
                <option value="GENUINE">GENUINE</option>
                <option value="SUSPICIOUS">SUSPICIOUS</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingLog(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingLog} onClose={() => setDeletingLog(null)} title="Delete Verification Log" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete scan record <strong style={{ color: 'var(--text-primary)' }}>#{deletingLog?.LOG_ID}</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingLog(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete from Oracle'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
