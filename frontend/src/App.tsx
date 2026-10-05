import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Workspace } from './pages/Workspace';
import { Report } from './pages/Report';
import { useTraceStore } from './store/useTraceStore';

function ReportWrapper() {
  const { claims } = useTraceStore();
  const { id } = useParams<{ id: string }>();

  return (
    <Report
      claims={claims}
      docTitle={id ? `Audit Job: ${id}` : 'Master Services Agreement (MSA)'}
      onBackToStudio={() => window.location.assign('/')}
    />
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Workspace />} />
        <Route path="/report" element={<ReportWrapper />} />
        <Route path="/jobs/:id/report" element={<ReportWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
