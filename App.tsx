
import React, { useState, useEffect } from 'react';
import { db } from './services/database';
import { Spesa, NewSpesa } from './types';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { SmartEntry } from './components/SmartEntry';
import { AIAssistant } from './components/AIAssistant';
import { PlusCircle, LayoutDashboard, List, MessageSquareCode, Wallet } from 'lucide-react';

const App: React.FC = () => {
  const [spese, setSpese] = useState<Spesa[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'ai'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<NewSpesa>({
    utente: 'Luca',
    tipologia: 'Spesa',
    importo: 0,
    data: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await db.getSpese();
    setSpese(data);
  };

  const handleAddExpense = async (expense: NewSpesa) => {
    await db.addSpesa(expense);
    await loadData();
    setIsFormOpen(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa voce?')) {
      await db.deleteSpesa(id);
      await loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 flex flex-col sticky top-0 md:h-screen z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">BenefitSync</h1>
        </div>

        <div className="flex-1 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'list' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <List className="w-4 h-4" /> Spese
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'ai' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <MessageSquareCode className="w-4 h-4" /> Assistente IA
          </button>
        </div>

        <div className="mt-auto pt-6">
          <button
            onClick={() => setIsFormOpen(true)}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <PlusCircle className="w-5 h-5" /> Registra Spesa
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Riepilogo Spese'}
              {activeTab === 'list' && 'Registro Transazioni'}
              {activeTab === 'ai' && 'Analista Gemini IA'}
            </h2>
            <p className="text-slate-500 font-medium">Monitoring per Luca & Federica</p>
          </div>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
            <span className="flex items-center gap-2 text-xs font-bold text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></span> LUCA
            </span>
            <div className="w-px h-4 bg-slate-200"></div>
            <span className="flex items-center gap-2 text-xs font-bold text-pink-600">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm shadow-pink-200"></span> FEDERICA
            </span>
          </div>
        </header>

        {/* Dynamic View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <SmartEntry onAdd={handleAddExpense} />
            <Dashboard spese={spese} />
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-sm font-bold text-slate-600">{spese.length} Movimenti registrati</span>
            </div>
            <ExpenseList spese={spese} onDelete={handleDeleteExpense} />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <AIAssistant spese={spese} />
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MessageSquareCode className="w-5 h-5" /> Suggerimenti AI
                </h4>
                <ul className="text-sm text-indigo-100 space-y-3">
                  <li className="bg-white/10 p-3 rounded-xl border border-white/10">"Chi ha speso di più questo mese?"</li>
                  <li className="bg-white/10 p-3 rounded-xl border border-white/10">"Analizza la spesa benzina di Luca."</li>
                  <li className="bg-white/10 p-3 rounded-xl border border-white/10">"Fai un confronto tra le categorie."</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[32px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
              <h3 className="text-2xl font-black mb-8 text-slate-800 tracking-tight">Nuova Voce Spesa</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAddExpense(newExpense); }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Chi?</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-4 font-bold text-slate-700 focus:border-indigo-500 transition-all outline-none appearance-none"
                      value={newExpense.utente}
                      onChange={(e) => setNewExpense({...newExpense, utente: e.target.value as any})}
                    >
                      <option value="Luca">Luca</option>
                      <option value="Federica">Federica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tipo</label>
                    <select 
                      className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-4 font-bold text-slate-700 focus:border-indigo-500 transition-all outline-none appearance-none"
                      value={newExpense.tipologia}
                      onChange={(e) => setNewExpense({...newExpense, tipologia: e.target.value as any})}
                    >
                      <option value="Spesa">Spesa</option>
                      <option value="Welfare">Welfare</option>
                      <option value="Benzina">Benzina</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Importo (€)</label>
                  <input 
                    type="number" step="0.01" required
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-4 font-bold text-slate-700 text-2xl focus:border-indigo-500 transition-all outline-none"
                    value={newExpense.importo}
                    onChange={(e) => setNewExpense({...newExpense, importo: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Quando?</label>
                  <input 
                    type="date" required
                    className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-4 py-4 font-bold text-slate-700 focus:border-indigo-500 transition-all outline-none"
                    value={newExpense.data}
                    onChange={(e) => setNewExpense({...newExpense, data: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 px-4 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    Annulla
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-4 rounded-2xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    Salva Spesa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
