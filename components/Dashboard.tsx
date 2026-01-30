
import React, { useMemo } from 'react';
import { Spesa, Utente } from '../types';
import { Trophy, TrendingUp, User } from 'lucide-react';

interface DashboardProps {
  spese: Spesa[];
}

export const Dashboard: React.FC<DashboardProps> = ({ spese }) => {
  const stats = useMemo(() => {
    const summary = {
      total: 0,
      Luca: 0,
      Federica: 0,
    };

    spese.forEach(s => {
      summary.total += s.importo;
      summary[s.utente] += s.importo;
    });

    return summary;
  }, [spese]);

  const topSpender: Utente | 'Parità' = stats.Luca > stats.Federica ? 'Luca' : stats.Federica > stats.Luca ? 'Federica' : 'Parità';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section: Chi spende di più */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Leader delle Spese</h3>
            <div className="flex items-center gap-4">
              <span className={`text-5xl font-black ${topSpender === 'Luca' ? 'text-blue-600' : topSpender === 'Federica' ? 'text-pink-600' : 'text-slate-600'}`}>
                {topSpender}
              </span>
              {topSpender !== 'Parità' && (
                <div className={`p-3 rounded-2xl ${topSpender === 'Luca' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'} animate-bounce`}>
                  <Trophy className="w-8 h-8" />
                </div>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-4 max-w-md">
              Attualmente {topSpender === 'Parità' ? 'le spese sono bilanciate perfettamente' : `${topSpender} è in testa con un totale di €${stats[topSpender as Utente].toFixed(2)}`}.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totale Combinato</p>
              <p className="text-2xl font-black text-slate-800">€{stats.total.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <TrendingUp className="absolute -right-8 -bottom-8 w-48 h-48 text-slate-50 opacity-20 pointer-events-none" />
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Luca Summary */}
        <div className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-colors">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-blue-600 text-xs font-black uppercase tracking-widest">Totale Luca</p>
            <p className="text-3xl font-black text-slate-800">€{stats.Luca.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-1">{((stats.Luca / (stats.total || 1)) * 100).toFixed(0)}% del volume totale</p>
          </div>
        </div>

        {/* Federica Summary */}
        <div className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-pink-200 transition-colors">
          <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-all">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-pink-600 text-xs font-black uppercase tracking-widest">Totale Federica</p>
            <p className="text-3xl font-black text-slate-800">€{stats.Federica.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-1">{((stats.Federica / (stats.total || 1)) * 100).toFixed(0)}% del volume totale</p>
          </div>
        </div>
      </div>
    </div>
  );
};
