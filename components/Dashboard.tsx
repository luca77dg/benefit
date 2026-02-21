
import React, { useMemo } from 'react';
import { Spesa, Utente, AppSettings } from '../types';
import { Trophy, User } from 'lucide-react';

interface DashboardProps {
  spese: Spesa[];
  settings: AppSettings;
}

const formatCurrency = (value: number) => {
  // Utilizziamo toLocaleString per garantire il punto come separatore delle migliaia e la virgola per i decimali
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
};

export const Dashboard: React.FC<DashboardProps> = ({ spese, settings }) => {
  const stats = useMemo(() => {
    const summary: Record<string, number> = {
      total: 0
    };

    const currentYear = new Date().getFullYear().toString();
    let yearTotal = 0;

    settings.utenti.forEach(u => {
      const saldoIniziale = settings.saldiIniziali?.[u] || 0;
      summary[u] = saldoIniziale;
      summary.total += saldoIniziale;
    });

    spese.forEach(s => {
      if (summary[s.utente] !== undefined) {
        summary[s.utente] += s.importo;
        summary.total += s.importo;
      }
      if (s.data.startsWith(currentYear)) {
        yearTotal += s.importo;
      }
    });

    let leader: Utente | 'Parità' = 'Parità';
    let maxVal = -1;
    let isTied = false;

    settings.utenti.forEach(u => {
      if (summary[u] > maxVal) {
        maxVal = summary[u];
        leader = u;
        isTied = false;
      } else if (summary[u] === maxVal && maxVal > 0) {
        isTied = true;
      }
    });

    if (isTied) leader = 'Parità';

    const lucaTot = summary['Luca'] || 0;
    const fedeTot = summary['Federica'] || 0;
    const diff = Math.abs(lucaTot - fedeTot);
    const runnerUp = leader === 'Luca' ? 'Federica' : 'Luca';
    const total = summary.total;

    return { ...summary, diff, leader, runnerUp, lucaTot, fedeTot, total, yearTotal, currentYear };
  }, [spese, settings]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Leader delle Spese</h3>
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
            </div>
            
            <div className="text-right flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Totale Combinato</p>
                <p className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.total)}</p>
              </div>
              <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-0.5">Utilizzato nel {stats.currentYear}</p>
                <p className="text-sm md:text-lg font-black text-indigo-600 tracking-tight">{formatCurrency(stats.yearTotal)}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            {stats.leader === 'Parità' ? (
              <p className="text-slate-500 font-medium text-xs md:text-sm">Le spese sono in equilibrio perfetto.</p>
            ) : (
              <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${
                stats.leader === 'Luca' ? 'text-blue-500' : 'text-pink-500'
              }`}>
                {stats.leader} HA SPESO {formatCurrency(stats.diff)} IN PIÙ RISPETTO A {stats.runnerUp}
              </p>
            )}
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
            <div 
              className="bg-blue-500 h-full transition-all duration-1000" 
              style={{ width: `${(stats.lucaTot / (stats.total || 1)) * 100}%` }}
            />
            <div 
              className="bg-pink-500 h-full transition-all duration-1000" 
              style={{ width: `${(stats.fedeTot / (stats.total || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6">
        <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-3 md:gap-6 group hover:shadow-md transition-all">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-105 shrink-0">
            <User className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-blue-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 truncate">Luca</p>
            <p className="text-base md:text-3xl font-black text-slate-800 tracking-tight truncate">{formatCurrency(stats.lucaTot)}</p>
            {(settings.saldiIniziali?.['Luca'] || 0) > 0 && (
              <p className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase truncate">(Incl. {formatCurrency(settings.saldiIniziali?.['Luca'] || 0)})</p>
            )}
          </div>
        </div>

        <div className="bg-white p-3 md:p-6 rounded-2xl md:rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-3 md:gap-6 group hover:shadow-md transition-all">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center text-pink-600 shadow-sm transition-transform group-hover:scale-105 shrink-0">
            <User className="w-5 h-5 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <p className="text-pink-600 text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 truncate">Federica</p>
            <p className="text-base md:text-3xl font-black text-slate-800 tracking-tight truncate">{formatCurrency(stats.fedeTot)}</p>
            {(settings.saldiIniziali?.['Federica'] || 0) > 0 && (
              <p className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase truncate">(Incl. {formatCurrency(settings.saldiIniziali?.['Federica'] || 0)})</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
