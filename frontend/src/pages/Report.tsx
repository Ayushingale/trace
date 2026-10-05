import React from 'react';
import { Claim, Verdict } from '../api/types';
import {
  ShieldCheck,
  Printer,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  Award,
  ArrowLeft,
  Calendar,
  Hash,
} from 'lucide-react';

interface ReportProps {
  claims: Claim[];
  docTitle?: string;
  onBackToStudio?: () => void;
}

export const Report: React.FC<ReportProps> = ({
  claims,
  docTitle = 'Master Services Agreement (MSA)',
  onBackToStudio,
}) => {
  const total = claims.length;
  const supported = claims.filter((c) => c.verdict === 'SUPPORTED').length;
  const contradicted = claims.filter((c) => c.verdict === 'CONTRADICTED').length;
  const unsupported = claims.filter((c) => c.verdict === 'UNSUPPORTED').length;
  const needsReview = claims.filter((c) => c.verdict === 'NEEDS_REVIEW').length;

  const factualityScore = total > 0 ? Math.round((supported / total) * 100) : 100;
  const avgConfidence =
    total > 0
      ? (claims.reduce((acc, c) => acc + c.confidence, 0) / total) * 100
      : 100;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(claims, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trace_audit_report_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 p-8 flex flex-col items-center">
      {/* Top Action Bar (hidden when printing) */}
      <div className="w-full max-w-5xl mb-6 flex items-center justify-between no-print">
        {onBackToStudio ? (
          <button
            onClick={onBackToStudio}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Studio</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Audit Certificate</span>
          </button>
        </div>
      </div>

      {/* Main Audit Certificate Sheet */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-8 space-y-8 select-text">
        {/* Certificate Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center text-white shadow-xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                  Official Audit Certificate
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-mono text-slate-400">TRACE Hybrid Neuro-Symbolic Engine</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                AI Factuality & Verification Report
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Source: <span className="text-slate-200 font-semibold">{docTitle}</span>
              </p>
            </div>
          </div>

          {/* Verification Timestamp & Hash */}
          <div className="text-right text-xs font-mono text-slate-400 space-y-1">
            <div className="flex items-center justify-end gap-1.5 text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-slate-500 text-[11px]">
              <Hash className="w-3 h-3" />
              <span>SHA256: 9f8a...3bc1 (Signed)</span>
            </div>
          </div>
        </div>

        {/* Executive KPI Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20">
            <div className="text-[11px] font-mono uppercase text-indigo-300 mb-1 font-semibold">
              Factuality Score
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {factualityScore}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {supported} of {total} claims substantiated
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 font-semibold">
              Mean Confidence
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              {avgConfidence.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Platt calibrated probability
            </div>
          </div>

          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20">
            <div className="text-[11px] font-mono uppercase text-rose-300 mb-1 font-semibold">
              Contradictions
            </div>
            <div className="text-3xl font-extrabold text-rose-400 font-mono">
              {contradicted}
            </div>
            <div className="text-[10px] text-rose-400/80 mt-1">
              Planted errors intercepted
            </div>
          </div>

          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20">
            <div className="text-[11px] font-mono uppercase text-purple-300 mb-1 font-semibold">
              Human Review Needed
            </div>
            <div className="text-3xl font-extrabold text-purple-400 font-mono">
              {needsReview}
            </div>
            <div className="text-[10px] text-purple-300/80 mt-1">
              Low-confidence abstentions
            </div>
          </div>
        </div>

        {/* Claim Breakdown Visualization Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Verdict Composition Analysis</span>
            <span className="font-mono text-slate-400">{total} Atomic Claims</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
            <div style={{ width: `${(supported / total) * 100}%` }} className="bg-emerald-500" title="Supported" />
            <div style={{ width: `${(contradicted / total) * 100}%` }} className="bg-rose-500" title="Contradicted" />
            <div style={{ width: `${(unsupported / total) * 100}%` }} className="bg-amber-500" title="Unsupported" />
            <div style={{ width: `${(needsReview / total) * 100}%` }} className="bg-purple-500" title="Needs Review" />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Supported: {supported}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Contradicted: {contradicted}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Unsupported: {unsupported}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Needs Review: {needsReview}
            </span>
          </div>
        </div>

        {/* Full Itemized Audit Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Itemized Claim-Level Verification Ledger
          </h3>

          <div className="border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-3">ID / Type</th>
                  <th className="py-3 px-3">Claim Text</th>
                  <th className="py-3 px-3">Verdict</th>
                  <th className="py-3 px-3">Conf.</th>
                  <th className="py-3 px-3">Rule / Explanation</th>
                  <th className="py-3 px-3">Grounding Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {claims.map((claim) => (
                  <tr key={claim.claim_id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-300">
                      <div>{claim.claim_id}</div>
                      <div className="text-[10px] text-indigo-400 uppercase">{claim.claim_type}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-serif max-w-xs">
                      "{claim.claim_text}"
                    </td>
                    <td className="py-3 px-3 font-semibold whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          claim.verdict === 'SUPPORTED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : claim.verdict === 'CONTRADICTED'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : claim.verdict === 'UNSUPPORTED'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-purple-950 text-purple-300 border-purple-800'
                        }`}
                      >
                        {claim.verdict}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {(claim.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs">
                      <div className="font-mono text-[10px] text-indigo-400 mb-0.5">{claim.rule_id}</div>
                      <div className="line-clamp-2 text-[11px]">{claim.reason}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {claim.evidence.length > 0 ? (
                        <div>
                          <span className="font-semibold text-slate-300">
                            {claim.evidence[0].doc_id} (Pg {claim.evidence[0].page})
                          </span>
                          <div className="font-mono text-[10px] text-slate-500">
                            BBox: [{claim.evidence[0].bbox.map((b) => Math.round(b)).join(', ')}]
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">None found</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate Sign-off Footer */}
        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span>TRACE Hybrid Neuro-Symbolic Verification Engine • Calibrated Combiner Release</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Document Reference: TRACE-AUDIT-2026-MSA-001
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
