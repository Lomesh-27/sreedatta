import React, { useState, useEffect } from 'react';
import { History, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../db/warehouseDB';
import { ImportHistory } from '@shared/schema';
import { formatDateKolkata } from '@shared/calculations';

export const ImportHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<ImportHistory[]>([]);

  const loadData = async () => {
    const list = await db.import_history.orderBy('importedAt').reverse().toArray();
    setHistory(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Excel Import Audit History</h2>
          <p className="text-xs text-slate-500">
            Immutable log of all spreadsheet imports, file metadata and record absorption counts
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Import ID</th>
                <th className="py-3 px-4">Import Date & Time</th>
                <th className="py-3 px-4">Source Filename</th>
                <th className="py-3 px-4 text-right">Total Rows</th>
                <th className="py-3 px-4 text-right">Valid Saved</th>
                <th className="py-3 px-4 text-right">Duplicates</th>
                <th className="py-3 px-4 text-right">Errors</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-medium text-xs text-slate-500">{item.id}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>{formatDateKolkata(item.importedAt)}</div>
                    <div className="text-[10px] text-slate-400">{item.importedAt.slice(11, 19)}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 flex items-center space-x-2">
                    <FileSpreadsheet size={16} className="text-cyan-700 shrink-0" />
                    <span className="truncate max-w-[200px]">{item.filename}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-700">{item.totalRows}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">+{item.validRows}</td>
                  <td className="py-3 px-4 text-right text-amber-700">{item.duplicateRows}</td>
                  <td className="py-3 px-4 text-right text-rose-700">{item.invalidRows}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No spreadsheet import operations logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
