import React from 'react';
import { Evidence } from '../api/types';
import { FileText, MapPin, ExternalLink, Check, Copy } from 'lucide-react';

interface EvidenceCardProps {
  evidence: Evidence;
  index: number;
  onViewInDoc?: (docId: string, page: number, bbox: number[]) => void;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({
  evidence,
  index,
  onViewInDoc,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(evidence.passage_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bboxString = Array.isArray(evidence.bbox)
    ? evidence.bbox.map((b) => Math.round(b)).join(', ')
    : 'N/A';

  return (
    <div className="group relative rounded-xl border border-slate-700/70 bg-slate-900/60 p-4 transition-all duration-200 hover:border-slate-600 hover:bg-slate-900/90 shadow-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              {evidence.doc_id}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-mono text-indigo-400 font-medium">Page {evidence.page}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 font-mono text-slate-500">
                <MapPin className="w-2.5 h-2.5" />
                BBox: [{bboxString}]
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy Passage Text"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onViewInDoc && (
            <button
              onClick={() => onViewInDoc(evidence.doc_id, evidence.page, evidence.bbox as number[])}
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition"
            >
              <span>View in PDF</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Verbatim Passage Quote */}
      <div className="relative rounded-lg bg-slate-950/80 border border-slate-800/80 p-3.5 text-slate-200 font-serif text-sm leading-relaxed">
        <div className="text-slate-500 text-lg leading-none mb-1 font-serif select-none">“</div>
        <p className="italic text-slate-200">{evidence.passage_text}</p>
        <div className="text-slate-500 text-lg leading-none text-right font-serif select-none">”</div>
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Grounded Citation #{index + 1}
        </span>
        <span className="font-mono text-slate-400">Hybrid BM25 + Dense Reranked</span>
      </div>
    </div>
  );
};
