import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { LeftPanel } from '../components/LeftPanel';
import { TraceGraph } from '../graph/TraceGraph';
import { RightPanel } from '../components/RightPanel';
import { PdfDrawer } from '../components/PdfDrawer';
import { LoginModal } from '../components/LoginModal';
import { useTraceStore } from '../store/useTraceStore';
import { AlertTriangle, WifiOff, FileWarning, RefreshCw, X } from 'lucide-react';

export const Workspace: React.FC = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState<{
    type: 'scanned_pdf' | 'oversized' | 'stream_fail' | null;
    message: string;
  } | null>(null);

  const { startStreamingDemo } = useTraceStore();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080c14] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Top Bar */}
      <TopBar onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Optional System Status Banners (Scanned PDF, Oversized File, Stream Failure) */}
      {systemAlert && (
        <div className="relative z-40 flex items-center justify-between bg-amber-950/90 border-b border-amber-600/40 px-4 py-2 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            {systemAlert.type === 'stream_fail' ? (
              <WifiOff className="h-4 w-4 text-amber-400" />
            ) : systemAlert.type === 'scanned_pdf' ? (
              <FileWarning className="h-4 w-4 text-amber-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
            <span>{systemAlert.message}</span>
          </div>

          <div className="flex items-center gap-3">
            {systemAlert.type === 'stream_fail' && (
              <button
                onClick={() => {
                  setSystemAlert(null);
                  startStreamingDemo();
                }}
                className="flex items-center gap-1 rounded bg-amber-600/30 hover:bg-amber-600/50 px-2 py-0.5 font-medium text-amber-100 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry Stream</span>
              </button>
            )}
            <button
              onClick={() => setSystemAlert(null)}
              className="text-amber-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Main Three-Column Workspace Layout */}
      <main className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left Column: Verify / Ask Chat Panel */}
        <section className="w-[360px] xl:w-[400px] h-full flex-shrink-0 z-10 shadow-xl">
          <LeftPanel />
        </section>

        {/* Center Column: The 5-Layer Trace Graph */}
        <section className="flex-1 h-full min-w-0 relative z-0">
          <TraceGraph />
        </section>

        {/* Right Column: Claims & Upstream Attribution List */}
        <section className="w-[380px] xl:w-[420px] h-full flex-shrink-0 z-10 shadow-xl">
          <RightPanel />
        </section>

        {/* 3. Sliding PDF Evidence Drawer */}
        <PdfDrawer />
      </main>

      {/* 4. Login & Authentication Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
};

export default Workspace;
