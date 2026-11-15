import React from 'react';
import { Menu, Bell, Download, Database, ShieldCheck } from 'lucide-react';
import { exportWarehouseToExcel } from '../services/excelService';

interface HeaderProps {
  onOpenSidebar: () => void;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, lowStockCount }) => {
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const name = await exportWarehouseToExcel();
      alert(`Excel export complete! Downloaded: ${name}`);
    } catch (e: any) {
      alert(`Export error: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-slate-800 leading-tight">
            Sree Datta Aqua Chemicals
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Warehouse Management & Business Analytics
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {lowStockCount > 0 && (
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>{lowStockCount} Products Low on Stock</span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center space-x-2 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <Download size={16} />
          <span>{exporting ? 'Exporting...' : 'Export Excel'}</span>
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 text-xs font-semibold text-slate-600">
          <ShieldCheck size={18} className="text-emerald-600" />
          <span className="hidden sm:inline">Offline Local DB</span>
        </div>
      </div>
    </header>
  );
};
