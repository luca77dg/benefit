
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

    const diff = Math.abs(summary.Luca - summary.Federica);
    const leader: Utente | 'Parità' = summary.Luca > summary.Federica ? 'Luca' : summary.Federica > summary.Luca ? 'Federica' : 'Parità';
    const runnerUp = leader === 'Luca' ? 'Federica' : 'Luca';

    return { ...summary, diff, leader, runnerUp };
  }, [spese]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section: Leader delle Spese */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Leader delle Spese</h3>
            <div className="flex items-center gap-4">
              <span className={`text-6xl font-black tracking-tighter ${
                stats.leader === 'Luca' ? 'text-blue-600' : 
                stats.leader === 'Federica' ? 'text-pink-600' : 
                'text-slate-700'
              }`}>
                {stats.leader}
              </span>
              {stats.leader !== 'Parità' && (
                <div className={`p-2.5 rounded-2xl ${
                  stats.leader === 'Luca' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                } border border-current/10 shadow-sm animate-bounce`}>
                  <Trophy className="w-6 h-6" />
                </div>
              )}
            </div>
            
            <div className="mt-4">
              {stats.leader === 'Parità' ? (
                <p className="text-slate-500 font-medium text-sm">Le spese sono attualmente in perfetto equilibrio.</p>
              ) : (
                <p className={`text-sm font-bold uppercase tracking-tight ${
                  stats.leader === 'Luca' ? 'text-blue-500' : 'text-pink-500'
                }`}>
                  {stats.leader} ha speso {stats.diff.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € in più di {stats.runnerUp}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-slate-50/80 backdrop-blur-sm p-6 rounded-3xl border border-slate-100 min-w-[220px] transition-all hover:shadow-inner">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Totale Combinato</p>
              <p className="text-3xl font-black text-slate-800 tracking-tight">€{stats.total.toFixed(2)}</p>
              <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-500 h-full transition-all duration-1000" 
                  style={{ width: `${(stats.Luca / (stats.total || 1)) * 100}%` }}
                />
                <div 
                  className="bg-pink-500 h-full transition-all duration-1000" 
                  style={{ width: `${(stats.Federica / (stats.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Decorazione di sfondo */}
        <TrendingUp className="absolute -right-12 -bottom-12 w-64 h-64 text-slate-50 opacity-40 pointer-events-none" />
      </div>

      {/* Totals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Luca Summary */}
        <div className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-all hover:shadow-md">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mb-1">Totale Luca</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">€{stats.Luca.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">{((stats.Luca / (stats.total || 1)) * 100).toFixed(0)}% del volume totale</p>
          </div>
        </div>

        {/* Federica Summary */}
        <div className="bg-white p-6 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-6 group hover:border-pink-200 transition-all hover:shadow-md">
          <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-all shadow-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <p className="text-pink-600 text-[10px] font-black uppercase tracking-widest mb-1">Totale Federica</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">€{stats.Federica.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-1 font-medium">{((stats.Federica / (stats.total || 1)) * 100).toFixed(0)}% del volume totale</p>
          </div>
        </div>
      </div>
    </div>
  );
};
