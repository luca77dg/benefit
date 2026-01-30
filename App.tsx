
import React, { useState, useEffect } from 'react';
import { db } from './services/database';
import { Spesa, NewSpesa } from './types';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { SmartEntry } from './components/SmartEntry';
import { AIAssistant } from './components/AIAssistant';
import { Plus, LayoutDashboard, List, MessageSquareCode, Wallet, ArrowUpRight, Sparkles, Key, AlertCircle, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [spese, setSpese] = useState<Spesa[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'ai'>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const [newExpense, setNewExpense] = useState<NewSpesa>({
    utente: 'Luca',
    tipologia: 'Spesa',
    importo: 0,
    data: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    checkApiKey();
    loadData();
  }, []);

  const checkApiKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Se non siamo nell'ambiente aistudio, assumiamo che la chiave sia presente via env
        setHasKey(true);
      }
    } catch (e) {
      setHasKey(true);
    }
  };

  const handleSelectKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Come da linee guida, procediamo assumendo successo per evitare race conditions
      setHasKey(true);
    } catch (e) {
      alert("Errore nell'apertura del selettore chiavi.");
    }
  };

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
    if (confirm('Eliminare questa spesa?')) {
      await db.deleteSpesa(id);
      await loadData();
    }
  };

  // Schermata di Setup se manca la chiave
  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 text-center">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Key className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Configurazione IA</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Per utilizzare le funzioni intelligenti di <b>BenefitSync</b>, devi collegare il tuo progetto Google Cloud.
          </p>
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 leading-relaxed">
              È richiesto un progetto con <b>Billing abilitato</b>. Consulta la <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-bold">documentazione ufficiale</a> per i dettagli.
            </div>
          </div>

          <button 
            onClick={handleSelectKey}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Seleziona Chiave API <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-24 md:pb-0">
      {/* Sidebar Navigation (Desktop only) */}
      <nav className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col sticky top-0 h-screen z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">BenefitSync</h1>
        </div>

        <div className="flex-1 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <List className="w-4 h-4" /> Spese
          </button>
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <MessageSquareCode className="w-4 h-4" /> Assistente IA
          </button>
        </div>

        <button onClick={() => setIsFormOpen(true)} className="mt-auto bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl">
          <Plus className="w-5 h-5" /> Registra Spesa
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 max-w-6xl mx-auto w-full overflow-x-hidden">
        {/* Brand Header */}
        <div className="mb-8 md:mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-6">
            <div className="relative w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg border border-slate-100">
              <Wallet className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
              <ArrowUpRight className="w-3 h-3 text-emerald-500 absolute top-2 right-2" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900">
                  BenefitSync<span className="text-indigo-600">.</span>
                </h2>
                <span className="hidden xs:flex bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 text-[8px] font-black text-indigo-600 uppercase tracking-widest">IA</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Luca
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div> Federica
                </span>
              </div>
            </div>
          </div>
          
          {/* Mobile Fast Action Button */}
          <button 
            onClick={() => setIsFormOpen(true)}
            className="md:hidden bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100 active:scale-90 transition-transform"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Dynamic View */}
        <div className="pb-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 md:space-y-8">
              <SmartEntry onAdd={handleAddExpense} />
              <Dashboard spese={spese} />
            </div>
          )}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-3 md:p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-xs font-bold text-slate-500">{spese.length} Operazioni</span>
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <ExpenseList spese={spese} onDelete={handleDeleteExpense} />
            </div>
          )}
          {activeTab === 'ai' && (
            <div className="h-[calc(100vh-250px)] md:h-[600px]">
              <AIAssistant spese={spese} />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-6 py-3 flex justify-around items-center z-40 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => setActiveTab('list')} className={`flex flex-col items-center gap-1 ${activeTab === 'list' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <List className="w-6 h-6" />
          <span className="text-[10px] font-bold">Lista</span>
        </button>
        <button onClick={() => setActiveTab('ai')} className={`flex flex-col items-center gap-1 ${activeTab === 'ai' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className="relative">
            <MessageSquareCode className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          </div>
          <span className="text-[10px] font-bold">Chiedi IA</span>
        </button>
      </nav>

      {/* Manual Entry Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-t-[32px] md:rounded-[32px] w-full max-w-md p-8 md:p-10 shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8 md:hidden"></div>
            <h3 className="text-xl md:text-2xl font-black mb-6 text-slate-800 tracking-tight">Nuova Spesa</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddExpense(newExpense); }} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Chi?</label>
                  <select className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none"
                    value={newExpense.utente} onChange={(e) => setNewExpense({...newExpense, utente: e.target.value as any})}>
                    <option value="Luca">Luca</option>
                    <option value="Federica">Federica</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Cosa?</label>
                  <select className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none"
                    value={newExpense.tipologia} onChange={(e) => setNewExpense({...newExpense, tipologia: e.target.value as any})}>
                    <option value="Spesa">Spesa</option>
                    <option value="Welfare">Welfare</option>
                    <option value="Benzina">Benzina</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Importo (€)</label>
                <input type="number" step="0.01" required placeholder="0.00"
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-black text-slate-700 text-3xl outline-none focus:border-indigo-500 transition-all"
                  value={newExpense.importo || ''} onChange={(e) => setNewExpense({...newExpense, importo: parseFloat(e.target.value)})} />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Data</label>
                <input type="date" required
                  className="w-full bg-slate-50 border-2 border-transparent rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  value={newExpense.data} onChange={(e) => setNewExpense({...newExpense, data: e.target.value})} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 p-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                  Chiudi
                </button>
                <button type="submit" className="flex-2 bg-indigo-600 text-white p-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
