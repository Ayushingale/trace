import React from 'react';
import { Claim, Verdict } from '../api/types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  UploadCloud,
  FileCheck,
  Layers,
  MessageSquare,
  BarChart3,
  Download,
} from 'lucide-react';

interface SummaryBarProps {
  claims: Claim[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  activeView: 'studio' | 'pdf' | 'ask' | 'report';
  onViewChange: (view: 'studio' | 'pdf' | 'ask' | 'report') => void;
  onOpenUpload: () => void;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({
  claims,
  activeFilter,
  onFilterChange,
  activeView,
  onViewChange,
  onOpenUpload,
}) => {
  const total = claims.length;
  const supported = claims.filter((c) => c.verdict === 'SUPPORTED').length;
  const contradicted = claims.filter((c) => c.verdict === 'CONTRADICTED').length;
  const unsupported = claims.filter((c) => c.verdict === 'UNSUPPORTED').length;
  const needsReview = claims.filter((c) => c.verdict === 'NEEDS_REVIEW').length;

  // Calibrated factuality trust score
  const factualityScore = total > 0 ? Math.round((supported / total) * 100) : 100;

  return (
    <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Trust Score Gauge & Navigation Tabs */}
      <div className="flex items-center gap-6 flex-wrap">
        {/* Trust Score Pill */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-1.5 shadow-sm">
          <div className="relative flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Trust Score
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-extrabold text-white font-mono">
                {factualityScore}%
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Grounded</span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => onViewChange('studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'studio'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => onViewChange('pdf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'pdf'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Document & BBox</span>
          </button>

          <button
            onClick={() => onViewChange('ask')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'ask'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Ask TRACE</span>
          </button>

          <button
            onClick={() => onViewChange('report')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeView === 'report'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Audit Report</span>
          </button>
        </div>
      </div>

      {/* Middle/Right: Verdict Filter Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onFilterChange('ALL')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
            activeFilter === 'ALL'
              ? 'bg-slate-700 border-slate-500 text-white shadow'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          All ({total})
        </button>

        <button
          onClick={() => onFilterChange('SUPPORTED')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
            activeFilter === 'SUPPORTED'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow'
              : 'bg-slate-950/60 border-slate-800 text-emerald-400/80 hover:border-emerald-900/60'
          }`}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Supported ({supported})</span>
        </button>

        <button
          onClick={() => onFilterChange('CONTRADICTED')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
            activeFilter === 'CONTRADICTED'
              ? 'bg-rose-950 border-rose-500 text-rose-300 shadow'
              : 'bg-slate-950/60 border-slate-800 text-rose-400/80 hover:border-rose-900/60'
          }`}
        >
          <XCircle className="w-3 h-3 text-rose-400" />
          <span>Contradicted ({contradicted})</span>
        </button>

        <button
          onClick={() => onFilterChange('UNSUPPORTED')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
            activeFilter === 'UNSUPPORTED'
              ? 'bg-amber-950 border-amber-500 text-amber-300 shadow'
              : 'bg-slate-950/60 border-slate-800 text-amber-400/80 hover:border-amber-900/60'
          }`}
        >
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Unsupported ({unsupported})</span>
        </button>

        <button
          onClick={() => onFilterChange('NEEDS_REVIEW')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
            activeFilter === 'NEEDS_REVIEW'
              ? 'bg-purple-950 border-purple-500 text-purple-300 shadow'
              : 'bg-slate-950/60 border-slate-800 text-purple-400/80 hover:border-purple-900/60'
          }`}
        >
          <HelpCircle className="w-3 h-3 text-purple-400" />
          <span>Needs Review ({needsReview})</span>
        </button>

        {/* New Job CTA */}
        <button
          onClick={onOpenUpload}
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md transition"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>New Job</span>
        </button>
      </div>
    </div>
  );
};
