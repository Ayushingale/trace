import React, { useState } from 'react';
import {
  ShieldCheck,
  HelpCircle,
  UploadCloud,
  FileText,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';
import { useTraceStore } from '../store/useTraceStore';
import { Claim, Verdict } from '../api/types';

export const LeftPanel: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    sourceText,
    setSourceText,
    askQuestion,
    setAskQuestion,
    chatHistory,
    clearChat,
    startStreamingDemo,
    isStreaming,
    claims,
    selectedClaimId,
    selectClaim,
    uploadedFiles,
    setUploadedFiles,
  } = useTraceStore();

  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setUploadProgress(15);
    const timer = setInterval(() => {
      setUploadProgress((p) => {
        if (p === null || p >= 100) {
          clearInterval(timer);
          setUploadedFiles([...uploadedFiles, ...newFiles]);
          return null;
        }
        return p + 25;
      });
    }, 150);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim() || isStreaming) return;
    startStreamingDemo();
  };

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuestion.trim() || isStreaming) return;
    startStreamingDemo();
  };

  const getVerdictUnderline = (verdict?: Verdict) => {
    switch (verdict) {
      case 'SUPPORTED':
        return 'border-b-2 border-emerald-500 bg-emerald-500/10 text-emerald-200';
      case 'CONTRADICTED':
        return 'border-b-2 border-rose-500 bg-rose-500/10 text-rose-200';
      case 'UNSUPPORTED':
        return 'border-b-2 border-amber-500 bg-amber-500/10 text-amber-200';
      case 'NEEDS_REVIEW':
        return 'border-b-2 border-purple-500 bg-purple-500/10 text-purple-200';
      default:
        return 'border-b-2 border-slate-600 bg-slate-800/40 text-slate-300 animate-pulse';
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0b101b] border-r border-slate-800/90 text-slate-200 select-none">
      {/* Top Header & Tabs */}
      <div className="flex flex-col border-b border-slate-800/90 bg-[#0e1422] p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Verification Engine
              </h2>
              <span className="text-[10px] text-slate-400">Claim Extraction & Ingestion</span>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition-colors"
            title="Clear Chat & Reset Claims"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
              activeTab === 'verify'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Verify Text</span>
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all ${
              activeTab === 'ask'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Ask Source</span>
          </button>
        </div>
      </div>

      {/* Main Chat / Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500">
              <span className="font-semibold uppercase tracking-wider">
                {msg.role === 'user' ? 'You' : 'TRACE Assistant'}
              </span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`rounded-2xl p-3.5 text-xs leading-relaxed max-w-[95%] shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-600/90 text-white rounded-br-sm border border-blue-500/40'
                  : 'bg-slate-900/90 text-slate-200 rounded-bl-sm border border-slate-800'
              }`}
            >
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                /* Annotated text view with verdict underline and blue numbered pill badges */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-blue-400">
                      <Sparkles className="h-3.5 w-3.5" /> Grounded Analysis
                    </span>
                    <span className="font-mono text-[10px]">
                      {claims.length} claims verified
                    </span>
                  </div>

                  <div className="leading-relaxed select-text font-sans text-slate-300">
                    {claims.length > 0 ? (
                      claims.map((claim, idx) => {
                        const isSelected = selectedClaimId === claim.claim_id;
                        return (
                          <span
                            key={claim.claim_id}
                            onClick={() => selectClaim(claim.claim_id)}
                            className={`inline cursor-pointer rounded px-1 py-0.5 transition-all duration-200 mr-1.5 ${getVerdictUnderline(
                              claim.verdict
                            )} ${
                              isSelected
                                ? 'ring-2 ring-blue-400 bg-blue-500/20 font-medium'
                                : 'hover:bg-slate-800'
                            }`}
                          >
                            <span>{claim.claim_text}</span>
                            {/* Blue pill badge like reference */}
                            <span
                              className={`inline-flex items-center justify-center rounded-full ml-1 px-1.5 py-0.2 text-[9px] font-mono font-bold transition-transform ${
                                isSelected
                                  ? 'bg-blue-500 text-white ring-2 ring-white scale-110'
                                  : 'bg-blue-600 hover:bg-blue-500 text-white'
                              }`}
                              title={`Claim [${idx + 1}] - Click to trace lineage`}
                            >
                              [{idx + 1}]
                            </span>
                          </span>
                        );
                      })
                    ) : (
                      <p className="text-slate-400 italic">{msg.content}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live checking animation during streaming */}
        {isStreaming && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-xs text-slate-400 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span>Resolving atomic claims against hybrid evidence...</span>
          </div>
        )}
      </div>

      {/* Input / Control Footer */}
      <div className="border-t border-slate-800/90 bg-[#0e1422] p-3 space-y-2.5">
        {/* Source File Attachment Bar */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-xs transition-colors cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10 text-blue-300'
              : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
          }`}
          onClick={() => document.getElementById('file-upload-input')?.click()}
        >
          <input
            id="file-upload-input"
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <div className="flex items-center gap-2 min-w-0">
            <UploadCloud className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="truncate">
              {uploadedFiles.length > 0
                ? `${uploadedFiles.length} file(s) attached`
                : 'Upload Source PDF / Agreement'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">PDF, TXT</span>
        </div>

        {uploadProgress !== null && (
          <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
            <div
              className="bg-blue-500 h-1 transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Tab 1: Verify Input Form */}
        {activeTab === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-2">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste generated summary or contract clauses to verify..."
              rows={3}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setSourceText(
                    'The contract term is fixed for a period of 24 months. Payment is due within 30 days of invoice receipt. The supplier holds ISO 27001 certification across all global data centers. Either party may terminate without cause by giving 60 days written notice. Liability for consequential damages is uncapped under gross negligence.'
                  )
                }
                className="text-[10px] text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Reset Sample Contract
              </button>

              <button
                type="submit"
                disabled={isStreaming || !sourceText.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition-all"
              >
                {isStreaming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                <span>Verify Claims</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Ask Input Form */}
        {activeTab === 'ask' && (
          <form onSubmit={handleAskSubmit} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder="Ask question against ground source documents..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-3 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isStreaming || !askQuestion.trim()}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Retrieves top passages and validates answers with cross-encoder NLI & deterministic checks.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
