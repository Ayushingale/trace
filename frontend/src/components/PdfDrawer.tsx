import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { useTraceStore } from '../store/useTraceStore';

export const PdfDrawer: React.FC = () => {
  const { isPdfOpen, activePdf, closePdf } = useTraceStore();
  const [zoom, setZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [flashing, setFlashing] = useState<boolean>(true);

  useEffect(() => {
    if (activePdf?.page) {
      setCurrentPage(activePdf.page);
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [activePdf?.page, activePdf?.flashKey]);

  if (!isPdfOpen || !activePdf) return null;

  // Mock standard document page dimensions (points: 612 x 792 for standard letter)
  const docWidth = 612;
  const docHeight = 792;

  // Convert bbox [x1, y1, x2, y2] to percentage coordinates for dynamic zoom & scaling
  const bbox = activePdf.bbox || [72.0, 140.0, 520.0, 180.0];
  const topPct = (bbox[1] / docHeight) * 100;
  const leftPct = (bbox[0] / docWidth) * 100;
  const widthPct = ((bbox[2] - bbox[0]) / docWidth) * 100;
  const heightPct = ((bbox[3] - bbox[1]) / docHeight) * 100;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Drawer Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-100 truncate" title={activePdf.docId}>
              {activePdf.docId}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Source Grounding Drawer</span>
              <span>•</span>
              <span className="text-cyan-400 font-mono font-medium">Page {currentPage} of 12</span>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-slate-800/90 border border-slate-700/80 p-0.5 text-xs text-slate-300">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 hover:text-white disabled:opacity-40 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-xs">{currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(12, p + 1))}
              disabled={currentPage >= 12}
              className="p-1 hover:text-white disabled:opacity-40 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center rounded-lg bg-slate-800/90 border border-slate-700/80 p-0.5 text-xs text-slate-300">
            <button
              onClick={() => setZoom((z) => Math.max(60, z - 15))}
              className="p-1 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-1.5 font-mono text-xs">{zoom}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(180, z + 15))}
              className="p-1 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={closePdf}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1 border border-slate-700"
            title="Close Drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Target Evidence Highlight Notice */}
      {activePdf.passageText && (
        <div className="border-b border-cyan-900/40 bg-cyan-950/30 px-4 py-2 text-xs text-cyan-200 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-semibold text-cyan-300">Matched Evidence Clause (p.{currentPage}):</span>
            <p className="italic text-slate-300 line-clamp-2 mt-0.5">"{activePdf.passageText}"</p>
          </div>
        </div>
      )}

      {/* Rendered Document Viewport */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-900/60">
        <div
          style={{ width: `${(docWidth * zoom) / 100}px`, minHeight: `${(docHeight * zoom) / 100}px` }}
          className="relative bg-white text-slate-900 rounded-sm shadow-2xl p-8 text-xs font-serif leading-relaxed border border-slate-300 select-text transition-all duration-200"
        >
          {/* Header on Document Sheet */}
          <div className="border-b border-slate-300 pb-3 mb-6 flex justify-between items-center text-[10px] text-slate-500 font-sans uppercase tracking-wider">
            <span>MASTER SERVICES AGREEMENT • CONFIDENTIAL</span>
            <span>PAGE {currentPage}</span>
          </div>

          {/* Document Content Simulation based on page */}
          {currentPage === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold font-sans text-slate-900">SECTION 1: APPOINTMENT & TERM</h2>
              <p>
                1.1 Appointment: Customer hereby engages Supplier to provide the cloud services described in Schedule A,
                and Supplier hereby accepts such engagement subject to the terms and stipulations set forth herein.
              </p>
              <p className="font-medium text-slate-800">
                2.1 Term: This Agreement shall commence on the Effective Date and continue for twenty-four (24) months,
                unless terminated earlier in accordance with Section 9 herein.
              </p>
              <p>
                2.2 Renewal: Upon expiration of the Initial Term, this Agreement shall automatically renew for successive
                twelve (12) month periods unless either party provides written notice of non-renewal at least sixty (60) days
                prior to the end of the then-current term.
              </p>
            </div>
          )}

          {currentPage === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold font-sans text-slate-900">SECTION 4: FEES, INVOICING & PAYMENT</h2>
              <p>
                4.1 Fees: Customer shall pay Supplier the recurring subscription fees set forth in the Order Form.
                All fees are non-refundable except as expressly provided otherwise.
              </p>
              <p className="font-medium text-slate-800">
                Section 4.2: Undisputed invoices shall be payable within thirty (30) business days following receipt of
                proper electronic documentation.
              </p>
              <p>
                4.3 Late Charges: Any delinquent payment shall accrue interest at a rate of 1.5% per month or the highest
                rate allowable under applicable statutory law.
              </p>
            </div>
          )}

          {currentPage === 5 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold font-sans text-slate-900">SECTION 9: TERMINATION</h2>
              <p>
                9.1 Termination for Cause: Either party may immediately terminate this Agreement upon written notice if the
                other party materially breaches any provision and fails to cure within thirty (30) calendar days.
              </p>
              <p className="font-medium text-slate-800">
                9.3 Termination for Convenience: Either party may terminate this Agreement without cause upon sixty (60) days
                prior written notice to the other party.
              </p>
              <p>
                9.4 Effect of Termination: Upon termination, Customer shall immediately discontinue all access to the services.
              </p>
            </div>
          )}

          {currentPage === 7 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold font-sans text-slate-900">SECTION 11: LIMITATION OF LIABILITY</h2>
              <p>
                11.1 Consequential Damages Waiver: Neither party shall be liable for indirect, incidental, special, or consequential damages.
              </p>
              <p className="font-medium text-slate-800">
                11.2 Subject to clause 11.4, neither party excludes liability where prohibited by applicable jurisdiction laws,
                including liability arising from willful misconduct or gross negligence.
              </p>
              <p>
                11.3 Aggregate Cap: In no event shall aggregate liability exceed the total amounts paid in the preceding 12 months.
              </p>
            </div>
          )}

          {![1, 3, 5, 7].includes(currentPage) && (
            <div className="space-y-4 text-slate-600">
              <h2 className="text-base font-bold font-sans text-slate-800">SECTION {currentPage + 2}: GENERAL PROVISIONS</h2>
              <p>
                Standard commercial contract terms governing warranties, export compliance, governing law, and dispute resolution.
              </p>
              <p>
                All notices under this Agreement must be in writing and deemed given when delivered by recognized courier or electronic confirmation.
              </p>
            </div>
          )}

          {/* Dynamic Bounding Box Overlay with pulse/flash highlight */}
          {activePdf.page === currentPage && (
            <div
              style={{
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: `${Math.max(widthPct, 20)}%`,
                height: `${Math.max(heightPct, 6)}%`,
              }}
              className={`absolute rounded border-2 border-cyan-500 pointer-events-none transition-all duration-300 ${
                flashing
                  ? 'bg-cyan-400/35 ring-4 ring-cyan-400 animate-pulse shadow-lg shadow-cyan-400/50'
                  : 'bg-cyan-400/20'
              }`}
            >
              <div className="absolute -top-5 left-0 rounded bg-cyan-600 px-1.5 py-0.5 text-[9px] font-mono font-bold text-white shadow">
                EVIDENCE BOUNDING BOX
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
