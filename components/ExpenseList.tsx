
import React from 'react';
import { Spesa } from '../types';
import { Trash2, ShoppingBag, ShoppingCart, Rocket, Zap, Fuel, Calendar, Pencil, Tag } from 'lucide-react';

interface ExpenseListProps {
  spese: Spesa[];
  onDelete: (id: string) => void;
  onEdit: (spesa: Spesa) => void;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
};

const CategoryIcon = ({ type, className }: { type: string, className?: string }) => {
  const t = type.toLowerCase();
  if (t.includes('spesa') || t.includes('market') || t.includes('cibo') || t.includes('carrello')) {
    return <ShoppingCart className={className} />;
  }
  if (t.includes('welfare') || t.includes('bonus') || t.includes('razzo')) {
    return <Rocket className={className} />;
  }
  if (t.includes('benzina') || t.includes('carburante') || t.includes('fuel')) {
    return <Fuel className={className} />;
  }
  return <Tag className={className} />;
};

export const ExpenseList: React.FC<ExpenseListProps> = ({ spese, onDelete, onEdit }) => {
  const sortedSpese = [...spese].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  if (sortedSpese.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
        <p className="text-slate-400 text-sm font-medium">Ancora nessun movimento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden md:grid grid-cols-5 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <div>Data</div>
        <div>Utente</div>
        <div className="col-span-1">Categoria</div>
        <div className="text-right">Importo</div>
        <div className="text-right pr-4">Azioni</div>
      </div>

      {sortedSpese.map((s) => (
        <div key={s.id} className="bg-white p-4 md:px-6 md:py-4 rounded-2xl md:rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                s.utente === 'Luca' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
              }`}>
                <CategoryIcon type={s.tipologia} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 tracking-tight">{formatCurrency(s.importo)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                    s.utente === 'Luca' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                  }`}>{s.utente}</span>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                    <Calendar className="w-2.5 h-2.5" /> {new Date(s.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase bg-slate-50 px-1.5 py-0.5 rounded">
                    <CategoryIcon type={s.tipologia} className="w-2.5 h-2.5 opacity-60" /> {s.tipologia}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(s)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 active:bg-indigo-50 rounded-full transition-colors"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => onDelete(s.id)} className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-red-500 active:bg-red-50 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="hidden md:grid grid-cols-5 items-center">
            <div className="text-sm text-slate-500 font-medium">{new Date(s.data).toLocaleDateString('it-IT')}</div>
            <div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                s.utente === 'Luca' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
              }`}>
                {s.utente}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700 font-medium col-span-1">
              <CategoryIcon type={s.tipologia} className="w-4 h-4 text-slate-400" />
              {s.tipologia}
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-slate-800">{formatCurrency(s.importo)}</span>
            </div>
            <div className="text-right flex items-center justify-end gap-2 pr-2">
              <button onClick={() => onEdit(s)} className="text-slate-300 hover:text-indigo-600 p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-50 rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(s.id)} className="text-slate-300 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
