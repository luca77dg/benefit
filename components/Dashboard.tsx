
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Spesa, Utente, Tipologia, Budget } from '../types';
import { Trophy, TrendingUp, Wallet, Settings2, Check } from 'lucide-react';

interface DashboardProps {
  spese: Spesa[];
  budget: Budget;
  onUpdateBudget: (newBudget: Budget) => void;
}

const USER_COLORS: Record<Utente, string> = {
  Luca: '#3b82f6',
  Federica: '#ec4899'
};

export const Dashboard: React.FC<DashboardProps> = ({ spese, budget, onUpdateBudget }) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState<Budget>(budget);

  const stats = useMemo(() => {
    const summary = {
      total: 0,
      Luca: 0,
      Federica: 0,
      categories: {} as Record<Tipologia, number>,
      byUserAndCategory: [
        { name: 'Spesa', Luca: 0, Federica: 0 },
        { name: 'Welfare', Luca: 0, Federica: 0 },
        { name: 'Benzina', Luca: 0, Federica: 0 },
      ]
    };

    spese.forEach(s => {
      summary.total += s.importo;
      summary[s.utente] += s.importo;
      summary.categories[s.tipologia] = (summary.categories[s.tipologia] || 0) + s.importo;
      
      const catIdx = summary.byUserAndCategory.findIndex(c => c.name === s.tipologia);
      if (catIdx !== -1) {
        summary.byUserAndCategory[catIdx][s.utente] += s.importo;
      }
    });

    return summary;
  }, [spese]);

  const topSpender: Utente | 'Parità' = stats.Luca > stats.Federica ? 'Luca' : stats.Federica > stats.Luca ? 'Federica' : 'Parità';

  const handleSaveBudget = () => {
    onUpdateBudget(tempBudget);
    setIsEditingBudget(false);
  };

  const getPercentage = (spent: number, total: number) => {
    if (total === 0) return 0;
    return Math.min(100, (spent / total) * 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Spender & Budget Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Spender Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Chi spende di più?</h3>
            <div className="flex items-end gap-3">
              <span className={`text-3xl font-black ${topSpender === 'Luca' ? 'text-blue-600' : topSpender === 'Federica' ? 'text-pink-600' : 'text-slate-600'}`}>
                {topSpender}
              </span>
              {topSpender !== 'Parità' && <Trophy className={`w-8 h-8 mb-1 ${topSpender === 'Luca' ? 'text-blue-500' : 'text-pink-500'} animate-bounce`} />}
            </div>
            <p className="text-slate-400 text-xs mt-2">Basato sul totale delle spese registrate questo mese.</p>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 opacity-10" />
        </div>

        {/* User Budget Progress Bars */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-700 font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-500" /> Utilizzo Buoni Mensili
            </h3>
            <button 
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="text-slate-400 hover:text-indigo-600 transition-colors p-2"
            >
              {isEditingBudget ? <Check className="w-5 h-5 text-green-500" onClick={handleSaveBudget} /> : <Settings2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="space-y-6">
            {/* Luca Budget */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-blue-600">Luca</span>
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400">€{stats.Luca.toFixed(2)} /</span>
                  {isEditingBudget ? (
                    <input 
                      type="number" 
                      className="w-20 px-2 py-0.5 border rounded text-right font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                      value={tempBudget.Luca}
                      onChange={(e) => setTempBudget({...tempBudget, Luca: parseFloat(e.target.value) || 0})}
                    />
                  ) : (
                    <span className="font-bold text-slate-700">€{budget.Luca}</span>
                  )}
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${getPercentage(stats.Luca, budget.Luca)}%` }}
                />
              </div>
            </div>

            {/* Federica Budget */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-pink-600">Federica</span>
                <div className="flex gap-2 items-center">
                  <span className="text-slate-400">€{stats.Federica.toFixed(2)} /</span>
                  {isEditingBudget ? (
                    <input 
                      type="number" 
                      className="w-20 px-2 py-0.5 border rounded text-right font-bold text-slate-700 outline-none focus:ring-1 focus:ring-pink-500"
                      value={tempBudget.Federica}
                      onChange={(e) => setTempBudget({...tempBudget, Federica: parseFloat(e.target.value) || 0})}
                    />
                  ) : (
                    <span className="font-bold text-slate-700">€{budget.Federica}</span>
                  )}
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 transition-all duration-1000 ease-out" 
                  style={{ width: `${getPercentage(stats.Federica, budget.Federica)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comparison Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 text-slate-700">Analisi Comparativa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byUserAndCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: number) => `€${value.toFixed(2)}`}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Luca" fill={USER_COLORS.Luca} radius={[6, 6, 0, 0]} barSize={40} />
                <Bar dataKey="Federica" fill={USER_COLORS.Federica} radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-semibold mb-6 text-slate-700">Riepilogo Saldi</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div>
                  <p className="text-blue-600 text-xs font-bold uppercase">Residuo Luca</p>
                  <p className="text-2xl font-black text-blue-900">€{(budget.Luca - stats.Luca).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-400 text-xs">Utilizzato</p>
                  <p className="font-bold text-blue-700">{getPercentage(stats.Luca, budget.Luca).toFixed(0)}%</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-xl">
                <div>
                  <p className="text-pink-600 text-xs font-bold uppercase">Residuo Federica</p>
                  <p className="text-2xl font-black text-pink-900">€{(budget.Federica - stats.Federica).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-pink-400 text-xs">Utilizzato</p>
                  <p className="font-bold text-pink-700">{getPercentage(stats.Federica, budget.Federica).toFixed(0)}%</p>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
