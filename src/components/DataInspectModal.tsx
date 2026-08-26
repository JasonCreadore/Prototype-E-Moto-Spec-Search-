import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText, FileCode, Database } from 'lucide-react';
import { EMOTO_DATASET, getDatasetAsCSV } from '../data/emoto_data';

interface DataInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataInspectModal: React.FC<DataInspectModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'json' | 'csv' | 'schema'>('json');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(EMOTO_DATASET, null, 2);
  const csvString = getDatasetAsCSV();

  const handleCopy = () => {
    const textToCopy = tab === 'json' ? jsonString : tab === 'csv' ? csvString : schemaDoc;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isJson = tab === 'json' || tab === 'schema';
    const content = tab === 'csv' ? csvString : jsonString;
    const mime = tab === 'csv' ? 'text/csv' : 'application/json';
    const filename = tab === 'csv' ? 'emoto_specifications.csv' : 'emoto_specifications.json';

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const schemaDoc = `Database Schema Specification:
------------------------------------------
• make (string): Manufacturer (e.g. Sur-Ron, Talaria, Stark Future)
• category (string): Riding category (e.g. Lightweight Trail, Mid-Weight Enduro, Full-Size Motocross)
• price_usd (number): Base MSRP in US Dollars
• battery_kwh (number): Battery pack energy capacity in kilowatt-hours
• voltage_v (number): Nominal system voltage (e.g. 60V, 72V, 104V, 360V)
• top_speed_mph (number): Factory top speed in miles per hour
• peak_power_kw (number): Peak motor output in kilowatts
• range_miles (number): Estimated mixed-trail riding range
• weight_lbs (number): Total curb weight in pounds
• skill_level (string): Beginner, All Levels, Intermediate, or Expert
• semantic_summary (string): Comprehensive natural language riding dynamics and terrain suitability summary used by Gemini LLM for strict grounding.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Database className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">E-Moto Static Data Foundation</h3>
              <p className="text-xs text-slate-400">Underlying JSON / CSV dataset for client-side filtering & Gemini grounding</p>
            </div>
          </div>

          <button
            id="close-data-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Actions */}
        <div className="px-5 py-3 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'json'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON ({EMOTO_DATASET.length} records)</span>
            </button>

            <button
              onClick={() => setTab('csv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'csv'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CSV Format</span>
            </button>

            <button
              onClick={() => setTab('schema')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'schema'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Schema Specification</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/90 hover:bg-orange-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {tab === 'csv' ? 'CSV' : 'JSON'}</span>
            </button>
          </div>
        </div>

        {/* Code / Content Area */}
        <div className="p-4 flex-1 overflow-auto bg-slate-950">
          <pre className="font-mono text-xs text-slate-300 whitespace-pre leading-relaxed selection:bg-orange-500/30 selection:text-white">
            {tab === 'json' ? jsonString : tab === 'csv' ? csvString : schemaDoc}
          </pre>
        </div>
      </div>
    </div>
  );
};
