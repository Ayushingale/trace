import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Workspace } from './pages/Workspace';
import { Report } from './pages/Report';
import mockClaimsData from './mocks/claims.json';
import { Claim } from './api/types';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Workspace />} />
        <Route
          path="/report"
          element={
            <Report
              claims={mockClaimsData as Claim[]}
              docTitle="Master Services Agreement (MSA)"
              onBackToStudio={() => window.location.assign('/')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
