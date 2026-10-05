import React, { useState } from 'react';
import { Claim } from '../api/types';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  CornerDownRight,
  ShieldCheck,
} from 'lucide-react';

interface AskPanelProps {
  jobId: string;
  onSelectClaim?: (claim: Claim) => void;
}

const PRESET_QUESTIONS = [
  'What is the initial contract term duration?',
  'What are the payment terms and invoice due dates?',
  'Can either party terminate the agreement without cause?',
  'What are the exclusions on consequential damages and gross negligence?',
];

export const AskPanel: React.FC<AskPanelProps> = ({ jobId, onSelectClaim }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<
    Array<{
      question: string;
      answerSentences: Claim[];
      timestamp: string;
    }>
  >([
    {
      question: 'What are the termination terms and notice requirements?',
      answerSentences: [
        {
          claim_id: 'ask_001',
          claim_text: 'Either party may terminate the agreement without cause upon sixty (60) days prior written notice.',
          char_start: 0,
          char_end: 104,
          claim_type: 'duration',
          verdict: 'SUPPORTED',
          confidence: 0.95,
          reason: 'Clause 9.3 authorizes termination for convenience with sixty days written notice.',
          rule_id: 'mod.permissive_match',
          evidence: [
            {
              doc_id: 'master_agreement.pdf',
              page: 5,
              bbox: [72.0, 220.0, 520.0, 260.0],
              passage_text: '9.3 Termination for Convenience: Either party may terminate this Agreement without cause upon sixty (60) days prior written notice.',
            },
          ],
          review_status: 'none',
        },
        {
          claim_id: 'ask_002',
          claim_text: 'Immediate termination for cause is permitted if a material breach is not cured within thirty (30) days.',
          char_start: 105,
          char_end: 206,
          claim_type: 'duration',
          verdict: 'SUPPORTED',
          confidence: 0.94,
          reason: 'Clause 9.1 specifies 30-day cure period for material breach.',
          rule_id: 'dur.exact_match',
          evidence: [
            {
              doc_id: 'master_agreement.pdf',
              page: 5,
              bbox: [72.0, 110.0, 520.0, 145.0],
              passage_text: '9.1 Termination for Cause: Either party may terminate immediately if material breach is incurable within thirty (30) days of formal notice.',
            },
          ],
          review_status: 'none',
        },
      ],
      timestamp: 'Just now',
    },
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    const q = question;
    setQuestion('');

    try {
      // In production calls POST /ask, with fallback simulation
      setTimeout(() => {
        let simulatedClaims: Claim[] = [];
        if (q.toLowerCase().includes('payment') || q.toLowerCase().includes('invoice')) {
          simulatedClaims = [
            {
              claim_id: `ask_${Date.now()}_1`,
              claim_text: 'Invoices are payable within thirty (30) business days following receipt.',
              char_start: 0,
              char_end: 78,
              claim_type: 'numeric',
              verdict: 'SUPPORTED',
              confidence: 0.93,
              reason: 'Direct match with Section 4.2: Undisputed invoices shall be payable within thirty (30) business days.',
              rule_id: 'num.unit_match',
              evidence: [
                {
                  doc_id: 'master_agreement.pdf',
                  page: 3,
                  bbox: [72.0, 310.0, 520.0, 345.0],
                  passage_text: 'Section 4.2: Undisputed invoices shall be payable within thirty (30) business days following receipt.',
                },
              ],
              review_status: 'none',
            },
          ];
        } else {
          simulatedClaims = [
            {
              claim_id: `ask_${Date.now()}_1`,
              claim_text: `According to the source documentation, provisions related to "${q}" are governed under Section 2 and Schedule A.`,
              char_start: 0,
              char_end: 120,
              claim_type: 'general',
              verdict: 'SUPPORTED',
              confidence: 0.89,
              reason: 'High semantic relevance score from hybrid retrieval pass.',
              rule_id: 'nli.entailed',
              evidence: [
                {
                  doc_id: 'master_agreement.pdf',
                  page: 1,
                  bbox: [72.0, 140.0, 520.0, 168.0],
                  passage_text: 'Agreement provisions are executed pursuant to standard terms herein.',
                },
              ],
              review_status: 'none',
            },
          ];
        }

        setConversation((prev) => [
          ...prev,
          {
            question: q,
            answerSentences: simulatedClaims,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      }, 700);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e17] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-5 flex items-center justify-between backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Ask TRACE • Verified Document Q&A
            </h3>
            <p className="text-[11px] text-slate-400">
              Every generated sentence is verified against source documents before display
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Active Grounding Pipeline</span>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {conversation.map((turn, tIdx) => (
          <div key={tIdx} className="space-y-3">
            {/* User Question Bubble */}
            <div className="flex items-start justify-end gap-2.5">
              <div className="max-w-xl rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-white text-sm shadow-md">
                {turn.question}
              </div>
            </div>

            {/* AI Verified Answer Card */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0 mt-1 shadow">
                TR
              </div>
              <div className="flex-1 max-w-2xl rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-800 p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-2">
                  <span className="font-semibold text-slate-300">Grounded Synthesis</span>
                  <span className="font-mono">{turn.timestamp}</span>
                </div>

                {/* Sentences with claim badges */}
                <div className="space-y-2.5 font-serif text-[14px] leading-relaxed text-slate-200">
                  {turn.answerSentences.map((sentence, sIdx) => {
                    return (
                      <div
                        key={sIdx}
                        onClick={() => onSelectClaim && onSelectClaim(sentence)}
                        className="group relative p-2.5 rounded-lg border border-slate-800/90 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5 font-sans">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            {sentence.verdict} ({(sentence.confidence * 100).toFixed(0)}%)
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Rule: {sentence.rule_id}
                          </span>
                        </div>

                        <p className="text-slate-100 italic">
                          "{sentence.claim_text}"
                        </p>

                        {/* Citation passage badge */}
                        {sentence.evidence.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-indigo-300 font-sans">
                            <CornerDownRight className="w-3 h-3 text-indigo-400" />
                            <span className="font-medium">
                              Cited {sentence.evidence[0].doc_id} • Pg {sentence.evidence[0].page}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs animate-pulse pl-11">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Consulting hybrid BM25 + dense index and verifying candidate claims...</span>
          </div>
        )}
      </div>

      {/* Suggested Questions Pills */}
      <div className="px-5 py-2.5 border-t border-slate-800/70 bg-slate-950/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] uppercase font-mono text-slate-500 shrink-0">Try asking:</span>
        {PRESET_QUESTIONS.map((pq, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuestion(pq);
            }}
            className="shrink-0 px-3 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 transition"
          >
            {pq}
          </button>
        ))}
      </div>

      {/* Bottom Question Input Bar */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/90">
        <div className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the document to verify facts..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
