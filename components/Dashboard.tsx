
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
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section: Leader */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="flex-1">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 md:mb-3">Leader delle Spese</h3>
            <div className="flex items-center gap-4">
              <span className={`text-4xl md:text-6xl font-black tracking-tighter ${
                stats.leader === 'Luca' ? 'text-blue-600' : 
                stats.leader === 'Federica' ? 'text-pink-600' : 
                'text-slate-700'
              }`}>
                {stats.leader}
              </span>
              {stats.leader !== 'Parità' && (
                <div className={`p-2 rounded-xl md:p-2.5 md:rounded-2xl ${
                  stats.leader === 'Luca' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                } border border-current/10 shadow-sm`}>
                  <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                </div>
              )}
            </div>
            
            <div className="mt-3 md:mt-4">
              {stats.leader === 'Parità' ? (
                <p className="text-slate-500 font-medium text-xs md:text-sm">Le spese sono in equilibrio.</p>
              ) : (
                <p className={`text-[10px] md:text-sm font-bold uppercase tracking-tight ${
                  stats.leader === 'Luca' ? 'text-blue-500' : 'text-pink-500'
                }`}>
                  {stats.leader} ha speso {stats.diff.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € in più
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-slate-50/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 min-w-[180px] md:min-w-[220px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Totale Combinato</p>
            <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">€{stats.total.toFixed(2)}</p>
            <div className="mt-3 w-full bg-slate-200 h-1 rounded-full overflow-hidden flex">
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

      {/* Totals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Luca Card */}
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-4 md:gap-6 group hover:shadow-md transition-all">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <User className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <p className="text-blue-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Luca</p>
            <p className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">€{stats.Luca.toFixed(2)}</p>
          </div>
        </div>

        {/* Federica Card */}
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-4 md:gap-6 group hover:shadow-md transition-all">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center text-pink-600 shadow-sm">
            <User className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <p className="text-pink-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Federica</p>
            <p className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">€{stats.Federica.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
