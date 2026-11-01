import {
  DbHealthResponse,
  DashboardMetrics,
  TableSummary,
  ColumnDefinition,
  ConstraintDefinition,
  Consumer,
  Organization,
  Drug,
  Batch,
  StorageLocation,
  BatchStorage,
  CustodyTransfer,
  ComplianceCheck,
  VerificationLog,
  PaginatedResponse
} from '../types';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health & Schema
  getHealth: (): Promise<DbHealthResponse> =>
    fetch(`${BASE_URL}/health`).then(r => r.json()),

  getSchemaTables: (): Promise<{ success: boolean; tables: TableSummary[] }> =>
    fetch(`${BASE_URL}/schema/tables`).then(r => handleResponse<{ success: boolean; tables: TableSummary[] }>(r)),

  getTableSchema: (tableName: string): Promise<{ success: boolean; tableName: string; columns: ColumnDefinition[]; constraints: ConstraintDefinition[] }> =>
    fetch(`${BASE_URL}/schema/table/${tableName}`).then(r => handleResponse<{ success: boolean; tableName: string; columns: ColumnDefinition[]; constraints: ConstraintDefinition[] }>(r)),

  // Analytics
  getDashboardMetrics: (): Promise<DashboardMetrics & { success: boolean }> =>
    fetch(`${BASE_URL}/analytics/overview`).then(r => handleResponse<DashboardMetrics & { success: boolean }>(r)),

  // Consumers
  getConsumers: (params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Consumer>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/consumers?${q.toString()}`).then(r => handleResponse<PaginatedResponse<Consumer>>(r));
  },
  getConsumerById: (id: number): Promise<{ success: boolean; data: Consumer }> =>
    fetch(`${BASE_URL}/consumers/${id}`).then(r => handleResponse<{ success: boolean; data: Consumer }>(r)),
  createConsumer: (data: { name: string; contact?: string }) =>
    fetch(`${BASE_URL}/consumers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateConsumer: (id: number, data: { name: string; contact?: string }) =>
    fetch(`${BASE_URL}/consumers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteConsumer: (id: number) =>
    fetch(`${BASE_URL}/consumers/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Organizations
  getOrganizations: (params?: { search?: string; type?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Organization>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.type) q.append('type', params.type);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/organizations?${q.toString()}`).then(r => handleResponse<PaginatedResponse<Organization>>(r));
  },
  getOrganizationById: (id: number): Promise<{ success: boolean; data: Organization }> =>
    fetch(`${BASE_URL}/organizations/${id}`).then(r => handleResponse<{ success: boolean; data: Organization }>(r)),
  createOrganization: (data: { name: string; org_type: string; license_no?: string; contact?: string }) =>
    fetch(`${BASE_URL}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateOrganization: (id: number, data: { name: string; org_type: string; license_no?: string; contact?: string }) =>
    fetch(`${BASE_URL}/organizations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteOrganization: (id: number) =>
    fetch(`${BASE_URL}/organizations/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Drugs
  getDrugs: (params?: { search?: string; orgId?: number; page?: number; limit?: number }): Promise<PaginatedResponse<Drug>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.orgId) q.append('orgId', params.orgId.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/drugs?${q.toString()}`).then(r => handleResponse<PaginatedResponse<Drug>>(r));
  },
  getDrugById: (id: number): Promise<{ success: boolean; data: Drug }> =>
    fetch(`${BASE_URL}/drugs/${id}`).then(r => handleResponse<{ success: boolean; data: Drug }>(r)),
  createDrug: (data: { drug_name: string; generic_name?: string; storage_requirement?: string; created_by_org_id?: number }) =>
    fetch(`${BASE_URL}/drugs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateDrug: (id: number, data: { drug_name: string; generic_name?: string; storage_requirement?: string; created_by_org_id?: number }) =>
    fetch(`${BASE_URL}/drugs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteDrug: (id: number) =>
    fetch(`${BASE_URL}/drugs/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Batches
  getBatches: (params?: { search?: string; drugId?: number; orgId?: number; status?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Batch>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.drugId) q.append('drugId', params.drugId.toString());
    if (params?.orgId) q.append('orgId', params.orgId.toString());
    if (params?.status) q.append('status', params.status);
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/batches?${q.toString()}`).then(r => handleResponse<PaginatedResponse<Batch>>(r));
  },
  getBatchById: (id: number): Promise<{ success: boolean; data: Batch & { storageAllocations: any[]; transfers: any[]; verifications: any[] } }> =>
    fetch(`${BASE_URL}/batches/${id}`).then(r => handleResponse<{ success: boolean; data: Batch & { storageAllocations: any[]; transfers: any[]; verifications: any[] } }>(r)),
  createBatch: (data: { drug_id: number; mfg_date: string; exp_date: string; org_id: number; quantity: number }) =>
    fetch(`${BASE_URL}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateBatch: (id: number, data: { drug_id: number; mfg_date: string; exp_date: string; org_id: number; quantity: number }) =>
    fetch(`${BASE_URL}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteBatch: (id: number) =>
    fetch(`${BASE_URL}/batches/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Storage Locations
  getStorageLocations: (params?: { search?: string; city?: string; orgId?: number; page?: number; limit?: number }): Promise<PaginatedResponse<StorageLocation>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.city) q.append('city', params.city);
    if (params?.orgId) q.append('orgId', params.orgId.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/storage-locations?${q.toString()}`).then(r => handleResponse<PaginatedResponse<StorageLocation>>(r));
  },
  getStorageLocationById: (id: number): Promise<{ success: boolean; data: StorageLocation & { inventory: any[] } }> =>
    fetch(`${BASE_URL}/storage-locations/${id}`).then(r => handleResponse<{ success: boolean; data: StorageLocation & { inventory: any[] } }>(r)),
  createStorageLocation: (data: { org_id: number; location_name: string; address?: string; city?: string; state?: string; capacity?: number }) =>
    fetch(`${BASE_URL}/storage-locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateStorageLocation: (id: number, data: { org_id: number; location_name: string; address?: string; city?: string; state?: string; capacity?: number }) =>
    fetch(`${BASE_URL}/storage-locations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteStorageLocation: (id: number) =>
    fetch(`${BASE_URL}/storage-locations/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Batch Storage (composite)
  getBatchStorage: (params?: { batchId?: number; locationId?: number; page?: number; limit?: number }): Promise<PaginatedResponse<BatchStorage>> => {
    const q = new URLSearchParams();
    if (params?.batchId) q.append('batchId', params.batchId.toString());
    if (params?.locationId) q.append('locationId', params.locationId.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/batch-storage?${q.toString()}`).then(r => handleResponse<PaginatedResponse<BatchStorage>>(r));
  },
  getBatchStorageById: (batchId: number, locationId: number): Promise<{ success: boolean; data: BatchStorage }> =>
    fetch(`${BASE_URL}/batch-storage/${batchId}/${locationId}`).then(r => handleResponse<{ success: boolean; data: BatchStorage }>(r)),
  createBatchStorage: (data: { batch_id: number; location_id: number; stored_quantity: number }) =>
    fetch(`${BASE_URL}/batch-storage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateBatchStorage: (batchId: number, locationId: number, data: { stored_quantity: number }) =>
    fetch(`${BASE_URL}/batch-storage/${batchId}/${locationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteBatchStorage: (batchId: number, locationId: number) =>
    fetch(`${BASE_URL}/batch-storage/${batchId}/${locationId}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Custody Transfers
  getCustodyTransfers: (params?: { search?: string; status?: string; batchId?: number; page?: number; limit?: number }): Promise<PaginatedResponse<CustodyTransfer>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.batchId) q.append('batchId', params.batchId.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/custody-transfers?${q.toString()}`).then(r => handleResponse<PaginatedResponse<CustodyTransfer>>(r));
  },
  getCustodyTransferById: (id: number): Promise<{ success: boolean; data: CustodyTransfer & { complianceChecks: any[] } }> =>
    fetch(`${BASE_URL}/custody-transfers/${id}`).then(r => handleResponse<{ success: boolean; data: CustodyTransfer & { complianceChecks: any[] } }>(r)),
  createCustodyTransfer: (data: { batch_id: number; from_org_id: number; to_org_id: number; from_location?: string; to_location?: string; transfer_date?: string; status?: string; initiated_by?: string }) =>
    fetch(`${BASE_URL}/custody-transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateCustodyTransfer: (id: number, data: { batch_id: number; from_org_id: number; to_org_id: number; from_location?: string; to_location?: string; transfer_date?: string; status?: string; initiated_by?: string }) =>
    fetch(`${BASE_URL}/custody-transfers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteCustodyTransfer: (id: number) =>
    fetch(`${BASE_URL}/custody-transfers/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Compliance Checks
  getComplianceChecks: (params?: { search?: string; result?: string; transferId?: number; page?: number; limit?: number }): Promise<PaginatedResponse<ComplianceCheck>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.result) q.append('result', params.result);
    if (params?.transferId) q.append('transferId', params.transferId.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/compliance-checks?${q.toString()}`).then(r => handleResponse<PaginatedResponse<ComplianceCheck>>(r));
  },
  createComplianceCheck: (data: { transfer_id: number; check_type?: string; temperature?: number; expiry_check?: string; license_valid?: 'YES' | 'NO'; result?: string }) =>
    fetch(`${BASE_URL}/compliance-checks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateComplianceCheck: (id: number, data: { transfer_id: number; check_type?: string; temperature?: number; expiry_check?: string; license_valid?: 'YES' | 'NO'; result?: string }) =>
    fetch(`${BASE_URL}/compliance-checks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteComplianceCheck: (id: number) =>
    fetch(`${BASE_URL}/compliance-checks/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r)),

  // Verification Logs
  getVerificationLogs: (params?: { search?: string; result?: string; batchId?: number; consumerId?: number; page?: number; limit?: number }): Promise<PaginatedResponse<VerificationLog>> => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.result) q.append('result', params.result);
    if (params?.batchId) q.append('batchId', params.batchId.toString());
    if (params?.consumerId) q.append('consumerId', params.consumerId.toString());
    if (params?.page) q.append('page', params.page.toString());
    if (params?.limit) q.append('limit', params.limit.toString());
    return fetch(`${BASE_URL}/verification-logs?${q.toString()}`).then(r => handleResponse<PaginatedResponse<VerificationLog>>(r));
  },
  createVerificationLog: (data: { batch_id: number; consumer_id: number; scan_timestamp?: string; result?: string }) =>
    fetch(`${BASE_URL}/verification-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  updateVerificationLog: (id: number, data: { batch_id: number; consumer_id: number; result?: string }) =>
    fetch(`${BASE_URL}/verification-logs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => handleResponse<any>(r)),
  deleteVerificationLog: (id: number) =>
    fetch(`${BASE_URL}/verification-logs/${id}`, { method: 'DELETE' }).then(r => handleResponse<any>(r))
};
