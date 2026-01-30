
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

    return { ...summary, diff, leader, runnerUp, lucaTot, fedeTot };
  }, [spese, settings]);

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
          <div className="flex-1">
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
            
            <div className="mt-2">
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
          </div>
          
          <div className="bg-slate-50/80 backdrop-blur-sm p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 min-w-[180px] md:min-w-[220px]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Totale Combinato</p>
            <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.total)}</p>
            <div className="mt-3 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-4 md:gap-6 group hover:shadow-md transition-all">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:scale-105">
            <User className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <p className="text-blue-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Luca</p>
            <p className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.lucaTot)}</p>
            {settings.saldiIniziali?.['Luca'] > 0 && (
              <p className="text-[8px] text-slate-400 font-bold uppercase">(Incl. {formatCurrency(settings.saldiIniziali['Luca'])} buoni prec.)</p>
            )}
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-4 md:gap-6 group hover:shadow-md transition-all">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-50 rounded-xl md:rounded-2xl flex items-center justify-center text-pink-600 shadow-sm transition-transform group-hover:scale-105">
            <User className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <p className="text-pink-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">Federica</p>
            <p className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(stats.fedeTot)}</p>
            {settings.saldiIniziali?.['Federica'] > 0 && (
              <p className="text-[8px] text-slate-400 font-bold uppercase">(Incl. {formatCurrency(settings.saldiIniziali['Federica'])} buoni prec.)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
