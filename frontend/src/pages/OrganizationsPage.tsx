import React, { useEffect, useState } from 'react';
import { Building2, Plus, Search, Edit2, Trash2, Eye, ShieldCheck, Phone, Warehouse, Package } from 'lucide-react';
import { api } from '../api/client';
import { Organization } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const OrganizationsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    org_type: 'Manufacturer',
    license_no: '',
    contact: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const res = await api.getOrganizations({
        search,
        type: typeFilter,
        page,
        limit: 10
      });
      setOrganizations(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load organizations from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [search, typeFilter, page]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      org_type: 'Manufacturer',
      license_no: '',
      contact: ''
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      name: org.NAME,
      org_type: org.ORG_TYPE,
      license_no: org.LICENSE_NO || '',
      contact: org.CONTACT || ''
    });
    setFormError(null);
  };

  const handleOpenView = async (id: number) => {
    try {
      const res = await api.getOrganizationById(id);
      setViewingOrg(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load organization details', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.org_type.trim()) {
      setFormError('Organization name and type are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createOrganization({
        name: formData.name,
        org_type: formData.org_type,
        license_no: formData.license_no || undefined,
        contact: formData.contact || undefined
      });
      showToast('Organization registered in Oracle Database successfully!');
      setIsAddOpen(false);
      loadOrganizations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    try {
      setSubmitting(true);
      await api.updateOrganization(editingOrg.ORG_ID, {
        name: formData.name,
        org_type: formData.org_type,
        license_no: formData.license_no || undefined,
        contact: formData.contact || undefined
      });
      showToast('Organization updated in Oracle Database!');
      setEditingOrg(null);
      loadOrganizations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrg) return;
    try {
      setSubmitting(true);
      await api.deleteOrganization(deletingOrg.ORG_ID);
      showToast('Organization deleted from Oracle Database');
      setDeletingOrg(null);
      loadOrganizations();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete organization due to foreign key dependencies', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Building2 size={26} color="#14b8a6" />
            ORGANIZATION Relation Management
          </h1>
          <p className="page-description">
            Stakeholder registry for Manufacturers, Wholesale Distributors, and Pharmacies
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Register Organization
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by organization name, license number, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="select-input"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="Manufacturer">Manufacturer</option>
          <option value="Distributor">Distributor</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Hospital">Hospital</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching organizations from Oracle...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <h3>No Organizations Found</h3>
            <p>No organization records matched your search query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Org ID</th>
                <th>Entity Name</th>
                <th>Type</th>
                <th>License Number</th>
                <th>Contact</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => {
                const typeBadge =
                  org.ORG_TYPE === 'Manufacturer'
                    ? 'badge-indigo'
                    : org.ORG_TYPE === 'Distributor'
                    ? 'badge-cyan'
                    : 'badge-emerald';

                return (
                  <tr key={org.ORG_ID}>
                    <td className="font-mono" style={{ fontWeight: 600 }}>#{org.ORG_ID}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{org.NAME}</td>
                    <td>
                      <span className={`badge ${typeBadge}`}>
                        {org.ORG_TYPE}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldCheck size={14} color="#f59e0b" />
                        <span className="font-mono" style={{ fontSize: '0.85rem' }}>{org.LICENSE_NO || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <Phone size={13} />
                        <span>{org.CONTACT || '—'}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenView(org.ORG_ID)}
                          title="View Facilities & Products"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(org)}
                          title="Edit Organization"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeletingOrg(org)}
                          title="Delete Organization"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Organization in Oracle">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Organization Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Sun Pharma Industries"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Organization Type <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.org_type}
                onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                required
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Distributor">Distributor</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Hospital">Hospital</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">License Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., LIC-IND-2026-908"
                value={formData.license_no}
                onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., 9876500001"
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
              {submitting ? 'Inserting...' : 'Register Organization'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingOrg} onClose={() => setEditingOrg(null)} title="Update Organization">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Organization ID</label>
              <input type="text" className="form-control" value={`#${editingOrg?.ORG_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">
                Organization Name <span className="req">*</span>
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
              <label className="form-label">Organization Type</label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.org_type}
                onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                required
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Distributor">Distributor</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Hospital">Hospital</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">License Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.license_no}
                onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingOrg(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={!!viewingOrg} onClose={() => setViewingOrg(null)} title={`${viewingOrg?.NAME} Profile`} maxWidth={650}>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type:</span>
              <div style={{ fontWeight: 600 }}>{viewingOrg?.ORG_TYPE}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>License No:</span>
              <div className="font-mono">{viewingOrg?.LICENSE_NO || 'N/A'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone:</span>
              <div>{viewingOrg?.CONTACT || 'N/A'}</div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Warehouse size={16} color="#f59e0b" /> Registered Storage Locations
          </h4>
          {viewingOrg?.locations?.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>No warehouses registered under this organization.</p>
          ) : (
            <div className="table-container" style={{ marginBottom: 16 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>City / State</th>
                    <th>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingOrg?.locations?.map((l: any) => (
                    <tr key={l.LOCATION_ID}>
                      <td style={{ fontWeight: 600 }}>{l.LOCATION_NAME}</td>
                      <td>{l.CITY}, {l.STATE}</td>
                      <td className="font-mono">{l.CAPACITY ? `${l.CAPACITY} units` : 'Unlimited'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={16} color="#0ea5e9" /> Formulated Products
          </h4>
          {viewingOrg?.drugs?.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No drugs registered under this manufacturer.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Drug ID</th>
                    <th>Name</th>
                    <th>Generic</th>
                    <th>Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingOrg?.drugs?.map((d: any) => (
                    <tr key={d.DRUG_ID}>
                      <td className="font-mono">#{d.DRUG_ID}</td>
                      <td style={{ fontWeight: 600 }}>{d.DRUG_NAME}</td>
                      <td>{d.GENERIC_NAME}</td>
                      <td style={{ fontSize: '0.8rem' }}>{d.STORAGE_REQUIREMENT}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewingOrg(null)}>Close</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingOrg} onClose={() => setDeletingOrg(null)} title="Delete Organization" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{deletingOrg?.NAME}</strong> (ID: #{deletingOrg?.ORG_ID})?
          </p>
          <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#fb7185' }}>
            Warning: If drugs, batches, or warehouses reference this organization, Oracle referential integrity constraints will prevent deletion.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingOrg(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete from Oracle'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
