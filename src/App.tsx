import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { PCQ } from './pages/PCQ';
import { DIList } from './pages/DIList';
import { DIForm } from './pages/DIForm';
import { DIDetail } from './pages/DIDetail';
import { Inspections } from './pages/Inspections';
import { Reports, ReportDetailPage } from './pages/Reports';
import { NCRList, NCRDetail } from './pages/NCR';
import { Schedule } from './pages/Schedule';
import { Documents } from './pages/Documents';
import { Stats } from './pages/Stats';
import { Notifications } from './pages/Notifications';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useStore();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { currentUser } = useStore();
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects/></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail/></ProtectedRoute>} />
      <Route path="/pcq" element={<ProtectedRoute><PCQ/></ProtectedRoute>} />
      <Route path="/di" element={<ProtectedRoute><DIList/></ProtectedRoute>} />
      <Route path="/di/new" element={<ProtectedRoute><DIForm/></ProtectedRoute>} />
      <Route path="/di/:id" element={<ProtectedRoute><DIDetail/></ProtectedRoute>} />
      <Route path="/inspections" element={<ProtectedRoute><Inspections/></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><Schedule/></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports/></ProtectedRoute>} />
      <Route path="/reports/:id" element={<ProtectedRoute><ReportDetailPage/></ProtectedRoute>} />
      <Route path="/ncr" element={<ProtectedRoute><NCRList/></ProtectedRoute>} />
      <Route path="/ncr/:id" element={<ProtectedRoute><NCRDetail/></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents/></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><Stats/></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications/></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users/></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings/></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </StoreProvider>
  );
}
