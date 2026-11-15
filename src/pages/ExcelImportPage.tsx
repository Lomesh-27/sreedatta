import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ArrowRight,
  Database,
  FileCheck
} from 'lucide-react';
import { parseAndValidateUploadedFile, ExcelImportValidationResult } from '../services/excelService';
import { commitImportData } from '../db/warehouseDB';
import { generateId } from '@shared/calculations';
import { ImportHistory } from '@shared/schema';

export const ExcelImportPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ExcelImportValidationResult | null>(null);
  const [commitStatus, setCommitStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [commitMessage, setCommitMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = e.target.files[0];
    setFile(selected);
    setCommitStatus('IDLE');
    setCommitMessage('');

    setIsProcessing(true);
    try {
      const result = await parseAndValidateUploadedFile(selected);
      setValidationResult(result);
    } catch (err: any) {
      alert(`Error reading spreadsheet: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (!validationResult) return;

    if (validationResult.validCount === 0) {
      alert('No new valid records found in this file to import.');
      return;
    }

    const confirmMsg =
      `Confirm importing ${validationResult.validCount} valid records into local IndexedDB?\n` +
      `Duplicates skipped: ${validationResult.duplicateCount}\n` +
      `Errors skipped: ${validationResult.invalidCount}`;

    if (!window.confirm(confirmMsg)) return;

    setCommitStatus('SAVING');
    try {
      const historyRecord: ImportHistory = {
        id: generateId('IMP'),
        filename: validationResult.fileName,
        importedAt: new Date().toISOString(),
        totalSheets: validationResult.totalSheets,
        totalRows: validationResult.totalRows,
        validRows: validationResult.validCount,
        duplicateRows: validationResult.duplicateCount,
        invalidRows: validationResult.invalidCount,
        status: validationResult.invalidCount > 0 ? 'PARTIAL' : 'SUCCESS',
        summaryJson: JSON.stringify({
          products: validationResult.parsed.products.length,
          stockIn: validationResult.parsed.stockIn.length,
          stockOut: validationResult.parsed.stockOut.length,
          sales: validationResult.parsed.sales.length,
          payments: validationResult.parsed.payments.length
        })
      };

      await commitImportData(validationResult.parsed, historyRecord);

      setCommitStatus('SUCCESS');
      setCommitMessage(
        `Successfully imported ${validationResult.validCount} records into SreeDattaWarehouseDB!`
      );
    } catch (err: any) {
      setCommitStatus('ERROR');
      setCommitMessage(`Failed to save records: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Excel / CSV Import Engine</h2>
          <p className="text-xs text-slate-500">
            Standardized offline sync between Android mobile exports and website analytics
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 hover:border-cyan-500 transition-colors text-center shadow-xs">
        <input
          type="file"
          id="excelUploadInput"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="excelUploadInput"
          className="flex flex-col items-center justify-center cursor-pointer space-y-3"
        >
          <div className="p-4 bg-cyan-50 text-cyan-600 rounded-full shadow-inner">
            <UploadCloud size={36} />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800 block">
              {file ? file.name : 'Select or drop Android export workbook'}
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              Supports .xlsx, .xls and .csv formats exported from Sree Datta Android app
            </span>
          </div>
          <span className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs">
            <FileSpreadsheet size={16} />
            <span>Browse Spreadsheet File</span>
          </span>
        </label>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="p-6 bg-cyan-50 border border-cyan-200 rounded-xl text-center text-sm font-semibold text-cyan-800 flex items-center justify-center space-x-2">
          <div className="w-5 h-5 border-2 border-cyan-700 border-t-transparent rounded-full animate-spin"></div>
          <span>Analyzing sheets, headers, referential constraints and duplicate IDs...</span>
        </div>
      )}

      {/* Validation Results & Preview */}
      {validationResult && !isProcessing && (
        <div className="space-y-6">
          {/* Summary Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Rows</span>
              <div className="text-2xl font-bold text-slate-800 mt-1">{validationResult.totalRows}</div>
              <span className="text-[11px] text-slate-400">Across {validationResult.totalSheets} worksheets</span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center space-x-1.5 text-emerald-800 text-xs uppercase font-semibold">
                <CheckCircle2 size={16} />
                <span>Valid Records</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">{validationResult.validCount}</div>
              <span className="text-[11px] text-emerald-600">Ready to save into IndexedDB</span>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center space-x-1.5 text-amber-800 text-xs uppercase font-semibold">
                <Copy size={16} />
                <span>Duplicates Skipped</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">{validationResult.duplicateCount}</div>
              <span className="text-[11px] text-amber-600">Existing transaction IDs preserved</span>
            </div>

            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 shadow-xs">
              <div className="flex items-center space-x-1.5 text-rose-800 text-xs uppercase font-semibold">
                <XCircle size={16} />
                <span>Validation Errors</span>
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-1">{validationResult.invalidCount}</div>
              <span className="text-[11px] text-rose-600">Missing fields or malformed data</span>
            </div>
          </div>

          {/* Validation Errors Table (if any) */}
          {validationResult.errors.length > 0 && (
            <div className="bg-white rounded-xl border border-rose-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle size={16} />
                <span>Detailed Row-by-Row Validation Problem Log</span>
              </div>
              <div className="overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Worksheet</th>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Record ID</th>
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Exact Error Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {validationResult.errors.map((err, i) => (
                      <tr key={i} className="hover:bg-rose-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{err.sheet}</td>
                        <td className="py-2 px-3 text-slate-600">{err.rowNumber}</td>
                        <td className="py-2 px-3 text-cyan-800">{err.recordId || '-'}</td>
                        <td className="py-2 px-3 text-rose-700 font-semibold">{err.field}</td>
                        <td className="py-2 px-3 text-slate-700 font-sans">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Ready to Commit to IndexedDB</h4>
              <p className="text-xs text-slate-500">
                Idempotent commit logic prevents duplicate transactions and preserves referential integrity.
              </p>
            </div>

            <button
              onClick={handleCommit}
              disabled={commitStatus === 'SAVING' || validationResult.validCount === 0}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-all"
            >
              <Database size={18} />
              <span>
                {commitStatus === 'SAVING' ? 'Saving to IndexedDB...' : `Commit ${validationResult.validCount} Valid Records`}
              </span>
            </button>
          </div>

          {/* Commit Status Toast */}
          {commitStatus === 'SUCCESS' && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center space-x-3 text-emerald-900 text-sm font-semibold">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <span>{commitMessage}</span>
            </div>
          )}

          {commitStatus === 'ERROR' && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-center space-x-3 text-rose-900 text-sm font-semibold">
              <XCircle size={20} className="text-rose-600 shrink-0" />
              <span>{commitMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
