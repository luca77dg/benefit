
import React from 'react';
import { Spesa, Utente } from '../types';
import { Trash2, Edit2, ShoppingBag, Zap, Fuel } from 'lucide-react';

interface ExpenseListProps {
  spese: Spesa[];
  onDelete: (id: string) => void;
}

const CategoryIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'Spesa': return <ShoppingBag className="w-4 h-4" />;
    case 'Welfare': return <Zap className="w-4 h-4" />;
    case 'Benzina': return <Fuel className="w-4 h-4" />;
    default: return null;
  }
};

export const ExpenseList: React.FC<ExpenseListProps> = ({ spese, onDelete }) => {
  const sortedSpese = [...spese].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utente</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Importo</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Note</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedSpese.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Nessuna spesa registrata.</td>
              </tr>
            ) : (
              sortedSpese.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                    {new Date(s.data).toLocaleDateString('it-IT')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      s.utente === 'Luca' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                    }`}>
                      {s.utente}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <CategoryIcon type={s.tipologia} />
                      {s.tipologia}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                    €{s.importo.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                    {s.note || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button 
                      onClick={() => onDelete(s.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
