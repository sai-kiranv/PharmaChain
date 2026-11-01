import React, { useEffect, useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Building2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { Drug, Organization } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const DrugsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [deletingDrug, setDeletingDrug] = useState<Drug | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    drug_name: '',
    generic_name: '',
    storage_requirement: '',
    created_by_org_id: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadDrugs = async () => {
    try {
      setLoading(true);
      const res = await api.getDrugs({ search, page, limit: 10 });
      setDrugs(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load drugs from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const res = await api.getOrganizations({ limit: 100 });
      setOrganizations(res.data);
    } catch (err: any) {
      console.error('Failed to load organizations for dropdown:', err);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    loadDrugs();
  }, [search, page]);

  const handleOpenAdd = () => {
    setFormData({
      drug_name: '',
      generic_name: '',
      storage_requirement: '',
      created_by_org_id: organizations[0]?.ORG_ID?.toString() || ''
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (drug: Drug) => {
    setEditingDrug(drug);
    setFormData({
      drug_name: drug.DRUG_NAME,
      generic_name: drug.GENERIC_NAME || '',
      storage_requirement: drug.STORAGE_REQUIREMENT || '',
      created_by_org_id: drug.CREATED_BY_ORG_ID?.toString() || ''
    });
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.drug_name.trim()) {
      setFormError('Drug name is required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createDrug({
        drug_name: formData.drug_name,
        generic_name: formData.generic_name || undefined,
        storage_requirement: formData.storage_requirement || undefined,
        created_by_org_id: formData.created_by_org_id ? parseInt(formData.created_by_org_id, 10) : undefined
      });
      showToast('Drug registered in Oracle Database successfully!');
      setIsAddOpen(false);
      loadDrugs();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDrug) return;
    if (!formData.drug_name.trim()) {
      setFormError('Drug name is required');
      return;
    }

    try {
      setSubmitting(true);
      await api.updateDrug(editingDrug.DRUG_ID, {
        drug_name: formData.drug_name,
        generic_name: formData.generic_name || undefined,
        storage_requirement: formData.storage_requirement || undefined,
        created_by_org_id: formData.created_by_org_id ? parseInt(formData.created_by_org_id, 10) : undefined
      });
      showToast('Drug updated successfully in Oracle!');
      setEditingDrug(null);
      loadDrugs();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDrug) return;
    try {
      setSubmitting(true);
      await api.deleteDrug(deletingDrug.DRUG_ID);
      showToast('Drug removed from Oracle Database');
      setDeletingDrug(null);
      loadDrugs();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete drug due to foreign key constraints', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package size={26} color="#0ea5e9" />
            DRUGS Relation Management
          </h1>
          <p className="page-description">
            Maintain registered pharmaceutical formulations and storage specifications
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Register New Drug
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by drug name or generic name..."
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
            <p>Fetching drugs from Oracle...</p>
          </div>
        ) : drugs.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-state-icon" />
            <h3>No Drugs Found</h3>
            <p>No pharmaceutical records match your search criteria.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Drug ID</th>
                <th>Brand Name</th>
                <th>Generic Formulation</th>
                <th>Storage Requirement</th>
                <th>Manufacturer Org</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drugs.map((drug) => (
                <tr key={drug.DRUG_ID}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>#{drug.DRUG_ID}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{drug.DRUG_NAME}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{drug.GENERIC_NAME || '—'}</td>
                  <td>
                    <span className="badge badge-cyan">
                      {drug.STORAGE_REQUIREMENT || 'Standard'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={14} color="#14b8a6" />
                      <span>{drug.MANUFACTURER_NAME || 'Unknown Org'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(drug)}
                        title="Edit Drug"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingDrug(drug)}
                        title="Delete Drug"
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

      {/* Add Drug Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Drug in Oracle DB">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16, display: 'flex', gap: 8 }}>
                <AlertCircle size={18} />
                <span>{formError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Drug Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Amoxicillin 500mg"
                value={formData.drug_name}
                onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Amoxicillin Trihydrate"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Storage Requirement</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Store below 25°C in a dry place"
                value={formData.storage_requirement}
                onChange={(e) => setFormData({ ...formData, storage_requirement: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturer Organization</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.created_by_org_id}
                onChange={(e) => setFormData({ ...formData, created_by_org_id: e.target.value })}
              >
                <option value="">-- Select Manufacturer --</option>
                {organizations.map((org) => (
                  <option key={org.ORG_ID} value={org.ORG_ID}>
                    {org.NAME} ({org.ORG_TYPE})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Inserting in Oracle...' : 'Save Drug'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Drug Modal */}
      <Modal isOpen={!!editingDrug} onClose={() => setEditingDrug(null)} title="Update Drug Details">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Drug ID</label>
              <input type="text" className="form-control" value={`#${editingDrug?.DRUG_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">
                Drug Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                value={formData.drug_name}
                onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Storage Requirement</label>
              <input
                type="text"
                className="form-control"
                value={formData.storage_requirement}
                onChange={(e) => setFormData({ ...formData, storage_requirement: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manufacturer Organization</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.created_by_org_id}
                onChange={(e) => setFormData({ ...formData, created_by_org_id: e.target.value })}
              >
                <option value="">-- None --</option>
                {organizations.map((org) => (
                  <option key={org.ORG_ID} value={org.ORG_ID}>
                    {org.NAME} ({org.ORG_TYPE})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingDrug(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingDrug} onClose={() => setDeletingDrug(null)} title="Confirm Drug Deletion" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deletingDrug?.DRUG_NAME}</strong> (ID: #{deletingDrug?.DRUG_ID})?
          </p>
          <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#fb7185' }}>
            Note: If batches exist referencing this drug in Oracle, foreign key constraints will block deletion.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingDrug(null)}>
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
