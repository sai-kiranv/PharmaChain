import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Search, Edit2, Trash2, Warehouse, Layers, Package, MapPin } from 'lucide-react';
import { api } from '../api/client';
import { BatchStorage, Batch, StorageLocation } from '../types';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

export const BatchStoragePage: React.FC = () => {
  const { showToast } = useNotification();
  const [allocations, setAllocations] = useState<BatchStorage[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Filters
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<BatchStorage | null>(null);
  const [deletingItem, setDeletingItem] = useState<BatchStorage | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    batch_id: '',
    location_id: '',
    stored_quantity: '500'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadAllocations = async () => {
    try {
      setLoading(true);
      const res = await api.getBatchStorage({
        batchId: selectedBatchId ? parseInt(selectedBatchId, 10) : undefined,
        locationId: selectedLocationId ? parseInt(selectedLocationId, 10) : undefined,
        page,
        limit: 10
      });
      setAllocations(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err: any) {
      showToast(err.message || 'Failed to load batch storage allocations from Oracle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [batchesRes, locsRes] = await Promise.all([
        api.getBatches({ limit: 100 }),
        api.getStorageLocations({ limit: 100 })
      ]);
      setBatches(batchesRes.data);
      setLocations(locsRes.data);
    } catch (err: any) {
      console.error('Failed to load batches/locations dropdowns:', err);
    }
  };

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadAllocations();
  }, [selectedBatchId, selectedLocationId, page]);

  const handleOpenAdd = () => {
    setFormData({
      batch_id: batches[0]?.BATCH_ID?.toString() || '',
      location_id: locations[0]?.LOCATION_ID?.toString() || '',
      stored_quantity: '500'
    });
    setFormError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item: BatchStorage) => {
    setEditingItem(item);
    setFormData({
      batch_id: item.BATCH_ID.toString(),
      location_id: item.LOCATION_ID.toString(),
      stored_quantity: item.STORED_QUANTITY.toString()
    });
    setFormError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch_id || !formData.location_id || !formData.stored_quantity) {
      setFormError('Batch, Location, and Stored Quantity are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.createBatchStorage({
        batch_id: parseInt(formData.batch_id, 10),
        location_id: parseInt(formData.location_id, 10),
        stored_quantity: parseInt(formData.stored_quantity, 10)
      });
      showToast('Inventory allocated to warehouse in Oracle DB!');
      setIsAddOpen(false);
      loadAllocations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSubmitting(true);
      await api.updateBatchStorage(editingItem.BATCH_ID, editingItem.LOCATION_ID, {
        stored_quantity: parseInt(formData.stored_quantity, 10)
      });
      showToast('Warehouse quantity updated successfully in Oracle!');
      setEditingItem(null);
      loadAllocations();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      setSubmitting(true);
      await api.deleteBatchStorage(deletingItem.BATCH_ID, deletingItem.LOCATION_ID);
      showToast('Storage allocation removed from Oracle DB');
      setDeletingItem(null);
      loadAllocations();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove allocation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Boxes size={26} color="#8b5cf6" />
            BATCH_STORAGE Composite Relation
          </h1>
          <p className="page-description">
            Physical stock allocations mapping manufactured drug lots across regional warehouse facilities
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> Allocate Batch to Warehouse
        </button>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <select
          className="select-input"
          value={selectedBatchId}
          onChange={(e) => {
            setSelectedBatchId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Batches</option>
          {batches.map((b) => (
            <option key={b.BATCH_ID} value={b.BATCH_ID}>
              Batch #{b.BATCH_ID} - {b.DRUG_NAME}
            </option>
          ))}
        </select>

        <select
          className="select-input"
          value={selectedLocationId}
          onChange={(e) => {
            setSelectedLocationId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Warehouses</option>
          {locations.map((l) => (
            <option key={l.LOCATION_ID} value={l.LOCATION_ID}>
              {l.LOCATION_NAME} ({l.CITY})
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
            <p>Fetching inventory allocations from Oracle...</p>
          </div>
        ) : allocations.length === 0 ? (
          <div className="empty-state">
            <Boxes className="empty-state-icon" />
            <h3>No Allocations Found</h3>
            <p>No batch storage allocation records match your filter criteria.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Drug Formulation</th>
                <th>Warehouse Location</th>
                <th>City / Region</th>
                <th>Warehouse Operator</th>
                <th>Stored Quantity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((item) => (
                <tr key={`${item.BATCH_ID}-${item.LOCATION_ID}`}>
                  <td className="font-mono" style={{ fontWeight: 600 }}>#{item.BATCH_ID}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Package size={14} color="#0ea5e9" />
                      <span style={{ fontWeight: 700 }}>{item.DRUG_NAME}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Warehouse size={14} color="#f59e0b" />
                      <span style={{ fontWeight: 600 }}>{item.LOCATION_NAME}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                      <MapPin size={13} color="#14b8a6" />
                      <span>{item.CITY}, {item.STATE}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {item.LOCATION_OWNER}
                  </td>
                  <td>
                    <span className="badge badge-indigo font-mono" style={{ fontSize: '0.85rem' }}>
                      {item.STORED_QUANTITY.toLocaleString()} units
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(item)}
                        title="Update Quantity"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeletingItem(item)}
                        title="Remove Allocation"
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
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Assign Batch Stock to Warehouse">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Batch Lot <span className="req">*</span>
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

            <div className="form-group">
              <label className="form-label">
                Storage Warehouse <span className="req">*</span>
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required
              >
                <option value="">-- Select Warehouse --</option>
                {locations.map((l) => (
                  <option key={l.LOCATION_ID} value={l.LOCATION_ID}>
                    {l.LOCATION_NAME} ({l.CITY}) - Cap: {l.CAPACITY || 'Unlimited'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Stock Quantity to Store <span className="req">*</span>
              </label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.stored_quantity}
                onChange={(e) => setFormData({ ...formData, stored_quantity: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Allocating...' : 'Assign Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Update Warehouse Stock Quantity">
        <form onSubmit={handleUpdate}>
          <div className="modal-body">
            {formError && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(244,63,94,0.1)', color: '#fb7185', marginBottom: 16 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Batch:</span>
                <div style={{ fontWeight: 600 }}>Batch #{editingItem?.BATCH_ID} ({editingItem?.DRUG_NAME})</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Warehouse:</span>
                <div style={{ fontWeight: 600 }}>{editingItem?.LOCATION_NAME}</div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Stored Quantity (Units) <span className="req">*</span>
              </label>
              <input
                type="number"
                className="form-control"
                min="0"
                value={formData.stored_quantity}
                onChange={(e) => setFormData({ ...formData, stored_quantity: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setEditingItem(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating...' : 'Save Quantity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingItem} onClose={() => setDeletingItem(null)} title="Remove Batch Allocation" maxWidth={450}>
        <div className="modal-body">
          <p>
            Are you sure you want to remove the inventory allocation for Batch <strong style={{ color: 'var(--text-primary)' }}>#{deletingItem?.BATCH_ID}</strong> at <strong style={{ color: 'var(--text-primary)' }}>{deletingItem?.LOCATION_NAME}</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setDeletingItem(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
            {submitting ? 'Removing...' : 'Remove Allocation'}
          </button>
        </div>
      </Modal>
    </div>
  );
};
