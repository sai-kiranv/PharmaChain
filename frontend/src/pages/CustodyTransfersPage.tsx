import React, { useEffect, useState } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, Eye, Building2, MapPin, Calendar, ShieldCheck, User } from 'lucide-react';
import { api } from '../api/client';
import { CustodyTransfer, Batch, Organization } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const CustodyTransfersPage: React.FC = () => {
  const { showToast } = useNotification();
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingTransfer, setEditingTransfer] = useState<CustodyTransfer | null>(null);
  const [deletingTransfer, setDeletingTransfer] = useState<CustodyTransfer | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    batch_id: '',
    from_org_id: '',
    to_org_id: '',
    from_location: '',
    to_location: '',
    transfer_date: '',
    status: 'Initiated',
    initiated_by: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustodyTransfers({
        search,
        status: statusFilter,
        page,
        limit: 10
      });
      setTransfers(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load custody transfers from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [batchesRes, orgsRes] = await Promise.all([
        api.getBatches({ limit: 100 }),
        api.getOrganizations({ limit: 100 })
      ]);
      setBatches(batchesRes.data);
      setOrganizations(orgsRes.data);
    } catch (err: any) {
      console.error('Failed to load batches or organizations:', err);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadTransfers();
  }, [search, statusFilter, page]);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({
      batch_id: batches[0]?.BATCH_ID?.toString() || '',
      from_org_id: organizations[0]?.ORG_ID?.toString() || '',
      to_org_id: organizations[1]?.ORG_ID?.toString() || organizations[0]?.ORG_ID?.toString() || '',
      from_location: 'Central Manufacturing Warehouse',
      to_location: 'Regional Distribution Hub',
      transfer_date: today,
      status: 'Initiated',
      initiated_by: organizations[0]?.NAME || 'Supply Chain Admin'
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (t: CustodyTransfer) => {
    setEditingTransfer(t);
    setFormData({
      batch_id: t.BATCH_ID.toString(),
      from_org_id: t.FROM_ORG_ID.toString(),
      to_org_id: t.TO_ORG_ID.toString(),
      from_location: t.FROM_LOCATION || '',
      to_location: t.TO_LOCATION || '',
      transfer_date: t.TRANSFER_DATE,
      status: t.STATUS,
      initiated_by: t.INITIATED_BY || ''
    });
    setFormError(null);
  };

  const handleOpenView = async (id: number) => {
    try {
      const res = await api.getCustodyTransferById(id);
      setViewingTransfer(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load transfer details', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch_id || !formData.from_org_id || !formData.to_org_id) {
      setFormError('Batch ID, Sender, and Recipient organizations are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createCustodyTransfer({
        batch_id: parseInt(formData.batch_id, 10),
        from_org_id: parseInt(formData.from_org_id, 10),
        to_org_id: parseInt(formData.to_org_id, 10),
        from_location: formData.from_location || undefined,
        to_location: formData.to_location || undefined,
        transfer_date: formData.transfer_date || undefined,
        status: formData.status,
        initiated_by: formData.initiated_by || undefined
      });
      showToast('Custody transfer recorded in Oracle Database!');
      setIsAddOpen(false);
      loadTransfers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransfer) return;

    try {
      setSubmitting(true);
      await api.updateCustodyTransfer(editingTransfer.TRANSFER_ID, {
        batch_id: parseInt(formData.batch_id, 10),
        from_org_id: parseInt(formData.from_org_id, 10),
        to_org_id: parseInt(formData.to_org_id, 10),
        from_location: formData.from_location || undefined,
        to_location: formData.to_location || undefined,
        transfer_date: formData.transfer_date,
        status: formData.status,
        initiated_by: formData.initiated_by || undefined
      });
      showToast('Custody transfer updated successfully in Oracle DB!');
      setEditingTransfer(null);
      loadTransfers();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTransfer) return;
    try {
      setSubmitting(true);
      await api.deleteCustodyTransfer(deletingTransfer.TRANSFER_ID);
      showToast('Custody transfer record deleted from Oracle DB');
      setDeletingTransfer(null);
      loadTransfers();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete transfer because compliance audits reference it', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Truck size={26} color="#06b6d4" />
            CUSTODY_TRANSFER Relation Management
          </h1>
          <p className="page-description">
            Audit log of pharmaceutical batch handoffs between manufacturers, distributors, and dispensing pharmacies
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Initiate Custody Transfer
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by drug, sender org, receiver org, or agent..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="select-input"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="In Transit">In Transit</option>
          <option value="Initiated">Initiated</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching custody transfers from Oracle...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="empty-state">
            <Truck className="empty-state-icon" />
            <h3>No Transfers Found</h3>
            <p>No custody transfer records match your query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Transfer ID</th>
                <th>Batch / Drug</th>
                <th>From Entity</th>
                <th>To Entity</th>
                <th>Route</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => {
                const badgeColor =
                  t.STATUS === 'Completed'
                    ? 'badge-emerald'
                    : t.STATUS === 'In Transit'
                    ? 'badge-indigo'
                    : t.STATUS === 'Rejected'
                    ? 'badge-rose'
                    : 'badge-amber';

                return (
                  <tr key={t.TRANSFER_ID}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>#{t.TRANSFER_ID}</td>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700 }}>{t.DRUG_NAME}</span>
                        <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Batch #{t.BATCH_ID}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                        <Building2 size={13} color="#14b8a6" />
                        <span>{t.FROM_ORG_NAME}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                        <Building2 size={13} color="#0ea5e9" />
                        <span>{t.TO_ORG_NAME}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {t.FROM_LOCATION} → {t.TO_LOCATION}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{t.TRANSFER_DATE}</td>
                    <td>
                      <span className={`badge ${badgeColor}`}>
                        {t.STATUS}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenView(t.TRANSFER_ID)}
                          title="View Compliance Audits"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(t)}
                          title="Edit Transfer"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingTransfer(t)}
                          title="Delete Transfer"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Initiate Custody Transfer">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Batch to Transfer <span className="req">*</span>
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
                    Batch #{b.BATCH_ID} - {b.DRUG_NAME} ({b.QUANTITY} units)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  From Organization (Sender) <span className="req">*</span>
                </label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.from_org_id}
                  onChange={(e) => setFormData({ ...formData, from_org_id: e.target.value })}
                  required
                >
                  <option value="">-- Sender Org --</option>
                  {organizations.map((org) => (
                    <option key={org.ORG_ID} value={org.ORG_ID}>
                      {org.NAME} ({org.ORG_TYPE})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  To Organization (Recipient) <span className="req">*</span>
                </label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.to_org_id}
                  onChange={(e) => setFormData({ ...formData, to_org_id: e.target.value })}
                  required
                >
                  <option value="">-- Recipient Org --</option>
                  {organizations.map((org) => (
                    <option key={org.ORG_ID} value={org.ORG_ID}>
                      {org.NAME} ({org.ORG_TYPE})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Origin Facility Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Sun Pharma Warehouse A"
                  value={formData.from_location}
                  onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Facility Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Apollo Central Depot"
                  value={formData.to_location}
                  onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Transfer Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.transfer_date}
                  onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Initiated">Initiated</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Initiated By / Logistics Handler</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Blue Dart Cold Chain Fleet"
                value={formData.initiated_by}
                onChange={(e) => setFormData({ ...formData, initiated_by: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating Transfer...' : 'Initiate Transfer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingTransfer} onClose={() => setEditingTransfer(null)} title="Update Custody Transfer">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Transfer ID</label>
              <input type="text" className="form-control" value={`#${editingTransfer?.TRANSFER_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Initiated">Initiated</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">From Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.from_location}
                  onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">To Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.to_location}
                  onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Initiated By / Carrier</label>
              <input
                type="text"
                className="form-control"
                value={formData.initiated_by}
                onChange={(e) => setFormData({ ...formData, initiated_by: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingTransfer(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={!!viewingTransfer} onClose={() => setViewingTransfer(null)} title={`Transfer #${viewingTransfer?.TRANSFER_ID} Audit`} maxWidth={650}>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Product:</span>
              <div style={{ fontWeight: 700 }}>{viewingTransfer?.DRUG_NAME} (Batch #{viewingTransfer?.BATCH_ID})</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
              <div>
                <span className="badge badge-emerald">{viewingTransfer?.STATUS}</span>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sender:</span>
              <div>{viewingTransfer?.FROM_ORG_NAME} ({viewingTransfer?.FROM_LOCATION})</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recipient:</span>
              <div>{viewingTransfer?.TO_ORG_NAME} ({viewingTransfer?.TO_LOCATION})</div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="#10b981" /> Associated Compliance Audits (COMPLIANCE_CHECK)
          </h4>
          {viewingTransfer?.complianceChecks?.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No compliance inspection check recorded for this transfer.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Check ID</th>
                    <th>Audit Type</th>
                    <th>Temperature</th>
                    <th>License Valid</th>
                    <th>Audit Result</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingTransfer?.complianceChecks?.map((c: any) => (
                    <tr key={c.CHECK_ID}>
                      <td className="font-mono">#{c.CHECK_ID}</td>
                      <td>{c.CHECK_TYPE}</td>
                      <td className="font-mono">{c.TEMPERATURE !== null ? `${c.TEMPERATURE}°C` : 'N/A'}</td>
                      <td>{c.LICENSE_VALID || 'N/A'}</td>
                      <td>
                        <span className={`badge ${c.RESULT === 'PASS' ? 'badge-emerald' : 'badge-rose'}`}>
                          {c.RESULT}
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
          <button className="btn btn-secondary" onClick={() => setViewingTransfer(null)}>Close</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingTransfer} onClose={() => setDeletingTransfer(null)} title="Delete Custody Transfer" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete Transfer record <strong style={{ color: 'var(--text-primary)' }}>#{deletingTransfer?.TRANSFER_ID}</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingTransfer(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete from Oracle'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
