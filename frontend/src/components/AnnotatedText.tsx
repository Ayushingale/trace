import React, { useState } from 'react';
import { Claim, Verdict } from '../api/types';
import { Sparkles, Edit3, Eye, CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface AnnotatedTextProps {
  text: string;
  claims: Claim[];
  selectedClaimId: string;
  onSelectClaim: (claimId: string) => void;
  onTextChange?: (newText: string) => void;
}

const VERDICT_HIGHLIGHT_STYLES: Record<
  Verdict,
  {
    bg: string;
    border: string;
    badge: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  SUPPORTED: {
    bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    border: 'border-b-2 border-emerald-500',
    badge: 'bg-emerald-950 text-emerald-300 border-emerald-700/50',
    text: 'text-emerald-200',
    icon: <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5 text-emerald-400" />,
  },
  CONTRADICTED: {
    bg: 'bg-rose-500/20 hover:bg-rose-500/30',
    border: 'border-b-2 border-rose-500',
    badge: 'bg-rose-950 text-rose-300 border-rose-700/50',
    text: 'text-rose-200',
    icon: <XCircle className="w-2.5 h-2.5 inline mr-0.5 text-rose-400" />,
  },
  UNSUPPORTED: {
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    border: 'border-b-2 border-amber-500',
    badge: 'bg-amber-950 text-amber-300 border-amber-700/50',
    text: 'text-amber-200',
    icon: <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5 text-amber-400" />,
  },
  NEEDS_REVIEW: {
    bg: 'bg-purple-500/20 hover:bg-purple-500/30',
    border: 'border-b-2 border-purple-500',
    badge: 'bg-purple-950 text-purple-300 border-purple-700/50',
    text: 'text-purple-200',
    icon: <HelpCircle className="w-2.5 h-2.5 inline mr-0.5 text-purple-400" />,
  },
};

export const AnnotatedText: React.FC<AnnotatedTextProps> = ({
  text,
  claims,
  selectedClaimId,
  onSelectClaim,
  onTextChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(text);

  // If text prop updates, keep editableText in sync
  React.useEffect(() => {
    setEditableText(text);
  }, [text]);

  // Construct segments: sort claims by character start
  const renderAnnotatedContent = () => {
    if (!claims || claims.length === 0) {
      return <p className="text-slate-300 leading-relaxed font-serif text-base">{text}</p>;
    }

    // Sort claims by start offset
    const sorted = [...claims].sort((a, b) => a.char_start - b.char_start);
    const segments: React.ReactNode[] = [];
    let currentIndex = 0;

    sorted.forEach((claim, index) => {
      // Find start & end inside the text
      let start = claim.char_start;
      let end = claim.char_end;

      // Fallback: if character offsets don't align with text length, locate claim_text directly
      if (start >= text.length || text.substring(start, end) !== claim.claim_text) {
        const found = text.indexOf(claim.claim_text, currentIndex);
        if (found !== -1) {
          start = found;
          end = found + claim.claim_text.length;
        } else {
          // If still not found, search from 0
          const foundFromZero = text.indexOf(claim.claim_text);
          if (foundFromZero !== -1) {
            start = foundFromZero;
            end = foundFromZero + claim.claim_text.length;
          }
        }
      }

      // Add preceding plain text
      if (start > currentIndex && currentIndex < text.length) {
        segments.push(
          <span key={`plain-${currentIndex}`} className="text-slate-300 leading-relaxed">
            {text.substring(currentIndex, Math.min(start, text.length))}
          </span>
        );
      }

      // Add highlighted claim segment
      const isSelected = claim.claim_id === selectedClaimId;
      const style = VERDICT_HIGHLIGHT_STYLES[claim.verdict] || VERDICT_HIGHLIGHT_STYLES.NEEDS_REVIEW;
      const claimTextToShow =
        start < text.length ? text.substring(start, Math.min(end, text.length)) : claim.claim_text;

      segments.push(
        <mark
          key={`claim-${claim.claim_id}-${index}`}
          onClick={() => onSelectClaim(claim.claim_id)}
          className={`relative inline cursor-pointer px-1 py-0.5 mx-0.5 rounded transition-all duration-150 ${
            style.bg
          } ${style.border} ${
            isSelected
              ? 'ring-2 ring-indigo-400 shadow-md shadow-indigo-950/50 font-medium'
              : ''
          }`}
          title={`${claim.verdict} (${Math.round(claim.confidence * 100)}%): ${claim.reason}`}
        >
          <span className={`${style.text}`}>{claimTextToShow}</span>
          <span
            className={`inline-flex items-center text-[10px] font-mono font-semibold px-1 py-0.2 mx-1 rounded border align-super select-none ${style.badge}`}
          >
            {style.icon}
            {claim.claim_id.replace('c_', 'C')}
          </span>
        </mark>
      );

      currentIndex = Math.max(currentIndex, end);
    });

    // Add trailing text
    if (currentIndex < text.length) {
      segments.push(
        <span key={`plain-tail`} className="text-slate-300 leading-relaxed">
          {text.substring(currentIndex)}
        </span>
      );
    }

    return segments;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-xl border border-slate-800/80 overflow-hidden shadow-inner">
      {/* Header bar */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            AI-Generated Document Text
          </span>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
            {claims.length} Atomic Claims Identified
          </span>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isEditing && onTextChange) {
                onTextChange(editableText);
              }
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Annotated View</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Source</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 font-serif text-[15px] leading-relaxed select-text">
        {isEditing ? (
          <div className="flex flex-col h-full gap-2">
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full h-full bg-slate-950/70 border border-slate-700/80 rounded-lg p-4 font-mono text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
              placeholder="Paste AI-generated text or answer here..."
            />
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>{editableText.length} characters • {editableText.split(/\s+/).filter(Boolean).length} words</span>
              {onTextChange && (
                <button
                  onClick={() => {
                    onTextChange(editableText);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition"
                >
                  Apply & Re-verify
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-4">
            <div className="leading-8 text-slate-200">
              {renderAnnotatedContent()}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Legend Footer */}
      <div className="px-4 py-2.5 border-t border-slate-800/60 bg-slate-950/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400">
        <span className="font-semibold text-slate-500">Legend:</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Supported
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Contradicted
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Unsupported
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span> Needs Review
          </span>
        </div>
        <span className="text-[10px] text-slate-500 italic">Click highlighted claim to inspect evidence</span>
      </div>
    </div>
  );
};
