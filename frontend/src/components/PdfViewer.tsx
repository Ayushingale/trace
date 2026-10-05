import React, { useState } from 'react';
import { Evidence } from '../api/types';
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Eye,
  Layers,
  MapPin,
} from 'lucide-react';

interface PdfViewerProps {
  currentDocId?: string;
  activeEvidence?: Evidence[];
  selectedPage?: number;
  highlightBbox?: number[];
  onPageChange?: (page: number) => void;
}

// Simulated document pages with structured text & clause content
const MOCK_DOCUMENT_PAGES: Record<number, { title: string; clauses: Array<{ num: string; text: string; isTarget?: boolean }> }> = {
  1: {
    title: 'MASTER SERVICES AGREEMENT (MSA)',
    clauses: [
      {
        num: '1. DEFINITIONS',
        text: '1.1 "Agreement" refers to this Master Services Agreement including all schedules, annexes, and statement of work executed pursuant hereto.',
      },
      {
        num: '2. TERM AND RENEWAL',
        text: '2.1 Term: This Agreement shall commence on the Effective Date and continue for twenty-four (24) months unless earlier terminated in accordance with Section 9.',
        isTarget: true,
      },
      {
        num: '3. SCOPE OF SERVICES',
        text: '3.1 Supplier shall render professional consulting and artificial intelligence verification services described in applicable SOWs in accordance with the specifications.',
      },
    ],
  },
  2: {
    title: 'SECTION 3 - DELIVERABLES & ACCEPTANCE',
    clauses: [
      {
        num: '3.2 Acceptance Testing',
        text: 'Customer shall have ten (10) business days following receipt of each deliverable to verify compliance against the applicable milestone criteria.',
      },
      {
        num: '3.3 Defect Remediation',
        text: 'In the event of a verified non-conformity, Supplier shall use commercially reasonable efforts to deliver a corrected version within five (5) calendar days.',
      },
    ],
  },
  3: {
    title: 'SECTION 4 - FEES, INVOICING & PAYMENT TERMS',
    clauses: [
      {
        num: '4.1 Invoicing Schedule',
        text: 'Fees shall be invoiced monthly in arrears based on verified timesheets or fixed milestone achievements confirmed by Customer project manager.',
      },
      {
        num: '4.2 Payment Terms',
        text: 'Section 4.2: Undisputed invoices shall be payable within thirty (30) business days following receipt of the invoice and supporting tax documentation.',
        isTarget: true,
      },
      {
        num: '4.3 Disputed Amounts',
        text: 'Customer may withhold payment of disputed charges provided written notice stating the specific basis is delivered prior to the due date.',
      },
    ],
  },
  4: {
    title: 'SECTION 5 - INTELLECTUAL PROPERTY & DATA PRIVACY',
    clauses: [
      {
        num: '5.1 Ownership',
        text: 'All pre-existing intellectual property remains vested in the respective originating party.',
      },
      {
        num: '5.2 Compliance',
        text: 'Supplier shall process personal data strictly in adherence to GDPR and relevant regional privacy regulations.',
      },
    ],
  },
  5: {
    title: 'SECTION 9 - TERMINATION & SURVIVAL',
    clauses: [
      {
        num: '9.1 Termination for Cause',
        text: 'Either party may terminate immediately if the other party commits a material breach incurable within thirty (30) days of formal notice.',
      },
      {
        num: '9.3 Termination for Convenience',
        text: '9.3 Termination for Convenience: Either party may terminate this Agreement without cause upon sixty (60) days prior written notice to the other party.',
        isTarget: true,
      },
    ],
  },
  7: {
    title: 'SECTION 11 - LIMITATION OF LIABILITY',
    clauses: [
      {
        num: '11.1 Consequential Damages',
        text: 'Except as provided in Clause 11.2, neither party shall be liable for indirect, incidental, or special consequential damages.',
      },
      {
        num: '11.2 Jurisdictional Gross Negligence',
        text: '11.2 Subject to clause 11.4, neither party excludes liability where prohibited by applicable jurisdiction laws or for gross negligence willful misconduct.',
        isTarget: true,
      },
    ],
  },
};

