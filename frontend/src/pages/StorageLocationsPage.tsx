import React, { useEffect, useState } from 'react';
import { Warehouse, Plus, Search, Edit2, Trash2, Eye, Building2, MapPin, Boxes } from 'lucide-react';
import { api } from '../api/client';
import { StorageLocation, Organization } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const StorageLocationsPage: React.FC = () => {
  const { showToast } = useNotification();
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingLoc, setEditingLoc] = useState<StorageLocation | null>(null);
  const [deletingLoc, setDeletingLoc] = useState<StorageLocation | null>(null);
  const [viewingLoc, setViewingLoc] = useState<any | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    org_id: '',
    location_name: '',
    address: '',
    city: '',
    state: '',
    capacity: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const res = await api.getStorageLocations({ search, page, limit: 10 });
      setLocations(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load storage locations from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const res = await api.getOrganizations({ limit: 100 });
      setOrganizations(res.data);
    } catch (err: any) {
      console.error('Failed to load orgs for storage location dropdown:', err);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    loadLocations();
  }, [search, page]);

  const handleOpenAdd = () => {
    setFormData({
      org_id: organizations[0]?.ORG_ID?.toString() || '',
      location_name: '',
      address: '',
      city: '',
      state: '',
      capacity: '5000'
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (loc: StorageLocation) => {
    setEditingLoc(loc);
    setFormData({
      org_id: loc.ORG_ID.toString(),
      location_name: loc.LOCATION_NAME,
      address: loc.ADDRESS || '',
      city: loc.CITY || '',
      state: loc.STATE || '',
      capacity: loc.CAPACITY ? loc.CAPACITY.toString() : ''
    });
    setFormError(null);
  };

  const handleOpenView = async (id: number) => {
    try {
      const res = await api.getStorageLocationById(id);
      setViewingLoc(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load storage location details', 'error');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.org_id || !formData.location_name.trim()) {
      setFormError('Organization and Location Name are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createStorageLocation({
        org_id: parseInt(formData.org_id, 10),
        location_name: formData.location_name,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined
      });
      showToast('Storage Location created in Oracle Database!');
      setIsAddOpen(false);
      loadLocations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;

    try {
      setSubmitting(true);
      await api.updateStorageLocation(editingLoc.LOCATION_ID, {
        org_id: parseInt(formData.org_id, 10),
        location_name: formData.location_name,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : undefined
      });
      showToast('Storage Location updated in Oracle Database!');
      setEditingLoc(null);
      loadLocations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLoc) return;
    try {
      setSubmitting(true);
      await api.deleteStorageLocation(deletingLoc.LOCATION_ID);
      showToast('Storage location removed from Oracle Database');
      setDeletingLoc(null);
      loadLocations();
    } catch (err: any) {
      showToast(err.message || 'Cannot delete storage location due to existing batch inventory', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Warehouse size={26} color="#f59e0b" />
            STORAGE_LOCATION Relation Management
          </h1>
          <p className="page-description">
            Regional distribution warehouses, cold-chain depots, and pharmacy facilities
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Add Storage Warehouse
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-text"
            placeholder="Search by warehouse name, city, state, or owner organization..."
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
            <p>Fetching storage locations from Oracle...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="empty-state">
            <Warehouse className="empty-state-icon" />
            <h3>No Warehouses Found</h3>
            <p>No storage location records matched your search query.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Location ID</th>
                <th>Facility Name</th>
                <th>Owner Organization</th>
                <th>Address</th>
                <th>City / State</th>
                <th>Capacity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr key={loc.LOCATION_ID}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>#{loc.LOCATION_ID}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{loc.LOCATION_NAME}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Building2 size={13} color="#14b8a6" />
                      <span>{loc.ORGANIZATION_NAME}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{loc.ADDRESS || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                      <MapPin size={13} color="#0ea5e9" />
                      <span>{loc.CITY ? `${loc.CITY}, ${loc.STATE}` : '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono" style={{ fontWeight: 600 }}>
                      {loc.CAPACITY ? `${loc.CAPACITY.toLocaleString()} units` : 'N/A'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenView(loc.LOCATION_ID)}
                        title="View Stored Inventory"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(loc)}
                        title="Edit Warehouse"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingLoc(loc)}
                        title="Delete Warehouse"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Storage Warehouse">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Operating Organization <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.org_id}
                onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                required
              >
                <option value="">-- Select Organization --</option>
                {organizations.map((org) => (
                  <option key={org.ORG_ID} value={org.ORG_ID}>
                    {org.NAME} ({org.ORG_TYPE})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Facility / Location Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Central Distribution Warehouse A"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Plot 45, Phase II, Industrial Zone"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Chennai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Tamil Nadu"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Storage Capacity (Units)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                placeholder="e.g., 5000"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Inserting...' : 'Save Warehouse'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingLoc} onClose={() => setEditingLoc(null)} title="Update Warehouse Details">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Location ID</label>
              <input type="text" className="form-control" value={`#${editingLoc?.LOCATION_ID}`} disabled />
            </div>

            <div className="form-group">
              <label className="form-label">Operating Organization</label>
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

            <div className="form-group">
              <label className="form-label">Facility Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.location_name}
                onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                className="form-control"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Capacity (Units)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingLoc(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Warehouse Inventory Modal */}
      <Modal isOpen={!!viewingLoc} onClose={() => setViewingLoc(null)} title={`${viewingLoc?.LOCATION_NAME} Stored Inventory`} maxWidth={650}>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Operator:</span>
              <div style={{ fontWeight: 600 }}>{viewingLoc?.ORGANIZATION_NAME}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Capacity:</span>
              <div className="font-mono">{viewingLoc?.CAPACITY ? `${viewingLoc.CAPACITY} units` : 'Unlimited'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location:</span>
              <div>{viewingLoc?.ADDRESS}, {viewingLoc?.CITY}, {viewingLoc?.STATE}</div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Boxes size={16} color="#8b5cf6" /> Current Batch Inventory (BATCH_STORAGE)
          </h4>
          {viewingLoc?.inventory?.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No batch inventory currently stored in this warehouse.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Drug Product</th>
                    <th>Exp Date</th>
                    <th>Stored Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingLoc?.inventory?.map((item: any) => (
                    <tr key={item.BATCH_ID}>
                      <td className="font-mono">#{item.BATCH_ID}</td>
                      <td style={{ fontWeight: 600 }}>{item.DRUG_NAME}</td>
                      <td style={{ fontSize: '0.85rem' }}>{item.EXP_DATE}</td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {item.STORED_QUANTITY} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setViewingLoc(null)}>Close</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingLoc} onClose={() => setDeletingLoc(null)} title="Delete Storage Location" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to delete warehouse <strong style={{ color: 'var(--text-primary)' }}>{deletingLoc?.LOCATION_NAME}</strong> (ID: #{deletingLoc?.LOCATION_ID})?
          </p>
          <p style={{ marginTop: 8, fontSize: '0.85rem', color: '#fb7185' }}>
            Foreign key constraints will block deletion if any batches are currently stored in this location.
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingLoc(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Deleting...' : 'Delete from Oracle'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
