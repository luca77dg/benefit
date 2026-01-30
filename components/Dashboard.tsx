
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { Spesa, Utente, Tipologia } from '../types';

interface DashboardProps {
  spese: Spesa[];
}

const COLORS = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b'];
const USER_COLORS: Record<Utente, string> = {
  Luca: '#3b82f6', // blue
  Federica: '#ec4899' // pink
};

export const Dashboard: React.FC<DashboardProps> = ({ spese }) => {
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

  const pieData = [
    { name: 'Luca', value: stats.Luca },
    { name: 'Federica', value: stats.Federica },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-sm font-medium">Spesa Totale</p>
          <p className="text-3xl font-bold text-slate-800">€{stats.total.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
          <p className="text-slate-500 text-sm font-medium">Totale Luca</p>
          <p className="text-3xl font-bold text-blue-600">€{stats.Luca.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-pink-500">
          <p className="text-slate-500 text-sm font-medium">Totale Federica</p>
          <p className="text-3xl font-bold text-pink-600">€{stats.Federica.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comparison Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 text-slate-700">Confronto Categorie</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byUserAndCategory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  formatter={(value: number) => `€${value.toFixed(2)}`}
                />
                <Legend />
                <Bar dataKey="Luca" fill={USER_COLORS.Luca} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Federica" fill={USER_COLORS.Federica} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold mb-6 text-slate-700">Distribuzione Budget</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={USER_COLORS[entry.name as Utente]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `€${value.toFixed(2)}`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
