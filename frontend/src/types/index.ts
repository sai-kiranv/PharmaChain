export interface DbHealthResponse {
  status: 'UP' | 'DOWN';
  db_connected: number;
  message: string;
  latencyMs?: number;
  timestamp: string;
  database?: {
    service: string;
    user: string;
    poolMin: number | string;
    poolMax: number | string;
  };
  error?: string;
}

export interface TableSummary {
  table_name: string;
  row_count: number;
}

export interface ColumnDefinition {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  DATA_LENGTH: number;
  DATA_PRECISION: number | null;
  DATA_SCALE: number | null;
  NULLABLE: 'Y' | 'N';
}

export interface ConstraintDefinition {
  CONSTRAINT_NAME: string;
  CONSTRAINT_TYPE: 'P' | 'R' | 'U' | 'C';
  SEARCH_CONDITION: string | null;
  R_CONSTRAINT_NAME: string | null;
  COLUMN_NAME: string;
  POSITION: number | null;
  REFERENCED_TABLE: string | null;
}

export interface Consumer {
  CONSUMER_ID: number;
  NAME: string;
  CONTACT: string | null;
  verifications?: VerificationLog[];
}

export interface Organization {
  ORG_ID: number;
  NAME: string;
  ORG_TYPE: string;
  LICENSE_NO: string | null;
  CONTACT: string | null;
  locations?: StorageLocation[];
  drugs?: Drug[];
}

export interface Drug {
  DRUG_ID: number;
  DRUG_NAME: string;
  GENERIC_NAME: string | null;
  STORAGE_REQUIREMENT: string | null;
  CREATED_BY_ORG_ID: number | null;
  MANUFACTURER_NAME?: string;
  MANUFACTURER_TYPE?: string;
  batches?: Batch[];
}

export interface Batch {
  BATCH_ID: number;
  DRUG_ID: number;
  DRUG_NAME?: string;
  GENERIC_NAME?: string;
  STORAGE_REQUIREMENT?: string;
  ORG_ID: number;
  MANUFACTURER_NAME?: string;
  QUANTITY: number;
  MFG_DATE: string;
  EXP_DATE: string;
  STATUS?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
  DAYS_REMAINING?: number;
}

export interface StorageLocation {
  LOCATION_ID: number;
  ORG_ID: number;
  ORGANIZATION_NAME?: string;
  LOCATION_NAME: string;
  ADDRESS: string | null;
  CITY: string | null;
  STATE: string | null;
  CAPACITY: number | null;
  UTILIZED_CAPACITY?: number;
}

export interface BatchStorage {
  BATCH_ID: number;
  LOCATION_ID: number;
  STORED_QUANTITY: number;
  DRUG_NAME?: string;
  STORAGE_REQUIREMENT?: string;
  LOCATION_NAME?: string;
  CITY?: string;
  STATE?: string;
  LOCATION_CAPACITY?: number;
  LOCATION_OWNER?: string;
}

export interface CustodyTransfer {
  TRANSFER_ID: number;
  BATCH_ID: number;
  DRUG_NAME?: string;
  FROM_ORG_ID: number;
  FROM_ORG_NAME?: string;
  TO_ORG_ID: number;
  TO_ORG_NAME?: string;
  FROM_LOCATION: string | null;
  TO_LOCATION: string | null;
  TRANSFER_DATE: string;
  STATUS: string;
  INITIATED_BY: string | null;
  complianceChecks?: ComplianceCheck[];
}

export interface ComplianceCheck {
  CHECK_ID: number;
  TRANSFER_ID: number;
  CHECK_TYPE: string | null;
  TEMPERATURE: number | null;
  EXPIRY_CHECK: string | null;
  LICENSE_VALID: 'YES' | 'NO' | null;
  RESULT: string;
  BATCH_ID?: number;
  DRUG_NAME?: string;
  FROM_ORG_NAME?: string;
  TO_ORG_NAME?: string;
}

export interface VerificationLog {
  LOG_ID: number;
  BATCH_ID: number;
  DRUG_NAME?: string;
  GENERIC_NAME?: string;
  CONSUMER_ID: number;
  CONSUMER_NAME?: string;
  CONSUMER_CONTACT?: string;
  SCAN_TIMESTAMP: string;
  RESULT: string;
  BATCH_EXP_DATE?: string;
}

export interface DashboardMetrics {
  tableCounts: Record<string, number>;
  batchMetrics: {
    TOTAL_BATCHES: number;
    TOTAL_UNITS: number;
    ACTIVE_BATCHES: number;
    EXPIRED_BATCHES: number;
    EXPIRING_SOON_BATCHES: number;
  };
  complianceMetrics: {
    TOTAL_CHECKS: number;
    PASS_COUNT: number;
    FAIL_COUNT: number;
  };
  verificationMetrics: {
    TOTAL_LOGS: number;
    GENUINE_COUNT: number;
    SUSPICIOUS_COUNT: number;
  };
  orgBreakdown: Array<{
    ORG_TYPE: string;
    COUNT: number;
  }>;
  recentTransfers: Array<{
    TRANSFER_ID: number;
    BATCH_ID: number;
    DRUG_NAME: string;
    FROM_ORG_NAME: string;
    TO_ORG_NAME: string;
    TRANSFER_DATE: string;
    STATUS: string;
  }>;
  recentLogs: Array<{
    LOG_ID: number;
    BATCH_ID: number;
    DRUG_NAME: string;
    CONSUMER_NAME: string;
    SCAN_DATE: string;
    RESULT: string;
  }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}
