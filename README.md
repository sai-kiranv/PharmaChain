# PharmaChain DBMS — Enterprise Pharmaceutical Supply Chain Management System

A high-performance, purely relational Database Management System (DBMS) built for tracking and managing pharmaceutical supply chains, inventory allocations, custody transfers, regulatory compliance checks, and consumer authenticity verifications.

Connected directly to an **Oracle Database 21c** instance using the official **`node-oracledb`** driver with connection pooling.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Database** | **Oracle Database 21c Express Edition (XE)** | Enterprise RDBMS storing all relations, check constraints, foreign keys, and identity sequences. |
| **Database Driver**| **`node-oracledb` (v6+)** | Official Oracle driver running in high-performance Thin Mode with connection pooling. |
| **Backend API** | **Node.js, Express, TypeScript/CommonJS** | RESTful API with parameterized SQL bind variables, transaction management, and connection release safeguards. |
| **Frontend UI** | **React 19, TypeScript, Vite** | Enterprise dashboard with dark-mode glassmorphic styling, live health indicators, and CRUD interfaces for all 9 relations. |
| **Styling** | **Custom Vanilla CSS Design System** | Tailored HSL colors, micro-animations, responsive tables, modals, and toasts. |

> **Note on Scope**: This is purely a Database Management System (DBMS) project. It contains zero blockchain dependencies, smart contracts, or web3 libraries.

---

## 🗄️ Oracle Database Schema (9 Tables)

The system directly maps and manages the 9 core Oracle relations in the `SYSTEM` schema:

1. **`CONSUMER`**: Registered patients and consumers performing drug authenticity scans (`CONSUMER_ID`, `NAME`, `CONTACT`).
2. **`ORGANIZATION`**: Stakeholder entities categorized as Manufacturers, Distributors, or Pharmacies (`ORG_ID`, `NAME`, `ORG_TYPE`, `LICENSE_NO`, `CONTACT`).
3. **`DRUGS`**: Registered medicinal products and formulation specifications (`DRUG_ID`, `DRUG_NAME`, `GENERIC_NAME`, `STORAGE_REQUIREMENT`, `CREATED_BY_ORG_ID`).
4. **`BATCH`**: Manufactured production lots with expiration control (`BATCH_ID`, `DRUG_ID`, `MFG_DATE`, `EXP_DATE`, `ORG_ID`, `QUANTITY`).
   - *Check Constraint*: `EXP_DATE > MFG_DATE`, `QUANTITY >= 0`.
5. **`STORAGE_LOCATION`**: Regional distribution warehouses, cold-chain depots, and pharmacy storage (`LOCATION_ID`, `ORG_ID`, `LOCATION_NAME`, `ADDRESS`, `CITY`, `STATE`, `CAPACITY`).
   - *Check Constraint*: `CAPACITY >= 0`.
6. **`BATCH_STORAGE`**: Composite inventory allocation table (`BATCH_ID`, `LOCATION_ID`, `STORED_QUANTITY`).
   - *Composite Primary Key*: `(BATCH_ID, LOCATION_ID)`.
7. **`CUSTODY_TRANSFER`**: Chain of custody handoffs between supply chain stakeholders (`TRANSFER_ID`, `BATCH_ID`, `FROM_ORG_ID`, `TO_ORG_ID`, `FROM_LOCATION`, `TO_LOCATION`, `TRANSFER_DATE`, `STATUS`, `INITIATED_BY`).
8. **`COMPLIANCE_CHECK`**: Regulatory cold-chain inspections, temperature logs, and license validation (`CHECK_ID`, `TRANSFER_ID`, `CHECK_TYPE`, `TEMPERATURE`, `EXPIRY_CHECK`, `LICENSE_VALID`, `RESULT`).
   - *Check Constraint*: `LICENSE_VALID IN ('YES', 'NO') OR LICENSE_VALID IS NULL`.
9. **`VERIFICATION_LOG`**: Consumer QR/barcode authentication events verifying product genuineness (`LOG_ID`, `BATCH_ID`, `CONSUMER_ID`, `SCAN_TIMESTAMP`, `RESULT`).

---

## 🚀 Windows Setup & Running Instructions

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended, verified on v24.11.0)
- **Oracle Database 21c XE** installed and running on Windows
- Oracle listener running on port `1521` (Service Name: `XE`)

