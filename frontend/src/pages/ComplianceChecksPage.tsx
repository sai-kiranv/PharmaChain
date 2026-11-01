import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Search, Edit2, Trash2, CheckCircle2, AlertTriangle, Thermometer, Truck } from 'lucide-react';
import { api } from '../api/client';
import { ComplianceCheck, CustodyTransfer } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const ComplianceChecksPage: React.FC = () => {
  const { showToast } = useNotification();
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingCheck, setEditingCheck] = useState<ComplianceCheck | null>(null);
  const [deletingCheck, setDeletingCheck] = useState<ComplianceCheck | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    transfer_id: '',
    check_type: 'Cold Chain',
    temperature: '4.5',
    expiry_check: 'VALID',
    license_valid: 'YES' as 'YES' | 'NO',
    result: 'PASS'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadChecks = async () => {
    try {
      setLoading(true);
      const res = await api.getComplianceChecks({
        search,
        result: resultFilter,
        page,
        limit: 10
      });
      setChecks(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load compliance checks from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await api.getCustodyTransfers({ limit: 100 });
      setTransfers(res.data);
    } catch (err: any) {
      console.error('Failed to load transfers for dropdown:', err);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  useEffect(() => {
    loadChecks();
  }, [search, resultFilter, page]);

  const handleOpenAdd = () => {
    setFormData({
      transfer_id: transfers[0]?.TRANSFER_ID?.toString() || '',
      check_type: 'Cold Chain',
      temperature: '4.5',
      expiry_check: 'VALID',
      license_valid: 'YES',
      result: 'PASS'
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (check: ComplianceCheck) => {
    setEditingCheck(check);
    setFormData({
      transfer_id: check.TRANSFER_ID.toString(),
      check_type: check.CHECK_TYPE || 'Temperature',
      temperature: check.TEMPERATURE !== null ? check.TEMPERATURE.toString() : '',
      expiry_check: check.EXPIRY_CHECK || 'VALID',
      license_valid: check.LICENSE_VALID || 'YES',
      result: check.RESULT
    });
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.transfer_id) {
      setFormError('Custody Transfer ID is required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createComplianceCheck({
        transfer_id: parseInt(formData.transfer_id, 10),
        check_type: formData.check_type || undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        expiry_check: formData.expiry_check || undefined,
        license_valid: formData.license_valid,
        result: formData.result
      });
      showToast('Compliance audit recorded in Oracle Database!');
      setIsAddOpen(false);
      loadChecks();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheck) return;

    try {
      setSubmitting(true);
      await api.updateComplianceCheck(editingCheck.CHECK_ID, {
        transfer_id: parseInt(formData.transfer_id, 10),
        check_type: formData.check_type || undefined,
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        expiry_check: formData.expiry_check || undefined,
        license_valid: formData.license_valid,
        result: formData.result
      });
      showToast('Compliance check updated in Oracle!');
      setEditingCheck(null);
      loadChecks();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCheck) return;
    try {
      setSubmitting(true);
      await api.deleteComplianceCheck(deletingCheck.CHECK_ID);
      showToast('Compliance check deleted from Oracle');
      setDeletingCheck(null);
      loadChecks();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete check', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <ShieldCheck size={26} color="#10b981" />
            COMPLIANCE_CHECK Relation Management
          </h1>
          <p className="page-description">
            Regulatory temperature verification, cold-chain audits, and licensing checks
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Record Compliance Audit
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by check type or audit result..."
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
          <option value="">All Audit Results</option>
          <option value="PASS">PASS (Compliant)</option>
          <option value="FAIL">FAIL (Non-Compliant)</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching compliance audits from Oracle...</p>
          </div>
        ) : checks.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck className="empty-state-icon" />
            <h3>No Compliance Checks Found</h3>
            <p>No audit records match your query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Check ID</th>
                <th>Transfer Reference</th>
                <th>Audit Type</th>
                <th>Temperature</th>
                <th>Expiry Status</th>
                <th>License Verified</th>
                <th>Audit Result</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.CHECK_ID}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>#{c.CHECK_ID}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Truck size={14} color="#06b6d4" />
                      <span style={{ fontWeight: 600 }}>Transfer #{c.TRANSFER_ID}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {c.DRUG_NAME} (Batch #{c.BATCH_ID})
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-indigo">{c.CHECK_TYPE}</span>
                  </td>
                  <td>
                    {c.TEMPERATURE !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Thermometer size={14} color="#0ea5e9" />
                        <span className="font-mono" style={{ fontWeight: 600 }}>{c.TEMPERATURE}°C</span>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${c.EXPIRY_CHECK === 'VALID' ? 'badge-emerald' : 'badge-rose'}`}>
                      {c.EXPIRY_CHECK || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.LICENSE_VALID === 'YES' ? 'badge-emerald' : 'badge-amber'}`}>
                      {c.LICENSE_VALID || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.RESULT === 'PASS' ? 'badge-emerald' : 'badge-rose'}`}>
                      {c.RESULT === 'PASS' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {c.RESULT}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Audit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingCheck(c)}
                        title="Delete Audit"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record Compliance Audit">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Associated Custody Transfer <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.transfer_id}
                onChange={(e) => setFormData({ ...formData, transfer_id: e.target.value })}
                required
              >
                <option value="">-- Select Transfer --</option>
                {transfers.map((t) => (
                  <option key={t.TRANSFER_ID} value={t.TRANSFER_ID}>
                    Transfer #{t.TRANSFER_ID} - {t.DRUG_NAME} ({t.FROM_ORG_NAME} → {t.TO_ORG_NAME})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Audit / Check Type</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Cold Chain Temperature, Expiry Check, Packaging Integrity"
                value={formData.check_type}
                onChange={(e) => setFormData({ ...formData, check_type: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Temperature Reading (°C)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="e.g., 4.5"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date Verification</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.expiry_check}
                  onChange={(e) => setFormData({ ...formData, expiry_check: e.target.value })}
                >
                  <option value="VALID">VALID</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="EXPIRING_SOON">EXPIRING_SOON</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">License Valid (Oracle Check Constraint)</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.license_valid}
                  onChange={(e) => setFormData({ ...formData, license_valid: e.target.value as 'YES' | 'NO' })}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Final Audit Result</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                >
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Recording...' : 'Save Audit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingCheck} onClose={() => setEditingCheck(null)} title="Update Compliance Audit">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Check ID</label>
              <input type="text" className="form-control" value={`#${editingCheck?.CHECK_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Audit Type</label>
              <input
                type="text"
                className="form-control"
                value={formData.check_type}
                onChange={(e) => setFormData({ ...formData, check_type: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Check</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.expiry_check}
                  onChange={(e) => setFormData({ ...formData, expiry_check: e.target.value })}
                >
                  <option value="VALID">VALID</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">License Valid</label>
                <select
                  className="select-input"
                  style={{ width: '100%' }}
                  value={formData.license_valid}
                  onChange={(e) => setFormData({ ...formData, license_valid: e.target.value as 'YES' | 'NO' })}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
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
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingCheck(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingCheck} onClose={() => setDeletingCheck(null)} title="Delete Compliance Check" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete compliance check <strong style={{ color: 'var(--text-primary)' }}>#{deletingCheck?.CHECK_ID}</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingCheck(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete from Oracle'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
