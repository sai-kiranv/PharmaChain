import React, { useEffect, useState } from 'react';
import { Layers, Plus, Search, Edit2, Trash2, Eye, Building2, Calendar, AlertTriangle, Truck, Warehouse } from 'lucide-react';
import { api } from '../api/client';
import { Batch, Drug, Organization } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const BatchesPage: React.FC = () => {
  const { showToast } = useNotification();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deletingBatch, setDeletingBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    drug_id: '',
    mfg_date: '',
    exp_date: '',
    org_id: '',
    quantity: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const res = await api.getBatches({
        search,
        status: statusFilter,
        page,
        limit: 10
      });
      setBatches(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load batches from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [drugsRes, orgsRes] = await Promise.all([
        api.getDrugs({ limit: 100 }),
        api.getOrganizations({ limit: 100 })
      ]);
      setDrugs(drugsRes.data);
      setOrganizations(orgsRes.data);
    } catch (err: any) {
      console.error('Failed to load dropdown options:', err);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadBatches();
  }, [search, statusFilter, page]);

  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const twoYearsLater = new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setFormData({
      drug_id: drugs[0]?.DRUG_ID?.toString() || '',
      mfg_date: today,
      exp_date: twoYearsLater,
      org_id: organizations[0]?.ORG_ID?.toString() || '',
      quantity: '1000'
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setFormData({
      drug_id: batch.DRUG_ID.toString(),
      mfg_date: batch.MFG_DATE,
      exp_date: batch.EXP_DATE,
      org_id: batch.ORG_ID.toString(),
      quantity: batch.QUANTITY.toString()
    });
    setFormError(null);
  };

  const handleOpenView = async (batchId: number) => {
    try {
      const res = await api.getBatchById(batchId);
      setViewingBatch(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load batch history', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.drug_id || !formData.mfg_date || !formData.exp_date || !formData.org_id || !formData.quantity) {
      setFormError('All fields are required');
      return;
    }

    if (new Date(formData.exp_date) <= new Date(formData.mfg_date)) {
      setFormError('Expiration date must be strictly after the manufacturing date (Oracle check constraint)');
      return;
    }

    try {
      setSubmitting(true);
      await api.createBatch({
        drug_id: parseInt(formData.drug_id, 10),
        mfg_date: formData.mfg_date,
        exp_date: formData.exp_date,
        org_id: parseInt(formData.org_id, 10),
        quantity: parseInt(formData.quantity, 10)
      });
      showToast('Batch created and recorded in Oracle Database!');
      setIsAddOpen(false);
      loadBatches();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    if (new Date(formData.exp_date) <= new Date(formData.mfg_date)) {
      setFormError('Expiration date must be strictly after the manufacturing date (Oracle check constraint)');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateBatch(editingBatch.BATCH_ID, {
        drug_id: parseInt(formData.drug_id, 10),
        mfg_date: formData.mfg_date,
        exp_date: formData.exp_date,
        org_id: parseInt(formData.org_id, 10),
        quantity: parseInt(formData.quantity, 10)
      });
      showToast('Batch updated in Oracle Database!');
      setEditingBatch(null);
      loadBatches();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBatch) return;
    try {
      setSubmitting(true);
      await api.deleteBatch(deletingBatch.BATCH_ID);
      showToast('Batch removed from Oracle Database');
      setDeletingBatch(null);
      loadBatches();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete batch because custody or storage records reference it', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Layers size={26} color="#6366f1" />
            BATCH Relation Management
          </h1>
          <p className="page-description">
            Track pharmaceutical manufacturing lots, expiration timelines, and unit quantities
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Produce New Batch
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by batch ID, drug name, or manufacturer..."
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
          <option value="ACTIVE">Active (Valid)</option>
          <option value="EXPIRING_SOON">Expiring Soon (≤ 90d)</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching batches from Oracle...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="empty-state">
            <Layers className="empty-state-icon" />
            <h3>No Batches Found</h3>
            <p>No manufacturing lot records match your filter criteria.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Drug Name</th>
                <th>Manufacturer</th>
                <th>Mfg Date</th>
                <th>Exp Date</th>
                <th>Quantity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const statusBadge =
                  batch.STATUS === 'ACTIVE'
                    ? 'badge-emerald'
                    : batch.STATUS === 'EXPIRING_SOON'
                    ? 'badge-amber'
                    : 'badge-rose';

                return (
                  <tr key={batch.BATCH_ID}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>#{batch.BATCH_ID}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{batch.DRUG_NAME}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                        <Building2 size={13} color="#14b8a6" />
                        <span>{batch.MANUFACTURER_NAME}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{batch.MFG_DATE}</td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{batch.EXP_DATE}</td>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 600 }}>
                        {batch.QUANTITY.toLocaleString()} units
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge}`}>
                        {batch.STATUS}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenView(batch.BATCH_ID)}
                          title="View Journey & Allocations"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(batch)}
                          title="Edit Batch"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingBatch(batch)}
                          title="Delete Batch"
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

      {/* Add Batch Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record New Batch in Oracle">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16, display: 'flex', gap: 8 }}>
                <AlertTriangle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Drug Formulation <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.drug_id}
                onChange={(e) => setFormData({ ...formData, drug_id: e.target.value })}
                required
              >
                <option value="">-- Select Drug --</option>
                {drugs.map((d) => (
                  <option key={d.DRUG_ID} value={d.DRUG_ID}>
                    {d.DRUG_NAME} (#{d.DRUG_ID})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Manufacturer Organization <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.org_id}
                onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                required
              >
                <option value="">-- Select Manufacturer --</option>
                {organizations.map((org) => (
                  <option key={org.ORG_ID} value={org.ORG_ID}>
                    {org.NAME} ({org.ORG_TYPE})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  Manufacturing Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.mfg_date}
                  onChange={(e) => setFormData({ ...formData, mfg_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Expiration Date <span className="req">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.exp_date}
                  onChange={(e) => setFormData({ ...formData, exp_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Produced Quantity (Units) <span className="req">*</span>
              </label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Inserting Batch...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Batch Modal */}
      <Modal isOpen={!!editingBatch} onClose={() => setEditingBatch(null)} title="Update Batch Information">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Batch ID</label>
              <input type="text" className="form-control" value={`#${editingBatch?.BATCH_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Drug Formulation</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.drug_id}
                onChange={(e) => setFormData({ ...formData, drug_id: e.target.value })}
                required
              >
                {drugs.map((d) => (
                  <option key={d.DRUG_ID} value={d.DRUG_ID}>
                    {d.DRUG_NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturer Organization</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.org_id}
                onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                required
              >
                {organizations.map((org) => (
                  <option key={org.ORG_ID} value={org.ORG_ID}>
                    {org.NAME} ({org.ORG_TYPE})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Mfg Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.mfg_date}
                  onChange={(e) => setFormData({ ...formData, mfg_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Exp Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.exp_date}
                  onChange={(e) => setFormData({ ...formData, exp_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity (Units)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingBatch(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Batch Details Modal */}
      <Modal isOpen={!!viewingBatch} onClose={() => setViewingBatch(null)} title={`Batch #${viewingBatch?.BATCH_ID} Traceability`} maxWidth={700}>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Drug Name:</span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{viewingBatch?.DRUG_NAME}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Manufacturer:</span>
              <div style={{ fontWeight: 600 }}>{viewingBatch?.MANUFACTURER_NAME}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Production Dates:</span>
              <div>{viewingBatch?.MFG_DATE} → {viewingBatch?.EXP_DATE}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Output:</span>
              <div className="font-mono">{viewingBatch?.QUANTITY?.toLocaleString()} units</div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Warehouse size={16} color="#f59e0b" /> Warehouse Allocations (BATCH_STORAGE)
          </h4>
          {viewingBatch?.storageAllocations?.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>No warehouse inventory records assigned.</p>
          ) : (
            <div className="table-container" style={{ marginBottom: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th>City / State</th>
                    <th>Stored Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingBatch?.storageAllocations?.map((s: any) => (
                    <tr key={s.LOCATION_ID}>
                      <td>{s.LOCATION_NAME}</td>
                      <td>{s.CITY}, {s.STATE}</td>
                      <td className="font-mono">{s.STORED_QUANTITY} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Truck size={16} color="#06b6d4" /> Custody Transfers
          </h4>
          {viewingBatch?.transfers?.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No transfer logs recorded for this batch.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingBatch?.transfers?.map((t: any) => (
                    <tr key={t.TRANSFER_ID}>
                      <td className="font-mono">#{t.TRANSFER_ID}</td>
                      <td>{t.FROM_ORG_NAME}</td>
                      <td>{t.TO_ORG_NAME}</td>
                      <td>{t.TRANSFER_DATE}</td>
                      <td>
                        <span className={`badge ${t.STATUS === 'Completed' ? 'badge-emerald' : 'badge-amber'}`}>
                          {t.STATUS}
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
          <button className="btn btn-secondary" onClick={() => setViewingBatch(null)}>
            Close
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingBatch} onClose={() => setDeletingBatch(null)} title="Delete Batch" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete Batch <strong style={{ color: 'var(--text-primary)' }}>#{deletingBatch?.BATCH_ID}</strong> ({deletingBatch?.DRUG_NAME})?
          </p>
          <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#fb7185' }}>
            Foreign keys will prevent deletion if custody transfers, inventory storage, or verification logs exist for this batch.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingBatch(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete from Oracle'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