export const PdfViewer: React.FC<PdfViewerProps> = ({
  currentDocId = 'master_agreement.pdf',
  activeEvidence = [],
  selectedPage: initialSelectedPage = 1,
  highlightBbox,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialSelectedPage);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  // Sync if parent updates selectedPage
  React.useEffect(() => {
    if (initialSelectedPage) {
      setCurrentPage(initialSelectedPage);
    }
  }, [initialSelectedPage]);

  const pageData = MOCK_DOCUMENT_PAGES[currentPage] || {
    title: `DOCUMENT PAGE ${currentPage}`,
    clauses: [
      {
        num: 'CLAUSE CONTENT',
        text: 'Document content rendered from parsed text stream. No matching targeted clauses on this page.',
      },
    ],
  };

  const hasEvidenceOnThisPage = activeEvidence.some((e) => e.page === currentPage);
  const targetEvidence = activeEvidence.find((e) => e.page === currentPage);

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between text-xs backdrop-blur">
        {/* Document Name */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-200">{currentDocId}</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Digital PDF • Vector Text Layer
          </span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-slate-300 font-medium">
            Page <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val) && val >= 1 && val <= 8) setCurrentPage(val);
              }}
              className="w-10 text-center bg-slate-950 border border-slate-700 rounded py-0.5 font-mono text-xs text-white"
            /> of 8
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(8, p + 1))}
            disabled={currentPage >= 8}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Bounding Box Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition ${
              showBoundingBoxes
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>BBox Overlays</span>
          </button>

          <div className="flex items-center border border-slate-700 rounded-md overflow-hidden bg-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Canvas Viewport */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-950/70 relative">
        {/* PDF Simulated Sheet */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="w-full max-w-2xl min-h-[750px] bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl p-8 relative transition-transform duration-150 select-text"
        >
          {/* Header watermark/metadata */}
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-800 text-[11px] font-mono text-slate-500 uppercase">
            <span>Confidential • Legal Document Repository</span>
            <span>Doc ID: {currentDocId}</span>
            <span>Pg {currentPage}</span>
          </div>

          {/* Page Title */}
          <h2 className="text-center text-sm font-bold tracking-widest text-slate-300 mb-8 uppercase font-serif">
            {pageData.title}
          </h2>

          {/* Render Clauses */}
          <div className="space-y-6 font-serif text-[13.5px] leading-relaxed text-slate-300">
            {pageData.clauses.map((clause, idx) => {
              const isEvidenceMatch =
                hasEvidenceOnThisPage &&
                targetEvidence &&
                clause.text.toLowerCase().includes(
                  targetEvidence.passage_text.substring(0, 30).toLowerCase()
                );

              return (
                <div
                  key={idx}
                  className={`relative p-3 rounded-lg transition-all ${
                    isEvidenceMatch && showBoundingBoxes
                      ? 'bg-indigo-950/50 ring-2 ring-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Bounding Box Visual Tag */}
                  {isEvidenceMatch && showBoundingBoxes && (
                    <div className="absolute -top-3 -right-2 bg-indigo-500 text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow flex items-center gap-1 select-none animate-bounce">
                      <MapPin className="w-2.5 h-2.5" />
                      Evidence BBox Grounding
                    </div>
                  )}

                  <h3 className="font-bold text-slate-200 text-xs mb-1 font-sans tracking-wide">
                    {clause.num}
                  </h3>
                  <p className="text-slate-300 leading-relaxed font-serif">
                    {clause.text}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Footer of page */}
          <div className="absolute bottom-4 left-8 right-8 pt-4 border-t border-slate-800/60 flex justify-between text-[10px] font-mono text-slate-500">
            <span>TRACE Hybrid Retrieval Index</span>
            <span>Document Page {currentPage} of 8</span>
          </div>
        </div>
      </div>
    </div>
  );
};
