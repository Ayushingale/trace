import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Maximize2,
  Minimize2,
  FileCheck,
  User,
  SlidersHorizontal,
  FileText,
  Activity,
  Sparkles,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useTraceStore } from '../store/useTraceStore';
import { Verdict } from '../api/types';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  onOpenLogin: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenLogin }) => {
  const {
    searchQuery,
    setSearchQuery,
    verdictFilters,
    toggleVerdictFilter,
    resetFilters,
    isFullscreen,
    toggleFullscreen,
    useMocks,
    setUseMocks,
    exportAuditJson,
  } = useTraceStore();

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const navigate = useNavigate();

  const verdicts: { label: string; value: Verdict; color: string }[] = [
    { label: 'Supported', value: 'SUPPORTED', color: '#22c55e' },
    { label: 'Contradicted', value: 'CONTRADICTED', color: '#ef4444' },
    { label: 'Unsupported', value: 'UNSUPPORTED', color: '#f59e0b' },
    { label: 'Needs Review', value: 'NEEDS_REVIEW', color: '#a855f7' },
  ];

  const handlePrintReport = () => {
    navigate('/jobs/job_demo_msa/report');
  };

  return (
    <header className="relative z-30 flex h-14 w-full items-center justify-between border-b border-slate-800/90 bg-[#080c14]/95 px-4 backdrop-blur-md select-none">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider text-white">TRACE</h1>
              <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-cyan-400">
                v1.0 VISUALIZER
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 leading-none">
              Source Trace Lineage & Grounding Graph
            </p>
          </div>
        </div>

        {/* Mock / Live Backend Indicator Toggle */}
        <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-slate-800">
          <button
            onClick={() => setUseMocks(!useMocks)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-mono font-medium transition-all ${
              useMocks
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
            }`}
            title="Click to toggle between offline mock claims and live SSE backend stream"
          >
            <Database className="h-3 w-3" />
            <span>Mode: {useMocks ? 'Mocks (claims.json)' : 'Live SSE Backend'}</span>
          </button>
        </div>
      </div>

      {/* Center Search & Filters */}
      <div className="flex items-center gap-2 max-w-md w-full mx-4">
        {/* Search nodes input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes by claim, clause, or rule ID..."
            className="h-8 w-full rounded-lg bg-slate-900/90 border border-slate-800 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-xs text-slate-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Verdicts Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors ${
              verdictFilters.size < 4
                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filter</span>
            {verdictFilters.size < 4 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                {verdictFilters.size}
              </span>
            )}
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 top-10 w-48 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-40 space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 border-b border-slate-800">
                <span className="font-semibold uppercase tracking-wider text-[9px]">Filter Verdicts</span>
                <button
                  onClick={resetFilters}
                  className="text-blue-400 hover:text-blue-300 text-[10px]"
                >
                  Reset
                </button>
              </div>
              {verdicts.map((v) => {
                const checked = verdictFilters.has(v.value);
                return (
                  <button
                    key={v.value}
                    onClick={() => toggleVerdictFilter(v.value)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: v.color }}
                      />
                      <span>{v.label}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {checked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Report, Download, Fullscreen, User */}
      <div className="flex items-center gap-2">
        {/* Executive Report Button */}
        <button
          onClick={handlePrintReport}
          className="hidden md:flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 text-xs font-medium text-slate-200 hover:text-white transition-colors"
          title="Open Audit Report view"
        >
          <FileText className="h-3.5 w-3.5 text-blue-400" />
          <span>Report</span>
        </button>

        {/* Download Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 text-xs font-medium text-slate-200 hover:text-white transition-colors"
            title="Download trace data"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {showDownloadDropdown && (
            <div className="absolute right-0 top-10 w-44 rounded-xl bg-slate-900 border border-slate-800 p-1.5 shadow-2xl z-40 space-y-1">
              <button
                onClick={() => {
                  exportAuditJson();
                  setShowDownloadDropdown(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <Database className="h-3.5 w-3.5 text-blue-400" />
                <span>Export Audit JSON</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowDownloadDropdown(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>

        {/* Login / Profile Modal Trigger */}
        <button
          onClick={onOpenLogin}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 px-2.5 text-xs font-semibold text-blue-300 transition-colors"
          title="Account / Session"
        >
          <User className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign In</span>
        </button>
      </div>
    </header>
  );
};
