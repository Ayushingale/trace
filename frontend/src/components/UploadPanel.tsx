import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  Layers,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Claim } from '../api/types';

interface UploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartVerification: (files: File[], text: string, samplePresetKey?: string) => void;
}

const DEMO_PRESETS = [
  {
    key: 'msa',
    title: 'Master Services Agreement (MSA)',
    category: 'Legal Contract',
    description: 'Corporate agreement with planted numeric duration & notice discrepancies.',
    sampleFile: 'master_agreement.pdf (142 KB)',
    sampleText:
      'The contract term is fixed for a period of 24 months. Payment is due within 30 days of invoice receipt. The supplier holds ISO 27001 certification across all global data centers. Either party may terminate without cause by giving 60 days written notice. Liability for consequential damages is uncapped under gross negligence.',
  },
  {
    key: 'clinical',
    title: 'Phase III Oncology Clinical Trial',
    category: 'Biomedical & Healthcare',
    description: 'FDA registration trial verifying primary endpoints, dosing, and safety results.',
    sampleFile: 'clinical_protocol_phase3.pdf (890 KB)',
    sampleText:
      'The primary endpoint was met with a 42% reduction in progression risk (p < 0.001). Maximum tolerated dosage was determined to be 150mg twice daily with zero reported Grade 4 toxicities. All patients demonstrated sustained antibody titers through 12 months of follow-up.',
  },
  {
    key: 'financial',
    title: 'Q4 SEC Form 10-K Filing',
    category: 'Financial Regulatory',
    description: 'Corporate earnings report verifying GAAP revenue and forward guidance figures.',
    sampleFile: 'sec_10k_filing_2025.pdf (1.2 MB)',
    sampleText:
      'Total consolidated GAAP revenue reached $4.2 billion, representing an 18% year-over-year increase. Operating margin expanded by 340 basis points to 28.5%. Free cash flow generation exceeded management guidance by $120 million.',
  },
];

export const UploadPanel: React.FC<UploadPanelProps> = ({
  isOpen,
  onClose,
  onStartVerification,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('msa');
  const [inputText, setInputText] = useState<string>(DEMO_PRESETS[0].sampleText);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepIndex, setStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const PIPELINE_STEPS = [
    'Parsing Document Structure & Extracting Bounding Boxes',
    'Building Hybrid BM25 & Dense Embedding Index',
    'Segmenting Text into Atomic Claims',
    'Routing Claims to Deterministic Rule Checkers',
    'Executing Cross-Encoder Reranker & NLI Models',
    'Calibrating Combiner Abstention & Producing Final Verdicts',
  ];

  const handleSelectPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const found = DEMO_PRESETS.find((p) => p.key === presetKey);
    if (found) {
      setInputText(found.sampleText);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
    }
  };

  const handleLaunch = () => {
    setIsProcessing(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= PIPELINE_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          onStartVerification(uploadedFiles, inputText, selectedPreset);
          onClose();
        }, 500);
      } else {
        setStepIndex(current);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                New Verification Job
              </h2>
              <p className="text-xs text-slate-400">
                Cross-reference AI summary against ground truth document passages
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              1. Choose Evaluation Preset or Upload Custom Files
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DEMO_PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.key;
                return (
                  <div
                    key={preset.key}
                    onClick={() => handleSelectPreset(preset.key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
                        {preset.category}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 mb-1">{preset.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                      {preset.description}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-400" />
                      {preset.sampleFile}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`p-5 rounded-xl border-2 border-dashed transition text-center flex flex-col items-center justify-center cursor-pointer ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                multiple
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.txt"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <FileText className="w-7 h-7 text-indigo-400 mb-2" />
                <span className="text-xs font-semibold text-slate-200">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} file(s) attached`
                    : 'Drop PDF, DOCX, or contract files here (or click to browse)'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  Supports digital PDFs with bounding boxes and vector text layers
                </span>
              </label>
            </div>
          </div>

          {/* AI Text Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                2. AI-Generated Text to Verify
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {inputText.length} characters
              </span>
            </div>
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed"
              placeholder="Paste generated response, summary, or report here..."
            />
          </div>

          {/* Pipeline Step Progress if active */}
          {isProcessing && (
            <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 space-y-3">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
                <span className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                  Step {stepIndex + 1} of {PIPELINE_STEPS.length}: {PIPELINE_STEPS[stepIndex]}
                </span>
                <span className="font-mono">{Math.round(((stepIndex + 1) / PIPELINE_STEPS.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${((stepIndex + 1) / PIPELINE_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Calibrated Neuro-Symbolic Verification Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={!inputText.trim() || isProcessing}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-semibold shadow-lg shadow-indigo-950 transition disabled:opacity-40"
            >
              <span>{isProcessing ? 'Verifying...' : 'Launch Verification'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
