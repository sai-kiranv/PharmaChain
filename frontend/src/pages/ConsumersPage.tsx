import React, { useEffect, useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Eye, Phone, FileCheck2 } from 'lucide-react';
import { api } from '../api/client';
import { Consumer } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const ConsumersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingConsumer, setEditingConsumer] = useState<Consumer | null>(null);
  const [deletingConsumer, setDeletingConsumer] = useState<Consumer | null>(null);
  const [viewingConsumer, setViewingConsumer] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contact: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadConsumers = async () => {
    try {
      setLoading(true);
      const res = await api.getConsumers({ search, page, limit: 10 });
      setConsumers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load consumers from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsumers();
  }, [search, page]);

  const handleOpenAdd = () => {
    setFormData({ name: '', contact: '' });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (c: Consumer) => {
    setEditingConsumer(c);
    setFormData({
      name: c.NAME,
      contact: c.CONTACT || ''
    });
    setFormError(null);
  };

  const handleOpenView = async (id: number) => {
    try {
      const res = await api.getConsumerById(id);
      setViewingConsumer(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load consumer history', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Consumer full name is required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createConsumer({
        name: formData.name,
        contact: formData.contact || undefined
      });
      showToast('Consumer registered in Oracle Database!');
      setIsAddOpen(false);
      loadConsumers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsumer) return;

    try {
      setSubmitting(true);
      await api.updateConsumer(editingConsumer.CONSUMER_ID, {
        name: formData.name,
        contact: formData.contact || undefined
      });
      showToast('Consumer updated successfully in Oracle DB!');
      setEditingConsumer(null);
      loadConsumers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingConsumer) return;
    try {
      setSubmitting(true);
      await api.deleteConsumer(deletingConsumer.CONSUMER_ID);
      showToast('Consumer deleted from Oracle');
      setDeletingConsumer(null);
      loadConsumers();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete consumer because scan logs reference this consumer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={26} color="#3b82f6" />
            CONSUMER Relation Management
          </h1>
          <p className="page-description">
            Registered patients and consumers performing drug authenticity scans
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Register Consumer
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by consumer name or phone number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching consumers from Oracle...</p>
          </div>
        ) : consumers.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <h3>No Consumers Found</h3>
            <p>No registered consumer records match your query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Consumer ID</th>
                <th>Patient / Consumer Name</th>
                <th>Phone Number</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consumers.map((c) => (
                <tr key={c.CONSUMER_ID}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>#{c.CONSUMER_ID}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.NAME}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color="#38bdf8" />
                      <span className="font-mono" style={{ fontSize: '0.85rem' }}>{c.CONTACT || '—'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenView(c.CONSUMER_ID)}
                        title="View Verification History"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Consumer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingConsumer(c)}
                        title="Delete Consumer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Consumer in Oracle DB">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Full Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact / Mobile Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., 9000000015"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Registering...' : 'Save Consumer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingConsumer} onClose={() => setEditingConsumer(null)} title="Update Consumer Information">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Consumer ID</label>
              <input type="text" className="form-control" value={`#${editingConsumer?.CONSUMER_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">
                Full Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingConsumer(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Scan History Modal */}
      <Modal isOpen={!!viewingConsumer} onClose={() => setViewingConsumer(null)} title={`${viewingConsumer?.NAME} Verification History`} maxWidth={600}>
        <div className="modal-body">
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Contact Phone:</span>
            <div className="font-mono">{viewingConsumer?.CONTACT || 'No phone recorded'}</div>
          </div>

          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileCheck2 size={16} color="#ec4899" /> Authentication Scans Logged
          </h4>
          {viewingConsumer?.verifications?.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No product scans recorded for this consumer.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Log ID</th>
                    <th>Batch</th>
                    <th>Drug Product</th>
                    <th>Scan Timestamp</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingConsumer?.verifications?.map((v: any) => (
                    <tr key={v.LOG_ID}>
                      <td className="font-mono">#{v.LOG_ID}</td>
                      <td className="font-mono">Batch #{v.BATCH_ID}</td>
                      <td style={{ fontWeight: 600 }}>{v.DRUG_NAME}</td>
                      <td style={{ fontSize: '0.82rem' }}>{v.SCAN_TIME}</td>
                      <td>
                        <span className={`badge ${v.RESULT === 'GENUINE' ? 'badge-emerald' : 'badge-rose'}`}>
                          {v.RESULT}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewingConsumer(null)}>Close</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingConsumer} onClose={() => setDeletingConsumer(null)} title="Delete Consumer" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete consumer record <strong style={{ color: 'var(--text-primary)' }}>{deletingConsumer?.NAME}</strong> (ID: #{deletingConsumer?.CONSUMER_ID})?
          </p>
          <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#fb7185' }}>
            Foreign key constraints will block deletion if this consumer has recorded product verification scans in VERIFICATION_LOG.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingConsumer(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete from Oracle'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