### 1. Database Configuration (.env)
The database credentials reside **strictly in the backend `.env` file** and are never exposed to the frontend:

Navigate to `backend/.env` (or copy from `backend/.env.example`):
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Oracle Database Credentials
DB_USER=SYSTEM
DB_PASSWORD=your_system_password
DB_CONNECT_STRING=localhost:1521/XE

# Oracle Connection Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_INCREMENT=2
DB_POOL_TIMEOUT=60
```

### 2. Backend Setup & Startup
Open PowerShell or Command Prompt:
```powershell
cd "c:\College\DBMS\PharmaChain dbms\backend"
npm install
npm run dev
```
You will see:
```
[PharmaChain Server] Connecting to Oracle Database...
[Oracle Pool] Initialized successfully with connectString: localhost:1521/XE
[PharmaChain Server] Oracle Health Check PASSED: SELECT 1 FROM dual succeeded.
[PharmaChain Server] Running on http://localhost:5000
```

### 3. Frontend Setup & Startup
In a second terminal window:
```powershell
cd "c:\College\DBMS\PharmaChain dbms\frontend"
npm install
npm run dev
```
The application will launch at:
```
http://localhost:3000/
```

---

## 📡 Backend API Endpoints

### Health & Live Schema Introspection
- `GET /api/health`: Executes `SELECT 1 AS DB_CONNECTED FROM dual`. Returns server status, Oracle latency, and pool information.
- `GET /api/schema/tables`: Queries `user_tables` and live table row counts.
- `GET /api/schema/table/:table`: Queries `user_tab_columns`, `user_constraints`, and `user_cons_columns` for real-time schema metadata.
- `GET /api/analytics/overview`: Aggregated statistics across all 9 relations, batch shelf life metrics, and audit pass rates.

### Entity CRUD Operations (Parameterized SQL)
| Resource | Routes | Supported Methods | Description |
| :--- | :--- | :--- | :--- |
| **Drugs** | `/api/drugs` | `GET`, `POST`, `PUT`, `DELETE` | Drug formulations & manufacturer linkages |
| **Batches** | `/api/batches` | `GET`, `POST`, `PUT`, `DELETE` | Production lots, expiration validation |
| **Organizations** | `/api/organizations` | `GET`, `POST`, `PUT`, `DELETE` | Supply chain entity registry & licensing |
| **Warehouses** | `/api/storage-locations` | `GET`, `POST`, `PUT`, `DELETE` | Storage capacity & regional depots |
| **Inventory** | `/api/batch-storage` | `GET`, `POST`, `PUT`, `DELETE` | Composite key physical batch allocations |
| **Transfers** | `/api/custody-transfers` | `GET`, `POST`, `PUT`, `DELETE` | Custody handoffs & status updates |
| **Compliance** | `/api/compliance-checks` | `GET`, `POST`, `PUT`, `DELETE` | Temperature audits & licensing verification |
| **Scans** | `/api/verification-logs` | `GET`, `POST`, `PUT`, `DELETE` | Consumer authentication scan tracking |
| **Consumers** | `/api/consumers` | `GET`, `POST`, `PUT`, `DELETE` | Patient profiles & verification history |

---

## 🔒 Security & Cloud Production Deployment Guidelines

To deploy this enterprise application to production or cloud hosting:

1. **Never Expose Local Oracle Database to the Public Internet**:
   - Do **NOT** open port 1521 on your local router or laptop.
   - For cloud staging or production, provision a managed cloud database such as **Oracle Cloud Infrastructure (OCI) Autonomous Database**, **Oracle Base Database Service**, or **AWS RDS for Oracle**.

2. **Secure Credentials in Production**:
   - Store credentials in secure secret managers (e.g., AWS Secrets Manager, Azure Key Vault, or Docker secrets) instead of plaintext files.
   - Enable SSL/TLS encryption (`TCPS`) with Oracle Wallets (`sqlnet.ora` and `tnsnames.ora`).

3. **Production Build**:
   ```powershell
   cd frontend
   npm run build
   ```
   The compiled frontend bundle in `frontend/dist/` can be served directly by Nginx, Cloudflare Pages, or by the Express backend as static assets.
