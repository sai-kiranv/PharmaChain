import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DrugsPage } from './pages/DrugsPage';
import { BatchesPage } from './pages/BatchesPage';
import { OrganizationsPage } from './pages/OrganizationsPage';
import { StorageLocationsPage } from './pages/StorageLocationsPage';
import { BatchStoragePage } from './pages/BatchStoragePage';
import { CustodyTransfersPage } from './pages/CustodyTransfersPage';
import { ComplianceChecksPage } from './pages/ComplianceChecksPage';
import { VerificationLogsPage } from './pages/VerificationLogsPage';
import { ConsumersPage } from './pages/ConsumersPage';
import { SchemaPage } from './pages/SchemaPage';
import { SettingsPage } from './pages/SettingsPage';

function AppLayout() {
  return (
    <div className="app-layout-root">
      <Sidebar />
      <div className="app-body-container">
        <Header />
        <main className="app-main-scrollable">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Admin Login Page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes: requires username 'admin' and password '123456' */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/drugs" element={<DrugsPage />} />
                <Route path="/batches" element={<BatchesPage />} />
                <Route path="/organizations" element={<OrganizationsPage />} />
                <Route path="/storage-locations" element={<StorageLocationsPage />} />
                <Route path="/batch-storage" element={<BatchStoragePage />} />
                <Route path="/custody-transfers" element={<CustodyTransfersPage />} />
                <Route path="/compliance-checks" element={<ComplianceChecksPage />} />
                <Route path="/verification-logs" element={<VerificationLogsPage />} />
                <Route path="/consumers" element={<ConsumersPage />} />
                <Route path="/schema" element={<SchemaPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
